# 🚀 MemoLib - Guide de Livraison Finale

**Version:** 1.0.0
**Date:** 2 février 2026
**Status:** ✅ Prêt pour production

---

## 📋 Checklist Pré-Déploiement

Avant de lancer la livraison, assurez-vous que :

```bash
# 1️⃣ Vérifications automatisées
bash pre-deploy-check.sh

# 2️⃣ Tests en local
npm run dev              # Terminal 1: Frontend
python app.py           # Terminal 2: Backend (port 5000)

# 3️⃣ Tester les endpoints
curl http://localhost:3000           # Frontend
curl http://localhost:5000/api/health  # Backend
```

---

## 🚀 Déploiement Rapide (5 étapes)

### **Étape 1: Préparer l'environnement**

```bash
# À faire une seule fois

# Créer secrets Vercel
vercel env pull .env.local.vercel

# Configurer Azure
az login
az account set --subscription "Your Subscription"

# Configurer GitHub Secrets
# Aller à: https://github.com/mobby57/memoLib/settings/secrets/actions
# Ajouter:
#   - VERCEL_TOKEN
#   - AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID
#   - SLACK_WEBHOOK_URL (optionnel)
```

### **Étape 2: Deployer en Staging**

```bash
# Option A: Via script
./deploy.sh staging

# Option B: Manually
npm run build
vercel deploy --env staging
# Backend: Azure App Service staging
```

### **Étape 3: Tester en Staging**

```bash
# Vérifier les URLs de staging
curl https://staging.memolib.fr           # Frontend
curl https://api-staging.memolib.fr/api/health # Backend

# Tester les features critiques
# 1. Se connecter avec Azure AD
# 2. Créer/éditer un dossier
# 3. Envoyer un email de test
# 4. Vérifier les logs (Sentry)
```

### **Étape 4: Approuver & Merge**

```bash
# Sur GitHub
# 1. Créer un PR develop → main
# 2. Vérifier que les checks GitHub Actions passent
# 3. Code review
# 4. Merge vers main
```

### **Étape 5: Deployer en Production**

```bash
# Automatiquement déclenché par merge vers main
# Ou manuellement:

./deploy.sh production

# Vérifier le déploiement
curl https://app.memolib.fr              # Frontend
curl https://api.memolib.fr/api/health   # Backend
```

---

## 📊 Fichiers de Configuration

| Fichier                        | Rôle                          | Status  |
| ------------------------------ | ----------------------------- | ------- |
| `deploy.sh`                    | Script de déploiement complet | ✅ Créé |
| `pre-deploy-check.sh`          | Vérifications pré-déploiement | ✅ Créé |
| `.github/workflows/deploy.yml` | CI/CD automatisé              | ✅ Créé |
| `Dockerfile.production`        | Image Docker Frontend         | ✅ Créé |
| `Dockerfile.backend`           | Image Docker Backend          | ✅ Créé |
| `deployment-config.json`       | Config déploiement            | ✅ Créé |
| `DEPLOYMENT_CHECKLIST.md`      | Checklist détaillée           | ✅ Créé |
| `RELEASE_NOTES.md`             | Notes de version              | ✅ Créé |

---

## 🔧 Configuration Nécessaire

### **Vercel (Frontend)**

```bash
# 1. Créer un projet Vercel
vercel create memolib

# 2. Connecter GitHub repo
# Dashboard → Import Project → GitHub

# 3. Variables d'environnement
NEXT_PUBLIC_API_URL=https://api.memolib.fr
NEXT_PUBLIC_SENTRY_DSN=...
DATABASE_URL=...
NEXTAUTH_SECRET=...
# Voir docs/ENVIRONMENT_VARIABLES.md pour la liste complète

# 4. Domaine personnalisé
# Settings → Domains → app.memolib.fr

# 5. SSL Certificate
# Automatique avec Vercel
```

### **Azure (Backend)**

```bash
# 1. Créer App Service
az group create --name memolib-prod --location eastus
az appservice plan create \
  --name memolib-plan-prod \
  --resource-group memolib-prod \
  --sku P1V2

# 2. Créer Web App
az webapp create \
  --resource-group memolib-prod \
  --plan memolib-plan-prod \
  --name memolib-api-prod \
  --runtime "PYTHON|3.11"

# 3. Configurer variables d'env
az webapp config appsettings set \
  --resource-group memolib-prod \
  --name memolib-api-prod \
  --settings FLASK_ENV=production DATABASE_URL="..." JWT_SECRET="..."

# 4. Database PostgreSQL
az postgres server create \
  --resource-group memolib-prod \
  --name memolib-db-prod \
  --location eastus \
  --admin-user memolib \
  --admin-password "STRONG_PASSWORD"

# 5. Domaine personnalisé
az webapp config hostname add \
  --resource-group memolib-prod \
  --webapp-name memolib-api-prod \
  --hostname api.memolib.fr
```

