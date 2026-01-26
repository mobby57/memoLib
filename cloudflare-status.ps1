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

Write-Output ""
Write-Output "========================================"
Write-Output "   CLOUDFLARE PAGES - STATUS"
Write-Output "   IA POSTE MANAGER"
Write-Output "========================================"
Write-Output ""

# ============================================
# 1. TEST DISPONIBILITE
# ============================================
Write-Output "[TEST] Disponibilite..."

try {
    $response = Invoke-WebRequest -Uri $PRODUCTION_URL -Method Head -UseBasicParsing -TimeoutSec 10
    
    if ($response.StatusCode -eq 200) {
        Write-Output "[OK] SITE OPERATIONNEL"
        Write-Output "   Status: $($response.StatusCode) $($response.StatusDescription)"
        
        # Extraire headers Cloudflare
        $cfRay = $response.Headers['CF-Ray']
        $cfCacheStatus = $response.Headers['CF-Cache-Status']
        
        if ($cfRay) {
            Write-Output "   CDN: Cloudflare (Ray: $cfRay)"
        }
        if ($cfCacheStatus) {
            Write-Output "   Cache: $cfCacheStatus"
        }
    }
} catch {
    Write-Output "[ERREUR] SITE INACCESSIBLE"
    Write-Output "   Erreur: $($_.Exception.Message)"
}

Write-Output ""

# ============================================
# 2. INFORMATIONS WRANGLER
# ============================================
Write-Output "[INFO] Wrangler Status..."

$wranglerInstalled = Get-Command wrangler -ErrorAction SilentlyContinue
if ($wranglerInstalled) {
    Write-Output "   Wrangler: Installe"
    
    # Whoami
    $whoami = wrangler whoami 2>&1 | Out-String
    if ($whoami -match "You are logged in") {
        Write-Output "   Auth: Connecte"
    } else {
        Write-Output "   Auth: Non connecte"
    }
} else {
    Write-Output "   Wrangler: Non installe"
}

Write-Output ""

# ============================================
# 3. OPTIONS
# ============================================

if ($Logs) {
    Write-Output "[LOGS] Ouverture des logs..."
    wrangler pages deployment tail $PROJECT_NAME
}

if ($Open) {
    Write-Output "[OPEN] Ouverture du site..."
    Start-Process $PRODUCTION_URL
}

if ($Deploy) {
    Write-Output "[DEPLOY] Lancement du deploiement..."
    & ".\deploy-cloudflare.ps1"
}

# ============================================
# 4. RESUME
# ============================================
Write-Output "========================================"
Write-Output "   LIENS UTILES"
Write-Output "========================================"
Write-Output "   Production: $PRODUCTION_URL"
Write-Output "   Dashboard:  $CLOUDFLARE_DASHBOARD"
Write-Output "   Logs:       .\cloudflare-status.ps1 -Logs"
Write-Output "   Deploy:     .\cloudflare-status.ps1 -Deploy"
Write-Output ""
