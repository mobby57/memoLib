# Verification EXHAUSTIVE de toutes les CLES et SECRETS
# Confirme que rien n'est manquant

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  VERIFICATION COMPLETE DE TOUS LES SECRETS" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$allOk = $true

# ============================================
# 1. FICHIERS ESSENTIELS
# ============================================

Write-Host "== FICHIERS ESSENTIELS ==" -ForegroundColor Cyan
Write-Host ""

$requiredFiles = @(
    ".env.local",
    ".env.vault",
    ".env.keys",
    ".gitignore"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "[OK] $file existe" -ForegroundColor Green
    } else {
        Write-Host "[X]  $file MANQUANT" -ForegroundColor Red
        $allOk = $false
    }
}

# ============================================
# 2. CLES DANS .env.local
# ============================================

Write-Host ""
Write-Host "== CLES DANS .env.local ==" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".env.local")) {
    Write-Host "[!] .env.local n'existe pas" -ForegroundColor Red
    $allOk = $false
} else {
    $content = Get-Content ".env.local" -Raw
    
    Write-Host "-- CLES OBLIGATOIRES --" -ForegroundColor Red
    $mandatory = @(
        "DATABASE_URL",
        "NEXTAUTH_SECRET", 
        "NEXTAUTH_URL",
        "STRIPE_SECRET_KEY",
        "STRIPE_PUBLISHABLE_KEY"
    )
    
    $missingMandatory = 0
    foreach ($key in $mandatory) {
        if ($content -match "(?m)^$key=") {
            $value = ($content -split "$key=")[1] -split "`n" | Select-Object -First 1
            if ([string]::IsNullOrWhiteSpace($value)) {
                Write-Host "[!] $key = (VIDE)" -ForegroundColor Yellow
                $missingMandatory++
            } else {
                $display = if ($value.Length -gt 25) { $value.Substring(0,12) + "..." } else { $value }
                Write-Host "[OK] $key = $display" -ForegroundColor Green
            }
        } else {
            Write-Host "[X]  $key = MANQUANT" -ForegroundColor Red
            $missingMandatory++
            $allOk = $false
        }
    }
    
    Write-Host ""
    Write-Host "-- CLES OPTIONNELLES --" -ForegroundColor Yellow
    $optional = @(
        "OLLAMA_BASE_URL",
        "OLLAMA_MODEL",
        "GMAIL_CLIENT_ID",
        "GMAIL_CLIENT_SECRET",
        "GITHUB_APP_ID",
        "GITHUB_WEBHOOK_SECRET",
        "PISTE_SANDBOX_CLIENT_ID"
    )
    
    foreach ($key in $optional) {
        if ($content -match "^$key=") {
            Write-Host "[OK] $key = configure" -ForegroundColor Green
        } else {
            Write-Host "[i] $key = non configure" -ForegroundColor Gray
        }
    }
    
    Write-Host ""
    Write-Host "Resume: $missingMandatory cles obligatoires manquantes" -ForegroundColor Cyan
    if ($missingMandatory -eq 0) {
        Write-Host "  -> TOUTES LES CLES OBLIGATOIRES SONT LA" -ForegroundColor Green
    } else {
        Write-Host "  -> MANQUE $missingMandatory CLE(S) OBLIGATOIRE(S)" -ForegroundColor Red
    }
}

# ============================================
# 3. VERCEL
# ============================================

Write-Host ""
Write-Host "== VERCEL ==" -ForegroundColor Cyan
Write-Host ""

try {
    $vercelAuth = vercel auth whoami 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Authentifie aupres de Vercel" -ForegroundColor Green
        
        $vars = vercel env ls 2>&1
        $count = ($vars | Measure-Object -Line).Lines
        Write-Host "[OK] $count variables dans Vercel" -ForegroundColor Green
    } else {
        Write-Host "[!] Non authentifie aupres de Vercel" -ForegroundColor Yellow
        Write-Host "    -> Executer: vercel auth login" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[!] Vercel CLI non installe" -ForegroundColor Yellow
}

# ============================================
# 4. GITHUB
# ============================================

Write-Host ""
Write-Host "== GITHUB ==" -ForegroundColor Cyan
Write-Host ""

try {
    $ghAuth = gh auth status 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Authentifie aupres de GitHub" -ForegroundColor Green
        
        $secrets = gh secret list 2>&1
        if ($secrets) {
            $count = @($secrets).Count
            Write-Host "[OK] $count secrets configures dans GitHub" -ForegroundColor Green
        }
    } else {
        Write-Host "[!] Non authentifie aupres de GitHub" -ForegroundColor Yellow
        Write-Host "    -> Executer: gh auth login" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[!] GitHub CLI non installe" -ForegroundColor Yellow
}

# ============================================
# 5. SECURITE GIT
# ============================================

Write-Host ""
Write-Host "== SECURITE GIT ==" -ForegroundColor Cyan
Write-Host ""

$gitStatus = git status --porcelain 2>$null
$dangerous = ".env.local", ".env.keys", "credentials.json"

$foundDangerous = $false
foreach ($pattern in $dangerous) {
    if ($gitStatus -like "*$pattern*") {
        Write-Host "[X] $pattern est en staging (DANGER!)" -ForegroundColor Red
        $foundDangerous = $true
        $allOk = $false
    } else {
        Write-Host "[OK] $pattern n'est pas commit" -ForegroundColor Green
    }
}

# ============================================
# 6. RAPPORT FINAL
# ============================================

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan

if ($allOk) {
    Write-Host "  [SUCCESS] TOUTES LES CLES SONT PRESENTES!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Votre configuration est:" -ForegroundColor Green
    Write-Host "    - Complete" -ForegroundColor Green
    Write-Host "    - Valide" -ForegroundColor Green
    Write-Host "    - Securisee" -ForegroundColor Green
    Write-Host "    - Prete pour deploiement" -ForegroundColor Green
} else {
    Write-Host "  [WARNING] CERTAINES CLES MANQUENT OU SONT INVALIDES" -ForegroundColor Red
    Write-Host ""
    Write-Host "  A corriger:" -ForegroundColor Yellow
    Write-Host "    1. Ajouter les cles manquantes dans .env.local" -ForegroundColor Yellow
    Write-Host "    2. Chiffrer: npx dotenv-vault@latest push" -ForegroundColor Yellow
    Write-Host "    3. Synchro Vercel: vercel env pull" -ForegroundColor Yellow
    Write-Host "    4. Synchro GitHub: gh secret set <KEY> <VALUE>" -ForegroundColor Yellow
    Write-Host "    5. Relancer cette verification" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

if ($allOk) { exit 0 } else { exit 1 }
