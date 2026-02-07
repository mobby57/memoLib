# 📊 Production Monitoring Guide

Quick reference for monitoring MemoLib in production.

## 🚀 Quick Start

```bash
# One-time check
npm run monitor:prod

# Continuous monitoring (12 checks every 30s = 6 minutes)
npm run monitor:loop

# Custom monitoring (60 checks every 10s = 10 minutes)
ITERATIONS=60 INTERVAL=10 npm run monitor:custom

# Monitor specific URL
PRODUCTION_URL=https://your-domain.com npm run monitor:prod
```

## 📋 What Gets Monitored

### 1. Health Check
- API response status
- Response time (ms)
- Timestamp

### 2. Metrics Dashboard
- Success rate (target: >98%)
- Error rate (target: <2%)
- P99 latency (target: <3000ms)
- P95 latency
- Cache hit rate
- Total events
- Duplicate rate

### 3. Smoke Tests
- `/api/health` - Basic health check
- `/api/webhooks/test-multichannel/phase4` - Webhook processing
- `/api/test/webhook-validation` - Validation logic
- `/api/monitoring/metrics-dashboard` - Metrics endpoint

## 🎯 Success Criteria

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Success Rate | >98% | <95% | <90% |
| Error Rate | <2% | >5% | >10% |
| P99 Latency | <3000ms | >5000ms | >10000ms |
| Smoke Tests | 4/4 pass | 3/4 pass | <3 pass |

## 📊 API Endpoints

### Health Check
```bash
GET /api/health
```

### Deployment Status
```bash
GET /api/deployment/final-report
```

### Metrics Dashboard
```bash
GET /api/monitoring/metrics-dashboard
```

### Release Health
```bash
GET /api/monitoring/release-health
```

## 🔄 Continuous Monitoring

The monitoring loop runs checks at regular intervals:

```typescript
// Default: 12 iterations × 30s = 6 minutes
ITERATIONS=12 INTERVAL=30 npm run monitor:loop

// Extended: 60 iterations × 10s = 10 minutes
ITERATIONS=60 INTERVAL=10 npm run monitor:loop

// Quick: 6 iterations × 10s = 1 minute
ITERATIONS=6 INTERVAL=10 npm run monitor:loop
```

## 🚨 Alert Thresholds

### Automatic Rollback Triggers
- Error rate >5% for 5+ minutes
- P99 latency >5000ms for 5+ minutes
- Database connection failures >20%

### Manual Investigation
- Success rate <95%
- Cache hit rate <50%
- Duplicate rate >5%

## 📈 Monitoring Workflow

### After Deployment
1. Wait 2-3 minutes for warmup
2. Run `npm run monitor:prod`
3. Verify all checks pass
4. Start continuous monitoring: `npm run monitor:loop`
5. Monitor for 10-15 minutes
6. Check Sentry dashboard

### During Monitoring
- Watch for error rate spikes
- Monitor latency trends
- Check cache performance
- Verify smoke tests pass

### If Issues Detected
1. Check Sentry for errors
2. Review metrics dashboard
3. Check database health
4. Consider rollback if critical

## 🔗 External Dashboards

- **Sentry**: https://sentry.io/organizations/memolib/
- **Vercel**: https://vercel.com/dashboard
- **Database**: Check your provider dashboard

## 💡 Tips

- Run monitoring from multiple locations
- Compare metrics before/after deployment
- Keep monitoring running for first hour
- Set up alerts in Sentry
- Document any anomalies

## 🛠️ Troubleshooting

### Metrics Unavailable
- Check if API is responding
- Verify production URL is correct
- Check network connectivity

### High Error Rate
- Check Sentry for error details
- Review recent deployments
- Check database connectivity

### High Latency
- Check database performance
- Review cache hit rate
- Check external API calls

## 📝 Environment Variables

```bash
# Required
PRODUCTION_URL=https://your-domain.com

# Optional
INTERVAL=30        # Seconds between checks
ITERATIONS=12      # Number of checks to run
```

---

**See also:**
- [DEPLOYMENT_EXECUTION_CHECKLIST.md](DEPLOYMENT_EXECUTION_CHECKLIST.md)
- [Jupyter Notebook](scripts/production-monitoring.ipynb) - Python version
