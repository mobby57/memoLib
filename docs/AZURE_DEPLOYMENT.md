# ☁️ Déploiement Azure - IA Poste Manager

## 📋 Guide Complet de Déploiement sur Azure

---

## 🎯 Architecture Azure Recommandée

```
┌─────────────────────────────────────────────────────────────┐
│                    AZURE CLOUD PLATFORM                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🌐 Azure App Service (Next.js)                             │
│  ├─── Plan: B1 Basic (Dev) ou P1V2 (Prod)                  │
│  ├─── Node.js 20 LTS                                        │
│  └─── Auto-scaling activé                                   │
│                                                             │
│  🗄️ Azure Database for PostgreSQL                          │
│  ├─── Flexible Server                                       │
│  ├─── Tier: Burstable B1ms (Dev) ou General Purpose (Prod) │
│  └─── Backup automatique 7 jours                           │
│                                                             │
│  🔴 Azure Cache for Redis                                   │
│  ├─── Basic C0 (Dev) ou Standard C1 (Prod)                 │
│  └─── SSL/TLS activé                                        │
│                                                             │
│  📁 Azure Blob Storage                                      │
│  ├─── Hot tier pour documents actifs                       │
│  ├─── Cool tier pour archives                              │
│  └─── Encryption at rest                                   │
│                                                             │
│  🔐 Azure Key Vault                                         │
│  ├─── Secrets management                                    │
│  └─── Managed Identity                                     │
│                                                             │
│  📊 Azure Monitor + Application Insights                    │
│  └─── Logs, métriques, alertes                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Étape 1 : Installation Azure CLI

### Windows

```powershell
# Télécharger et installer Azure CLI
winget install -e --id Microsoft.AzureCLI

# Vérifier l'installation
az --version

# Se connecter à Azure
az login
```

### Alternative : Utiliser Azure Cloud Shell
- Accéder à https://portal.azure.com
- Cliquer sur l'icône Cloud Shell (>_) en haut à droite

---

## 🔧 Étape 2 : Configuration du Projet

### 2.1 Installer les Dépendances Azure

```bash
cd c:\Users\moros\Desktop\iaPostemanage

# SDK Azure pour Node.js
npm install @azure/storage-blob @azure/identity @azure/keyvault-secrets

# Monitoring
npm install @azure/monitor-opentelemetry-exporter

# Dev dependencies
npm install -D @azure/static-web-apps-cli
```

### 2.2 Créer le Fichier de Configuration Azure

Créer `azure.config.js` :

```javascript
module.exports = {
  resourceGroup: 'rg-iapostemanager',
  location: 'francecentral', // ou 'westeurope'
  appServicePlan: 'asp-iapostemanager',
  webApp: 'app-iapostemanager',
  database: 'psql-iapostemanager',
  redis: 'redis-iapostemanager',
  storage: 'stiapostemanager',
  keyVault: 'kv-iapostemanager',
  appInsights: 'appi-iapostemanager'
};
```

---

## 🚀 Étape 3 : Déploiement Infrastructure

### 3.1 Créer le Resource Group

```bash
# Définir les variables
$RESOURCE_GROUP="rg-iapostemanager"
$LOCATION="francecentral"

# Créer le groupe de ressources
az group create --name $RESOURCE_GROUP --location $LOCATION
```

### 3.2 Déployer PostgreSQL

```bash
# Variables
$DB_SERVER="psql-iapostemanager"
$DB_NAME="iapostemanage"
$DB_ADMIN="iapostadmin"
$DB_PASSWORD="VotreMotDePasseSecurise123!"

# Créer le serveur PostgreSQL Flexible
az postgres flexible-server create `
  --resource-group $RESOURCE_GROUP `
  --name $DB_SERVER `
  --location $LOCATION `
  --admin-user $DB_ADMIN `
  --admin-password $DB_PASSWORD `
  --sku-name Standard_B1ms `
  --tier Burstable `
  --version 16 `
  --storage-size 32 `
  --public-access 0.0.0.0

# Créer la base de données
az postgres flexible-server db create `
  --resource-group $RESOURCE_GROUP `
  --server-name $DB_SERVER `
  --database-name $DB_NAME

# Configurer le firewall (autoriser Azure services)
az postgres flexible-server firewall-rule create `
  --resource-group $RESOURCE_GROUP `
  --name $DB_SERVER `
  --rule-name AllowAzureServices `
  --start-ip-address 0.0.0.0 `
  --end-ip-address 0.0.0.0
```

### 3.3 Déployer Redis

```bash
$REDIS_NAME="redis-iapostemanager"

