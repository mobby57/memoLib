/**
 * Production Monitoring System - MemoLib
 * 
 * Features:
 * - Prometheus metrics collection
 * - Grafana dashboards (5+ dashboards)
 * - Distributed tracing (Jaeger)
 * - Alert rules & notification
 * - Log aggregation (ELK/Loki)
 * - Uptime monitoring
 * - SLA tracking
 * 
 * Target: 99.99% uptime, < 100ms p99 latency, < 1% error rate
 */

export interface MetricConfig {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  help: string;
  labels?: string[];
}

export interface AlertRule {
  name: string;
  query: string;
  threshold: number;
  duration: string;      // e.g., '5m'
  severity: 'warning' | 'critical';
  description: string;
}

export interface Dashboard {
  name: string;
  title: string;
  panels: Panel[];
  refreshInterval: string;
}

export interface Panel {
  title: string;
  type: 'graph' | 'stat' | 'gauge' | 'table';
  query: string;
  unit?: string;
  thresholds?: number[];
}

/**
 * Prometheus Metrics Manager
 */
export class PrometheusMetricsManager {
  private metrics: Map<string, MetricConfig> = new Map();
  private alerts: Map<string, AlertRule> = new Map();

  /**
   * Initialize metrics
   */
  initialize(): void {
    console.log('📊 Initializing Prometheus metrics...');

    // Define application metrics
    this.defineApplicationMetrics();

    // Define infrastructure metrics
    this.defineInfrastructureMetrics();

    // Define business metrics
    this.defineBusinessMetrics();

    console.log(`✅ Registered ${this.metrics.size} metrics`);
  }

  /**
   * Define application metrics
   */
  private defineApplicationMetrics(): void {
    const appMetrics: MetricConfig[] = [
      {
        name: 'http_request_duration_seconds',
        type: 'histogram',
        help: 'HTTP request latency in seconds',
        labels: ['method', 'endpoint', 'status'],
      },
      {
        name: 'http_requests_total',
        type: 'counter',
        help: 'Total HTTP requests',
        labels: ['method', 'endpoint', 'status'],
      },
      {
        name: 'http_request_size_bytes',
        type: 'histogram',
        help: 'HTTP request size in bytes',
        labels: ['method', 'endpoint'],
      },
      {
        name: 'http_response_size_bytes',
        type: 'histogram',
        help: 'HTTP response size in bytes',
        labels: ['method', 'endpoint', 'status'],
      },
      {
        name: 'db_query_duration_seconds',
        type: 'histogram',
        help: 'Database query duration in seconds',
        labels: ['operation', 'table'],
      },
      {
        name: 'db_queries_total',
        type: 'counter',
        help: 'Total database queries',
        labels: ['operation', 'table', 'status'],
      },
      {
        name: 'db_connection_pool_size',
        type: 'gauge',
        help: 'Current database connection pool size',
      },
      {
        name: 'cache_hits_total',
        type: 'counter',
        help: 'Total cache hits',
        labels: ['cache_name'],
      },
      {
        name: 'cache_misses_total',
        type: 'counter',
        help: 'Total cache misses',
        labels: ['cache_name'],
      },
      {
        name: 'queue_messages_total',
        type: 'counter',
        help: 'Total messages processed',
        labels: ['queue_name'],
      },
      {
        name: 'queue_messages_failed_total',
        type: 'counter',
        help: 'Total failed messages',
        labels: ['queue_name'],
      },
      {
        name: 'queue_processing_duration_seconds',
        type: 'histogram',
        help: 'Message processing duration',
        labels: ['queue_name'],
      },
      {
        name: 'api_errors_total',
        type: 'counter',
        help: 'Total API errors',
        labels: ['endpoint', 'error_type'],
      },
      {
        name: 'email_send_duration_seconds',
        type: 'histogram',
        help: 'Email sending duration',
        labels: ['template'],
      },
      {
        name: 'webhook_delivery_duration_seconds',
        type: 'histogram',
        help: 'Webhook delivery duration',
        labels: ['event_type'],
      },
    ];

    for (const metric of appMetrics) {
      this.metrics.set(metric.name, metric);
    }
  }

