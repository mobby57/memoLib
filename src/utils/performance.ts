'use client';

import { logger } from '@/lib/logger';

// Utilitaire pour mesurer les performances
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Mesurer le temps d'execution d'une fonction
  measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    const duration = end - start;

    this.recordMetric(name, duration);
    
    if (duration > 16) { // Plus de 16ms = probleme potentiel
      logger.warn('Performance seuil depasse', { operation: name, durationMs: duration.toFixed(2), threshold: 16 });
    }

    return result;
  }

  // Mesurer le temps d'execution d'une fonction async
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const duration = end - start;

    this.recordMetric(name, duration);
    
    if (duration > 100) { // Plus de 100ms pour les operations async
      logger.warn('Performance async seuil depasse', { operation: name, durationMs: duration.toFixed(2), threshold: 100 });
    }

    return result;
  }

  // Enregistrer une metrique
  private recordMetric(name: string, duration: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(duration);
  }

  // Obtenir les statistiques
  getStats(name: string): { avg: number; min: number; max: number; count: number } | null {
    const durations = this.metrics.get(name);
    if (!durations || durations.length === 0) return null;

    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    return { avg, min, max, count: durations.length };
  }

  // Afficher toutes les statistiques
  logAllStats(): void {
    const allStats: any[] = [];
    for (const [name, durations] of this.metrics.entries()) {
      const stats = this.getStats(name);
      if (stats) {
        allStats.push({
          operation: name,
          averageMs: stats.avg.toFixed(2),
          minMs: stats.min.toFixed(2),
          maxMs: stats.max.toFixed(2),
          callCount: stats.count
        });
      }
    }
    logger.info('Statistiques performance', { stats: allStats });
  }

  // Nettoyer les metriques
  clear(): void {
    this.metrics.clear();
  }
}

// Hook pour utiliser le performance monitor
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance();
  
  return {
    measure: monitor.measure.bind(monitor),
    measureAsync: monitor.measureAsync.bind(monitor),
    getStats: monitor.getStats.bind(monitor),
    logAllStats: monitor.logAllStats.bind(monitor),
    clear: monitor.clear.bind(monitor)
  };
}

// Utilitaires Web Vitals
export function measureWebVitals() {
  if (typeof window === 'undefined') return;

  // First Contentful Paint
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        logger.debug('First Contentful Paint', { timeMs: entry.startTime.toFixed(2) });
      }
    }
  });
  
  observer.observe({ entryTypes: ['paint'] });

  // Largest Contentful Paint
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    logger.debug('Largest Contentful Paint', { timeMs: lastEntry.startTime.toFixed(2) });
  });
  
  lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

  // First Input Delay
  const fidObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const perfEntry = entry as any
      if (perfEntry.processingStart) {
        const fid = perfEntry.processingStart - entry.startTime
        logger.debug('First Input Delay', { fidMs: fid.toFixed(2) })
      }
    }
  });
  
  fidObserver.observe({ entryTypes: ['first-input'] });
}
