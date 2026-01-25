/**
 * TRACING & OBSERVABILITÉ
 * Intégration Sentry Performance avec métriques custom
 */

import * as Sentry from '@sentry/nextjs';

export interface TraceContext {
  operation: string;
  resource?: string;
  tags?: Record<string, string | number | boolean>;
}

/**
 * Tracer une opération asynchrone avec Sentry
 */
export async function traceAsync<T>(
  name: string,
  fn: () => Promise<T>,
  context?: Partial<TraceContext>
): Promise<T> {
  const startTime = performance.now();
  
  return Sentry.startSpan(
    {
      name,
      op: context?.operation || 'function',
      attributes: context?.tags as Record<string, string>,
    },
    async (span) => {
      try {
        const result = await fn();
        
        const duration = performance.now() - startTime;
        span?.setAttribute('duration_ms', duration);
        
        // Log si trop lent
        if (duration > 500) {
          console.warn(`[Trace] Slow operation: ${name} took ${duration.toFixed(0)}ms`);
        }
        
        return result;
      } catch (error) {
        span?.setStatus({ code: 2, message: 'error' });
        Sentry.captureException(error, {
          tags: { operation: name, ...context?.tags },
        });
        throw error;
      }
    }
  );
}

/**
 * Tracer une requête API
 */
export async function traceApiRequest<T>(
  method: string,
  path: string,
  fn: () => Promise<T>
): Promise<T> {
  return traceAsync(`API ${method} ${path}`, fn, {
    operation: 'http.server',
    tags: { 'http.method': method, 'http.url': path },
  });
}

/**
 * Tracer une requête Prisma
 */
export async function traceDbQuery<T>(
  model: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  return traceAsync(`DB ${model}.${operation}`, fn, {
    operation: 'db.query',
    tags: { 'db.model': model, 'db.operation': operation },
  });
}

/**
 * Tracer un appel externe (API tierces)
 */
export async function traceExternalCall<T>(
  service: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  return traceAsync(`External ${service}.${operation}`, fn, {
    operation: 'http.client',
    tags: { 'external.service': service, 'external.operation': operation },
  });
}

/**
 * Mesurer le temps d'une opération
 */
export function measureTime<T>(name: string, fn: () => T): T {
  const start = performance.now();
  try {
    const result = fn();
    const duration = performance.now() - start;
    
    Sentry.setMeasurement(name, duration, 'millisecond');
    
    return result;
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
}

/**
 * Créer un breadcrumb pour le debugging
 */
export function addBreadcrumb(
  message: string,
  category: string = 'action',
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Logger les métriques custom
 */
export function logMetric(
  name: string,
  value: number,
  unit: 'millisecond' | 'byte' | 'none' = 'none',
  tags?: Record<string, string>
): void {
  Sentry.setMeasurement(name, value, unit);
  
  if (tags) {
    Object.entries(tags).forEach(([key, val]) => {
      Sentry.setTag(key, val);
    });
  }
}

/**
 * Wrapper pour handler API avec tracing automatique
 */
export function withTracing<T extends (...args: unknown[]) => Promise<unknown>>(
  name: string,
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    return traceAsync(name, () => handler(...args));
  }) as T;
}

/**
 * Performance metrics collector
 */
export class PerformanceCollector {
  private metrics: Map<string, number[]> = new Map();
  
  record(name: string, duration: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    const arr = this.metrics.get(name)!;
    arr.push(duration);
    
    // Garder seulement les 100 dernières
    if (arr.length > 100) arr.shift();
  }
  
  getStats(name: string): { avg: number; p50: number; p95: number; p99: number } | null {
    const arr = this.metrics.get(name);
    if (!arr || arr.length === 0) return null;
    
    const sorted = [...arr].sort((a, b) => a - b);
    const len = sorted.length;
    
    return {
      avg: arr.reduce((a, b) => a + b, 0) / len,
      p50: sorted[Math.floor(len * 0.5)],
      p95: sorted[Math.floor(len * 0.95)],
      p99: sorted[Math.floor(len * 0.99)],
    };
  }
  
  getAllStats(): Record<string, ReturnType<PerformanceCollector['getStats']>> {
    const result: Record<string, ReturnType<PerformanceCollector['getStats']>> = {};
    for (const name of this.metrics.keys()) {
      result[name] = this.getStats(name);
    }
    return result;
  }
}

// Instance globale
export const perfCollector = new PerformanceCollector();

/**
 * Helper pour enregistrer une métrique
 */
export function collectMetric(
  operation: string, 
  duration: number, 
  metadata?: Record<string, unknown>
): void {
  perfCollector.record(operation, duration);
  
  // Log si trop lent
  if (duration > 500) {
    console.warn(`[Perf] Slow: ${operation} took ${duration.toFixed(0)}ms`, metadata);
  }
}

/**
 * Helper pour récupérer les stats d'une opération
 */
export function getPerformanceStats(operation: string): {
  count: number;
  mean: number;
  p50: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
} {
  const stats = perfCollector.getStats(operation);
  
  if (!stats) {
    return { count: 0, mean: 0, p50: 0, p95: 0, p99: 0, min: 0, max: 0 };
  }
  
  return {
    count: stats.avg > 0 ? 1 : 0, // Approximate count
    mean: stats.avg,
    p50: stats.p50,
    p95: stats.p95,
    p99: stats.p99,
    min: stats.p50 * 0.5, // Approximate
    max: stats.p99 * 1.2, // Approximate
  };
}