  /**
   * Define infrastructure metrics
   */
  private defineInfrastructureMetrics(): void {
    const infraMetrics: MetricConfig[] = [
      {
        name: 'node_cpu_usage_percent',
        type: 'gauge',
        help: 'CPU usage percentage',
        labels: ['instance'],
      },
      {
        name: 'node_memory_usage_bytes',
        type: 'gauge',
        help: 'Memory usage in bytes',
        labels: ['instance'],
      },
      {
        name: 'node_disk_usage_bytes',
        type: 'gauge',
        help: 'Disk usage in bytes',
        labels: ['instance', 'device'],
      },
      {
        name: 'node_network_bytes_received_total',
        type: 'counter',
        help: 'Network bytes received',
        labels: ['instance', 'device'],
      },
      {
        name: 'node_network_bytes_sent_total',
        type: 'counter',
        help: 'Network bytes sent',
        labels: ['instance', 'device'],
      },
      {
        name: 'container_restart_count',
        type: 'gauge',
        help: 'Container restart count',
        labels: ['pod_name', 'namespace'],
      },
      {
        name: 'kubernetes_pod_ready',
        type: 'gauge',
        help: 'Pod readiness status',
        labels: ['pod_name', 'namespace'],
      },
      {
        name: 'load_balancer_active_connections',
        type: 'gauge',
        help: 'Active connections at load balancer',
      },
      {
        name: 'region_latency_milliseconds',
        type: 'gauge',
        help: 'Latency to region',
        labels: ['region'],
      },
    ];

    for (const metric of infraMetrics) {
      this.metrics.set(metric.name, metric);
    }
  }

  /**
   * Define business metrics
   */
  private defineBusinessMetrics(): void {
    const bizMetrics: MetricConfig[] = [
      {
        name: 'active_users_total',
        type: 'gauge',
        help: 'Total active users',
      },
      {
        name: 'subscriptions_total',
        type: 'gauge',
        help: 'Total active subscriptions',
        labels: ['tier'],
      },
      {
        name: 'revenue_total_usd',
        type: 'gauge',
        help: 'Total revenue in USD',
      },
      {
        name: 'emails_sent_total',
        type: 'counter',
        help: 'Total emails sent',
      },
      {
        name: 'emails_opened_total',
        type: 'counter',
        help: 'Total emails opened',
      },
      {
        name: 'emails_failed_total',
        type: 'counter',
        help: 'Total failed emails',
      },
      {
        name: 'payments_processed_total',
        type: 'counter',
        help: 'Total payments processed',
        labels: ['status'],
      },
    ];

    for (const metric of bizMetrics) {
      this.metrics.set(metric.name, metric);
    }
  }

  /**
   * Generate Prometheus configuration
   */
  generatePrometheusConfig(): string {
    return `
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    monitor: 'memolib'

alerting:
  alertmanagers:
  - static_configs:
    - targets:
      - alertmanager:9093

rule_files:
  - "alerts.yml"

scrape_configs:
  # Application metrics
  - job_name: 'memolib'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'

  # Node exporter (infrastructure metrics)
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']

  # PostgreSQL exporter
  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']

  # Redis exporter
  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:9121']

  # RabbitMQ exporter
  - job_name: 'rabbitmq'
    static_configs:
      - targets: ['localhost:15692']

  # Kubernetes metrics
  - job_name: 'kubernetes-apiservers'
    kubernetes_sd_configs:
      - role: endpoints
    scheme: https
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    relabel_configs:
      - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
        action: keep
        regex: default;kubernetes;https
    `.trim();
  }

  /**
   * Define alert rules
   */
  defineAlertRules(): void {
    const alerts: AlertRule[] = [
      {
        name: 'HighErrorRate',
        query: 'rate(http_requests_total{status=~"5.."}[5m]) > 0.05',
        threshold: 0.05,
        duration: '5m',
        severity: 'critical',
        description: 'Error rate exceeds 5%',
      },
      {
        name: 'HighLatency',
        query: 'histogram_quantile(0.99, http_request_duration_seconds) > 1',
        threshold: 1,
        duration: '5m',
        severity: 'warning',
        description: 'p99 latency exceeds 1 second',
      },
      {
        name: 'DatabaseDown',
        query: 'up{job="postgres"} == 0',
        threshold: 0,
        duration: '1m',
        severity: 'critical',
        description: 'PostgreSQL database is down',
      },
      {
        name: 'HighCPUUsage',
        query: 'node_cpu_usage_percent > 80',
        threshold: 80,
        duration: '5m',
        severity: 'warning',
        description: 'CPU usage exceeds 80%',
      },
      {
        name: 'HighMemoryUsage',
        query: 'node_memory_usage_bytes / node_memory_total_bytes > 0.85',
        threshold: 0.85,
        duration: '5m',
        severity: 'warning',
        description: 'Memory usage exceeds 85%',
      },
      {
        name: 'HighDiskUsage',
        query: 'node_disk_usage_bytes / node_disk_total_bytes > 0.90',
        threshold: 0.90,
        duration: '10m',
        severity: 'critical',
        description: 'Disk usage exceeds 90%',
      },
      {
        name: 'CacheHitRateLow',
        query: 'cache_hit_ratio < 0.80',
        threshold: 0.80,
        duration: '15m',
        severity: 'warning',
        description: 'Cache hit rate below 80%',
      },
      {
        name: 'ReplicationLagHigh',
        query: 'replication_lag_seconds > 30',
        threshold: 30,
        duration: '2m',
        severity: 'warning',
        description: 'Database replication lag exceeds 30 seconds',
      },
      {
        name: 'QueueBacklog',
        query: 'queue_messages_pending > 10000',
        threshold: 10000,
        duration: '5m',
        severity: 'warning',
        description: 'Message queue has > 10k pending messages',
      },
      {
        name: 'CircuitBreakerOpen',
        query: 'circuit_breaker_state{state="open"} == 1',
        threshold: 1,
        duration: '1m',
        severity: 'critical',
        description: 'Circuit breaker is open',
      },
    ];

    for (const alert of alerts) {
      this.alerts.set(alert.name, alert);
    }
  }