### **Base de Données**

```bash
# Migrations Prisma
npx prisma migrate deploy --env production

# Seeding (optionnel)
npx prisma db seed

# Backup avant déploiement
pg_dump --host memolib-db-prod.postgres.database.azure.com \
        --username memolib \
        --dbname memolib_prod > backup-2026-02-02.sql
```

---

## 📊 Architecture de Déploiement

```
┌─────────────────────────────────────────────────────┐
│                    CDN (Cloudflare)                 │
└─────────────────────────────────────────────────────┘
              ↓                      ↓
    ┌─────────────────┐    ┌──────────────────┐
    │  Vercel (Frontend)   │  Azure (Backend)  │
    │  app.memolib.fr      │  api.memolib.fr   │
    │  Next.js 16          │  Flask/FastAPI    │
    │  Auto scaling        │  P1V2 SKU         │
    │  Edge functions      │  2 instances      │
    └─────────────────┘    └──────────────────┘
              ↓                      ↓
    ┌─────────────────────────────────────┐
    │  PostgreSQL Database (Azure)        │
    │  Multi-region backup enabled        │
    └─────────────────────────────────────┘
              ↓
    ┌─────────────────────────────────────┐
    │  External Services                  │
    │  ├─ GitHub API                      │
    │  ├─ OpenAI/Ollama                   │
    │  ├─ SendGrid/SMTP                   │
    │  ├─ Stripe                          │
    │  ├─ Twilio                          │
    │  └─ Sentry (Monitoring)             │
    └─────────────────────────────────────┘
```

---

## 🔍 Monitoring & Logging

### **Sentry** (Error Tracking)

```
https://sentry.io/organizations/memolib
├─ Frontend: Performance & Errors
├─ Backend: Errors & Traces
└─ Real-time alerts configurées
```

### **Azure Monitor**

```
Azure Portal → App Service → Logs
├─ Application Insights
├─ Log Analytics
└─ Alerts sur CPU/Memory
```

### **Vercel Analytics**

```
https://vercel.com/memolib
├─ Build logs
├─ Deployment history
└─ Edge functions metrics
```

---

## 🆘 Rollback (Si problème)

### **Rollback rapide**

```bash
# Option 1: Depuis Git
git revert HEAD
git push origin main  # Auto-redéploie

# Option 2: Restore backup
./deploy.sh --rollback
```

### **Rollback database**

```bash
# Restaurer backup PostgreSQL
psql --host memolib-db-prod.postgres.database.azure.com \
     --username memolib \
     --dbname memolib_prod < backup-2026-02-02.sql
```

---

## 📞 Support & Contacts

| Situation             | Action                       | Contact                                       |
| --------------------- | ---------------------------- | --------------------------------------------- |
| **Frontend down**     | Vérifier Vercel              | [Vercel Incidents](https://status.vercel.com) |
| **Backend error**     | Vérifier Sentry + Logs Azure | [Sentry Dashboard](https://sentry.io)         |
| **Database issue**    | Backup & Restore             | @database-admin                               |
| **Security incident** | Rollback immédiat            | @security-team                                |
| **General issue**     | GitHub Issues                | https://github.com/mobby57/memoLib/issues     |

---

## ✅ Checklist Final (Jour du déploiement)

- [ ] Tous les tests passent (`npm test`)
- [ ] Pre-deploy check réussit (`bash pre-deploy-check.sh`)
- [ ] Staging testé et approuvé
- [ ] Database backup effectué
- [ ] Slack notifications configurées
- [ ] On-call engineer disponible
- [ ] Incident response plan validé
- [ ] Communication client préparée

---

## 🎊 Après le Go-Live

**Monitoring 24h:**

- Vérifier logs chaque 2 heures
- Monitorer Sentry pour erreurs
- Vérifier les métriques (uptime, response time)
- Être prêt à rollback si critère non-respecté

**Actions post-livraison:**

- [ ] Email de confirmation aux stakeholders
- [ ] Publier release notes
- [ ] Mettre à jour roadmap
- [ ] Planifier retrospective
- [ ] Documenter lessons learned

---

## 📖 Documentation Complète

- 📘 [Architecture complète](docs/ARCHITECTURE.md)
- 🔧 [Guide développement](docs/DEVELOPMENT.md)
- 🔐 [Variables d'environnement](docs/ENVIRONMENT_VARIABLES.md)
- 📊 [API Documentation](docs/API.md)
- 🚀 [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)
- 📝 [Release Notes](RELEASE_NOTES.md)

---

**Status:** ✅ Prêt pour livraison
**Dernière mise à jour:** 2 février 2026
**Responsable:** DevOps Team
**ETA Go-Live:** À confirmer
