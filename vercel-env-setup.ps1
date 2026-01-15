# Configuration Variables d'Environnement Vercel
# Exécuter dans le dashboard : https://vercel.com/mobby57s-projects/iapostemanager/settings/environment-variables

Write-Host "=== VARIABLES A AJOUTER DANS VERCEL ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. NEXTAUTH_SECRET (Production + Preview)" -ForegroundColor Yellow
Write-Host "   uPTI4n760QYWzzZJtrgMvAf0OEq4jQso09wu0/+7bKM=" -ForegroundColor Green
Write-Host ""

Write-Host "2. NEXTAUTH_URL (Production uniquement)" -ForegroundColor Yellow
Write-Host "   https://iapostemanager-mobby57s-projects.vercel.app" -ForegroundColor Green
Write-Host ""

Write-Host "3. DATABASE_URL (Production + Preview)" -ForegroundColor Yellow
Write-Host "   file:./prisma/dev.db" -ForegroundColor Green
Write-Host ""

Write-Host "4. OLLAMA_BASE_URL (Production + Preview)" -ForegroundColor Yellow
Write-Host "   http://localhost:11434" -ForegroundColor Green
Write-Host ""

Write-Host "=== DASHBOARD ===" -ForegroundColor Cyan
Write-Host "https://vercel.com/mobby57s-projects/iapostemanager/settings/environment-variables"
Write-Host ""

Write-Host "Apres ajout, redeploy avec:" -ForegroundColor Cyan
Write-Host "vercel --prod" -ForegroundColor White
