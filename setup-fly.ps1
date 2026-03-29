#!/usr/bin/env pwsh
# Configuration rapide Fly.io pour MemoLib

Write-Host "🚀 Configuration Fly.io - MemoLib" -ForegroundColor Cyan
Write-Host "==================================`n" -ForegroundColor Cyan

# Vérifier si fly CLI est installé
try {
    $flyVersion = fly version 2>&1
    Write-Host "✅ Fly CLI détecté: $flyVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Fly CLI non installé. Installez-le depuis: https://fly.io/docs/hands-on/install-flyctl/" -ForegroundColor Red
    exit 1
}

# DATABASE_URL a definir via variable d'environnement locale
$databaseUrl = "postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"

Write-Host "`n📋 Étapes de configuration:" -ForegroundColor Yellow
Write-Host "1. Configurer DATABASE_URL"
Write-Host "2. Configurer NEXTAUTH_SECRET"
Write-Host "3. Configurer NEXTAUTH_URL"
Write-Host "4. Lister les secrets"
Write-Host "5. Déployer l'application`n"

# 1. DATABASE_URL
Write-Host "🔧 Configuration DATABASE_URL..." -ForegroundColor Cyan
fly secrets set DATABASE_URL="$databaseUrl" --app memolib

# 2. NEXTAUTH_SECRET
Write-Host "🔧 Configuration NEXTAUTH_SECRET..." -ForegroundColor Cyan
fly secrets set NEXTAUTH_SECRET="super-secret-key-for-iapostemanager-2026-change-in-production" --app memolib

# 3. NEXTAUTH_URL
Write-Host "🔧 Configuration NEXTAUTH_URL..." -ForegroundColor Cyan
fly secrets set NEXTAUTH_URL="https://memolib.fly.dev" --app memolib

# 4. Lister les secrets
Write-Host "`n📋 Secrets configurés:" -ForegroundColor Green
fly secrets list --app memolib

# 5. Proposer le déploiement
Write-Host "`n🚀 Prêt à déployer!" -ForegroundColor Green
$deploy = Read-Host "Voulez-vous déployer maintenant? (o/n)"

if ($deploy -eq "o" -or $deploy -eq "O") {
    Write-Host "`n🚀 Déploiement en cours..." -ForegroundColor Cyan
    fly deploy --app memolib
    
    Write-Host "`n✅ Déploiement terminé!" -ForegroundColor Green
    Write-Host "🌐 Ouvrir l'application: fly open --app memolib" -ForegroundColor Cyan
    Write-Host "📊 Voir les logs: fly logs --app memolib" -ForegroundColor Cyan
} else {
    Write-Host "`n⏸️  Déploiement annulé. Pour déployer plus tard:" -ForegroundColor Yellow
    Write-Host "   fly deploy --app memolib" -ForegroundColor White
}