# Créer Azure Cache for Redis
az redis create `
  --resource-group $RESOURCE_GROUP `
  --name $REDIS_NAME `
  --location $LOCATION `
  --sku Basic `
  --vm-size c0 `
  --enable-non-ssl-port false

# Récupérer les clés
az redis list-keys --resource-group $RESOURCE_GROUP --name $REDIS_NAME
```

### 3.4 Déployer Blob Storage

```bash
$STORAGE_NAME="stiapostemanager"

# Créer le compte de stockage
az storage account create `
  --resource-group $RESOURCE_GROUP `
  --name $STORAGE_NAME `
  --location $LOCATION `
  --sku Standard_LRS `
  --kind StorageV2 `
  --access-tier Hot

# Créer les conteneurs
az storage container create `
  --account-name $STORAGE_NAME `
  --name documents `
  --public-access off

az storage container create `
  --account-name $STORAGE_NAME `
  --name archives `
  --public-access off

# Récupérer la connection string
az storage account show-connection-string `
  --resource-group $RESOURCE_GROUP `
  --name $STORAGE_NAME
```

### 3.5 Déployer Key Vault

```bash
$KEYVAULT_NAME="kv-iapostemanager"

# Créer Key Vault
az keyvault create `
  --resource-group $RESOURCE_GROUP `
  --name $KEYVAULT_NAME `
  --location $LOCATION `
  --enable-rbac-authorization false

# Ajouter des secrets
az keyvault secret set --vault-name $KEYVAULT_NAME --name "DatabaseUrl" --value "postgresql://..."
az keyvault secret set --vault-name $KEYVAULT_NAME --name "NextAuthSecret" --value "..."
az keyvault secret set --vault-name $KEYVAULT_NAME --name "RedisUrl" --value "..."
```

---

## 🌐 Étape 4 : Déployer l'Application Next.js

### 4.1 Créer l'App Service Plan

```bash
$APP_PLAN="asp-iapostemanager"

# Créer le plan (B1 pour dev, P1V2 pour prod)
az appservice plan create `
  --resource-group $RESOURCE_GROUP `
  --name $APP_PLAN `
  --location $LOCATION `
  --sku B1 `
  --is-linux
```

### 4.2 Créer la Web App

```bash
$WEB_APP="app-iapostemanager"

# Créer l'application
az webapp create `
  --resource-group $RESOURCE_GROUP `
  --plan $APP_PLAN `
  --name $WEB_APP `
  --runtime "NODE:20-lts"

# Configurer Node.js
az webapp config appsettings set `
  --resource-group $RESOURCE_GROUP `
  --name $WEB_APP `
  --settings WEBSITE_NODE_DEFAULT_VERSION="20.x"
```

### 4.3 Configurer les Variables d'Environnement

```bash
# Récupérer les connection strings
$DB_URL = "postgresql://$DB_ADMIN:$DB_PASSWORD@$DB_SERVER.postgres.database.azure.com:5432/$DB_NAME?sslmode=require"
$REDIS_URL = az redis show --resource-group $RESOURCE_GROUP --name $REDIS_NAME --query "hostName" -o tsv

# Configurer les variables
az webapp config appsettings set `
  --resource-group $RESOURCE_GROUP `
  --name $WEB_APP `
  --settings `
    DATABASE_URL="$DB_URL" `
    REDIS_URL="rediss://:PASSWORD@$REDIS_URL:6380" `
    NEXTAUTH_URL="https://$WEB_APP.azurewebsites.net" `
    NEXTAUTH_SECRET="votre-secret-genere" `
    NODE_ENV="production"
```

### 4.4 Activer Managed Identity

```bash
# Activer System Managed Identity
az webapp identity assign `
  --resource-group $RESOURCE_GROUP `
  --name $WEB_APP

# Donner accès au Key Vault
$PRINCIPAL_ID = az webapp identity show --resource-group $RESOURCE_GROUP --name $WEB_APP --query principalId -o tsv

az keyvault set-policy `
  --name $KEYVAULT_NAME `
  --object-id $PRINCIPAL_ID `
  --secret-permissions get list
```

---

## 📤 Étape 5 : Déploiement du Code

### 5.1 Préparer le Build

Créer `.deployment` :

```ini
[config]
SCM_DO_BUILD_DURING_DEPLOYMENT=true
```

Créer `web.config` (optionnel) :

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^server.js\/debug[\/]?" />
        </rule>
        <rule name="StaticContent">
          <action type="Rewrite" url="public{REQUEST_URI}"/>
        </rule>
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
          </conditions>
          <action type="Rewrite" url="server.js"/>
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

