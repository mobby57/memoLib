# Script de Deploiement Cloudflare Complet
# IA Poste Manager - Automatisation complete

param(
    [switch]$SkipLogin,
    [switch]$ProductionOnly,
    [string]$ProjectName = "memoLib"
)

$ErrorActionPreference = "Stop"

Write-Output ""
Write-Output "================================================"
Write-Output "  DEPLOIEMENT CLOUDFLARE COMPLET"
Write-Output "  IA Poste Manager"
Write-Output "================================================"
Write-Output ""

# ============================================
# ETAPE 0: VERIFICATIONS PREALABLES
# ============================================

Write-Output "[0/8] Verifications prealables..."
Write-Output ""

# Verifier Wrangler
try {
    $wranglerVersion = wrangler --version 2>$null
    Write-Output "  [OK] Wrangler CLI installe: $wranglerVersion"
} catch {
    Write-Output "  [ERREUR] Wrangler CLI non trouve!"
    Write-Output "    Installation: npm install -g wrangler"
    exit 1
}

# Verifier Node.js
try {
    $nodeVersion = node --version
    Write-Output "  [OK] Node.js: $nodeVersion"
} catch {
    Write-Output "  [ERREUR] Node.js non trouve!"
    exit 1
}

# Verifier dependances
if (-not (Test-Path "node_modules")) {
    Write-Output "  [WARN] Installation des dependances..."
    npm install
}
Write-Output "  [OK] Dependances installees"

Write-Output ""

# ============================================
# ETAPE 1: LOGIN CLOUDFLARE
# ============================================

if (-not $SkipLogin) {
    Write-Output "[1/8] Connexion Cloudflare..."
    Write-Output "      (Une page web va s'ouvrir)"
    Write-Output ""
    
    try {
        wrangler login
        Write-Output "  [OK] Connecte a Cloudflare"
    } catch {
        Write-Output "  [ERREUR] Echec de connexion"
        exit 1
    }
} else {
    Write-Output "[1/8] Login Cloudflare... SKIP (deja connecte)"
}

Write-Output ""

# ============================================
# ETAPE 2: CREER BASE DE DONNEES D1
# ============================================

Write-Output "[2/8] Creation base de donnees D1..."
Write-Output ""

# Production
$dbName = "$ProjectName-db"
Write-Output "  -> Creation DB production: $dbName"

try {
    $dbOutput = wrangler d1 create $dbName 2>&1
    
    if ($dbOutput -match 'database_id\s*=\s*"([^"]+)"') {
        $dbId = $Matches[1]
        Write-Output "  [OK] DB creee: $dbId"
        
        # Sauvegarder l'ID
        $dbId | Out-File -FilePath "cloudflare-db-id.txt"
        
    } elseif ($dbOutput -match "already exists") {
        Write-Output "  [WARN] DB existe deja (OK)"
        
        # Recuperer l'ID existant
        $listOutput = wrangler d1 list 2>&1
        if ($listOutput -match "$dbName\s+([a-f0-9-]+)") {
            $dbId = $Matches[1]
            Write-Output "  [OK] DB ID existant: $dbId"
        }
    } else {
        Write-Output "  [WARN] Reponse inattendue: $dbOutput"
    }
} catch {
    Write-Output "  [ERREUR] Creation DB: $_"
}

Write-Output ""

# ============================================
# ETAPE 3: CREER KV NAMESPACE
# ============================================

Write-Output "[3/8] Creation KV Namespace..."
Write-Output ""

$kvName = "$ProjectName-kv"
Write-Output "  -> Creation KV: $kvName"

try {
    $kvOutput = wrangler kv:namespace create $kvName 2>&1
    
    if ($kvOutput -match 'id\s*=\s*"([^"]+)"') {
        $kvId = $Matches[1]
        Write-Output "  [OK] KV cree: $kvId"
        $kvId | Out-File -FilePath "cloudflare-kv-id.txt"
    } elseif ($kvOutput -match "already exists") {
        Write-Output "  [WARN] KV existe deja (OK)"
    }
} catch {
    Write-Output "  [ERREUR] Creation KV: $_"
}

Write-Output ""

# ============================================
# ETAPE 4: BUILD APPLICATION
# ============================================

Write-Output "[4/8] Build application..."
Write-Output ""

try {
    npm run build
    Write-Output "  [OK] Build termine"
} catch {
    Write-Output "  [ERREUR] Build echoue: $_"
    exit 1
}

Write-Output ""

# ============================================
# ETAPE 5: DEPLOYER SUR CLOUDFLARE PAGES
# ============================================

Write-Output "[5/8] Deploiement Cloudflare Pages..."
Write-Output ""

try {
    wrangler pages deploy .next --project-name=$ProjectName
    Write-Output "  [OK] Deploiement termine"
} catch {
    Write-Output "  [ERREUR] Deploiement: $_"
    exit 1
}

Write-Output ""

# ============================================
# ETAPE 6: CONFIGURER VARIABLES D'ENVIRONNEMENT
# ============================================

Write-Output "[6/8] Configuration variables..."
Write-Output ""

# Lire .env si existe
if (Test-Path ".env") {
    $envVars = Get-Content ".env" | Where-Object { $_ -match "^[A-Z_]+=.+" }
    
    foreach ($line in $envVars) {
        if ($line -match "^([^=]+)=(.+)$") {
            $key = $Matches[1]
            $value = $Matches[2]
            
            # Ne pas exposer les secrets dans les logs
            if ($key -notmatch "SECRET|KEY|PASSWORD|TOKEN") {
                Write-Output "  Setting: $key"
            } else {
                Write-Output "  Setting: $key (***)"
            }
            
            try {
                wrangler pages secret put $key --project-name=$ProjectName 2>&1 | Out-Null
            } catch {
                Write-Output "  [WARN] Variable $key non configuree"
            }
        }
    }
    Write-Output "  [OK] Variables configurees"
} else {
    Write-Output "  [WARN] Fichier .env non trouve"
}

Write-Output ""

# ============================================
# ETAPE 7: VERIFICATION
# ============================================

Write-Output "[7/8] Verification deploiement..."
Write-Output ""

$projectUrl = "https://$ProjectName.pages.dev"
Write-Output "  URL: $projectUrl"

try {
    $response = Invoke-WebRequest -Uri $projectUrl -UseBasicParsing -TimeoutSec 30
    if ($response.StatusCode -eq 200) {
        Write-Output "  [OK] Site accessible (HTTP 200)"
    } else {
        Write-Output "  [WARN] Status: $($response.StatusCode)"
    }
} catch {
    Write-Output "  [WARN] Site pas encore accessible (propagation DNS)"
}

Write-Output ""

# ============================================
# ETAPE 8: RESUME
# ============================================

Write-Output "[8/8] Resume du deploiement"
Write-Output ""
Write-Output "================================================"
Write-Output "  DEPLOIEMENT TERMINE"
Write-Output "================================================"
Write-Output ""
Write-Output "  Projet: $ProjectName"
Write-Output "  URL: $projectUrl"
Write-Output ""
Write-Output "  Ressources creees:"
Write-Output "    - Cloudflare Pages: $ProjectName"
if ($dbId) {
    Write-Output "    - D1 Database: $dbName ($dbId)"
}
if ($kvId) {
    Write-Output "    - KV Namespace: $kvName ($kvId)"
}
Write-Output ""
Write-Output "  Prochaines etapes:"
Write-Output "    1. Verifier le site: $projectUrl"
Write-Output "    2. Configurer domaine personnalise"
Write-Output "    3. Configurer webhooks si necessaire"
Write-Output ""
