# 📊 GUIDE MONITORING PRODUCTION - IAPosteManager

**Mise à jour**: 6 février 2026
**Status**: 🟢 Production Ready

---

## 🎯 TABLEAU DE BORD RAPIDE

### Pendant la 1ère Heure de Production

**Ouvrir ces 3 onglets dans le navigateur**:

```
Onglet 1: Sentry Release Health
https://sentry.io/organizations/iapostemanager/releases/

Onglet 2: Metrics Dashboard
https://your-production-url.com/api/monitoring/metrics-dashboard
(Rafraîchir F5 toutes les 30 secondes)

Onglet 3: Platform Dashboard
- Vercel: https://vercel.com/dashboard
- Render: https://dashboard.render.com
```

---

## 📈 MÉTRIQUES CLÉS À SURVEILLER

### 1. Success Rate (Baseline: > 98%)

```
✅ > 98%  = All good, continue monitoring
⚠️  95-98% = Within acceptable range but watch closely
🔴 < 95%  = Investigate, potential issues
❌ < 90%  = ROLLBACK TRIGGERED (automatic)
```

**Où voir**: `/api/monitoring/metrics-dashboard` → `successRate`

### 2. Error Rate (Baseline: < 2%)

```
✅ < 2%   = All good
⚠️  2-5%  = Minor issues, investigate
🔴 > 5%   = CRITICAL, watch the logs
❌ > 10%  = ROLLBACK TRIGGERED (automatic)
```

**Où voir**: `/api/monitoring/metrics-dashboard` → `errorRate`

### 3. P99 Latency (Baseline: < 3000ms)

```
✅ < 2000ms   = Excellent performance
⚠️  2000-3000ms = Good
🔴 3000-5000ms = Check database/cache
❌ > 5000ms    = ROLLBACK TRIGGER (automatic)
```

**Où voir**: `/api/monitoring/metrics-dashboard` → `p99Latency`

### 4. Cache Hit Rate (Target: > 70%)

```
✅ > 70%   = Excellent caching
⚠️  50-70% = Good, opportunity to improve
🔴 < 50%   = Check cache configuration
```

**Où voir**: `/api/monitoring/metrics-dashboard` → `cacheHitRate`

### 5. Database Performance

```
✅ No P1000 errors = Database responsive
✅ Connection pool < 80% = Not near limit
✅ Response time < 50ms = Good performance
🔴 P1000 errors appearing = Database issue
❌ Connection pool > 90% = Scale or investigate
```

**Où voir**: Sentry → Issues → Filter by P1000

### 6. Sentry Release Health

```
✅ Status: Healthy
✅ Crash Rate: 0%
✅ Session Count: Increasing
✅ Error Count: Stable or decreasing

🔴 Status: Unhealthy
❌ Crash Rate: > 1%
❌ Error Count: Increasing rapidly
```

**URL**: https://sentry.io/organizations/iapostemanager/releases/

---

## 🔄 MONITORING TIMELINE

### First 5 Minutes (Immediate Checks)
```
⏱️  0:00-0:30  - Is the deployment live?
                - Can you access https://your-domain.com?
                - Sentry Release created?

⏱️  0:30-1:00 - Success rate stabilized > 95%?
                - Database responding?
                - No flood of errors?

⏱️  1:00-5:00 - Success rate > 98%?
                - Error rate < 3%?
                - P99 latency < 3000ms?
```

**If Any Issues at 5 Min Mark**:
- Check Sentry for error details
- Check database logs for connection issues
- Check application logs for exceptions

### 5-30 Minutes (Trend Check)

```
⏱️  5:00-10:00  - Is success rate trending up or stable?
                 - Are errors decreasing?
                 - Is cache hit rate improving?

⏱️  10:00-20:00 - Performance metrics stable?
                 - No new error types appearing?
                 - Latency percentiles stable?

⏱️  20:00-30:00 - Ready to declare "stable"?
                 - All metrics in green zone?
                 - No critical errors in past 10 minutes?
```

