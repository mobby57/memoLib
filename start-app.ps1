Write-Host "LANCEMENT MEMOLIB APP" -ForegroundColor Cyan
Write-Host ""

$jobs = @()

Write-Host "Demarrage API..." -ForegroundColor Yellow
$jobs += Start-Job -ScriptBlock { Set-Location $using:PWD; dotnet run }
Start-Sleep -Seconds 5

Write-Host "Ouverture de l'application..." -ForegroundColor Yellow
Start-Process "http://localhost:5078/app.html"

Write-Host ""
Write-Host "APPLICATION LANCEE!" -ForegroundColor Green
Write-Host "  URL: http://localhost:5078/app.html" -ForegroundColor White
Write-Host ""
Write-Host "Appuyez sur ENTREE pour arreter..." -ForegroundColor Yellow
Read-Host

Write-Host "Arret..." -ForegroundColor Red
$jobs | Stop-Job
$jobs | Remove-Job
Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "Arrete!" -ForegroundColor Green
