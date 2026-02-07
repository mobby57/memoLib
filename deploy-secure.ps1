# 🔒 Script de Déploiement Sécurisé - MemoLib (PowerShell)
# Vérifie les vulnérabilités avant déploiement

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("vercel", "fly")]
    [string]$Platform
)

Write-Host "🔍 Vérification de sécurité pré-déploiement..." -ForegroundColor Cyan

# 1. Vérifier que les comptes démo sont désactivés en production
Write-Host "✅ Vérification des comptes démo..." -ForegroundColor Green
if (Test-Path ".env.production.local") {
    $prodEnv = Get-Content ".env.production.local" -Raw
    if ($prodEnv -match "DEMO_MODE=true") {
        Write-Host "❌ ERREUR: DEMO_MODE activé en production!" -ForegroundColor Red
        exit 1
    }
}

$authFile = "src\app\api\auth\[...nextauth]\route.ts"
if (Test-Path $authFile) {
    $authContent = Get-Content $authFile -Raw
    if ($authContent -match "admin123|demo123") {
        Write-Host "❌ ERREUR: Mots de passe hardcodés détectés!" -ForegroundColor Red
        exit 1
    }
}

# 2. Vérifier les variables d'environnement critiques
Write-Host "✅ Vérification des variables d'environnement..." -ForegroundColor Green
$requiredVars = @("NEXTAUTH_SECRET", "DATABASE_URL")
foreach ($var in $requiredVars) {
    if (-not [Environment]::GetEnvironmentVariable($var)) {
        Write-Host "❌ ERREUR: Variable $var manquante!" -ForegroundColor Red
        exit 1
    }
}

# 3. Audit des dépendances
Write-Host "✅ Audit des dépendances..." -ForegroundColor Green
try {
    npm audit --audit-level=high
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️ Vulnérabilités détectées dans les dépendances" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Impossible d'exécuter npm audit" -ForegroundColor Yellow
}

# 4. Build de production
Write-Host "✅ Build de production..." -ForegroundColor Green
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERREUR: Build échoué!" -ForegroundColor Red
    exit 1
}

# 5. Vérification des headers de sécurité
Write-Host "✅ Vérification de la configuration de sécurité..." -ForegroundColor Green
$nextConfig = Get-Content "next.config.js" -Raw
if ($nextConfig -notmatch "Strict-Transport-Security") {
    Write-Host "❌ ERREUR: Headers HSTS manquants!" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Toutes les vérifications de sécurité sont passées!" -ForegroundColor Green
Write-Host "🚀 Prêt pour le déploiement sécurisé" -ForegroundColor Green

# Déploiement selon la plateforme
switch ($Platform) {
    "vercel" {
        Write-Host "🚀 Déploiement Vercel..." -ForegroundColor Cyan
        vercel --prod
    }
    "fly" {
        Write-Host "🚀 Déploiement Fly.io..." -ForegroundColor Cyan
        fly deploy
    }
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Déploiement réussi!" -ForegroundColor Green
} else {
    Write-Host "❌ Échec du déploiement" -ForegroundColor Red
    exit 1
}