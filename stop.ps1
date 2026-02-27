Write-Host "ARRET MEMOLIB PLATFORM" -ForegroundColor Red
Write-Host ""

Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "Tous les services sont arretes!" -ForegroundColor Green
