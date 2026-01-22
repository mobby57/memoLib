# Script Master - Configuration Complète du Coffre des Secrets
# Roadmap en 5 phases - Automatisée

param(
    [ValidateSet("phase1", "phase2", "phase3", "phase4", "phase5", "complete", "check", "rotate")]
    [string]$Phase = "complete"
)

$colors = @{
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
    Info = "Cyan"
    Secondary = "Gray"
}

function Print-Header {
    param([string]$Text, [string]$Color = "Cyan")
    Write-Host "`n" -ForegroundColor $Color
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $Color
    Write-Host "    $Text" -ForegroundColor $Color
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $Color
}

function Print-Step {
    param([int]$Number, [string]$Text)
    Write-Host "`n[$Number/5] $Text" -ForegroundColor Cyan
}

function Print-Success {
    param([string]$Text)
    Write-Host "  ✅ $Text" -ForegroundColor Green
}

function Print-Warning {
    param([string]$Text)
    Write-Host "  ⚠️  $Text" -ForegroundColor Yellow
}

function Print-Error {
    param([string]$Text)
    Write-Host "  ❌ $Text" -ForegroundColor Red
}

Print-Header "🔐 CONFIGURATION COFFRE DES SECRETS" "Green"
Write-Host "    IA Poste Manager - Version 1.0" -ForegroundColor DarkGray
Write-Host "    Status: Production-Ready" -ForegroundColor DarkGray

# ============================================
# PHASE 1: PRÉPARATION LOCALE
# ============================================
function Execute-Phase1 {
    Print-Step 1 "PRÉPARATION LOCALE"
    
    Write-Host "`n  Vérification structure .env..." -ForegroundColor Gray
    
    if (-not (Test-Path ".env.local")) {
        if (-not (Test-Path ".env.local.example")) {
            Print-Error ".env.local.example not found"
            return $false
        }
        Copy-Item ".env.local.example" -Destination ".env.local"
        Print-Success ".env.local créé depuis le template"
        Print-Warning "⚠️  ÉDITEZ .env.local avec vos vraies valeurs!"
    } else {
        Print-Success ".env.local existe"
    }
    
    # Vérifier .gitignore
    $gitignore = Get-Content ".gitignore" -ErrorAction SilentlyContinue
    if ($gitignore -notmatch "\.env\.local") {
        Add-Content ".gitignore" "`n.env.local`n.env.keys`n.env.*.local"
        Print-Success ".env files ajoutés à .gitignore"
    }
    
    # Créer répertoire backups
    if (-not (Test-Path "backups")) {
        New-Item -ItemType Directory -Path "backups" -Force | Out-Null
        Print-Success "Répertoire backups créé"
    }
    
    return $true
}

# ============================================
# PHASE 2: VAULT LOCAL
# ============================================
function Execute-Phase2 {
    Print-Step 2 "CONFIGURATION VAULT (dotenv-vault)"
    
    # Vérifier dotenv-vault
    Write-Host "`n  Installation dotenv-vault..." -ForegroundColor Gray
    $vault = npm list -g dotenv-vault 2>/dev/null | Where-Object { $_ -match "dotenv-vault" }
    
    if (-not $vault) {
        npm install -g dotenv-vault | Out-Null
        Print-Success "dotenv-vault installé"
    } else {
        Print-Success "dotenv-vault déjà installé"
    }
    
    # Créer vault
    if (-not (Test-Path ".env.vault")) {
        npx dotenv-vault@latest new | Out-Null
        Print-Success ".env.vault créé"
    } else {
        Print-Success ".env.vault existe"
    }
    
    # Vérifier .env.keys dans .gitignore
    if ((Get-Content ".gitignore" -ErrorAction SilentlyContinue) -notmatch "\.env\.keys") {
        Add-Content ".gitignore" "`n.env.keys"
        Print-Success ".env.keys ajouté à .gitignore"
    }
    
    # Ajouter secrets au vault
    Write-Host "`n  Ajout des secrets au vault..." -ForegroundColor Gray
    
    if (Test-Path ".env.local") {
        $envVars = Get-Content ".env.local" | Where-Object { $_ -match "^[A-Z_]+=.*" } | ConvertFrom-StringData
        $count = 0
        
        foreach ($key in $envVars.Keys) {
            npx dotenv-vault@latest set $key $envVars[$key] 2>&1 | Out-Null
            $count++
        }
        
        # Chiffrer
        npx dotenv-vault@latest push | Out-Null
        Print-Success "$count secrets ajoutés et chiffrés"
        
        # Backup .env.keys
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        Copy-Item ".env.keys" -Destination "backups/.env.keys.backup.$timestamp"
        Print-Success "Backup .env.keys créé"
    }
    
    return $true
}

# ============================================
# PHASE 3: VERCEL
# ============================================
function Execute-Phase3 {
    Print-Step 3 "CONFIGURATION VERCEL"
    
    # Installer Vercel CLI
    Write-Host "`n  Installation Vercel CLI..." -ForegroundColor Gray
    $vercel = npm list -g vercel 2>/dev/null | Where-Object { $_ -match "vercel" }
    
    if (-not $vercel) {
        npm install -g vercel | Out-Null
        Print-Success "Vercel CLI installé"
    } else {
        Print-Success "Vercel CLI déjà installé"
    }
    
    # Vérifier authentification
    $auth = npx vercel@latest whoami 2>&1
    if ($LASTEXITCODE -ne 0) {
        Print-Warning "Authentication Vercel requise"
        npx vercel@latest auth login
    } else {
        Print-Success "Authentification Vercel valide"
    }
    
    # Ajouter variables
    Write-Host "`n  Configuration des variables Vercel..." -ForegroundColor Gray
    
    if (Test-Path ".env.local") {
        $envVars = Get-Content ".env.local" | ConvertFrom-StringData
        
        Write-Host "    → Variables Production" -ForegroundColor DarkGray
        @("DATABASE_URL", "NEXTAUTH_SECRET", "STRIPE_SECRET_KEY") | ForEach-Object {
            if ($envVars[$_]) {
                npx vercel@latest env rm $_ --env production --yes 2>&1 | Out-Null
                echo "$($envVars[$_])" | npx vercel@latest env add $_ --env production 2>&1 | Out-Null
            }
        }
        Print-Success "Variables Production configurées"
    }
    
    return $true
}

# ============================================
# PHASE 4: CLOUDFLARE
# ============================================
function Execute-Phase4 {
    Print-Step 4 "CONFIGURATION CLOUDFLARE (optionnel)"
    
    Write-Host "`n  Installation Wrangler..." -ForegroundColor Gray
    $wrangler = npm list -g wrangler 2>/dev/null | Where-Object { $_ -match "wrangler" }
    
    if (-not $wrangler) {
        npm install -g wrangler | Out-Null
        Print-Success "Wrangler installé"
    } else {
        Print-Success "Wrangler déjà installé"
    }
    
    # Vérifier authentification
    Write-Host "`n  Vérification authentification Cloudflare..." -ForegroundColor Gray
    $cf = wrangler whoami 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Print-Warning "Authentification Cloudflare requise"
        Write-Host "    Exécutez: wrangler login" -ForegroundColor Yellow
    } else {
        Print-Success "Authentification Cloudflare valide"
    }
    
    return $true
}

# ============================================
# PHASE 5: GITHUB
# ============================================
function Execute-Phase5 {
    Print-Step 5 "CONFIGURATION GITHUB"
    
    # Vérifier GitHub CLI
    Write-Host "`n  Vérification GitHub CLI..." -ForegroundColor Gray
    $gh = gh --version 2>/dev/null
    
    if (-not $gh) {
        Print-Warning "GitHub CLI non installé"
        Print-Info "   Installer depuis: https://cli.github.com"
        return $false
    } else {
        Print-Success "GitHub CLI disponible"
    }
    
    # Vérifier authentification
    $auth = gh auth status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Print-Warning "Authentification GitHub requise"
        Write-Host "    Exécutez: gh auth login" -ForegroundColor Yellow
    } else {
        Print-Success "Authentification GitHub valide"
    }
    
    return $true
}

# ============================================
# CHECK - Vérifier tous les services
# ============================================
function Execute-Check {
    Print-Header "✅ VÉRIFICATION SERVICES" "Cyan"
    
    $status = @{
        "Local .env" = (Test-Path ".env.local")
        "Vault (.env.vault)" = (Test-Path ".env.vault")
        "Vault Keys (.env.keys)" = (Test-Path ".env.keys")
        "dotenv-vault" = ($null -ne (npm list -g dotenv-vault 2>/dev/null | Where-Object { $_ -match "dotenv-vault" }))
        "Vercel CLI" = ($null -ne (npm list -g vercel 2>/dev/null | Where-Object { $_ -match "vercel" }))
        "Wrangler" = ($null -ne (npm list -g wrangler 2>/dev/null | Where-Object { $_ -match "wrangler" }))
        "GitHub CLI" = ($null -ne (gh --version 2>/dev/null))
    }
    
    Write-Host ""
    foreach ($service in $status.Keys) {
        $symbol = if ($status[$service]) { "✅" } else { "❌" }
        Write-Host "  $symbol $service" -ForegroundColor $(if ($status[$service]) { "Green" } else { "Red" })
    }
    
    # Vérifier authentifications
    Write-Host ""
    Write-Host "  Authentifications:" -ForegroundColor Cyan
    
    $vercelAuth = npx vercel@latest whoami 2>&1
    Write-Host "    $(if ($LASTEXITCODE -eq 0) { '✅' } else { '❌' }) Vercel" -ForegroundColor $(if ($LASTEXITCODE -eq 0) { "Green" } else { "Red" })
    
    $cfAuth = wrangler whoami 2>&1
    Write-Host "    $(if ($LASTEXITCODE -eq 0) { '✅' } else { '❌' }) Cloudflare" -ForegroundColor $(if ($LASTEXITCODE -eq 0) { "Green" } else { "Red" })
    
    $ghAuth = gh auth status 2>&1
    Write-Host "    $(if ($LASTEXITCODE -eq 0) { '✅' } else { '❌' }) GitHub" -ForegroundColor $(if ($LASTEXITCODE -eq 0) { "Green" } else { "Red" })
    
    return $true
}

