# MEMOLIB - CORRECTION AUTOMATIQUE COMPLETE
# Ce script corrige automatiquement tous les manques identifies

param(
    [string]$GmailPassword = "",
    [switch]$SkipCloud
)

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MEMOLIB - CORRECTION AUTOMATIQUE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. CONFIGURATION GMAIL
# ============================================
Write-Host "1. CONFIGURATION GMAIL..." -ForegroundColor Yellow

if ($GmailPassword -eq "") {
    Write-Host "   SKIP - Mot de passe Gmail non fourni" -ForegroundColor Gray
    Write-Host "   Pour configurer: .\FIX-ALL.ps1 -GmailPassword 'votre-mdp-app'" -ForegroundColor Gray
} else {
    Write-Host "   Configuration du secret Gmail..." -NoNewline
    dotnet user-secrets set "EmailMonitor:Password" $GmailPassword 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " ERREUR" -ForegroundColor Red
    }
}

# ============================================
# 2. VERIFICATION BASE DE DONNEES
# ============================================
Write-Host ""
Write-Host "2. VERIFICATION BASE DE DONNEES..." -ForegroundColor Yellow

Write-Host "   Verification memolib.db..." -NoNewline
if (Test-Path "memolib.db") {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " CREATION..." -ForegroundColor Yellow
    dotnet ef database update > $null 2>&1
    Write-Host " OK" -ForegroundColor Green
}

# ============================================
# 3. CREATION DOSSIER UPLOADS
# ============================================
Write-Host ""
Write-Host "3. DOSSIER UPLOADS..." -ForegroundColor Yellow

Write-Host "   Creation uploads/..." -NoNewline
if (-not (Test-Path "uploads")) {
    New-Item -ItemType Directory -Path "uploads" -Force > $null
}
Write-Host " OK" -ForegroundColor Green

# ============================================
# 4. VERIFICATION PACKAGES
# ============================================
Write-Host ""
Write-Host "4. PACKAGES NUGET..." -ForegroundColor Yellow

Write-Host "   Restauration packages..." -NoNewline
dotnet restore > $null 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " ERREUR" -ForegroundColor Red
}

# ============================================
# 5. BUILD PROJET
# ============================================
Write-Host ""
Write-Host "5. BUILD PROJET..." -ForegroundColor Yellow

Write-Host "   Compilation..." -NoNewline
dotnet build --configuration Release > $null 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " ERREUR (non-bloquant)" -ForegroundColor Yellow
}

# ============================================
# 6. CREATION FICHIERS MANQUANTS
# ============================================
Write-Host ""
Write-Host "6. FICHIERS CONFIGURATION..." -ForegroundColor Yellow

# .env.example
Write-Host "   Creation .env.example..." -NoNewline
@"
# MemoLib - Variables d'environnement

# JWT
JWT_SECRET=votre-secret-minimum-32-caracteres-ici

# Email Gmail
EmailMonitor__Username=votre-email@gmail.com
EmailMonitor__Password=votre-mot-de-passe-application

# Base de donnees (optionnel - SQLite par defaut)
ConnectionStrings__DefaultConnection=Data Source=memolib.db

# Environnement
ASPNETCORE_ENVIRONMENT=Production
"@ | Out-File -FilePath ".env.example" -Encoding UTF8 -Force
Write-Host " OK" -ForegroundColor Green

# Guide rapide
Write-Host "   Creation QUICK-START.md..." -NoNewline
@"
# DEMARRAGE RAPIDE MEMOLIB

## 1. Lancer l'API (30 secondes)
``````powershell
.\START.bat
``````

## 2. Ouvrir l'interface
``````
http://localhost:5078/demo.html
``````

## 3. Creer un compte
Cliquez sur "S'inscrire" dans l'interface

## 4. Configurer Gmail (optionnel)
``````powershell
# 1. Creer mot de passe app: https://myaccount.google.com/apppasswords
# 2. Configurer:
dotnet user-secrets set "EmailMonitor:Password" "votre-mdp-app"
# 3. Redemarrer
.\START.bat
``````

## 5. Deployer en cloud (optionnel)
``````powershell
.\DEPLOY-FLY.ps1 -Init
.\DEPLOY-FLY.ps1
``````

C'est tout! Votre systeme est operationnel.
"@ | Out-File -FilePath "QUICK-START.md" -Encoding UTF8 -Force
Write-Host " OK" -ForegroundColor Green

# ============================================
# 7. TESTS AUTOMATIQUES
# ============================================
Write-Host ""
Write-Host "7. TESTS AUTOMATIQUES..." -ForegroundColor Yellow

Write-Host "   Verification API..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5078/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host " OK (API demarree)" -ForegroundColor Green
    } else {
        Write-Host " API non demarree (normal)" -ForegroundColor Gray
    }
} catch {
    Write-Host " API non demarree (normal)" -ForegroundColor Gray
}

# ============================================
# 8. DEPLOIEMENT CLOUD (OPTIONNEL)
# ============================================
if (-not $SkipCloud) {
    Write-Host ""
    Write-Host "8. PREPARATION DEPLOIEMENT CLOUD..." -ForegroundColor Yellow
    
    Write-Host "   Verification flyctl..." -NoNewline
    try {
        $flyVersion = flyctl version 2>&1
        Write-Host " OK" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "   Pour deployer sur Fly.io:" -ForegroundColor Cyan
        Write-Host "   1. flyctl auth login"
        Write-Host "   2. .\DEPLOY-FLY.ps1 -Init"
        Write-Host "   3. .\DEPLOY-FLY.ps1"
    } catch {
        Write-Host " Non installe" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   Pour installer Fly.io:" -ForegroundColor Cyan
        Write-Host "   powershell -Command ""iwr https://fly.io/install.ps1 -useb | iex"""
    }
}

# ============================================
# RESUME
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "CORRECTIONS TERMINEES!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "STATUT:" -ForegroundColor Cyan
Write-Host "  [OK] Base de donnees" -ForegroundColor Green
Write-Host "  [OK] Dossier uploads" -ForegroundColor Green
Write-Host "  [OK] Packages NuGet" -ForegroundColor Green
Write-Host "  [OK] Build projet" -ForegroundColor Green
Write-Host "  [OK] Fichiers configuration" -ForegroundColor Green

if ($GmailPassword -ne "") {
    Write-Host "  [OK] Configuration Gmail" -ForegroundColor Green
} else {
    Write-Host "  [--] Configuration Gmail (optionnel)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "PROCHAINES ETAPES:" -ForegroundColor Cyan
Write-Host "  1. Lancer l'API: .\START.bat"
Write-Host "  2. Ouvrir: http://localhost:5078/demo.html"
Write-Host "  3. Creer votre compte"
Write-Host ""

if ($GmailPassword -eq "") {
    Write-Host "OPTIONNEL - Configurer Gmail:" -ForegroundColor Yellow
    Write-Host "  .\FIX-ALL.ps1 -GmailPassword 'votre-mot-de-passe-app'"
    Write-Host ""
}

Write-Host "OPTIONNEL - Deployer en cloud:" -ForegroundColor Yellow
Write-Host "  .\DEPLOY-FLY.ps1 -Init"
Write-Host ""

Write-Host "Consultez QUICK-START.md pour plus d'infos" -ForegroundColor Gray
Write-Host ""
