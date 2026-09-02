# PLAN DE REPRISE D'ACTIVITÉ (PRA) — MemoLib

**Version** : 1.0  
**Date effective** : 1er octobre 2026  
**Responsable** : Tech Lead  
**Dernière revue** : 1er septembre 2026  

---

## 🎯 OBJECTIFS

| Métrique | Cible | Justification |
|----------|-------|---------------|
| **RTO** (Recovery Time Objective) | 30 minutes | Avocats ne peuvent pas attendre > 30 min |
| **RPO** (Recovery Point Objective) | 15 minutes | Acceptable de perdre 15 min d'emails |
| **Availability cible** | 99.5% | 3.6h outage/mois acceptable |

---

## 📋 SCÉNARIOS COUVERTS

| # | Scénario | Probabilité | Impact | Couvert |
|---|----------|-------------|--------|---------|
| 1 | Application crash (Railway) | 🔴 Élevée | Total | ✅ |
| 2 | Database down (Neon) | 🔴 Moyen | Total | ✅ |
| 3 | Cache crash (Redis) | 🟠 Faible | Dégradation | ✅ |
| 4 | Email service down (Resend) | 🟠 Faible | Retard emails | ✅ |
| 5 | Cyberattaque / Data breach | 🟡 Très rare | Total | ⏳ Phase 2 |
| 6 | Disk full | 🟡 Rare | Dégradation | ✅ |

---

## 🔴 SCÉNARIO 1: APPLICATION CRASH (Railway)

### Diagnostic (5 min)

**Indice** : Utilisateurs rapportent "page ne charge pas"

```bash
# Check 1: Railway status
curl https://railway.app/status
# ou Dashboard: https://railway.app → memolib-production

# Check 2: Endpoint health
curl https://memolib.space/api/health
# Expected: HTTP 200 + {"status": "healthy"}

# Check 3: DNS
nslookup memolib.space
# Expected: Points to Railway IP
```

### Causes possibles (ordre probabilité)

A. **Déploiement échoué** (60%) → Voir trace CI/CD
B. **Service arrêté** (20%) → Railway restart needed  
C. **Out of memory** (10%) → Restart cache
D. **Bug nouveau** (10%) → Rollback

### Actions de récupération

#### IF Déploiement échoué :

```bash
# 1. Check GitHub Actions
# https://github.com/[user]/memoLib/actions

# 2. Check last commit
git log -1 --oneline

# 3. If recent commit broke it, rollback
git revert <commit-hash>
git push origin main
# Railway auto-redeploys

# 4. Verify
curl https://memolib.space/api/health

# Duration: 5-10 min
```

#### IF Service arrêté :

```bash
# 1. Railway Dashboard → memolib-production
# 2. Click "Redeploy"
# 3. Wait for green status
# 4. Verify: curl https://memolib.space/api/health

# Duration: 3-5 min
```

#### IF Out of memory :

```bash
# 1. Railway Dashboard → Metrics → Memory
# 2. If > 95%: Restart service
# 3. Identify memory leak:
#    - Check Sentry for errors
#    - Look for query loops
#    - Check Redis connection pool

# 4. Temporary fix: Increase memory quota (+$x)
# 5. Permanent fix: Debug in code

# Duration: 10-15 min
```

### Verification

- [ ] curl https://memolib.space/api/health → 200 OK
- [ ] Dashboard loads
- [ ] Create test dossier → Success
- [ ] Sentry errors < 10

### Escalation

- If > 5 min down : Page on-call
- If > 15 min down : Notify pilot users (Slack message)

---

## 🔴 SCÉNARIO 2: DATABASE DOWN (Neon)

### Diagnostic (5 min)

**Indice** : "Error connecting to database" in Sentry

```bash
# Check 1: Neon status
curl https://status.neon.tech
# or Dashboard: https://console.neon.tech

# Check 2: Connection test
psql $DATABASE_URL -c "SELECT 1"
# Expected: (1 row)

# Check 3: Connection pool saturation
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity"
# Expected: < 20 connections
```

### Causes possibles

A. **Connection pool exhausted** (40%)  
B. **Storage full** (20%)  
C. **Query timeout** (15%)  
D. **Neon service down** (15%)  
E. **Network / TLS issue** (10%)

### Actions de récupération

#### IF Connection pool exhausted :

