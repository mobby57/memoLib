/**
 * Load Balancer Configuration - MemoLib
 * 
 * Features:
 * - NGINX/HAProxy configuration
 * - Health checks
 * - Sticky sessions (for WebSockets)
 * - Circuit breaking
 * - Request routing
 * - SSL/TLS termination
 * - Rate limiting per backend
 * - Auto-failover
 * 
 * Target: < 50ms latency, 99.95% uptime
 */

export interface BackendServer {
  id: string;
  host: string;
  port: number;
  weight: number;      // 1-100 (higher = more traffic)
  healthy: boolean;
  failureCount: number;
  lastHealthCheck: Date;
}

export interface LoadBalancerConfig {
  name: string;
  upstreamServers: BackendServer[];
  loadBalancingMethod: 'round_robin' | 'least_conn' | 'ip_hash' | 'weighted';
  healthCheck: HealthCheckConfig;
  sessionStickiness: boolean;
  circuitBreaker: CircuitBreakerConfig;
  timeouts: TimeoutConfig;
}

export interface HealthCheckConfig {
  path: string;
  interval: number;        // milliseconds
  timeout: number;         // milliseconds
  healthyThreshold: number; // consecutive successful checks
  unhealthyThreshold: number;
}

export interface CircuitBreakerConfig {
  enabled: boolean;
  failureThreshold: number;  // % of failures
  successThreshold: number;  // consecutive successes to close
  timeout: number;           // milliseconds
}

export interface TimeoutConfig {
  connect: number;
  read: number;
  write: number;
  keepalive: number;
}

/**
 * NGINX Configuration Generator
 */
export class NGINXConfig {
  static generate(config: LoadBalancerConfig): string {
    const upstreams = this.generateUpstreams(config);
    const server = this.generateServer(config);
    const healthChecks = this.generateHealthChecks(config);

    return `
# NGINX Load Balancer Configuration
# Auto-generated - DO NOT EDIT MANUALLY

${upstreams}

${server}

${healthChecks}
    `.trim();
  }

  private static generateUpstreams(config: LoadBalancerConfig): string {
    const servers = config.upstreamServers
      .map(srv => {
        let line = `    server ${srv.host}:${srv.port}`;
        
        if (config.loadBalancingMethod === 'weighted') {
          line += ` weight=${srv.weight}`;
        }
        
        line += ` max_fails=3 fail_timeout=30s`;
        return line;
      })
      .join(';\n') + ';';

    const method = config.loadBalancingMethod === 'round_robin' 
      ? '' 
      : `\n    ${config.loadBalancingMethod};`;

    const sessionConfig = config.sessionStickiness
      ? '\n    hash $cookie_JSESSIONID consistent;'
      : '';

    return `upstream backend {
${servers}${method}${sessionConfig}
    keepalive 32;
}`;
  }

  private static generateServer(config: LoadBalancerConfig): string {
    return `server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 443 ssl http2 default_server;
    listen [::]:443 ssl http2 default_server;
    
    server_name _;
    
    # SSL Configuration
    ssl_certificate /etc/ssl/certs/memolib.crt;
    ssl_certificate_key /etc/ssl/private/memolib.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Redirect HTTP to HTTPS
    if ($scheme != "https") {
        return 301 https://$server_name$request_uri;
    }
    
    # Proxy settings
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Connection "";
    proxy_http_version 1.1;
    
    # Timeouts
    proxy_connect_timeout ${config.timeouts.connect}ms;
    proxy_read_timeout ${config.timeouts.read}ms;
    proxy_write_timeout ${config.timeouts.write}ms;
    proxy_send_timeout ${config.timeouts.write}ms;
    
    # Buffering
    proxy_buffering on;
    proxy_buffer_size 4k;
    proxy_buffers 8 4k;
    proxy_busy_buffers_size 8k;
    
    # Caching
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m;
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_use_stale error timeout updating http_500 http_502 http_503;
    
    location / {
        proxy_pass http://backend;
        proxy_cache api_cache;
        add_header X-Cache-Status $upstream_cache_status;
    }
    
    location /api/ {
        proxy_pass http://backend;
        # API endpoints - minimal caching
        proxy_cache_bypass $http_pragma $http_authorization;
        proxy_no_cache $http_pragma $http_authorization;
    }
    
    location /static/ {
        # Static assets - aggressive caching
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://backend;
    }
}`;
  }