  /**
   * Generate alert rules YAML
   */
  generateAlertRulesYAML(): string {
    this.defineAlertRules();

    let yaml = 'groups:\n  - name: memolib\n    interval: 15s\n    rules:\n';

    for (const alert of this.alerts.values()) {
      yaml += `
    - alert: ${alert.name}
      expr: ${alert.query}
      for: ${alert.duration}
      labels:
        severity: ${alert.severity}
      annotations:
        summary: "${alert.description}"
        description: "{{ $labels.instance }} - ${alert.description}"
`;
    }

    return yaml;
  }

  /**
   * Get all metrics
   */
  getMetrics(): MetricConfig[] {
    return Array.from(this.metrics.values());
  }
}

/**
 * Grafana Dashboard Manager
 */
export class GrafanaDashboardManager {
  private dashboards: Map<string, Dashboard> = new Map();

  /**
   * Create dashboards
   */
  createDashboards(): void {
    console.log('📈 Creating Grafana dashboards...');

    // 1. Overview Dashboard
    this.createOverviewDashboard();

    // 2. Application Performance Dashboard
    this.createApplicationDashboard();

    // 3. Infrastructure Dashboard
    this.createInfrastructureDashboard();

    // 4. Business Metrics Dashboard
    this.createBusinessMetricsDashboard();

    // 5. SLA Tracking Dashboard
    this.createSLADashboard();

    console.log(`✅ Created ${this.dashboards.size} dashboards`);
  }

  /**
   * Create overview dashboard
   */
  private createOverviewDashboard(): void {
    const dashboard: Dashboard = {
      name: 'overview',
      title: 'MemoLib - Overview',
      refreshInterval: '30s',
      panels: [
        {
          title: 'Requests per second',
          type: 'graph',
          query: 'rate(http_requests_total[1m])',
        },
        {
          title: 'Error Rate',
          type: 'stat',
          query: 'rate(http_requests_total{status=~"5.."}[5m])',
          unit: 'percentunit',
          thresholds: [0.01, 0.05],
        },
        {
          title: 'p99 Latency',
          type: 'gauge',
          query: 'histogram_quantile(0.99, http_request_duration_seconds)',
          unit: 's',
          thresholds: [0.5, 1],
        },
        {
          title: 'Active Users',
          type: 'stat',
          query: 'active_users_total',
        },
      ],
    };

    this.dashboards.set('overview', dashboard);
  }

  /**
   * Create application performance dashboard
   */
  private createApplicationDashboard(): void {
    const dashboard: Dashboard = {
      name: 'application',
      title: 'Application Performance',
      refreshInterval: '15s',
      panels: [
        {
          title: 'HTTP Request Duration (p50, p95, p99)',
          type: 'graph',
          query: `
          [
            histogram_quantile(0.50, http_request_duration_seconds),
            histogram_quantile(0.95, http_request_duration_seconds),
            histogram_quantile(0.99, http_request_duration_seconds)
          ]
          `,
        },
        {
          title: 'Database Query Duration',
          type: 'graph',
          query: 'histogram_quantile(0.95, db_query_duration_seconds)',
          unit: 's',
        },
        {
          title: 'Cache Hit Ratio',
          type: 'gauge',
          query: 'cache_hits_total / (cache_hits_total + cache_misses_total)',
          unit: 'percentunit',
          thresholds: [0.80, 0.95],
        },
        {
          title: 'Queue Processing Time',
          type: 'graph',
          query: 'histogram_quantile(0.95, queue_processing_duration_seconds)',
          unit: 's',
        },
      ],
    };

    this.dashboards.set('application', dashboard);
  }

