# =============================================================
# Script de migration automatique vers Clerk
# =============================================================

Write-Host "🔐 Migration vers Clerk (sécurité maximale)" -ForegroundColor Cyan

# 1. Sauvegarde
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item "package.json" "package.json.backup.$timestamp" -ErrorAction SilentlyContinue
Copy-Item "package-lock.json" "package-lock.json.backup.$timestamp" -ErrorAction SilentlyContinue
Write-Host "✅ Sauvegarde effectuée (package.json.backup.$timestamp)" -ForegroundColor Green

# 2. Installation de Clerk
Write-Host "📦 Installation de @clerk/nextjs..." -ForegroundColor Cyan
npm install @clerk/nextjs

# 3. Suppression des dépendances NextAuth
Write-Host "🗑️ Suppression des dépendances NextAuth..." -ForegroundColor Cyan
npm uninstall next-auth @next-auth/prisma-adapter nodemailer

# 4. Nettoyage et réinstallation
Write-Host "🧹 Nettoyage et réinstallation..." -ForegroundColor Cyan
npm install

# 5. Audit de sécurité (devrait être à 0 maintenant)
Write-Host "🔍 Audit de sécurité (après migration)..." -ForegroundColor Cyan
npm audit --omit=dev

# 6. Création du fichier middleware.ts (si absent)
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

# 7. Création (ou mise à jour) de .env.local pour Clerk
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

# 8. Rapport des modifications à faire manuellement
Write-Host ""
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "📋 ETAPES MANUELLES A REALISER (code) :" -ForegroundColor Yellow
Write-Host "============================================================="
Write-Host ""
Write-Host "1️⃣  Ajoute <ClerkProvider> dans ton layout racine :" -ForegroundColor White
Write-Host "    src/app/layout.tsx (ou app/layout.tsx) :" -ForegroundColor White
Write-Host "    ----------------------------------------" -ForegroundColor Gray
Write-Host "    import { ClerkProvider } from '@clerk/nextjs';" -ForegroundColor Gray
Write-Host "    export default function RootLayout({ children }) {" -ForegroundColor Gray
Write-Host "      return (" -ForegroundColor Gray
Write-Host "        <ClerkProvider>" -ForegroundColor Gray
Write-Host "          <html lang='fr'><body>{children}</body></html>" -ForegroundColor Gray
Write-Host "        </ClerkProvider>" -ForegroundColor Gray
Write-Host "      );" -ForegroundColor Gray
Write-Host "    }" -ForegroundColor Gray
Write-Host ""
Write-Host "2️⃣  Supprime ton dossier d'API auth :" -ForegroundColor White
Write-Host "    rm -rf src/app/api/auth" -ForegroundColor Gray
Write-Host ""
Write-Host "3️⃣  Remplace dans tous les composants :" -ForegroundColor White
Write-Host "    - useSession()  → useUser() (de @clerk/nextjs)" -ForegroundColor Gray
Write-Host "    - getServerSession() → auth() (de @clerk/nextjs/server)" -ForegroundColor Gray
Write-Host "    - signIn() / signOut() → Clerk's useSignIn() / useSignOut()" -ForegroundColor Gray
Write-Host ""
Write-Host "4️⃣  Supprime les imports et variables inutilisées liées à PrismaAdapter / next-auth." -ForegroundColor White
Write-Host ""
Write-Host "5️⃣  Ajoute les clés Clerk dans .env.local (récupérées sur https://dashboard.clerk.com)" -ForegroundColor Yellow
Write-Host ""
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "✅ Script terminé. Relis ton code et teste les routes protégées." -ForegroundColor Green