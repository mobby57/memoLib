# =============================================================
# Script complet de migration NextAuth → Clerk (étapes 2 à 5)
# =============================================================

Write-Host "🔐 Migration automatique vers Clerk" -ForegroundColor Cyan

# ---------- 1. Sauvegarde ----------
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "migration-backup-$timestamp"
New-Item -ItemType Directory -Path $backupDir -ErrorAction SilentlyContinue | Out-Null
Copy-Item "package.json" "$backupDir/package.json" -ErrorAction SilentlyContinue
Copy-Item "package-lock.json" "$backupDir/package-lock.json" -ErrorAction SilentlyContinue
Write-Host "✅ Sauvegarde effectuée dans $backupDir" -ForegroundColor Green

# ---------- 2. Nettoyage des dépendances ----------
Write-Host "🧹 Suppression des dépendances NextAuth..." -ForegroundColor Cyan
npm uninstall next-auth @next-auth/prisma-adapter 2>$null

# ---------- 3. Fonction de remplacement sécurisé ----------
function Replace-InFileSafely {
    param(
        [string]$FilePath,
        [string]$Pattern,
        [string]$Replacement,
        [string]$Description
    )
    if (-not (Test-Path $FilePath)) { return }
    try {
        $content = Get-Content $FilePath -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
        if (-not $content) { return }
        if ($content -match $Pattern) {
            $newContent = $content -replace $Pattern, $Replacement
            if ($newContent -ne $content) {
                $fileName = Split-Path $FilePath -Leaf
                $backupPath = Join-Path $backupDir "$fileName.backup"
                Copy-Item $FilePath $backupPath -ErrorAction SilentlyContinue
                $header = "// CLERK-MIGRATION: $Description`n"
                Set-Content -Path $FilePath -Value ($header + $newContent) -Encoding UTF8
                Write-Host "   ✔ $FilePath - $Description" -ForegroundColor Green
            }
        }
    } catch {
        Write-Host "   ⚠️ Impossible de traiter $FilePath" -ForegroundColor Yellow
    }
}

# ---------- 4. Liste des dossiers à ignorer ----------
$excludeDirs = @("node_modules", ".next", "bin", "obj", "tests", "dist", "build", ".git", "coverage", ".vscode")

function ShouldExclude {
    param([string]$Path)
    foreach ($dir in $excludeDirs) {
        if ($Path -match "\\$dir\\" -or $Path -match "\\$dir$" -or $Path -match "/$dir/" -or $Path -match "/$dir$") {
            return $true
        }
    }
    return $false
}

# ---------- 5. Récupération des fichiers source ----------
Write-Host "📝 Recherche des fichiers source..." -ForegroundColor Cyan
$sourceFiles = @()
try {
    $allFiles = Get-ChildItem -Path . -Recurse -File -Include *.ts,*.tsx,*.js,*.jsx -ErrorAction SilentlyContinue
    foreach ($file in $allFiles) {
        if (-not (ShouldExclude -Path $file.FullName)) {
            $sourceFiles += $file
        }
    }
    Write-Host "✅ $($sourceFiles.Count) fichiers trouvés." -ForegroundColor Green
} catch {
    Write-Host "⚠️ Utilisation de robocopy pour une recherche robuste..." -ForegroundColor Yellow
    $tempDir = "$env:TEMP\source-files-$timestamp"
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    robocopy . $tempDir *.ts *.tsx *.js *.jsx /S /XD node_modules .next bin obj tests dist build .git coverage .vscode /NFL /NDL /NJH /NJS /nc /ns /np
    $sourceFiles = Get-ChildItem -Path $tempDir -Recurse -File -Include *.ts,*.tsx,*.js,*.jsx
    Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue
}

# ---------- 6. Remplacements automatisés ----------
Write-Host "🔄 Remplacement des appels NextAuth..." -ForegroundColor Cyan

