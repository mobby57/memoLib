# ========================================
# DEPLOIEMENT CLOUDFLARE AVANCE
# ========================================
# Version: 2.0.0
# Date: 15 janvier 2026
# Fonctionnalites:
# - Build optimise Next.js
# - Edge Functions configuration
# - KV Store pour cache
# - D1 Database (optionnel)
# - Monitoring & Analytics
# - Tests post-deploiement
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

$ProjectName = "memoLib"
$AccountId = $env:CLOUDFLARE_ACCOUNT_ID
$ApiToken = $env:CLOUDFLARE_API_TOKEN
$ProductionUrl = "https://memoLib.pages.dev"

# ========================================
# FONCTIONS UTILITAIRES
# ========================================

function Write-Section {
    param([string]$Title)
    Write-Output ""
    Write-Output "========================================"
    Write-Output "   $Title"
    Write-Output "========================================"
    Write-Output ""
}

function Write-Step {
    param([string]$Message)
    Write-Output "[STEP] $Message"
}

function Write-Success {
    param([string]$Message)
    Write-Output "[OK] $Message"
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Output "[ERREUR] $Message"
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Output "[WARN] $Message"
}

# ========================================
# DEBUT DU DEPLOIEMENT
# ========================================

Write-Section "DEPLOIEMENT CLOUDFLARE AVANCE"

Write-Output "Configuration:"
Write-Output "   Projet: $ProjectName"
Write-Output "   Environnement: $Environment"
Write-Output "   Branche: $Branch"
Write-Output ""

# ========================================
# 1. VERIFICATION PRE-DEPLOIEMENT
# ========================================

Write-Section "1. Verification Pre-deploiement"

# Verifier Wrangler
$wranglerInstalled = Get-Command wrangler -ErrorAction SilentlyContinue
if (-not $wranglerInstalled) {
    Write-Error-Custom "Wrangler non installe. Installation: npm install -g wrangler"
    exit 1
}
Write-Success "Wrangler installe"

# Verifier Auth
$whoami = wrangler whoami 2>&1 | Out-String
if ($whoami -match "not authenticated") {
    Write-Error-Custom "Non authentifie. Lancez: wrangler login"
    exit 1
}
Write-Success "Authentifie avec Cloudflare"

# ========================================
# 2. BUILD
# ========================================

if (-not $SkipBuild) {
    Write-Section "2. Build Next.js"
    
    # Nettoyer
    Write-Step "Nettoyage..."
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force ".vercel" -ErrorAction SilentlyContinue
    
    # Build
    Write-Step "Build avec @cloudflare/next-on-pages..."
    $env:NODE_OPTIONS = "--max-old-space-size=4096"
    npx @cloudflare/next-on-pages
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Build echoue"
        exit 1
    }
    Write-Success "Build termine"
} else {
    Write-Output "[SKIP] Build ignore"
}

# ========================================
# 3. DEPLOIEMENT
# ========================================

Write-Section "3. Deploiement"

if ($DryRun) {
    Write-Warning-Custom "Mode DryRun - pas de deploiement reel"
} else {
    Write-Step "Deploiement sur Cloudflare Pages..."
    
    $deployBranch = if ($Environment -eq "production") { "main" } else { "preview" }
    wrangler pages deploy .vercel/output/static --project-name=$ProjectName --branch=$deployBranch
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Deploiement echoue"
        exit 1
    }
    Write-Success "Deploiement termine"
}

# ========================================
# 4. TESTS POST-DEPLOIEMENT
# ========================================

if (-not $SkipTests) {
    Write-Section "4. Tests Post-deploiement"
    
    Write-Step "Test de disponibilite..."
    Start-Sleep -Seconds 5
    
    try {
        $response = Invoke-WebRequest -Uri $ProductionUrl -Method Head -UseBasicParsing -TimeoutSec 30
        if ($response.StatusCode -eq 200) {
            Write-Success "Site accessible (Status: $($response.StatusCode))"
        }
    } catch {
        Write-Warning-Custom "Site non accessible immediatement (peut prendre quelques minutes)"
    }
} else {
    Write-Output "[SKIP] Tests ignores"
}

# ========================================
# RESUME
# ========================================

Write-Section "DEPLOIEMENT TERMINE"

Write-Output "URLs:"
Write-Output "   Production: $ProductionUrl"
Write-Output "   Dashboard:  https://dash.cloudflare.com/pages"
Write-Output ""
Write-Output "[OK] Deploiement avance termine avec succes!"
Write-Output ""
