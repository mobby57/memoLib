# ☁️ Script de Déploiement Automatique Azure
# IA Poste Manager - Déploiement Infrastructure Complète

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('dev', 'prod')]
    [string]$Environment = 'dev',
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipInfrastructure,
    
    [Parameter(Mandatory=$false)]
    [switch]$DeployAppOnly
)

# ============================================
# CONFIGURATION
# ============================================

$ErrorActionPreference = "Stop"

# Variables communes
$RESOURCE_GROUP = "rg-iapostemanager-$Environment"
$LOCATION = "francecentral"
$SUBSCRIPTION = "" # Laisser vide pour utiliser la subscription par défaut

# Noms des ressources
$APP_PLAN = "asp-iapostemanager-$Environment"
$WEB_APP = "app-iapostemanager-$Environment"
$DB_SERVER = "psql-iapostemanager-$Environment"
$DB_NAME = "iapostemanage"
$REDIS_NAME = "redis-iapostemanager-$Environment"
$STORAGE_NAME = "stiaposte$Environment"
$KEYVAULT_NAME = "kv-iaposte-$Environment"
$APPINSIGHTS_NAME = "appi-iapostemanager-$Environment"

# Configuration par environnement
if ($Environment -eq 'prod') {
    $APP_SERVICE_SKU = "P1V2"
    $DB_SKU = "Standard_D2s_v3"
    $DB_TIER = "GeneralPurpose"
    $REDIS_SKU = "Standard"
    $REDIS_SIZE = "C1"
} else {
    $APP_SERVICE_SKU = "B1"
    $DB_SKU = "Standard_B1ms"
    $DB_TIER = "Burstable"
    $REDIS_SKU = "Basic"
    $REDIS_SIZE = "C0"
}

# ============================================
# FONCTIONS UTILITAIRES
# ============================================