**Commands to Run**:
```powershell
# Check every 5 minutes
$metrics = Invoke-RestMethod https://your-domain.com/api/monitoring/metrics-dashboard
Write-Host "Success: $($metrics.successRate)% | Error: $($metrics.errorRate)% | P99: $($metrics.p99Latency)ms"
```

### 30-60 Minutes (Full Validation)

```
⏱️  30:00-40:00 - All targets sustained?
                 - Success > 98%? ✅
                 - Error < 2%? ✅
                 - Latency < 3000ms? ✅

⏱️  40:00-50:00 - Ready to reduce monitoring frequency?
                 - Can go to 10-minute checks
                 - Still watch Sentry for issues

⏱️  50:00-60:00 - Declare deployment successful?
                 - All metrics in target zone?
                 - Confidence high for production?
```

**At 60 Min Mark - Success Criteria**:
```
✅ Success Rate: > 98% (sustained)
✅ Error Rate: < 2% (stable)
✅ P99 Latency: < 3000ms (consistent)
✅ Cache Hit Rate: > 70% (improving)
✅ Database: Healthy (no errors)
✅ Sentry: Healthy (no crashes)
✅ Zero Critical Errors in past 30 min

IF ALL ✅ → DEPLOYMENT SUCCESSFUL!
Reduce monitoring to hourly checks
```

---

## 🚨 ROLLBACK TRIGGERS (AUTOMATIC)

The system will **automatically rollback** if any of these occur:

### Trigger 1: High Error Rate
```
• Error rate stays > 5% for 5 consecutive minutes
• Action: Auto-rollback to previous version
• Detection time: 5 minutes
• Recovery time: 5-10 minutes total
```

### Trigger 2: High Latency
```
• P99 latency stays > 5000ms for 5 consecutive minutes
• Action: Auto-rollback to previous version
• Detection time: 5 minutes
• Recovery time: 5-10 minutes total
```

### Trigger 3: Database Issues
```
• DB connection failures > 20% for 5 minutes
• Action: Auto-rollback to previous version
• Detection time: 5 minutes
• Recovery time: 5-10 minutes total
```

**If Rollback Happens**:
```
1. You'll see alert in Sentry (Critical)
2. Platform will auto-revert to previous version
3. Wait 5-10 minutes for recovery
4. Check if metrics improve
5. If yes: deployment had issue, investigate
6. If no: previous version also has issue (different problem)
7. Contact team for manual investigation
```

---

## 🔍 HOW TO INVESTIGATE ISSUES

### Issue Type 1: Low Success Rate

```
Steps:
1. Open Sentry → Issues tab
2. Filter by most recent
3. Look for common error patterns
4. Check if same endpoint affected or random
5. If database: check connection pool
6. If API: check rate limiting
7. If validation: check webhook schemas

Common Causes:
• Database connection pool exhausted
• Rate limiter too aggressive
• Invalid webhook format accepted
• Validation schemas too strict
• Missing environment variables

Actions:
• If database: scale up connections
• If rate limit: adjust rate-limit config
• If validation: check Zod schemas
• If env vars: verify all are set correctly
```

### Issue Type 2: High Latency

```
Steps:
1. Open Metrics Dashboard
2. Check latency percentiles (P50, P95, P99)
3. Open Sentry → Performance tab
4. Look for slow database queries
5. Check cache hit rate (if low: issue)
6. Check database query times

Common Causes:
• Database queries slow
• Cache not working
• Retry backoff too aggressive
• Network latency
• Resource exhaustion

Actions:
• Check database slow query log
• Verify cache is enabled
• Check if rate limiter retrying too much
• Scale up resources if needed
```

### Issue Type 3: Database Errors (P1000)

```
Steps:
1. Sentry → Issues → Filter "P1000"
2. Check if connection errors
3. Check database status
4. Verify DATABASE_URL is correct
5. Check connection pool size

Common Causes:
• PostgreSQL service down
• Connection string wrong
• Connection pool exhausted
• Network connectivity issue
• Credentials wrong

Actions:
• Verify PostgreSQL is running
• Check DATABASE_URL in env vars
• Increase pool size if needed
• Restart PostgreSQL if needed
```

---