```bash
# 1. Kill idle connections
# Neon Dashboard → Database → Query Monitor

# 2. Restart app (closes connections)
# Railway Dashboard → Redeploy

# 3. Add more connection slots
# Neon Dashboard → Project Settings → Connection Limit (default 100, increase to 150)

# Duration: 5-10 min
```

#### IF Storage full :

```bash
# 1. Check storage
# Neon Dashboard → Database → Storage

# 2. If > 95%:
#    - Archive old emails (DELETE WHERE created_at < '2026-01-01')
#    - Upgrade Neon plan (+$)

# 3. Contact Neon support if emergency

# Duration: 30+ min (manual cleanup)
```

#### IF Neon service down :

```bash
# 1. Check Neon status page
# 2. Wait for Neon to recover (usually < 15 min)
# 3. In meantime:
#    - Show "Maintenance" page to users
#    - Pause cron jobs (to avoid queue backup)
#    - Post in Slack #alerts-production

# 4. Once recovered:
#    - Verify connection
#    - Restart app
#    - Resume cron

# Duration: 15-60 min
```

### Verification

- [ ] psql connection works
- [ ] Can query: `SELECT COUNT(*) FROM dossier`
- [ ] Dashboard loads dossiers
- [ ] Sentry errors < 10
- [ ] App responds < 1s

### Escalation

- If > 10 min down : Page on-call + Neon support
- If > 30 min down : Restore from backup (see below)

### RESTORE FROM BACKUP (last resort)

```bash
# 1. Déclarer l'incident et obtenir l'accord du responsable d'astreinte.
# 2. Neon Dashboard → Database → Branches → Restore to point-in-time.
# 3. Restaurer d'abord dans une branche isolée (ne jamais écraser la production).
# 4. Exécuter les contrôles d'intégrité et les tests applicatifs contre cette branche.
# 5. Faire valider le point de restauration et le plan de bascule par deux personnes.
# 6. Modifier DATABASE_URL via le gestionnaire de secrets, redéployer, puis vérifier /api/health.
# 7. Conserver la branche source et la branche restaurée jusqu'à la clôture documentée de l'incident.

# Duration: 30-45 min
```

---

## 🟡 SCÉNARIO 3: CACHE DOWN (Redis / Upstash)

### Diagnostic (2 min)

**Indice** : Site slow, or Sentry shows "Redis timeout"

```bash
# Check Upstash Dashboard
# https://console.upstash.io/

# Test Redis
redis-cli ping
# Expected: PONG
```

### Recovery

**The app has fallback** (in-memory cache), so it **degrades gracefully** :
- ✅ Site still works (just slower)
- ⚠️ No rate limiting (potential abuse)
- ⚠️ Session cache lost (users re-login)

### Actions

```bash
# 1. Check Upstash status
# If down → Wait for Upstash to recover (usually < 5 min)

# 2. Restart Redis (if available)
# Upstash Dashboard → Restart button

# 3. Or create new instance
# Upstash Dashboard → Create new Redis

# 4. Update UPSTASH_REDIS_REST_TOKEN in Railway env vars

# 5. Restart app
# Railway Dashboard → Redeploy

# Duration: 5-10 min (or automatic recovery)
```

### Verification

- [ ] redis-cli ping → PONG
- [ ] Upstash Dashboard shows "Up"
- [ ] App responds normally
- [ ] No Sentry Redis errors

---

## 🟡 SCÉNARIO 4: EMAIL SERVICE DOWN (Resend)

### Diagnostic (2 min)

**Indice** : "Email not received" or Sentry "Resend API error"

```bash
# Check Resend status
curl https://status.resend.com
# or https://resend.com/status
```

### Recovery

**Email service down = graceful degradation** :
- ✅ App continues working
- ⚠️ Emails delayed (queued in DB)
- ⚠️ User notifications pending

### Actions

```bash
# 1. Check Resend status
# If temporary outage → Wait (usually < 15 min)

# 2. If Resend is permanently down:
#    - Switch to Mailgun or SendGrid (requires code change)
#    - Or use AWS SES (faster to integrate)

# 3. Cron job will retry sending automatically
# /api/cron/email-retry runs every 5 min

# 4. Manual retry (if needed)
# Call: POST https://memolib.space/api/admin/email-retry
# Header: Authorization: Bearer $CRON_SECRET

# Duration: 5-15 min (auto-recovery) or 1-2h (switch provider)
```

