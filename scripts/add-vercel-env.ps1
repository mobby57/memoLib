# Ajouter secrets à Vercel (Production)
param(
    [ValidateSet("all", "production", "preview", "development")]
    [string]$Environment = "all"
)

Write-Host "`n" -ForegroundColor Green
Write-Host "       🌐 CONFIGURATION VERCEL (SECRETS)            " -ForegroundColor Green
Write-Host "" -ForegroundColor Green

# Vérifier Vercel CLI
Write-Host "[1/5] Vérification Vercel CLI..." -ForegroundColor Cyan
$vercel = npm list -g vercel 2>/dev/null | Where-Object { $_ -match "vercel" }

if (-not $vercel) {
    Write-Host "  ⚠️  Vercel CLI non installé" -ForegroundColor Yellow
    Write-Host "  → Installation en cours..." -ForegroundColor Gray
    npm install -g vercel
}
Write-Host "  ✅ Vercel CLI disponible" -ForegroundColor Green

# Vérifier authentification Vercel
Write-Host "`n[2/5] Vérification authentification Vercel..." -ForegroundColor Cyan
$auth = npx vercel@latest whoami 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "  ⚠️  Non authentifié à Vercel" -ForegroundColor Yellow
    Write-Host "  → Authentification requise..." -ForegroundColor Gray
    npx vercel@latest auth login
}
Write-Host "  ✅ Authentification Vercel valide" -ForegroundColor Green

# Vérifier .env.local
Write-Host "`n[3/5] Vérification fichier .env.local..." -ForegroundColor Cyan

if (-not (Test-Path ".env.local")) {
    Write-Host "  ❌ .env.local non trouvé!" -ForegroundColor Red
    Write-Host "  → Exécutez d'abord: .\scripts\add-vault-secrets.ps1" -ForegroundColor Yellow
    exit 1
}
Write-Host "  ✅ .env.local trouvé" -ForegroundColor Green

# Charger les variables
Write-Host "`n[4/5] Chargement des variables..." -ForegroundColor Cyan
$envVars = Get-Content ".env.local" | Where-Object { $_ -match "^[A-Z_]+=.*" } | ConvertFrom-StringData

# Définir les valeurs par environnement
$envMapping = @{
    "production" = @{
        "DATABASE_URL" = $envVars["DATABASE_URL"] -replace "localhost", "prod-db.neon.tech"
        "NEXTAUTH_URL" = "https://iapostemanager.vercel.app"
        "NEXTAUTH_SECRET" = "$(Generate-Secret 32)"
        "STRIPE_SECRET_KEY" = $envVars["STRIPE_SECRET_KEY"] -replace "sk_test", "sk_live"
        "VERCEL_ANALYTICS_ID" = "v-your-analytics-id"
    }
    "preview" = @{
        "DATABASE_URL" = $envVars["DATABASE_URL"]
        "NEXTAUTH_URL" = "https://$.[project-name].vercel.app"
        "NEXTAUTH_SECRET" = "$(Generate-Secret 32)"
        "STRIPE_SECRET_KEY" = $envVars["STRIPE_SECRET_KEY"]
    }
    "development" = @{
        "DATABASE_URL" = $envVars["DATABASE_URL"]
        "NEXTAUTH_URL" = "http://localhost:3000"
        "NEXTAUTH_SECRET" = $envVars["NEXTAUTH_SECRET"]
        "STRIPE_SECRET_KEY" = $envVars["STRIPE_SECRET_KEY"]
    }
}

function Generate-Secret($length) {
    $chars = [char[]](33..126)
    return -join ($chars | Get-Random -Count $length)
}

# Ajouter les variables à Vercel
Write-Host "`n[5/5] Configuration des variables Vercel..." -ForegroundColor Cyan

$envs = if ($Environment -eq "all") { @("production", "preview", "development") } else { @($Environment) }

foreach ($env in $envs) {
    Write-Host "`n  Environnement: $env" -ForegroundColor Yellow
    
    $vars = $envMapping[$env]
    
    foreach ($key in $vars.Keys) {
        $value = $vars[$key]
        
        # Masquer la valeur pour sécurité
        if ($value.Length -gt 25) {
            $displayValue = $value.Substring(0, 25) + "***"
        } else {
            $displayValue = "***"
        }
        
        Write-Host "    → $key ($displayValue)..." -ForegroundColor Gray
        
        # Vérifier si la variable existe déjà
        $exists = npx vercel@latest env ls --env $env 2>&1 | Where-Object { $_ -match $key }
        
        if ($exists) {
            Write-Host "      (existe déjà, mise à jour)" -ForegroundColor DarkGray
            npx vercel@latest env rm $key --env $env --yes | Out-Null
        }
        
        # Ajouter la variable
        echo "$value" | npx vercel@latest env add $key --env $env | Out-Null
    }
}

Write-Host "`n" -ForegroundColor Green
Write-Host "   ✅ CONFIGURATION VERCEL RÉUSSIE!" -ForegroundColor Green
Write-Host "" -ForegroundColor Green

Write-Host "  📋 Variables ajoutées:" -ForegroundColor Cyan
$envs | ForEach-Object {
    Write-Host "    - $($_): $(($envMapping[$_].Keys).Count) variables" -ForegroundColor White
}

Write-Host "`n  🔗 Vérifier dans le Dashboard:" -ForegroundColor Cyan
Write-Host "    https://vercel.com/dashboard/[project]/settings/environment-variables" -ForegroundColor White

Write-Host "`n  💡 Commandes utiles:" -ForegroundColor Cyan
Write-Host "    - Lister: npx vercel env ls" -ForegroundColor DarkGray
Write-Host "    - Supprimer: npx vercel env rm VAR_NAME --env production" -ForegroundColor DarkGray
Write-Host "    - Pull local: npx vercel env pull .env.production.local" -ForegroundColor DarkGray

Write-Host "`n  ⚠️  IMPORTANT:" -ForegroundColor Yellow
Write-Host "    - Production utilise STRIPE_SECRET_KEY live (sk_live_...)" -ForegroundColor White
Write-Host "    - Preview/Dev utilisent keys test (sk_test_...)" -ForegroundColor White
Write-Host "    - Database URLs différentes par environnement" -ForegroundColor White

Write-Host "`n" -ForegroundColor Green
