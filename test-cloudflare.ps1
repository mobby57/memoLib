# ====================================================
# 🚀 TEST BUILD CLOUDFLARE PAGES
# ====================================================

Write-Host "
╔═══════════════════════════════════════════════════╗
║   🚀 TEST BUILD CLOUDFLARE PAGES                 ║
║   IA Poste Manager - Next.js 16                  ║
╚═══════════════════════════════════════════════════╝
" -ForegroundColor Cyan

# ====================================================
# ÉTAPE 1: VÉRIFIER PRÉREQUIS
# ====================================================
Write-Host "`n✅ ÉTAPE 1: Vérification prérequis`n" -ForegroundColor Green

# Vérifier Node.js
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "   ✓ Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "   ✗ Node.js non trouvé" -ForegroundColor Red
    exit 1
}

# Vérifier Git
$gitVersion = git --version 2>$null
if ($gitVersion) {
    Write-Host "   ✓ Git: $gitVersion" -ForegroundColor Green
} else {
    Write-Host "   ✗ Git non trouvé" -ForegroundColor Red
    exit 1
}

# Vérifier état du repo
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "   ⚠  Changements non commités détectés" -ForegroundColor Yellow
    git status --short
} else {
    Write-Host "   ✓ Repository propre" -ForegroundColor Green
}

# ====================================================
# ÉTAPE 2: TEST BUILD LOCAL
# ====================================================
Write-Host "`n🏗️  ÉTAPE 2: Test build local (simulation Cloudflare)`n" -ForegroundColor Cyan

# Variables d'environnement Cloudflare
$env:DATABASE_URL = "file:./dev.db"
$env:NEXTAUTH_URL = "https://iapostemanager.pages.dev"
$env:NEXTAUTH_SECRET = "vquobyYX9ptr8LfgJ0fcs7HtiA7B3HrC/0ji30D39OA="
$env:NEXT_TELEMETRY_DISABLED = "1"

Write-Host "   Configuration:" -ForegroundColor Yellow
Write-Host "   • DATABASE_URL: file:./dev.db" -ForegroundColor Gray
Write-Host "   • NEXTAUTH_URL: https://iapostemanager.pages.dev" -ForegroundColor Gray
Write-Host "   • Mode: Production" -ForegroundColor Gray

# Nettoyer build précédent
Write-Host "`n   Nettoyage build précédent..." -ForegroundColor Gray
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" 2>$null
}

# Installation dépendances
Write-Host "`n   📦 Installation dépendances..." -ForegroundColor Yellow
npm ci --legacy-peer-deps --silent
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n   ✗ Erreur installation dépendances" -ForegroundColor Red
    exit 1
}

# Générer Prisma Client
Write-Host "`n   🔧 Génération Prisma Client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n   ✗ Erreur génération Prisma" -ForegroundColor Red
    exit 1
}

# Build Next.js
Write-Host "`n   🏗️  Build Next.js (production)...`n" -ForegroundColor Cyan
$buildStart = Get-Date
npm run build
$buildSuccess = $LASTEXITCODE -eq 0
$buildDuration = (Get-Date) - $buildStart

if ($buildSuccess) {
    Write-Host "`n   ✅ BUILD RÉUSSI ! ($('{0:N1}' -f $buildDuration.TotalSeconds)s)" -ForegroundColor Green -BackgroundColor DarkGreen
} else {
    Write-Host "`n   ✗ BUILD ÉCHOUÉ" -ForegroundColor Red -BackgroundColor DarkRed
    exit 1
}

# ====================================================
# ÉTAPE 3: VÉRIFIER OUTPUT
# ====================================================
Write-Host "`n📊 ÉTAPE 3: Vérification output build`n" -ForegroundColor Cyan

# Vérifier .next/standalone
if (Test-Path ".next/standalone") {
    $standaloneSize = (Get-ChildItem ".next/standalone" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "   ✓ .next/standalone: $('{0:N2}' -f $standaloneSize) MB" -ForegroundColor Green
} else {
    Write-Host "   ✗ .next/standalone manquant" -ForegroundColor Red
    exit 1
}

# Vérifier .next/static
if (Test-Path ".next/static") {
    $staticSize = (Get-ChildItem ".next/static" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "   ✓ .next/static: $('{0:N2}' -f $staticSize) MB" -ForegroundColor Green
} else {
    Write-Host "   ⚠  .next/static manquant" -ForegroundColor Yellow
}

# Vérifier server.js
if (Test-Path ".next/standalone/server.js") {
    Write-Host "   ✓ server.js présent" -ForegroundColor Green
} else {
    Write-Host "   ✗ server.js manquant" -ForegroundColor Red
    exit 1
}

# ====================================================
# ÉTAPE 4: RÉSUMÉ DÉPLOIEMENT
# ====================================================
Write-Host "`n📋 ÉTAPE 4: Résumé déploiement Cloudflare`n" -ForegroundColor Cyan

Write-Host "   🌐 Configuration Cloudflare:" -ForegroundColor Yellow
Write-Host "   • Project: iapostemanager" -ForegroundColor Gray
Write-Host "   • URL: https://iapostemanager.pages.dev" -ForegroundColor Gray
Write-Host "   • Build Command: npm run build" -ForegroundColor Gray
Write-Host "   • Output Directory: .next/standalone" -ForegroundColor Gray

Write-Host "`n   📁 Fichiers à déployer:" -ForegroundColor Yellow
Write-Host "   • .next/standalone/" -ForegroundColor Gray
Write-Host "   • .next/static/" -ForegroundColor Gray
Write-Host "   • package.json" -ForegroundColor Gray
Write-Host "   • prisma/" -ForegroundColor Gray

Write-Host "`n   🔑 Variables d'environnement requises:" -ForegroundColor Yellow
Write-Host "   • DATABASE_URL" -ForegroundColor Gray
Write-Host "   • NEXTAUTH_SECRET" -ForegroundColor Gray
Write-Host "   • NEXTAUTH_URL" -ForegroundColor Gray
Write-Host "   • REDIS_URL (optionnel)" -ForegroundColor Gray

# ====================================================
# ÉTAPE 5: OPTIONS DE DÉPLOIEMENT
# ====================================================
Write-Host "`n🚀 ÉTAPE 5: Options de déploiement`n" -ForegroundColor Cyan

Write-Host "   Option A - GitHub Actions (AUTOMATIQUE):" -ForegroundColor Yellow
Write-Host "   1. Commit les changements si nécessaire" -ForegroundColor Gray
Write-Host "   2. Push sur multitenant-render" -ForegroundColor Gray
Write-Host "   3. Le workflow se déclenche automatiquement" -ForegroundColor Gray
Write-Host "   Commande: git push origin multitenant-render" -ForegroundColor White

Write-Host "`n   Option B - Manuel (WORKFLOW DISPATCH):" -ForegroundColor Yellow
Write-Host "   1. Aller sur GitHub Actions" -ForegroundColor Gray
Write-Host "   2. Sélectionner 'Deploy to Cloudflare Pages'" -ForegroundColor Gray
Write-Host "   3. Cliquer 'Run workflow'" -ForegroundColor Gray
Write-Host "   URL: https://github.com/mobby57/iapostemanager/actions/workflows/cloudflare-pages.yml" -ForegroundColor White

Write-Host "`n   Option C - Wrangler CLI (DIRECT):" -ForegroundColor Yellow
Write-Host "   1. Installer Wrangler: npm install -g wrangler" -ForegroundColor Gray
Write-Host "   2. Login: wrangler login" -ForegroundColor Gray
Write-Host "   3. Deploy: wrangler pages deploy .next/standalone --project-name=iapostemanager" -ForegroundColor Gray

# ====================================================
# ÉTAPE 6: MONITORING
# ====================================================
Write-Host "`n📊 ÉTAPE 6: Monitoring & Logs`n" -ForegroundColor Cyan

Write-Host "   Dashboards:" -ForegroundColor Yellow
Write-Host "   • GitHub Actions: https://github.com/mobby57/iapostemanager/actions" -ForegroundColor White
Write-Host "   • Cloudflare Pages: https://dash.cloudflare.com/pages" -ForegroundColor White
Write-Host "   • Logs Workflow: https://github.com/mobby57/iapostemanager/actions/workflows/cloudflare-pages.yml" -ForegroundColor White

# ====================================================
# RÉSULTAT FINAL
# ====================================================
Write-Host "
╔═══════════════════════════════════════════════════╗
║   ✅ BUILD TEST TERMINÉ AVEC SUCCÈS !            ║
║   Prêt pour déploiement Cloudflare Pages        ║
╚═══════════════════════════════════════════════════╝
" -ForegroundColor Green -BackgroundColor DarkGreen

Write-Host "`n💡 CONSEIL: Vérifiez les variables d'environnement sur Cloudflare après déploiement !`n" -ForegroundColor Yellow

# ====================================================
# PROPOSITION AUTOMATIQUE
# ====================================================
$deploy = Read-Host "`nVoulez-vous déclencher le déploiement maintenant ? (o/N)"

if ($deploy -eq 'o' -or $deploy -eq 'O') {
    Write-Host "`n🚀 Déploiement vers Cloudflare...`n" -ForegroundColor Cyan
    
    # Vérifier si changements à commiter
    $hasChanges = git status --porcelain
    
    if ($hasChanges) {
        Write-Host "   Commit des changements..." -ForegroundColor Yellow
        git add .
        git commit -m "build: test deployment to Cloudflare Pages"
    }
    
    Write-Host "   Push vers GitHub..." -ForegroundColor Yellow
    git push origin multitenant-render
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n   ✅ Push réussi ! Workflow déclenché." -ForegroundColor Green
        Write-Host "`n   📊 Suivez le déploiement:" -ForegroundColor Cyan
        Write-Host "   https://github.com/mobby57/iapostemanager/actions`n" -ForegroundColor White
    } else {
        Write-Host "`n   ✗ Erreur lors du push" -ForegroundColor Red
    }
} else {
    Write-Host "`n   Build local terminé. Déploiement manuel requis.`n" -ForegroundColor Gray
}
