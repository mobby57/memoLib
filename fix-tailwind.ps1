```powershell
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " MEMOLIB - FIX TAILWIND" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Vérification du dossier
if (-not (Test-Path ".\package.json")) {
    Write-Host "ERREUR : package.json introuvable." -ForegroundColor Red
    exit 1
}

# Vérification npm
Write-Host "[1/7] Vérification de npm..." -ForegroundColor Yellow
npm --version
if ($LASTEXITCODE -ne 0) {
    throw "npm n'est pas disponible."
}

# Backup de package.json
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host ""
Write-Host "[2/7] Sauvegarde de package.json et postcss.config.js..." -ForegroundColor Yellow

Copy-Item ".\package.json" ".\package.json.backup.tailwind_$timestamp" -Force

if (Test-Path ".\package-lock.json") {
    Copy-Item ".\package-lock.json" ".\package-lock.json.backup.tailwind_$timestamp" -Force
}

if (Test-Path ".\postcss.config.js") {
    Copy-Item ".\postcss.config.js" ".\postcss.config.js.backup.tailwind_$timestamp" -Force
}

# Désinstallation Tailwind 4
Write-Host ""
Write-Host "[3/7] Suppression de Tailwind 4..." -ForegroundColor Yellow

npm uninstall tailwindcss @tailwindcss/postcss

if ($LASTEXITCODE -ne 0) {
    throw "La désinstallation de Tailwind a échoué."
}

# Installation versions compatibles Tailwind 3
Write-Host ""
Write-Host "[4/7] Installation de Tailwind 3..." -ForegroundColor Yellow

npm install -D tailwindcss@3.4.17 postcss@8.5.23 autoprefixer@10.4.21

if ($LASTEXITCODE -ne 0) {
    throw "L'installation de Tailwind 3 a échoué."
}

# Configuration PostCSS
Write-Host ""
Write-Host "[5/7] Configuration de PostCSS..." -ForegroundColor Yellow

@'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
'@ | Set-Content ".\postcss.config.js" -Encoding UTF8

# Nettoyage Next
Write-Host ""
Write-Host "[6/7] Nettoyage du cache Next.js..." -ForegroundColor Yellow

if (Test-Path ".\.next") {
    Remove-Item ".\.next" -Recurse -Force
}

# Vérification
Write-Host ""
Write-Host "[7/7] Vérification des versions..." -ForegroundColor Yellow
Write-Host ""

npm ls tailwindcss postcss autoprefixer

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ATTENTION : npm ls signale un problème." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host " TAILWIND CORRIGE" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Sauvegardes créées avec le suffixe :" -ForegroundColor Cyan
Write-Host "tailwind_$timestamp" -ForegroundColor White

Write-Host ""
Write-Host "Configuration PostCSS :" -ForegroundColor Cyan
Get-Content ".\postcss.config.js"

Write-Host ""
Write-Host "Pour démarrer :" -ForegroundColor Cyan
Write-Host "npm run dev" -ForegroundColor White
Write-Host ""
```
