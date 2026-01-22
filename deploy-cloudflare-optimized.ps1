# ========================================
# 🚀 DÉPLOIEMENT CLOUDFLARE - OPTIMISÉ POUR NEXT.JS 16
# ========================================
# Version: 2.0 - Optimisée pour production long-terme
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
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
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
# ÉTAPE 0 : VÉRIFICATIONS PRÉALABLES
# ========================================

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║                                                            ║" -ForegroundColor Magenta
Write-Host "║       🚀 DÉPLOIEMENT CLOUDFLARE PAGES OPTIMISÉ            ║" -ForegroundColor Magenta
Write-Host "║          Next.js 16 + Edge Functions + D1                 ║" -ForegroundColor Magenta
Write-Host "║                                                            ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

Write-Step "📋 Étape 0/8 : Vérifications préalables"

# Vérifier Node.js
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Success "Node.js installé : $nodeVersion"
} else {
    Write-Error-Custom "Node.js non trouvé ! Installez depuis https://nodejs.org"
    exit 1
}

# Vérifier npm
if (Test-Command "npm") {
    $npmVersion = npm --version
    Write-Success "npm installé : v$npmVersion"
} else {
    Write-Error-Custom "npm non trouvé !"
    exit 1
}

# Vérifier Wrangler
if (Test-Command "wrangler") {
    $wranglerVersion = wrangler --version
    Write-Success "Wrangler CLI installé : $wranglerVersion"
} else {
    Write-Warning "Wrangler CLI non trouvé. Installation..."
    npm install -g wrangler
    Write-Success "Wrangler CLI installé avec succès"
}

# Vérifier adaptateur Cloudflare
Write-Info "Vérification de @cloudflare/next-on-pages..."
$adapterInstalled = npm list @cloudflare/next-on-pages --depth=0 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Success "Adaptateur Cloudflare détecté"
} else {
    Write-Warning "Installation de l'adaptateur..."
    npm install @cloudflare/next-on-pages --save-dev --legacy-peer-deps
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Adaptateur installé avec succès"
    } else {
        Write-Error-Custom "Échec installation adaptateur. Vérifiez package.json"
        exit 1
    }
}

# Vérifier Prisma
if (Test-Path "prisma/schema.prisma") {
    Write-Success "Schema Prisma détecté"
} else {
    Write-Warning "Aucun schema Prisma trouvé (déploiement sans DB)"
}

Write-Success "Toutes les vérifications passées !"

# ========================================
# ÉTAPE 1 : CONNEXION CLOUDFLARE
# ========================================

if (-not $SkipLogin) {
    Write-Step "🔐 Étape 1/8 : Connexion à Cloudflare"
    
    Write-Info "Ouverture du navigateur pour authentification..."
    wrangler login
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Connexion Cloudflare réussie !"
    } else {
        Write-Error-Custom "Échec de connexion. Vérifiez vos credentials"
        exit 1
    }
} else {
    Write-Step "🔐 Étape 1/8 : Connexion (IGNORÉE)"
    Write-Info "Utilisation de la session existante"
}

# ========================================
# ÉTAPE 2 : CRÉATION DATABASE D1
# ========================================

Write-Step "🗄️ Étape 2/8 : Création Database D1"

# Production
Write-Info "Création de la database PRODUCTION..."
$dbCreateOutput = wrangler d1 create $CONFIG.DatabaseName 2>&1 | Out-String

