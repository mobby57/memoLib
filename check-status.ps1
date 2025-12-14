# Script de verification de l'etat des services
# Usage: .\check-status.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "ETAT DES SERVICES - IAPosteManager" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Verification Backend
Write-Host "[BACKEND] Flask API (Port 5000)" -ForegroundColor Yellow
$backend = Get-Process python* -ErrorAction SilentlyContinue | 
    Where-Object { (Get-NetTCPConnection -OwningProcess $_.Id -ErrorAction SilentlyContinue).LocalPort -eq 5000 }

if ($backend) {
    Write-Host "  Status:  " -NoNewline
    Write-Host "RUNNING" -ForegroundColor Green
    Write-Host "  PID:     $($backend.Id)"
    Write-Host "  CPU:     $([math]::Round($backend.CPU, 2))s"
    Write-Host "  Memory:  $([math]::Round($backend.WorkingSet/1MB, 2)) MB"
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        Write-Host "  HTTP:    " -NoNewline
        Write-Host "OK (200)" -ForegroundColor Green
    } catch {
        Write-Host "  HTTP:    " -NoNewline
        Write-Host "NOT READY" -ForegroundColor Yellow
    }
} else {
    Write-Host "  Status:  " -NoNewline
    Write-Host "STOPPED" -ForegroundColor Red
}

Write-Host ""

# Verification Frontend
Write-Host "[FRONTEND] React App (Port 3001)" -ForegroundColor Yellow
$frontend = Get-Process node* -ErrorAction SilentlyContinue | 
    Where-Object { (Get-NetTCPConnection -OwningProcess $_.Id -ErrorAction SilentlyContinue).LocalPort -eq 3001 }

if ($frontend) {
    Write-Host "  Status:  " -NoNewline
    Write-Host "RUNNING" -ForegroundColor Green
    Write-Host "  PID:     $($frontend.Id)"
    Write-Host "  CPU:     $([math]::Round($frontend.CPU, 2))s"
    Write-Host "  Memory:  $([math]::Round($frontend.WorkingSet/1MB, 2)) MB"
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        Write-Host "  HTTP:    " -NoNewline
        Write-Host "OK ($($response.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "  HTTP:    " -NoNewline
        Write-Host "NOT READY" -ForegroundColor Yellow
    }
} else {
    Write-Host "  Status:  " -NoNewline
    Write-Host "STOPPED" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "URLs d'acces:" -ForegroundColor White
Write-Host "  Backend:  " -NoNewline
Write-Host "http://localhost:5000" -ForegroundColor Cyan
Write-Host "  Frontend: " -NoNewline
Write-Host "http://localhost:3001" -ForegroundColor Cyan
Write-Host "  API Docs: " -NoNewline
Write-Host "http://localhost:5000/api/health" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