# ============================================
# ROTATE - Rotation des secrets
# ============================================
function Execute-Rotate {
    Print-Header "🔄 ROTATION DES SECRETS" "Cyan"
    
    Write-Host "`n  Lancer: .\scripts\rotate-secrets-auto.ps1" -ForegroundColor Yellow
    
    # Lancer le script
    if (Test-Path "scripts/rotate-secrets-auto.ps1") {
        .\scripts\rotate-secrets-auto.ps1 -SecretType "all" -Target "all"
    } else {
        Print-Error "Script rotate-secrets-auto.ps1 non trouvé"
    }
    
    return $true
}

# ============================================
# MAIN EXECUTION
# ============================================
switch ($Phase) {
    "phase1" { Execute-Phase1 | Out-Null }
    "phase2" { Execute-Phase2 | Out-Null }
    "phase3" { Execute-Phase3 | Out-Null }
    "phase4" { Execute-Phase4 | Out-Null }
    "phase5" { Execute-Phase5 | Out-Null }
    
    "complete" {
        Execute-Phase1 | Out-Null
        Execute-Phase2 | Out-Null
        Execute-Phase3 | Out-Null
        Execute-Phase4 | Out-Null
        Execute-Phase5 | Out-Null
        Execute-Check | Out-Null
    }
    
    "check" { Execute-Check | Out-Null }
    "rotate" { Execute-Rotate | Out-Null }
}

# ============================================
# RÉSUMÉ FINAL
# ============================================
Print-Header "📋 RÉSUMÉ & PROCHAINES ÉTAPES" "Green"

Write-Host "`n  ✅ Configuration complétée!" -ForegroundColor Green
Write-Host "`n  📚 Documentation:" -ForegroundColor Cyan
Write-Host "    - ROADMAP_SECRETS_COMPLET.md" -ForegroundColor DarkGray
Write-Host "    - scripts/add-vault-secrets.ps1" -ForegroundColor DarkGray
Write-Host "    - scripts/add-vercel-env.ps1" -ForegroundColor DarkGray

Write-Host "`n  🔐 Sécurité:" -ForegroundColor Yellow
Write-Host "    - ✅ Committer UNIQUEMENT: .env.vault" -ForegroundColor DarkGray
Write-Host "    - ❌ NE PAS committer: .env.local, .env.keys" -ForegroundColor DarkGray
Write-Host "    - 💾 Sauvegarder: .env.keys en lieu très sûr" -ForegroundColor DarkGray

Write-Host "`n  📅 Maintenance régulière:" -ForegroundColor Cyan
Write-Host "    - Rotation secrets: ./setup-secrets.ps1 -Phase rotate" -ForegroundColor DarkGray
Write-Host "    - Vérification: ./setup-secrets.ps1 -Phase check" -ForegroundColor DarkGray
Write-Host "    - Fréquence: Tous les 90 jours" -ForegroundColor DarkGray

Write-Host "`n  🚀 Commandes utiles:" -ForegroundColor Cyan
Write-Host "    - Test vault:  npx dotenv -e .env.vault -- echo \$DATABASE_URL" -ForegroundColor DarkGray
Write-Host "    - Lister vars: npx vercel env ls" -ForegroundColor DarkGray
Write-Host "    - Sync vault:  npx dotenv-vault pull" -ForegroundColor DarkGray

Write-Host "`n  💡 Tutoriels:" -ForegroundColor Info
Write-Host "    https://www.dotenv.org/vault" -ForegroundColor DarkGray
Write-Host "    https://vercel.com/docs/environment-variables" -ForegroundColor DarkGray

Write-Host "`n" -ForegroundColor Green
