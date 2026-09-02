$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       MEMOLIB - DEMO ENVIRONMENT       " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# -------------------------------------------------
# 1. Vérification du fichier .env
# -------------------------------------------------

if (-not (Test-Path ".env")) {
    Write-Host "ERREUR : fichier .env introuvable." -ForegroundColor Red
    exit 1
}

Write-Host "OK - .env trouvé" -ForegroundColor Green

# -------------------------------------------------
# 2. Lecture de DATABASE_URL
# -------------------------------------------------

$envContent = Get-Content ".env"

$dbLine = $envContent |
    Where-Object {
        $_ -match "^\s*DATABASE_URL\s*="
    } |
    Select-Object -First 1

if (-not $dbLine) {
    Write-Host "ERREUR : DATABASE_URL introuvable dans .env" -ForegroundColor Red
    exit 1
}

$databaseUrl = ($dbLine -split "=", 2)[1].Trim()

# Retire les guillemets éventuels
$databaseUrl = $databaseUrl.Trim('"').Trim("'")

if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
    Write-Host "ERREUR : DATABASE_URL est vide." -ForegroundColor Red
    exit 1
}

# -------------------------------------------------
# 3. Sécurité : vérification environnement DEMO/DEV
# -------------------------------------------------

$safeKeywords = @(
    "demo",
    "dev",
    "local",
    "test",
    "staging"
)

$isSafeDatabase = $false

foreach ($keyword in $safeKeywords) {
    if ($databaseUrl.ToLower().Contains($keyword)) {
        $isSafeDatabase = $true
        break
    }
}

if (-not $isSafeDatabase) {
    Write-Host ""
    Write-Host "BLOCAGE DE SECURITE" -ForegroundColor Red
    Write-Host ""
    Write-Host "La DATABASE_URL ne semble pas pointer vers une base DEMO/DEV/TEST." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Pour éviter tout risque sur la production, le seed est annulé." -ForegroundColor Red
    Write-Host ""
    Write-Host "DATABASE_URL détectée :" -ForegroundColor Yellow

    # Masquage des credentials
    $maskedUrl = $databaseUrl -replace "://([^:]+):([^@]+)@", "://`$1:***@"

    Write-Host $maskedUrl -ForegroundColor DarkYellow

    exit 1
}

# -------------------------------------------------
# 4. Affichage sécurisé
# -------------------------------------------------

$maskedUrl = $databaseUrl -replace "://([^:]+):([^@]+)@", "://`$1:***@"

Write-Host ""
Write-Host "Base détectée :" -ForegroundColor Cyan
Write-Host $maskedUrl -ForegroundColor Yellow
Write-Host ""

# -------------------------------------------------
# 5. Vérification package.json
# -------------------------------------------------

if (-not (Test-Path "package.json")) {
    Write-Host "ERREUR : package.json introuvable." -ForegroundColor Red
    exit 1
}

$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json

if (-not $packageJson.scripts."db:seed:demo") {
    Write-Host ""
    Write-Host "ERREUR : le script db:seed:demo n'existe pas dans package.json." -ForegroundColor Red
    Write-Host ""
    Write-Host "Scripts disponibles :" -ForegroundColor Yellow

    $packageJson.scripts.PSObject.Properties.Name |
        Sort-Object |
        ForEach-Object {
            Write-Host " - $_"
        }

    exit 1
}

Write-Host "OK - script db:seed:demo trouvé" -ForegroundColor Green

# -------------------------------------------------
# 6. Confirmation utilisateur
# -------------------------------------------------

Write-Host ""
Write-Host "ATTENTION" -ForegroundColor Yellow
Write-Host "Le seed va modifier les données de la base ci-dessus." -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Tapez OUI pour continuer"

if ($confirmation -ne "OUI") {
    Write-Host ""
    Write-Host "Opération annulée." -ForegroundColor Yellow
    exit 0
}

# -------------------------------------------------
# 7. Installation dépendances
# -------------------------------------------------

Write-Host ""
Write-Host "[1/3] Vérification des dépendances..." -ForegroundColor Cyan

npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR npm install" -ForegroundColor Red
    exit $LASTEXITCODE
}

# -------------------------------------------------
# 8. Seed DEMO
# -------------------------------------------------

Write-Host ""
Write-Host "[2/3] Seed de la base DEMO..." -ForegroundColor Cyan

npm run db:seed:demo

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERREUR pendant le seed DEMO." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "OK - Seed DEMO terminé avec succès" -ForegroundColor Green

# -------------------------------------------------
# 9. Démarrage MemoLib
# -------------------------------------------------

Write-Host ""
Write-Host "[3/3] Démarrage de MemoLib..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Compte DEMO :" -ForegroundColor Green
Write-Host "Email    : demo@memolib.fr"
Write-Host "Password : Demo2026!"
Write-Host ""

npm run dev