# DEPLOIEMENT CLOUDFLARE PAGES - SCRIPT AUTOMATISE
# 
# Pre-requis:
# - npm install --save-dev @cloudflare/next-on-pages wrangler --legacy-peer-deps
# - wrangler login (premiere fois)
#
# Usage: .\deploy-cloudflare.ps1

param(
    [switch]$SkipBuild,
    [switch]$Preview
)

$ErrorActionPreference = "Stop"

Write-Output ""
Write-Output "================================================"
Write-Output " DEPLOIEMENT CLOUDFLARE PAGES"
Write-Output "================================================"
Write-Output ""

# Verifier Wrangler installe
Write-Output "[STEP 1] Verification Wrangler CLI..."
Write-Output ""
if (-not (Get-Command wrangler -ErrorAction SilentlyContinue)) {
    Write-Output "[ERREUR] Wrangler non installe!"
    Write-Output "   Installation: npm install -g wrangler"
    exit 1
}

$wranglerVersion = wrangler --version 2>&1 | Out-String
Write-Output "   [OK] Wrangler: $($wranglerVersion.Trim())"
Write-Output ""

# Verifier authentification
Write-Output "[STEP 2] Verification authentification..."
Write-Output ""
$whoami = wrangler whoami 2>&1 | Out-String
if ($whoami -match "not authenticated") {
    Write-Output "[ERREUR] Non authentifie!"
    Write-Output "   Connexion: wrangler login"
    Write-Output "Lancement authentification..."
    wrangler login
    if ($LASTEXITCODE -ne 0) {
        Write-Output ""
        Write-Output "[ERREUR] Authentification echouee!"
        exit 1
    }
}
Write-Output "   [OK] Authentifie"
Write-Output ""

# Build Next.js pour Cloudflare
if (-not $SkipBuild) {
    Write-Output "[STEP 3] Build Next.js avec @cloudflare/next-on-pages..."
    Write-Output ""
    
    # Nettoyer builds precedents
    if (Test-Path ".vercel/output/static") {
        Remove-Item -Recurse -Force ".vercel/output/static"
    }
    
    Write-Output "   Building..."
    npx @cloudflare/next-on-pages
    
    if ($LASTEXITCODE -ne 0) {
        Write-Output ""
        Write-Output "[ERREUR] Build echoue!"
        exit 1
    }
    
    Write-Output "   [OK] Build termine"
} else {
    Write-Output "[STEP 3] Build ignore (--SkipBuild)"
}
Write-Output ""

# Deploiement
if ($Preview) {
    Write-Output "[STEP 4] Deploiement Preview..."
    wrangler pages deploy .vercel/output/static --project-name=memoLib --branch=preview
} else {
    Write-Output "[STEP 4] Deploiement Production..."
    wrangler pages deploy .vercel/output/static --project-name=memoLib --branch=main
}

if ($LASTEXITCODE -ne 0) {
    Write-Output ""
    Write-Output "[ERREUR] Deploiement echoue!"
    exit 1
}

Write-Output ""
Write-Output "================================================"
Write-Output " DEPLOIEMENT TERMINE"
Write-Output "================================================"
Write-Output ""
Write-Output "[OK] Application deployee sur Cloudflare Pages"
Write-Output ""
Write-Output "URLs:"
Write-Output "   Production: https://memoLib.pages.dev"
Write-Output "   Dashboard:  https://dash.cloudflare.com"
Write-Output ""
