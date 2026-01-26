# Configuration GitHub User-to-Server Authentication

Write-Host "Configuration GitHub User-to-Server" -ForegroundColor Cyan
Write-Host ""

# Verifier si .env.local existe
if (-not (Test-Path ".env.local")) {
    Write-Host "Creation de .env.local..." -ForegroundColor Yellow
    Copy-Item ".env.local.example" ".env.local"
    Write-Host "Fichier cree!" -ForegroundColor Green
    Write-Host ""
}

# Lire le fichier
$envContent = Get-Content ".env.local" -Raw

# Verification
Write-Host "Verification configuration:" -ForegroundColor Cyan
Write-Host ""

$hasAppId = $envContent -match "GITHUB_APP_ID=(\d+)"
$hasClientId = $envContent -match "GITHUB_CLIENT_ID=(Iv\w+)"
$hasClientSecret = $envContent -match "GITHUB_CLIENT_SECRET=(\w{40})"
$hasCallback = $envContent -match "GITHUB_CALLBACK_URL=(https?://[^\s]+)"

if ($hasAppId) {
    Write-Host "  OK - GITHUB_APP_ID" -ForegroundColor Green
} else {
    Write-Host "  MANQUANT - GITHUB_APP_ID" -ForegroundColor Red
}

if ($hasClientId) {
    Write-Host "  OK - GITHUB_CLIENT_ID" -ForegroundColor Green
} else {
    Write-Host "  MANQUANT - GITHUB_CLIENT_ID" -ForegroundColor Red
}

if ($hasClientSecret) {
    Write-Host "  OK - GITHUB_CLIENT_SECRET" -ForegroundColor Green
} else {
    Write-Host "  MANQUANT - GITHUB_CLIENT_SECRET" -ForegroundColor Red
}

if ($hasCallback) {
    Write-Host "  OK - GITHUB_CALLBACK_URL" -ForegroundColor Green
} else {
    Write-Host "  MANQUANT - GITHUB_CALLBACK_URL" -ForegroundColor Red
}

Write-Host ""

$allValid = $hasAppId -and $hasClientId -and $hasClientSecret -and $hasCallback

if ($allValid) {
    Write-Host "Configuration complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Lancement du test..." -ForegroundColor Cyan
    npx tsx scripts/test-github-user-auth.ts
} else {
    Write-Host "Configuration incomplete" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Etapes a suivre:" -ForegroundColor Cyan
    Write-Host "1. Aller sur: https://github.com/settings/apps"
    Write-Host "2. Selectionner votre app GitHub"
    Write-Host "3. Activer OAuth during installation"
    Write-Host "4. Callback URL: http://localhost:3000/api/auth/callback/github"
    Write-Host "5. Copier Client ID et Secret dans .env.local"
    Write-Host ""
}

Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "  - GITHUB_USER_AUTH.md"
Write-Host "  - GITHUB_USER_AUTH_QUICKSTART.md"
Write-Host ""
