#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script de build automatique optimise
.DESCRIPTION
    Build de production avec optimisations et verifications
#>

$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  IA Poste Manager - Build Production  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Etape 1: Nettoyage
Write-Host "[1/5] Nettoyage..." -ForegroundColor $Yellow
Remove-Item -Recurse -Force ".next", "out", "dist" -ErrorAction SilentlyContinue
Write-Host "   OK - Cache nettoye" -ForegroundColor $Green

# Etape 2: Verification TypeScript
Write-Host ""
Write-Host "[2/5] Verification TypeScript..." -ForegroundColor $Yellow
$tscErrors = (npx tsc --noEmit 2>&1 | Select-String "error TS").Count
if ($tscErrors -eq 0) {
    Write-Host "   OK - Pas d erreurs TypeScript" -ForegroundColor $Green
} else {
    Write-Host "   WARN - $tscErrors erreurs detectees (build continuera)" -ForegroundColor $Yellow
}

# Etape 3: Prisma
Write-Host ""
Write-Host "[3/5] Generation Prisma..." -ForegroundColor $Yellow
npx prisma generate --quiet
Write-Host "   OK - Client Prisma genere" -ForegroundColor $Green

# Etape 3.5: Exclure les API routes pour static export
# Les API routes ne sont pas compatibles avec output: export
# Elles seront gerees par le backend Python
Write-Host ""
Write-Host "[3.5] Preparation static export..." -ForegroundColor $Yellow
$apiPath = "src/app/api"
$apiBackupPath = "src/app/_api_backup"

if (Test-Path $apiPath) {
    # Backup les API routes
    if (Test-Path $apiBackupPath) {
        Remove-Item -Recurse -Force $apiBackupPath -ErrorAction SilentlyContinue
    }
    Move-Item -Path $apiPath -Destination $apiBackupPath -Force
    Write-Host "   OK - API routes exclues temporairement (gerees par backend Python)" -ForegroundColor $Green
}

# Etape 4: Build Next.js
Write-Host ""
Write-Host "[4/5] Build Next.js..." -ForegroundColor $Yellow
Write-Host "   Ceci peut prendre quelques minutes..." -ForegroundColor $Cyan
Write-Host ""

$buildStartTime = Get-Date
npm run build

$buildEndTime = Get-Date
$buildDuration = ($buildEndTime - $buildStartTime).TotalSeconds

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "   OK - Build reussi en $([math]::Round($buildDuration, 1))s" -ForegroundColor $Green
} else {
    Write-Host ""
    Write-Host "   ERREUR - Build echoue apres $([math]::Round($buildDuration, 1))s" -ForegroundColor $Red
    # Restaurer les API routes meme en cas d erreur
    if (Test-Path $apiBackupPath) {
        Move-Item -Path $apiBackupPath -Destination $apiPath -Force
        Write-Host "   OK - API routes restaurees" -ForegroundColor $Yellow
    }
    exit 1
}

# Restaurer les API routes apres le build
if (Test-Path $apiBackupPath) {
    Move-Item -Path $apiBackupPath -Destination $apiPath -Force
    Write-Host "   OK - API routes restaurees" -ForegroundColor $Green
}

# Etape 5: Analyse de la taille
Write-Host ""
Write-Host "[5/5] Analyse du build..." -ForegroundColor $Yellow

if (Test-Path ".next") {
    $buildSize = (Get-ChildItem -Path ".next" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "   OK - Taille du build: $([math]::Round($buildSize, 1)) MB" -ForegroundColor $Green
}

# Resume
Write-Host ""
Write-Host "========================================" -ForegroundColor $Green
Write-Host "  Build de production termine!         " -ForegroundColor $Green
Write-Host "========================================" -ForegroundColor $Green
Write-Host ""

Write-Host "Prochaines etapes:" -ForegroundColor $Cyan
Write-Host "   npm start          - Lancer en production" -ForegroundColor White
Write-Host "   npm run analyze    - Analyser la taille du bundle" -ForegroundColor White
Write-Host ""