### 5.2 Déployer via Git

```bash
# Configurer le déploiement Git local
az webapp deployment source config-local-git `
  --resource-group $RESOURCE_GROUP `
  --name $WEB_APP

# Récupérer l'URL Git
$GIT_URL = az webapp deployment source show `
  --resource-group $RESOURCE_GROUP `
  --name $WEB_APP `
  --query "repoUrl" -o tsv

# Ajouter le remote Azure
git remote add azure $GIT_URL

# Déployer
git add .
git commit -m "Deploy to Azure"
git push azure main
```

### 5.3 Déployer via GitHub Actions (Recommandé)

Créer `.github/workflows/azure-deploy.yml` :

```yaml
name: Deploy to Azure

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  AZURE_WEBAPP_NAME: app-iapostemanager
  NODE_VERSION: '20.x'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}

      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v2
        with:
          app-name: ${{ env.AZURE_WEBAPP_NAME }}
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: .
```

Configurer les secrets GitHub :

```bash
# Télécharger le profil de publication
az webapp deployment list-publishing-profiles `
  --resource-group $RESOURCE_GROUP `
  --name $WEB_APP `
  --xml > publish-profile.xml

# Ajouter dans GitHub Secrets :
# AZURE_WEBAPP_PUBLISH_PROFILE = contenu de publish-profile.xml
```

---

## 📊 Étape 6 : Monitoring et Logs

### 6.1 Activer Application Insights

```bash
$APPINSIGHTS_NAME="appi-iapostemanager"

# Créer Application Insights
az monitor app-insights component create `
  --app $APPINSIGHTS_NAME `
  --location $LOCATION `
  --resource-group $RESOURCE_GROUP `
  --application-type web

# Récupérer la clé d'instrumentation
$INSTRUMENTATION_KEY = az monitor app-insights component show `
  --app $APPINSIGHTS_NAME `
  --resource-group $RESOURCE_GROUP `
  --query "instrumentationKey" -o tsv

# Configurer dans l'app
az webapp config appsettings set `
  --resource-group $RESOURCE_GROUP `
  --name $WEB_APP `
  --settings APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=$INSTRUMENTATION_KEY"
```

### 6.2 Configurer les Logs

```bash
# Activer les logs
az webapp log config `
  --resource-group $RESOURCE_GROUP `
  --name $WEB_APP `
  --application-logging filesystem `
  --detailed-error-messages true `
  --failed-request-tracing true `
  --web-server-logging filesystem

# Voir les logs en temps réel
az webapp log tail --resource-group $RESOURCE_GROUP --name $WEB_APP
```

---

## 🔐 Étape 7 : Sécurité et SSL

### 7.1 Configurer un Domaine Personnalisé

```bash
$DOMAIN="iapostemanager.com"

# Ajouter le domaine
az webapp config hostname add `
  --resource-group $RESOURCE_GROUP `
  --webapp-name $WEB_APP `
  --hostname $DOMAIN

# Activer HTTPS
az webapp update `
  --resource-group $RESOURCE_GROUP `
  --name $WEB_APP `
  --https-only true
```

### 7.2 Configurer le Certificat SSL

```bash
# Certificat managé par Azure (gratuit)
az webapp config ssl bind `
  --resource-group $RESOURCE_GROUP `
  --name $WEB_APP `
  --certificate-thumbprint auto `
  --ssl-type SNI
```

---

## 🔄 Étape 8 : Migration de la Base de Données

### 8.1 Exécuter Prisma Migrate

```bash
# Depuis votre machine locale
$env:DATABASE_URL="postgresql://iapostadmin:PASSWORD@psql-iapostemanager.postgres.database.azure.com:5432/iapostemanage?sslmode=require"

# Générer le client Prisma
npx prisma generate

# Exécuter les migrations
npx prisma migrate deploy

# Seed initial (optionnel)
npx prisma db seed
```

### 8.2 Script de Migration Automatique

Créer `scripts/azure-migrate.ps1` :

```powershell
# Récupérer la DATABASE_URL depuis Azure
$DATABASE_URL = az webapp config appsettings list `
  --resource-group rg-iapostemanager `
  --name app-iapostemanager `
  --query "[?name=='DATABASE_URL'].value" -o tsv

# Exécuter les migrations
$env:DATABASE_URL = $DATABASE_URL
npx prisma migrate deploy

