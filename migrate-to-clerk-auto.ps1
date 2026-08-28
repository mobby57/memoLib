# =============================================================
# Script de migration automatique NextAuth -> Clerk
# =============================================================

Write-Host "🔐 Migration vers Clerk (sécurité maximale)" -ForegroundColor Cyan

# 1. Sauvegarde de l'état actuel
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item "package.json" "package.json.backup.$timestamp" -ErrorAction SilentlyContinue
Copy-Item "package-lock.json" "package-lock.json.backup.$timestamp" -ErrorAction SilentlyContinue
Write-Host "✅ Sauvegarde effectuée (package.json.backup.$timestamp)" -ForegroundColor Green

# 2. Installation de Clerk et suppression des dépendances NextAuth
Write-Host "📦 Installation de @clerk/nextjs..." -ForegroundColor Cyan
npm install @clerk/nextjs
Write-Host "🗑️ Suppression des dépendances NextAuth..." -ForegroundColor Cyan
npm uninstall next-auth @next-auth/prisma-adapter nodemailer

# 3. Nettoyage et réinstallation
Write-Host "🧹 Nettoyage et réinstallation..." -ForegroundColor Cyan
npm install

# 4. Création du middleware
$middlewarePath = "src/middleware.ts"
if (-not (Test-Path $middlewarePath)) {
    Write-Host "📝 Création de $middlewarePath..." -ForegroundColor Cyan
    $middlewareContent = @"
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
"@
    Set-Content -Path $middlewarePath -Value $middlewareContent -Encoding UTF8
    Write-Host "✅ middleware.ts créé." -ForegroundColor Green
} else {
    Write-Host "ℹ️ middleware.ts existe déjà – vérifie qu'il utilise bien clerkMiddleware." -ForegroundColor Yellow
}

# 5. Création du fichier .env.local avec les variables (à compléter)
$envPath = ".env.local"
if (-not (Test-Path $envPath)) {
    Write-Host "📝 Création de .env.local avec les variables Clerk..." -ForegroundColor Cyan
    $envContent = @"
# Clé publique Clerk (à récupérer sur https://dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
"@
    Set-Content -Path $envPath -Value $envContent -Encoding UTF8
    Write-Host "✅ .env.local créé. **Remplace les clés par les tiennes**." -ForegroundColor Yellow
} else {
    Write-Host "ℹ️ .env.local existe – assure-toi d'y ajouter les variables Clerk." -ForegroundColor Yellow
}

# 6. Suppression du dossier api/auth
$authApiPath = "src/app/api/auth"
if (Test-Path $authApiPath) {
    Write-Host "🗑️ Suppression de l'ancienne route API auth..." -ForegroundColor Cyan
    Remove-Item -Recurse -Force $authApiPath
    Write-Host "✅ Dossier $authApiPath supprimé." -ForegroundColor Green
} else {
    Write-Host "ℹ️ Aucun dossier $authApiPath trouvé." -ForegroundColor Yellow
}

# 7. Mise à jour de layout.tsx (ajout de ClerkProvider)
$layoutPaths = @("src/app/layout.tsx", "app/layout.tsx")
$layoutFound = $false
foreach ($layoutPath in $layoutPaths) {
    if (Test-Path $layoutPath) {
        $layoutFound = $true
        Write-Host "📝 Mise à jour de $layoutPath..." -ForegroundColor Cyan
        $content = Get-Content $layoutPath -Raw -Encoding UTF8
        # Vérifier si ClerkProvider est déjà importé
        if ($content -notmatch "import.*ClerkProvider.*@clerk/nextjs") {
            # Ajouter l'import en haut
            $newContent = $content -replace '(import.*?;\s*)', "`$1`nimport { ClerkProvider } from '@clerk/nextjs';`n"
            # Entourer le contenu du retour avec <ClerkProvider>
            # On cherche le return (...) et on ajoute ClerkProvider autour du premier élément
            $newContent = $newContent -replace '(return\s*\([\s\n]*)(<.*?>)', "`${1}<ClerkProvider>`n  `${2}`n  </ClerkProvider>"
            Set-Content -Path $layoutPath -Value $newContent -Encoding UTF8
            Write-Host "✅ $layoutPath mis à jour." -ForegroundColor Green
        } else {
            Write-Host "ℹ️ ClerkProvider déjà présent dans $layoutPath." -ForegroundColor Yellow
        }
        break
    }
}
if (-not $layoutFound) {
    Write-Host "⚠️ Aucun layout.tsx trouvé. Ajoute manuellement ClerkProvider." -ForegroundColor Red
}

