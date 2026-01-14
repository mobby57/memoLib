#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Déploiement GRATUIT sur Vercel - IA Poste Manager
.DESCRIPTION
    Script automatique pour déployer l'application sur Vercel (100% gratuit)
#>

param(
    [switch]$SkipInstall,
    [switch]$Production
)

# Couleurs
$Green = "Green"
$Yellow = "Yellow"
$Cyan = "Cyan"
$Red = "Red"

# Banner
Write-Host ""
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "                                                         " -ForegroundColor Cyan
Write-Host "     DEPLOIEMENT GRATUIT - IA POSTE MANAGER              " -ForegroundColor Cyan
Write-Host "                                                         " -ForegroundColor Cyan
Write-Host "     Plateforme : Vercel (FREE)                          " -ForegroundColor Cyan
Write-Host "     Base de donnees : PostgreSQL (256 MB)               " -ForegroundColor Cyan
Write-Host "     Cout : 0 EUR/mois                                   " -ForegroundColor Cyan
Write-Host "                                                         " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

# Etape 1 : Verifier Node.js
Write-Host "[1/5] Verification de l'environnement..." -ForegroundColor Yellow
Write-Host ""

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERREUR] Node.js n'est pas installe." -ForegroundColor Red
    Write-Host "Installez Node.js depuis : https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

$nodeVersion = node --version
Write-Host "[OK] Node.js : $nodeVersion" -ForegroundColor Green

# Etape 2 : Installer Vercel CLI
if (-not $SkipInstall) {
    Write-Host ""
    Write-Host "[2/5] Installation de Vercel CLI..." -ForegroundColor Yellow
    Write-Host ""
    
    if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
        Write-Host "Installation de Vercel CLI globalement..." -ForegroundColor Cyan
        npm install -g vercel
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERREUR] Installation de Vercel CLI echouee" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "[OK] Vercel CLI deja installe" -ForegroundColor Green
    }
} else {
    Write-Host ""
    Write-Host "[2/5] Installation ignoree (--SkipInstall)" -ForegroundColor Yellow
}

# Etape 3 : Connexion a Vercel
Write-Host ""
Write-Host "[3/5] Connexion a Vercel..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Un navigateur va s'ouvrir pour l'authentification." -ForegroundColor Cyan
Write-Host "Connectez-vous avec votre compte Vercel (gratuit)." -ForegroundColor Cyan
Write-Host ""

vercel login

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERREUR] Connexion a Vercel echouee" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[OK] Connexion reussie !" -ForegroundColor Green

# Etape 4 : Build local (optionnel)
Write-Host ""
Write-Host "[4/5] Preparation du build..." -ForegroundColor Yellow
Write-Host ""

# Verifier que les dependances sont installees
if (-not (Test-Path "node_modules")) {
    Write-Host "Installation des dependances..." -ForegroundColor Cyan
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERREUR] Installation des dependances echouee" -ForegroundColor Red
        exit 1
    }
}

Write-Host "[OK] Dependances pretes" -ForegroundColor Green

# Etape 5 : Deploiement
Write-Host ""
Write-Host "[5/5] Deploiement sur Vercel..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Cela peut prendre 2-3 minutes..." -ForegroundColor Cyan
Write-Host ""

if ($Production) {
    vercel --prod
} else {
    vercel
}

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERREUR] Deploiement echoue" -ForegroundColor Red
    exit 1
}

# Succes !
Write-Host ""
Write-Host "=========================================================" -ForegroundColor Green
Write-Host "                                                         " -ForegroundColor Green
Write-Host "         DEPLOIEMENT REUSSI !                            " -ForegroundColor Green
Write-Host "                                                         " -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green
Write-Host ""

# Instructions post-deploiement
Write-Host "Prochaines etapes pour finaliser :" -ForegroundColor Cyan
Write-Host ""
Write-Host "  [1] Aller sur : https://vercel.com/dashboard" -ForegroundColor White
Write-Host ""
Write-Host "  [2] Cliquer sur votre projet : iapostemanager" -ForegroundColor White
Write-Host ""
Write-Host "  [3] Onglet 'Storage' -> Create Database -> Postgres" -ForegroundColor White
Write-Host "      * Nom : iapostemanager-db" -ForegroundColor Gray
Write-Host "      * Region : Frankfurt, Germany (proche France)" -ForegroundColor Gray
Write-Host ""
Write-Host "  [4] Connecter la DB au projet :" -ForegroundColor White
Write-Host "      * Connect to Project -> Selectionner iapostemanager" -ForegroundColor Gray
Write-Host ""
Write-Host "  [5] Dans ce terminal, executer :" -ForegroundColor White
Write-Host ""
Write-Host "       vercel env pull .env.local" -ForegroundColor Yellow
Write-Host "       npx prisma generate" -ForegroundColor Yellow
Write-Host "       npx prisma db push" -ForegroundColor Yellow
Write-Host "       npx prisma db seed" -ForegroundColor Yellow
Write-Host ""
Write-Host "  [6] Ajouter les variables d'environnement :" -ForegroundColor White
Write-Host "      Dashboard Vercel -> Settings -> Environment Variables" -ForegroundColor Gray
Write-Host ""
Write-Host "      NEXTAUTH_URL=https://iapostemanager.vercel.app" -ForegroundColor Gray
Write-Host "      NEXTAUTH_SECRET=<generer-secret-avec-openssl>" -ForegroundColor Gray
Write-Host ""
Write-Host "  [7] Redeployer avec les nouvelles variables :" -ForegroundColor White
Write-Host ""
Write-Host "      vercel --prod" -ForegroundColor Yellow
Write-Host ""

# Generer NEXTAUTH_SECRET
Write-Host "Besoin d'un NEXTAUTH_SECRET ? Utilisez :" -ForegroundColor Cyan
Write-Host ""
Write-Host "   openssl rand -base64 32" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Ou en PowerShell :" -ForegroundColor Gray
Write-Host "   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))" -ForegroundColor Yellow
Write-Host ""

# Ressources
Write-Host "Ressources utiles :" -ForegroundColor Cyan
Write-Host ""
Write-Host "  * Documentation Vercel : https://vercel.com/docs" -ForegroundColor White
Write-Host "  * Vercel Postgres : https://vercel.com/docs/storage/vercel-postgres" -ForegroundColor White
Write-Host "  * Support : https://vercel.com/help" -ForegroundColor White
Write-Host ""

# Recapitulatif
Write-Host "Recapitulatif de votre deploiement GRATUIT :" -ForegroundColor Cyan
Write-Host ""
Write-Host "  [OK] Hosting : Vercel (FREE)" -ForegroundColor Green
Write-Host "  [OK] Base de donnees : PostgreSQL 256 MB (FREE)" -ForegroundColor Green
Write-Host "  [OK] SSL/HTTPS : Automatique" -ForegroundColor Green
Write-Host "  [OK] CDN Global : Inclus" -ForegroundColor Green
Write-Host "  [OK] Deploiement continu : GitHub integre" -ForegroundColor Green
Write-Host "  [OK] Cout mensuel : 0 EUR" -ForegroundColor Green
Write-Host ""

Write-Host "Felicitations ! Votre app sera bientot en ligne !" -ForegroundColor Green
Write-Host ""
