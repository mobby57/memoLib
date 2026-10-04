$ErrorActionPreference = "Stop"

$root = "C:\Users\moros\Desktop\memolib"
$vercel = Join-Path $root "vercel.json"
$backup = Join-Path $root "vercel.json.bak"

Set-Location $root

Write-Host "============================================================"
Write-Host " MEMOLIB - FIX CSP + VERCEL PROD"
Write-Host "============================================================"
Write-Host ""

# ------------------------------------------------------------
# 1. Vérification
# ------------------------------------------------------------

Write-Host "[1/7] Verification de vercel.json..."

if (-not (Test-Path $vercel)) {
    Write-Host "[FAIL] vercel.json introuvable."
    exit 1
}

Write-Host "[PASS] vercel.json trouve."
Write-Host ""

# ------------------------------------------------------------
# 2. Sauvegarde
# ------------------------------------------------------------

Write-Host "[2/7] Sauvegarde..."

Copy-Item $vercel $backup -Force

Write-Host "[PASS] vercel.json.bak cree."
Write-Host ""

# ------------------------------------------------------------
# 3. Lecture
# ------------------------------------------------------------

Write-Host "[3/7] Recherche de Content-Security-Policy..."

$content = Get-Content -Raw -LiteralPath $vercel

if ($content -notmatch '"key"\s*:\s*"Content-Security-Policy"') {
    Write-Host "[FAIL] Content-Security-Policy introuvable."
    exit 1
}

Write-Host "[PASS] Content-Security-Policy trouve."
Write-Host ""

# ------------------------------------------------------------
# 4. Nouvelle CSP
# ------------------------------------------------------------

$newCsp = "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://vercel.live https://va.vercel-scripts.com https://clerk.memolib.space https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com https://*.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https: wss:; worker-src 'self' blob:; frame-src 'self' https://clerk.memolib.space https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;"

Write-Host "[4/7] Remplacement de la CSP..."

$pattern = '(?s)("key"\s*:\s*"Content-Security-Policy"\s*,\s*"value"\s*:\s*")[^"]*(")'

$updated = [regex]::Replace(
    $content,
    $pattern,
    ('$1' + $newCsp + '$2'),
    1
)

if ($updated -eq $content) {
    Write-Host "[FAIL] La CSP n'a pas ete modifiee."
    Write-Host "Restauration..."
    Copy-Item $backup $vercel -Force
    exit 1
}

[System.IO.File]::WriteAllText(
    $vercel,
    $updated,
    [System.Text.UTF8Encoding]::new($false)
)

Write-Host "[PASS] CSP modifiee."
Write-Host ""

# ------------------------------------------------------------
# 5. Vérification
# ------------------------------------------------------------

Write-Host "[5/7] Verification..."

$check = Get-Content -Raw -LiteralPath $vercel

$required = @(
    "https://clerk.memolib.space",
    "https://*.clerk.com",
    "https://*.clerk.accounts.dev",
    "https://challenges.cloudflare.com",
    "frame-ancestors 'none'",
    "connect-src",
    "worker-src"
)

foreach ($item in $required) {
    if ($check.Contains($item)) {
        Write-Host "[PASS] $item"
    }
    else {
        Write-Host "[FAIL] $item"
        Write-Host "Restauration automatique..."
        Copy-Item $backup $vercel -Force
        exit 1
    }
}

Write-Host ""

# ------------------------------------------------------------
# 6. Affichage CSP
# ------------------------------------------------------------

Write-Host "[6/7] CSP actuellement presente :"
Write-Host ""

$match = [regex]::Match(
    $check,
    '(?s)"key"\s*:\s*"Content-Security-Policy"\s*,\s*"value"\s*:\s*"([^"]*)"'
)

if ($match.Success) {
    Write-Host $match.Groups[1].Value
}
else {
    Write-Host "[WARN] Impossible d'afficher la CSP."
}

Write-Host ""
Write-Host "============================================================"
Write-Host " VERIFICATION clerk.memolib.space"
Write-Host "============================================================"

if ($check.Contains("https://clerk.memolib.space")) {
    Write-Host "[PASS] clerk.memolib.space est present dans vercel.json"
}
else {
    Write-Host "[FAIL] clerk.memolib.space absent"
    Copy-Item $backup $vercel -Force
    exit 1
}

Write-Host ""

# ------------------------------------------------------------
# 7. Déploiement
# ------------------------------------------------------------

Write-Host "============================================================"
Write-Host " DEPLOIEMENT VERCEL PRODUCTION"
Write-Host "============================================================"
Write-Host ""
Write-Host "Commande : npx vercel --prod"
Write-Host ""

npx vercel --prod

$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "============================================================"
Write-Host " RESULTAT"
Write-Host "============================================================"

if ($exitCode -eq 0) {
    Write-Host "[PASS] Deploiement Vercel termine."
}
else {
    Write-Host "[FAIL] Vercel a retourne le code $exitCode"
    Write-Host ""
    Write-Host "vercel.json reste modifie localement."
    Write-Host "Sauvegarde : vercel.json.bak"
}

Write-Host ""
exit $exitCode