# =============================================================
# Migration vers Clerk via CLI officiel
# =============================================================

Write-Host "🔐 Migration vers Clerk (méthode CLI officielle)" -ForegroundColor Cyan

# 1. Vérifier si le CLI Clerk est installé
Write-Host "📦 Vérification du CLI Clerk..." -ForegroundColor Cyan
$clerkInstalled = Get-Command "clerk" -ErrorAction SilentlyContinue
if (-not $clerkInstalled) {
    Write-Host "⚠️ Clerk CLI non trouvé. Installation via npm..." -ForegroundColor Yellow
    npm install -g clerk
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Échec de l'installation. Essaie manuellement : npm install -g clerk" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Clerk CLI installé." -ForegroundColor Green
} else {
    Write-Host "✅ Clerk CLI déjà installé. Mise à jour..." -ForegroundColor Cyan
    clerk update --yes
}

# 2. Se connecter à Clerk (ouvre le navigateur)
Write-Host "🔑 Connexion à Clerk..." -ForegroundColor Cyan
Write-Host "👉 Un navigateur va s'ouvrir pour que tu te connectes. Après la connexion, reviens ici." -ForegroundColor Yellow
clerk auth login
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Échec de la connexion. Réessaie manuellement : clerk auth login" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Connecté à Clerk." -ForegroundColor Green

# 3. Initialiser Clerk dans le projet (avec l'app ID donné)
Write-Host "⚙️ Initialisation de Clerk dans le projet..." -ForegroundColor Cyan
# L'ID de l'application est celui fourni dans la doc : app_3IWFwQeyTJ66pJIDHztGl6UhXPz
clerk init --app app_3IWFwQeyTJ66pJIDHztGl6UhXPz
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Échec de l'initialisation. Essaie manuellement : clerk init --app app_3IWFwQeyTJ66pJIDHztGl6UhXPz" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Clerk initialisé dans le projet." -ForegroundColor Green

# 4. Vérifier la configuration
Write-Host "🔍 Vérification avec clerk doctor..." -ForegroundColor Cyan
clerk doctor
Write-Host "ℹ️ Si des erreurs sont signalées, corrige-les manuellement." -ForegroundColor Yellow

# 5. Nettoyage des dépendances NextAuth (si encore présentes)
Write-Host "🧹 Suppression des dépendances NextAuth restantes..." -ForegroundColor Cyan
npm uninstall next-auth @next-auth/prisma-adapter 2>$null

# 6. Ajout des composants d'interface (exemple)
Write-Host ""
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "✅ Migration automatique terminée." -ForegroundColor Green
Write-Host ""
Write-Host "📌 Étapes manuelles à réaliser maintenant :" -ForegroundColor White
Write-Host "1️⃣  Ajoute les clés Clerk dans .env.local (récupérées depuis le dashboard Clerk)." -ForegroundColor Yellow
Write-Host "2️⃣  Dans ton layout, remplace les importations NextAuth par ClerkProvider (déjà fait par clerk init)." -ForegroundColor Gray
Write-Host "3️⃣  Adapte tes composants :" -ForegroundColor Gray
Write-Host "    - useSession() → useUser()" -ForegroundColor Gray
Write-Host "    - getServerSession() → auth() (attention : auth est async)" -ForegroundColor Gray
Write-Host "    - session.user → user" -ForegroundColor Gray
Write-Host "4️⃣  Ajoute des boutons de connexion/déconnexion (ex: <SignInButton />, <UserButton />)." -ForegroundColor Gray
Write-Host "5️⃣  Supprime manuellement les imports et fichiers NextAuth restants (ex: src/app/api/auth)." -ForegroundColor Gray
Write-Host ""
Write-Host "👉 Après ces ajustements, lance ton app et teste le flux de connexion." -ForegroundColor Cyan
Write-Host "👉 Pour une documentation complète : https://clerk.com/docs/nextjs/getting-started/quickstart" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan