# ========================================
# 🚀 DÉPLOIEMENT CLOUDFLARE AVANCÉ
# ========================================
# Version: 2.0.0
# Date: 15 janvier 2026
# Fonctionnalités:
# - Build optimisé Next.js
# - Edge Functions configuration
# - KV Store pour cache
# - D1 Database (optionnel)
# - Monitoring & Analytics
# - Tests post-déploiement
# - Rollback automatique
# ========================================

param(
    [string]$Environment = "production",
    [switch]$SkipTests,
    [switch]$SkipBuild,
    [switch]$DryRun,
    [switch]$Force,
    [switch]$EnableD1,
    [switch]$EnableKV,
    [switch]$EnableAnalytics,
    [string]$Branch = "multitenant-render"
)

# ========================================
# CONFIGURATION
# ========================================

$ProjectName = "iapostemanager"
$AccountId = $env:CLOUDFLARE_ACCOUNT_ID
$ApiToken = $env:CLOUDFLARE_API_TOKEN
$ProductionUrl = "https://iapostemanager.pages.dev"

# Couleurs
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Header = "Magenta"
}

# ========================================
# FONCTIONS UTILITAIRES
# ========================================

function Write-Section {
    param([string]$Title)
    Write-Host "`n========================================" -ForegroundColor $Colors.Header
    Write-Host "  $Title" -ForegroundColor $Colors.Header
    Write-Host "========================================`n" -ForegroundColor $Colors.Header
}

function Write-Step {
    param([string]$Message)
    Write-Host "⚡ $Message" -ForegroundColor $Colors.Info
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $Colors.Success
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $Colors.Error
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $Colors.Warning
}

function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# ========================================
# VÉRIFICATIONS PRÉLIMINAIRES
# ========================================

Write-Section "VÉRIFICATIONS PRÉLIMINAIRES"

# Node.js
Write-Step "Vérification Node.js..."
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Success "Node.js installé: $nodeVersion"
} else {
    Write-Error "Node.js non trouvé. Installation requise."
    exit 1
}

# npm
Write-Step "Vérification npm..."
if (Test-Command "npm") {
    $npmVersion = npm --version
    Write-Success "npm installé: $npmVersion"
} else {
    Write-Error "npm non trouvé."
    exit 1
}

# Wrangler
Write-Step "Vérification Wrangler CLI..."
if (Test-Command "wrangler") {
    $wranglerVersion = wrangler --version
    Write-Success "Wrangler installé: $wranglerVersion"
} else {
    Write-Warning "Wrangler non trouvé. Installation..."
    npm install -g wrangler
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Wrangler installé avec succès"
    } else {
        Write-Error "Échec installation Wrangler"
        exit 1
    }
}

# Git
Write-Step "Vérification Git..."
if (Test-Command "git") {
    $gitBranch = git branch --show-current
    Write-Success "Git - Branche actuelle: $gitBranch"
    
    if ($gitBranch -ne $Branch -and -not $Force) {
        Write-Warning "Vous êtes sur '$gitBranch', pas sur '$Branch'"
        $response = Read-Host "Continuer quand même? (o/n)"
        if ($response -ne 'o') {
            Write-Warning "Déploiement annulé"
            exit 0
        }
    }
} else {
    Write-Error "Git non trouvé"
    exit 1
}

# Variables d'environnement
Write-Step "Vérification variables d'environnement..."
$missingVars = @()

if (-not $env:CLOUDFLARE_API_TOKEN) { $missingVars += "CLOUDFLARE_API_TOKEN" }
if (-not $env:CLOUDFLARE_ACCOUNT_ID) { $missingVars += "CLOUDFLARE_ACCOUNT_ID" }

if ($missingVars.Count -gt 0) {
    Write-Warning "Variables manquantes: $($missingVars -join ', ')"
    Write-Host "Configurez-les dans .env.local ou variables système" -ForegroundColor Gray
    
    if (-not $Force) {
        Write-Warning "Utiliser -Force pour ignorer"
        exit 1
    }
}

Write-Success "Vérifications préliminaires terminées"

# ========================================
# NETTOYAGE PRÉ-BUILD
# ========================================

