# ============================================
# AZURE STATIC WEB APPS - DEPLOYMENT CLI
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

# Fonctions d'affichage
function Write-Step { param($msg) Write-Host "[*] $msg" -ForegroundColor Cyan }
function Write-Ok { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Err { param($msg) Write-Host "[ERR] $msg" -ForegroundColor Red }

# ============================================
# 1. LOGIN AZURE
# ============================================
if ($Login -or $Full) {
    Write-Step "Connexion a Azure..."
    
    # Verifier si Azure CLI est installe
    if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
        Write-Err "Azure CLI non installe. Installation..."
        winget install Microsoft.AzureCLI
        refreshenv
    }
    
    # Login
    az login
    
    # Afficher les subscriptions
    Write-Host ""
    Write-Host "Subscriptions disponibles:" -ForegroundColor Yellow
    az account list --output table
    
    Write-Ok "Connecte a Azure"
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
        Write-Err "Build echoue"
        exit 1
    }
    
    Write-Ok "Build termine - .next/standalone pret"
}

# ============================================
# 3. DEPLOY TO AZURE SWA
# ============================================
if ($Deploy -or $Full) {
    Write-Step "Deploiement sur Azure Static Web Apps..."
    
    # Verifier si SWA CLI est installe
    if (-not (Get-Command swa -ErrorAction SilentlyContinue)) {
        Write-Step "Installation de SWA CLI..."
        npm install -g @azure/static-web-apps-cli
    }
    
    # Creer le Resource Group si necessaire
    $rgExists = az group exists --name $ResourceGroup
    if ($rgExists -eq "false") {
        Write-Step "Creation du Resource Group: $ResourceGroup..."
        az group create --name $ResourceGroup --location $Location
    }
    
    # Verifier si l'app existe
    $appExists = az staticwebapp list --resource-group $ResourceGroup --query "[?name=='$AppName']" -o tsv
    
    if (-not $appExists) {
        Write-Step "Creation de Azure Static Web App: $AppName..."
        az staticwebapp create `
            --name $AppName `
            --resource-group $ResourceGroup `
            --location $Location `
            --sku Free
    }
    
    # Obtenir le token de deploiement
    Write-Step "Recuperation du token de deploiement..."
    $deploymentToken = az staticwebapp secrets list `
        --name $AppName `
        --resource-group $ResourceGroup `
        --query "properties.apiKey" -o tsv
    
    # Deploy avec SWA CLI
    Write-Step "Deploiement avec SWA CLI..."
    swa deploy .next/standalone `
        --deployment-token $deploymentToken `
        --env production
    
    # Afficher l'URL
    $appUrl = az staticwebapp show `
        --name $AppName `
        --resource-group $ResourceGroup `
        --query "defaultHostname" -o tsv
    
    Write-Ok "Deploiement termine!"
    Write-Host ""
    Write-Host "URL: https://$appUrl" -ForegroundColor Magenta
}

# ============================================
# HELP
# ============================================
if (-not ($Login -or $Build -or $Deploy -or $Full)) {
    Write-Host @"

Azure Static Web Apps - CLI de Deploiement
=============================================

USAGE:
  .\deploy-azure-swa-fixed.ps1 [OPTIONS]

OPTIONS:
  -Login      Connexion a Azure CLI
  -Build      Build Next.js en mode standalone
  -Deploy     Deployer sur Azure SWA
  -Full       Tout faire (Login + Build + Deploy)

PARAMETRES:
  -ResourceGroup  Nom du Resource Group (defaut: iapostemanager-rg)
  -Location       Region Azure (defaut: westeurope)
  -AppName        Nom de l'app (defaut: iapostemanager)

EXEMPLES:
  .\deploy-azure-swa-fixed.ps1 -Full
  .\deploy-azure-swa-fixed.ps1 -Build -Deploy
  .\deploy-azure-swa-fixed.ps1 -Deploy -AppName "my-app"

PREREQUIS:
  - Azure CLI: winget install Microsoft.AzureCLI
  - SWA CLI:   npm install -g @azure/static-web-apps-cli
  - Node.js:   v18 ou superieur

"@
}
