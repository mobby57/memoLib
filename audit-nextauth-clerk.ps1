```powershell
# =============================================================
# MEMOLIB - AUDIT MIGRATION NEXTAUTH -> CLERK
# =============================================================

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host " MEMOLIB - AUDIT NEXTAUTH -> CLERK" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host ""

$root = (Get-Location).Path

# -------------------------------------------------------------
# 1. Vérification des dépendances
# -------------------------------------------------------------

Write-Host "[1/5] Vérification des dépendances..." -ForegroundColor Cyan
Write-Host ""

Write-Host "next-auth :" -ForegroundColor Yellow
npm ls next-auth 2>$null

Write-Host ""
Write-Host "Clerk :" -ForegroundColor Yellow
npm ls @clerk/nextjs 2>$null

Write-Host ""

# -------------------------------------------------------------
# 2. Recherche des imports NextAuth
# -------------------------------------------------------------

Write-Host "[2/5] Recherche des références NextAuth..." -ForegroundColor Cyan
Write-Host ""

$sourceFiles = Get-ChildItem `
    -Path $root `
    -Recurse `
    -File `
    -Include *.ts,*.tsx,*.js,*.jsx `
    -ErrorAction SilentlyContinue |
    Where-Object {
        $_.FullName -notmatch '\\node_modules\\' -and
        $_.FullName -notmatch '\\.next\\' -and
        $_.FullName -notmatch '\\.git\\' -and
        $_.FullName -notmatch '\\dist\\' -and
        $_.FullName -notmatch '\\build\\' -and
        $_.FullName -notmatch '\\coverage\\'
    }

$patterns = @(
    'next-auth',
    'useSession',
    'getServerSession',
    'session\.user',
    '\bsignIn\b',
    '\bsignOut\b'
)

$matches = @()

foreach ($file in $sourceFiles) {
    foreach ($pattern in $patterns) {
        $result = Select-String `
            -Path $file.FullName `
            -Pattern $pattern `
            -ErrorAction SilentlyContinue

        if ($result) {
            $matches += $result
        }
    }
}

if ($matches.Count -eq 0) {
    Write-Host "OK - aucune référence NextAuth détectée." -ForegroundColor Green
}
else {
    Write-Host "Références trouvées :" -ForegroundColor Yellow
    Write-Host ""

    $matches |
        Sort-Object Path, LineNumber |
        ForEach-Object {
            $relative = $_.Path.Substring($root.Length).TrimStart('\')
            Write-Host "  $relative :$($_.LineNumber)" -ForegroundColor White
            Write-Host "      $($_.Line.Trim())" -ForegroundColor DarkGray
        }
}

Write-Host ""

# -------------------------------------------------------------
# 3. Vérification spécifique de providers.tsx
# -------------------------------------------------------------

Write-Host "[3/5] Vérification de providers.tsx..." -ForegroundColor Cyan

$providers = Join-Path $root "src\app\[locale]\providers.tsx"

if (Test-Path -LiteralPath $providers) {

    $providerContent = Get-Content -LiteralPath $providers -Raw

    if ($providerContent -match "next-auth/react") {
        Write-Host ""
        Write-Host "ATTENTION : providers.tsx utilise encore NextAuth." -ForegroundColor Red
        Write-Host ""
        Write-Host "Référence détectée :" -ForegroundColor Yellow

        Select-String `
            -LiteralPath $providers `
            -Pattern "next-auth/react" `
            -Context 2,4 |
            ForEach-Object {
                Write-Host $_ -ForegroundColor White
            }
    }
    else {
        Write-Host "OK - providers.tsx ne référence pas next-auth/react." -ForegroundColor Green
    }
}
else {
    Write-Host "providers.tsx introuvable." -ForegroundColor Yellow
}

Write-Host ""

# -------------------------------------------------------------
# 4. Vérification des fichiers NextAuth résiduels
# -------------------------------------------------------------

Write-Host "[4/5] Recherche des fichiers NextAuth résiduels..." -ForegroundColor Cyan
Write-Host ""

$nextAuthFiles = Get-ChildItem `
    -Path $root `
    -Recurse `
    -File `
    -ErrorAction SilentlyContinue |
    Where-Object {
        $_.FullName -notmatch '\\node_modules\\' -and
        $_.FullName -notmatch '\\.next\\' -and
        (
            $_.Name -match 'nextauth' -or
            $_.Name -match 'next-auth'
        )
    }

if ($nextAuthFiles.Count -eq 0) {
    Write-Host "OK - aucun fichier NextAuth résiduel détecté." -ForegroundColor Green
}
else {
    foreach ($file in $nextAuthFiles) {
        $relative = $file.FullName.Substring($root.Length).TrimStart('\')
        Write-Host "  $relative" -ForegroundColor Yellow
    }
}

Write-Host ""

# -------------------------------------------------------------
# 5. Résumé
# -------------------------------------------------------------

Write-Host "[5/5] Résumé" -ForegroundColor Cyan
Write-Host ""

if ($matches.Count -eq 0) {
    Write-Host "NEXTAUTH : OK" -ForegroundColor Green
}
else {
    Write-Host "NEXTAUTH : références restantes à corriger = $($matches.Count)" -ForegroundColor Red
}

Write-Host ""
Write-Host "TAILWIND :" -ForegroundColor Yellow
npm ls tailwindcss postcss autoprefixer @tailwindcss/typography

Write-Host ""
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host " AUDIT TERMINÉ" -ForegroundColor Green
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "IMPORTANT :" -ForegroundColor Yellow
Write-Host "Ne fais pas de remplacement global de session.user/signIn/signOut."
Write-Host "Chaque utilisation doit être adaptée à l'API Clerk correspondante."
Write-Host ""
