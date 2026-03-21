#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Déploie MemoLib sur Azure Container Apps (serverless, pay-per-use, scale-to-zero)
.DESCRIPTION
    Crée toutes les ressources Azure nécessaires :
    - Resource Group
    - Azure Container Registry (ACR)
    - Azure Container Apps Environment
    - Azure Database for PostgreSQL Flexible Server
    - Azure Container App (avec secrets)
.EXAMPLE
    .\deploy-azure.ps1
    .\deploy-azure.ps1 -ResourceGroup "memolib-prod" -Location "westeurope"
#>

param(
    [string]$ResourceGroup = "memolib-rg",
    [string]$Location = "westeurope",
    [string]$AppName = "memolib-api",
    [string]$AcrName = "memolibacr",
    [string]$EnvName = "memolib-env",
    [string]$PostgresServer = "memolib-pg",
    [string]$PostgresDb = "memolib",
    [string]$PostgresAdmin = "memolibadmin",
    [string]$JwtSecret = "",
    [switch]$SkipPostgres,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# ============================================================
# Couleurs
# ============================================================
function Write-Step($msg) { Write-Host "`n🔹 $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "  ✅ $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "  ⚠️  $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "  ❌ $msg" -ForegroundColor Red }

# ============================================================
# Prérequis
# ============================================================
Write-Step "Vérification des prérequis..."

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Err "Azure CLI non installé. https://aka.ms/installazurecli"
    exit 1
}
Write-Ok "Azure CLI trouvé"

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Err "Docker non installé."
    exit 1
}
Write-Ok "Docker trouvé"

# Vérifier connexion Azure
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Warn "Non connecté à Azure. Lancement de 'az login'..."
    az login
    $account = az account show | ConvertFrom-Json
}
Write-Ok "Connecté à Azure: $($account.name) ($($account.id))"

# ============================================================
# Générer secrets si non fournis
# ============================================================
if (-not $JwtSecret) {
    $JwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
    Write-Warn "JWT Secret généré automatiquement (conservez-le !)"
}

$PostgresPassword = -join ((65..90) + (97..122) + (48..57) + (33, 35, 36, 37, 38) | Get-Random -Count 24 | ForEach-Object { [char]$_ })

# ============================================================
# 1. Resource Group
# ============================================================
Write-Step "Création du Resource Group '$ResourceGroup'..."
az group create --name $ResourceGroup --location $Location --output none
Write-Ok "Resource Group créé"

# ============================================================
# 2. Azure Container Registry
# ============================================================
Write-Step "Création de l'Azure Container Registry '$AcrName'..."
az acr create --resource-group $ResourceGroup --name $AcrName --sku Basic --admin-enabled true --output none
Write-Ok "ACR créé"

$acrLoginServer = az acr show --name $AcrName --query loginServer -o tsv
$acrPassword = az acr credential show --name $AcrName --query "passwords[0].value" -o tsv
Write-Ok "ACR Login Server: $acrLoginServer"

# ============================================================
# 3. Build & Push Docker Image
# ============================================================
if (-not $SkipBuild) {
    Write-Step "Build et push de l'image Docker..."
    
    az acr login --name $AcrName
    
    $imageTag = "$acrLoginServer/${AppName}:$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    $imageLatest = "$acrLoginServer/${AppName}:latest"
    
    docker build -f Dockerfile.azure -t $imageTag -t $imageLatest .
    docker push $imageTag
    docker push $imageLatest
    
    Write-Ok "Image poussée: $imageTag"
} else {
    $imageLatest = "$acrLoginServer/${AppName}:latest"
    Write-Warn "Build ignoré, utilisation de $imageLatest"
}

# ============================================================
# 4. PostgreSQL Flexible Server
# ============================================================
$pgConnectionString = ""

