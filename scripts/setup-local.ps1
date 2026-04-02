param([switch]$Quick)

Write-Host "MEMOLIB - SETUP LOCAL COMPLET" -ForegroundColor Magenta

Write-Host "ETAT ACTUEL:" -ForegroundColor Cyan
Write-Host "  API Core: INSTALLE" -ForegroundColor Green
Write-Host "  Interface Web: INSTALLE" -ForegroundColor Green
Write-Host "  Base SQLite: INSTALLE" -ForegroundColor Green
Write-Host "  Dashboard: A INSTALLER" -ForegroundColor Yellow
Write-Host "  Notifications: A INSTALLER" -ForegroundColor Yellow
Write-Host "  Export PDF: A INSTALLER" -ForegroundColor Yellow
Write-Host "  App Mobile: A INSTALLER" -ForegroundColor Yellow

if ($Quick) {
    Write-Host "SETUP RAPIDE - Installation des fonctionnalites essentielles" -ForegroundColor Yellow
    
    Write-Host "1. Installation Dashboard..." -ForegroundColor Cyan
    & "$PSScriptRoot\install-dashboard.ps1"
    
    Write-Host "2. Installation Notifications..." -ForegroundColor Cyan
    & "$PSScriptRoot\install-notifications.ps1"
    
    Write-Host "3. Installation Export PDF..." -ForegroundColor Cyan
    & "$PSScriptRoot\install-pdf.ps1"
    
    Write-Host "4. Installation App Mobile..." -ForegroundColor Cyan
    & "$PSScriptRoot\install-mobile.ps1"
    
    Write-Host "SETUP RAPIDE TERMINE!" -ForegroundColor Green
    Write-Host "NOUVELLES INTERFACES DISPONIBLES:" -ForegroundColor Cyan
    Write-Host "  Dashboard: http://localhost:5078/dashboard.html" -ForegroundColor White
    Write-Host "  Export PDF: http://localhost:5078/export.html" -ForegroundColor White
    Write-Host "  App Mobile: http://localhost:5078/mobile.html" -ForegroundColor White
    return
}

Write-Host "QUE VOULEZ-VOUS INSTALLER ?" -ForegroundColor Yellow
Write-Host "1. Dashboard temps reel + Analytics" -ForegroundColor White
Write-Host "2. Notifications push" -ForegroundColor White
Write-Host "3. Export PDF des dossiers" -ForegroundColor White
Write-Host "4. Application mobile" -ForegroundColor White
Write-Host "5. TOUT installer" -ForegroundColor Green
Write-Host "0. Quitter" -ForegroundColor Red

$choice = Read-Host "Votre choix (0-5)"

switch ($choice) {
    "1" { & "$PSScriptRoot\install-dashboard.ps1" }
    "2" { & "$PSScriptRoot\install-notifications.ps1" }
    "3" { & "$PSScriptRoot\install-pdf.ps1" }
    "4" { & "$PSScriptRoot\install-mobile.ps1" }
    "5" { & $MyInvocation.MyCommand.Path -Quick }
    "0" { Write-Host "Au revoir!" -ForegroundColor Yellow; exit }
    default { Write-Host "Choix invalide" -ForegroundColor Red }
}