Write-Host "✅ Migrations exécutées avec succès sur Azure"
```

---

## 📈 Étape 9 : Scaling et Performance

### 9.1 Configurer l'Auto-Scaling

```bash
# Règle : Scale out si CPU > 70%
az monitor autoscale create `
  --resource-group $RESOURCE_GROUP `
  --resource $APP_PLAN `
  --resource-type Microsoft.Web/serverfarms `
  --name autoscale-iaposte `
  --min-count 1 `
  --max-count 5 `
  --count 1

az monitor autoscale rule create `
  --resource-group $RESOURCE_GROUP `
  --autoscale-name autoscale-iaposte `
  --condition "Percentage CPU > 70 avg 5m" `
  --scale out 1
```

### 9.2 Configurer le CDN (Optionnel)

```bash
$CDN_PROFILE="cdn-iapostemanager"
$CDN_ENDPOINT="iapostemanager"

# Créer le profil CDN
az cdn profile create `
  --resource-group $RESOURCE_GROUP `
  --name $CDN_PROFILE `
  --sku Standard_Microsoft

# Créer l'endpoint
az cdn endpoint create `
  --resource-group $RESOURCE_GROUP `
  --profile-name $CDN_PROFILE `
  --name $CDN_ENDPOINT `
  --origin $WEB_APP.azurewebsites.net
```

---

## 💰 Étape 10 : Estimation des Coûts

### Environnement Développement (≈ 50-80€/mois)

| Service | SKU | Prix/mois |
|---------|-----|-----------|
| App Service | B1 Basic | ~13€ |
| PostgreSQL | Burstable B1ms | ~15€ |
| Redis | Basic C0 | ~17€ |
| Blob Storage | 10GB Hot | ~0.50€ |
| Application Insights | 5GB/mois | Gratuit |
| **TOTAL** | | **~45€** |

### Environnement Production (≈ 200-300€/mois)

| Service | SKU | Prix/mois |
|---------|-----|-----------|
| App Service | P1V2 Premium | ~75€ |
| PostgreSQL | General Purpose 2vCore | ~120€ |
| Redis | Standard C1 | ~60€ |
| Blob Storage | 100GB Hot | ~5€ |
| CDN | Standard | ~10€ |
| Application Insights | 50GB/mois | ~30€ |
| **TOTAL** | | **~300€** |

---

## 🧪 Étape 11 : Tests Post-Déploiement

### Checklist de Validation

```bash
# 1. Vérifier que l'app est accessible
curl https://app-iapostemanager.azurewebsites.net

# 2. Tester la connexion DB
az webapp ssh --resource-group $RESOURCE_GROUP --name $WEB_APP
# Dans le shell : npx prisma db pull

# 3. Vérifier Redis
# Tester depuis l'app ou via Azure Portal

# 4. Vérifier les logs
az webapp log tail --resource-group $RESOURCE_GROUP --name $WEB_APP

# 5. Tester les endpoints API
curl https://app-iapostemanager.azurewebsites.net/api/health
```

---

## 🔧 Commandes Utiles

### Gestion de l'Application

```bash
# Redémarrer l'app
az webapp restart --resource-group $RESOURCE_GROUP --name $WEB_APP

# Voir les logs
az webapp log tail --resource-group $RESOURCE_GROUP --name $WEB_APP

# SSH dans le conteneur
az webapp ssh --resource-group $RESOURCE_GROUP --name $WEB_APP

# Lister les variables d'environnement
az webapp config appsettings list --resource-group $RESOURCE_GROUP --name $WEB_APP
```

### Backup et Restore

```bash
# Backup PostgreSQL
az postgres flexible-server backup create `
  --resource-group $RESOURCE_GROUP `
  --name $DB_SERVER `
  --backup-name backup-$(Get-Date -Format "yyyyMMdd")

# Lister les backups
az postgres flexible-server backup list `
  --resource-group $RESOURCE_GROUP `
  --name $DB_SERVER
```

---

## 📚 Ressources Supplémentaires

- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [Azure Database for PostgreSQL](https://docs.microsoft.com/azure/postgresql/)
- [Azure Cache for Redis](https://docs.microsoft.com/azure/azure-cache-for-redis/)
- [Next.js on Azure](https://nextjs.org/docs/deployment#azure)
- [Azure Pricing Calculator](https://azure.microsoft.com/pricing/calculator/)

---

## 🎉 Félicitations !

Votre application **IA Poste Manager** est maintenant déployée sur Azure ! 🚀

**URL de production :** https://app-iapostemanager.azurewebsites.net

**Prochaines étapes :**
1. Configurer votre domaine personnalisé
2. Mettre en place le CI/CD avec GitHub Actions
3. Configurer les alertes de monitoring
4. Optimiser les performances avec CDN
5. Planifier les backups automatiques
