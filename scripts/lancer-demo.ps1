# Script de lancement automatique de la demo client

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   LANCEMENT DEMO MEMOLIB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Etape 1: Arreter les processus existants
Write-Host "[1/4] Arret des processus existants..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*MemoLib.Api*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "   OK" -ForegroundColor Green
Write-Host ""

# Etape 2: Demarrer l'API
Write-Host "[2/4] Demarrage de l'API..." -ForegroundColor Yellow
$apiProcess = Start-Process -FilePath "dotnet" -ArgumentList "run --urls http://localhost:8080" -WorkingDirectory $PSScriptRoot\.. -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 5

# Verifier que l'API est demarree
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -Method Get -TimeoutSec 5
    Write-Host "   OK - API demarree sur http://localhost:8080" -ForegroundColor Green
} catch {
    Write-Host "   ERREUR - L'API n'a pas demarre correctement" -ForegroundColor Red
    Write-Host "   Verifiez les logs et reessayez" -ForegroundColor Yellow
    exit
}
Write-Host ""

# Etape 3: Executer la demo
Write-Host "[3/4] Execution de la demonstration..." -ForegroundColor Yellow
Write-Host ""
Start-Sleep -Seconds 2

& "$PSScriptRoot\demo-client-complet.ps1"

Write-Host ""

# Etape 4: Ouvrir le navigateur
Write-Host "[4/4] Ouverture de l'interface web..." -ForegroundColor Yellow
Start-Process "http://localhost:8080/demo.html"
Write-Host "   OK - Interface ouverte dans le navigateur" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   DEMO PRETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "L'API tourne en arriere-plan (PID: $($apiProcess.Id))" -ForegroundColor White
Write-Host ""
Write-Host "Pour arreter l'API:" -ForegroundColor Yellow
Write-Host "  taskkill /F /PID $($apiProcess.Id)" -ForegroundColor White
Write-Host ""
Write-Host "Appuyez sur une touche pour arreter l'API et quitter..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "Arret de l'API..." -ForegroundColor Yellow
Stop-Process -Id $apiProcess.Id -Force -ErrorAction SilentlyContinue
Write-Host "Termine." -ForegroundColor Green
