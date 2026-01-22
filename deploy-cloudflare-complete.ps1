# 🚀 Script de Déploiement Cloudflare Complet
# IA Poste Manager - Automatisation complète

param(
    [switch]$SkipLogin,
    [switch]$ProductionOnly,
    [string]$ProjectName = "iapostemanager"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🚀 DÉPLOIEMENT CLOUDFLARE COMPLET          ║" -ForegroundColor Cyan
Write-Host "║     IA Poste Manager                         ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ============================================
# ÉTAPE 0: VÉRIFICATIONS PRÉALABLES
# ============================================

Write-Host "[0/8] Vérifications préalables..." -ForegroundColor Yellow
Write-Host ""

# Vérifier Wrangler
try {
    $wranglerVersion = wrangler --version 2>$null
    Write-Host "  ✓ Wrangler CLI installé: $wranglerVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Wrangler CLI non trouvé!" -ForegroundColor Red
    Write-Host "    Installation: npm install -g wrangler" -ForegroundColor Yellow
    exit 1
}

# Vérifier Node.js
try {
    $nodeVersion = node --version
    Write-Host "  ✓ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Node.js non trouvé!" -ForegroundColor Red
    exit 1
}

# Vérifier dépendances
if (-not (Test-Path "node_modules")) {
    Write-Host "  ⚠ Installation des dépendances..." -ForegroundColor Yellow
    npm install
}
Write-Host "  ✓ Dépendances installées" -ForegroundColor Green

Write-Host ""

# ============================================
# ÉTAPE 1: LOGIN CLOUDFLARE
# ============================================

if (-not $SkipLogin) {
    Write-Host "[1/8] Connexion Cloudflare..." -ForegroundColor Yellow
    Write-Host "      (Une page web va s'ouvrir)" -ForegroundColor Gray
    Write-Host ""
    
    try {
        wrangler login
        Write-Host "  ✓ Connecté à Cloudflare" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Échec de connexion" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[1/8] Login Cloudflare... SKIP (déjà connecté)" -ForegroundColor Gray
}

Write-Host ""

# ============================================
# ÉTAPE 2: CRÉER BASE DE DONNÉES D1
# ============================================

Write-Host "[2/8] Création base de données D1..." -ForegroundColor Yellow
Write-Host ""

# Production
$dbName = "$ProjectName-db"
Write-Host "  → Création DB production: $dbName" -ForegroundColor White

try {
    $dbOutput = wrangler d1 create $dbName 2>&1
    
    if ($dbOutput -match "database_id\s*=\s*`"([^`"]+)`"") {
        $dbId = $Matches[1]
        Write-Host "  ✓ DB créée: $dbId" -ForegroundColor Green
        
        # Sauvegarder l'ID
        $dbId | Out-File -FilePath "cloudflare-db-id.txt"
        
    } elseif ($dbOutput -match "already exists") {
        Write-Host "  ⚠ DB existe déjà (OK)" -ForegroundColor Yellow
        
        # Récupérer l'ID existant
        $listOutput = wrangler d1 list 2>&1 | Out-String
        if ($listOutput -match "$dbName\s+│\s+([a-f0-9\-]+)") {
            $dbId = $Matches[1]
            Write-Host "  ✓ DB ID récupéré: $dbId" -ForegroundColor Green
            $dbId | Out-File -FilePath "cloudflare-db-id.txt"
        }
    }
} catch {
    Write-Host "  ✗ Erreur création DB: $_" -ForegroundColor Red
}

# Preview (si pas ProductionOnly)
if (-not $ProductionOnly) {
    $dbPreviewName = "$ProjectName-db-preview"
    Write-Host "  → Création DB preview: $dbPreviewName" -ForegroundColor White
    
    try {
        wrangler d1 create $dbPreviewName 2>&1 | Out-Null
        Write-Host "  ✓ DB preview créée" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ DB preview existe déjà (OK)" -ForegroundColor Yellow
    }
}

Write-Host ""

# ============================================
# ÉTAPE 3: GÉNÉRER WRANGLER.TOML
# ============================================

Write-Host "[3/8] Configuration wrangler.toml..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path "cloudflare-db-id.txt") {
    $dbId = Get-Content "cloudflare-db-id.txt"
    
    $wranglerConfig = @"
name = "$ProjectName"
compatibility_date = "2024-01-01"
pages_build_output_dir = ".vercel/output/static"

[env.production]
name = "$ProjectName-prod"

[env.preview]
name = "$ProjectName-preview"

# Base de données D1
[[d1_databases]]
binding = "DB"
database_name = "$dbName"
database_id = "$dbId"

# KV pour sessions NextAuth
[[kv_namespaces]]
binding = "SESSIONS"
id = ""  # À remplir après création KV

# Variables d'environnement
[vars]
NODE_ENV = "production"
NEXT_PUBLIC_APP_URL = "https://$ProjectName.pages.dev"
"@

    $wranglerConfig | Out-File -FilePath "wrangler.toml" -Encoding UTF8
    Write-Host "  ✓ wrangler.toml créé" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Pas de DB ID, skip wrangler.toml" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# ÉTAPE 4: MIGRATIONS PRISMA → D1
# ============================================

Write-Host "[4/8] Migrations Prisma vers D1..." -ForegroundColor Yellow
Write-Host ""

# Créer dossier migrations
if (-not (Test-Path "migrations")) {
    New-Item -ItemType Directory -Path "migrations" | Out-Null
}

# Générer SQL depuis Prisma
Write-Host "  → Génération SQL depuis schema.prisma" -ForegroundColor White
try {
    npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > migrations/0001_init.sql
    Write-Host "  ✓ SQL généré: migrations/0001_init.sql" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Erreur génération SQL: $_" -ForegroundColor Red
}

# Appliquer à D1
if (Test-Path "migrations/0001_init.sql") {
    Write-Host "  → Application migrations à D1..." -ForegroundColor White
    
    try {
        wrangler d1 execute $dbName --file=migrations/0001_init.sql --remote 2>&1 | Out-Null
        Write-Host "  ✓ Migrations appliquées à production" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ Erreur migrations (peut-être déjà appliquées)" -ForegroundColor Yellow
    }
    
    # Preview
    if (-not $ProductionOnly) {
        try {
            wrangler d1 execute $dbPreviewName --file=migrations/0001_init.sql --remote 2>&1 | Out-Null
            Write-Host "  ✓ Migrations appliquées à preview" -ForegroundColor Green
        } catch {
            Write-Host "  ⚠ Erreur migrations preview" -ForegroundColor Yellow
        }
    }
}

Write-Host ""

# ============================================
# ÉTAPE 5: INSTALLER ADAPTATEUR CLOUDFLARE
# ============================================

Write-Host "[5/8] Installation adaptateur Cloudflare..." -ForegroundColor Yellow
Write-Host ""

# Vérifier si déjà installé
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
if (-not ($packageJson.devDependencies.'@cloudflare/next-on-pages')) {
    Write-Host "  → Installation @cloudflare/next-on-pages..." -ForegroundColor White
    npm install @cloudflare/next-on-pages --save-dev
    Write-Host "  ✓ Adaptateur installé" -ForegroundColor Green
} else {
    Write-Host "  ✓ Adaptateur déjà installé" -ForegroundColor Green
}

# Vérifier scripts package.json
$scriptsToAdd = @{
    "pages:build" = "next-on-pages --experimental-minify"
    "pages:preview" = "wrangler pages dev .vercel/output/static"
    "pages:deploy" = "wrangler pages deploy .vercel/output/static"
}

$modified = $false
foreach ($script in $scriptsToAdd.GetEnumerator()) {
    if (-not ($packageJson.scripts.PSObject.Properties.Name -contains $script.Key)) {
        Write-Host "  + Ajout script: $($script.Key)" -ForegroundColor Gray
        $packageJson.scripts | Add-Member -NotePropertyName $script.Key -NotePropertyValue $script.Value
        $modified = $true
    }
}

if ($modified) {
    $packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"
    Write-Host "  ✓ Scripts ajoutés à package.json" -ForegroundColor Green
}

Write-Host ""

# ============================================
# ÉTAPE 6: BUILD NEXT.JS
# ============================================

Write-Host "[6/8] Build Next.js pour Cloudflare..." -ForegroundColor Yellow
Write-Host "      (Cela peut prendre 2-3 minutes)" -ForegroundColor Gray
Write-Host ""

try {
    # Clean avant build
    if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
    if (Test-Path ".vercel") { Remove-Item -Recurse -Force ".vercel" }
    
    # Build
    npm run pages:build
    
    Write-Host "  ✓ Build réussi" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Erreur de build: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Essayez:" -ForegroundColor Yellow
    Write-Host "    1. npm install" -ForegroundColor White
    Write-Host "    2. npm run build (test build standard)" -ForegroundColor White
    Write-Host "    3. Vérifiez les erreurs TypeScript" -ForegroundColor White
    exit 1
}

Write-Host ""

# ============================================
# ÉTAPE 7: CRÉER PROJET CLOUDFLARE PAGES
# ============================================

Write-Host "[7/8] Création projet Cloudflare Pages..." -ForegroundColor Yellow
Write-Host ""

try {
    $projectOutput = wrangler pages project create $ProjectName 2>&1
    
    if ($projectOutput -match "Created") {
        Write-Host "  ✓ Projet créé: $ProjectName" -ForegroundColor Green
    } elseif ($projectOutput -match "already exists") {
        Write-Host "  ⚠ Projet existe déjà (OK)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠ Projet existe probablement déjà" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# ÉTAPE 8: DÉPLOIEMENT
# ============================================

Write-Host "[8/8] Déploiement sur Cloudflare Pages..." -ForegroundColor Yellow
Write-Host "      (Cela peut prendre 1-2 minutes)" -ForegroundColor Gray
Write-Host ""

try {
    $deployOutput = wrangler pages deploy .vercel/output/static --project-name=$ProjectName 2>&1 | Out-String
    
    # Extraire URL
    if ($deployOutput -match "https://([^\s]+)") {
        $deployUrl = $Matches[0]
        Write-Host "  ✓ Déploiement réussi!" -ForegroundColor Green
        Write-Host ""
        Write-Host "  🌍 URL PRODUCTION:" -ForegroundColor Cyan
        Write-Host "     $deployUrl" -ForegroundColor White
        
        # Sauvegarder URL
        $deployUrl | Out-File -FilePath "cloudflare-url.txt"
    } else {
        Write-Host $deployOutput
    }
} catch {
    Write-Host "  ✗ Erreur de déploiement: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================
# RÉSUMÉ FINAL
# ============================================

Write-Host "╔═══════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ DÉPLOIEMENT TERMINÉ AVEC SUCCÈS!        ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "📊 INFORMATIONS:" -ForegroundColor Cyan
Write-Host ""

if (Test-Path "cloudflare-url.txt") {
    $url = Get-Content "cloudflare-url.txt"
    Write-Host "  🌍 URL Production:  $url" -ForegroundColor White
}

if (Test-Path "cloudflare-db-id.txt") {
    $dbId = Get-Content "cloudflare-db-id.txt"
    Write-Host "  💾 Base D1:         $dbId" -ForegroundColor White
}

Write-Host "  📁 Projet:          $ProjectName" -ForegroundColor White
Write-Host ""

Write-Host "📝 PROCHAINES ÉTAPES:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. Configurer variables d'environnement:" -ForegroundColor Yellow
Write-Host "     → Dashboard: https://dash.cloudflare.com/" -ForegroundColor Gray
Write-Host "     → Pages > $ProjectName > Settings > Environment variables" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Variables à ajouter:" -ForegroundColor Yellow
Write-Host "     NEXTAUTH_URL=https://$ProjectName.pages.dev" -ForegroundColor Gray
Write-Host "     NEXTAUTH_SECRET=<générer avec: openssl rand -base64 32>" -ForegroundColor Gray
Write-Host "     DATABASE_URL=`$DB (binding automatique)" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Seed base de données D1:" -ForegroundColor Yellow
Write-Host "     wrangler d1 execute $dbName --file=prisma/seed.sql --remote" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. Tester l'application:" -ForegroundColor Yellow
if (Test-Path "cloudflare-url.txt") {
    $url = Get-Content "cloudflare-url.txt"
    Write-Host "     → Ouvrir: $url" -ForegroundColor Gray
}
Write-Host ""

Write-Host "🔄 DÉPLOIEMENTS FUTURS:" -ForegroundColor Cyan
Write-Host "   npm run pages:build && npm run pages:deploy" -ForegroundColor White
Write-Host ""

Write-Host "📚 AIDE:" -ForegroundColor Cyan
Write-Host "   Voir: DEPLOIEMENT_CLOUDFLARE_COMPLET.md" -ForegroundColor White
Write-Host ""
