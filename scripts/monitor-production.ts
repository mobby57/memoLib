#!/usr/bin/env tsx
/**
 * Production Monitoring Script
 * TypeScript equivalent of the Python notebook
 */

const BASE_URL = process.env.PRODUCTION_URL || 'http://localhost:3000';

interface HealthCheck {
  status: string;
  http_code?: number;
  response_time_ms?: number;
  error?: string;
  timestamp: string;
}

interface Metrics {
  success_rate: number;
  error_rate: number;
  p99_latency: number;
  p95_latency: number;
  cache_hit_rate: number;
  total_events: number;
  duplicate_rate: number;
}

async function checkHealth(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(10000) });
    return {
      status: res.ok ? '✅ HEALTHY' : '❌ ERROR',
      http_code: res.status,
      response_time_ms: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      status: '❌ API NOT RESPONDING',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

async function getMetrics(): Promise<Metrics | { error: string }> {
  try {
    const res = await fetch(`${BASE_URL}/api/monitoring/metrics-dashboard`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const data = await res.json();
    return {
      success_rate: data.overview?.successRate || 0,
      error_rate: data.overview?.errorCount / (data.overview?.successRate || 1) * 100 || 0,
      p99_latency: data.performancePercentiles?.p99 || 0,
      p95_latency: data.performancePercentiles?.p95 || 0,
      cache_hit_rate: data.cacheMetrics?.hitRate || 0,
      total_events: data.currentStatus?.lastHourMetrics?.totalEvents || 0,
      duplicate_rate: data.currentStatus?.lastHourMetrics?.duplicateRate || 0,
    };
  } catch (error: any) {
    return { error: error.message };
  }
}

async function runSmokeTests() {
  const tests: Record<string, { pass: boolean; code?: number; error?: string }> = {};

  const endpoints = [
    { name: 'health', url: '/api/health', method: 'GET' },
    { name: 'webhook', url: '/api/webhooks/test-multichannel/phase4', method: 'POST', body: { channel: 'EMAIL', sender: { email: 'test@example.com' }, body: 'Test' } },
    { name: 'validation', url: '/api/test/webhook-validation', method: 'POST', body: { channel: 'EMAIL', sender: { email: 'test@example.com' }, body: 'test' } },
    { name: 'metrics', url: '/api/monitoring/metrics-dashboard', method: 'GET' },
  ];

  for (const { name, url, method, body } of endpoints) {
    try {
      const res = await fetch(`${BASE_URL}${url}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(5000),
      });
      tests[name] = { pass: res.ok || res.status === 400, code: res.status };
    } catch {
      tests[name] = { pass: false, error: 'timeout' };
    }
  }

  return tests;
}

async function main() {
  console.log(`\n🔍 Monitoring: ${BASE_URL}`);
  console.log(`📍 Started: ${new Date().toLocaleString()}\n`);

  // Health Check
  console.log('1️⃣ HEALTH CHECK');
  const health = await checkHealth();
  console.log(`Status: ${health.status}`);
  if (health.http_code) console.log(`HTTP: ${health.http_code} | Response: ${health.response_time_ms}ms`);
  else console.log(`Error: ${health.error}`);

  // Metrics
  console.log('\n2️⃣ METRICS');
  const metrics = await getMetrics();
  if ('error' in metrics) {
    console.log(`⚠️  Unavailable: ${metrics.error}`);
  } else {
    console.log(`✅ Success Rate: ${metrics.success_rate.toFixed(2)}%`);
    console.log(`❌ Error Rate: ${metrics.error_rate.toFixed(2)}%`);
    console.log(`⏱️  P99 Latency: ${metrics.p99_latency.toFixed(0)}ms`);
    console.log(`💾 Cache Hit: ${metrics.cache_hit_rate.toFixed(2)}%`);
    console.log(`📈 Events: ${metrics.total_events}`);
  }

  // Smoke Tests
  console.log('\n3️⃣ SMOKE TESTS');
  const tests = await runSmokeTests();
  let passed = 0;
  for (const [name, result] of Object.entries(tests)) {
    const status = result.pass ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${name.toUpperCase()}${result.code ? ` (HTTP ${result.code})` : ''}`);
    if (result.pass) passed++;
  }
  console.log(`\n📊 Tests: ${passed}/${Object.keys(tests).length} passed\n`);
}

main().catch(console.error);
