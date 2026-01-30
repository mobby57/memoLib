/**
 * Performance Monitoring - MemoLib
 * 
 * Features:
 * - Web Vitals tracking (CLS, FID, LCP, FCP, TTFB)
 * - API response time monitoring
 * - Database query profiling
 * - Memory usage tracking
 * - Error rate monitoring
 * - Custom metrics
 * - Real User Monitoring (RUM)
 * 
 * Performance budgets:
 * - LCP: < 2.5s
 * - FID: < 100ms
 * - CLS: < 0.1
 * - TTFB: < 600ms
 * - API response: < 200ms (p95)
 */

import { prisma } from '@/lib/prisma';

/**
 * Web Vitals Reporter
 */
export class WebVitalsMonitor {
    private static metrics: Map<string, PerformanceMetric> = new Map();

    /**
     * Report Web Vital metric
     */
    static reportWebVital(metric: WebVital): void {
        const { name, value, rating, id } = metric;

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`📊 ${name}:`, {
                value: Math.round(value),
                rating,
                id,
            });
        }

        // Store metric
        this.metrics.set(name, {
            name,
            value,
            rating,
            timestamp: Date.now(),
        });

        // Send to analytics (in production)
        if (process.env.NODE_ENV === 'production') {
            this.sendToAnalytics(metric);
        }

        // Check against budget
        this.checkBudget(name, value);
    }

    /**
     * Check performance budget
     */
    private static checkBudget(name: string, value: number): void {
        const budgets: Record<string, number> = {
            LCP: 2500,  // 2.5s
            FID: 100,   // 100ms
            CLS: 0.1,   // 0.1
            FCP: 1800,  // 1.8s
            TTFB: 600,  // 600ms
        };

        const budget = budgets[name];
        if (budget && value > budget) {
            console.warn(`⚠️ Performance budget exceeded for ${name}:`, {
                value: Math.round(value),
                budget,
                exceeded: Math.round(value - budget),
            });
        }
    }

    /**
     * Send metrics to analytics service
     */
    private static sendToAnalytics(metric: WebVital): void {
        // Send to your analytics service (e.g., Google Analytics, Vercel Analytics)
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', metric.name, {
                value: Math.round(metric.value),
                metric_id: metric.id,
                metric_value: metric.value,
                metric_delta: metric.delta,
            });
        }
    }

    /**
     * Get all metrics
     */
    static getMetrics(): PerformanceMetric[] {
        return Array.from(this.metrics.values());
    }

    /**
     * Get metric by name
     */
    static getMetric(name: string): PerformanceMetric | undefined {
        return this.metrics.get(name);
    }
}

/**
 * API Performance Monitor
 */
export class APIMonitor {
    private static requests: Map<string, APIMetric[]> = new Map();
    private static readonly MAX_HISTORY = 100;

    /**
     * Track API request
     */
    static trackRequest(
        endpoint: string,
        method: string,
        duration: number,
        statusCode: number,
        error?: Error
    ): void {
        const metric: APIMetric = {
            endpoint,
            method,
            duration,
            statusCode,
            error: error?.message,
            timestamp: Date.now(),
        };

        // Store metric
        const key = `${method} ${endpoint}`;
        const history = this.requests.get(key) || [];
        history.push(metric);

        // Keep only recent history
        if (history.length > this.MAX_HISTORY) {
            history.shift();
        }

        this.requests.set(key, history);

        // Log slow requests
        if (duration > 200) {
            console.warn(`🐌 Slow API request (${duration}ms):`, {
                endpoint,
                method,
                statusCode,
            });
        }

        // Log errors
        if (error) {
            console.error('❌ API error:', {
                endpoint,
                method,
                error: error.message,
            });
        }
    }

    /**
     * Get metrics for endpoint
     */
    static getMetrics(endpoint: string, method?: string): APIMetric[] {
        if (method) {
            return this.requests.get(`${method} ${endpoint}`) || [];
        }

        // Get all methods for endpoint
        const allMetrics: APIMetric[] = [];
        for (const [key, metrics] of this.requests.entries()) {
            if (key.includes(endpoint)) {
                allMetrics.push(...metrics);
            }
        }
        return allMetrics;
    }

    /**
     * Get performance summary
     */
    static getSummary(): APISummary {
        const allMetrics: APIMetric[] = [];
        for (const metrics of this.requests.values()) {
            allMetrics.push(...metrics);
        }

        if (allMetrics.length === 0) {
            return {
                totalRequests: 0,
                avgDuration: 0,
                p50: 0,
                p95: 0,
                p99: 0,
                errorRate: 0,
                slowestEndpoints: [],
            };
        }

        const durations = allMetrics.map(m => m.duration).sort((a, b) => a - b);
        const errors = allMetrics.filter(m => m.error || m.statusCode >= 400);

        // Calculate percentiles
        const p50 = durations[Math.floor(durations.length * 0.5)];
        const p95 = durations[Math.floor(durations.length * 0.95)];
        const p99 = durations[Math.floor(durations.length * 0.99)];

        // Get slowest endpoints
        const endpointAvgs = new Map<string, { total: number; count: number }>();
        for (const metric of allMetrics) {
            const key = `${metric.method} ${metric.endpoint}`;
            const existing = endpointAvgs.get(key) || { total: 0, count: 0 };
            existing.total += metric.duration;
            existing.count++;
            endpointAvgs.set(key, existing);
        }

        const slowestEndpoints = Array.from(endpointAvgs.entries())
            .map(([endpoint, stats]) => ({
                endpoint,
                avgDuration: stats.total / stats.count,
                requests: stats.count,
            }))
            .sort((a, b) => b.avgDuration - a.avgDuration)
            .slice(0, 10);

        return {
            totalRequests: allMetrics.length,
            avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
            p50,
            p95,
            p99,
            errorRate: (errors.length / allMetrics.length) * 100,
            slowestEndpoints,
        };
    }
}