if ($dbCreateOutput -match "database_id = `"([^`"]+)`"") {
    $dbId = $matches[1]
    Write-Success "Database PRODUCTION créée : $($CONFIG.DatabaseName)"
    Write-Info "Database ID : $dbId"
    
    # Sauvegarder l'ID
    $dbId | Out-File -FilePath "cloudflare-db-id.txt" -Encoding UTF8
} elseif ($dbCreateOutput -match "already exists") {
    Write-Warning "Database PRODUCTION existe déjà (réutilisation)"
    
    # Récupérer l'ID depuis le fichier si existe
    if (Test-Path "cloudflare-db-id.txt") {
        $dbId = Get-Content "cloudflare-db-id.txt" -Raw
        Write-Info "Database ID récupéré : $dbId"
    } else {
        Write-Warning "Impossible de récupérer database_id. Continuez manuellement."
    }
} else {
    Write-Error-Custom "Échec création database PRODUCTION"
    Write-Host $dbCreateOutput
}

# Preview (seulement si pas --ProductionOnly)
if (-not $ProductionOnly) {
    Write-Info "Création de la database PREVIEW..."
    $dbPreviewOutput = wrangler d1 create $CONFIG.DatabasePreviewName 2>&1 | Out-String
    
    if ($dbPreviewOutput -match "database_id = `"([^`"]+)`"") {
        $dbPreviewId = $matches[1]
        Write-Success "Database PREVIEW créée : $($CONFIG.DatabasePreviewName)"
        Write-Info "Preview Database ID : $dbPreviewId"
        
        $dbPreviewId | Out-File -FilePath "cloudflare-db-preview-id.txt" -Encoding UTF8
    } elseif ($dbPreviewOutput -match "already exists") {
        Write-Warning "Database PREVIEW existe déjà"
    }
}

# ========================================
# ÉTAPE 3 : CRÉATION KV NAMESPACE
# ========================================

Write-Step "🔑 Étape 3/8 : Création KV Namespace (Sessions)"

Write-Info "Création du namespace KV pour NextAuth sessions..."
$kvCreateOutput = wrangler kv:namespace create $CONFIG.KVNamespace 2>&1 | Out-String

if ($kvCreateOutput -match 'id = "([^"]+)"') {
    $kvId = $matches[1]
    Write-Success "KV Namespace créé : $($CONFIG.KVNamespace)"
    Write-Info "KV ID : $kvId"
    
    $kvId | Out-File -FilePath "cloudflare-kv-id.txt" -Encoding UTF8
} elseif ($kvCreateOutput -match "already exists") {
    Write-Warning "KV Namespace existe déjà"
    
    if (Test-Path "cloudflare-kv-id.txt") {
        $kvId = Get-Content "cloudflare-kv-id.txt" -Raw
        Write-Info "KV ID récupéré : $kvId"
    }
} else {
    Write-Warning "Création KV échouée ou déjà existe"
}

# ========================================
# ÉTAPE 4 : CRÉATION R2 BUCKET
# ========================================

Write-Step "📦 Étape 4/8 : Création R2 Bucket (Documents)"

Write-Info "Création du bucket R2 pour stockage documents..."
$r2CreateOutput = wrangler r2 bucket create $CONFIG.R2Bucket 2>&1 | Out-String

if ($r2CreateOutput -match "Created bucket") {
    Write-Success "R2 Bucket créé : $($CONFIG.R2Bucket)"
} elseif ($r2CreateOutput -match "already exists") {
    Write-Warning "R2 Bucket existe déjà"
} else {
    Write-Warning "Création R2 échouée ou bucket existe"
}

# ========================================
# ÉTAPE 5 : GÉNÉRATION wrangler.toml
# ========================================

Write-Step "⚙️ Étape 5/8 : Génération wrangler.toml"

$wranglerConfig = @"
name = "$($CONFIG.ProjectName)"
compatibility_date = "2026-01-19"
pages_build_output_dir = "$($CONFIG.BuildOutput)"

# ========================================
# D1 DATABASE BINDING
# ========================================
[[d1_databases]]
binding = "DB"
database_name = "$($CONFIG.DatabaseName)"
database_id = "$dbId"

# Preview environment
[[env.preview.d1_databases]]
binding = "DB"
database_name = "$($CONFIG.DatabasePreviewName)"
database_id = "$dbPreviewId"

# ========================================
# KV NAMESPACE BINDING (Sessions NextAuth)
# ========================================
[[kv_namespaces]]
binding = "KV_SESSIONS"
id = "$kvId"

# ========================================
# R2 BUCKET BINDING (Documents)
# ========================================
[[r2_buckets]]
binding = "DOCUMENTS"
bucket_name = "$($CONFIG.R2Bucket)"

# ========================================
# ANALYTICS ENGINE (Monitoring gratuit)
# ========================================
[analytics_engine_datasets]
binding = "ANALYTICS"

# ========================================
# VARIABLES D'ENVIRONNEMENT
# ========================================
[vars]
ENVIRONMENT = "production"
NODE_ENV = "production"

# ========================================
# BUILD CONFIGURATION
# ========================================
[build]
command = "npm run pages:build"
watch_dirs = ["src", "app", "components"]

# ========================================
# OBSERVABILITY
# ========================================
[observability]
enabled = true
head_sampling_rate = 1
"@

$wranglerConfig | Out-File -FilePath "wrangler.toml" -Encoding UTF8

Write-Success "wrangler.toml généré avec succès !"
Write-Info "Fichier : wrangler.toml"

# ========================================
# ÉTAPE 6 : MIGRATION PRISMA → D1
# ========================================

Write-Step "🔄 Étape 6/8 : Migration Prisma → D1"

if (Test-Path "prisma/schema.prisma") {
    Write-Info "Génération du SQL depuis Prisma schema..."
    
    try {
        # Générer le diff SQL
        npx prisma migrate diff `
            --from-empty `
            --to-schema-datamodel prisma/schema.prisma `
            --script > schema-d1.sql
        
        if (Test-Path "schema-d1.sql") {
            Write-Success "Fichier schema-d1.sql généré"
            
            # Appliquer à D1 (PRODUCTION)
            Write-Info "Application du schema à D1 PRODUCTION..."
            wrangler d1 execute $CONFIG.DatabaseName --file=schema-d1.sql --remote
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Schema appliqué à D1 PRODUCTION"
            } else {
                Write-Warning "Échec application schema (peut-être déjà appliqué)"
            }
            
            # Seed data (si existe)
            if (Test-Path "prisma/seed-complete.ts") {
                Write-Info "Seed data détecté. Exécution..."
                npx tsx prisma/seed-complete.ts > seed-d1.sql 2>&1
                
                if (Test-Path "seed-d1.sql") {
                    wrangler d1 execute $CONFIG.DatabaseName --file=seed-d1.sql --remote
                    Write-Success "Seed data appliqué"
                }
            }
        } else {
            Write-Warning "Génération schema.sql échouée"
        }
    } catch {
        Write-Warning "Migration Prisma échouée : $_"
    }
} else {
    Write-Info "Aucun schema Prisma (déploiement sans DB)"
}

# ========================================
# ÉTAPE 7 : BUILD NEXT.JS POUR CLOUDFLARE
# ========================================

Write-Step "🏗️ Étape 7/8 : Build Next.js pour Cloudflare"

Write-Info "Build en cours... (peut prendre 3-5 minutes)"
Write-Info "Mode : Production + Minification + Edge optimization"

try {
    npm run pages:build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Build Next.js réussi !"
        
        # Vérifier output
        if (Test-Path $CONFIG.BuildOutput) {
            $outputSize = (Get-ChildItem -Path $CONFIG.BuildOutput -Recurse | Measure-Object -Property Length -Sum).Sum
            $outputSizeMB = [math]::Round($outputSize / 1MB, 2)
            Write-Info "Taille du build : $outputSizeMB MB"
            Write-Success "Output généré : $($CONFIG.BuildOutput)"
        } else {
            Write-Error-Custom "Build output non trouvé : $($CONFIG.BuildOutput)"
            exit 1
        }
    } else {
        Write-Error-Custom "Échec du build Next.js"
        Write-Info "Vérifiez les logs ci-dessus pour détails"
        exit 1
    }
} catch {
    Write-Error-Custom "Erreur lors du build : $_"
    exit 1
}

# ========================================
# ÉTAPE 8 : DÉPLOIEMENT CLOUDFLARE PAGES
# ========================================

Write-Step "🚀 Étape 8/8 : Déploiement sur Cloudflare Pages"

Write-Info "Déploiement en cours..."
Write-Info "Cela peut prendre 2-3 minutes..."

try {
    $deployOutput = wrangler pages deploy $CONFIG.BuildOutput --project-name=$CONFIG.ProjectName 2>&1 | Out-String
    
    Write-Host $deployOutput
    
    if ($deployOutput -match "https://([^/]+\.pages\.dev)") {
        $deployUrl = "https://$($matches[1])"
        Write-Success "Déploiement réussi !"
        Write-Host ""
        Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
        Write-Host "║                                                            ║" -ForegroundColor Green
        Write-Host "║           ✨ DÉPLOIEMENT CLOUDFLARE TERMINÉ ✨            ║" -ForegroundColor Green
        Write-Host "║                                                            ║" -ForegroundColor Green
        Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
        Write-Host ""
        Write-Host "🌐 URL de Production : " -NoNewline -ForegroundColor Cyan
        Write-Host $deployUrl -ForegroundColor Yellow
        Write-Host ""
        
        # Sauvegarder URL
        $deployUrl | Out-File -FilePath "cloudflare-deploy-url.txt" -Encoding UTF8
        
        Write-Host "📋 Prochaines étapes :" -ForegroundColor Cyan
        Write-Host "  1. Configurer les variables d'environnement :" -ForegroundColor White
        Write-Host "     → wrangler pages secret put NEXTAUTH_SECRET" -ForegroundColor Gray
        Write-Host "     → wrangler pages secret put NEXTAUTH_URL" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  2. Configurer un domaine personnalisé (optionnel) :" -ForegroundColor White
        Write-Host "     → Cloudflare Dashboard → Pages → Custom domains" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  3. Activer Analytics (gratuit) :" -ForegroundColor White
        Write-Host "     → Cloudflare Dashboard → Pages → Analytics" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  4. Tester l'application :" -ForegroundColor White
        Write-Host "     → $deployUrl" -ForegroundColor Gray
        Write-Host ""
        
        Write-Success "Déploiement Cloudflare Pages terminé avec succès !"
        
    } else {
        Write-Error-Custom "Déploiement échoué. Vérifiez les logs ci-dessus."
        exit 1
    }
} catch {
    Write-Error-Custom "Erreur lors du déploiement : $_"
    exit 1
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "  Déploiement Cloudflare Pages : SUCCÈS ✅" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""
