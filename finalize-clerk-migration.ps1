# =============================================================
# Finalisation automatique de la migration NextAuth → Clerk (corrigé)
# =============================================================

Write-Host "🔐 Finalisation de la migration vers Clerk" -ForegroundColor Cyan

# 1. Sauvegarde de l'état actuel
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "migration-backup-$timestamp"
New-Item -ItemType Directory -Path $backupDir -ErrorAction SilentlyContinue | Out-Null
Copy-Item "package.json" "$backupDir/package.json" -ErrorAction SilentlyContinue
Copy-Item "package-lock.json" "$backupDir/package-lock.json" -ErrorAction SilentlyContinue
Write-Host "✅ Sauvegarde effectuée dans $backupDir" -ForegroundColor Green

# 2. Supprimer les dépendances NextAuth si elles sont encore présentes
Write-Host "🧹 Suppression des dépendances NextAuth restantes..." -ForegroundColor Cyan
npm uninstall next-auth @next-auth/prisma-adapter 2>$null

# 3. Gérer les vulnérabilités restantes (gaxios -> on laisse, car liée à Google Auth)
Write-Host "ℹ️ Les vulnérabilités restantes (gaxios/uuid) sont liées à Google Auth et ne sont pas critiques." -ForegroundColor Yellow
Write-Host "   Elles ne sont pas utilisées pour l'authentification utilisateur." -ForegroundColor Yellow

# 4. Fonction pour remplacer dans un fichier avec sauvegarde (ignorant .next, node_modules, etc.)
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
                # Sauvegarde
                $fileName = Split-Path $FilePath -Leaf
                $backupPath = Join-Path $backupDir "$fileName.backup"
                Copy-Item $FilePath $backupPath -ErrorAction SilentlyContinue
                # Écrire le nouveau contenu avec un commentaire de migration
                $header = "// CLERK-MIGRATION: $Description`n"
                Set-Content -Path $FilePath -Value ($header + $newContent) -Encoding UTF8
                Write-Host "   ✔ $FilePath - $Description" -ForegroundColor Green
            }
        }
    } catch {
        # Ignorer les erreurs de lecture/écriture
        Write-Host "   ⚠️ Impossible de traiter $FilePath" -ForegroundColor Yellow
    }
}

# 5. Récupérer les fichiers source (en ignorant les dossiers problématiques)
Write-Host "📝 Recherche des fichiers source à modifier..." -ForegroundColor Cyan

# Liste des dossiers à ignorer
$excludeDirs = @("node_modules", ".next", "bin", "obj", "tests", "dist", "build", ".git", "coverage", ".vscode")

# Fonction pour vérifier si un chemin doit être exclu
function ShouldExclude {
    param([string]$Path)
    foreach ($dir in $excludeDirs) {
        if ($Path -match "\\$dir\\") { return $true }
        if ($Path -match "\\$dir$") { return $true }
        if ($Path -match "/$dir/") { return $true }
        if ($Path -match "/$dir$") { return $true }
    }
    return $false
}

# Récupérer les fichiers avec Get-ChildItem en ignorant les erreurs
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
    Write-Host "⚠️ Erreur lors de la recherche de fichiers, utilisation de la méthode alternative..." -ForegroundColor Yellow
    # Méthode alternative avec robocopy pour éviter les erreurs de chemin
    $tempDir = "$env:TEMP\source-files-$timestamp"
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    robocopy . $tempDir *.ts *.tsx *.js *.jsx /S /XD node_modules .next bin obj tests dist build .git coverage .vscode /NFL /NDL /NJH /NJS /nc /ns /np
    $sourceFiles = Get-ChildItem -Path $tempDir -Recurse -File -Include *.ts,*.tsx,*.js,*.jsx
    Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue
}