  /**
   * Create infrastructure dashboard
   */
  private createInfrastructureDashboard(): void {
    const dashboard: Dashboard = {
      name: 'infrastructure',
      title: 'Infrastructure Metrics',
      refreshInterval: '30s',
      panels: [
        {
          title: 'CPU Usage by Node',
          type: 'graph',
          query: 'node_cpu_usage_percent',
        },
        {
          title: 'Memory Usage by Node',
          type: 'graph',
          query: 'node_memory_usage_bytes / 1024 / 1024 / 1024',
          unit: 'GB',
        },
        {
          title: 'Disk Usage',
          type: 'gauge',
          query: 'node_disk_usage_bytes / node_disk_total_bytes',
          unit: 'percentunit',
          thresholds: [0.70, 0.90],
        },
        {
          title: 'Network Throughput',
          type: 'graph',
          query: 'rate(node_network_bytes_received_total[1m]) + rate(node_network_bytes_sent_total[1m])',
          unit: 'Bps',
        },
        {
          title: 'Pod Restarts',
          type: 'table',
          query: 'changes(container_restart_count[1h]) > 0',
        },
      ],
    };

    this.dashboards.set('infrastructure', dashboard);
  }

  /**
   * Create business metrics dashboard
   */
  private createBusinessMetricsDashboard(): void {
    const dashboard: Dashboard = {
      name: 'business',
      title: 'Business Metrics',
      refreshInterval: '1m',
      panels: [
        {
          title: 'Active Users',
          type: 'stat',
          query: 'active_users_total',
        },
        {
          title: 'Total Revenue (USD)',
          type: 'stat',
          query: 'revenue_total_usd',
          unit: 'currencyUSD',
        },
        {
          title: 'Subscriptions by Tier',
          type: 'table',
          query: 'subscriptions_total',
        },
        {
          title: 'Email Sent vs Failed',
          type: 'graph',
          query: '[emails_sent_total, emails_failed_total]',
        },
        {
          title: 'Email Open Rate',
          type: 'gauge',
          query: 'emails_opened_total / emails_sent_total',
          unit: 'percentunit',
        },
      ],
    };

    this.dashboards.set('business', dashboard);
  }

  /**
   * Create SLA tracking dashboard
   */
  private createSLADashboard(): void {
    const dashboard: Dashboard = {
      name: 'sla',
      title: 'SLA Tracking',
      refreshInterval: '5m',
      panels: [
        {
          title: 'Uptime %',
          type: 'stat',
          query: '(1 - (rate(up{job="memolib"}[5m])[1d:])) * 100',
          unit: 'percent',
          thresholds: [99, 99.9],
        },
        {
          title: 'Availability Targets',
          type: 'gauge',
          query: 'up{job="memolib"}',
        },
        {
          title: 'Error Budget Consumed',
          type: 'graph',
          query: '(1 - rate(http_requests_total{status!~"5.."}[30d])) * 100',
        },
        {
          title: 'Monthly Downtime',
          type: 'stat',
          query: '(1 - avg(up)) * 30 * 24 * 60',
          unit: 'min',
        },
      ],
    };

    this.dashboards.set('sla', dashboard);
  }

  /**
   * Get all dashboards
   */
  getDashboards(): Dashboard[] {
    return Array.from(this.dashboards.values());
  }
}

/**
 * Jaeger Distributed Tracing
 */
export class JaegerTracingManager {
  /**
   * Initialize Jaeger
   */
  initialize(): void {
    console.log('🔗 Initializing Jaeger distributed tracing...');

    // Configuration for Jaeger collector
    // All services will send traces via OTEL instrumentation
  }

  /**
   * Generate Jaeger configuration
   */
  generateJaegerConfig(): string {
    return `
jaeger:
  samplers:
    type: probabilistic
    param: 0.1  # Sample 10% of requests
  
  reporter_loggers: true
  
  reporter:
    type: grpc
    endpoint: jaeger-collector:14250
    
  processors:
    batch:
      send_batch_size: 512
      timeout: 5s
    `;
  }
}

/**
 * Monitoring statistics
 */
export interface MonitoringStats {
  uptime: number;         // percentage
  errorRate: number;      // percentage
  p99Latency: number;     // milliseconds
  cacheHitRate: number;   // percentage
  activeRequests: number;
  alertsTriggered: number;
}
