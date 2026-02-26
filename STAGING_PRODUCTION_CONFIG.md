# 🌍 Production & Staging Configuration

**Date:** 2 février 2026
**Status:** À configurer avant déploiement

---

## 🔷 STAGING Environment

### **Frontend (Vercel Staging)**

```bash
# URL: https://staging.memolib.fr
# Créé automatiquement lors du premier déploiement

Configurations:
├── Framework: Next.js
├── Node.js: 20.x
├── Build cmd: npm run build
├── Start cmd: npm start
├── Output dir: .next
├── Install cmd: npm ci
└── Environment: staging
```

**Variables d'environnement (à ajouter dans Vercel):**

```
NEXT_PUBLIC_API_URL=https://api-staging.memolib.fr
NEXT_PUBLIC_SENTRY_DSN=https://staging-sentry-key@sentry.io/project-id
DATABASE_URL=postgresql://... (staging DB)
NEXTAUTH_SECRET=staging-secret-key
NEXTAUTH_URL=https://staging.memolib.fr
GITHUB_APP_CLIENT_ID=staging-client-id
GITHUB_APP_CLIENT_SECRET=staging-client-secret
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### **Backend (Azure Staging)**

```bash
# URL: https://api-staging.memolib.fr
# App Service: memolib-api-staging
# Resource Group: memolib-staging
# SKU: B2 (1 instance)

Créer via Azure CLI:
az group create \
  --name memolib-staging \
  --location eastus

az appservice plan create \
  --name memolib-plan-staging \
  --resource-group memolib-staging \
  --sku B2 \
  --is-linux

az webapp create \
  --resource-group memolib-staging \
  --plan memolib-plan-staging \
  --name memolib-api-staging \
  --runtime "PYTHON|3.11"
```

**Variables d'environnement (App Service settings):**

```
FLASK_ENV=staging
DATABASE_URL=postgresql://... (staging DB)
JWT_SECRET=staging-jwt-secret
OPENAI_API_KEY=sk-staging-...
GITHUB_APP_ID=staging-app-id
GITHUB_APP_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...
GITHUB_APP_WEBHOOK_SECRET=staging-webhook-secret
SENDGRID_API_KEY=SG.staging-...
TWILIO_ACCOUNT_SID=ACxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxx
STRIPE_SECRET_KEY=sk_test_...
SENTRY_DSN=https://staging@sentry.io/project-id
```

---

## 🔴 PRODUCTION Environment

### **Frontend (Vercel Production)**

```bash
# URL: https://app.memolib.fr
# Domaine personnalisé: app.memolib.fr
# Production branch: main

Configurations (dans Vercel):
├── Framework: Next.js
├── Node.js: 20.x (LTS)
├── Build cmd: npm run build
├── Start cmd: npm start
├── Output dir: .next
├── Auto-deploy: Enabled for main branch
├── Preview deployments: Disabled for production
├── Revert on failure: Enabled
└── Environment: production
```

**Ajouter domaine personnalisé:**

```bash
# Vercel Dashboard → Settings → Domains
# Add domain: app.memolib.fr

# Ajouter DNS records (chez registrar):
Type: CNAME
Name: app
Value: cname.vercel.com

# Vercel configure SSL automatiquement (Let's Encrypt)
```

**Variables d'environnement:**

```
NEXT_PUBLIC_API_URL=https://api.memolib.fr
NEXT_PUBLIC_SENTRY_DSN=https://production-sentry-key@sentry.io/project-id
DATABASE_URL=postgresql://... (production DB)
NEXTAUTH_SECRET=production-secret-key-STRONG-64-CHARS
NEXTAUTH_URL=https://app.memolib.fr
GITHUB_APP_CLIENT_ID=production-client-id
GITHUB_APP_CLIENT_SECRET=production-client-secret-STRONG
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
LOG_LEVEL=error
```

### **Backend (Azure Production)**

```bash
# URL: https://api.memolib.fr
# App Service: memolib-api-prod
# Resource Group: memolib-prod
# SKU: P1V2 (2 instances minimum)

Créer via Azure CLI:
az group create \
  --name memolib-prod \
  --location eastus

az appservice plan create \
  --name memolib-plan-prod \
  --resource-group memolib-prod \
  --sku P1V2 \
  --is-linux

az webapp create \
  --resource-group memolib-prod \
  --plan memolib-plan-prod \
  --name memolib-api-prod \
  --runtime "PYTHON|3.11"

# Setup Auto-scaling
az monitor autoscale create \
  --resource-group memolib-prod \
  --resource memolib-api-prod \
  --min-count 2 \
  --max-count 10 \
  --count 2
```

**Ajouter domaine personnalisé:**

```bash
# Azure Portal → App Service → Custom domains
# Add binding: api.memolib.fr

# Ou via CLI:
az webapp config hostname add \
  --resource-group memolib-prod \
  --webapp-name memolib-api-prod \
  --hostname api.memolib.fr
