#!/usr/bin/env pwsh
# Script de démarrage rapide MemoLib

Write-Host "🚀 Démarrage MemoLib..." -ForegroundColor Cyan

# Vérifier si l'API tourne déjà
$process = Get-Process -Name "MemoLib.Api" -ErrorAction SilentlyContinue
if ($process) {
    Write-Host "✅ API déjà en cours d'exécution (PID: $($process.Id))" -ForegroundColor Green
} else {
    Write-Host "🔧 Démarrage de l'API..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; dotnet run"
    Start-Sleep -Seconds 3
}

# Ouvrir les interfaces
Write-Host "🌐 Ouverture des interfaces..." -ForegroundColor Yellow
Start-Process "http://localhost:5078/demo-pro.html"
Start-Sleep -Seconds 1
Start-Process "http://localhost:5078/app.html"

Write-Host "✅ MemoLib démarré!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Interfaces disponibles:" -ForegroundColor Cyan
Write-Host "   - Demo Pro: http://localhost:5078/demo-pro.html" -ForegroundColor White
Write-Host "   - App: http://localhost:5078/app.html" -ForegroundColor White
Write-Host "   - API: http://localhost:5078" -ForegroundColor White
