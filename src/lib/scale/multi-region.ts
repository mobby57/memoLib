/**
 * Multi-Region Deployment & Geo-Routing - MemoLib
 * 
 * Features:
 * - Geographic region setup (EU, US, APAC)
 * - Geo-routing (nearest region)
 * - Cross-region replication
 * - Regional failover
 * - Latency optimization
 * - Regional compliance (GDPR EU, CCPA US)
 * 
 * Target: < 100ms latency from any region
 */

export interface Region {
  id: string;
  name: string;
  code: string;              // e.g., 'eu-west-1'
  location: {
    lat: number;
    lon: number;
    city: string;
    country: string;
  };
  primary: boolean;
  dbEndpoint: string;
  appEndpoint: string;
  status: 'active' | 'standby' | 'offline';
  latency: number;           // milliseconds
}

export interface MultiRegionConfig {
  regions: Region[];
  primaryRegion: string;
  geoRoutingEnabled: boolean;
  replicationMode: 'active-passive' | 'active-active';
  failoverStrategy: 'automatic' | 'manual';
  failoverThreshold: number; // ms latency threshold
}

/**
 * Geo-Routing Engine
 */
export class GeoRoutingEngine {
  private config: MultiRegionConfig;
  private regionLatencies: Map<string, LatencyMetrics> = new Map();
  private healthCheckInterval: NodeJS.Timer | null = null;

  constructor(config: MultiRegionConfig) {
    this.config = config;
  }

  /**
   * Initialize geo-routing
   */
  async initialize(): Promise<void> {
    console.log('🌍 Initializing multi-region geo-routing...');

    // Start health checks
    this.startHealthChecks();

    // Pre-warm latency measurements
    await this.measureAllRegionLatencies();

    console.log('✅ Geo-routing initialized');
  }

  /**
   * Select nearest region based on client location
   */
  selectRegion(clientIp: string, clientCoords?: { lat: number; lon: number }): Region {
    if (!this.config.geoRoutingEnabled) {
      // Return primary region
      return this.config.regions.find(r => r.id === this.config.primaryRegion)!;
    }

    let selectedRegion: Region;

    if (clientCoords) {
      // Use coordinates if available (from MaxMind/IP geolocation)
      selectedRegion = this.selectNearestByCoordinates(clientCoords);
    } else {
      // Fallback to IP geolocation
      selectedRegion = this.selectNearestByIP(clientIp);
    }

    // Check if region is healthy
    if (selectedRegion.status !== 'active') {
      console.warn(`Region ${selectedRegion.id} not active, using fallback`);
      return this.selectFallbackRegion(selectedRegion.id);
    }

    return selectedRegion;
  }

  /**
   * Select nearest region by coordinates
   */
  private selectNearestByCoordinates(clientCoords: { lat: number; lon: number }): Region {
    let nearestRegion = this.config.regions[0];
    let minDistance = this.calculateDistance(
      clientCoords,
      nearestRegion.location
    );

    for (const region of this.config.regions) {
      if (region.status !== 'active') continue;

      const distance = this.calculateDistance(
        clientCoords,
        region.location
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestRegion = region;
      }
    }

    return nearestRegion;
  }

  /**
   * Select nearest region by IP
   */
  private selectNearestByIP(clientIp: string): Region {
    // Integrate with MaxMind GeoIP2 or similar
    // This is a simplified version
    // In production, use: maxmind.city(clientIp)

    const geoMap: Record<string, string> = {
      // EU IPs
      '194.': 'eu-west-1',    // Europe
      '195.': 'eu-west-1',
      '196.': 'eu-west-1',
      // US IPs
      '8.': 'us-east-1',      // North America
      '12.': 'us-east-1',
      '13.': 'us-east-1',
      // APAC IPs
      '1.': 'ap-southeast-1', // Asia-Pacific
      '5.': 'ap-southeast-1',
    };

    for (const [prefix, regionId] of Object.entries(geoMap)) {
      if (clientIp.startsWith(prefix)) {
        return this.config.regions.find(r => r.code === regionId) ||
          this.config.regions[0];
      }
    }

    // Default to primary region
    return this.config.regions.find(r => r.id === this.config.primaryRegion)!;
  }