```

**Variables d'environnement:**

```
FLASK_ENV=production
DATABASE_URL=postgresql://... (production DB)
JWT_SECRET=production-jwt-secret-STRONG-64-CHARS
OPENAI_API_KEY=sk-prod-...
GITHUB_APP_ID=production-app-id
GITHUB_APP_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...
GITHUB_APP_WEBHOOK_SECRET=production-webhook-secret
SENDGRID_API_KEY=SG.prod-...
TWILIO_ACCOUNT_SID=ACxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxx
STRIPE_SECRET_KEY=sk_live_...
SENTRY_DSN=https://production@sentry.io/project-id
LOG_LEVEL=warning
MAX_WORKERS=4
GUNICORN_WORKERS=4
```

---

## 🗄️ Database Setup

### **PostgreSQL Azure (Both Staging & Production)**

```bash
# Staging Database
az postgres server create \
  --resource-group memolib-staging \
  --name memolib-db-staging \
  --location eastus \
  --admin-user memolib_admin \
  --admin-password "STRONG_PASSWORD_MIN_16_CHARS" \
  --sku-name B_Gen5_1 \
  --storage-size 51200 \
  --version 14

# Production Database
az postgres server create \
  --resource-group memolib-prod \
  --name memolib-db-prod \
  --location eastus \
  --admin-user memolib_admin \
  --admin-password "STRONG_PASSWORD_MIN_16_CHARS" \
  --sku-name D_Gen5_4 \
  --storage-size 51200 \
  --version 14 \
  --enable-geo-restore true \
  --backup-retention 35
```

**Create databases:**

```bash
# Staging
psql --host memolib-db-staging.postgres.database.azure.com \
     --username memolib_admin@memolib-db-staging \
     --dbname postgres \
     -c "CREATE DATABASE memolib_staging;"

# Production
psql --host memolib-db-prod.postgres.database.azure.com \
     --username memolib_admin@memolib-db-prod \
     --dbname postgres \
     -c "CREATE DATABASE memolib_prod;"
```

**Create app user:**

```bash
# For each database, create app user (less privileges)
psql --host memolib-db-staging.postgres.database.azure.com \
     --username memolib_admin@memolib-db-staging \
     --dbname memolib_staging \
     -c "CREATE USER memolib_app WITH PASSWORD 'APP_PASSWORD';"

psql --host memolib-db-staging.postgres.database.azure.com \
     --username memolib_admin@memolib-db-staging \
     --dbname memolib_staging \
     -c "GRANT ALL PRIVILEGES ON DATABASE memolib_staging TO memolib_app;"
```

---

## 🔐 Firewall Rules

```bash
# Allow Azure services to connect
az postgres server firewall-rule create \
  --resource-group memolib-staging \
  --server-name memolib-db-staging \
  --name "AllowAzureServices" \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Allow specific IP (office, developer machine)
az postgres server firewall-rule create \
  --resource-group memolib-staging \
  --server-name memolib-db-staging \
  --name "AllowOffice" \
  --start-ip-address YOUR_IP \
  --end-ip-address YOUR_IP
```

---

## ✅ Checklist de Configuration

### Staging

- [ ] Vercel staging app créée
- [ ] Azure staging resource group créée
- [ ] Azure App Service staging créée
- [ ] PostgreSQL staging database créée
- [ ] Tous les secrets/env vars configurés
- [ ] Domain SSL certificats générés

### Production

- [ ] Vercel production app créée
- [ ] Azure production resource group créée
- [ ] Azure App Service production créée (P1V2, 2 instances)
- [ ] PostgreSQL production database créée (avec backups)
- [ ] Tous les secrets/env vars configurés
- [ ] Domain SSL certificats générés
- [ ] Auto-scaling configuré
- [ ] Backups programmés
- [ ] Monitoring/Alerts configurés

---

## 🔗 Configuration DNS

```
app.memolib.fr (Frontend)
├── Type: CNAME
├── Value: cname.vercel.com
└── TTL: 3600

api.memolib.fr (Backend)
├── Type: CNAME ou ALIAS
├── Value: memolib-api-prod.azurewebsites.net
└── TTL: 3600

memolib.fr (Root)
├── Type: A ou ALIAS
├── Value: Depends on registrar
└── TTL: 3600
```

---

## 📞 Configuration Support

**Questions fréquentes:**

Q: Où configurer les variables d'environnement dans Vercel?
A: Vercel Dashboard → Project → Settings → Environment Variables

Q: Où configurer les variables d'environnement dans Azure?
A: Azure Portal → App Service → Configuration → Application Settings

Q: Comment obtenir les connection strings?
A: Azure Portal → Database → Connection strings (copy connection string)

Q: Backup de la base de données?
A: Azure Portal → Database → Backups (géoredondant, 35 jours rétention)

---

**Status:** 📝 À CONFIGURER
**Temps estimé:** 2 heures
**Responsable:** DevOps Team + Lead Dev