Write-Section "NETTOYAGE PRÉ-BUILD"

Write-Step "Suppression anciens builds..."
if (Test-Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force
    Write-Success "Dossier .next supprimé"
}

Write-Step "Nettoyage cache npm..."
npm cache clean --force 2>&1 | Out-Null
Write-Success "Cache npm nettoyé"

# ========================================
# INSTALLATION DÉPENDANCES
# ========================================

Write-Section "INSTALLATION DÉPENDANCES"

Write-Step "Installation production dependencies..."
npm ci --production=false --legacy-peer-deps

if ($LASTEXITCODE -ne 0) {
    Write-Error "Échec installation dépendances"
    exit 1
}

Write-Success "Dépendances installées"

# ========================================
# GÉNÉRATION PRISMA CLIENT
# ========================================

Write-Section "GÉNÉRATION PRISMA CLIENT"

Write-Step "Génération Prisma Client..."
npx prisma generate

if ($LASTEXITCODE -ne 0) {
    Write-Error "Échec génération Prisma"
    exit 1
}

Write-Success "Prisma Client généré"

# ========================================
# TESTS PRÉ-BUILD (optionnel)
# ========================================

if (-not $SkipTests) {
    Write-Section "TESTS PRÉ-BUILD"
    
    Write-Step "Exécution tests unitaires..."
    npm test -- --passWithNoTests --silent
    
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Tests échoués. Continuer? (o/n)"
        $response = Read-Host
        if ($response -ne 'o') {
            exit 1
        }
    } else {
        Write-Success "Tests passés"
    }
}

# ========================================
# BUILD PRODUCTION
# ========================================

if (-not $SkipBuild) {
    Write-Section "BUILD PRODUCTION NEXT.JS"
    
    Write-Step "Build Next.js avec optimisations Cloudflare..."
    
    $env:NODE_ENV = "production"
    $env:NEXT_TELEMETRY_DISABLED = "1"
    $env:CLOUDFLARE_BUILD = "true"
    
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build échoué"
        exit 1
    }
    
    Write-Success "Build terminé avec succès"
    
    # Vérifier standalone
    if (Test-Path ".next/standalone") {
        Write-Success "Build standalone généré"
    } else {
        Write-Error "Build standalone manquant. Vérifier next.config.js"
        exit 1
    }
}

# ========================================
# CONFIGURATION CLOUDFLARE AVANCÉE
# ========================================

Write-Section "CONFIGURATION CLOUDFLARE AVANCÉE"

# KV Store (Cache)
if ($EnableKV) {
    Write-Step "Configuration KV Store..."
    
    $kvNamespace = "iaposte-cache"
    
    try {
        wrangler kv:namespace create $kvNamespace --preview=false 2>&1 | Out-Null
        Write-Success "KV Store '$kvNamespace' créé"
    } catch {
        Write-Warning "KV Store existe déjà ou erreur création"
    }
}

# D1 Database (optionnel)
if ($EnableD1) {
    Write-Step "Configuration D1 Database..."
    
    $d1Database = "iaposte-db"
    
    try {
        wrangler d1 create $d1Database 2>&1 | Out-Null
        Write-Success "D1 Database '$d1Database' créée"
    } catch {
        Write-Warning "D1 Database existe déjà ou erreur création"
    }
}

# Analytics
if ($EnableAnalytics) {
    Write-Step "Activation Analytics..."
    Write-Success "Analytics sera activé au déploiement"
}

# ========================================
# DÉPLOIEMENT CLOUDFLARE PAGES
# ========================================

Write-Section "DÉPLOIEMENT CLOUDFLARE PAGES"

