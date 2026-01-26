# ============================================
# CLOUDFLARE PAGES DIRECT UPLOAD - IA POSTE MANAGER
# Deploy Next.js app via Wrangler CLI
# ============================================

Write-Host "`n🚀 CLOUDFLARE PAGES DIRECT UPLOAD" -ForegroundColor Cyan
Write-Host "=" -Repeat 50 -ForegroundColor Cyan

# ===== STEP 1: Check prerequisites =====
Write-Host "`n[1/6] Vérification prérequis..." -ForegroundColor Yellow

# Check Wrangler
$wrangler = & npm list -g wrangler 2>&1 | Select-String "wrangler"
if (-not $wrangler) {
    Write-Host "❌ Wrangler non installé. Installation..." -ForegroundColor Red
    npm install -g wrangler
}
Write-Host "✅ Wrangler OK" -ForegroundColor Green

# Check .env.local
if (!(Test-Path ".env.local")) {
    Write-Host "❌ .env.local manquant!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ .env.local trouvé" -ForegroundColor Green

# ===== STEP 2: Authentication =====
Write-Host "`n[2/6] Authentification Cloudflare..." -ForegroundColor Yellow
$account = & wrangler whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Non authentifié. Lancez: wrangler login" -ForegroundColor Yellow
    & wrangler login
}
Write-Host "✅ Authentifié: $account" -ForegroundColor Green

# ===== STEP 3: List projects =====
Write-Host "`n[3/6] Projets Cloudflare disponibles..." -ForegroundColor Yellow
$projects = & wrangler pages project list 2>&1
if ($projects -match "iapostemanage") {
    Write-Host "✅ Projet 'iapostemanage' trouvé" -ForegroundColor Green
    $PROJECT_NAME = "iapostemanage"
} else {
    Write-Host "⚠️  Projet 'iapostemanage' non trouvé" -ForegroundColor Yellow
    Write-Host "   Créez-le via: npx wrangler pages project create" -ForegroundColor Yellow
    exit 1
}

# ===== STEP 4: Build =====
Write-Host "`n[4/6] Build Next.js..." -ForegroundColor Yellow
Write-Host "   Commande: npm run build" -ForegroundColor Gray

Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build échoué!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build réussi" -ForegroundColor Green

# ===== STEP 5: Deploy =====
Write-Host "`n[5/6] Déploiement vers Cloudflare Pages..." -ForegroundColor Yellow

# Détecter la branche Git courante
$branch = & git branch --show-current 2>&1
Write-Host "   Branche Git: $branch" -ForegroundColor Gray

# Déterminer l'environnement
if ($branch -eq "main") {
    Write-Host "   Environnement: PRODUCTION" -ForegroundColor Cyan
    $deployCmd = "npx wrangler pages deploy .next/standalone --project-name=$PROJECT_NAME"
} elseif ($branch -eq "staging") {
    Write-Host "   Environnement: STAGING" -ForegroundColor Cyan
    $deployCmd = "npx wrangler pages deploy .next/standalone --project-name=$PROJECT_NAME --branch=staging"
} else {
    Write-Host "   Environnement: PREVIEW ($branch)" -ForegroundColor Cyan
    $deployCmd = "npx wrangler pages deploy .next/standalone --project-name=$PROJECT_NAME --branch=$branch"
}

Write-Host "   Commande: $deployCmd`n" -ForegroundColor Gray

Invoke-Expression $deployCmd

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Déploiement échoué!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Déploiement réussi" -ForegroundColor Green

# ===== STEP 6: Summary =====
Write-Host "`n[6/6] Résumé & Prochaines étapes" -ForegroundColor Yellow

$prodUrl = "https://$PROJECT_NAME.pages.dev"
$previewUrl = "https://$branch.$PROJECT_NAME.pages.dev"

Write-Host "`n📊 URLs de déploiement:" -ForegroundColor Cyan
Write-Host "   Production (main):  $prodUrl" -ForegroundColor White
Write-Host "   Preview ($branch):  $previewUrl" -ForegroundColor White

Write-Host "`n🔗 Commandes utiles:" -ForegroundColor Cyan
Write-Host "   Lister projets:      npx wrangler pages project list" -ForegroundColor Gray
Write-Host "   Lister déploiements: npx wrangler pages deployment list" -ForegroundColor Gray
Write-Host "   Voir logs:           npx wrangler pages deployment tail" -ForegroundColor Gray
Write-Host "   Éditer production:   wrangler pages project update iapostemanage --production-branch=main" -ForegroundColor Gray

Write-Host "`n📖 Documentation:" -ForegroundColor Cyan
Write-Host "   Cloudflare Docs:     https://developers.cloudflare.com/pages/get-started/direct-upload/" -ForegroundColor Gray
Write-Host "   Dashboard:           https://dash.cloudflare.com/?to=/:account/pages" -ForegroundColor Gray

Write-Host "`nConfiguration d'environnement:" -ForegroundColor Cyan
Write-Host "   1. Variables necessaires par environnement:" -ForegroundColor Gray
Write-Host "      - DATABASE_URL" -ForegroundColor Gray
Write-Host "      - NEXTAUTH_SECRET" -ForegroundColor Gray
Write-Host "      - NEXTAUTH_URL (depend de l'env)" -ForegroundColor Gray
Write-Host "   2. Configurez via:" -ForegroundColor Gray
Write-Host "      - Dashboard Cloudflare > Pages > Settings > Environment Variables" -ForegroundColor Gray
Write-Host "      - Ou: npx wrangler env add VARIABLE_NAME production" -ForegroundColor Gray

Write-Host "`n✅ DÉPLOIEMENT TERMINÉ!" -ForegroundColor Green
Write-Host "=" -Repeat 50 -ForegroundColor Cyan
Write-Host ""
