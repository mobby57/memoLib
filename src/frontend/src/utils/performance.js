/**
 * Service de monitoring des performances pour IAPosteManager
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.isEnabled = typeof window !== 'undefined' && 'performance' in window;
  }

  /**
   * Démarre la mesure d'une opération
   */
  startMeasure(name) {
    if (!this.isEnabled) return null;
    
    const startTime = performance.now();
    const measureId = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.metrics.set(measureId, {
      name,
      startTime,
      status: 'running'
    });
    
    return measureId;
  }

  /**
   * Termine la mesure d'une opération
   */
  endMeasure(measureId, metadata = {}) {
    if (!this.isEnabled || !measureId) return null;
    
    const measure = this.metrics.get(measureId);
    if (!measure) return null;
    
    const endTime = performance.now();
    const duration = endTime - measure.startTime;
    
    const completedMeasure = {
      ...measure,
      endTime,
      duration,
      status: 'completed',
      metadata
    };
    
    this.metrics.set(measureId, completedMeasure);
    
    // Log des performances lentes
    if (duration > 2000) {
      console.warn(`Slow operation detected: ${measure.name} took ${duration.toFixed(2)}ms`);
    }
    
    return completedMeasure;
  }

  /**
   * Mesure automatique d'une fonction
   */
  measureFunction(name, fn) {
    return async (...args) => {
      const measureId = this.startMeasure(name);
      try {
        const result = await fn(...args);
        this.endMeasure(measureId, { success: true });
        return result;
      } catch (error) {
        this.endMeasure(measureId, { success: false, error: error.message });
        throw error;
      }
    };
  }

  /**
   * Obtient les statistiques de performance
   */
  getStats() {
    const completed = Array.from(this.metrics.values())
      .filter(m => m.status === 'completed');
    
    if (completed.length === 0) return null;
    
    const durations = completed.map(m => m.duration);
    const byName = {};
    
    completed.forEach(measure => {
      if (!byName[measure.name]) {
        byName[measure.name] = [];
      }
      byName[measure.name].push(measure.duration);
    });
    
    const stats = {
      total: completed.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      byOperation: {}
    };
    
    Object.entries(byName).forEach(([name, times]) => {
      stats.byOperation[name] = {
        count: times.length,
        avg: times.reduce((a, b) => a + b, 0) / times.length,
        min: Math.min(...times),
        max: Math.max(...times)
      };
    });
    
    return stats;
  }

  /**
   * Nettoie les anciennes métriques
   */
  cleanup(maxAge = 300000) { // 5 minutes
    const now = Date.now();
    for (const [id, measure] of this.metrics.entries()) {
      if (now - measure.startTime > maxAge) {
        this.metrics.delete(id);
      }
    }
  }
}

const performanceMonitor = new PerformanceMonitor();

// Nettoyage automatique
if (typeof window !== 'undefined') {
  setInterval(() => performanceMonitor.cleanup(), 60000);
}

export { performanceMonitor };
export default performanceMonitor;