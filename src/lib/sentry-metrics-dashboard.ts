/**
 * Sentry Metrics Dashboard Aggregator
 * Phase 5: Optimisations
 *
 * Aggregates webhook metrics:
 * - Success/Error/Duplicate rates
 * - Performance metrics (duration, throughput)
 * - Channel-specific analytics
 * - Error trends
 * - Rate limit analytics
 */

import * as Sentry from '@sentry/nextjs';

export interface MetricPoint {
  timestamp: Date;
  channel: string;
  duration: number;
  status: 'success' | 'error' | 'duplicate' | 'rate-limited';
  errorCode?: string;
  requestId: string;
}

export interface WebhookMetricsSnapshot {
  timestamp: string;
  timeWindow: string; // e.g., "1h", "24h"
  metrics: {
    totalEvents: number;
    successCount: number;
    errorCount: number;
    duplicateCount: number;
    rateLimitedCount: number;
    successRate: number; // percentage
    errorRate: number;
    duplicateRate: number;
    avgDuration: number;
    p99Duration: number;
    p95Duration: number;
    p50Duration: number;
    minDuration: number;
    maxDuration: number;
    eventsPerSecond: number;
  };
  byChannel: Record<
    string,
    {
      count: number;
      successRate: number;
      avgDuration: number;
      errorRate: number;
    }
  >;
  errorBreakdown: Record<
    string,
    {
      count: number;
      percentage: number;
      lastError: string;
    }
  >;
}

/**
 * In-memory metrics store
 */
class MetricsStore {
  private points: MetricPoint[] = [];
  private maxPoints: number = 10000; // Keep last 10k metrics

  addMetric(point: MetricPoint): void {
    this.points.push(point);

    // Trim if exceeding max size
    if (this.points.length > this.maxPoints) {
      const overflow = this.points.length - this.maxPoints;
      this.points = this.points.slice(overflow);
    }
  }

  getMetrics(
    timeWindowSeconds: number = 3600 // Default 1 hour
  ): WebhookMetricsSnapshot {
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - timeWindowSeconds * 1000);

    // Filter metrics within time window
    const windowMetrics = this.points.filter(p => p.timestamp > cutoffTime);

    if (windowMetrics.length === 0) {
      return this.getEmptySnapshot(timeWindowSeconds);
    }

    // Calculate base metrics
    const totalEvents = windowMetrics.length;
    const successCount = windowMetrics.filter(m => m.status === 'success').length;
    const errorCount = windowMetrics.filter(m => m.status === 'error').length;
    const duplicateCount = windowMetrics.filter(m => m.status === 'duplicate').length;
    const rateLimitedCount = windowMetrics.filter(m => m.status === 'rate-limited').length;

    const successRate = (successCount / totalEvents) * 100;
    const errorRate = (errorCount / totalEvents) * 100;
    const duplicateRate = (duplicateCount / totalEvents) * 100;

    // Duration stats
    const durations = windowMetrics.map(m => m.duration).sort((a, b) => a - b);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const p50Duration = durations[Math.floor(durations.length * 0.5)];
    const p95Duration = durations[Math.floor(durations.length * 0.95)];
    const p99Duration = durations[Math.floor(durations.length * 0.99)];
    const minDuration = durations[0];
    const maxDuration = durations[durations.length - 1];

    // Throughput
    const eventsPerSecond = totalEvents / (timeWindowSeconds / 60);

    // By channel
    const byChannel: Record<string, any> = {};
    const channelMetrics = new Map<
      string,
      { count: number; successCount: number; totalDuration: number; errorCount: number }
    >();

    for (const metric of windowMetrics) {
      const existing = channelMetrics.get(metric.channel) || {
        count: 0,
        successCount: 0,
        totalDuration: 0,
        errorCount: 0,
      };

      existing.count++;
      if (metric.status === 'success') existing.successCount++;
      if (metric.status === 'error') existing.errorCount++;
      existing.totalDuration += metric.duration;

      channelMetrics.set(metric.channel, existing);
    }

    channelMetrics.forEach((stats, channel) => {
      byChannel[channel] = {
        count: stats.count,
        successRate: (stats.successCount / stats.count) * 100,
        avgDuration: Math.round(stats.totalDuration / stats.count),
        errorRate: (stats.errorCount / stats.count) * 100,
      };
    })

    // Error breakdown
    const errorBreakdown: Record<string, any> = {};
    const errorMetrics = windowMetrics.filter(m => m.status === 'error' && m.errorCode);

    const errorCounts = new Map<string, string[]>();
    for (const metric of errorMetrics) {
      if (metric.errorCode) {
        const errors = errorCounts.get(metric.errorCode) || [];
        errors.push(metric.errorCode);
        errorCounts.set(metric.errorCode, errors);
      }
    }

