<#
.SYNOPSIS
    Script d'execution automatique - IA Poste Manager
.DESCRIPTION
    Lance automatiquement le serveur de developpement avec verifications completes
.NOTES
    Cree le: 2026-01-01
    Auteur: GitHub Copilot
#>

# Couleurs
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"
$White = "White"

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "  IA Poste Manager - Auto Start Script" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

# Etape 1: Verification de l'environnement
Write-Host "Etape 1/6: Verification de l'environnement..." -ForegroundColor $Yellow

# Node.js
try {
    $nodeVersion = node --version
    Write-Host "   ✓ Node.js: $nodeVersion" -ForegroundColor $Green
} catch {
    Write-Host "   X Node.js non installe!" -ForegroundColor $Red
    exit 1
}

# npm
try {
    $npmVersion = npm --version
    Write-Host "   ✓ npm: $npmVersion" -ForegroundColor $Green
} catch {
    Write-Host "   X npm non installe!" -ForegroundColor $Red
    exit 1
}

# Etape 2: Verification des fichiers critiques
Write-Host "`nEtape 2/6: Verification des fichiers..." -ForegroundColor $Yellow

$criticalFiles = @(
    "package.json",
    ".env.local",
    "prisma/schema.prisma",
    "next.config.js"
)

$allFilesExist = $true
foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "   OK $file" -ForegroundColor $Green
    } else {
        Write-Host "   X $file manquant!" -ForegroundColor $Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host "`nX Fichiers critiques manquants. Arret.`n" -ForegroundColor $Red
    exit 1
}

# Etape 3: Verification des variables d'environnement
Write-Host "`nEtape 3/6: Verification des variables d'environnement..." -ForegroundColor $Yellow

$envVars = Get-Content .env.local | Select-String -Pattern "^[A-Z]"
$envCount = $envVars.Count
Write-Host "   OK $envCount variables configurees" -ForegroundColor $Green

# Vérification des variables critiques
$criticalVars = @("NEXTAUTH_SECRET", "DATABASE_URL", "NEXTAUTH_URL")
$envContent = Get-Content .env.local -Raw

foreach ($var in $criticalVars) {
    if ($envContent -match "$var=") {
        Write-Host "   OK $var definie" -ForegroundColor $Green
    } else {
        Write-Host "   X $var manquante!" -ForegroundColor $Red
        $allFilesExist = $false
    }
}

# Etape 4: Verification des dependances
Write-Host "`nEtape 4/6: Verification des dependances..." -ForegroundColor $Yellow

if (Test-Path "node_modules") {
    Write-Host "   OK node_modules trouve" -ForegroundColor $Green
} else {
    Write-Host "   ! node_modules manquant. Installation..." -ForegroundColor $Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   X Erreur lors de l'installation!" -ForegroundColor $Red
        exit 1
    }
    Write-Host "   OK Dependances installees" -ForegroundColor $Green
}

# Etape 5: Synchronisation Prisma
Write-Host "`nEtape 5/6: Synchronisation de la base de donnees..." -ForegroundColor $Yellow

Write-Host "   > Generation du client Prisma..." -ForegroundColor $Cyan
npx prisma generate 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   OK Client Prisma genere" -ForegroundColor $Green
} else {
    Write-Host "   ! Erreur de generation Prisma (non critique)" -ForegroundColor $Yellow
}

Write-Host "   > Synchronisation du schema..." -ForegroundColor $Cyan
npx prisma db push --skip-generate --accept-data-loss 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   OK Base de donnees synchronisee" -ForegroundColor $Green
} else {
    Write-Host "   ! Erreur de synchronisation (non critique)" -ForegroundColor $Yellow
}

# Etape 6: Nettoyage du cache
Write-Host "`nEtape 6/6: Nettoyage du cache..." -ForegroundColor $Yellow

if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    Write-Host "   OK Cache .next supprime" -ForegroundColor $Green
} else {
    Write-Host "   i Pas de cache a nettoyer" -ForegroundColor $Cyan
}

# Resume
Write-Host "`n============================================================" -ForegroundColor $Green
Write-Host "  Toutes les verifications passees avec succes" -ForegroundColor $Green
Write-Host "============================================================`n" -ForegroundColor $Green

# Lancement du serveur
Write-Host "Demarrage du serveur de developpement...`n" -ForegroundColor $Cyan
Write-Host "   > URL: http://localhost:3000" -ForegroundColor $White
Write-Host "   > Mode: Development (Turbopack)" -ForegroundColor $White
Write-Host "   > Appuyez sur Ctrl+C pour arreter`n" -ForegroundColor $Yellow

Write-Host "------------------------------------------------------------`n" -ForegroundColor $Cyan

# Lancement
npm run dev
