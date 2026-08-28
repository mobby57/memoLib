# =============================================================
# Script de remplacement automatique de NextAuth par Clerk
# =============================================================

Write-Host "🔐 Remplacement des appels NextAuth par Clerk" -ForegroundColor Cyan

# 1. Sauvegarde globale
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "migration-backup-$timestamp"
New-Item -ItemType Directory -Path $backupDir -ErrorAction SilentlyContinue | Out-Null
Write-Host "✅ Sauvegarde des fichiers dans $backupDir" -ForegroundColor Green

# 2. Liste des dossiers à ignorer
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

# 3. Récupération des fichiers source
Write-Host "📝 Recherche des fichiers source..." -ForegroundColor Cyan
$sourceFiles = Get-ChildItem -Path . -Recurse -File -Include *.ts,*.tsx,*.js,*.jsx -ErrorAction SilentlyContinue |
    Where-Object { -not (ShouldExclude -Path $_.FullName) }

Write-Host "   $($sourceFiles.Count) fichiers trouvés." -ForegroundColor Gray

# 4. Fonction de remplacement sécurisé
function Replace-InFile {
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
                # Ajout d'un commentaire de migration en tête
                $header = "// CLERK-MIGRATION: $Description`n"
                Set-Content -Path $FilePath -Value ($header + $newContent) -Encoding UTF8
                Write-Host "   ✔ $FilePath - $Description" -ForegroundColor Green
                return $true
            }
        }
    } catch {
        Write-Host "   ⚠️ Impossible de traiter $FilePath" -ForegroundColor Yellow
    }
    return $false
}

# 5. Remplacements
Write-Host "🔄 Application des remplacements..." -ForegroundColor Cyan

foreach ($file in $sourceFiles) {
    $path = $file.FullName

    # --- Imports et appels useSession ---
    # Remplacer l'import de useSession
    Replace-InFile -FilePath $path -Pattern 'import\s*\{[^}]*useSession[^}]*\}\s*from\s*["'']next-auth/react["'']' `
        -Replacement "import { useUser } from '@clerk/nextjs'" `
        -Description "Remplacement import useSession"

    # Remplacer useSession() par useUser()
    Replace-InFile -FilePath $path -Pattern 'useSession\s*\(\)' `
        -Replacement "useUser()" `
        -Description "Remplacement useSession() -> useUser()"

    # Remplacer const { data: session } = useSession() par const { user } = useUser()
    Replace-InFile -FilePath $path -Pattern 'const\s*\{\s*data\s*:\s*session\s*\}\s*=\s*useSession\s*\(\)' `
        -Replacement "const { user } = useUser()" `
        -Description "Remplacement const { data: session } = useSession() -> const { user } = useUser()"

    # --- Imports et appels getServerSession ---
    # Remplacer l'import de getServerSession
    Replace-InFile -FilePath $path -Pattern 'import\s*\{[^}]*getServerSession[^}]*\}\s*from\s*["'']next-auth["'']' `
        -Replacement "import { auth } from '@clerk/nextjs/server'" `
        -Description "Remplacement import getServerSession"

    # Remplacer getServerSession(...) par auth()
    Replace-InFile -FilePath $path -Pattern 'getServerSession\s*\([^)]*\)' `
        -Replacement "auth()" `
        -Description "Remplacement getServerSession() -> auth()"

    # Remplacer const session = await getServerSession(...) par const { userId } = await auth()
    Replace-InFile -FilePath $path -Pattern 'const\s+session\s*=\s*await\s+getServerSession\s*\([^)]*\)' `
        -Replacement "const { userId } = await auth()" `
        -Description "Remplacement const session = await getServerSession() -> const { userId } = await auth()"

    # Remplacer session.user par user (attention, peut être trop large)
    Replace-InFile -FilePath $path -Pattern 'session\.user' `
        -Replacement "user" `
        -Description "Remplacement session.user -> user (vérifier)"

    # --- Imports et appels signIn / signOut ---
    # Remplacer l'import de signIn
    Replace-InFile -FilePath $path -Pattern 'import\s*\{[^}]*signIn[^}]*\}\s*from\s*["'']next-auth/react["'']' `
        -Replacement "import { useSignIn } from '@clerk/nextjs'" `
        -Description "Remplacement import signIn -> useSignIn"

    # Remplacer l'import de signOut
    Replace-InFile -FilePath $path -Pattern 'import\s*\{[^}]*signOut[^}]*\}\s*from\s*["'']next-auth/react["'']' `
        -Replacement "import { useSignOut } from '@clerk/nextjs'" `
        -Description "Remplacement import signOut -> useSignOut"

    # Remplacer signIn() par useSignIn().signIn() (approximatif)
    Replace-InFile -FilePath $path -Pattern 'signIn\s*\([^)]*\)' `
        -Replacement "useSignIn().signIn()" `
        -Description "Remplacement signIn() -> useSignIn().signIn() (à adapter)"

    # Remplacer signOut() par useSignOut().signOut()
    Replace-InFile -FilePath $path -Pattern 'signOut\s*\([^)]*\)' `
        -Replacement "useSignOut().signOut()" `
        -Description "Remplacement signOut() -> useSignOut().signOut() (à adapter)"
}

# 6. Suppression des fichiers obsolètes
Write-Host "🗑️ Suppression des fichiers NextAuth obsolètes..." -ForegroundColor Cyan
$obsoleteFiles = @(
    "src/types/next-auth.d.ts",
    "src/lib/auth/nextauth-token.ts",
    "src/app/api/auth/[...nextauth]/route.ts"
)
foreach ($file in $obsoleteFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "   ✔ $file supprimé" -ForegroundColor Green
    } else {
        Write-Host "   ℹ️ $file introuvable" -ForegroundColor Gray
    }
}

# 7. Nettoyage des imports en double (optionnel : on peut utiliser un outil externe, mais on laisse l'utilisateur vérifier)
Write-Host ""
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "✅ Remplacements terminés." -ForegroundColor Green
Write-Host ""
Write-Host "📌 VÉRIFICATIONS MANUELLES OBLIGATOIRES :" -ForegroundColor White
Write-Host "1. Recherche 'CLERK-MIGRATION' dans les fichiers modifiés pour vérifier les changements." -ForegroundColor Yellow
Write-Host "2. Adapte manuellement les appels à signIn/signOut (Clerk utilise useSignIn().signIn() et useSignOut().signOut())." -ForegroundColor Gray
Write-Host "3. Vérifie les accès aux données utilisateur : 'session.user.email' devient 'user?.emailAddresses[0]?.emailAddress'." -ForegroundColor Gray
Write-Host "4. Supprime les fichiers de configuration NextAuth restants (ex: authOptions, etc.)." -ForegroundColor Gray
Write-Host "5. Lance ton application et teste les routes protégées." -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan