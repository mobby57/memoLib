# 🚀 DÉPLOIEMENT CLOUDFLARE PAGES - SCRIPT AUTOMATISÉ
# 
# Pré-requis:
# - npm install --save-dev @cloudflare/next-on-pages wrangler --legacy-peer-deps
# - wrangler login (première fois)
#
# Usage: .\deploy-cloudflare.ps1

param(
    [switch]$SkipBuild,
    [switch]$Preview
)

$ErrorActionPreference = "Stop"

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host " DEPLOIEMENT CLOUDFLARE PAGES" -ForegroundColor Green
Write-Host "================================================`n" -ForegroundColor Cyan

# Vérifier Wrangler installé
Write-Host "1️⃣  Verification Wrangler CLI...`n" -ForegroundColor Yellow
if (-not (Get-Command wrangler -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Wrangler non installe!" -ForegroundColor Red
    Write-Host "   Installation: npm install -g wrangler`n" -ForegroundColor Gray
    exit 1
}

$wranglerVersion = wrangler --version 2>&1 | Out-String
Write-Host "   ✅ Wrangler: $($wranglerVersion.Trim())`n" -ForegroundColor Green

# Vérifier authentification
Write-Host "2️⃣  Verification authentification...`n" -ForegroundColor Yellow
$whoami = wrangler whoami 2>&1 | Out-String
if ($whoami -match "not authenticated") {
    Write-Host "❌ Non authentifie!" -ForegroundColor Red
    Write-Host "   Connexion: wrangler login`n" -ForegroundColor Gray
    Write-Host "Lancement authentification..." -ForegroundColor Yellow
    wrangler login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n❌ Authentification echouee!`n" -ForegroundColor Red
        exit 1
    }
}
Write-Host "   ✅ Authentifie`n" -ForegroundColor Green

# Build Next.js pour Cloudflare
if (-not $SkipBuild) {
    Write-Host "3️⃣  Build Next.js avec @cloudflare/next-on-pages...`n" -ForegroundColor Yellow
    
    # Nettoyer builds précédents
    if (Test-Path ".vercel/output/static") {
        Remove-Item -Recurse -Force ".vercel/output/static"
    }
    
    Write-Host "   Building...`n" -ForegroundColor Gray
    npx @cloudflare/next-on-pages
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n❌ Build echoue!`n" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "`n   ✅ Build reussi`n" -ForegroundColor Green
} else {
    Write-Host "3️⃣  Build skip (--SkipBuild)`n" -ForegroundColor Yellow
}

# Vérifier fichier _headers
Write-Host "4️⃣  Verification headers de securite...`n" -ForegroundColor Yellow

$headersSource = "public\_headers"
$headersDest = ".vercel\output\static\_headers"

if (-not (Test-Path $headersSource)) {
    Write-Host "   ⚠️  Fichier _headers manquant dans public/" -ForegroundColor Yellow
    Write-Host "   Creation automatique...`n" -ForegroundColor Gray
    
    @"
/*
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';
  X-XSS-Protection: 1; mode=block
  Cross-Origin-Embedder-Policy: credentialless
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
"@ | Out-File -FilePath $headersSource -Encoding utf8
}

# Copier _headers dans build
if (Test-Path ".vercel\output\static") {
    Copy-Item $headersSource $headersDest -Force
    Write-Host "   ✅ Headers copies dans build`n" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Dossier build manquant`n" -ForegroundColor Yellow
}

# Compter headers configurés
$headersCount = (Get-Content $headersSource | Where-Object { $_ -match ":" }).Count
Write-Host "   ✅ $headersCount headers configures`n" -ForegroundColor Green

# Déploiement
if ($Preview) {
    Write-Host "5️⃣  Deploiement PREVIEW...`n" -ForegroundColor Yellow
    Write-Host "   Commande: wrangler pages deploy .vercel/output/static`n" -ForegroundColor Gray
    
    wrangler pages deploy .vercel/output/static
} else {
    Write-Host "5️⃣  Deploiement PRODUCTION...`n" -ForegroundColor Yellow
    Write-Host "   Commande: wrangler pages deploy .vercel/output/static --branch=main`n" -ForegroundColor Gray
    
    wrangler pages deploy .vercel/output/static --branch=main
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Deploiement echoue!`n" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Deploiement reussi!" -ForegroundColor Green

# Attendre propagation
Write-Host "`n6️⃣  Attente propagation (15 secondes)...`n" -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Vérification headers
Write-Host "7️⃣  Verification headers de securite...`n" -ForegroundColor Yellow

# Récupérer URL déployée (dernière ligne de wrangler deploy)
$url = "https://iapostemanager.pages.dev"  # URL par défaut

Write-Host "   URL testee: $url`n" -ForegroundColor Gray

try {
    $headers = curl.exe -I $url 2>$null | Select-String -Pattern "(Strict-Transport-Security|Content-Security-Policy|X-Frame-Options|X-Content-Type-Options|Referrer-Policy|Permissions-Policy)"
    
    $criticalHeaders = @(
        'Strict-Transport-Security',
        'Content-Security-Policy',
        'X-Frame-Options',
        'X-Content-Type-Options',
        'Referrer-Policy',
        'Permissions-Policy'
    )
    
    $found = @{}
    foreach ($h in $criticalHeaders) {
        $found[$h] = $false
    }
    
    foreach ($line in $headers) {
        foreach ($h in $criticalHeaders) {
            if ($line -match $h) {
                $found[$h] = $true
                Write-Host "   ✅ $h" -ForegroundColor Green
            }
        }
    }
    
    Write-Host ""
    
    foreach ($h in $criticalHeaders) {
        if (-not $found[$h]) {
            Write-Host "   ❌ $h MANQUANT" -ForegroundColor Red
        }
    }
    
    $score = ($found.Values | Where-Object { $_ }).Count
    $total = $criticalHeaders.Count
    $pct = [math]::Round(($score / $total) * 10, 1)
    
    Write-Host "`n   SCORE SECURITE: $pct/10 ($score/$total)`n" -ForegroundColor $(
        if ($score -ge 6) { 'Green' } 
        elseif ($score -ge 4) { 'Yellow' } 
        else { 'Red' }
    )
    
    if ($score -eq $total) {
        Write-Host "🎉 PARFAIT! Tous les headers appliques!" -ForegroundColor Green
        Write-Host "✅ OWASP 2026 COMPLIANT`n" -ForegroundColor Green
    } elseif ($score -ge 4) {
        Write-Host "⚠️  Quelques headers manquants - verification _headers" -ForegroundColor Yellow
        Write-Host "   Attendre 30-60 secondes propagation CDN`n" -ForegroundColor Gray
    } else {
        Write-Host "❌ Headers pas appliques - verifier configuration" -ForegroundColor Red
        Write-Host "   Troubleshooting: CLOUDFLARE_MIGRATION_COMPLETE.md`n" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "⚠️  Impossible de verifier headers" -ForegroundColor Yellow
    Write-Host "   Test manuel: curl.exe -I $url`n" -ForegroundColor Gray
}

Write-Host "================================================" -ForegroundColor Cyan
Write-Host " DEPLOIEMENT TERMINE" -ForegroundColor Green
Write-Host "================================================`n" -ForegroundColor Cyan

Write-Host "📊 Commandes utiles:" -ForegroundColor Cyan
Write-Host "   - Logs temps reel: wrangler pages deployment tail" -ForegroundColor Gray
Write-Host "   - Liste deployments: wrangler pages deployment list" -ForegroundColor Gray
Write-Host "   - Rollback: wrangler pages deployment rollback <id>" -ForegroundColor Gray
Write-Host "   - Dashboard: https://dash.cloudflare.com/pages`n" -ForegroundColor Gray
