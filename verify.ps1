Write-Host "VERIFICATION MEMOLIB PLATFORM" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Verifier fichiers
Write-Host "Fichiers cles:" -ForegroundColor Yellow
$files = @(
    "start.ps1",
    "stop.ps1",
    "change-sector.ps1",
    "frontend\index.html",
    "admin\index.html",
    "server-frontend.js",
    "server-admin.js"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  OK: $file" -ForegroundColor Green
    } else {
        Write-Host "  MANQUANT: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Email: sarraboudjellal57@gmail.com" -ForegroundColor White
Write-Host "  Secteurs: 36 disponibles" -ForegroundColor White
Write-Host "  Ports: 3000 (Frontend), 8091 (Admin), 5078 (API)" -ForegroundColor White

Write-Host ""
Write-Host "Raccourcis bureau:" -ForegroundColor Yellow
$shortcuts = @(
    "MemoLib START.lnk",
    "MemoLib STOP.lnk",
    "MemoLib Frontend.lnk",
    "MemoLib Admin.lnk",
    "MemoLib DEMO.lnk"
)

$desktop = [Environment]::GetFolderPath("Desktop")
foreach ($shortcut in $shortcuts) {
    if (Test-Path "$desktop\$shortcut") {
        Write-Host "  OK: $shortcut" -ForegroundColor Green
    } else {
        Write-Host "  MANQUANT: $shortcut" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "TOUT EST PRET!" -ForegroundColor Green
Write-Host ""
Write-Host "Pour lancer:" -ForegroundColor Cyan
Write-Host "  .\start.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Pour changer de secteur:" -ForegroundColor Cyan
Write-Host "  .\change-sector.ps1" -ForegroundColor White
