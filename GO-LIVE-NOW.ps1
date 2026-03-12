# 🚀 MEMOLIB - LANCEMENT PHASE 7 STAGING
# Execution immediate du deploiement

param(
    [string]$Environment = "staging"
)

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "MEMOLIB - PHASE 7 STAGING DEPLOYMENT" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Verification environnement
Write-Host "Verification de l'environnement..." -ForegroundColor Yellow

# Test .NET
Write-Host "  .NET SDK..." -NoNewline
try {
    $dotnetVersion = dotnet --version
    Write-Host " OK v$dotnetVersion" -ForegroundColor Green
} catch {
    Write-Host " ERREUR" -ForegroundColor Red
    exit 1
}

# Test Node.js
Write-Host "  Node.js..." -NoNewline
try {
    $nodeVersion = node --version
    Write-Host " OK $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host " ERREUR" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "BUILD & TEST..." -ForegroundColor Yellow

# Build .NET API
Write-Host "  Build API .NET..." -NoNewline
dotnet build --configuration Release > $null 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " ERREUR (non-bloquant)" -ForegroundColor Yellow
}

# Database
Write-Host "  Database..." -NoNewline
if (Test-Path "memolib.db") {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " Creation..." -ForegroundColor Yellow
    dotnet ef database update > $null 2>&1
    Write-Host " OK" -ForegroundColor Green
}

Write-Host ""
Write-Host "DEMARRAGE LOCAL (STAGING MODE)..." -ForegroundColor Yellow
Write-Host ""
Write-Host "URLs:" -ForegroundColor Cyan
Write-Host "   API:       http://localhost:5078" -ForegroundColor White
Write-Host "   Interface: http://localhost:5078/demo.html" -ForegroundColor White
Write-Host "   Swagger:   http://localhost:5078/swagger" -ForegroundColor White
Write-Host ""
Write-Host "L'API va demarrer dans 3 secondes..." -ForegroundColor Yellow
Write-Host "   Appuyez sur Ctrl+C pour annuler" -ForegroundColor Gray
Write-Host ""

Start-Sleep -Seconds 3

Write-Host "LANCEMENT..." -ForegroundColor Green
Write-Host ""

# Lancer l'API
dotnet run --configuration Release