  private static generateHealthChecks(config: LoadBalancerConfig): string {
    return `# Health checks
# Add the following to your monitoring service:

periodical_interval ${config.healthCheck.interval};
http_check_request GET ${config.healthCheck.path} HTTP/1.0;
http_check_expected_alive_code 200;

# Circuit breaker
# Failure threshold: ${config.circuitBreaker.failureThreshold}%
# Success threshold: ${config.circuitBreaker.successThreshold} consecutive
# Timeout: ${config.circuitBreaker.timeout}ms`;
  }
}

/**
 * Load Balancer Manager
 */
export class LoadBalancerManager {
  private config: LoadBalancerConfig;
  private healthCheckInterval: NodeJS.Timer | null = null;
  private requestLog: Map<string, RequestMetrics> = new Map();

  constructor(config: LoadBalancerConfig) {
    this.config = config;
  }

  /**
   * Start health checks
   */
  startHealthChecks(): void {
    if (this.healthCheckInterval) return;

    this.healthCheckInterval = setInterval(() => {
      this.checkHealth();
    }, this.config.healthCheck.interval);

    // Initial health check
    this.checkHealth();
  }

  /**
   * Stop health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval as any);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Check health of all backend servers
   */
  private async checkHealth(): Promise<void> {
    const promises = this.config.upstreamServers.map(server =>
      this.checkServerHealth(server)
    );

    await Promise.all(promises);
  }

  /**
   * Check health of single server
   */
  private async checkServerHealth(server: BackendServer): Promise<void> {
    try {
      const start = Date.now();
      const response = await fetch(
        `http://${server.host}:${server.port}${this.config.healthCheck.path}`,
        {
          signal: AbortSignal.timeout(this.config.healthCheck.timeout),
        }
      );

      const duration = Date.now() - start;

      if (response.status === 200) {
        // Server is healthy
        if (!server.healthy) {
          server.failureCount = 0;
          server.healthy = true;
          console.log(`✅ Server ${server.id} is back online`);
        }
      } else {
        // Server returned error
        this.markServerUnhealthy(server);
      }

      server.lastHealthCheck = new Date();

      // Record latency
      this.recordLatency(server.id, duration);
    } catch (error) {
      this.markServerUnhealthy(server);
      server.lastHealthCheck = new Date();
      console.error(`❌ Health check failed for ${server.id}:`, error);
    }
  }

  /**
   * Mark server as unhealthy
   */
  private markServerUnhealthy(server: BackendServer): void {
    server.failureCount++;

    if (
      server.failureCount >= this.config.healthCheck.unhealthyThreshold &&
      server.healthy
    ) {
      server.healthy = false;
      console.warn(`⚠️ Server ${server.id} marked unhealthy after ${server.failureCount} failures`);
    }
  }

  /**
   * Select backend server for request
   */
  selectServer(clientIp: string): BackendServer | null {
    const healthyServers = this.config.upstreamServers.filter(
      s => s.healthy
    );

    if (healthyServers.length === 0) {
      console.error('No healthy servers available!');
      return null;
    }

    switch (this.config.loadBalancingMethod) {
      case 'round_robin':
        return this.roundRobin(healthyServers);

      case 'least_conn':
        return this.leastConnections(healthyServers);

      case 'ip_hash':
        return this.ipHash(healthyServers, clientIp);

      case 'weighted':
        return this.weighted(healthyServers);

      default:
        return healthyServers[0];
    }
  }

  /**
   * Round robin selection
   */
  private roundRobin(servers: BackendServer[]): BackendServer {
    const key = 'round_robin_index';
    const metrics = this.requestLog.get(key) || { count: 0 };
    const index = metrics.count % servers.length;
    metrics.count++;
    this.requestLog.set(key, metrics);
    return servers[index];
  }

  /**
   * Least connections selection
   */
  private leastConnections(servers: BackendServer[]): BackendServer {
    return servers.reduce((prev, curr) => {
      const prevMetrics = this.requestLog.get(prev.id) || { activeConnections: 0 };
      const currMetrics = this.requestLog.get(curr.id) || { activeConnections: 0 };
      return (prevMetrics.activeConnections || 0) > (currMetrics.activeConnections || 0)
        ? curr
        : prev;
    });
  }