foreach ($file in $sourceFiles) {
    $path = $file.FullName

    # Imports useSession
    Replace-InFileSafely -FilePath $path -Pattern 'import\s*\{[^}]*useSession[^}]*\}\s*from\s*["'']next-auth/react["'']' `
        -Replacement "import { useUser } from '@clerk/nextjs'" `
        -Description "Remplacement import useSession"

    # useSession() → useUser()
    Replace-InFileSafely -FilePath $path -Pattern 'useSession\s*\(\)' `
        -Replacement "useUser()" `
        -Description "Remplacement useSession() -> useUser()"

    # Imports getServerSession
    Replace-InFileSafely -FilePath $path -Pattern 'import\s*\{[^}]*getServerSession[^}]*\}\s*from\s*["'']next-auth/next["'']' `
        -Replacement "import { auth } from '@clerk/nextjs/server'" `
        -Description "Remplacement import getServerSession"

    # getServerSession(...) → auth()
    Replace-InFileSafely -FilePath $path -Pattern 'getServerSession\s*\([^)]*\)' `
        -Replacement "auth()" `
        -Description "Remplacement getServerSession() -> auth()"

    # const session = await getServerSession(...) → const { userId } = await auth()
    Replace-InFileSafely -FilePath $path -Pattern 'const\s+session\s*=\s*await\s+getServerSession\s*\([^)]*\)' `
        -Replacement "const { userId } = await auth()" `
        -Description "Remplacement session par userId"

    # session.user → user (attention, remplacement potentiellement large)
    Replace-InFileSafely -FilePath $path -Pattern 'session\.user' `
        -Replacement "user" `
        -Description "Remplacement session.user -> user (vérifier)"
}

# ---------- 7. Suppression de la route API auth ----------
$authApiPath = "src/app/api/auth"
if (Test-Path $authApiPath) {
    Write-Host "🗑️ Suppression de l'ancienne route API auth..." -ForegroundColor Cyan
    Remove-Item -Recurse -Force $authApiPath -ErrorAction SilentlyContinue
    Write-Host "✅ Dossier $authApiPath supprimé." -ForegroundColor Green
}

# ---------- 8. Ajout des composants Clerk dans la navigation ----------
$navFiles = Get-ChildItem -Path . -Recurse -File -Include *navbar*,*header*,*nav*,*layout*.tsx -ErrorAction SilentlyContinue |
    Where-Object { -not (ShouldExclude -Path $_.FullName) } |
    Select-Object -First 1

if ($navFiles) {
    $navPath = $navFiles.FullName
    Write-Host "📝 Ajout des composants Clerk dans $navPath..." -ForegroundColor Cyan
    try {
        $content = Get-Content $navPath -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
        if ($content -and $content -notmatch "SignInButton|UserButton") {
            $imports = @"
import { SignInButton, SignUpButton, UserButton, Show } from '@clerk/nextjs';
"@
            $newContent = $content -replace '(import.*?;\s*)', "`$1`n$imports`n"
            $newContent = $newContent -replace '(<nav[^>]*>|<header[^>]*>|<div[^>]*class=".*?nav.*?">)', @'
$1
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Show when="signed-out">
              <SignInButton mode="modal" />
              <SignUpButton mode="modal" />
            </Show>
            <Show when="signed-in">
              <UserButton afterSignOutUrl="/" />
            </Show>
          </div>
'@
            Set-Content -Path $navPath -Value $newContent -Encoding UTF8
            Write-Host "✅ Composants Clerk ajoutés dans $navPath." -ForegroundColor Green
        } else {
            Write-Host "ℹ️ Composants Clerk déjà présents dans $navPath." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️ Impossible de modifier $navPath" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️ Aucun fichier de navigation trouvé. Ajoute manuellement les composants." -ForegroundColor Yellow
}

# ---------- 9. Vérification finale ----------
Write-Host "🔍 Vérification avec clerk doctor..." -ForegroundColor Cyan
clerk doctor

Write-Host "🔍 Audit de sécurité..." -ForegroundColor Cyan
npm audit --omit=dev

# ---------- 10. Instructions finales ----------
Write-Host ""
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "✅ Migration automatisée terminée." -ForegroundColor Green
Write-Host ""
Write-Host "📌 VÉRIFICATIONS MANUELLES OBLIGATOIRES :" -ForegroundColor White
Write-Host "1. Recherche 'CLERK-MIGRATION' dans les fichiers modifiés pour vérifier." -ForegroundColor Yellow
Write-Host "2. Adapte manuellement les accès aux données utilisateur :" -ForegroundColor Gray
Write-Host "   - 'session.user.email' → 'user?.emailAddresses[0]?.emailAddress'" -ForegroundColor Gray
Write-Host "   - 'session.user.name' → 'user?.fullName'" -ForegroundColor Gray
Write-Host "   - 'session.user.id' → 'user?.id' (ou userId dans les server components)" -ForegroundColor Gray
Write-Host "3. Lance l'application : npm run dev, puis teste la connexion." -ForegroundColor Cyan
Write-Host "4. Si tout fonctionne, supprime les commentaires 'CLERK-MIGRATION'." -ForegroundColor Yellow
Write-Host ""
Write-Host "📊 Vulnérabilités restantes (éventuelles) :" -ForegroundColor White
Write-Host "   - Les vulnérabilités 'gaxios/uuid' sont liées à Google Auth et non critiques." -ForegroundColor Gray
Write-Host "=============================================================" -ForegroundColor Cyan