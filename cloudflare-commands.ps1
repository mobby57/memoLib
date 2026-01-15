# 🚀 COMMANDES CLOUDFLARE ESSENTIELLES - IA POSTE MANAGER
# Guide rapide pour déploiement Next.js + D1

Write-Host "`n=== COMMANDES CLOUDFLARE WRANGLER ===" -ForegroundColor Cyan

# ============================================
# 1️⃣ VÉRIFICATION COMPTE & AUTHENTIFICATION
# ============================================

Write-Host "`n1️⃣ Vérification Compte & Auth" -ForegroundColor Yellow

# Vérifier qui est connecté
Write-Host "`n  npx wrangler whoami" -ForegroundColor White
Write-Host "  → Affiche votre compte Cloudflare connecté" -ForegroundColor Gray

# Se connecter (si pas déjà fait)
Write-Host "`n  npx wrangler login" -ForegroundColor White
Write-Host "  → Ouvre navigateur pour OAuth Cloudflare" -ForegroundColor Gray

# ============================================
# 2️⃣ GESTION D1 DATABASE (Déjà configurée ✅)
# ============================================

Write-Host "`n2️⃣ Gestion D1 Database" -ForegroundColor Yellow

# Lister vos databases D1
Write-Host "`n  npx wrangler d1 list" -ForegroundColor White
Write-Host "  → Voir toutes vos bases D1" -ForegroundColor Gray

# Info sur votre DB
Write-Host "`n  npx wrangler d1 info iaposte-production-db" -ForegroundColor White
Write-Host "  → Taille, état, statistiques de votre DB" -ForegroundColor Gray

# Exécuter une requête SQL
Write-Host "`n  npx wrangler d1 execute iaposte-production-db --remote --command 'SELECT COUNT(*) FROM User'" -ForegroundColor White
Write-Host "  → Requête SQL sur DB production" -ForegroundColor Gray

# Exporter la DB
Write-Host "`n  npx wrangler d1 export iaposte-production-db --remote --output backup.sql" -ForegroundColor White
Write-Host "  → Backup SQL de votre DB" -ForegroundColor Gray

# Insights/Analytics
Write-Host "`n  npx wrangler d1 insights iaposte-production-db --timePeriod 7d" -ForegroundColor White
Write-Host "  → Statistiques requêtes 7 derniers jours" -ForegroundColor Gray

# ============================================
# 3️⃣ DÉPLOIEMENT CLOUDFLARE PAGES
# ============================================

Write-Host "`n3️⃣ Déploiement Cloudflare Pages" -ForegroundColor Yellow

# Build Next.js
Write-Host "`n  npm run build" -ForegroundColor White
Write-Host "  → Build production Next.js (.next/)" -ForegroundColor Gray

# Déployer sur Pages (méthode 1 - auto)
Write-Host "`n  npx wrangler pages deploy .next --project-name=iaposte-manager" -ForegroundColor White
Write-Host "  → Déploie sur *.pages.dev automatiquement" -ForegroundColor Gray

# Voir les déploiements
Write-Host "`n  npx wrangler pages deployments list --project-name=iaposte-manager" -ForegroundColor White
Write-Host "  → Historique des déploiements" -ForegroundColor Gray

# ============================================
# 4️⃣ VARIABLES D'ENVIRONNEMENT & SECRETS
# ============================================

Write-Host "`n4️⃣ Variables d'Environnement" -ForegroundColor Yellow

# Ajouter un secret
Write-Host "`n  echo 'votre-secret' | npx wrangler secret put NEXTAUTH_SECRET" -ForegroundColor White
Write-Host "  → Ajoute secret chiffré (via stdin)" -ForegroundColor Gray

# Lister les secrets (noms uniquement)
Write-Host "`n  npx wrangler secret list" -ForegroundColor White
Write-Host "  → Liste des secrets configurés" -ForegroundColor Gray

# ============================================
# 5️⃣ DÉVELOPPEMENT LOCAL
# ============================================

Write-Host "`n5️⃣ Développement Local" -ForegroundColor Yellow

# Serveur dev local
Write-Host "`n  npx wrangler pages dev .next --d1 DB=iaposte-production-db" -ForegroundColor White
Write-Host "  → Serveur local avec binding D1" -ForegroundColor Gray

# ============================================
# 6️⃣ LOGS & MONITORING
# ============================================

Write-Host "`n6️⃣ Logs & Monitoring" -ForegroundColor Yellow

# Logs en temps réel
Write-Host "`n  npx wrangler tail iaposte-manager" -ForegroundColor White
Write-Host "  → Stream logs production en live" -ForegroundColor Gray

# ============================================
# 7️⃣ DOMAINE PERSONNALISÉ
# ============================================

Write-Host "`n7️⃣ Domaine Personnalisé" -ForegroundColor Yellow