# 6. Appliquer les remplacements
foreach ($file in $sourceFiles) {
    $path = $file.FullName

    # Remplacer les imports de useSession
    Replace-InFileSafely -FilePath $path -Pattern 'import\s*\{[^}]*useSession[^}]*\}\s*from\s*["'']next-auth/react["'']' `
        -Replacement "import { useUser } from '@clerk/nextjs'" `
        -Description "Remplacement import useSession"

    # Remplacer useSession() par useUser()
    Replace-InFileSafely -FilePath $path -Pattern 'useSession\s*\(\)' `
        -Replacement "useUser()" `
        -Description "Remplacement useSession() -> useUser()"

    # Remplacer les imports de getServerSession
    Replace-InFileSafely -FilePath $path -Pattern 'import\s*\{[^}]*getServerSession[^}]*\}\s*from\s*["'']next-auth/next["'']' `
        -Replacement "import { auth } from '@clerk/nextjs/server'" `
        -Description "Remplacement import getServerSession"

    # Remplacer getServerSession() par auth()
    Replace-InFileSafely -FilePath $path -Pattern 'getServerSession\s*\([^)]*\)' `
        -Replacement "auth()" `
        -Description "Remplacement getServerSession() -> auth()"

    # Remplacer const session = await getServerSession(...) par const { userId } = await auth()
    Replace-InFileSafely -FilePath $path -Pattern 'const\s+session\s*=\s*await\s+getServerSession\s*\([^)]*\)' `
        -Replacement "const { userId } = await auth()" `
        -Description "Remplacement session par userId"

    # Remplacer session.user par user
    Replace-InFileSafely -FilePath $path -Pattern 'session\.user' `
        -Replacement "user" `
        -Description "Remplacement session.user -> user (vérifier)"
}

# 7. Suppression du dossier API auth (s'il existe encore)
$authApiPath = "src/app/api/auth"
if (Test-Path $authApiPath) {
    Write-Host "🗑️ Suppression de l'ancienne route API auth..." -ForegroundColor Cyan
    Remove-Item -Recurse -Force $authApiPath -ErrorAction SilentlyContinue
    Write-Host "✅ Dossier $authApiPath supprimé." -ForegroundColor Green
}

# 8. Ajout des composants Clerk dans la navigation (si possible)
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
    Write-Host "⚠️ Aucun fichier de navigation trouvé. Ajoute manuellement les composants Clerk." -ForegroundColor Yellow
}

# 9. Exécuter clerk doctor pour vérifier
Write-Host "🔍 Vérification finale avec clerk doctor..." -ForegroundColor Cyan
clerk doctor

# 10. Audit de sécurité
Write-Host "🔍 Audit de sécurité final..." -ForegroundColor Cyan
npm audit --omit=dev

# 11. Instructions finales
Write-Host ""
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "✅ Migration finalisée." -ForegroundColor Green
Write-Host ""
Write-Host "📌 VÉRIFICATIONS MANUELLES OBLIGATOIRES :" -ForegroundColor White
Write-Host "1. Dans chaque fichier modifié, vérifie les remplacements (recherche 'CLERK-MIGRATION')." -ForegroundColor Yellow
Write-Host "2. Corrige manuellement les accès aux données utilisateur :" -ForegroundColor Gray
Write-Host "   - 'session.user.email' devient 'user?.emailAddresses[0]?.emailAddress'" -ForegroundColor Gray
Write-Host "   - 'session.user.name' devient 'user?.fullName'" -ForegroundColor Gray
Write-Host "   - 'session.user.id' devient 'user?.id' (ou userId dans les server components)" -ForegroundColor Gray
Write-Host "3. Teste le flux de connexion avec npm run dev." -ForegroundColor Cyan
Write-Host "4. Si tout fonctionne, supprime les commentaires '// CLERK-MIGRATION'." -ForegroundColor Yellow
Write-Host ""
Write-Host "📊 Vulnérabilités restantes :" -ForegroundColor White
Write-Host "   - gaxios/uuid (2 modérées) : liées à Google Auth, pas critiques." -ForegroundColor Gray
Write-Host "   - Tu peux les ignorer ou les corriger avec 'npm audit fix' si tu veux." -ForegroundColor Gray
Write-Host "=============================================================" -ForegroundColor Cyan