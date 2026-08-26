$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       MEMOLIB - PRODUCTION PREFLIGHT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Run-Step {
    param(
        [string]$Name,
        [string]$Command
    )

    Write-Host ""
    Write-Host ">>> $Name" -ForegroundColor Yellow
    Write-Host $Command -ForegroundColor DarkGray

    Invoke-Expression $Command

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ ECHEC : $Name" -ForegroundColor Red
        exit $LASTEXITCODE
    }

    Write-Host "✅ OK : $Name" -ForegroundColor Green
}

# Vérification Node / npm
Run-Step "Node.js" "node --version"
Run-Step "npm" "npm --version"

# Dépendances
if (-not (Test-Path "node_modules")) {
    Write-Host "❌ node_modules absent. Lance npm install." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host ">>> Vérification des dépendances" -ForegroundColor Yellow
npm ls --depth=0
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Certaines dépendances semblent invalides." -ForegroundColor Yellow
}

# TypeScript
if (Test-Path "tsconfig.json") {
    Run-Step "TypeScript" "npx tsc --noEmit"
}

# Tests
Run-Step "Tests Vitest" "npm run test"

# Build
Run-Step "Build production" "npm run build"

# Prisma
if (Test-Path "prisma") {
    Write-Host ""
    Write-Host ">>> Prisma" -ForegroundColor Yellow

    npx prisma validate
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Prisma schema invalide" -ForegroundColor Red
        exit 1
    }

    Write-Host "✅ Prisma schema valide" -ForegroundColor Green
}

# Audit sécurité
Write-Host ""
Write-Host ">>> Audit npm" -ForegroundColor Yellow
npm audit --audit-level=high

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "⚠️ Des vulnérabilités HIGH/CRITICAL nécessitent une vérification." -ForegroundColor Red
}
else {
    Write-Host "✅ Pas de vulnérabilité HIGH/CRITICAL détectée." -ForegroundColor Green
}

# Variables d'environnement
Write-Host ""
Write-Host ">>> Variables d'environnement" -ForegroundColor Yellow

if (Test-Path ".env.local") {
    Write-Host "✅ .env.local présent" -ForegroundColor Green
}
else {
    Write-Host "⚠️ .env.local absent" -ForegroundColor Yellow
}

if (Test-Path ".env.example") {
    Write-Host "✅ .env.example présent" -ForegroundColor Green
}
else {
    Write-Host "⚠️ .env.example absent" -ForegroundColor Yellow
}

# Git
if (Test-Path ".git") {
    Write-Host ""
    Write-Host ">>> Git" -ForegroundColor Yellow

    $status = git status --short

    if ($status) {
        Write-Host "⚠️ Modifications non committeées :" -ForegroundColor Yellow
        git status --short
    }
    else {
        Write-Host "✅ Working tree propre" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       PREFLIGHT TERMINE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Tests : OK"
Write-Host "✅ TypeScript : OK"
Write-Host "✅ Build : OK"
Write-Host "✅ Prisma : OK"
Write-Host ""
Write-Host "⚠️ Vérifie les éventuels warnings ci-dessus avant production."
Write-Host ""