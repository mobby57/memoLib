# Script d'exécution des tests Playwright Workspaces
# Gère le serveur Next.js et lance les tests E2E

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   TESTS E2E PLAYWRIGHT - WORKSPACES" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Étape 1: Vérifier que le serveur Next.js est lancé
Write-Host "[1/3] Verification serveur Next.js..." -ForegroundColor Yellow
$serverRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Head -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 404) {
        $serverRunning = $true
        Write-Host "      Serveur actif sur http://localhost:3000" -ForegroundColor Green
    }
} catch {
    Write-Host "      Serveur non demarre" -ForegroundColor Red
}

if (-not $serverRunning) {
    Write-Host "`n      Demarrage du serveur Next.js..." -ForegroundColor Yellow
    Write-Host "      ATTENTION: Assurez-vous qu'aucun autre serveur n'est actif!`n" -ForegroundColor Red
    Write-Host "      Lancez manuellement: npm run dev" -ForegroundColor White
    Write-Host "      Puis relancez ce script`n" -ForegroundColor White
    exit 1
}

# Étape 2: Vérifier Playwright installé
Write-Host "`n[2/3] Verification Playwright..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules/@playwright")) {
    Write-Host "      Installation Playwright..." -ForegroundColor Yellow
    npm install --save-dev @playwright/test
    npx playwright install chromium
}
Write-Host "      Playwright OK" -ForegroundColor Green

# Étape 3: Lancer les tests
Write-Host "`n[3/3] Execution tests E2E..." -ForegroundColor Yellow
Write-Host "      Tests: tests/e2e/workspaces.spec.ts" -ForegroundColor White
Write-Host "      Browser: Chromium (Chrome)" -ForegroundColor White
Write-Host "      BaseURL: http://localhost:3000`n" -ForegroundColor White

npx playwright test workspaces.spec.ts --project=chromium --reporter=list

# Résultats
Write-Host "`n========================================" -ForegroundColor Cyan
if ($LASTEXITCODE -eq 0) {
    Write-Host "   TESTS REUSSIS !" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Cyan
    Write-Host "Rapport HTML: npx playwright show-report" -ForegroundColor Yellow
} else {
    Write-Host "   TESTS ECHOUES" -ForegroundColor Red
    Write-Host "========================================`n" -ForegroundColor Cyan
    Write-Host "Debug: npx playwright test --ui" -ForegroundColor Yellow
    Write-Host "       npx playwright show-report" -ForegroundColor Yellow
}