    errorCounts.forEach((occurrences, errorCode) => {
      errorBreakdown[errorCode] = {
        count: occurrences.length,
        percentage: (occurrences.length / errorCount) * 100,
        lastError: errorCode,
      };
    })

    return {
      timestamp: now.toISOString(),
      timeWindow: `${timeWindowSeconds / 3600}h`,
      metrics: {
        totalEvents,
        successCount,
        errorCount,
        duplicateCount,
        rateLimitedCount,
        successRate: Math.round(successRate * 100) / 100,
        errorRate: Math.round(errorRate * 100) / 100,
        duplicateRate: Math.round(duplicateRate * 100) / 100,
        avgDuration: Math.round(avgDuration * 100) / 100,
        p99Duration: Math.round(p99Duration * 100) / 100,
        p95Duration: Math.round(p95Duration * 100) / 100,
        p50Duration: Math.round(p50Duration * 100) / 100,
        minDuration: Math.round(minDuration * 100) / 100,
        maxDuration: Math.round(maxDuration * 100) / 100,
        eventsPerSecond: Math.round(eventsPerSecond * 100) / 100,
      },
      byChannel,
      errorBreakdown,
    };
  }

  private getEmptySnapshot(timeWindowSeconds: number): WebhookMetricsSnapshot {
    return {
      timestamp: new Date().toISOString(),
      timeWindow: `${timeWindowSeconds / 3600}h`,
      metrics: {
        totalEvents: 0,
        successCount: 0,
        errorCount: 0,
        duplicateCount: 0,
        rateLimitedCount: 0,
        successRate: 0,
        errorRate: 0,
        duplicateRate: 0,
        avgDuration: 0,
        p99Duration: 0,
        p95Duration: 0,
        p50Duration: 0,
        minDuration: 0,
        maxDuration: 0,
        eventsPerSecond: 0,
      },
      byChannel: {},
      errorBreakdown: {},
    };
  }

  clear(): void {
    this.points = [];
  }
}

/**
 * Global metrics store instance
 */
export const metricsStore = new MetricsStore();

/**
 * Add metric to global store
 */
export function recordMetric(
  channel: string,
  duration: number,
  status: 'success' | 'error' | 'duplicate' | 'rate-limited',
  errorCode?: string,
  requestId?: string
): void {
  metricsStore.addMetric({
    timestamp: new Date(),
    channel,
    duration,
    status,
    errorCode,
    requestId: requestId || 'unknown',
  });

  // Also report to Sentry
  Sentry.captureException(new Error(`Webhook ${status}`), {
    level: 'info',
    tags: {
      channel,
      status,
      errorCode: errorCode || 'none',
    },
    extra: {
      duration,
      requestId,
    },
  });

  // Report distribution metric to Sentry
  Sentry.captureException(new Error('Metric'), {
    level: 'info',
    tags: {
      metric: 'webhook_duration',
      channel,
    },
  });
}

/**
 * Get metrics snapshot
 */
export function getMetricsSnapshot(timeWindowSeconds: number = 3600): WebhookMetricsSnapshot {
  return metricsStore.getMetrics(timeWindowSeconds);
}

/**
 * Get metrics for specific time windows
 */
export function getMetricsComparison(): {
  lastHour: WebhookMetricsSnapshot;
  last24Hours: WebhookMetricsSnapshot;
  last7Days: WebhookMetricsSnapshot;
} {
  return {
    lastHour: metricsStore.getMetrics(3600),
    last24Hours: metricsStore.getMetrics(86400),
    last7Days: metricsStore.getMetrics(604800),
  };
}

/**
 * Get alert-worthy metrics
 */
export function getAlertsStatus(): {
  alerts: Array<{
    severity: 'critical' | 'warning' | 'info';
    metric: string;
    value: any;
    threshold: any;
  }>;
} {
  const metrics = metricsStore.getMetrics(3600); // Last hour
  const alerts: Array<any> = [];

  // Alert: High error rate (>5%)
  if (metrics.metrics.errorRate > 5) {
    alerts.push({
      severity: 'critical',
      metric: 'error_rate',
      value: `${metrics.metrics.errorRate.toFixed(2)}%`,
      threshold: '5%',
    });
  }

  // Alert: High duplicate rate (>10%)
  if (metrics.metrics.duplicateRate > 10) {
    alerts.push({
      severity: 'warning',
      metric: 'duplicate_rate',
      value: `${metrics.metrics.duplicateRate.toFixed(2)}%`,
      threshold: '10%',
    });
  }

  // Alert: P99 duration too high (>5000ms)
  if (metrics.metrics.p99Duration > 5000) {
    alerts.push({
      severity: 'warning',
      metric: 'p99_duration',
      value: `${metrics.metrics.p99Duration.toFixed(2)}ms`,
      threshold: '5000ms',
    });
  }

  return { alerts };
}

/**
 * Clear all metrics
 */
export function clearMetrics(): void {
  metricsStore.clear();
}
