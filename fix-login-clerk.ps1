$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " MEMOLIB - MIGRATION LOGIN NEXTAUTH -> CLERK" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$file = Join-Path $PSScriptRoot "src\app\[locale]\auth\login\page.tsx"

if (-not (Test-Path -LiteralPath $file)) {
    Write-Host "ERREUR : Fichier introuvable :" -ForegroundColor Red
    Write-Host $file -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/5] Fichier trouve :" -ForegroundColor Green
Write-Host $file
Write-Host ""

# Sauvegarde
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = "$file.bak.$timestamp"

Copy-Item -LiteralPath $file -Destination $backup -Force

Write-Host "[2/5] Sauvegarde creee :" -ForegroundColor Green
Write-Host $backup
Write-Host ""

# Lecture
$content = Get-Content -LiteralPath $file -Raw -Encoding UTF8

# Suppression de l'import NextAuth
$content = $content -replace "(?m)^\s*import\s*\{\s*signIn\s*\}\s*from\s*['""]next-auth/react['""];\s*\r?\n?", ""

# Ajout de l'import Clerk si absent
if ($content -notmatch "@clerk/nextjs") {

    $clerkImport = @"
import { useSignIn } from '@clerk/nextjs';

"@

    # Ajoute Clerk après 'use client';
    $content = $content -replace "('use client';\s*\r?\n)", "`$1`r`n$clerkImport"
}

Write-Host "[3/5] Import NextAuth supprime et Clerk ajoute." -ForegroundColor Green

# Ajout du hook useSignIn dans le composant
if ($content -notmatch "useSignIn\(\)") {

    # Cherche le premier useRouter()
    if ($content -match "const\s+router\s*=\s*useRouter\(\);") {

        $content = $content -replace `
            "(const\s+router\s*=\s*useRouter\(\);)", `
            "`$1`r`n  const { signIn, isLoaded } = useSignIn();"

        Write-Host "[4/5] Hook useSignIn ajoute." -ForegroundColor Green
    }
    else {
        Write-Host "[4/5] ATTENTION : useRouter() non trouve." -ForegroundColor Yellow
        Write-Host "Ajoute manuellement :" -ForegroundColor Yellow
        Write-Host "const { signIn, isLoaded } = useSignIn();"
    }
}

# Remplace signIn('credentials', ...)
if ($content -match "signIn\s*\(\s*['""]credentials['""]") {

    Write-Host ""
    Write-Host "ATTENTION :" -ForegroundColor Yellow
    Write-Host "Une connexion NextAuth Credentials a ete detectee." -ForegroundColor Yellow
    Write-Host "Le formulaire doit etre adapte manuellement a Clerk." -ForegroundColor Yellow

    # Le script ne remplace pas brutalement le code,
    # car la logique Clerk depend de la structure exacte du formulaire.
}

Set-Content -LiteralPath $file -Value $content -Encoding UTF8

Write-Host "[5/5] Fichier modifie avec succes." -ForegroundColor Green
Write-Host ""

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " MIGRATION PARTIELLE TERMINEE" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Fichier :" -ForegroundColor White
Write-Host $file -ForegroundColor Gray
Write-Host ""
Write-Host "Sauvegarde :" -ForegroundColor White
Write-Host $backup -ForegroundColor Gray
Write-Host ""
Write-Host "Lance maintenant :" -ForegroundColor Cyan
Write-Host "npm run dev" -ForegroundColor White
Write-Host ""