# Script: Configure Cloudflare Pages Secrets

Write-Host ""
Write-Host "Configuration des Secrets Cloudflare Pages" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Load .env.local
$envFile = ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "ERREUR: Fichier .env.local non trouve" -ForegroundColor Red
    exit 1
}

Write-Host "Lecture des variables..." -ForegroundColor Yellow
Write-Host ""

# Parse .env.local
$env_content = Get-Content $envFile
$vars = @{}

foreach ($line in $env_content) {
    if ($line -match "^([^=]+)=(.+)$") {
        $key = $matches[1]
        $value = $matches[2].Trim('"')
        $vars[$key] = $value
    }
}

# Required variables
$required = @(
    "DATABASE_URL",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
    "OLLAMA_BASE_URL"
)

Write-Host "Variables trouvees:" -ForegroundColor Green
Write-Host ""

foreach ($key in $required) {
    if ($vars.ContainsKey($key)) {
        $value = $vars[$key]
        Write-Host "  OK: $key" -ForegroundColor Green
    } else {
        Write-Host "  MANQUANT: $key" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "INSTRUCTIONS MANUELLES:" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Allez a: https://dash.cloudflare.com" -ForegroundColor White
Write-Host "2. Pages > iapostemanage > Settings" -ForegroundColor White
Write-Host "3. Environment variables > Production" -ForegroundColor White
Write-Host "4. Cliquez Add variable" -ForegroundColor White
Write-Host ""

Write-Host "Variables a ajouter:" -ForegroundColor Yellow
Write-Host ""

foreach ($key in $required) {
    if ($vars.ContainsKey($key)) {
        $value = $vars[$key]
        Write-Host "Name: $key" -ForegroundColor White
        Write-Host "Value: $value" -ForegroundColor Cyan
        Write-Host ""
    }
}

Write-Host "5. Cliquez Save and Deploy" -ForegroundColor White
Write-Host ""

Write-Host "APRES CONFIGURATION:" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "1. Attendez 2-3 minutes" -ForegroundColor White
Write-Host "2. Testez: https://9fd537bc.iapostemanage.pages.dev/login" -ForegroundColor Cyan
Write-Host "3. Verifiez logs: npm run cloudflare:logs" -ForegroundColor Gray
Write-Host ""
