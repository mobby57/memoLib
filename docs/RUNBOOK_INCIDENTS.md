# RUNBOOK D'INCIDENTS — MemoLib

**Utilisation** : Pendant un incident (temps réel)  
**Format** : Décisions rapides, commandes ready-to-copy-paste  

---

## 🚨 INCIDENT: "SITE DOWN - Users can't login"

### Diagnosis (2 min)

```bash
# 1. Check basic connectivity
curl -I https://memolib.space

# 2. Check health endpoint
curl https://memolib.space/api/health | jq

# 3. Check Sentry for errors
# https://sentry.io → Errors → Latest
# Look for 5xx errors, spike in error rate

# 4. Check Railway dashboard
# https://railway.app → memolib-production → Metrics
# Check: CPU, Memory, Disk, Logs
```

### Decision tree

```
Is site responding?
├─ YES, but slow (> 2s) → Go to "Slow Site" section
├─ NO, getting 5xx error → Go to "5xx Errors" section
└─ NO, getting 502 Bad Gateway → Go to "App Crash" section
```

### CASE A: 5xx Errors

```bash
# 1. Check logs (Sentry or Railway)
# Look for: Database error, Memory error, Auth error

# 2. Check database
curl https://memolib.space/api/admin/health?check=db

# 3. If DB is down → Call SCENARIO 2 (Database Down) in PRA

# 4. If not DB, check what's breaking
# Railway → Logs → Last 50 lines
# Copy error stack trace → Slack #incidents

# 5. Quick fixes
# If Out of Memory:
#   → Railway Dashboard → Restart
# If Recent deploy broke it:
#   → git revert (last commit)
#   → git push main
#   → Wait 3-5 min for redeploy

# 6. If no obvious fix within 10 min → ROLLBACK
git revert HEAD
git push origin main
```

### CASE B: App Crash (502 Bad Gateway)

```bash
# 1. App is down (not responding)
curl https://memolib.space
# Response: 502 Bad Gateway (or connection timeout)

# 2. Restart app
# Option A: Railway Dashboard → Redeploy button
# Option B: Kill process & auto-restart (Railway does this)

# 3. Wait 30 seconds for restart

# 4. Verify
curl https://memolib.space/api/health

# 5. If still down after 2 restarts:
# → Check if recent deployment broke it
# → Rollback (see CASE A)
```

### Done?

- [ ] Site responds
- [ ] Can login with test account
- [ ] Can create dossier
- [ ] No Sentry errors (or < 10)
- [ ] Post-incident report in #outages

---

## 🐌 INCIDENT: "SITE IS SLOW"

### Diagnosis (3 min)

```bash
# 1. Measure latency
curl -w "\nTime: %{time_total}s\n" https://memolib.space/api/dossiers

# 2. Check what's slow
# Sentry → Performance → Transactions → Filter by endpoint
# Look for: API endpoints > 1s, Database queries > 500ms

# 3. Check infrastructure
# Railway → Metrics:
#   - CPU: If > 80%, system is overloaded
#   - Memory: If > 90%, risk of crash
#   - Network: Check in/out throughput
```

### Causes (order of likelihood)

1. **Slow database query** (60%)
2. **Cache miss / Redis down** (20%)
3. **External API slow** (10%)
4. **Too many users** (10%)

### FIX 1: Slow database query

```bash
# 1. Identify slow query
# Neon Dashboard → Monitoring → Query Performance
# Or Sentry → Performance → Slow SQL queries

# 2. Example:
# Query: SELECT * FROM dossier JOIN email ... (slow)
# Reason: Missing index

# 3. Add index (temporary fix)
psql $DATABASE_URL
CREATE INDEX CONCURRENTLY idx_dossier_user_created 
  ON dossier(user_id, created_at DESC);

# 4. Permanent fix (code)
# Add to Prisma schema + migration
# Deploy on next cycle

# 5. Verify
# Sentry → Performance → Check if improved
```

### FIX 2: Cache miss / Redis down

```bash
# 1. Check Redis status
# Upstash Dashboard or CLI:
redis-cli ping

# 2. If down:
# Restart: Upstash Dashboard → Restart
# Or wait (auto-recover)

# 3. If up but miss rate high:
# Strategy: Warm cache before users hit it
# Run: curl https://memolib.space/api/cron/cache-warm
# (Call manually if script doesn't exist)

# 4. Alternative: Disable cache temporarily
# Remove Redis URL from env
# App will use in-memory cache (slower but works)
```

### FIX 3: External API slow

```bash
# 1. Identify which external call is slow
# Sentry → Performance → Filter by tag "external_api"
# Look for: Stripe API, Resend API, Anthropic API

# 2. If Stripe/Resend down:
# Check their status page, nothing you can do
# Implement circuit breaker (skip call if timeout)

# 3. If Anthropic (Claude) slow:
# → Switch to cheaper model (haiku) temporarily
# Or disable IA features temporarily

# Implementation:
# src/lib/ai/client.ts
# Add: if (OUTAGE_MODE) return fallback_response;
```

### Done?

- [ ] API response time < 500ms (p95)
- [ ] No Sentry performance warnings
- [ ] Users report site is fast again
- [ ] Document root cause in Slack

