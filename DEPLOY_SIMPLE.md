# 🚀 Guide de Déploiement Simplifié - MemoLib CESEDA

## Objectif

Déployer rapidement en production avec focus sur vision CESEDA/IA juridique.

---

## Prérequis (Checklist)

- [ ] Compte Azure / Vercel / Railway (choisir 1 plateforme)
- [ ] Clés API obtenues:
  - [ ] OpenAI API Key (IA CESEDA)
  - [ ] Twilio Account SID + Auth Token (SMS alertes)
  - [ ] Azure AD Client ID + Secret (SSO avocats)
- [ ] Base de données PostgreSQL (Azure Database, Supabase, ou Neon)
- [ ] Domaine personnalisé (optionnel): `app.memolib.fr`

---

## Option 1: Déploiement Vercel (RECOMMANDÉ - 10 min)

### Pourquoi Vercel?

- ✅ Next.js 16 natif
- ✅ Deploy en 1 clic depuis GitHub
- ✅ SSL automatique
- ✅ Serverless (pas de gestion serveur)
- ✅ 100k req/mois gratuit (suffisant MVP)

### Étapes

#### 1. Connecter GitHub à Vercel

```bash
# Depuis GitHub repo:
# Settings → Integrations → Vercel → Install

# Ou via CLI:
npm i -g vercel
vercel login
vercel --prod
```

#### 2. Configurer Variables d'Environnement Vercel

```bash
# Via dashboard Vercel > Settings > Environment Variables:

NEXTAUTH_SECRET=<généré avec: openssl rand -base64 32>
NEXTAUTH_URL=https://app.memolib.fr
DATABASE_URL=postgresql://user:pass@host:5432/memolib
OPENAI_API_KEY=sk-proj-...
TWILIO_ACCOUNT_SID=ACxxxxxx
TWILIO_AUTH_TOKEN=xxxxxx
TWILIO_PHONE_NUMBER=+33...
AZURE_AD_CLIENT_ID=xxxxxx
AZURE_AD_CLIENT_SECRET=xxxxxx
AZURE_AD_TENANT_ID=xxxxxx
```

#### 3. Build Settings Vercel

```bash
# Framework Preset: Next.js
# Build Command: npm run build
# Output Directory: .next
# Install Command: npm install --legacy-peer-deps

# Root Directory: /
# (Vercel détecte automatiquement src/frontend/package.json)
```

#### 4. Déployer

```bash
git push origin main
# Vercel build automatiquement chaque push
```

#### 5. Vérification

```bash
# URL production: https://memolib.vercel.app (ou domaine custom)
curl https://memolib.vercel.app/api/health
# Résultat attendu: {"healthy": true, ...}
```

---

## Option 2: Déploiement Azure Static Web Apps (15 min)

### Pourquoi Azure?

- ✅ Intégration native Azure AD
- ✅ Base données Azure Database for PostgreSQL incluse
- ✅ RGPD Europe (data sovereignty)
- ✅ Azure Key Vault pour secrets

### Étapes

#### 1. Créer Resource Group

```bash
az group create \
  --name memolib-rg \
  --location westeurope
```

#### 2. Créer Static Web App

```bash
az staticwebapp create \
  --name memolib-app \
  --resource-group memolib-rg \
  --location westeurope \
  --source https://github.com/mobby57/memoLib \
  --branch main \
  --app-location "/src/frontend" \
  --output-location ".next" \
  --build-command "npm run build"
```

#### 3. Ajouter Configuration Build

```yaml
# .github/workflows/azure-static-web-apps.yml (créé automatiquement)
# Modifier pour pointer vers src/frontend:

app_location: '/src/frontend'
api_location: '' # Next.js API routes intégrées
output_location: '.next'
```

#### 4. Configurer Secrets Azure Key Vault

```bash
# Créer Key Vault
az keyvault create \
  --name memolib-secrets \
  --resource-group memolib-rg \
  --location westeurope

# Ajouter secrets
az keyvault secret set --vault-name memolib-secrets --name "OPENAI-API-KEY" --value "sk-..."
az keyvault secret set --vault-name memolib-secrets --name "TWILIO-AUTH-TOKEN" --value "xxx"
```

#### 5. Base de Données PostgreSQL Azure

```bash
az postgres flexible-server create \
  --name memolib-db \
  --resource-group memolib-rg \
  --location westeurope \
  --admin-user adminuser \
  --admin-password <GenerateSecurePassword> \
  --sku-name Standard_B1ms \
  --storage-size 32 \
  --version 15

# Obtenir connection string
az postgres flexible-server show-connection-string --server-name memolib-db
# Ajouter dans Key Vault comme "DATABASE-URL"
```

#### 6. Déployer

```bash
git push origin main
# Workflow GitHub Actions build & deploy automatiquement
```

---

## Option 3: Déploiement Railway (8 min - Simple)

### Pourquoi Railway?

- ✅ Setup ultra-rapide
- ✅ Base données PostgreSQL incluse 1-clic
- ✅ Logs temps réel
- ✅ $5/mois (vs Azure ~$50/mois)

### Étapes

#### 1. Connecter GitHub

```bash
# Sur railway.app:
# New Project → Deploy from GitHub repo → memoLib

# Ou CLI:
npm i -g @railway/cli
railway login
railway init
railway up
```

#### 2. Ajouter PostgreSQL