## 📱 SENTRY DASHBOARD QUICK REFERENCE

**Key Sections**:

```
1. Releases Tab
   → Click "phase6-production"
   → See: Health, Crash Rate, Session Count

2. Issues Tab
   → See error messages
   → Filter by first/last seen
   → Assign to team members

3. Performance Tab
   → Slow transactions
   → Database query times
   → API endpoint times

4. Health Metrics
   → Session count (should increase)
   → Crash rate (should stay 0%)
   → Error rate (should stay < 2%)
```

**Useful Filters**:
```
is:latest                    - Only latest errors
error.values:p1000           - Database connection errors
transaction:webhook          - Webhook processing perf
is:resolv                    - Already resolved issues
environment:production       - Only prod issues
```

---

## 🎯 MONITORING CHECKLIST (PER 5 MIN)

Use this checklist for the first 60 minutes:

```
Every 5 minutes, check:

☐ Success Rate > 95%?
   (Target: > 98%, accept 95%+ first 30 min)

☐ Error Rate < 5%?
   (Target: < 2%, accept < 5% first 30 min)

☐ P99 Latency < 5000ms?
   (Target: < 3000ms, accept < 5000ms first 30 min)

☐ Database OK (no P1000)?
   (Check Sentry for connection errors)

☐ Sentry Health = Healthy?
   (Crash rate 0%, sessions increasing)

☐ No new Critical errors?
   (Should see improvement over time)

If ANY red light:
  → Note the time
  → Check the details
  → After 5 issues, escalate
  → After 10 min of issues, consider rollback

If ALL green:
  → Move to 10-minute checks
  → After 30 min, move to 30-minute checks
  → After 60 min, declare successful!
```

---

## 📊 PERFORMANCE TARGETS

### Immediate (0-5 min)
```
✅ Site accessible (HTTP 200)
✅ Database connected (no errors)
✅ Sentry release active
✅ Errors appearing (normal)
```

### First Hour (0-60 min)
```
✅ Success Rate > 98%
✅ Error Rate < 2%
✅ P99 Latency < 3000ms
✅ Cache Hit Rate > 70%
✅ Database queries < 100ms avg
✅ Zero Critical errors for 10+ min
```

### Production Steady State (24h+)
```
✅ Success Rate > 99% (goal)
✅ Error Rate < 1% (goal)
✅ P99 Latency < 2000ms (goal)
✅ Cache Hit Rate > 80% (goal)
✅ Availability 99.95% (goal)
✅ Zero crashes for 24h+ (goal)
```

---

## 🔧 QUICK COMMANDS

```powershell
# Monitor metrics continuously
$ProgressPreference = 'SilentlyContinue'
while($true) {
  $m = Invoke-RestMethod https://your-domain.com/api/monitoring/metrics-dashboard
  Write-Host "$(Get-Date -Format HH:mm:ss) | Success: $($m.successRate)% | Error: $($m.errorRate)% | P99: $($m.p99Latency)ms" -ForegroundColor Green
  Start-Sleep -Seconds 30
}

# Check deployment status
Invoke-RestMethod https://your-domain.com/api/deployment/final-report | Select-Object status, productionReady

# Test health endpoint
Invoke-WebRequest https://your-domain.com/api/health -UseBasicParsing
```

---

## ✅ SIGN-OFF

Once you confirm all metrics are in target zone for 60 minutes:

```
DEPLOYMENT SIGN-OFF

Date/Time: ________________
Duration: 30-60 minutes
Status: ✅ PRODUCTION READY

Metrics Confirmed:
✅ Success Rate: _____% (> 98%?)
✅ Error Rate: _____% (< 2%?)
✅ P99 Latency: _____ms (< 3000ms?)
✅ Cache Hit Rate: ____% (> 70%?)
✅ Database: Healthy, no P1000 errors
✅ Sentry: Healthy status, 0% crash rate
✅ 60-minute monitoring completed

Signed by: ________________
Timestamp: ________________

DEPLOYMENT SUCCESSFUL! 🎉
```

---

**Next Review**: 24 hours post-deployment
**Status**: 🟢 Production Active
