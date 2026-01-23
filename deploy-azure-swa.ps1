# ============================================
# 🚀 AZURE STATIC WEB APPS - DEPLOYMENT CLI
# IA Poste Manager - Next.js Hybrid
# ============================================

param(
    [switch]$Login,
    [switch]$Build,
    [switch]$Deploy,
    [switch]$Full,
    [string]$ResourceGroup = "iapostemanager-rg",
    [string]$Location = "westeurope",
    [string]$AppName = "iapostemanager"
)

$ErrorActionPreference = "Stop"

# Couleurs
function Write-Step { param($msg) Write-Host "🔷 $msg" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }

# ============================================
# 1. LOGIN AZURE
# ============================================
if ($Login -or $Full) {
    Write-Step "Connexion à Azure..."
    
    # Vérifier si Azure CLI est installé
    if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
        Write-Error "Azure CLI non installé. Installation..."
        winget install Microsoft.AzureCLI
        refreshenv
    }
    
    # Login
    az login
    
    # Afficher les subscriptions
    Write-Host "`n📋 Subscriptions disponibles:" -ForegroundColor Yellow
    az account list --output table
    
    Write-Success "Connecté à Azure"
}

# ============================================
# 2. BUILD NEXT.JS
# ============================================
if ($Build -or $Full) {
    Write-Step "Build Next.js (standalone)..."
    
    # Clean
    if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
    
    # Install dependencies
    npm ci --prefer-offline
    
    # Build
    $env:NODE_ENV = "production"
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build échoué"
        exit 1
    }
    
    Write-Success "Build terminé - .next/standalone prêt"
}

# ============================================
# 3. DEPLOY TO AZURE SWA
# ============================================
if ($Deploy -or $Full) {
    Write-Step "Déploiement sur Azure Static Web Apps..."
    
    # Vérifier si SWA CLI est installé
    if (-not (Get-Command swa -ErrorAction SilentlyContinue)) {
        Write-Step "Installation de SWA CLI..."
        npm install -g @azure/static-web-apps-cli
    }
    
    # Créer le Resource Group si nécessaire
    $rgExists = az group exists --name $ResourceGroup
    if ($rgExists -eq "false") {
        Write-Step "Création du Resource Group: $ResourceGroup..."
        az group create --name $ResourceGroup --location $Location
    }
    
    # Vérifier si l'app existe
    $appExists = az staticwebapp list --resource-group $ResourceGroup --query "[?name=='$AppName']" -o tsv
    
    if (-not $appExists) {
        Write-Step "Création de Azure Static Web App: $AppName..."
        az staticwebapp create `
            --name $AppName `
            --resource-group $ResourceGroup `
            --location $Location `
            --sku Free
    }
    
    # Obtenir le token de déploiement
    Write-Step "Récupération du token de déploiement..."
    $deploymentToken = az staticwebapp secrets list `
        --name $AppName `
        --resource-group $ResourceGroup `
        --query "properties.apiKey" -o tsv
    
    # Deploy avec SWA CLI
    Write-Step "Déploiement avec SWA CLI..."
    swa deploy .next/standalone `
        --deployment-token $deploymentToken `
        --env production
    
    # Afficher l'URL
    $appUrl = az staticwebapp show `
        --name $AppName `
        --resource-group $ResourceGroup `
        --query "defaultHostname" -o tsv
    
    Write-Success "Déploiement terminé!"
    Write-Host "`n🌐 URL: https://$appUrl" -ForegroundColor Magenta
}

# ============================================
# HELP
# ============================================
if (-not ($Login -or $Build -or $Deploy -or $Full)) {
    Write-Host @"

🚀 Azure Static Web Apps - CLI de Déploiement
=============================================

USAGE:
  .\deploy-azure-swa.ps1 [OPTIONS]

OPTIONS:
  -Login      Connexion à Azure CLI
  -Build      Build Next.js en mode standalone
  -Deploy     Déployer sur Azure SWA
  -Full       Tout faire (Login + Build + Deploy)

PARAMÈTRES:
  -ResourceGroup  Nom du Resource Group (défaut: iapostemanager-rg)
  -Location       Région Azure (défaut: westeurope)
  -AppName        Nom de l'app (défaut: iapostemanager)

EXEMPLES:
  .\deploy-azure-swa.ps1 -Full
  .\deploy-azure-swa.ps1 -Build -Deploy
  .\deploy-azure-swa.ps1 -Deploy -AppName "my-app"

PRÉREQUIS:
  - Azure CLI: winget install Microsoft.AzureCLI
  - SWA CLI:   npm install -g @azure/static-web-apps-cli
  - Node.js:   v18 ou supérieur

"@
}