# Ajouter domaine custom
Write-Host "`n  Via Dashboard Cloudflare Pages:" -ForegroundColor White
Write-Host "  1. Pages → iaposte-manager → Custom Domains" -ForegroundColor Gray
Write-Host "  2. Ajouter votre domaine (ex: app.votredomaine.fr)" -ForegroundColor Gray
Write-Host "  3. Configurer DNS (CNAME ou Proxy)" -ForegroundColor Gray

# ============================================
# 📋 COMMANDES UTILES RAPIDES
# ============================================

Write-Host "`n📋 Commandes Rapides" -ForegroundColor Yellow

Write-Host "`n  # Check status complet" -ForegroundColor White
Write-Host "  npx wrangler whoami && npx wrangler d1 list" -ForegroundColor Cyan

Write-Host "`n  # Deploy rapide" -ForegroundColor White
Write-Host "  npm run build && npx wrangler pages deploy .next --project-name=iaposte-manager" -ForegroundColor Cyan

Write-Host "`n  # Test DB production" -ForegroundColor White
Write-Host "  npx wrangler d1 execute iaposte-production-db --remote --command 'SELECT * FROM Plan LIMIT 5'" -ForegroundColor Cyan

Write-Host "`n  # Logs production" -ForegroundColor White
Write-Host "  npx wrangler tail iaposte-manager --format=pretty" -ForegroundColor Cyan

# ============================================
# 🎯 VOTRE CONFIGURATION ACTUELLE
# ============================================

Write-Host "`n🎯 Votre Configuration" -ForegroundColor Green

Write-Host "`n  Database D1: iaposte-production-db ✅" -ForegroundColor White
Write-Host "  ID: a86c51c6-2031-4ae6-941c-db4fc917826c" -ForegroundColor Gray
Write-Host "  Region: Western Europe (WEUR)" -ForegroundColor Gray
Write-Host "  Tables: 38 | Index: 139 | Size: 954 kB" -ForegroundColor Gray

Write-Host "`n  Projet: iaposte-manager (à créer sur Pages)" -ForegroundColor White
Write-Host "  Framework: Next.js 16" -ForegroundColor Gray
Write-Host "  Build: npm run build" -ForegroundColor Gray
Write-Host "  Output: .next/" -ForegroundColor Gray

# ============================================
# 🚀 PLAN DE DÉPLOIEMENT RECOMMANDÉ
# ============================================

Write-Host "`n🚀 Plan de Déploiement" -ForegroundColor Magenta

Write-Host "`n  ÉTAPE 1: Vérifier compte" -ForegroundColor Yellow
Write-Host "  npx wrangler whoami" -ForegroundColor Cyan

Write-Host "`n  ÉTAPE 2: Créer projet Pages" -ForegroundColor Yellow
Write-Host "  Via Dashboard: Pages → Create Application → Connect Git ou Direct Upload" -ForegroundColor Gray

Write-Host "`n  ÉTAPE 3: Build Next.js" -ForegroundColor Yellow
Write-Host "  npm run build" -ForegroundColor Cyan

Write-Host "`n  ÉTAPE 4: Déployer" -ForegroundColor Yellow
Write-Host "  npx wrangler pages deploy .next --project-name=iaposte-manager" -ForegroundColor Cyan

Write-Host "`n  ÉTAPE 5: Configurer D1 binding" -ForegroundColor Yellow
Write-Host "  Dashboard → Pages → iaposte-manager → Settings → Bindings" -ForegroundColor Gray
Write-Host "  Ajouter: Variable=DB, Database=iaposte-production-db" -ForegroundColor Gray

Write-Host "`n  ÉTAPE 6: Ajouter secrets" -ForegroundColor Yellow
Write-Host "  Dashboard → Pages → iaposte-manager → Settings → Environment Variables" -ForegroundColor Gray
Write-Host "  Ajouter: NEXTAUTH_SECRET, NEXTAUTH_URL, etc." -ForegroundColor Gray

Write-Host "`n  ÉTAPE 7: Re-déployer" -ForegroundColor Yellow
Write-Host "  npx wrangler pages deploy .next --project-name=iaposte-manager" -ForegroundColor Cyan

Write-Host "`n  ÉTAPE 8: Tester" -ForegroundColor Yellow
Write-Host "  Ouvrir: https://iaposte-manager.pages.dev" -ForegroundColor Cyan

# ============================================
# 📚 DOCUMENTATION
# ============================================

Write-Host "`n📚 Documentation" -ForegroundColor Yellow

Write-Host "`n  Cloudflare Pages: https://developers.cloudflare.com/pages/" -ForegroundColor White
Write-Host "  D1 Database: https://developers.cloudflare.com/d1/" -ForegroundColor White
Write-Host "  Wrangler CLI: https://developers.cloudflare.com/workers/wrangler/" -ForegroundColor White
Write-Host "  Next.js sur Cloudflare: https://developers.cloudflare.com/pages/framework-guides/nextjs/" -ForegroundColor White

Write-Host "`n=== FIN DU GUIDE ===" -ForegroundColor Cyan

