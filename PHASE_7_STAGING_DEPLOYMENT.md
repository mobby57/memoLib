# 🚀 Phase 7: Staging Deployment Execution

**Objectif:** Déployer l'application en staging pour 24h de tests intensifs
**Durée estimée:** 45 minutes (déploiement) + 24h (monitoring)
**Status:** À EXÉCUTER

---

## ✅ Pré-conditions (VÉRIFIER AVANT DE DÉPLOYER)

- [x] Phase 1-5: Complétées
- [x] Phase 6: Configuration préparée
- [ ] GitHub secrets configurés
- [ ] Vercel staging créée et connectée
- [ ] Azure staging infrastructure prêt
- [ ] PostgreSQL staging initialisée
- [ ] Variables d'environnement configurées
- [ ] SSL certificats générés
- [ ] DNS records configurés

---

## 📋 Étapes de Déploiement Staging

### **Étape 1: Vérification pré-déploiement (5 min)**

```bash
# 1. Aller au répertoire project
cd /path/to/memolib

# 2. Vérifier les pré-conditions
chmod +x ./pre-deploy-check.sh
./pre-deploy-check.sh staging

# Résultat attendu:
# ✅ Build frontend successful
# ✅ Python backend dependencies installed
# ✅ Database connections available
# ✅ Environment variables configured
# ✅ GitHub secrets present
# ✅ All services responsive
# ✅ Ready for deployment
```

### **Étape 2: Déploiement Frontend (10 min)**

```bash
# Option A: Via Vercel CLI
cd src/frontend
vercel --prod --target staging

# Ou Option B: Via GitHub Actions (recommandé)
# Push vers branch develop -> GitHub Actions déclenche auto-deploy

# Vérifier le déploiement:
# 1. Vercel Dashboard → Deployments
# 2. Vérifier status: "Ready" ✅
# 3. Accéder: https://staging.memolib.fr
# 4. Vérifier healthcheck: /api/health
```

**Commandes utiles:**

```bash
# Voir les logs en temps réel
vercel logs staging --follow

# Annuler un déploiement
vercel rollback staging

# Redeployer
vercel --prod --target staging
```

### **Étape 3: Déploiement Backend (10 min)**

```bash
# Option A: Via Azure CLI
cd src/backend
az webapp deployment source config-zip \
  --resource-group memolib-staging \
  --name memolib-api-staging \
  --src backend-staging.zip

# Option B: Via GitHub Actions
# Push vers branch develop -> GitHub Actions déclenche auto-deploy

# Vérifier le déploiement:
# 1. Azure Portal → App Service → Deployments
# 2. Vérifier status: "Success" ✅
# 3. Accéder: https://api-staging.memolib.fr
# 4. Vérifier healthcheck: /health
```

**Commandes utiles:**

```bash
# Voir les logs Azure
az webapp log tail \
  --resource-group memolib-staging \
  --name memolib-api-staging

# Redémarrer l'app service
az webapp restart \
  --resource-group memolib-staging \
  --name memolib-api-staging
```

### **Étape 4: Migrations Base de Données (5 min)**

```bash
# Appliquer les migrations Prisma (si nécessaire)
npm run prisma:migrate:deploy

# Vérifier l'intégrité
npm run prisma:studio

# Si problème de migration:
npm run prisma:migrate:resolve
npm run prisma:migrate:status
```

### **Étape 5: Smoke Tests (5 min)**

```bash
# Tests de base pour s'assurer que tout fonctionne

# 1. Health checks
curl https://staging.memolib.fr/api/health
curl https://api-staging.memolib.fr/health

# 2. Database connection
curl -X GET https://api-staging.memolib.fr/db/status

# 3. Authentication (login)
curl -X POST https://staging.memolib.fr/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# 4. API endpoints
curl -X GET https://api-staging.memolib.fr/api/documents

# 5. Email service
curl -X POST https://api-staging.memolib.fr/emails/test \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com"}'

# Résultat: Tous les endpoints doivent répondre avec HTTP 200/201
```

### **Étape 6: Full Deployment Script**

```bash
# Script exécutant toutes les étapes
chmod +x ./deploy.sh
./deploy.sh staging

# Affichage du script:
# ========================================
# 🚀 Deploying to STAGING
# ========================================
#
# Step 1: Pre-deployment checks
# ✅ Pre-flight checks passed
#
# Step 2: Building frontend
# ✅ Frontend built (45s)
#
# Step 3: Deploying frontend to Vercel
# ✅ Frontend deployed: https://staging.memolib.fr
#
# Step 4: Building backend
# ✅ Backend built (30s)
#
# Step 5: Deploying backend to Azure
# ✅ Backend deployed: https://api-staging.memolib.fr
#
# Step 6: Running smoke tests
# ✅ Health check: OK
# ✅ Database check: OK
# ✅ Auth check: OK
#
# Step 7: Deployment summary
# Frontend: https://staging.memolib.fr
# Backend: https://api-staging.memolib.fr
# Database: memolib_staging
# Status: Ready for testing
#
# ========================================
# ✅ Staging deployment successful!
# ========================================
```

