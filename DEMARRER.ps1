# ====================================================================
# Script de démarrage COMPLET - IAPosteManager
# Démarre Backend + Frontend en une seule commande
# ====================================================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DEMARRAGE COMPLET - IAPosteManager" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

$projectRoot = $PSScriptRoot

# Fonction pour vérifier si un port est utilisé
function Test-PortInUse {
    param([int]$Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return $null -ne $connection
}

# Fonction pour arrêter un processus sur un port
function Stop-ProcessOnPort {
    param([int]$Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($connection) {
        $process = Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "[INFO] Arret du processus sur le port $Port..." -ForegroundColor Yellow
            Stop-Process -Id $process.Id -Force
            Start-Sleep -Seconds 2
        }
    }
}

# Vérifier les prérequis
Write-Host "[1/5] Verification des prerequis..." -ForegroundColor Cyan

# Python
try {
    $pythonVersion = python --version
    Write-Host "  [OK] Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "  [ERREUR] Python non installe!" -ForegroundColor Red
    Write-Host "  Installer depuis: https://www.python.org" -ForegroundColor Yellow
    exit 1
}

# Node.js
try {
    $nodeVersion = node --version
    Write-Host "  [OK] Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  [ERREUR] Node.js non installe!" -ForegroundColor Red
    Write-Host "  Installer depuis: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Vérifier les ports
Write-Host "`n[2/5] Verification des ports..." -ForegroundColor Cyan

if (Test-PortInUse -Port 5000) {
    Write-Host "  [INFO] Port 5000 (Backend) deja utilise" -ForegroundColor Yellow
    Stop-ProcessOnPort -Port 5000
}

if (Test-PortInUse -Port 3001) {
    Write-Host "  [INFO] Port 3001 (Frontend) deja utilise" -ForegroundColor Yellow
    Stop-ProcessOnPort -Port 3001
}

Write-Host "  [OK] Ports 5000 et 3001 disponibles" -ForegroundColor Green

# Démarrer le Backend en arrière-plan
Write-Host "`n[3/5] Demarrage du Backend..." -ForegroundColor Cyan

$backendScript = Join-Path $projectRoot "start-backend.ps1"
if (-not (Test-Path $backendScript)) {
    Write-Host "  [ERREUR] Script start-backend.ps1 non trouve!" -ForegroundColor Red
    exit 1
}

# Lancer le backend dans une nouvelle fenêtre PowerShell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot'; .\start-backend.ps1" -WindowStyle Normal
Write-Host "  [OK] Backend lance dans une nouvelle fenetre" -ForegroundColor Green

# Attendre que le backend démarre
Write-Host "  [INFO] Attente du demarrage du backend (15s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Vérifier si le backend répond
$backendReady = $false
for ($i = 1; $i -le 5; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method GET -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $backendReady = $true
            break
        }
    } catch {
        Write-Host "  [INFO] Tentative $i/5 - Backend pas encore pret..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
    }
}

if ($backendReady) {
    Write-Host "  [OK] Backend operationnel sur http://localhost:5000" -ForegroundColor Green
} else {
    Write-Host "  [AVERTISSEMENT] Backend ne repond pas encore" -ForegroundColor Yellow
    Write-Host "  [INFO] Verification manuelle recommandee" -ForegroundColor Yellow
}

# Démarrer le Frontend en arrière-plan
Write-Host "`n[4/5] Demarrage du Frontend..." -ForegroundColor Cyan

$frontendScript = Join-Path $projectRoot "start-frontend.ps1"
if (-not (Test-Path $frontendScript)) {
    Write-Host "  [ERREUR] Script start-frontend.ps1 non trouve!" -ForegroundColor Red
    exit 1
}

# Lancer le frontend dans une nouvelle fenêtre PowerShell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot'; .\start-frontend.ps1" -WindowStyle Normal
Write-Host "  [OK] Frontend lance dans une nouvelle fenetre" -ForegroundColor Green

# Attendre que le frontend démarre
Write-Host "  [INFO] Attente du demarrage du frontend (10s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Vérifier si le frontend répond
$frontendReady = $false
for ($i = 1; $i -le 5; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001" -Method GET -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $frontendReady = $true
            break
        }
    } catch {
        Write-Host "  [INFO] Tentative $i/5 - Frontend pas encore pret..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
    }
}

if ($frontendReady) {
    Write-Host "  [OK] Frontend operationnel sur http://localhost:3001" -ForegroundColor Green
} else {
    Write-Host "  [AVERTISSEMENT] Frontend ne repond pas encore" -ForegroundColor Yellow
    Write-Host "  [INFO] Verification manuelle recommandee" -ForegroundColor Yellow
}

# Résumé final
Write-Host "`n[5/5] Systeme demarre!" -ForegroundColor Cyan

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "IAPosteManager v3.4 - PRET !" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan

if ($backendReady) {
    Write-Host "`nBackend:  " -NoNewline -ForegroundColor White
    Write-Host "http://localhost:5000" -ForegroundColor Green -NoNewline
    Write-Host " [ACTIF]" -ForegroundColor Green
} else {
    Write-Host "`nBackend:  " -NoNewline -ForegroundColor White
    Write-Host "http://localhost:5000" -ForegroundColor Yellow -NoNewline
    Write-Host " [EN DEMARRAGE]" -ForegroundColor Yellow
}

if ($frontendReady) {
    Write-Host "Frontend: " -NoNewline -ForegroundColor White
    Write-Host "http://localhost:3001" -ForegroundColor Green -NoNewline
    Write-Host " [ACTIF]" -ForegroundColor Green
} else {
    Write-Host "Frontend: " -NoNewline -ForegroundColor White
    Write-Host "http://localhost:3001" -ForegroundColor Yellow -NoNewline
    Write-Host " [EN DEMARRAGE]" -ForegroundColor Yellow
}

Write-Host "`nFonctionnalites disponibles:" -ForegroundColor Yellow
Write-Host "  [x] Mode dictee vocale avec validation IA" -ForegroundColor Green
Write-Host "  [x] Generation d'emails intelligente" -ForegroundColor Green
Write-Host "  [x] Envoi simple et batch" -ForegroundColor Green
Write-Host "  [x] Systeme accessibilite complet" -ForegroundColor Green
Write-Host "  [x] Dashboard unifie" -ForegroundColor Green

Write-Host "`nDocumentation:" -ForegroundColor Yellow
Write-Host "  - DEMARRAGE_RAPIDE.md" -ForegroundColor White
Write-Host "  - docs/API_ENDPOINTS.md" -ForegroundColor White
Write-Host "  - docs/GUIDE_DICTEE_VOCALE.md" -ForegroundColor White

Write-Host "`nCommandes utiles:" -ForegroundColor Yellow
Write-Host "  Arreter tout:  Get-Process python*,node* | Stop-Process -Force" -ForegroundColor White
Write-Host "  Tests E2E:     cd src\frontend; npx playwright test" -ForegroundColor White
Write-Host "  Health check:  Invoke-WebRequest http://localhost:5000/api/health" -ForegroundColor White

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "Ouvrez votre navigateur sur: http://localhost:3001" -ForegroundColor Green
Write-Host "============================================================`n" -ForegroundColor Cyan

# Ouvrir automatiquement le navigateur (optionnel)
$openBrowser = Read-Host "Ouvrir le navigateur automatiquement? (O/N)"
if ($openBrowser -eq "O" -or $openBrowser -eq "o") {
    Start-Process "http://localhost:3001"
    Write-Host "`n[OK] Navigateur ouvert!" -ForegroundColor Green
}

Write-Host "`nAppuyez sur une touche pour fermer cette fenetre..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