---

## 📧 INCIDENT: "EMAILS NOT ARRIVING"

### Diagnosis (2 min)

```bash
# 1. Check Resend status
curl https://status.resend.com

# 2. Check email queue
# Database:
psql $DATABASE_URL
SELECT COUNT(*) FROM email_queue WHERE status='PENDING';
# If > 100 → Queue backed up

# 3. Check last sent email
SELECT * FROM email_queue 
ORDER BY created_at DESC LIMIT 5;

# 4. Check Sentry for Resend errors
# https://sentry.io → Errors → filter "email"
```

### Quick fix

```bash
# 1. If Resend is down:
# Emails will retry automatically (cron job)
# Manual check:
curl -X POST https://memolib.space/api/cron/email-retry \
  -H "Authorization: Bearer $CRON_SECRET"

# 2. If queue is stuck (> 1000 pending):
# Kill stuck job:
# (via database or manual admin command)
psql $DATABASE_URL -c "UPDATE email_queue SET status='FAILED' 
  WHERE created_at < NOW() - INTERVAL '6 hours' AND status='PENDING';"

# 3. If Resend API key is wrong:
# Check Railway env vars → RESEND_API_KEY
# Verify it hasn't expired or been rotated
```

### Escalation

- If > 1h of failed emails → Notify users
- If > 4h → Switch to secondary email provider (if available)

---

## 🔐 INCIDENT: "SECURITY ALERT - Suspicious Activity"

### Immediate actions (< 5 min)

```bash
# 1. Assess threat level
# Sentry → Security → Recent alerts
# Check: Failed login attempts, unusual API usage, data exfiltration

# 2. If brute force attack (>100 failed logins):
#    → Already mitigated by rate limiting
#    → Monitor but no action needed

# 3. If potential data breach:
#    → Take app offline (emergency maintenance)
#    → Railway Dashboard → Stop deployment
#    → Investigate Sentry logs

# 4. If suspected SQL injection or code exploit:
#    → Immediate rollback to last known-good version
git revert HEAD
git push origin main --force  # ONLY in emergency
#    → Kill all active sessions
psql $DATABASE_URL -c "DELETE FROM sessions;"
```

### Investigation (5-15 min)

```bash
# 1. Check what was accessed
# Audit logs: SELECT * FROM audit_log WHERE timestamp > NOW() - INTERVAL '1 hour';

# 2. Check if data was exfiltrated
# Compare: User count, Dossier count with baseline
# Check: Any exports initiated?

# 3. Identify vector
# Was it: Web vulnerability, API, social engineering, credential leak?

# 4. Containment
# If credentials compromised:
#    → Reset affected user passwords
#    → Revoke API keys
#    → Rotate secrets (ENCRYPTION_MASTER_KEY if needed)

# 5. Eradication
# If code vulnerability:
#    → Fix code
#    → Deploy patch
#    → Scan for similar issues

# 6. Recovery
# If data corrupted:
#    → Restore from backup (Neon PITR)
#    → Verify integrity
```

### Notification

- [ ] Slack #security-incidents (internal only)
- [ ] If PII leaked → Notify CNIL (legal requirement)
- [ ] Pilot users → Only if directly affected
- [ ] Public status page → Only if required

---

## 🗄️ INCIDENT: "Database Connection Error"

### Diagnosis (2 min)

```bash
# 1. Try to connect
psql $DATABASE_URL -c "SELECT 1"

# 2. If fails, check Neon status
# https://console.neon.tech

# 3. Check connection pool usage
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity"
# If > 50 → Pool exhausted
```

### Solutions

```bash
# If pool exhausted:
# 1. Kill idle connections
# Neon Dashboard → Query Monitor → Kill idle

# 2. Restart app (closes all connections)
# Railway → Redeploy

# 3. Increase pool size (temporary)
# Neon Dashboard → Connection Limit (set to 150)

# If storage full:
# Delete old emails:
DELETE FROM email WHERE created_at < '2026-06-01'

# If Neon down:
# Check status page
# Wait or switch to replica (if exists)
```

---

## 🧯 QUICK RESPONSE CHECKLIST

### On any incident alert:

```
⏱️ TIME: _____ (log start time)

[ ] Step 1: Check what's broken (2 min)
    Dashboard / API / Database / Cache / Email?

[ ] Step 2: Assess severity
    P1 (total outage) / P2 (degradation) / P3 (minor)

[ ] Step 3: Notify Slack #alerts-production
    Post: "🔴 Incident: [description] - investigating"

[ ] Step 4: Start fix
    Use relevant section above

[ ] Step 5: Verify resolution
    [ ] API responds
    [ ] No Sentry errors
    [ ] Users can login
    [ ] Users can create dossier

[ ] Step 6: Post-mortem
    [ ] Document in #outage-log
    [ ] Root cause?
    [ ] Prevention?
    [ ] Action item for backlog?

⏱️ RESOLUTION TIME: _____ minutes
```

---

## 📞 ESCALATION CONTACTS

**Slack** : @devops-on-call  
**SMS** : [PHONE]  
**Email** : devops@memolib.space

---

**Last Updated**: 1st September 2026  
**Next Review**: 1st October 2026
