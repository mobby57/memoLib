# MemoLib - Deploiement Fly.io
param(
    [switch]$Init
)

Write-Host ""
Write-Host "MEMOLIB - DEPLOIEMENT FLY.IO" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

# Verification flyctl
Write-Host "Verification flyctl..." -NoNewline
try {
    $flyVersion = flyctl version 2>&1
    Write-Host " OK" -ForegroundColor Green
} catch {
    Write-Host " ERREUR" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installation de flyctl:" -ForegroundColor Yellow
    Write-Host "  powershell -Command ""iwr https://fly.io/install.ps1 -useb | iex"""
    exit 1
}

if ($Init) {
    Write-Host ""
    Write-Host "INITIALISATION..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Connectez-vous a Fly.io:"
    Write-Host "   flyctl auth login"
    Write-Host ""
    Write-Host "2. Creez l'application:"
    Write-Host "   flyctl apps create memolib-api --org personal"
    Write-Host ""
    Write-Host "3. Configurez les secrets:"
    Write-Host "   flyctl secrets set JWT_SECRET=votre-secret-32-chars"
    Write-Host "   flyctl secrets set EmailMonitor__Password=votre-mot-de-passe"
    Write-Host ""
    Write-Host "4. Deployez:"
    Write-Host "   .\DEPLOY-FLY.ps1"
    exit 0
}

Write-Host "DEPLOIEMENT..." -ForegroundColor Yellow
Write-Host ""

# Build et deploy
flyctl deploy --remote-only

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "DEPLOIEMENT REUSSI!" -ForegroundColor Green
    Write-Host ""
    Write-Host "URLs:" -ForegroundColor Cyan
    Write-Host "  API: https://memolib-api.fly.dev"
    Write-Host "  Health: https://memolib-api.fly.dev/health"
    Write-Host ""
    Write-Host "Commandes utiles:" -ForegroundColor Yellow
    Write-Host "  flyctl logs"
    Write-Host "  flyctl status"
    Write-Host "  flyctl ssh console"
} else {
    Write-Host ""
    Write-Host "ERREUR DE DEPLOIEMENT" -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifiez:"
    Write-Host "  1. Vous etes connecte: flyctl auth whoami"
    Write-Host "  2. L'app existe: flyctl apps list"
    Write-Host "  3. Les secrets sont configures: flyctl secrets list"
}
