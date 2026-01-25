# Azure Static Web App - iapostemanager-swa

## 📋 Informations

- **Resource ID**: `/subscriptions/03b6b7fe-90b8-4fa5-ae31-24cd21958add/resourceGroups/iapostemanager-rg/providers/Microsoft.Web/staticSites/iapostemanager-swa`
- **Resource Group**: `iapostemanager-rg`
- **Subscription**: `03b6b7fe-90b8-4fa5-ae31-24cd21958add`
- **Workflow**: `.github/workflows/azure-static-web-apps-iapostemanager-swa.yml`

## 🔑 Secrets GitHub requis

Ajouter dans GitHub Settings → Secrets and variables → Actions :

```
AZURE_STATIC_WEB_APPS_API_TOKEN_IAPOSTEMANAGER_SWA
DATABASE_URL
NEXTAUTH_URL
NEXTAUTH_SECRET
OLLAMA_BASE_URL
PISTE_SANDBOX_CLIENT_ID
PISTE_SANDBOX_CLIENT_SECRET
STRIPE_SECRET_KEY
CRON_SECRET
AZURE_STORAGE_ACCOUNT_NAME
AZURE_STORAGE_CONTAINER
AZURE_KEY_VAULT_NAME
```

## 🚀 Déploiement

### Automatique
```bash
git push origin main
```

### Manuel
```bash
gh workflow run azure-static-web-apps-iapostemanager-swa.yml
```

## 🔧 Configuration Azure

### Via Portal
1. https://portal.azure.com
2. Static Web Apps → iapostemanager-swa
3. Configuration → Application settings
4. Ajouter les variables d'environnement

### Via CLI
```bash
az staticwebapp appsettings set \
  --name iapostemanager-swa \
  --resource-group iapostemanager-rg \
  --setting-names \
    DATABASE_URL="<url>" \
    NEXTAUTH_SECRET="<secret>" \
    CRON_SECRET="<secret>"
```

## ✅ Vérification

```bash
# Health check
curl https://<app-url>/api/health

# Cron test
curl -X POST https://<app-url>/api/cron/deadline-alerts \
  -H "Authorization: Bearer <CRON_SECRET>"
```

## 📦 Build

- **Node**: 20.x
- **Framework**: Next.js 16.1.1
- **Output**: `.next`
- **Prisma**: Génération automatique du client