# 8. Remplacements automatiques dans le code source
Write-Host "🔄 Remplacement des appels NextAuth dans les fichiers source..." -ForegroundColor Cyan

# Fonction pour remplacer dans un fichier avec sauvegarde
function Replace-InFile {
    param(
        [string]$FilePath,
        [string]$Pattern,
        [string]$Replacement,
        [string]$Comment
    )
    $content = Get-Content $FilePath -Raw -Encoding UTF8
    if ($content -match $Pattern) {
        $newContent = $content -replace $Pattern, $Replacement
        # Ajouter un commentaire de migration sur les lignes modifiées (uniquement si différent)
        if ($newContent -ne $content) {
            # On ajoute un commentaire sur la ligne modifiée (pour les regex simples, on peut le faire mais complexe)
            # Ici on va ajouter un commentaire en tête du fichier pour avertir
            $newContent = "// CLERK-MIGRATION: Des remplacements automatiques ont été effectués dans ce fichier. Vérifiez les modifications.`n" + $newContent
            Set-Content -Path $FilePath -Value $newContent -Encoding UTF8
            Write-Host "   ✔ $FilePath - $Comment" -ForegroundColor Green
        }
    }
}

# Récupérer tous les fichiers source (hors node_modules, .next, etc.)
$sourceFiles = Get-ChildItem -Path . -Recurse -File -Include *.ts,*.tsx,*.js,*.jsx |
    Where-Object {
        $_.FullName -notmatch '\\(node_modules|\.next|bin|obj|tests|dist|build)\\'
    }

foreach ($file in $sourceFiles) {
    $path = $file.FullName
    # Remplacer useSession
    Replace-InFile -FilePath $path -Pattern 'import\s*\{[^}]*useSession[^}]*\}\s*from\s*["'']next-auth/react["'']' -Replacement "import { useUser } from '@clerk/nextjs'" -Comment "Remplacement import useSession"
    Replace-InFile -FilePath $path -Pattern 'useSession\s*\(\)' -Replacement "useUser()" -Comment "Remplacement useSession() -> useUser()"
    # Remplacer getServerSession
    Replace-InFile -FilePath $path -Pattern 'import\s*\{[^}]*getServerSession[^}]*\}\s*from\s*["'']next-auth/next["'']' -Replacement "import { auth } from '@clerk/nextjs/server'" -Comment "Remplacement import getServerSession"
    Replace-InFile -FilePath $path -Pattern 'getServerSession\s*\([^)]*\)' -Replacement "auth()" -Comment "Remplacement getServerSession() -> auth()"
    # Remplacer const session = await getServerSession() par const { userId } = await auth() (approximatif)
    # On cherche les patterns courants
    $content = Get-Content $path -Raw -Encoding UTF8
    if ($content -match 'const\s+session\s*=\s*await\s+getServerSession\s*\([^)]*\)') {
        $newContent = $content -replace 'const\s+session\s*=\s*await\s+getServerSession\s*\([^)]*\)', 'const { userId } = await auth()'
        Set-Content -Path $path -Value $newContent -Encoding UTF8
        Write-Host "   ✔ $path - Remplacement const session = await getServerSession()" -ForegroundColor Green
    }
}

# 9. Audit final
Write-Host "🔍 Audit de sécurité final..." -ForegroundColor Cyan
npm audit --omit=dev

# 10. Résumé et instructions
Write-Host ""
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "✅ Migration automatisée terminée." -ForegroundColor Green
Write-Host "🔎 Les remplacements ont ajouté un commentaire '// CLERK-MIGRATION' en tête des fichiers modifiés." -ForegroundColor Yellow
Write-Host ""
Write-Host "📌 VÉRIFICATIONS MANUELLES OBLIGATOIRES :" -ForegroundColor White
Write-Host "1. Remplacer 'session.user' par 'user' dans les composants (si vous utilisiez 'session')." -ForegroundColor Gray
Write-Host "2. Adapter les appels à 'auth()' qui renvoie maintenant un objet avec 'userId', pas 'session'." -ForegroundColor Gray
Write-Host "3. Vérifier que les composants comme <SignInButton>, <UserButton> fonctionnent." -ForegroundColor Gray
Write-Host "4. Mettre à jour les routes protégées en utilisant 'auth().userId'." -ForegroundColor Gray
Write-Host ""
Write-Host "👉 Après vérification, supprimez les commentaires '// CLERK-MIGRATION' si tout est bon." -ForegroundColor Yellow
Write-Host "👉 N'oubliez pas d'ajouter vos clés Clerk dans .env.local" -ForegroundColor Red
Write-Host "=============================================================" -ForegroundColor Cyan