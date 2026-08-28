```powershell
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " MemoLib - Correction Semgrep Security" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$root = (Get-Location).Path

$postgresFile = Join-Path $root "src\lib\postgres.config.ts"
$encryptionFile = Join-Path $root "src\lib\security\encryption.ts"
$servicesEncryptionFile = Join-Path $root "src\lib\services\encryption.ts"
$authFile = Join-Path $root "src\app\api\auth\[...nextauth]\route.ts"

# ------------------------------------------------------------
# 1. Vérification des fichiers
# ------------------------------------------------------------

$files = @(
    $postgresFile,
    $encryptionFile,
    $servicesEncryptionFile,
    $authFile
)

foreach ($file in $files) {
    if (-not (Test-Path -LiteralPath $file)) {
        throw "Fichier introuvable : $file"
    }
}

Write-Host "[OK] Fichiers trouvés." -ForegroundColor Green

# ------------------------------------------------------------
# 2. Sauvegardes
# ------------------------------------------------------------

$backupDir = Join-Path $root ("security-backup-" + (Get-Date -Format "yyyyMMdd-HHmmss"))
New-Item -ItemType Directory -Path $backupDir | Out-Null

Copy-Item -LiteralPath $postgresFile -Destination (Join-Path $backupDir "postgres.config.ts")
Copy-Item -LiteralPath $encryptionFile -Destination (Join-Path $backupDir "encryption.ts")
Copy-Item -LiteralPath $servicesEncryptionFile -Destination (Join-Path $backupDir "services-encryption.ts")
Copy-Item -LiteralPath $authFile -Destination (Join-Path $backupDir "route.ts")

Write-Host "[OK] Sauvegarde créée : $backupDir" -ForegroundColor Green

# ------------------------------------------------------------
# 3. Fonction lecture/écriture UTF-8
# ------------------------------------------------------------

function Read-Utf8([string]$Path) {
    return [System.IO.File]::ReadAllText($Path)
}

function Write-Utf8([string]$Path, [string]$Content) {
    [System.IO.File]::WriteAllText(
        $Path,
        $Content,
        [System.Text.UTF8Encoding]::new($false)
    )
}

# ------------------------------------------------------------
# 4. Correction PostgreSQL / TLS
# ------------------------------------------------------------

Write-Host ""
Write-Host "[1/4] Correction TLS PostgreSQL..." -ForegroundColor Yellow

$content = Read-Utf8 $postgresFile

$old = 'ssl: { rejectUnauthorized: false }'
$new = 'ssl: { rejectUnauthorized: true }'

if ($content.Contains($old)) {
    $content = $content.Replace($old, $new)
    Write-Utf8 $postgresFile $content

    Write-Host "  [FIX] rejectUnauthorized: false -> true" -ForegroundColor Green
}
else {
    Write-Host "  [INFO] Aucune occurrence à corriger." -ForegroundColor Gray
}

# ------------------------------------------------------------
# 5. Correction AES-GCM : authTagLength explicite
# ------------------------------------------------------------

Write-Host ""
Write-Host "[2/4] Correction AES-GCM..." -ForegroundColor Yellow

$encryptionFiles = @(
    $encryptionFile,
    $servicesEncryptionFile
)

$totalDecipherFixes = 0
$totalCipherFixes = 0

foreach ($file in $encryptionFiles) {

    $content = Read-Utf8 $file

    # createDecipheriv(ALGORITHM, key, iv)
    $patternDecipher = 'crypto\.createDecipheriv\(ALGORITHM,\s*key,\s*iv\)'
    $replacementDecipher = 'crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: 16 })'

    $matches = [regex]::Matches($content, $patternDecipher)

    if ($matches.Count -gt 0) {
        $content = [regex]::Replace(
            $content,
            $patternDecipher,
            $replacementDecipher
        )

        $totalDecipherFixes += $matches.Count

        Write-Host "  [FIX] $($matches.Count) createDecipheriv() dans $file" -ForegroundColor Green
    }

    # On rend également explicite la taille du tag lors du chiffrement.
    $patternCipher = 'crypto\.createCipheriv\(ALGORITHM,\s*key,\s*iv\)'
    $replacementCipher = 'crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: 16 })'

    $matchesCipher = [regex]::Matches($content, $patternCipher)

    if ($matchesCipher.Count -gt 0) {
        $content = [regex]::Replace(
            $content,
            $patternCipher,
            $replacementCipher
        )

        $totalCipherFixes += $matchesCipher.Count

        Write-Host "  [FIX] $($matchesCipher.Count) createCipheriv() dans $file" -ForegroundColor Green
    }

    Write-Utf8 $file $content
}

Write-Host "  Total decipher corrigés : $totalDecipherFixes" -ForegroundColor Cyan
Write-Host "  Total cipher corrigés   : $totalCipherFixes" -ForegroundColor Cyan

# ------------------------------------------------------------
# 6. Suppression des hashes bcrypt codés en dur
# ------------------------------------------------------------

Write-Host ""
Write-Host "[3/4] Suppression des hashes bcrypt codés en dur..." -ForegroundColor Yellow

$content = Read-Utf8 $authFile

# Exemple :
# process.env.DEMO_ADMIN_PASSWORD_HASH || '$2b$10$....'
#
# Devient :
# process.env.DEMO_ADMIN_PASSWORD_HASH || ''

$bcryptPattern = "(\bprocess\.env\.[A-Z0-9_]*PASSWORD_HASH)\s*\|\|\s*'`$2[aby]`$[0-9]{2}`\$[^']+'"

$bcryptMatches = [regex]::Matches(
    $content,
    $bcryptPattern,
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
)

if ($bcryptMatches.Count -gt 0) {

    $content = [regex]::Replace(
        $content,
        $bcryptPattern,
        '$1 || ''''',
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )

    Write-Utf8 $authFile $content

    Write-Host "  [FIX] $($bcryptMatches.Count) hash(s) bcrypt codé(s) en dur supprimé(s)." -ForegroundColor Green
}
else {
    Write-Host "  [INFO] Aucun hash bcrypt correspondant trouvé." -ForegroundColor Gray
}

# ------------------------------------------------------------
# 7. Vérifications statiques
# ------------------------------------------------------------

Write-Host ""
Write-Host "[4/4] Vérification des corrections..." -ForegroundColor Yellow

$errors = @()

# PostgreSQL TLS
$postgresCheck = Read-Utf8 $postgresFile

if ($postgresCheck -match 'rejectUnauthorized\s*:\s*false') {
    $errors += "rejectUnauthorized: false est toujours présent dans postgres.config.ts"
}
else {
    Write-Host "  [OK] Aucun rejectUnauthorized: false" -ForegroundColor Green
}

# AES-GCM
foreach ($file in $encryptionFiles) {

    $check = Read-Utf8 $file

    $badDecipher = [regex]::Matches(
        $check,
        'crypto\.createDecipheriv\(ALGORITHM,\s*key,\s*iv\)'
    )

    if ($badDecipher.Count -gt 0) {
        $errors += "$file contient encore $($badDecipher.Count) createDecipheriv sans authTagLength"
    }

    $gcmCalls = [regex]::Matches(
        $check,
        'crypto\.createDecipheriv\(ALGORITHM,\s*key,\s*iv,\s*\{\s*authTagLength\s*:\s*16\s*\}\)'
    )

    if ($gcmCalls.Count -gt 0) {
        Write-Host "  [OK] $file : $($gcmCalls.Count) createDecipheriv avec authTagLength=16" -ForegroundColor Green
    }
}

# Bcrypt hardcodé
$authCheck = Read-Utf8 $authFile

$remainingBcrypt = [regex]::Matches(
    $authCheck,
    '\$2[aby]\$[0-9]{2}\$'
)

if ($remainingBcrypt.Count -gt 0) {
    $errors += "$($remainingBcrypt.Count) hash(s) bcrypt semblent encore codés en dur dans route.ts"
}
else {
    Write-Host "  [OK] Aucun hash bcrypt '$2b$...' détecté dans route.ts" -ForegroundColor Green
}

# ------------------------------------------------------------
# 8. Résultat
# ------------------------------------------------------------

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($errors.Count -eq 0) {

    Write-Host " SECURITY FIX : OK" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Les corrections statiques sont terminées." -ForegroundColor Green
    Write-Host ""
    Write-Host "Sauvegarde :" -ForegroundColor Cyan
    Write-Host "  $backupDir"
    Write-Host ""

}
else {

    Write-Host " SECURITY FIX : ERREURS" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""

    foreach ($errorMessage in $errors) {
        Write-Host "[ERREUR] $errorMessage" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "Les fichiers originaux sont disponibles dans :" -ForegroundColor Yellow
    Write-Host "  $backupDir"

    exit 1
}
```
