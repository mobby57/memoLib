# Monitoring Scripts

TypeScript monitoring utilities for MemoLib production deployment.

## Scripts

### `monitor-production.ts`
Single-run monitoring check. Performs health check, metrics collection, and smoke tests.

```bash
npm run monitor:prod
PRODUCTION_URL=https://your-domain.com npm run monitor:prod
```

### `monitor-loop.ts`
Continuous monitoring with configurable intervals.

```bash
# Default: 12 checks every 30s (6 minutes)
npm run monitor:loop

# Custom: 60 checks every 10s (10 minutes)
ITERATIONS=60 INTERVAL=10 npm run monitor:custom
```

## Environment Variables

- `PRODUCTION_URL` - Target URL (default: http://localhost:3000)
- `ITERATIONS` - Number of checks (default: 12)
- `INTERVAL` - Seconds between checks (default: 30)

## Output

```
🔍 Monitoring: http://localhost:3000
📍 Started: 2026-02-06 10:30:00

1️⃣ HEALTH CHECK
Status: ✅ HEALTHY
HTTP: 200 | Response: 45ms

2️⃣ METRICS
✅ Success Rate: 98.50%
❌ Error Rate: 1.50%
⏱️  P99 Latency: 2500ms
💾 Cache Hit: 75.00%
📈 Events: 1234

3️⃣ SMOKE TESTS
✅ PASS - HEALTH (HTTP 200)
✅ PASS - WEBHOOK (HTTP 200)
✅ PASS - VALIDATION (HTTP 200)
✅ PASS - METRICS (HTTP 200)

📊 Tests: 4/4 passed
```

## See Also

- [PRODUCTION_MONITORING_GUIDE.md](../PRODUCTION_MONITORING_GUIDE.md)
- [production-monitoring.ipynb](production-monitoring.ipynb) - Python notebook version
