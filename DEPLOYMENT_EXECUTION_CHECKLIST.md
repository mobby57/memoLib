# ✅ CHECKLIST EXÉCUTION DÉPLOIEMENT PRODUCTION

**Date Début**: 6 février 2026
**Temps Estimé**: 30 minutes
**Status Global**: 🚀 PRÊT À DÉPLOYER

---

## ÉTAPE 3️⃣: CONFIGURATION ENVIRONNEMENT (5 MIN)

### A. Vercel (Recommandé)

```bash
# 1. Accéder à Vercel Dashboard
#    https://vercel.com/dashboard

# 2. Sélectionner le projet IAPosteManager

# 3. Settings → Environment Variables

# 4. Ajouter ces variables:

☐ NEXTAUTH_SECRET          = <générer: openssl rand -base64 32>
☐ NEXTAUTH_URL             = https://memolib.vercel.app (ou votre domaine)
☐ DATABASE_URL             = postgresql://user:pass@host:5432/memolib
☐ SECRET_KEY               = <votre-secret-key>
☐ AZURE_TENANT_ID          = <tenant-id-azure-ad>
☐ AZURE_CLIENT_ID          = <client-id-azure-ad>
☐ AZURE_CLIENT_SECRET      = <client-secret-azure-ad>
☐ OPENAI_API_KEY           = sk-proj-... (optionnel)
☐ STRIPE_SECRET_KEY        = sk_live_... (optionnel)
☐ STRIPE_PUBLISHABLE_KEY   = pk_live_... (optionnel)
☐ STRIPE_WEBHOOK_SECRET    = whsec_... (optionnel)

# 5. Cliquer "Save"
# 6. Vercel prêt pour redéploiement
```

### B. Render (Alternative)

```bash
# 1. Accéder à Render Dashboard
#    https://dashboard.render.com

# 2. Sélectionner le service IAPosteManager

# 3. Environment → Environment Variables

# 4. Ajouter les variables (même que Vercel ci-dessus)

# 5. Cliquer "Deploy"
```

### C. Azure Container Instances (Alternative)

```bash
# 1. Créer .env.prod file en local avec les variables

# 2. Exécuter:
az containerapp up \
  --name iapostemanager-prod \
  --source . \
  --environment-variables-file env.prod \
  --target-port 3000

# 3. Attendre le déploiement (~5-10 min)
```

---

## ÉTAPE 4️⃣: DÉPLOIEMENT VERS PRODUCTION (5 MIN)

### Option A: Git Push (Auto-Deploy)

```bash
☐ Ouvrir terminal dans le dossier memolib
☐ Exécuter:
   cd c:\Users\moros\Desktop\memolib
   git status

☐ Confirmer tous les changements sont commit:
   git status → "nothing to commit, working tree clean"

☐ Pousser vers main:
   git push origin main

☐ Attendre le webhook de Vercel/Render
   → Vérifier dans le dashboard
   → Déploiement devrait commencer en < 3 sec
   → Durée estimée: 5-10 minutes

☐ Une fois déployé, vous recevrez:
   ✅ Email de confirmation Vercel
   ✅ Green checkmark dans GitHub commit
   ✅ Production URL accessible
```

### Option B: Manual Vercel Deploy Button

```bash
☐ Si Git push ne fonctionne pas:
   1. Aller à Vercel Dashboard
   2. Cliquer le bouton "Redeploy" (3 points menu)
   3. Sélectionner le commit "production deployment"
   4. Cliquer "Redeploy"
   5. Attendre 5-10 minutes
```

### Option C: Render Manual Deploy

```bash
☐ Dans Render Dashboard:
   1. Sélectionner le service MemoLib
   2. Cliquer "Manual Deploy"
   3. Sélectionner la branche "main"
   4. Cliquer "Create Deploy"
   5. Attendre 5-10 minutes
```

**Status Monitoring**:
```
☐ Vercel:  https://vercel.com/dashboard
☐ Render:  https://dashboard.render.com
☐ Logs:    Dans le dashboard du service
```

---

## ÉTAPE 5️⃣: TESTS DE VALIDATION (5 MIN)

### Test 1: Health Check
```bash
☐ Ouvrir PowerShell

☐ Exécuter:
   $ProgressPreference = 'SilentlyContinue'
   Invoke-WebRequest -Uri "https://your-production-url.com/api/health" `
     -UseBasicParsing | Select-Object StatusCode

☐ Résultat attendu: StatusCode = 200

☐ Alternative (si localhost):
   curl http://localhost:3000/api/health
   → Devrait retourner JSON avec status
