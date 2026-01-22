# SETUP VERCEL 3 ENVIRONNEMENTS
Write-Host "Configuration Vercel 3 Environnements" -ForegroundColor Cyan

# Étape 1: Vérifier authentification Vercel
Write-Host "[1/5] Vérification authentification Vercel..." -ForegroundColor Yellow
$vercelWhoami = & vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur: non authentifié Vercel" -ForegroundColor Red
    exit 1
}
Write-Host "OK: $vercelWhoami" -ForegroundColor Green

# Étape 2: Lire variables locales
Write-Host "[2/5] Chargement .env.local..." -ForegroundColor Yellow

function Parse-EnvFile {
    param([string]$FilePath)
    $env = @{}
    Get-Content $FilePath | Where-Object { $_ -notmatch '^#' } | Where-Object { $_ -match '=' } | ForEach-Object {
        $line = $_ -replace '^\s+|\s+$'
        if ($line -match '^([A-Z_]+)=(.*)$') {
            $key = $matches[1]
            $value = $matches[2]
            $value = $value -replace '^"|"$'
            $env[$key] = $value
        }
    }
    return $env
}

$envLocal = Parse-EnvFile ".env.local"
Write-Host "OK: $($envLocal.Count) variables" -ForegroundColor Green

# Étape 3: Branches Git
Write-Host "[3/5] Vérification branches Git..." -ForegroundColor Yellow
$branches = & git branch -r 2>&1
Write-Host $branches | Select-Object -First 10 -ForegroundColor Green

# Étape 4: Status Vercel
Write-Host "[4/5] Status Vercel..." -ForegroundColor Yellow
& vercel project list 2>&1 | Select-Object -First 10

# Étape 5: Instructions
Write-Host "[5/5] INSTRUCTIONS MANUELLES" -ForegroundColor Yellow
Write-Host ""
Write-Host "Ouvrez Dashboard:" -ForegroundColor Cyan
Write-Host "https://vercel.com/dashboard/iapostemanage/settings/environment-variables" -ForegroundColor White
Write-Host ""
Write-Host "Configuration par environnement:" -ForegroundColor Cyan
Write-Host ""
Write-Host "DEVELOPMENT (branche develop):" -ForegroundColor Yellow
Write-Host "  NEXTAUTH_URL = https://iapostemanage-dev.vercel.app" -ForegroundColor White
Write-Host "  DATABASE_URL = (de .env.local)" -ForegroundColor Gray
Write-Host "  NEXTAUTH_SECRET = (de .env.local)" -ForegroundColor Gray
Write-Host ""
Write-Host "STAGING (branche staging):" -ForegroundColor Yellow
Write-Host "  NEXTAUTH_URL = https://iapostemanage-staging.vercel.app" -ForegroundColor White
Write-Host "  DATABASE_URL = (de .env.local)" -ForegroundColor Gray
Write-Host ""
Write-Host "PRODUCTION (branche main):" -ForegroundColor Yellow
Write-Host "  NEXTAUTH_URL = https://iapostemanage.vercel.app" -ForegroundColor White
Write-Host "  DATABASE_URL = (de .env.local)" -ForegroundColor Gray
Write-Host ""
Write-Host "Apres config, testez:" -ForegroundColor Cyan
Write-Host "  vercel list" -ForegroundColor Gray
Write-Host "  curl https://iapostemanage-dev.vercel.app/api/health" -ForegroundColor Gray