/**
 * Database Query Monitor
 */
export class DatabaseMonitor {
    private static queries: QueryMetric[] = [];
    private static readonly MAX_HISTORY = 100;

    /**
     * Track database query
     */
    static trackQuery(
        query: string,
        duration: number,
        rowCount?: number
    ): void {
        const metric: QueryMetric = {
            query: query.substring(0, 200), // Truncate for storage
            duration,
            rowCount,
            timestamp: Date.now(),
        };

        this.queries.push(metric);

        // Keep only recent history
        if (this.queries.length > this.MAX_HISTORY) {
            this.queries.shift();
        }

        // Log slow queries
        if (duration > 100) {
            console.warn(`🐌 Slow database query (${duration}ms):`, {
                query: query.substring(0, 100),
                rowCount,
            });
        }
    }

    /**
     * Get query metrics
     */
    static getMetrics(): QueryMetric[] {
        return [...this.queries];
    }

    /**
     * Get slow queries
     */
    static getSlowQueries(threshold: number = 100): QueryMetric[] {
        return this.queries.filter(q => q.duration > threshold);
    }

    /**
     * Get query summary
     */
    static getSummary(): QuerySummary {
        if (this.queries.length === 0) {
            return {
                totalQueries: 0,
                avgDuration: 0,
                p50: 0,
                p95: 0,
                p99: 0,
                slowQueries: [],
            };
        }

        const durations = this.queries.map(q => q.duration).sort((a, b) => a - b);
        const p50 = durations[Math.floor(durations.length * 0.5)];
        const p95 = durations[Math.floor(durations.length * 0.95)];
        const p99 = durations[Math.floor(durations.length * 0.99)];

        return {
            totalQueries: this.queries.length,
            avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
            p50,
            p95,
            p99,
            slowQueries: this.getSlowQueries().slice(0, 10),
        };
    }
}

/**
 * Memory Monitor
 */
export class MemoryMonitor {
    /**
     * Get memory usage
     */
    static getUsage(): MemoryUsage {
        if (typeof process === 'undefined') {
            return {
                heapUsed: 0,
                heapTotal: 0,
                external: 0,
                rss: 0,
            };
        }

        const usage = process.memoryUsage();
        return {
            heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
            heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
            external: Math.round(usage.external / 1024 / 1024),
            rss: Math.round(usage.rss / 1024 / 1024),
        };
    }

    /**
     * Check memory budget
     */
    static checkBudget(budgetMB: number = 512): boolean {
        const usage = this.getUsage();
        if (usage.heapUsed > budgetMB) {
            console.warn(`⚠️ Memory budget exceeded:`, {
                used: usage.heapUsed,
                budget: budgetMB,
                exceeded: usage.heapUsed - budgetMB,
            });
            return false;
        }
        return true;
    }
}

/**
 * Error Monitor
 */
export class ErrorMonitor {
    private static errors: ErrorMetric[] = [];
    private static readonly MAX_HISTORY = 100;

    /**
     * Track error
     */
    static trackError(
        error: Error,
        context?: {
            userId?: string;
            endpoint?: string;
            action?: string;
        }
    ): void {
        const metric: ErrorMetric = {
            message: error.message,
            stack: error.stack,
            name: error.name,
            context,
            timestamp: Date.now(),
        };

        this.errors.push(metric);

        // Keep only recent history
        if (this.errors.length > this.MAX_HISTORY) {
            this.errors.shift();
        }

        // Log to console
        console.error('❌ Error tracked:', {
            message: error.message,
            context,
        });

        // Send to error tracking service (e.g., Sentry)
        if (process.env.NODE_ENV === 'production') {
            // Sentry.captureException(error, { contexts: { custom: context } });
        }
    }

    /**
     * Get error metrics
     */
    static getMetrics(): ErrorMetric[] {
        return [...this.errors];
    }

    /**
     * Get error rate
     */
    static getErrorRate(windowMinutes: number = 60): number {
        const cutoff = Date.now() - windowMinutes * 60 * 1000;
        const recentErrors = this.errors.filter(e => e.timestamp > cutoff);
        return recentErrors.length;
    }
}

// Types
interface WebVital {
    name: string;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    id: string;
    delta?: number;
}

interface PerformanceMetric {
    name: string;
    value: number;
    rating: string;
    timestamp: number;
}

interface APIMetric {
    endpoint: string;
    method: string;
    duration: number;
    statusCode: number;
    error?: string;
    timestamp: number;
}

interface APISummary {
    totalRequests: number;
    avgDuration: number;
    p50: number;
    p95: number;
    p99: number;
    errorRate: number;
    slowestEndpoints: Array<{
        endpoint: string;
        avgDuration: number;
        requests: number;
    }>;
}

interface QueryMetric {
    query: string;
    duration: number;
    rowCount?: number;
    timestamp: number;
}

interface QuerySummary {
    totalQueries: number;
    avgDuration: number;
    p50: number;
    p95: number;
    p99: number;
    slowQueries: QueryMetric[];
}

interface MemoryUsage {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
}

interface ErrorMetric {
    message: string;
    stack?: string;
    name: string;
    context?: any;
    timestamp: number;
}

// Export monitors
export default {
    WebVitals: WebVitalsMonitor,
    API: APIMonitor,
    Database: DatabaseMonitor,
    Memory: MemoryMonitor,
    Error: ErrorMonitor,
};
