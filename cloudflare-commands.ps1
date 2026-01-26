# COMMANDES CLOUDFLARE ESSENTIELLES - IA POSTE MANAGER
# Guide rapide pour deploiement Next.js + D1

Write-Output ""
Write-Output "=== COMMANDES CLOUDFLARE WRANGLER ==="

# ============================================
# 1. VERIFICATION COMPTE & AUTHENTIFICATION
# ============================================

Write-Output ""
Write-Output "[SECTION 1] Verification Compte & Auth"

# Verifier qui est connecte
Write-Output ""
Write-Output "  npx wrangler whoami"
Write-Output "  -> Affiche votre compte Cloudflare connecte"

# Se connecter (si pas deja fait)
Write-Output ""
Write-Output "  npx wrangler login"
Write-Output "  -> Ouvre navigateur pour OAuth Cloudflare"

# ============================================
# 2. GESTION D1 DATABASE
# ============================================

Write-Output ""
Write-Output "[SECTION 2] Gestion D1 Database"

# Lister vos databases D1
Write-Output ""
Write-Output "  npx wrangler d1 list"
Write-Output "  -> Voir toutes vos bases D1"

# Info sur votre DB
Write-Output ""
Write-Output "  npx wrangler d1 info iaposte-production-db"
Write-Output "  -> Taille, etat, statistiques de votre DB"

# Executer une requete SQL
Write-Output ""
Write-Output "  npx wrangler d1 execute iaposte-production-db --remote --command 'SELECT COUNT(*) FROM User'"
Write-Output "  -> Requete SQL sur DB production"

# Exporter la DB
Write-Output ""
Write-Output "  npx wrangler d1 export iaposte-production-db --remote --output backup.sql"
Write-Output "  -> Backup SQL de votre DB"

# Insights/Analytics
Write-Output ""
Write-Output "  npx wrangler d1 insights iaposte-production-db --timePeriod 7d"
Write-Output "  -> Statistiques requetes 7 derniers jours"

# ============================================
# 3. DEPLOIEMENT CLOUDFLARE PAGES
# ============================================

Write-Output ""
Write-Output "[SECTION 3] Deploiement Cloudflare Pages"

# Build avec next-on-pages
Write-Output ""
Write-Output "  npx @cloudflare/next-on-pages"
Write-Output "  -> Build Next.js pour Cloudflare"

# Deploy preview
Write-Output ""
Write-Output "  npx wrangler pages deploy .vercel/output/static --project-name=iapostemanager"
Write-Output "  -> Deployer sur Pages"

# ============================================
# 4. GESTION KV STORAGE
# ============================================

Write-Output ""
Write-Output "[SECTION 4] Gestion KV Storage"

# Lister les namespaces KV
Write-Output ""
Write-Output "  npx wrangler kv namespace list"
Write-Output "  -> Voir tous les KV namespaces"

# Lister les cles dans un namespace
Write-Output ""
Write-Output "  npx wrangler kv key list --namespace-id=<ID>"
Write-Output "  -> Voir les cles dans un namespace"

# ============================================
# 5. LOGS ET MONITORING
# ============================================

Write-Output ""
Write-Output "[SECTION 5] Logs et Monitoring"

# Voir les logs en temps reel
Write-Output ""
Write-Output "  npx wrangler pages deployment tail iapostemanager"
Write-Output "  -> Logs en temps reel"

# Dashboard
Write-Output ""
Write-Output "  Dashboard: https://dash.cloudflare.com"
Write-Output "  -> Acces au dashboard Cloudflare"

Write-Output ""
Write-Output "=== FIN DES COMMANDES ==="
Write-Output ""

