#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script de tests automatiques complets
.DESCRIPTION
    Execute tous les tests: unitaires, TypeScript, build
#>

$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"

Write-Output ""
Write-Output "========================================"
Write-Output "   IA Poste Manager - Tests Automatiques"
Write-Output "========================================"
Write-Output ""

$totalTests = 0
$passedTests = 0
$failedTests = 0

# Test 1: Verification TypeScript
Write-Output "[TEST 1/4] Verification TypeScript..."
$totalTests++

$tscOutput = npx tsc --noEmit 2>&1 | Out-String
$tscErrors = ($tscOutput | Select-String "error TS").Count

if ($tscErrors -eq 0) {
    Write-Output "   [OK] Aucune erreur TypeScript"
    $passedTests++
} else {
    Write-Output "   [X] $tscErrors erreurs TypeScript detectees"
    Write-Output "   -> Voir les details avec: npx tsc --noEmit"
    $failedTests++
}

# Test 2: Verification des variables d'environnement
Write-Output ""
Write-Output "[TEST 2/4] Variables d'environnement..."
$totalTests++

$envVars = Get-Content .env.local | Select-String -Pattern "^[A-Z]"
$envCount = $envVars.Count

if ($envCount -ge 20) {
    Write-Output "   [OK] $envCount variables configurees"
    $passedTests++
} else {
    Write-Output "   [X] Seulement $envCount variables (minimum 20 requis)"
    $failedTests++
}

# Test 3: Build de production
Write-Output ""
Write-Output "[TEST 3/4] Build de production..."
$totalTests++

Write-Output "   -> Nettoyage du cache..."
Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue

Write-Output "   -> Lancement du build..."
$buildResult = npm run build 2>&1 | Out-String

if ($LASTEXITCODE -eq 0) {
    Write-Output "   [OK] Build reussi"
    $passedTests++
} else {
    Write-Output "   [X] Build echoue"
    $failedTests++
}

# Test 4: Verification des fichiers critiques
Write-Output ""
Write-Output "[TEST 4/4] Fichiers critiques..."
$totalTests++

$criticalFiles = @(
    "prisma/schema.prisma",
    "src/app/layout.tsx",
    "package.json",
    "next.config.ts"
)

$missingFiles = @()
foreach ($file in $criticalFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -eq 0) {
    Write-Output "   [OK] Tous les fichiers critiques presents"
    $passedTests++
} else {
    Write-Output "   [X] Fichiers manquants: $($missingFiles -join ', ')"
    $failedTests++
}

# Resume
Write-Output ""
Write-Output "========================================"
Write-Output "   RESUME DES TESTS"
Write-Output "========================================"
Write-Output "   Total:   $totalTests"
Write-Output "   Reussis: $passedTests"
Write-Output "   Echecs:  $failedTests"
Write-Output ""

if ($failedTests -eq 0) {
    Write-Output "[OK] Tous les tests ont reussi!"
    exit 0
} else {
    Write-Output "[WARN] Certains tests ont echoue"
    exit 1
}