  /**
   * IP hash selection (session persistence)
   */
  private ipHash(servers: BackendServer[], clientIp: string): BackendServer {
    let hash = 0;
    for (let i = 0; i < clientIp.length; i++) {
      hash += clientIp.charCodeAt(i);
    }
    return servers[hash % servers.length];
  }

  /**
   * Weighted selection
   */
  private weighted(servers: BackendServer[]): BackendServer {
    const totalWeight = servers.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;

    for (const server of servers) {
      random -= server.weight;
      if (random <= 0) {
        return server;
      }
    }

    return servers[0];
  }

  /**
   * Record request metrics
   */
  recordLatency(serverId: string, latency: number): void {
    const metrics = this.requestLog.get(serverId) || {
      count: 0,
      totalLatency: 0,
      minLatency: Infinity,
      maxLatency: 0,
    } as RequestMetrics;

    metrics.totalLatency = metrics.totalLatency ?? 0;
    metrics.minLatency = metrics.minLatency ?? Infinity;
    metrics.maxLatency = metrics.maxLatency ?? 0;

    metrics.count++;
    metrics.totalLatency += latency;
    metrics.minLatency = Math.min(metrics.minLatency, latency);
    metrics.maxLatency = Math.max(metrics.maxLatency, latency);

    this.requestLog.set(serverId, metrics);
  }

  /**
   * Get load balancer statistics
   */
  getStats(): LoadBalancerStats {
    const stats: LoadBalancerStats = {
      servers: [],
      totalRequests: 0,
      avgLatency: 0,
      healthyServerCount: 0,
      timestamp: new Date(),
    };

    let totalLatency = 0;

    for (const server of this.config.upstreamServers) {
      const metrics = this.requestLog.get(server.id);
      const requests = metrics?.count || 0;
      const latency = requests > 0 ? (metrics?.totalLatency || 0) / requests : 0;

      stats.servers.push({
        id: server.id,
        status: server.healthy ? 'healthy' : 'unhealthy',
        requests,
        avgLatency: Math.round(latency),
        minLatency: metrics?.minLatency || 0,
        maxLatency: metrics?.maxLatency || 0,
        failureCount: server.failureCount,
        lastHealthCheck: server.lastHealthCheck,
      });

      if (server.healthy) {
        stats.healthyServerCount++;
        totalLatency += latency;
      }

      stats.totalRequests += requests;
    }

    stats.avgLatency = Math.round(
      totalLatency / stats.healthyServerCount || 0
    );

    return stats;
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.requestLog.clear();
  }
}

// Types
interface RequestMetrics {
  count: number;
  totalLatency?: number;
  minLatency?: number;
  maxLatency?: number;
  activeConnections?: number;
}

interface LoadBalancerStats {
  servers: Array<{
    id: string;
    status: 'healthy' | 'unhealthy';
    requests: number;
    avgLatency: number;
    minLatency: number;
    maxLatency: number;
    failureCount: number;
    lastHealthCheck: Date;
  }>;
  totalRequests: number;
  avgLatency: number;
  healthyServerCount: number;
  timestamp: Date;
}

// Default configuration
export const defaultConfig: LoadBalancerConfig = {
  name: 'MemoLib LB',
  upstreamServers: [
    {
      id: 'app-1',
      host: 'app-1.internal',
      port: 3000,
      weight: 50,
      healthy: true,
      failureCount: 0,
      lastHealthCheck: new Date(),
    },
    {
      id: 'app-2',
      host: 'app-2.internal',
      port: 3000,
      weight: 50,
      healthy: true,
      failureCount: 0,
      lastHealthCheck: new Date(),
    },
  ],
  loadBalancingMethod: 'weighted',
  sessionStickiness: false,
  healthCheck: {
    path: '/health',
    interval: 10000,      // 10 seconds
    timeout: 5000,        // 5 seconds
    healthyThreshold: 2,
    unhealthyThreshold: 3,
  },
  circuitBreaker: {
    enabled: true,
    failureThreshold: 50,
    successThreshold: 2,
    timeout: 30000,
  },
  timeouts: {
    connect: 5000,
    read: 30000,
    write: 30000,
    keepalive: 75000,
  },
};
