# Script de mise à jour avec toutes les fonctionnalités

Write-Host "=== MemoLib - Mise à jour complète ===" -ForegroundColor Cyan

# Arrêter l'API
Write-Host "`n1. Arrêt de l'API..." -ForegroundColor Yellow
Get-Process -Name "MemoLib.Api" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Créer la migration
Write-Host "`n2. Création de la migration..." -ForegroundColor Yellow
dotnet ef migrations add AddEnhancements

# Appliquer la migration
Write-Host "`n3. Application de la migration..." -ForegroundColor Yellow
dotnet ef database update

# Rebuild
Write-Host "`n4. Compilation..." -ForegroundColor Yellow
dotnet build

# Redémarrer l'API
Write-Host "`n5. Redémarrage de l'API..." -ForegroundColor Yellow
Start-Process -FilePath "dotnet" -ArgumentList "run" -WorkingDirectory $PSScriptRoot

Write-Host "`n=== Mise à jour terminée ===" -ForegroundColor Green
Write-Host "`nNouvelles fonctionnalités disponibles:" -ForegroundColor Cyan
Write-Host "  ✅ Statut des dossiers (OPEN/IN_PROGRESS/CLOSED)" -ForegroundColor White
Write-Host "  ✅ Attribution de dossiers" -ForegroundColor White
Write-Host "  ✅ Tags et priorités" -ForegroundColor White
Write-Host "  ✅ Templates d'emails" -ForegroundColor White
Write-Host "  ✅ Envoi d'emails" -ForegroundColor White
Write-Host "  ✅ Pièces jointes" -ForegroundColor White
Write-Host "  ✅ Filtres avancés" -ForegroundColor White
Write-Host "`nAPI: http://localhost:5078" -ForegroundColor Yellow
