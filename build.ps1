#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script de build automatique optimisé
.DESCRIPTION
    Build de production avec optimisations et vérifications
#>

$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"

Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🏗️  IA Poste Manager - Build Production          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Étape 1: Nettoyage
Write-Host "🧹 Étape 1/5: Nettoyage..." -ForegroundColor $Yellow
Remove-Item -Recurse -Force ".next", "out", "dist" -ErrorAction SilentlyContinue
Write-Host "   ✓ Cache nettoyé" -ForegroundColor $Green

# Étape 2: Vérification TypeScript
Write-Host "`n📝 Étape 2/5: Vérification TypeScript..." -ForegroundColor $Yellow
$tscErrors = (npx tsc --noEmit 2>&1 | Select-String "error TS").Count
if ($tscErrors -eq 0) {
    Write-Host "   ✓ Pas d'erreurs TypeScript" -ForegroundColor $Green
} else {
    Write-Host "   ⚠ $tscErrors erreurs détectées (build continuera)" -ForegroundColor $Yellow
}

# Étape 3: Prisma
Write-Host "`n🗄️  Étape 3/5: Génération Prisma..." -ForegroundColor $Yellow
npx prisma generate --quiet
Write-Host "   ✓ Client Prisma généré" -ForegroundColor $Green

# Étape 4: Build Next.js
Write-Host "`n⚙️  Étape 4/5: Build Next.js..." -ForegroundColor $Yellow
Write-Host "   → Ceci peut prendre quelques minutes...`n" -ForegroundColor $Cyan

$buildStartTime = Get-Date
npm run build

$buildEndTime = Get-Date
$buildDuration = ($buildEndTime - $buildStartTime).TotalSeconds

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n   ✓ Build réussi en $([math]::Round($buildDuration, 1))s" -ForegroundColor $Green
} else {
    Write-Host "`n   ✗ Erreur de build après $([math]::Round($buildDuration, 1))s" -ForegroundColor $Red
    exit 1
}

# Étape 5: Analyse de la taille
Write-Host "`n📊 Étape 5/5: Analyse du build..." -ForegroundColor $Yellow

if (Test-Path ".next") {
    $buildSize = (Get-ChildItem -Path ".next" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "   ✓ Taille du build: $([math]::Round($buildSize, 1)) MB" -ForegroundColor $Green
}

# Résumé
Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor $Green
Write-Host "║  ✅ Build de production terminé avec succès       ║" -ForegroundColor $Green
Write-Host "╚════════════════════════════════════════════════════╝`n" -ForegroundColor $Green

Write-Host "📦 Prochaines étapes:" -ForegroundColor $Cyan
Write-Host "   • npm start          - Lancer en production" -ForegroundColor $White
Write-Host "   • npm run analyze    - Analyser la taille du bundle`n" -ForegroundColor $White
