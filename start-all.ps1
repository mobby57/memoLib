# Lancement complet MemoLib Platform

Write-Host "LANCEMENT MEMOLIB PLATFORM" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

# Lancer API Backend (port 5078)
Write-Host "1. Lancement API Backend (port 5078)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; dotnet run"
Start-Sleep -Seconds 3

# Lancer Frontend Utilisateur (port 3000)
Write-Host "2. Lancement Frontend Utilisateur (port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; node server-frontend.js"
Start-Sleep -Seconds 2

# Lancer Admin Panel (port 8091)
Write-Host "3. Lancement Admin Panel (port 8091)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; node server-admin.js"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "TOUS LES SERVICES SONT LANCES!" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "ACCES:" -ForegroundColor Cyan
Write-Host "  Frontend Utilisateur: http://localhost:3000" -ForegroundColor White
Write-Host "  Admin Panel:          http://localhost:8091" -ForegroundColor White
Write-Host "  API Backend:          http://localhost:5078" -ForegroundColor White
Write-Host ""
Write-Host "Appuyez sur une touche pour ouvrir les navigateurs..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Start-Process "http://localhost:3000"
Start-Process "http://localhost:8091"

Write-Host ""
Write-Host "Services lances! Fermez cette fenetre pour arreter tous les services." -ForegroundColor Green
