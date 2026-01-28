# 🔧 FIX EVERYTHING NOW - Script de Réparation Automatique
# Nettoie et relance l'application Next.js

Write-Host "🔧 RÉPARATION AUTOMATIQUE - IA POSTE MANAGER" -ForegroundColor Cyan
Write-Host ""

# Étape 1: Arrêter tous les processus Node.js
Write-Host "[1/5] Arrêt des processus Node.js..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Étape 2: Nettoyer le build
Write-Host "[2/5] Nettoyage du build..." -ForegroundColor Yellow
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
if (Test-Path "node_modules\.cache") { Remove-Item -Recurse -Force "node_modules\.cache" }

# Étape 3: Générer Prisma Client
Write-Host "[3/5] Génération du client Prisma..." -ForegroundColor Yellow
npx prisma generate

# Étape 4: Vérifier la base de données
Write-Host "[4/5] Vérification de la base de données..." -ForegroundColor Yellow
if (-not (Test-Path "prisma\dev.db")) {
    Write-Host "⚠️  Base de données manquante - Création..." -ForegroundColor Yellow
    npx prisma db push
}
Write-Host "✅ Base de données prête" -ForegroundColor Green

# Étape 5: Lancer le serveur de développement
Write-Host "[5/5] Lancement du serveur..." -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ RÉPARATION TERMINÉE!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Démarrage du serveur sur http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Comptes de démo disponibles:" -ForegroundColor Cyan
Write-Host "   👑 Super Admin: superadmin@memoLib.com / SuperAdmin123!" -ForegroundColor White
Write-Host "   ⚖️  Avocat: admin@cabinet-dupont.com / Admin123!" -ForegroundColor White
Write-Host "   👤 Client: client@example.com / Client123!" -ForegroundColor White
Write-Host ""

npm run dev