if (-not $SkipPostgres) {
    Write-Step "Création de PostgreSQL Flexible Server '$PostgresServer'..."
    
    az postgres flexible-server create `
        --resource-group $ResourceGroup `
        --name $PostgresServer `
        --location $Location `
        --admin-user $PostgresAdmin `
        --admin-password $PostgresPassword `
        --sku-name Standard_B1ms `
        --tier Burstable `
        --storage-size 32 `
        --version 16 `
        --yes `
        --output none
    
    Write-Ok "PostgreSQL créé"
    
    # Autoriser les services Azure
    az postgres flexible-server firewall-rule create `
        --resource-group $ResourceGroup `
        --name $PostgresServer `
        --rule-name AllowAzureServices `
        --start-ip-address 0.0.0.0 `
        --end-ip-address 0.0.0.0 `
        --output none
    
    # Créer la base de données
    az postgres flexible-server db create `
        --resource-group $ResourceGroup `
        --server-name $PostgresServer `
        --database-name $PostgresDb `
        --output none
    
    $pgHost = az postgres flexible-server show --resource-group $ResourceGroup --name $PostgresServer --query fullyQualifiedDomainName -o tsv
    $pgConnectionString = "Host=$pgHost;Database=$PostgresDb;Username=$PostgresAdmin;Password=$PostgresPassword;SSL Mode=Require;Trust Server Certificate=true"
    
    Write-Ok "PostgreSQL prêt: $pgHost"
} else {
    Write-Warn "PostgreSQL ignoré. Définissez ConnectionStrings__Default manuellement."
    $pgConnectionString = "Data Source=/app/data/memolib.db"
}

# ============================================================
# 5. Container Apps Environment
# ============================================================
Write-Step "Création de l'environnement Container Apps '$EnvName'..."
az containerapp env create `
    --resource-group $ResourceGroup `
    --name $EnvName `
    --location $Location `
    --output none
Write-Ok "Environnement créé"

# ============================================================
# 6. Container App
# ============================================================
Write-Step "Déploiement de l'application '$AppName'..."

az containerapp create `
    --resource-group $ResourceGroup `
    --name $AppName `
    --environment $EnvName `
    --image $imageLatest `
    --registry-server $acrLoginServer `
    --registry-username $AcrName `
    --registry-password $acrPassword `
    --target-port 8080 `
    --ingress external `
    --min-replicas 0 `
    --max-replicas 3 `
    --cpu 0.5 `
    --memory 1.0Gi `
    --env-vars `
        "ASPNETCORE_ENVIRONMENT=Production" `
        "ConnectionStrings__Default=$pgConnectionString" `
        "UsePostgreSQL=$(-not $SkipPostgres)" `
        "JwtSettings__SecretKey=$JwtSecret" `
        "JwtSettings__Issuer=MemoLib.Api" `
        "JwtSettings__Audience=MemoLib.Client" `
        "DisableHttpsRedirection=true" `
    --output none

Write-Ok "Application déployée"

# ============================================================
# 7. Récupérer l'URL
# ============================================================
Write-Step "Récupération de l'URL..."
$appUrl = az containerapp show `
    --resource-group $ResourceGroup `
    --name $AppName `
    --query "properties.configuration.ingress.fqdn" -o tsv

# ============================================================
# 8. Mettre à jour CORS avec l'URL réelle
# ============================================================
Write-Step "Mise à jour CORS..."
az containerapp update `
    --resource-group $ResourceGroup `
    --name $AppName `
    --set-env-vars "Cors__AllowedOrigins__0=https://$appUrl" `
    --output none
Write-Ok "CORS configuré"

# ============================================================
# Résumé
# ============================================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  🚀 MemoLib déployé sur Azure Container Apps !" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  🌐 URL:        https://$appUrl" -ForegroundColor White
Write-Host "  📖 Swagger:    https://$appUrl/swagger" -ForegroundColor White
Write-Host "  ❤️  Health:     https://$appUrl/health" -ForegroundColor White
Write-Host "  🖥️  Interface:  https://$appUrl/demo.html" -ForegroundColor White
Write-Host ""
Write-Host "  📊 Resource Group:  $ResourceGroup" -ForegroundColor Gray
Write-Host "  🐳 Registry:        $acrLoginServer" -ForegroundColor Gray
Write-Host "  🐘 PostgreSQL:      $PostgresServer" -ForegroundColor Gray
Write-Host ""
Write-Host "  💰 Coût estimé: ~15-30€/mois (scale-to-zero quand inactif)" -ForegroundColor Yellow
Write-Host ""

# Sauvegarder les secrets
$secretsFile = ".azure-secrets.json"
@{
    ResourceGroup    = $ResourceGroup
    AppName          = $AppName
    AppUrl           = "https://$appUrl"
    AcrName          = $AcrName
    AcrLoginServer   = $acrLoginServer
    PostgresServer   = $PostgresServer
    PostgresHost     = if ($pgHost) { $pgHost } else { "N/A" }
    PostgresDb       = $PostgresDb
    PostgresAdmin    = $PostgresAdmin
    PostgresPassword = $PostgresPassword
    JwtSecret        = $JwtSecret
    DeployedAt       = (Get-Date -Format "yyyy-MM-dd HH:mm:ss UTC")
} | ConvertTo-Json | Set-Content $secretsFile

Write-Warn "Secrets sauvegardés dans $secretsFile (NE PAS COMMITTER !)"
Write-Host ""

# ============================================================
# Commandes utiles
# ============================================================
Write-Host "📋 Commandes utiles:" -ForegroundColor Cyan
Write-Host "  # Voir les logs"
Write-Host "  az containerapp logs show -g $ResourceGroup -n $AppName --follow"
Write-Host ""
Write-Host "  # Redéployer après modification"
Write-Host "  az acr build -r $AcrName -t ${AppName}:latest -f Dockerfile.azure ."
Write-Host "  az containerapp update -g $ResourceGroup -n $AppName --image $acrLoginServer/${AppName}:latest"
Write-Host ""
Write-Host "  # Scaler manuellement"
Write-Host "  az containerapp update -g $ResourceGroup -n $AppName --min-replicas 1 --max-replicas 5"
Write-Host ""
Write-Host "  # Supprimer tout"
Write-Host "  az group delete -n $ResourceGroup --yes --no-wait"
Write-Host ""
