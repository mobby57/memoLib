# 🔐 CONFIGURATION AZURE — WORKSPACE JURIDIQUE

**Variables d'environnement pour Azure Static Web Apps**

---

## 📋 Variables requises

```env
# Base de données
DATABASE_URL=<votre_neon_url>

# Auth
NEXTAUTH_URL=https://green-stone-023c52610.6.azurestaticapps.net
NEXTAUTH_SECRET=<votre_secret>

# IA
OLLAMA_BASE_URL=<votre_ollama_url>

# Légifrance PISTE
PISTE_ENVIRONMENT=sandbox
PISTE_SANDBOX_CLIENT_ID=<votre_client_id>
PISTE_SANDBOX_CLIENT_SECRET=<votre_client_secret>
PISTE_SANDBOX_OAUTH_URL=https://sandbox-oauth.piste.gouv.fr/api/oauth/token
PISTE_SANDBOX_API_URL=https://sandbox-api.piste.gouv.fr/dila/legifrance/lf-engine-app

# Paiement
STRIPE_SECRET_KEY=<votre_stripe_key>

# Cron
CRON_SECRET=<votre_secret>

# Azure SDK (optionnel)
AZURE_STORAGE_ACCOUNT_NAME=<votre_storage_account>
AZURE_STORAGE_CONTAINER=<votre_container>
AZURE_KEY_VAULT_NAME=<votre_keyvault>
```

---

## 🔑 Générer les secrets

```bash
# NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# CRON_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔧 Ajouter dans Azure

### Via le portail Azure

1. https://portal.azure.com
2. Static Web Apps → "green-stone-023c52610"
3. Configuration → Application settings → Add
4. Ajouter chaque variable
5. Save

### Via Azure CLI

```bash
az staticwebapp appsettings set \
  --name green-stone-023c52610 \
  --setting-names \
    DATABASE_URL="<url>" \
    NEXTAUTH_SECRET="<secret>" \
    CRON_SECRET="<secret>"
```

---

## 🔄 Déploiement

### Automatique (GitHub Actions)

1. Push sur `main`
2. Workflow `.github/workflows/azure-static-web-apps-green-stone-023c52610.yml` se déclenche
3. Build avec Node 20.x
4. Génération Prisma Client
5. Build Next.js
6. Déploiement Azure

### Manuel

```bash
# Via GitHub Actions
gh workflow run azure-static-web-apps-green-stone-023c52610.yml
```

---

## ✅ Vérification

### Health check
```bash
curl https://green-stone-023c52610.6.azurestaticapps.net/api/health
```

### Tester le cron
```bash
curl -X POST https://green-stone-023c52610.6.azurestaticapps.net/api/cron/deadline-alerts \
  -H "Authorization: Bearer <CRON_SECRET>"
```

### Tester Azure Storage (si configuré)
```bash
curl https://green-stone-023c52610.6.azurestaticapps.net/api/azure/storage/list
```

---

## 🏗️ Architecture

- **Runtime**: Node.js 20.x
- **Framework**: Next.js 16.1.1
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma 5.22.0
- **Auth**: NextAuth 4.24.13
- **Storage**: Azure Blob Storage (optionnel)
- **Secrets**: Azure Key Vault (optionnel)

## 📦 Dépendances Azure

```json
"@azure/identity": "^4.5.0",
"@azure/keyvault-secrets": "^4.9.0",
"@azure/storage-blob": "^12.24.0"
```

## 🔗 Liens

- **App**: https://green-stone-023c52610.6.azurestaticapps.net
- **Portal**: https://portal.azure.com
- **Workflow**: `.github/workflows/azure-static-web-apps-green-stone-023c52610.yml`
- **Config**: `staticwebapp.config.json`

---

**Mis à jour le** : 21/01/2026  
**Statut** : PRODUCTION