### Verification

- [ ] Emails in queue still exist (DB)
- [ ] Cron retried (check logs)
- [ ] Emails eventually sent

---

## 📞 ESCALATION MATRIX

### Level 1: Monitor (< 5 min outage)

- [ ] Alert Slack #alerts-production
- [ ] Check dashboard
- [ ] Document in #outage-log

### Level 2: Respond (5-15 min outage)

- [ ] Page on-call (SMS if available)
- [ ] Start investigation
- [ ] Post status in Slack

### Level 3: Notify (> 15 min outage)

- [ ] Message pilot users (Slack)
- [ ] Update status page (uptimerobot)
- [ ] Notify leadership

### Level 4: Critical (> 1 hour outage)

- [ ] Call all-hands meeting
- [ ] Prepare public incident report
- [ ] Contact customers (email)

---

## 🔑 CONTACTS D'ESCALADE

| Rôle | Nom | Téléphone | Email |
|------|-----|----------|-------|
| **Tech Lead** | [NAME] | [PHONE] | [EMAIL] |
| **DevOps** | [NAME] | [PHONE] | [EMAIL] |
| **Product Manager** | [NAME] | [PHONE] | [EMAIL] |
| **CEO** | [NAME] | [PHONE] | [EMAIL] |

**Neon support** : support@neon.tech  
**Upstash support** : support@upstash.io  
**Railway support** : support@railway.app  
**Resend support** : support@resend.com  

---

## 🧪 TEST PRA

**Frequency** : Monthly  
**Last tested** : [DATE]  
**Next test** : [DATE]

### Test checklist

- [ ] Simulate app crash → Verify rollback works
- [ ] Simulate DB connection error → Verify fallback works
- [ ] Simulate cache down → Verify graceful degradation
- [ ] Verify alerting (Sentry → Slack)
- [ ] Verify uptime monitoring (Uptime Robot)

### Test results

```
Date: [DATE]
Scenario: [WHICH]
Result: ✅ PASS / ❌ FAIL
Time to recover: [X] min
Issues found: [LIST]
Action items: [LIST]
```

---

## 📊 BACKUP & RETENTION

### Database backups

| Type | Frequency | Retention | Recovery time |
|------|-----------|-----------|---------------|
| **Neon PITR** | Selon l'offre souscrite | À confirmer avant GO | Selon l'offre |
| **Snapshots manuels chiffrés** | Selon procédure approuvée | 90 jours cible | 1-2h |
| **Archives chiffrées** | Mensuel | 1 an cible | 2-4h |

### Process

```bash
# Vérifier dans le tableau de bord Neon que le PITR est activé, que sa durée de
# rétention satisfait le RPO, et conserver une preuve datée dans le dossier de release.
#
# Les exports locaux en clair (ex: `pg_dump ... > backup.sql`) sont interdits.
# Le helper src/lib/security/backup-system.ts écrit seulement des fichiers .enc,
# avec permissions restrictives, et n'est pas un mécanisme de planification à lui seul.
#
# Test de restauration trimestriel :
# 1. Restaurer vers une branche/base de staging isolée.
# 2. Passer explicitement allowRestore: true au helper opérateur approuvé.
# 3. Vérifier l'intégrité et l'accès applicatif sans données de production dans les logs.
# 4. Consigner RTO/RPO observés et supprimer l'environnement de test selon la procédure approuvée.
```

---

## 📝 POST-INCIDENT PROCEDURE

After any incident > 5 min :

1. **Create incident report** (within 1h)
   - What happened
   - How long (start/end times)
   - Root cause
   - Impact (users, data)
   - Fix applied

2. **Postmortem meeting** (within 24h)
   - Invite: tech lead, product, anyone involved
   - Timeline review
   - Root cause analysis
   - Action items for prevention

3. **Publish summary** (within 48h)
   - Status page update
   - Email to pilot users
   - Slack #outage-log

---

## ✅ SIGN-OFF

| Role | Name | Date | Signature |
|------|------|------|-----------|
| **Tech Lead** | | | |
| **Product Manager** | | | |
| **CEO** | | | |

---

**This PRA is a living document. Review and update quarterly.**

Last updated: 1st September 2026
