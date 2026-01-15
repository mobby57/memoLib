# Script de Migration Prisma vers Azure
# Exécute les migrations sur la base de données Azure PostgreSQL

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('dev', 'prod')]
    [string]$Environment = 'dev'
)

$ErrorActionPreference = "Stop"

Write-Host "`n🔄 Migration Prisma vers Azure ($Environment)" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Variables
$RESOURCE_GROUP = "rg-iapostemanager-$Environment"
$WEB_APP = "app-iapostemanager-$Environment"

# Vérifier Azure CLI
try {
    az --version | Out-Null
} catch {
    Write-Host "❌ Azure CLI n'est pas installé" -ForegroundColor Red
    exit 1
}

# Récupérer la DATABASE_URL depuis Azure
Write-Host "📡 Récupération de la DATABASE_URL depuis Azure..." -ForegroundColor Yellow

try {
    $DATABASE_URL = az webapp config appsettings list `
        --resource-group $RESOURCE_GROUP `
        --name $WEB_APP `
        --query "[?name=='DATABASE_URL'].value" -o tsv
    
    if (-not $DATABASE_URL) {
        throw "DATABASE_URL non trouvée"
    }
    
    Write-Host "✅ DATABASE_URL récupérée" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors de la récupération de DATABASE_URL" -ForegroundColor Red
    Write-Host "Vérifiez que l'application est déployée sur Azure" -ForegroundColor Yellow
    exit 1
}

# Définir la variable d'environnement
$env:DATABASE_URL = $DATABASE_URL

# Générer le client Prisma
Write-Host "`n🔨 Génération du client Prisma..." -ForegroundColor Yellow
try {
    npx prisma generate
    Write-Host "✅ Client Prisma généré" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors de la génération du client Prisma" -ForegroundColor Red
    exit 1
}

# Exécuter les migrations
Write-Host "`n🚀 Exécution des migrations..." -ForegroundColor Yellow
try {
    npx prisma migrate deploy
    Write-Host "✅ Migrations exécutées avec succès" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors de l'exécution des migrations" -ForegroundColor Red
    exit 1
}

# Optionnel : Seed
$seed = Read-Host "`n❓ Voulez-vous exécuter le seed initial ? (y/N)"
if ($seed -eq 'y' -or $seed -eq 'Y') {
    Write-Host "`n🌱 Exécution du seed..." -ForegroundColor Yellow
    try {
        npx prisma db seed
        Write-Host "✅ Seed exécuté avec succès" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Erreur lors du seed (peut être normal si déjà exécuté)" -ForegroundColor Yellow
    }
}

Write-Host "`n✨ Migration terminée avec succès !`n" -ForegroundColor Cyan
