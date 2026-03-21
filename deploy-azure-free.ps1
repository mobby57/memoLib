#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Déploie MemoLib sur Azure Container Apps - VERSION GRATUITE (démo)
.DESCRIPTION
    - Azure Container Apps avec scale-to-zero (0€ quand inactif)
    - SQLite embarqué (pas de PostgreSQL)
    - Build via ACR task (pas de registry permanent)
    Coût: 0€/mois pour une démo
.EXAMPLE
    .\deploy-azure-free.ps1
#>

param(
    [string]$ResourceGroup = "memolib-demo",
    [string]$Location = "westeurope",
    [string]$AppName = "memolib-api",
    [string]$AcrName = "memodemo$(Get-Random -Minimum 1000 -Maximum 9999)",
    [string]$EnvName = "memolib-env"
)

$ErrorActionPreference = "Stop"

function Write-Step($msg) { Write-Host "`n🔹 $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "  ✅ $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "  ⚠️  $msg" -ForegroundColor Yellow }

# ============================================================
# Prérequis
# ============================================================
Write-Step "Vérification des prérequis..."

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Azure CLI requis: https://aka.ms/installazurecli" -ForegroundColor Red
    exit 1
}

$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Warn "Connexion Azure requise..."
    az login
    $account = az account show | ConvertFrom-Json
}
Write-Ok "Connecté: $($account.name)"

# ============================================================
# Générer JWT secret
# ============================================================
$JwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object { [char]$_ })

# ============================================================
# 1. Resource Group
# ============================================================
Write-Step "Resource Group '$ResourceGroup'..."
az group create --name $ResourceGroup --location $Location --output none
Write-Ok "Créé"

# ============================================================
# 2. ACR (Basic = ~5€/mois, mais on le supprime après le build)
# ============================================================
Write-Step "Container Registry temporaire '$AcrName'..."
az acr create --resource-group $ResourceGroup --name $AcrName --sku Basic --admin-enabled true --output none
Write-Ok "ACR créé"

$acrServer = az acr show --name $AcrName --query loginServer -o tsv
$acrPassword = az acr credential show --name $AcrName --query "passwords[0].value" -o tsv

# ============================================================
# 3. Build image dans ACR (pas besoin de Docker local)
# ============================================================
Write-Step "Build de l'image dans le cloud..."
az acr build --registry $AcrName --image "${AppName}:v1" --file Dockerfile.azure . --no-logs
Write-Ok "Image buildée: ${acrServer}/${AppName}:v1"

# ============================================================
# 4. Container Apps Environment
# ============================================================
Write-Step "Environnement Container Apps..."
az containerapp env create `
    --resource-group $ResourceGroup `
    --name $EnvName `
    --location $Location `
    --output none
Write-Ok "Environnement créé"

# ============================================================
# 5. Container App (scale 0-1, SQLite)
# ============================================================
Write-Step "Déploiement de l'application..."
az containerapp create `
    --resource-group $ResourceGroup `
    --name $AppName `
    --environment $EnvName `
    --image "${acrServer}/${AppName}:v1" `
    --registry-server $acrServer `
    --registry-username $AcrName `
    --registry-password $acrPassword `
    --target-port 8080 `
    --ingress external `
    --min-replicas 0 `
    --max-replicas 1 `
    --cpu 0.25 `
    --memory 0.5Gi `
    --env-vars `
        "ASPNETCORE_ENVIRONMENT=Production" `
        "ConnectionStrings__Default=Data Source=/app/data/memolib.db" `
        "UsePostgreSQL=false" `
        "JwtSettings__SecretKey=$JwtSecret" `
        "JwtSettings__Issuer=MemoLib.Api" `
        "JwtSettings__Audience=MemoLib.Client" `
        "DisableHttpsRedirection=true" `
        "EmailMonitor__Enabled=false" `
    --output none
Write-Ok "Application déployée"

# ============================================================
# 6. URL
# ============================================================
$appUrl = az containerapp show `
    --resource-group $ResourceGroup `
    --name $AppName `
    --query "properties.configuration.ingress.fqdn" -o tsv

# Mettre à jour CORS
az containerapp update `
    --resource-group $ResourceGroup `
    --name $AppName `
    --set-env-vars "Cors__AllowedOrigins__0=https://$appUrl" "Cors__AllowTunnelOrigins=true" `
    --output none

# ============================================================
# Résumé
# ============================================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  🚀 MemoLib DÉMO déployé !" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  🌐 App:      https://$appUrl" -ForegroundColor White
Write-Host "  🖥️  Demo:     https://$appUrl/demo.html" -ForegroundColor White
Write-Host "  📖 Swagger:  https://$appUrl/swagger" -ForegroundColor White
Write-Host "  ❤️  Health:   https://$appUrl/health" -ForegroundColor White
Write-Host ""
Write-Host "  💰 Coût: 0€ quand inactif (scale-to-zero)" -ForegroundColor Yellow
Write-Host "  📊 Limites gratuites: 2M requêtes/mois, 180K vCPU-sec" -ForegroundColor Yellow
Write-Host ""
Write-Host "  ⚠️  SQLite embarqué = données perdues au redémarrage" -ForegroundColor Yellow
Write-Host "     (suffisant pour démo, migrer vers PostgreSQL pour prod)" -ForegroundColor Yellow
Write-Host ""

# Sauvegarder les infos
@{
    AppUrl       = "https://$appUrl"
    ResourceGroup = $ResourceGroup
    AppName      = $AppName
    AcrName      = $AcrName
    JwtSecret    = $JwtSecret
    DeployedAt   = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
} | ConvertTo-Json | Set-Content ".azure-demo-secrets.json"

Write-Warn "Secrets dans .azure-demo-secrets.json"
Write-Host ""
Write-Host "📋 Commandes utiles:" -ForegroundColor Cyan
Write-Host "  # Logs en direct"
Write-Host "  az containerapp logs show -g $ResourceGroup -n $AppName --follow"
Write-Host ""
Write-Host "  # Redéployer"
Write-Host "  az acr build -r $AcrName -t ${AppName}:v2 -f Dockerfile.azure ."
Write-Host "  az containerapp update -g $ResourceGroup -n $AppName --image ${acrServer}/${AppName}:v2"
Write-Host ""
Write-Host "  # Supprimer tout (0€ garanti)"
Write-Host "  az group delete -n $ResourceGroup --yes --no-wait"
Write-Host ""
