# ============================================
# CLOUDFLARE PAGES - STATUS & MONITORING
# IA Poste Manager Production
# ============================================

param(
    [switch]$Logs,
    [switch]$Open,
    [switch]$Deploy
)

$ErrorActionPreference = "Continue"

# Configuration
$PROJECT_NAME = "iaposte-manager"
$PRODUCTION_URL = "https://iapostemanager.pages.dev"
$CLOUDFLARE_DASHBOARD = "https://dash.cloudflare.com"

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   CLOUDFLARE PAGES - IA POSTE MANAGER STATUS         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# ============================================
# 1️⃣ TEST DISPONIBILITÉ
# ============================================
Write-Host "📡 Test de disponibilité..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri $PRODUCTION_URL -Method Head -UseBasicParsing -TimeoutSec 10
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ SITE OPÉRATIONNEL" -ForegroundColor Green
        Write-Host "   Status: $($response.StatusCode) $($response.StatusDescription)" -ForegroundColor Gray
        
        # Extraire headers Cloudflare
        $cfRay = $response.Headers['CF-Ray']
        $cfCacheStatus = $response.Headers['CF-Cache-Status']
        
        if ($cfRay) {
            Write-Host "   CDN: Cloudflare (Ray: $cfRay)" -ForegroundColor Gray
        }
        if ($cfCacheStatus) {
            Write-Host "   Cache: $cfCacheStatus" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "❌ SITE INACCESSIBLE" -ForegroundColor Red
    Write-Host "   Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ============================================
# 2️⃣ INFORMATIONS DÉPLOIEMENT
# ============================================
Write-Host "📊 Informations de déploiement..." -ForegroundColor Yellow

try {
    $deployments = wrangler pages deployment list --project-name=$PROJECT_NAME 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Projet: $PROJECT_NAME" -ForegroundColor Green
        Write-Host ""
        $deployments | Select-Object -First 10
    } else {
        Write-Host "⚠️  Impossible de récupérer les déploiements" -ForegroundColor Yellow
        Write-Host "   Assurez-vous d'être authentifié: wrangler login" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  Erreur: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# 3️⃣ URLS IMPORTANTES
# ============================================
Write-Host "🔗 URLs importantes:" -ForegroundColor Cyan
Write-Host "   Production:  $PRODUCTION_URL" -ForegroundColor White
Write-Host "   Dashboard:   $CLOUDFLARE_DASHBOARD" -ForegroundColor White
Write-Host "   Wrangler:    https://developers.cloudflare.com/workers/wrangler/" -ForegroundColor White
Write-Host ""

# ============================================
# 4️⃣ ACTIONS RAPIDES
# ============================================
if ($Open) {
    Write-Host "🌐 Ouverture du site..." -ForegroundColor Yellow
    Start-Process $PRODUCTION_URL
}

if ($Logs) {
    Write-Host "📋 Récupération des logs..." -ForegroundColor Yellow
    wrangler pages deployment list --project-name=$PROJECT_NAME
}

if ($Deploy) {
    Write-Host "🚀 Déploiement..." -ForegroundColor Yellow
    & "$PSScriptRoot\deploy-cloudflare.ps1"
}

# ============================================
# 5️⃣ COMMANDES UTILES
# ============================================
Write-Host "💡 Commandes utiles:" -ForegroundColor Cyan
Write-Host "   .\cloudflare-status.ps1 -Open     → Ouvrir le site" -ForegroundColor Gray
Write-Host "   .\cloudflare-status.ps1 -Logs     → Voir les logs" -ForegroundColor Gray
Write-Host "   .\cloudflare-status.ps1 -Deploy   → Redéployer" -ForegroundColor Gray
Write-Host ""
Write-Host "   wrangler pages deployment list    → Liste déploiements" -ForegroundColor Gray
Write-Host "   wrangler login                    → Se connecter" -ForegroundColor Gray
Write-Host "   wrangler whoami                   → Voir compte actuel" -ForegroundColor Gray
Write-Host ""

# ============================================
# 6️⃣ HEALTH CHECK
# ============================================
Write-Host "🏥 Health Check:" -ForegroundColor Yellow

$healthEndpoints = @(
    "/api/health",
    "/api/auth/session"
)

foreach ($endpoint in $healthEndpoints) {
    $url = "$PRODUCTION_URL$endpoint"
    try {
        $healthResponse = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($healthResponse.StatusCode -eq 200) {
            Write-Host "   ✅ $endpoint" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  $endpoint ($($healthResponse.StatusCode))" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ❌ $endpoint (Erreur)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ Vérification terminée!" -ForegroundColor Green
Write-Host ""
