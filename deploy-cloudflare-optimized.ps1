# ========================================
# DEPLOIEMENT CLOUDFLARE - OPTIMISE POUR NEXT.JS 16
# ========================================
# Version: 2.0 - Optimisee pour production long-terme
# Date: 19 janvier 2026
# Compatible: Next.js 16.x + @cloudflare/next-on-pages

param(
    [switch]$SkipLogin,
    [switch]$ProductionOnly,
    [string]$ProjectName = "iapostemanager"
)

$ErrorActionPreference = "Continue"

# ========================================
# CONFIGURATION GLOBALE
# ========================================

$CONFIG = @{
    ProjectName = $ProjectName
    DatabaseName = "$ProjectName-db"
    DatabasePreviewName = "$ProjectName-db-preview"
    KVNamespace = "KV_SESSIONS"
    R2Bucket = "$ProjectName-docs"
    BuildOutput = ".vercel/output/static"
}

# ========================================
# FONCTIONS UTILITAIRES
# ========================================

function Write-Step {
    param([string]$Message)
    Write-Output ""
    Write-Output "----------------------------------------"
    Write-Output "  $Message"
    Write-Output "----------------------------------------"
    Write-Output ""
}

function Write-Success {
    param([string]$Message)
    Write-Output "[OK] $Message"
}

function Write-Info {
    param([string]$Message)
    Write-Output "[INFO] $Message"
}

function Write-Warning {
    param([string]$Message)
    Write-Output "[WARN] $Message"
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Output "[ERREUR] $Message"
}

# ========================================
# VERIFICATION PRE-DEPLOIEMENT
# ========================================

Write-Output ""
Write-Output "========================================"
Write-Output "   DEPLOIEMENT CLOUDFLARE OPTIMISE"
Write-Output "========================================"
Write-Output ""

Write-Step "Verification des pre-requis"

# Verifier Node.js
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Success "Node.js: $nodeVersion"
} else {
    Write-Error-Custom "Node.js non installe"
    exit 1
}

# Verifier Wrangler
$wranglerInstalled = Get-Command wrangler -ErrorAction SilentlyContinue
if ($wranglerInstalled) {
    $wranglerVersion = wrangler --version 2>&1 | Out-String
    Write-Success "Wrangler: $($wranglerVersion.Trim())"
} else {
    Write-Error-Custom "Wrangler non installe"
    Write-Info "Installation: npm install -g wrangler"
    exit 1
}

# ========================================
# AUTHENTIFICATION
# ========================================

if (-not $SkipLogin) {
    Write-Step "Verification authentification Cloudflare"
    
    $whoami = wrangler whoami 2>&1 | Out-String
    if ($whoami -match "not authenticated") {
        Write-Warning "Non authentifie - lancement connexion..."
        wrangler login
        if ($LASTEXITCODE -ne 0) {
            Write-Error-Custom "Authentification echouee"
            exit 1
        }
    }
    Write-Success "Authentifie avec Cloudflare"
}

# ========================================
# BUILD NEXT.JS
# ========================================

Write-Step "Build Next.js pour Cloudflare Pages"

# Nettoyer builds precedents
$foldersToClean = @(".next", ".vercel", "out")
foreach ($folder in $foldersToClean) {
    if (Test-Path $folder) {
        Remove-Item -Recurse -Force $folder
        Write-Info "Nettoye: $folder"
    }
}

# Configurer variables d'environnement
$env:NODE_OPTIONS = "--max-old-space-size=4096"
$env:NODE_ENV = "production"

Write-Info "Demarrage du build..."
npx @cloudflare/next-on-pages

if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Build echoue"
    exit 1
}

Write-Success "Build termine"

# Verifier output
if (Test-Path $CONFIG.BuildOutput) {
    $fileCount = (Get-ChildItem -Recurse $CONFIG.BuildOutput -File).Count
    Write-Info "Fichiers generes: $fileCount"
} else {
    Write-Error-Custom "Dossier de build non trouve: $($CONFIG.BuildOutput)"
    exit 1
}

# ========================================
# DEPLOIEMENT
# ========================================

Write-Step "Deploiement sur Cloudflare Pages"

$deployBranch = if ($ProductionOnly) { "main" } else { "preview" }
Write-Info "Branche de deploiement: $deployBranch"

wrangler pages deploy $CONFIG.BuildOutput --project-name=$($CONFIG.ProjectName) --branch=$deployBranch

if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Deploiement echoue"
    exit 1
}

Write-Success "Deploiement termine"

# ========================================
# RESUME FINAL
# ========================================

Write-Output ""
Write-Output "========================================"
Write-Output "   DEPLOIEMENT TERMINE AVEC SUCCES"
Write-Output "========================================"
Write-Output ""
Write-Output "Project: $($CONFIG.ProjectName)"
Write-Output "Branche: $deployBranch"
Write-Output ""
Write-Output "URLs:"
Write-Output "   Preview:    https://$($CONFIG.ProjectName).pages.dev"
Write-Output "   Dashboard:  https://dash.cloudflare.com/pages"
Write-Output ""
Write-Output "[OK] Tout est pret!"
Write-Output ""
