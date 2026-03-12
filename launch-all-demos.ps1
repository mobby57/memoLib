Write-Host "=== LANCEMENT DE TOUTES LES DEMOS MEMOLIB ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5078"

# Check API
Write-Host "Verification API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "OK - API active" -ForegroundColor Green
} catch {
    Write-Host "ERREUR - API non accessible" -ForegroundColor Red
    Write-Host "Demarrage de l'API..." -ForegroundColor Yellow
    Start-Process cmd -ArgumentList "/k", "dotnet run"
    Write-Host "Attente 10 secondes..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

Write-Host ""
Write-Host "Ouverture de toutes les interfaces..." -ForegroundColor Cyan
Write-Host ""

# Liste des demos
$demos = @(
    @{ Name = "Interface Principale"; Url = "$baseUrl/demo.html" }
    @{ Name = "Axios Pro"; Url = "$baseUrl/axios-pro.html" }
    @{ Name = "Axios Simple"; Url = "$baseUrl/axios-example.html" }
    @{ Name = "Diagrammes"; Url = "$baseUrl/diagrammes.html" }
)

foreach ($demo in $demos) {
    Write-Host "  - $($demo.Name): $($demo.Url)" -ForegroundColor White
    Start-Process $demo.Url
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "=== TOUTES LES DEMOS LANCEES ===" -ForegroundColor Green
Write-Host ""
Write-Host "INTERFACES OUVERTES:" -ForegroundColor Cyan
Write-Host "  1. Interface Principale - Gestion complete" -ForegroundColor White
Write-Host "  2. Axios Pro - Tests API professionnels" -ForegroundColor White
Write-Host "  3. Axios Simple - Tests API basiques" -ForegroundColor White
Write-Host "  4. Diagrammes - Architecture visuelle" -ForegroundColor White
Write-Host ""
Write-Host "API: $baseUrl/api" -ForegroundColor Cyan
Write-Host "Health: $baseUrl/health" -ForegroundColor Cyan
