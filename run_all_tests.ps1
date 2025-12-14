#!/usr/bin/env pwsh
# Script d'exécution complète: Build -> Test -> Deploy -> Verify

Write-Host "=================================================="  -ForegroundColor Cyan
Write-Host "  IAPosteManager - Pipeline Complète"  -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Étape 1: Build
Write-Host "[1/4] BUILD de l'application..." -ForegroundColor Yellow
python build.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build échoué" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build réussi" -ForegroundColor Green
Write-Host ""

# Étape 2: Démarrer l'application en arrière-plan
Write-Host "[2/4] DÉMARRAGE de l'application..." -ForegroundColor Yellow
$env:SECRET_KEY = "test-secret-key-$(Get-Random)-$(Get-Random)"
$env:FLASK_ENV = "production"

# Démarrer le serveur en background
$serverJob = Start-Job -ScriptBlock {
    param($WorkDir, $SecretKey)
    Set-Location $WorkDir
    $env:SECRET_KEY = $SecretKey
    $env:FLASK_ENV = "production"
    python src\web\app.py
} -ArgumentList (Get-Location), $env:SECRET_KEY

Write-Host "  Attente du démarrage (5s)..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Vérifier que le serveur est démarré
$jobState = $serverJob.State
if ($jobState -ne "Running") {
    Write-Host "❌ Le serveur n'a pas démarré correctement" -ForegroundColor Red
    Receive-Job $serverJob
    Stop-Job $serverJob
    Remove-Job $serverJob
    exit 1
}
Write-Host "✅ Application démarrée (Job ID: $($serverJob.Id))" -ForegroundColor Green
Write-Host ""

# Étape 3: Tests de production
Write-Host "[3/4] TESTS de production..." -ForegroundColor Yellow

$testsPassed = $true

# Test 1: Health check
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:5000/api/health" -Method GET -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ Health Check: OK" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Health Check: FAIL (Code: $($response.StatusCode))" -ForegroundColor Red
        $testsPassed = $false
    }
} catch {
    Write-Host "  ❌ Health Check: FAIL ($($_.Exception.Message))" -ForegroundColor Red
    $testsPassed = $false
}

# Test 2: Page d'accueil
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:5000/" -Method GET -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -in @(200, 302)) {
        Write-Host "  ✅ Page d'accueil: OK" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Page d'accueil: FAIL (Code: $($response.StatusCode))" -ForegroundColor Red
        $testsPassed = $false
    }
} catch {
    Write-Host "  ❌ Page d'accueil: FAIL ($($_.Exception.Message))" -ForegroundColor Red
    $testsPassed = $false
}

# Test 3: API credentials
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:5000/api/check-credentials" -Method GET -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ API Credentials: OK" -ForegroundColor Green
    } else {
        Write-Host "  ❌ API Credentials: FAIL (Code: $($response.StatusCode))" -ForegroundColor Red
        $testsPassed = $false
    }
} catch {
    Write-Host "  ❌ API Credentials: FAIL ($($_.Exception.Message))" -ForegroundColor Red
    $testsPassed = $false
}

# Test 4: Static files
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:5000/static/css/style.css" -Method GET -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -in @(200, 304, 404)) {
        Write-Host "  ✅ Static Files: OK" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Static Files: WARN (Code: $($response.StatusCode))" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️  Static Files: WARN (Non critique)" -ForegroundColor Yellow
}

Write-Host ""

# Étape 4: Vérification finale
Write-Host "[4/4] VÉRIFICATION FINALE..." -ForegroundColor Yellow

if ($testsPassed) {
    Write-Host "✅ Tous les tests sont passés!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Application disponible sur: http://127.0.0.1:5000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Commandes utiles:" -ForegroundColor Gray
    Write-Host "  - Arrêter le serveur: Stop-Job $($serverJob.Id); Remove-Job $($serverJob.Id)" -ForegroundColor Gray
    Write-Host "  - Voir les logs: Receive-Job $($serverJob.Id)" -ForegroundColor Gray
    Write-Host ""
    
    # Proposer de garder le serveur actif
    Write-Host "Voulez-vous garder le serveur actif? (O/N)" -ForegroundColor Yellow
    $keep = Read-Host
    if ($keep -eq "O" -or $keep -eq "o") {
        Write-Host "✅ Serveur maintenu actif. Utilisez les commandes ci-dessus pour le gérer." -ForegroundColor Green
        exit 0
    }
} else {
    Write-Host "❌ Certains tests ont échoué" -ForegroundColor Red
    Write-Host ""
    Write-Host "Logs du serveur:" -ForegroundColor Gray
    Receive-Job $serverJob
}

# Nettoyer
Write-Host ""
Write-Host "Arrêt du serveur..." -ForegroundColor Gray
Stop-Job $serverJob
Remove-Job $serverJob
Write-Host "✅ Nettoyage terminé" -ForegroundColor Green

if ($testsPassed) {
    exit 0
} else {
    exit 1
}