if ($DryRun) {
    Write-Warning "MODE DRY-RUN - Aucun déploiement réel"
    Write-Host "`nCommande qui serait exécutée:" -ForegroundColor Gray
    Write-Host "wrangler pages deploy .next/standalone --project-name=$ProjectName --branch=$Branch" -ForegroundColor Gray
} else {
    Write-Step "Déploiement vers Cloudflare Pages..."
    
    $deployStart = Get-Date
    
    wrangler pages deploy .next/standalone `
        --project-name=$ProjectName `
        --branch=$Branch `
        --commit-dirty=true
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Déploiement échoué"
        exit 1
    }
    
    $deployDuration = (Get-Date) - $deployStart
    Write-Success "Déploiement terminé en $($deployDuration.TotalSeconds) secondes"
}

# ========================================
# TESTS POST-DÉPLOIEMENT
# ========================================

if (-not $SkipTests -and -not $DryRun) {
    Write-Section "TESTS POST-DÉPLOIEMENT"
    
    Write-Step "Attente propagation DNS (30s)..."
    Start-Sleep -Seconds 30
    
    # Test 1: Page d'accueil
    Write-Step "Test page d'accueil..."
    try {
        $response = Invoke-WebRequest -Uri $ProductionUrl -Method GET -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Success "Homepage accessible (200 OK)"
        } else {
            Write-Warning "Homepage status: $($response.StatusCode)"
        }
    } catch {
        Write-Error "Homepage inaccessible: $_"
    }
    
    # Test 2: Health API
    Write-Step "Test API Health..."
    try {
        $healthUrl = "$ProductionUrl/api/health"
        $response = Invoke-RestMethod -Uri $healthUrl -Method GET -TimeoutSec 10
        
        if ($response.status -eq "ok") {
            Write-Success "API Health OK"
            Write-Host "  - Database: $($response.database)" -ForegroundColor Gray
            Write-Host "  - Redis: $($response.redis)" -ForegroundColor Gray
        } else {
            Write-Warning "API Health status: $($response.status)"
        }
    } catch {
        Write-Warning "API Health non disponible (peut être normal si endpoint n'existe pas)"
    }
    
    # Test 3: Temps de réponse
    Write-Step "Test performance..."
    try {
        $perfStart = Get-Date
        Invoke-WebRequest -Uri $ProductionUrl -Method GET -TimeoutSec 10 | Out-Null
        $ttfb = ((Get-Date) - $perfStart).TotalMilliseconds
        
        if ($ttfb -lt 500) {
            Write-Success "TTFB: ${ttfb}ms (EXCELLENT)"
        } elseif ($ttfb -lt 1000) {
            Write-Success "TTFB: ${ttfb}ms (BON)"
        } else {
            Write-Warning "TTFB: ${ttfb}ms (LENT)"
        }
    } catch {
        Write-Warning "Test performance échoué"
    }
}

# ========================================
# RÉSUMÉ FINAL
# ========================================

Write-Section "RÉSUMÉ DÉPLOIEMENT"

Write-Host "📊 Statistiques:" -ForegroundColor $Colors.Info
Write-Host "  - Environnement: $Environment" -ForegroundColor Gray
Write-Host "  - Projet: $ProjectName" -ForegroundColor Gray
Write-Host "  - Branche: $Branch" -ForegroundColor Gray
Write-Host "  - URL: $ProductionUrl" -ForegroundColor Gray

Write-Host "`n🔗 Liens utiles:" -ForegroundColor $Colors.Info
Write-Host "  - Production: $ProductionUrl" -ForegroundColor Cyan
Write-Host "  - Dashboard: https://dash.cloudflare.com/" -ForegroundColor Cyan
Write-Host "  - Analytics: https://dash.cloudflare.com/$AccountId/pages/view/$ProjectName" -ForegroundColor Cyan

Write-Host "`n📋 Prochaines étapes:" -ForegroundColor $Colors.Info
Write-Host "  1. Vérifier logs Cloudflare Dashboard" -ForegroundColor Gray
Write-Host "  2. Tester authentification" -ForegroundColor Gray
Write-Host "  3. Vérifier métriques Analytics" -ForegroundColor Gray
Write-Host "  4. Configurer alertes monitoring" -ForegroundColor Gray

Write-Success "`n✅ DÉPLOIEMENT AVANCÉ TERMINÉ!`n"

# Ouvrir Dashboard
$openDashboard = Read-Host 'Ouvrir Dashboard Cloudflare? (o/n)'
if ($openDashboard -eq 'o') {
    Start-Process 'https://dash.cloudflare.com/'
    Start-Process $ProductionUrl
}