---

## 📊 Monitoring & Testing (24h)

### **Pendant 24h après déploiement:**

**Heure 0-1 (Smoke Tests)**

```bash
# Vérifier immédiatement que rien ne s'est cassé
✅ Frontend accessible
✅ Backend accessible
✅ Database connected
✅ Auth fonctionnelle
✅ Email service fonctionnelle
```

**Heure 1-8 (Load Testing)**

```bash
# Tests de charge pour vérifier performance
npm run test:performance:staging

# Ou via Azure Load Testing:
# Azure Portal → Load Testing
# Créer un test de charge avec:
# - 100 users
# - Ramp-up: 5 min
# - Duration: 30 min
# - Endpoints: tous les endpoints critiques

# Cibles de performance:
# - Response time: <200ms (95e percentile)
# - Error rate: <0.1%
# - Throughput: >100 req/sec
```

**Heure 8-24 (Integration Testing)**

```bash
# Tests end-to-end complets
npm run test:e2e:staging

# Scénarios à tester:
✅ User signup → email verification → login
✅ Create document → upload file → process with AI
✅ Send email → webhook reception → update status
✅ Integration GitHub → OAuth → linked account
✅ Admin panel → user management → delete user
✅ Payment flow → Stripe integration → webhook
```

**Monitoring continu:**

```bash
# Logs en temps réel
az webapp log tail --resource-group memolib-staging --name memolib-api-staging

# Metrics
# Azure Portal → App Service → Metrics
# - CPU usage: <50%
# - Memory usage: <70%
# - Response time: <200ms
# - Error rate: <0.1%
# - Requests/sec: stable

# Sentry errors:
# https://sentry.io/dashboard/memolib/staging
# Nombre de nouveaux erreurs: 0 accepté

# Vercel Analytics:
# Vercel Dashboard → Analytics
# - First Contentful Paint (FCP): <1.5s
# - Largest Contentful Paint (LCP): <2.5s
# - Cumulative Layout Shift (CLS): <0.1
```

### **Checklist 24h Testing:**

**Daily Checklist:**

- [ ] Zero critical errors in Sentry
- [ ] Zero API errors (HTTP 5xx)
- [ ] Database backups completed
- [ ] Email service fully functional
- [ ] Payment tests successful
- [ ] Authentication tests successful
- [ ] Performance within targets
- [ ] No memory leaks detected
- [ ] Logs are clean (no warnings)

**After 24 hours:**

- [ ] All tests passed
- [ ] No performance degradation
- [ ] No unhandled errors
- [ ] Database integrity verified
- [ ] Backup restoration tested
- [ ] Rollback plan tested
- [ ] Sign-off from QA team
- [ ] Sign-off from Product team

---

## 🔄 If Issues Found

### **Minor Issues (Non-blocking)**

```bash
# Fix issue
git commit -m "fix: staging issue"
git push origin develop

# Redeploy staging
./deploy.sh staging
```

### **Critical Issues (Blocking)**

```bash
# 1. Rollback immediately
./deploy.sh rollback staging

# 2. Fix issue in develop branch
git commit -m "fix: critical issue"

# 3. Test locally
npm run dev
npm run dev:backend

# 4. Retry staging deployment
./deploy.sh staging
```

---

## ✅ Success Criteria

**Staging déploiement réussi si:**

✅ Frontend accessible et chargé en <2s
✅ Backend responsive avec <200ms latency
✅ Database stable avec <5ms query time
✅ Zero critical errors dans Sentry
✅ All API endpoints returning HTTP 200/201
✅ Authentication flow working (login, 2FA, logout)
✅ Email service operational (send, webhooks)
✅ File uploads working (documents, images)
✅ AI processing operational (Ollama/OpenAI)
✅ Payment flow testable (Stripe test mode)
✅ Admin functions accessible
✅ All 24h tests passed

---

## 📈 Sign-Off

**Validateurs:**

| Rôle            | Nom        | Date       | Signature  |
| --------------- | ---------- | ---------- | ---------- |
| QA Lead         | ****\_**** | **\_\_\_** | ****\_**** |
| Product Manager | ****\_**** | **\_\_\_** | ****\_**** |
| Tech Lead       | ****\_**** | **\_\_\_** | ****\_**** |
| Project Manager | ****\_**** | **\_\_\_** | ****\_**** |

**Status:** 📝 À EXÉCUTER
**Précédent:** Phase 6 ✅
**Suivant:** Phase 8 (Production GO-LIVE)