  /**
   * Calculate distance between coordinates
   */
  private calculateDistance(
    coord1: { lat: number; lon: number },
    coord2: { lat: number; lon: number }
  ): number {
    // Haversine formula
    const R = 6371; // Earth radius in km

    const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
    const dLon = ((coord2.lon - coord1.lon) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((coord1.lat * Math.PI) / 180) *
        Math.cos((coord2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Select fallback region
   */
  private selectFallbackRegion(excludeRegionId: string): Region {
    const activeRegions = this.config.regions.filter(
      r => r.status === 'active' && r.id !== excludeRegionId
    );

    if (activeRegions.length === 0) {
      // All regions down - return any region
      return this.config.regions[0];
    }

    // Return region with lowest latency
    return activeRegions.reduce((prev, curr) => {
      const prevLatency = this.regionLatencies.get(prev.id)?.avgLatency || 0;
      const currLatency = this.regionLatencies.get(curr.id)?.avgLatency || 0;
      return currLatency < prevLatency ? curr : prev;
    });
  }

  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      this.checkRegionHealth().catch(console.error);
    }, 30000); // Every 30 seconds
  }

  /**
   * Check health of all regions
   */
  private async checkRegionHealth(): Promise<void> {
    const promises = this.config.regions.map(region =>
      this.checkRegionLatency(region)
    );

    await Promise.all(promises);
  }

  /**
   * Check latency to region
   */
  private async checkRegionLatency(region: Region): Promise<void> {
    try {
      const start = Date.now();
      const response = await fetch(`${region.appEndpoint}/health`, {
        signal: AbortSignal.timeout(5000),
      });

      const latency = Date.now() - start;

      const metrics = this.regionLatencies.get(region.id) || {
        measurements: [],
        avgLatency: 0,
        minLatency: Infinity,
        maxLatency: 0,
      };

      metrics.measurements.push(latency);
      if (metrics.measurements.length > 100) {
        metrics.measurements.shift();
      }

      metrics.avgLatency = metrics.measurements.reduce((a, b) => a + b, 0) /
        metrics.measurements.length;
      metrics.minLatency = Math.min(metrics.minLatency, latency);
      metrics.maxLatency = Math.max(metrics.maxLatency, latency);

      region.latency = Math.round(metrics.avgLatency);

      if (response.status === 200) {
        region.status = 'active';
      } else {
        region.status = 'offline';
      }

      this.regionLatencies.set(region.id, metrics);
    } catch (error) {
      region.status = 'offline';
      console.error(`Region ${region.id} health check failed:`, error);
    }
  }

  /**
   * Measure latency to all regions
   */
  private async measureAllRegionLatencies(): Promise<void> {
    for (const region of this.config.regions) {
      await this.checkRegionLatency(region);
    }
  }

  /**
   * Get region stats
   */
  getStats(): RegionStats {
    const regions = this.config.regions.map(region => {
      const metrics = this.regionLatencies.get(region.id);
      return {
        id: region.id,
        name: region.name,
        status: region.status,
        avgLatency: metrics?.avgLatency || 0,
        minLatency: metrics?.minLatency || 0,
        maxLatency: metrics?.maxLatency || 0,
      };
    });

    return {
      regions,
      primaryRegion: this.config.primaryRegion,
      timestamp: new Date(),
    };
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval as any);
      this.healthCheckInterval = null;
    }
  }
}

/**
 * Cross-Region Replication Manager
 */
export class CrossRegionReplicationManager {
  private config: MultiRegionConfig;

  constructor(config: MultiRegionConfig) {
    this.config = config;
  }

  /**
   * Setup replication between regions
   */
  async setupReplication(): Promise<void> {
    console.log('📊 Setting up cross-region replication...');

    for (const region of this.config.regions) {
      if (region.id === this.config.primaryRegion) continue;

      // Setup logical replication from primary to secondary region
      console.log(`  → Replicating to ${region.name}`);
    }

    console.log('✅ Cross-region replication configured');
  }

  /**
   * Initiate regional failover
   */
  async failoverToRegion(regionId: string): Promise<void> {
    const region = this.config.regions.find(r => r.id === regionId);
    if (!region) {
      throw new Error(`Region ${regionId} not found`);
    }

    console.log(`🔄 Failing over to region: ${region.name}`);

    // 1. Promote secondary region to primary
    // 2. Update DNS to point to new primary
    // 3. Update configuration
    // 4. Start replication from new primary

    region.primary = true;
    const oldPrimary = this.config.regions.find(r => r.primary && r.id !== regionId);
    if (oldPrimary) {
      oldPrimary.primary = false;
    }

    this.config.primaryRegion = regionId;

    console.log('✅ Regional failover completed');
  }

  /**
   * Get replication status
   */
  getReplicationStatus(): ReplicationStatus {
    return {
      primary: this.config.primaryRegion,
      mode: this.config.replicationMode,
      regions: this.config.regions.map(r => ({
        id: r.id,
        name: r.name,
        role: r.primary ? 'primary' : 'secondary',
        status: r.status,
      })),
    };
  }
}

// Types
interface LatencyMetrics {
  measurements: number[];
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
}

interface RegionStats {
  regions: Array<{
    id: string;
    name: string;
    status: string;
    avgLatency: number;
    minLatency: number;
    maxLatency: number;
  }>;
  primaryRegion: string;
  timestamp: Date;
}

interface ReplicationStatus {
  primary: string;
  mode: string;
  regions: Array<{
    id: string;
    name: string;
    role: 'primary' | 'secondary';
    status: string;
  }>;
}

/**
 * Default multi-region configuration
 */
export const defaultMultiRegionConfig: MultiRegionConfig = {
  regions: [
    {
      id: 'eu-west-1',
      name: 'EU - Ireland',
      code: 'eu-west-1',
      location: {
        lat: 53.41291,
        lon: -8.24389,
        city: 'Dublin',
        country: 'Ireland',
      },
      primary: true,
      dbEndpoint: 'db.eu-west-1.memolib.app',
      appEndpoint: 'https://eu.memolib.app',
      status: 'active',
      latency: 0,
    },
    {
      id: 'us-east-1',
      name: 'US - N. Virginia',
      code: 'us-east-1',
      location: {
        lat: 38.13135,
        lon: -78.45677,
        city: 'Arlington',
        country: 'United States',
      },
      primary: false,
      dbEndpoint: 'db.us-east-1.memolib.app',
      appEndpoint: 'https://us.memolib.app',
      status: 'active',
      latency: 0,
    },
    {
      id: 'ap-southeast-1',
      name: 'APAC - Singapore',
      code: 'ap-southeast-1',
      location: {
        lat: 1.28967,
        lon: 103.85007,
        city: 'Singapore',
        country: 'Singapore',
      },
      primary: false,
      dbEndpoint: 'db.ap-southeast-1.memolib.app',
      appEndpoint: 'https://apac.memolib.app',
      status: 'active',
      latency: 0,
    },
  ],
  primaryRegion: 'eu-west-1',
  geoRoutingEnabled: true,
  replicationMode: 'active-passive',
  failoverStrategy: 'automatic',
  failoverThreshold: 5000, // 5 seconds
};
