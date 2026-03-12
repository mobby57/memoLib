# GO - Demarrage Rapide MemoLib API
# Ce script demarre l'application et ouvre le navigateur

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MemoLib API - Demarrage Rapide" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verifier que nous sommes dans le bon dossier
if (-not (Test-Path "MemoLib.Api.csproj")) {
    Write-Host "ERREUR: Fichier MemoLib.Api.csproj non trouve" -ForegroundColor Red
    Write-Host "Assurez-vous d'etre dans le dossier MemoLib.Api" -ForegroundColor Yellow
    exit 1
}

# Afficher les informations
Write-Host "Demarrage de l'application..." -ForegroundColor Green
Write-Host ""
Write-Host "API:       http://localhost:5078" -ForegroundColor White
Write-Host "Interface: http://localhost:5078/demo.html" -ForegroundColor White
Write-Host "Health:    http://localhost:5078/health" -ForegroundColor White
Write-Host ""
Write-Host "Compte de test:" -ForegroundColor Yellow
Write-Host "  Email:        admin@freetime.com" -ForegroundColor White
Write-Host "  Mot de passe: Admin123!" -ForegroundColor White
Write-Host ""
Write-Host "Appuyez sur Ctrl+C pour arreter" -ForegroundColor Gray
Write-Host ""

# Attendre 3 secondes puis ouvrir le navigateur
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 3
    Start-Process "http://localhost:5078/demo.html"
} | Out-Null

# Demarrer l'application
dotnet run
