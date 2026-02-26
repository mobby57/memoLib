# Script de demarrage MemoLib
Write-Host "Demarrage de MemoLib..." -ForegroundColor Cyan

# Arreter les processus existants
Write-Host "Arret des processus existants..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*MemoLib*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Nettoyer et compiler
Write-Host "Compilation..." -ForegroundColor Yellow
dotnet build --no-incremental

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur de compilation" -ForegroundColor Red
    Read-Host "Appuyez sur Entree pour quitter"
    exit
}

# Lancer le serveur
Write-Host "Lancement du serveur..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; dotnet run"

# Attendre le demarrage
Write-Host "Attente du demarrage (15 secondes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Ouvrir le navigateur
Write-Host "Ouverture du navigateur..." -ForegroundColor Green
Start-Process "http://localhost:5078/demo.html"

Write-Host ""
Write-Host "MemoLib est pret !" -ForegroundColor Green
Write-Host "Email: sarraboudjellal57@gmail.com" -ForegroundColor White
Write-Host "Password: SecurePass123!" -ForegroundColor White
Write-Host ""
Write-Host "Cliquez sur DEMO AUTO dans le navigateur" -ForegroundColor Cyan