```bash
# Dans Railway dashboard:
# New → Database → PostgreSQL

# Copier DATABASE_URL automatiquement généré
```

#### 3. Variables d'Environnement

```bash
# Railway dashboard > Variables:
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=https://memolib.up.railway.app
DATABASE_URL=${{Postgres.DATABASE_URL}} # Auto-injecté
OPENAI_API_KEY=sk-...
TWILIO_ACCOUNT_SID=AC...
```

#### 4. Configuration Build

```bash
# railway.json (déjà présent dans repo):
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd src/frontend && npm install --legacy-peer-deps && npm run build"
  },
  "deploy": {
    "startCommand": "cd src/frontend && npm start",
    "healthcheckPath": "/api/health"
  }
}
```

#### 5. Déployer

```bash
railway up
# Ou push Git:
git push origin main
```

---

## Backend Python Flask (Port 5000)

### Déploiement Séparé (API CESEDA)

#### Option A: Render.com (Gratuit 750h/mois)

```bash
# render.yaml (déjà présent):
services:
  - type: web
    name: memolib-api
    env: python
    buildCommand: "pip install -r requirements-python.txt"
    startCommand: "python -m flask run --host=0.0.0.0 --port=5000"
    envVars:
      - key: FLASK_APP
        value: backend-python/app.py
      - key: DATABASE_URL
        fromDatabase:
          name: memolib-db
          property: connectionString
```

#### Option B: Fly.io (Déploiement Edge)

```bash
# fly.toml (déjà présent):
fly launch --name memolib-api
fly deploy

# Secrets:
fly secrets set OPENAI_API_KEY=sk-...
fly secrets set DATABASE_URL=postgresql://...
```

---

## Migration Base de Données

### Appliquer Migrations Prisma

```bash
# Après deploy, exécuter dans terminal Railway/Azure:
npx prisma migrate deploy

# Ou localement avec DB prod:
DATABASE_URL=<prod-url> npx prisma migrate deploy
```

### Seed Données Initiales (Optionnel)

```bash
# Créer utilisateur admin:
DATABASE_URL=<prod-url> npx prisma db seed
```

---

## Vérifications Post-Déploiement

### Checklist Sanity

```bash
# 1. API Health Check
curl https://app.memolib.fr/api/health
# ✅ {"healthy": true}

# 2. Login SSO Azure AD
# Ouvrir https://app.memolib.fr/auth/signin
# ✅ Redirection Azure AD fonctionne

# 3. IA CESEDA Endpoint
curl -X POST https://app.memolib.fr/api/ceseda/predict \
  -H "Authorization: Bearer <token>" \
  -d '{"caseType": "OQTF", "clientSituation": "test"}'
# ✅ Retourne prediction JSON

# 4. Backend Flask Health
curl https://memolib-api.onrender.com/api/health
# ✅ {"healthy": true}

# 5. Logs Monitoring
# Vérifier Vercel/Railway/Azure dashboard logs
# ✅ Aucune erreur 500
```

---

## Monitoring & Alertes

### Sentry (Erreurs Production)

```bash
# Déjà configuré dans sentry.*.config.ts
# Activer dans .env:
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=<généré depuis sentry.io>

# Vérifier intégration:
npm run sentry:test
```

### Uptime Monitoring

```bash
# UptimeRobot gratuit: https://uptimerobot.com
# Ajouter monitor:
# - URL: https://app.memolib.fr/api/health
# - Interval: 5 minutes
# - Alert: Email si down > 5 min
```

---

## Domaine Personnalisé

### Configurer DNS

```bash
# Chez registrar domaine (OVH, Gandi, etc):
# Ajouter enregistrements:

# Type: CNAME
# Name: app
# Value: <vercel-url>.vercel.app   # Ou Railway/Azure URL

# Type: A (pour root domain)
# Name: @
# Value: <IP-vercel>   # Obtenir avec: dig <vercel-url>.vercel.app
```

### SSL Automatique

```bash
# Vercel: SSL auto-généré (Let's Encrypt)
# Railway: SSL auto
# Azure: Certificat gratuit App Service Managed Certificate
```

---

## Rollback Rapide (Si Problème)

### Vercel

```bash
# Via dashboard Vercel > Deployments > Cliquer deployment précédent > "Promote to Production"

# Ou CLI:
vercel rollback
```

### Railway

```bash
railway rollback
```

### Azure

```bash
az staticwebapp deployment list --name memolib-app --resource-group memolib-rg
az staticwebapp deployment activate --id <previous-deployment-id>
```

---

## Coûts Estimés (Production MVP)

| Plateforme            | Hosting | DB           | Total/mois |
| --------------------- | ------- | ------------ | ---------- |
| **Vercel + Supabase** | Gratuit | $25          | $25        |
| **Railway**           | $5      | $5 (intégré) | $10        |
| **Azure**             | $50     | $30          | $80        |

**Recommandation**: Railway pour MVP (<1000 users), Azure pour scale (>1000 users + entreprise).

---

## Support & Documentation

- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **Azure Docs**: https://learn.microsoft.com/azure/static-web-apps/
- **Prisma Deploy**: https://www.prisma.io/docs/guides/deployment

---

**Dernière mise à jour**: 01/02/2026
**Temps total déploiement**: 10-15 minutes (Vercel/Railway)
**Status**: ✅ PRÊT POUR PRODUCTION
