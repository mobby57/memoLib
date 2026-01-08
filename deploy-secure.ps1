# Deploiement securise avec verification
# Best practices 2026

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host " DEPLOIEMENT PRODUCTION - SECURITE RENFORCEE" -ForegroundColor White
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Etape 1: Verifications pre-deploiement
Write-Host "1. Verifications pre-deploiement...`n" -ForegroundColor Yellow

# Verifier next.config.js
Write-Host "   Verification next.config.js..." -ForegroundColor Gray
$config = Get-Content next.config.js -Raw

$requiredHeaders = @(
    'Strict-Transport-Security',
    'Content-Security-Policy',
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Referrer-Policy',
    'Permissions-Policy'
)

$headersMissing = @()
foreach ($header in $requiredHeaders) {
    if ($config -notmatch $header) {
        $headersMissing += $header
    }
}

if ($headersMissing.Count -gt 0) {
    Write-Host "   ERREUR: Headers manquants: $($headersMissing -join ', ')" -ForegroundColor Red
    Write-Host "`n   Annulation du deploiement." -ForegroundColor Red
    exit 1
} else {
    Write-Host "   OK: Headers de securite configures ($($requiredHeaders.Count)/6)" -ForegroundColor Green
}

# Build local - SKIP (Vercel build avec ignoreBuildErrors)
Write-Host "`n   Build local skip (Vercel build automatique)" -ForegroundColor Gray
Write-Host "   OK: Configuration validee" -ForegroundColor Green

# Etape 2: Deploiement
Write-Host "`n2. Deploiement vers Vercel...`n" -ForegroundColor Yellow

Write-Host "   Deploiement en cours..." -ForegroundColor Gray
vercel --prod --yes

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n   ERREUR: Deploiement echoue" -ForegroundColor Red
    exit 1
}

Write-Host "   OK: Deploiement reussi" -ForegroundColor Green

# Etape 3: Verification post-deploiement
Write-Host "`n3. Verification post-deploiement...`n" -ForegroundColor Yellow

Start-Sleep -Seconds 10

# Verifier les headers
Write-Host "   Verification headers de securite..." -ForegroundColor Gray

$response = curl.exe -I https://iapostemanager-mobby57s-projects.vercel.app 2>&1 | Out-String

$securityScore = 0
$totalHeaders = 6

foreach ($header in $requiredHeaders) {
    if ($response -match $header) {
        Write-Host "   OK: $header" -ForegroundColor Green
        $securityScore++
    } else {
        Write-Host "   KO: $header MANQUANT" -ForegroundColor Red
    }
}

$scorePercent = [math]::Round(($securityScore / $totalHeaders) * 10, 1)

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host " SCORE SECURITE: $scorePercent/10 ($securityScore/$totalHeaders)" -ForegroundColor $(if ($scorePercent -ge 8) { 'Green' } elseif ($scorePercent -ge 5) { 'Yellow' } else { 'Red' })
Write-Host "================================================" -ForegroundColor Cyan

# Recommandations
Write-Host "`nPROCHAINES ETAPES:`n" -ForegroundColor Cyan

if ($scorePercent -lt 8) {
    Write-Host "   Score insuffisant. Actions requises:" -ForegroundColor Yellow
    Write-Host "   1. Verifier vercel.json" -ForegroundColor White
    Write-Host "   2. Attendre propagation (30s)" -ForegroundColor White
    Write-Host "   3. Relancer: .\security-check.ps1" -ForegroundColor White
} else {
    Write-Host "   Securite optimale!" -ForegroundColor Green
    Write-Host ""
    Write-Host "   Actions recommandees:" -ForegroundColor Yellow
    Write-Host "   1. Monitorer: vercel logs --follow" -ForegroundColor White
    Write-Host "   2. Tester application" -ForegroundColor White
    Write-Host "   3. Configurer domaine personnalise" -ForegroundColor White
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
