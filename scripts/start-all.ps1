#!/usr/bin/env pwsh
# Script de démarrage rapide - Lance tout automatiquement

$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir

Write-Host "🚀 Démarrage MemoLib..." -ForegroundColor Cyan

# Aller dans le répertoire du projet
Set-Location $projectDir

# Tuer les anciens processus
Get-Process -Name "MemoLib.Api" -ErrorAction SilentlyContinue | Stop-Process -Force

# Démarrer l'API
Write-Host "⏳ Démarrage de l'API..." -ForegroundColor Yellow
Start-Process -FilePath "dotnet" -ArgumentList "run --urls http://localhost:5078" -WorkingDirectory $projectDir

# Attendre que l'API soit prête
Start-Sleep -Seconds 5
$maxRetries = 15
$retries = 0
$apiReady = $false

while ($retries -lt $maxRetries) {
    try {
        $res = Invoke-WebRequest -Uri "http://localhost:5078/health" -UseBasicParsing -TimeoutSec 2
        if ($res.StatusCode -eq 200) {
            $apiReady = $true
            break
        }
    } catch {}
    Start-Sleep -Seconds 2
    $retries++
}

if ($apiReady) {
    Write-Host "✅ API prête sur http://localhost:5078" -ForegroundColor Green
    Write-Host "✅ Interface: http://localhost:5078/demo.html" -ForegroundColor Green
    
    # Ouvrir le navigateur
    Start-Process "http://localhost:5078/demo.html"
} else {
    Write-Host "❌ L'API n'a pas démarré correctement" -ForegroundColor Red
    exit 1
}
