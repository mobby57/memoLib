# MEMOLIB - Arret et relancement
Write-Host ""
Write-Host "ARRET DU PROCESSUS EXISTANT..." -ForegroundColor Yellow

# Trouver et tuer le processus sur le port 5078
$process = Get-NetTCPConnection -LocalPort 5078 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($process) {
    Write-Host "  Processus trouve: PID $process" -ForegroundColor Cyan
    Stop-Process -Id $process -Force
    Write-Host "  Processus arrete" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "  Aucun processus sur le port 5078" -ForegroundColor Gray
}

Write-Host ""
Write-Host "LANCEMENT DE L'API..." -ForegroundColor Green
Write-Host ""
Write-Host "URLs:" -ForegroundColor Cyan
Write-Host "  API:       http://localhost:5078" -ForegroundColor White
Write-Host "  Interface: http://localhost:5078/demo.html" -ForegroundColor White
Write-Host ""

# Lancer l'API
dotnet run --configuration Release
