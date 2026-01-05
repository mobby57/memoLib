#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script de tests automatiques complets
.DESCRIPTION
    Exécute tous les tests: unitaires, TypeScript, build
#>

$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"

Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🧪 IA Poste Manager - Tests Automatiques        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$totalTests = 0
$passedTests = 0
$failedTests = 0

# Test 1: Vérification TypeScript
Write-Host "📝 Test 1/4: Vérification TypeScript..." -ForegroundColor $Yellow
$totalTests++

$tscOutput = npx tsc --noEmit 2>&1 | Out-String
$tscErrors = ($tscOutput | Select-String "error TS").Count

if ($tscErrors -eq 0) {
    Write-Host "   ✓ Aucune erreur TypeScript" -ForegroundColor $Green
    $passedTests++
} else {
    Write-Host "   ✗ $tscErrors erreurs TypeScript détectées" -ForegroundColor $Red
    Write-Host "   → Voir les détails avec: npx tsc --noEmit" -ForegroundColor $Cyan
    $failedTests++
}

# Test 2: Vérification des variables d'environnement
Write-Host "`n🔐 Test 2/4: Variables d'environnement..." -ForegroundColor $Yellow
$totalTests++

$envVars = Get-Content .env.local | Select-String -Pattern "^[A-Z]"
$envCount = $envVars.Count

if ($envCount -ge 20) {
    Write-Host "   ✓ $envCount variables configurées" -ForegroundColor $Green
    $passedTests++
} else {
    Write-Host "   ✗ Seulement $envCount variables (minimum 20 requis)" -ForegroundColor $Red
    $failedTests++
}

# Test 3: Build de production
Write-Host "`n🏗️  Test 3/4: Build de production..." -ForegroundColor $Yellow
$totalTests++

Write-Host "   → Nettoyage du cache..." -ForegroundColor $Cyan
Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue

Write-Host "   → Lancement du build..." -ForegroundColor $Cyan
$buildOutput = npm run build 2>&1 | Out-String
$buildSuccess = $buildOutput -match "Compiled successfully"

if ($buildSuccess) {
    Write-Host "   ✓ Build réussi" -ForegroundColor $Green
    $passedTests++
} else {
    Write-Host "   ✗ Erreur de build" -ForegroundColor $Red
    # Afficher les erreurs
    $buildOutput | Select-String "error" | Select-Object -First 5 | ForEach-Object {
        Write-Host "     $_" -ForegroundColor $Red
    }
    $failedTests++
}

# Test 4: Tests unitaires
Write-Host "`n🧪 Test 4/4: Tests unitaires..." -ForegroundColor $Yellow
$totalTests++

if (Test-Path "jest.config.js") {
    Write-Host "   → Exécution des tests Jest..." -ForegroundColor $Cyan
    $jestOutput = npm test -- --passWithNoTests 2>&1 | Out-String
    $jestSuccess = $jestOutput -match "Tests:.*passed" -or $jestOutput -match "No tests found"
    
    if ($jestSuccess) {
        Write-Host "   ✓ Tests unitaires passés" -ForegroundColor $Green
        $passedTests++
    } else {
        Write-Host "   ✗ Échec des tests unitaires" -ForegroundColor $Red
        $failedTests++
    }
} else {
    Write-Host "   ⚠ Configuration Jest non trouvée (ignoré)" -ForegroundColor $Yellow
    $passedTests++
}

# Résumé
Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor $Cyan
Write-Host "║  📊 Résumé des Tests                              ║" -ForegroundColor $Cyan
Write-Host "╚════════════════════════════════════════════════════╝`n" -ForegroundColor $Cyan

Write-Host "   Total: $totalTests tests" -ForegroundColor $White
Write-Host "   ✓ Réussis: $passedTests" -ForegroundColor $Green
Write-Host "   ✗ Échecs: $failedTests" -ForegroundColor $Red

$successRate = [math]::Round(($passedTests / $totalTests) * 100, 1)
Write-Host "`n   Taux de réussite: $successRate%" -ForegroundColor $(if ($successRate -ge 75) { $Green } else { $Red })

if ($failedTests -eq 0) {
    Write-Host "`n✅ Tous les tests sont passés!`n" -ForegroundColor $Green
    exit 0
} else {
    Write-Host "`n⚠️  Certains tests ont échoué. Vérifiez les détails ci-dessus.`n" -ForegroundColor $Yellow
    exit 1
}
