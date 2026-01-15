# 🆓 Script de Déploiement GRATUIT
# Vercel + Neon + Upstash

$ErrorActionPreference = "Stop"

Write-Host "`n🚀 DÉPLOIEMENT GRATUIT - IA Poste Manager" -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan

# Vérifier Node.js
Write-Host "🔍 Vérification Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js installé : $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js non installé" -ForegroundColor Red
    Write-Host "Installez-le : https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Installer Vercel CLI
Write-Host "`n📦 Installation Vercel CLI..." -ForegroundColor Yellow
try {
    vercel --version | Out-Null
    Write-Host "✅ Vercel CLI déjà installé" -ForegroundColor Green
} catch {
    npm i -g vercel
    Write-Host "✅ Vercel CLI installé" -ForegroundColor Green
}

# Connexion Vercel
Write-Host "`n🔐 Connexion à Vercel..." -ForegroundColor Yellow
Write-Host "Une page web va s'ouvrir pour vous connecter..." -ForegroundColor Cyan
vercel login

# Vérifier .env.local
Write-Host "`n🔍 Vérification des variables d'environnement..." -ForegroundColor Yellow
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  Fichier .env.local non trouvé" -ForegroundColor Yellow
    Write-Host "Créez-le avec les variables nécessaires" -ForegroundColor Yellow
} else {
    Write-Host "✅ Fichier .env.local trouvé" -ForegroundColor Green
}

# Générer Prisma Client
Write-Host "`n🔨 Génération du client Prisma..." -ForegroundColor Yellow
npx prisma generate
Write-Host "✅ Client Prisma généré" -ForegroundColor Green

# Build local (test)
Write-Host "`n🏗️  Test du build..." -ForegroundColor Yellow
$buildTest = Read-Host "Voulez-vous tester le build localement ? (y/N)"
if ($buildTest -eq 'y' -or $buildTest -eq 'Y') {
    npm run build
    Write-Host "✅ Build réussi" -ForegroundColor Green
}

# Déploiement
Write-Host "`n🚀 Déploiement sur Vercel..." -ForegroundColor Yellow
Write-Host "Cela peut prendre 2-3 minutes..." -ForegroundColor Cyan
vercel --prod

Write-Host "`n✅ Déploiement terminé !" -ForegroundColor Green

# Configuration des variables d'environnement
Write-Host "`n⚙️  Configuration des variables d'environnement" -ForegroundColor Yellow
$configEnv = Read-Host "Voulez-vous configurer les variables maintenant ? (y/N)"

if ($configEnv -eq 'y' -or $configEnv -eq 'Y') {
    Write-Host "`nAjoutez vos variables une par une :" -ForegroundColor Cyan
    Write-Host "Appuyez sur Entrée pour passer une variable`n" -ForegroundColor Yellow
    
    # DATABASE_URL
    $dbUrl = Read-Host "DATABASE_URL (Neon)"
    if ($dbUrl) {
        vercel env add DATABASE_URL production
    }
    
    # REDIS_URL
    $redisUrl = Read-Host "REDIS_URL (Upstash)"
    if ($redisUrl) {
        vercel env add REDIS_URL production
    }
    
    # NEXTAUTH_SECRET
    Write-Host "`nGénération de NEXTAUTH_SECRET..." -ForegroundColor Yellow
    $nextAuthSecret = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString()))
    Write-Host "NEXTAUTH_SECRET généré : $nextAuthSecret" -ForegroundColor Green
    vercel env add NEXTAUTH_SECRET production
    
    Write-Host "`n✅ Variables configurées" -ForegroundColor Green
    Write-Host "Redéployez pour appliquer : vercel --prod" -ForegroundColor Yellow
}

# Migrations
Write-Host "`n🔄 Migrations de la base de données" -ForegroundColor Yellow
$runMigrations = Read-Host "Voulez-vous exécuter les migrations ? (y/N)"

if ($runMigrations -eq 'y' -or $runMigrations -eq 'Y') {
    Write-Host "Exécution des migrations..." -ForegroundColor Yellow
    npx prisma migrate deploy
    Write-Host "✅ Migrations exécutées" -ForegroundColor Green
}

# Résumé
Write-Host "`n" -ForegroundColor Cyan
Write-Host "🎉 DÉPLOIEMENT TERMINÉ !" -ForegroundColor Green
Write-Host "========================`n" -ForegroundColor Green

Write-Host "📝 Prochaines étapes :" -ForegroundColor Cyan
Write-Host "  1. Vérifier l'URL de déploiement ci-dessus" -ForegroundColor White
Write-Host "  2. Configurer les variables d'environnement si pas fait" -ForegroundColor White
Write-Host "  3. Tester l'application en ligne" -ForegroundColor White
Write-Host "  4. Configurer un domaine personnalisé (optionnel)" -ForegroundColor White

Write-Host "`n📚 Ressources :" -ForegroundColor Cyan
Write-Host "  • Neon (PostgreSQL) : https://neon.tech" -ForegroundColor White
Write-Host "  • Upstash (Redis) : https://upstash.com" -ForegroundColor White
Write-Host "  • Vercel Dashboard : https://vercel.com/dashboard" -ForegroundColor White

Write-Host "`n🔧 Commandes utiles :" -ForegroundColor Cyan
Write-Host "  vercel logs          # Voir les logs" -ForegroundColor White
Write-Host "  vercel ls            # Lister les déploiements" -ForegroundColor White
Write-Host "  vercel env ls        # Lister les variables" -ForegroundColor White
Write-Host "  vercel --prod        # Redéployer" -ForegroundColor White

Write-Host "`n✨ Coût total : 0€/mois 🆓`n" -ForegroundColor Green
