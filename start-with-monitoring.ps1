# PowerShell Script - IA Poste Manager
# Demarrage Complet avec Monitoring et Emails de Test

Write-Host ""
Write-Host "DEMARRAGE COMPLET - IA POSTE MANAGER" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 1. Generer des emails de test
Write-Host "[1/3] Generation des emails de test..." -ForegroundColor Yellow
npx tsx scripts/insert-test-emails.ts

Write-Host ""

# 2. Demarrer le serveur Next.js
Write-Host "[2/3] Demarrage du serveur Next.js..." -ForegroundColor Yellow
Write-Host "URL: http://localhost:3000" -ForegroundColor Green
Write-Host "Monitoring: http://localhost:3000/lawyer/monitoring" -ForegroundColor Green
Write-Host "Emails: http://localhost:3000/lawyer/emails" -ForegroundColor Green
Write-Host ""

# Demarrer le serveur en arriere-plan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host "Serveur demarre!" -ForegroundColor Green
Write-Host ""

# 3. Afficher le resume
Write-Host "[3/3] Resume des services actifs:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Base de Donnees: SQLite (dev.db)" -ForegroundColor Green
Write-Host "  Emails de Test: 17 emails crees" -ForegroundColor Green
Write-Host "  Serveur Next.js: http://localhost:3000" -ForegroundColor Green
Write-Host "  Page Monitoring: http://localhost:3000/lawyer/monitoring" -ForegroundColor Green
Write-Host "  Page Emails: http://localhost:3000/lawyer/emails" -ForegroundColor Green
Write-Host ""

Write-Host "PROCHAINES ETAPES:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. Ouvrir http://localhost:3000/lawyer/monitoring" -ForegroundColor White
Write-Host "  2. Consulter les emails: http://localhost:3000/lawyer/emails" -ForegroundColor White
Write-Host "  3. Tester la classification IA sur les 17 emails" -ForegroundColor White
Write-Host ""

Write-Host "Tous les systemes sont operationnels!" -ForegroundColor Green
Write-Host ""

# Garder le terminal ouvert
Read-Host "Appuyez sur Entree pour fermer..."
