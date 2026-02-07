#!/usr/bin/env tsx
/**
 * Continuous Production Monitoring
 * Runs checks at regular intervals
 */

const BASE_URL = process.env.PRODUCTION_URL || 'http://localhost:3000';
const INTERVAL = parseInt(process.env.INTERVAL || '30') * 1000; // seconds to ms
const ITERATIONS = parseInt(process.env.ITERATIONS || '12');

async function getMetrics() {
  try {
    const res = await fetch(`${BASE_URL}/api/monitoring/metrics-dashboard`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      successRate: data.overview?.successRate || 0,
      errorRate: (data.overview?.errorCount / (data.overview?.successRate || 1)) * 100 || 0,
      p99: data.performancePercentiles?.p99 || 0,
      cacheHit: data.cacheMetrics?.hitRate || 0,
      events: data.currentStatus?.lastHourMetrics?.totalEvents || 0,
    };
  } catch {
    return null;
  }
}

async function monitor() {
  console.log(`🔄 Monitoring ${BASE_URL}`);
  console.log(`⏱️  ${ITERATIONS} checks every ${INTERVAL / 1000}s (${(ITERATIONS * INTERVAL) / 60000} min total)\n`);

  for (let i = 0; i < ITERATIONS; i++) {
    console.log('='.repeat(60));
    console.log(`Check #${i + 1}/${ITERATIONS} - ${new Date().toLocaleTimeString()}`);
    console.log('='.repeat(60));

    const metrics = await getMetrics();
    if (metrics) {
      console.log(`✅ Success: ${metrics.successRate.toFixed(2)}%`);
      console.log(`❌ Error: ${metrics.errorRate.toFixed(2)}%`);
      console.log(`⏱️  P99: ${metrics.p99.toFixed(0)}ms`);
      console.log(`💾 Cache: ${metrics.cacheHit.toFixed(2)}%`);
      console.log(`📈 Events: ${metrics.events}`);
    } else {
      console.log('⚠️  Metrics unavailable');
    }

    if (i < ITERATIONS - 1) {
      console.log(`\n⏳ Next check in ${INTERVAL / 1000}s...\n`);
      await new Promise((resolve) => setTimeout(resolve, INTERVAL));
    }
  }

  console.log('\n✅ Monitoring complete');
}

monitor().catch(console.error);
