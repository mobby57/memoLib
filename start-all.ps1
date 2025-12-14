# Script de demarrage complet (Backend + Frontend)
# Usage: .\start-all.ps1

Write-Host "[START] Demarrage de IAPosteManager (Backend + Frontend)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Fonction pour tuer les processus existants
function Stop-ExistingServers {
    Write-Host "[CHECK] Verification des serveurs existants..." -ForegroundColor Yellow
    
    # Arreter backend sur port 5000
    $backend = Get-Process python* -ErrorAction SilentlyContinue | 
        Where-Object { (Get-NetTCPConnection -OwningProcess $_.Id -ErrorAction SilentlyContinue).LocalPort -eq 5000 }
    if ($backend) {
        Write-Host "        Arret du backend existant (PID: $($backend.Id))..." -ForegroundColor Yellow
        Stop-Process -Id $backend.Id -Force
        Start-Sleep -Seconds 2
    }
    
    # Arreter frontend sur port 3001
    $frontend = Get-Process node* -ErrorAction SilentlyContinue | 
        Where-Object { (Get-NetTCPConnection -OwningProcess $_.Id -ErrorAction SilentlyContinue).LocalPort -eq 3001 }
    if ($frontend) {
        Write-Host "        Arret du frontend existant (PID: $($frontend.Id))..." -ForegroundColor Yellow
        Stop-Process -Id $frontend.Id -Force
        Start-Sleep -Seconds 2
    }
}

Stop-ExistingServers

# Demarrer le backend
Write-Host ""
Write-Host "[BACKEND] Demarrage du Backend Flask..." -ForegroundColor Green
$backendJob = Start-Job -ScriptBlock {
    Set-Location "$using:PSScriptRoot\src\backend"
    & .\venv\Scripts\python.exe app.py
}

Start-Sleep -Seconds 3

# Verifier que le backend est demarre
$backendRunning = $false
for ($i = 0; $i -lt 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/" -Method GET -TimeoutSec 1 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $backendRunning = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 1
    }
}

if ($backendRunning) {
    Write-Host "          Backend demarre sur http://localhost:5000" -ForegroundColor Green
} else {
    Write-Host "          Backend pourrait ne pas avoir demarre correctement" -ForegroundColor Yellow
}

# Demarrer le frontend
Write-Host ""
Write-Host "[FRONTEND] Demarrage du Frontend React..." -ForegroundColor Green
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "$using:PSScriptRoot\src\frontend"
    npm run dev
}

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] Serveurs demarres !" -ForegroundColor Green
Write-Host ""
Write-Host "[BACKEND]  Backend API: " -NoNewline
Write-Host "http://localhost:5000" -ForegroundColor Cyan
Write-Host "[FRONTEND] Frontend:    " -NoNewline
Write-Host "http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pour arreter, fermez cette fenetre ou appuyez sur Ctrl+C" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Attendre que les jobs se terminent (jusqu'a interruption manuelle)
try {
    while ($true) {
        Start-Sleep -Seconds 2
        
        # Verifier que les jobs tournent toujours
        if ((Get-Job -Id $backendJob.Id).State -eq 'Failed') {
            Write-Host "[ERROR] Le backend s'est arrete" -ForegroundColor Red
            break
        }
        if ((Get-Job -Id $frontendJob.Id).State -eq 'Failed') {
            Write-Host "[ERROR] Le frontend s'est arrete" -ForegroundColor Red
            break
        }
    }
} finally {
    Write-Host ""
    Write-Host "[STOP] Arret des serveurs..." -ForegroundColor Yellow
    Stop-Job -Id $backendJob.Id -ErrorAction SilentlyContinue
    Stop-Job -Id $frontendJob.Id -ErrorAction SilentlyContinue
    Remove-Job -Id $backendJob.Id -Force -ErrorAction SilentlyContinue
    Remove-Job -Id $frontendJob.Id -Force -ErrorAction SilentlyContinue
    Write-Host "[DONE] Termine" -ForegroundColor Green
}
