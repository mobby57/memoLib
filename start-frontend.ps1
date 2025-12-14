# ====================================================================
# Script de démarrage du FRONTEND - IAPosteManager
# ====================================================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DEMARRAGE FRONTEND - IAPosteManager" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Vérifier si Node.js est installé
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js detecte: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERREUR] Node.js n'est pas installe!" -ForegroundColor Red
    Write-Host "Installer Node.js depuis: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Aller dans le répertoire frontend
$frontendPath = Join-Path $PSScriptRoot "src\frontend"
if (-not (Test-Path $frontendPath)) {
    Write-Host "[ERREUR] Repertoire frontend non trouve: $frontendPath" -ForegroundColor Red
    exit 1
}

Set-Location $frontendPath
Write-Host "[INFO] Repertoire: $frontendPath" -ForegroundColor Cyan

# Vérifier si node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] Installation des dependances..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERREUR] Installation des dependances echouee" -ForegroundColor Red
        exit 1
    }
}

# Vérifier si le port 3001 est déjà utilisé
$portInUse = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "[AVERTISSEMENT] Le port 3001 est deja utilise" -ForegroundColor Yellow
    $existingProcess = Get-Process -Id $portInUse.OwningProcess -ErrorAction SilentlyContinue
    if ($existingProcess) {
        Write-Host "[INFO] Processus existant: $($existingProcess.Name) (PID: $($existingProcess.Id))" -ForegroundColor Yellow
        $response = Read-Host "Voulez-vous arreter le processus existant? (O/N)"
        if ($response -eq "O" -or $response -eq "o") {
            Stop-Process -Id $existingProcess.Id -Force
            Write-Host "[OK] Processus arrete" -ForegroundColor Green
            Start-Sleep -Seconds 2
        } else {
            Write-Host "[INFO] Utilisation du serveur existant" -ForegroundColor Cyan
            exit 0
        }
    }
}

# Bannière de démarrage
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "FRONTEND IAPosteManager - React + Vite" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "URL:        http://localhost:3001" -ForegroundColor White
Write-Host "Backend:    http://localhost:5000" -ForegroundColor White
Write-Host "Mode:       Development" -ForegroundColor White
Write-Host ""
Write-Host "Fonctionnalites:" -ForegroundColor Yellow
Write-Host "  - Interface React moderne" -ForegroundColor White
Write-Host "  - Dictee vocale avec validation IA" -ForegroundColor White
Write-Host "  - Composition emails intelligente" -ForegroundColor White
Write-Host "  - Systeme accessibilite complet" -ForegroundColor White
Write-Host "  - Dashboard unifie" -ForegroundColor White
Write-Host "============================================================`n" -ForegroundColor Cyan

# Démarrer le serveur de développement
Write-Host "[INFO] Demarrage du serveur Vite..." -ForegroundColor Cyan
Write-Host "[INFO] Appuyez sur Ctrl+C pour arreter`n" -ForegroundColor Yellow

npm run dev
