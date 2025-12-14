# Script de demarrage du backend Flask avec venv
# Usage: .\start-backend.ps1

Write-Host "[BACKEND] Demarrage du backend IAPosteManager..." -ForegroundColor Cyan
Write-Host ""

# Aller dans le repertoire backend
Set-Location $PSScriptRoot\src\backend

# Verifier que le venv existe
if (-not (Test-Path ".\venv\Scripts\python.exe")) {
    Write-Host "[ERREUR] Environnement virtuel non trouve !" -ForegroundColor Red
    Write-Host "         Executez d'abord: python -m venv venv" -ForegroundColor Yellow
    exit 1
}

# Verifier que app.py existe
if (-not (Test-Path ".\app.py")) {
    Write-Host "[ERREUR] Fichier app.py non trouve !" -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Repertoire: $PWD" -ForegroundColor Green
Write-Host "[INFO] Python: .\venv\Scripts\python.exe" -ForegroundColor Green
Write-Host ""

# Lancer le backend
.\venv\Scripts\python.exe app.py