```

### Test 2: Deployment Status
```bash
☐ Exécuter:
   Invoke-RestMethod -Uri "https://your-production-url.com/api/deployment/final-report" `
     -TimeoutSec 10 | Select-Object status, allPhasesCompleted, productionReady

☐ Résultat attendu:
   status                = ✅ COMPLETE & PRODUCTION READY
   allPhasesCompleted    = True
   productionReady       = True
```

### Test 3: Webhooks
```bash
☐ Exécuter:
   $payload = @{
     channel = "EMAIL"
     sender = @{ email = "test@example.com" }
     body = "Test message"
   } | ConvertTo-Json

   Invoke-RestMethod -Uri "https://your-production-url.com/api/webhooks/test-multichannel/phase4" `
     -Method POST `
     -Body $payload `
     -ContentType "application/json"

☐ Résultat attendu: HTTP 200 avec métriques phase4 et phase5
```

### Test 4: Monitoring Dashboard
```bash
☐ URL: https://your-production-url.com/api/monitoring/metrics-dashboard

☐ Vérifier que le dashboard retourne:
   ✅ Total events tracking
   ✅ Success/error rates
   ✅ By-channel breakdown
   ✅ Latency percentiles
```

---

## ÉTAPE 6️⃣: SMOKE TESTS (5 MIN)

### Critical Path Tests

```bash
# Test #1: API Accessibility
☐ https://your-domain.com/api/health
   Expected: HTTP 200, JSON response

# Test #2: Webhook Email Processing
☐ POST /api/webhooks/test-multichannel/phase4
   Body: {
     "channel": "EMAIL",
     "sender": { "email": "test@example.com" },
     "body": "Test message"
   }
   Expected: HTTP 200, metrics in response

# Test #3: Webhook Validation (Invalid)
☐ POST /api/webhooks/test-multichannel/phase4
   Body: {
     "channel": "EMAIL",
     "sender": { "email": "invalid-email" },
     "body": "Should fail validation"
   }
   Expected: HTTP 400, validation error message

# Test #4: Webhook Deduplication
☐ POST /api/webhooks/test-multichannel/phase4 (same message twice)
   Expected: First → HTTP 200
            Second → HTTP 409 (duplicate detected)

# Test #5: Rate Limiting
☐ Send 6 requests in 1 second to same endpoint
   Expected: After 5 → HTTP 429 (rate limited)

# Test #6: Sentry Integration
☐ POST /api/monitoring/sentry-test
   Expected: HTTP 200, event sent to Sentry

# Test #7: Database Connectivity
☐ Any endpoint using DB (e.g., /api/health)
   Expected: HTTP 200, no P1000 errors in logs

# Test #8: Response Compression
☐ Any endpoint that returns large payloads
   Expected: Response headers include "Content-Encoding: gzip"
```

**Checklist de Validation**:
```
☐ All 8 tests passing
☐ No HTTP 5xx errors
☐ Response times < 3000ms
☐ Database responding
☐ Sentry events appearing
☐ Metrics updating in real-time
☐ Cache hits increasing (should see >0 cache hits)
☐ No error spikes in metrics
```

---

## ÉTAPE 7️⃣: MONITORING 1ère HEURE (60 MIN)

### Minute 0-5: Vérifications Immédiates

```bash
☐ Vérifier URL accessible (pas de DNS errors)
☐ Vérifier base de données connectée (pas de P1000 warnings)
☐ Vérifier Sentry Release en état "Healthy"
☐ Vérifier pas de Critical errors dans les logs

Command pour vérifier:
curl https://your-domain.com/api/monitoring/release-health

Expected:
{
  "status": "Healthy",
  "release": "phase6-production",
  "sessionCount": 1+,
  "crashCount": 0
}
```

### Minute 5-30: Métriques Initiales

```bash
☐ Ouvrir Sentry Dashboard en tab séparée
   https://sentry.io/organizations/memolib/issues/

☐ Ouvrir Metrics Dashboard:
   https://your-domain.com/api/monitoring/metrics-dashboard

☐ Vérifier:
   ✅ Success Rate > 95% (viser > 98%)
   ✅ Error Rate < 5% (viser < 2%)
   ✅ P99 Latency < 5000ms (viser < 3000ms)
   ✅ Zero Critical errors per minute
   ✅ Database responding consistently
   ✅ Cache starting to accumulate hits

Command pour monitorer:
while($true) {
  $resp = Invoke-RestMethod https://your-domain.com/api/monitoring/metrics-dashboard
  Write-Host "Success: $($resp.successRate)% | Error: $($resp.errorRate)% | P99: $($resp.p99Latency)ms"
  Start-Sleep -Seconds 30
}
```

### Minute 30-60: Stabilité Confirmée

```bash
☐ Métriques toujours > 98% success rate?
   ✅ YES → Continue monitoring but less frequent

☐ Aucun error spike observé?
   ✅ YES → Continue with normal monitoring

☐ Database performance stable?
   ✅ YES → Consider this deployment successful

☐ Cache hit rate > 50%?
   ✅ YES → Compression & caching working

☐ Latency stable < 3000ms P99?
   ✅ YES → Performance targets met
```

### Rollback Triggers (Si déclenché)

```
⚠️ AUTOMATIC ROLLBACK WILL TRIGGER IF:
   • Error rate > 5% for 5 consecutive minutes
   • P99 latency > 5000ms for 5 consecutive minutes
   • Database connection failures > 20%

IF AUTOMATIC ROLLBACK TRIGGERS:
☐ Sentry will show "Critical" alert
☐ Platform (Vercel/Render) auto-reverts to previous version
☐ Estimated recovery time: 5-10 minutes
☐ Once reverted, investigate root cause in Sentry

MANUAL ROLLBACK (if needed):
☐ Copy error details from Sentry
☐ Execute: git revert HEAD && git push origin main
☐ Wait for platform to redeploy previous version
☐ Verify health checks passing
☐ Investigate error root cause
```

---

## POST-DÉPLOIEMENT IMMÉDIAT (APRÈS 60 MIN)

Once all 7 steps are complete:

```bash
☐ 1. Close monitoring tab (can check periodically)

☐ 2. Update production documentation:
      - Replace localhost URLs with production URLs
      - Document deployment timestamp
      - Record any issues encountered

☐ 3. Plan optimization iterations:
      - Schedule weekly performance review
      - Document baseline metrics
      - Plan cache optimization
      - Plan database index optimization

☐ 4. Configure continuous monitoring:
      - Set up Sentry alerts (Slack integration)
      - Configure uptime monitoring (e.g., Pingdom)
      - Schedule metric reviews

☐ 5. Team notification:
      - Announce production deployment success
      - Share deployment report
      - Document any issues/resolutions
      - Plan next iteration
```

---

## TABLEAU DE BORD - MÉTRIQUES CLÉS À SUIVRE

Copier-coller cette commande toutes les 5 minutes (1ère heure):

```powershell
# Commande de monitoring continu (PowerShell)
$ProgressPreference = 'SilentlyContinue'
$metrics = Invoke-RestMethod -Uri "https://your-domain.com/api/monitoring/metrics-dashboard" -TimeoutSec 10

$timestamp = Get-Date -Format "HH:mm:ss"
Write-Host "$timestamp | Success: $($metrics.successRate)% | Error: $($metrics.errorRate)% | P99: $($metrics.p99Latency)ms | Cache: $($metrics.cacheHitRate)%"

# Targets:
# Success: > 98% ✅
# Error: < 2% ✅
# P99: < 3000ms ✅
# Cache: > 70% ✅
```

---

## 🎯 CRITÈRES DE SUCCÈS

| Étape | Critère | Status |
|-------|---------|--------|
| **3** | Env vars configurées | ☐ À faire |
| **4** | Déploiement lancé | ☐ À faire |
| **5** | Tests validés | ☐ À faire |
| **6** | Smoke tests 8/8 | ☐ À faire |
| **7** | Monitoring 1h OK | ☐ À faire |
| **Final** | > 98% success rate | ☐ À faire |
| **Final** | < 2% error rate | ☐ À faire |
| **Final** | P99 < 3000ms | ☐ À faire |

---

## 🚨 CONTACTS & RESSOURCES

**Dashboards**:
- Sentry: https://sentry.io/organizations/memolib/
- Vercel: https://vercel.com/dashboard
- Render: https://dashboard.render.com

**Documentation**:
- Docs: `docs/ENVIRONMENT_VARIABLES.md`
- Architecture: `docs/ARCHITECTURE.md`
- Deployment: `PRODUCTION_DEPLOYMENT_REPORT.md`

**Support Commands**:
```bash
# Afficher tous les endpoints
GET /api/health
GET /api/version
GET /api/deployment/status

# Tester webhooks
POST /api/test/phase4-phase5-comprehensive?testMode=readiness

# Voir les métriques
GET /api/monitoring/metrics-dashboard

# Voir le rapport de déploiement
GET /api/deployment/final-report
```

---

📝 **Checklist créée**: 6 février 2026
✅ **Status**: Tous les checkpoints prêts
🚀 **Prêt pour**: Déploiement immédiat

**QED - Prêt à déployer !**