function Write-Step {
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Test-AzureCLI {
    try {
        az --version | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Generate-Password {
    $length = 20
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%"
    $password = -join ((1..$length) | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })
    return $password
}

# ============================================
# VÉRIFICATIONS PRÉALABLES
# ============================================

Write-Step "Vérifications préalables"

# Vérifier Azure CLI
if (-not (Test-AzureCLI)) {
    Write-Error-Custom "Azure CLI n'est pas installé"
    Write-Host "Installez-le avec: winget install -e --id Microsoft.AzureCLI"
    exit 1
}
Write-Success "Azure CLI installé"

# Vérifier la connexion Azure
try {
    $account = az account show 2>$null | ConvertFrom-Json
    Write-Success "Connecté à Azure (Subscription: $($account.name))"
} catch {
    Write-Warning-Custom "Non connecté à Azure"
    Write-Host "Connexion en cours..."
    az login
}

# Définir la subscription si spécifiée
if ($SUBSCRIPTION) {
    az account set --subscription $SUBSCRIPTION
    Write-Success "Subscription définie: $SUBSCRIPTION"
}

# ============================================
# CRÉATION DU RESOURCE GROUP
# ============================================

if (-not $DeployAppOnly) {
    Write-Step "Création du Resource Group"
    
    $rgExists = az group exists --name $RESOURCE_GROUP
    if ($rgExists -eq "true") {
        Write-Warning-Custom "Resource Group '$RESOURCE_GROUP' existe déjà"
    } else {
        az group create --name $RESOURCE_GROUP --location $LOCATION | Out-Null
        Write-Success "Resource Group créé: $RESOURCE_GROUP"
    }
}

# ============================================
# DÉPLOIEMENT POSTGRESQL
# ============================================

if (-not $SkipInfrastructure -and -not $DeployAppOnly) {
    Write-Step "Déploiement PostgreSQL Flexible Server"
    
    $dbExists = az postgres flexible-server show --resource-group $RESOURCE_GROUP --name $DB_SERVER 2>$null
    
    if ($dbExists) {
        Write-Warning-Custom "PostgreSQL Server '$DB_SERVER' existe déjà"
    } else {
        $DB_ADMIN = "iapostadmin"
        $DB_PASSWORD = Generate-Password
        
        Write-Host "Création du serveur PostgreSQL (cela peut prendre 5-10 minutes)..."
        
        az postgres flexible-server create `
            --resource-group $RESOURCE_GROUP `
            --name $DB_SERVER `
            --location $LOCATION `
            --admin-user $DB_ADMIN `
            --admin-password $DB_PASSWORD `
            --sku-name $DB_SKU `
            --tier $DB_TIER `
            --version 16 `
            --storage-size 32 `
            --public-access 0.0.0.0 `
            --yes | Out-Null
        
        Write-Success "PostgreSQL Server créé"
        
        # Créer la base de données
        az postgres flexible-server db create `
            --resource-group $RESOURCE_GROUP `
            --server-name $DB_SERVER `
            --database-name $DB_NAME | Out-Null
        
        Write-Success "Base de données '$DB_NAME' créée"
        
        # Configurer le firewall
        az postgres flexible-server firewall-rule create `
            --resource-group $RESOURCE_GROUP `
            --name $DB_SERVER `
            --rule-name AllowAzureServices `
            --start-ip-address 0.0.0.0 `
            --end-ip-address 0.0.0.0 | Out-Null
        
        Write-Success "Firewall configuré"
        
        # Sauvegarder les credentials
        $credsFile = "azure-credentials-$Environment.txt"
        @"
PostgreSQL Credentials
======================
Server: $DB_SERVER.postgres.database.azure.com
Database: $DB_NAME
Admin User: $DB_ADMIN
Password: $DB_PASSWORD

Connection String:
postgresql://${DB_ADMIN}:${DB_PASSWORD}@${DB_SERVER}.postgres.database.azure.com:5432/${DB_NAME}?sslmode=require
"@ | Out-File -FilePath $credsFile
        
        Write-Success "Credentials sauvegardés dans: $credsFile"
    }
}

# ============================================
# DÉPLOIEMENT REDIS
# ============================================

if (-not $SkipInfrastructure -and -not $DeployAppOnly) {
    Write-Step "Déploiement Azure Cache for Redis"
    
    $redisExists = az redis show --resource-group $RESOURCE_GROUP --name $REDIS_NAME 2>$null
    
    if ($redisExists) {
        Write-Warning-Custom "Redis Cache '$REDIS_NAME' existe déjà"
    } else {
        Write-Host "Création du Redis Cache (cela peut prendre 10-15 minutes)..."
        
        az redis create `
            --resource-group $RESOURCE_GROUP `
            --name $REDIS_NAME `
            --location $LOCATION `
            --sku $REDIS_SKU `
            --vm-size $REDIS_SIZE `
            --enable-non-ssl-port false | Out-Null
        
        Write-Success "Redis Cache créé"
        
        # Récupérer les clés
        $redisKeys = az redis list-keys --resource-group $RESOURCE_GROUP --name $REDIS_NAME | ConvertFrom-Json
        $redisHost = az redis show --resource-group $RESOURCE_GROUP --name $REDIS_NAME --query "hostName" -o tsv
        
        # Sauvegarder les credentials
        $credsFile = "azure-credentials-$Environment.txt"
        @"

Redis Credentials
=================
Host: $redisHost
Port: 6380 (SSL)
Primary Key: $($redisKeys.primaryKey)

Connection String:
rediss://:$($redisKeys.primaryKey)@${redisHost}:6380
"@ | Out-File -FilePath $credsFile -Append
        
        Write-Success "Redis credentials sauvegardés"
    }
}

# ============================================
# DÉPLOIEMENT BLOB STORAGE
# ============================================

if (-not $SkipInfrastructure -and -not $DeployAppOnly) {
    Write-Step "Déploiement Blob Storage"
    
    $storageExists = az storage account show --resource-group $RESOURCE_GROUP --name $STORAGE_NAME 2>$null
    
    if ($storageExists) {
        Write-Warning-Custom "Storage Account '$STORAGE_NAME' existe déjà"
    } else {
        az storage account create `
            --resource-group $RESOURCE_GROUP `
            --name $STORAGE_NAME `
            --location $LOCATION `
            --sku Standard_LRS `
            --kind StorageV2 `
            --access-tier Hot | Out-Null
        
        Write-Success "Storage Account créé"
        
        # Créer les conteneurs
        $storageKey = az storage account keys list --resource-group $RESOURCE_GROUP --account-name $STORAGE_NAME --query "[0].value" -o tsv
        
        az storage container create `
            --account-name $STORAGE_NAME `
            --account-key $storageKey `
            --name documents `
            --public-access off | Out-Null
        
        az storage container create `
            --account-name $STORAGE_NAME `
            --account-key $storageKey `
            --name archives `
            --public-access off | Out-Null
        
        Write-Success "Conteneurs créés: documents, archives"
        
        # Récupérer la connection string
        $storageConnString = az storage account show-connection-string --resource-group $RESOURCE_GROUP --name $STORAGE_NAME --query "connectionString" -o tsv
        
        # Sauvegarder
        $credsFile = "azure-credentials-$Environment.txt"
        @"

Storage Credentials
===================
Account Name: $STORAGE_NAME
Connection String: $storageConnString
"@ | Out-File -FilePath $credsFile -Append
        
        Write-Success "Storage credentials sauvegardés"
    }
}

# ============================================
# DÉPLOIEMENT KEY VAULT
# ============================================

if (-not $SkipInfrastructure -and -not $DeployAppOnly) {
    Write-Step "Déploiement Key Vault"
    
    $kvExists = az keyvault show --resource-group $RESOURCE_GROUP --name $KEYVAULT_NAME 2>$null
    
    if ($kvExists) {
        Write-Warning-Custom "Key Vault '$KEYVAULT_NAME' existe déjà"
    } else {
        az keyvault create `
            --resource-group $RESOURCE_GROUP `
            --name $KEYVAULT_NAME `
            --location $LOCATION `
            --enable-rbac-authorization false | Out-Null
        
        Write-Success "Key Vault créé"
    }
}

# ============================================
# DÉPLOIEMENT APPLICATION INSIGHTS
# ============================================

if (-not $SkipInfrastructure -and -not $DeployAppOnly) {
    Write-Step "Déploiement Application Insights"
    
    $appInsightsExists = az monitor app-insights component show --app $APPINSIGHTS_NAME --resource-group $RESOURCE_GROUP 2>$null
    
    if ($appInsightsExists) {
        Write-Warning-Custom "Application Insights '$APPINSIGHTS_NAME' existe déjà"
    } else {
        az monitor app-insights component create `
            --app $APPINSIGHTS_NAME `
            --location $LOCATION `
            --resource-group $RESOURCE_GROUP `
            --application-type web | Out-Null
        
        Write-Success "Application Insights créé"
    }
}

# ============================================
# DÉPLOIEMENT APP SERVICE
# ============================================

Write-Step "Déploiement App Service"

# Créer App Service Plan
$planExists = az appservice plan show --resource-group $RESOURCE_GROUP --name $APP_PLAN 2>$null

if ($planExists) {
    Write-Warning-Custom "App Service Plan '$APP_PLAN' existe déjà"
} else {
    az appservice plan create `
        --resource-group $RESOURCE_GROUP `
        --name $APP_PLAN `
        --location $LOCATION `
        --sku $APP_SERVICE_SKU `
        --is-linux | Out-Null
    
    Write-Success "App Service Plan créé"
}

# Créer Web App
$webAppExists = az webapp show --resource-group $RESOURCE_GROUP --name $WEB_APP 2>$null

if ($webAppExists) {
    Write-Warning-Custom "Web App '$WEB_APP' existe déjà"
} else {
    az webapp create `
        --resource-group $RESOURCE_GROUP `
        --plan $APP_PLAN `
        --name $WEB_APP `
        --runtime "NODE:20-lts" | Out-Null
    
    Write-Success "Web App créée"
}

# ============================================
# CONFIGURATION DES VARIABLES D'ENVIRONNEMENT
# ============================================

Write-Step "Configuration des variables d'environnement"

# Récupérer les connection strings
$dbHost = "$DB_SERVER.postgres.database.azure.com"
$redisHost = az redis show --resource-group $RESOURCE_GROUP --name $REDIS_NAME --query "hostName" -o tsv 2>$null
$redisKey = az redis list-keys --resource-group $RESOURCE_GROUP --name $REDIS_NAME --query "primaryKey" -o tsv 2>$null
$storageConnString = az storage account show-connection-string --resource-group $RESOURCE_GROUP --name $STORAGE_NAME --query "connectionString" -o tsv 2>$null
$appInsightsKey = az monitor app-insights component show --app $APPINSIGHTS_NAME --resource-group $RESOURCE_GROUP --query "instrumentationKey" -o tsv 2>$null

# Générer NEXTAUTH_SECRET si nécessaire
$nextAuthSecret = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((Generate-Password)))

# Lire les credentials depuis le fichier
$credsFile = "azure-credentials-$Environment.txt"
if (Test-Path $credsFile) {
    $credsContent = Get-Content $credsFile -Raw
    if ($credsContent -match "Password: (.+)") {
        $DB_PASSWORD = $matches[1].Trim()
    }
    if ($credsContent -match "Admin User: (.+)") {
        $DB_ADMIN = $matches[1].Trim()
    }
}

$DATABASE_URL = "postgresql://${DB_ADMIN}:${DB_PASSWORD}@${dbHost}:5432/${DB_NAME}?sslmode=require"
$REDIS_URL = "rediss://:${redisKey}@${redisHost}:6380"

# Configurer les app settings
az webapp config appsettings set `
    --resource-group $RESOURCE_GROUP `
    --name $WEB_APP `
    --settings `
        DATABASE_URL="$DATABASE_URL" `
        REDIS_URL="$REDIS_URL" `
        REDIS_ENABLED="true" `
        NEXTAUTH_URL="https://${WEB_APP}.azurewebsites.net" `
        NEXTAUTH_SECRET="$nextAuthSecret" `
        AZURE_STORAGE_CONNECTION_STRING="$storageConnString" `
        APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=$appInsightsKey" `
        WEBSITE_NODE_DEFAULT_VERSION="20.x" `
        SCM_DO_BUILD_DURING_DEPLOYMENT="true" | Out-Null

Write-Success "Variables d'environnement configurées"

# ============================================
# ACTIVER MANAGED IDENTITY
# ============================================

Write-Step "Configuration Managed Identity"

az webapp identity assign --resource-group $RESOURCE_GROUP --name $WEB_APP | Out-Null
$principalId = az webapp identity show --resource-group $RESOURCE_GROUP --name $WEB_APP --query "principalId" -o tsv

# Donner accès au Key Vault
az keyvault set-policy `
    --name $KEYVAULT_NAME `
    --object-id $principalId `
    --secret-permissions get list | Out-Null

Write-Success "Managed Identity configurée"

# ============================================
# ACTIVER HTTPS ONLY
# ============================================

az webapp update --resource-group $RESOURCE_GROUP --name $WEB_APP --https-only true | Out-Null
Write-Success "HTTPS obligatoire activé"

# ============================================
# CONFIGURER LES LOGS
# ============================================

Write-Step "Configuration des logs"

az webapp log config `
    --resource-group $RESOURCE_GROUP `
    --name $WEB_APP `
    --application-logging filesystem `
    --detailed-error-messages true `
    --failed-request-tracing true `
    --web-server-logging filesystem | Out-Null

Write-Success "Logs configurés"

# ============================================
# RÉSUMÉ
# ============================================

Write-Step "Déploiement terminé !"

Write-Host @"

🎉 Déploiement Azure réussi !
==============================

Environnement: $Environment
Resource Group: $RESOURCE_GROUP
Location: $LOCATION

📦 Ressources créées:
  ✅ App Service: $WEB_APP
  ✅ PostgreSQL: $DB_SERVER
  ✅ Redis: $REDIS_NAME
  ✅ Storage: $STORAGE_NAME
  ✅ Key Vault: $KEYVAULT_NAME
  ✅ App Insights: $APPINSIGHTS_NAME

🌐 URL de l'application:
  https://${WEB_APP}.azurewebsites.net

📝 Credentials sauvegardés dans:
  $credsFile

🚀 Prochaines étapes:
  1. Déployer le code: git push azure main
  2. Exécuter les migrations: .\scripts\azure-migrate.ps1
  3. Configurer un domaine personnalisé (optionnel)
  4. Mettre en place le CI/CD avec GitHub Actions

📊 Voir les logs:
  az webapp log tail --resource-group $RESOURCE_GROUP --name $WEB_APP

"@ -ForegroundColor Green

Write-Host "`n✨ Déploiement terminé avec succès !`n" -ForegroundColor Cyan
