# 🚀 DÉPLOIEMENT CLOUDFLARE COMPLET - IA POSTE MANAGER

**Date:** 19 janvier 2026  
**Durée:** 15-20 minutes  
**Stack:** Cloudflare Pages + D1 + Workers

---

## 🎯 ARCHITECTURE CLOUDFLARE

```
┌─────────────────────────────────────────┐
│   Cloudflare Pages (Frontend Next.js)  │
│   https://iapostemanager.pages.dev     │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   Cloudflare D1 (Base de données SQL)  │
│   Production + Preview databases       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   Cloudflare Workers (API Backend)     │
│   Serverless functions                 │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   Cloudflare KV (Cache & Sessions)     │
│   NextAuth sessions + cache            │
└─────────────────────────────────────────┘
```

---

## ✅ PRÉREQUIS

```powershell
# 1. Compte Cloudflare (gratuit)
# Créer sur: https://dash.cloudflare.com/sign-up

# 2. Installer Wrangler CLI
npm install -g wrangler

# 3. Vérifier installation
wrangler --version

# 4. Login Cloudflare
wrangler login
```

---

## 🚀 DÉPLOIEMENT EN 5 ÉTAPES

### ÉTAPE 1: Configuration Wrangler (2 min)

```powershell
# Créer wrangler.toml
.\scripts\deploy\cloudflare-setup.ps1
```

Ou manuellement :

```toml
# wrangler.toml
name = "iapostemanager"
compatibility_date = "2024-01-01"
pages_build_output_dir = ".vercel/output/static"

[env.production]
name = "iapostemanager-prod"

[env.preview]
name = "iapostemanager-preview"

# Base de données D1
[[d1_databases]]
binding = "DB"
database_name = "iapostemanager-db"
database_id = "" # Sera rempli automatiquement

# KV pour sessions
[[kv_namespaces]]
binding = "SESSIONS"
id = "" # Sera rempli automatiquement

# Variables d'environnement
[vars]
NODE_ENV = "production"
NEXT_PUBLIC_APP_URL = "https://iapostemanager.pages.dev"
```

---

### ÉTAPE 2: Créer Base de Données D1 (3 min)

```powershell
# Créer la base de données production
wrangler d1 create iapostemanager-db

# COPIER le database_id affiché et l'ajouter dans wrangler.toml

# Créer la base de données preview (dev)
wrangler d1 create iapostemanager-db-preview
```

**Sortie attendue:**
```
✅ Successfully created DB 'iapostemanager-db'
   database_id = "abcd1234-5678-90ef-ghij-klmnopqrstuv"
```

Ajouter cet ID dans `wrangler.toml` :

```toml
[[d1_databases]]
binding = "DB"
database_name = "iapostemanager-db"
database_id = "abcd1234-5678-90ef-ghij-klmnopqrstuv"  # ← ICI
```

---

### ÉTAPE 3: Migrer Prisma vers D1 (5 min)

```powershell
# Générer schéma SQL depuis Prisma
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > migrations/0001_init.sql

# Appliquer migrations à D1 production
wrangler d1 execute iapostemanager-db --file=migrations/0001_init.sql --remote

# Appliquer migrations à D1 preview
wrangler d1 execute iapostemanager-db-preview --file=migrations/0001_init.sql --remote
```

**Vérifier la migration:**
```powershell
# Tester D1
wrangler d1 execute iapostemanager-db --command="SELECT name FROM sqlite_master WHERE type='table';" --remote
```

---

### ÉTAPE 4: Build Next.js pour Cloudflare (3 min)

```powershell
# Installer adaptateur Next.js → Cloudflare
npm install @cloudflare/next-on-pages --save-dev

# Build optimisé pour Cloudflare Pages
npm run pages:build
```

**Script package.json :**
```json
{
  "scripts": {
    "pages:build": "next-on-pages --experimental-minify",
    "pages:dev": "next-on-pages --experimental-minify --watch",
    "pages:preview": "wrangler pages dev .vercel/output/static",
    "pages:deploy": "wrangler pages deploy .vercel/output/static"
  }
}
```

---

### ÉTAPE 5: Déployer sur Cloudflare Pages (2 min)

```powershell
# Première création du projet Pages
wrangler pages project create iapostemanager

# Déployer
npm run pages:deploy
```

**Sortie attendue:**
```
✨ Compiled Worker successfully
✨ Uploading...
✨ Deployment complete!
🌍 https://iapostemanager.pages.dev
```

---

## 🔐 CONFIGURATION VARIABLES D'ENVIRONNEMENT

### Via Dashboard Cloudflare

1. Aller sur : https://dash.cloudflare.com/
2. Pages → iapostemanager → Settings → Environment variables
3. Ajouter :

```env
# NextAuth
NEXTAUTH_URL=https://iapostemanager.pages.dev
NEXTAUTH_SECRET=<générer avec: openssl rand -base64 32>

# Base de données (binding automatique)
DATABASE_URL=$DB

# Ollama (optionnel - utiliser API externe en prod)
OLLAMA_BASE_URL=https://votre-ollama-api.com

# Email (optionnel)
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
```

### Via CLI (plus rapide)

```powershell
# Script automatique
.\scripts\deploy\cloudflare-env.ps1
```

Ou manuellement :

```powershell
# Production
wrangler pages secret put NEXTAUTH_SECRET
wrangler pages secret put NEXTAUTH_URL

# Preview (dev)
wrangler pages secret put NEXTAUTH_SECRET --env preview
wrangler pages secret put NEXTAUTH_URL --env preview
```

---

## 🧪 TESTER LE DÉPLOIEMENT

### Preview Local (avant déploiement)

```powershell
# Build + Preview local
npm run pages:build
npm run pages:preview

# Ouvrir http://localhost:8788
```

### Production

```powershell
# Déployer
npm run pages:deploy

# URL finale
# https://iapostemanager.pages.dev
```

---

## 🔄 DÉPLOIEMENT AUTOMATIQUE (CI/CD)

### GitHub Actions Cloudflare

Créer `.github/workflows/cloudflare-deploy.yml` :

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run pages:build
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: iapostemanager
          directory: .vercel/output/static
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

**Configuration secrets GitHub:**

1. Aller sur : Settings → Secrets → Actions
2. Ajouter :
   - `CLOUDFLARE_API_TOKEN` (depuis Cloudflare Dashboard → My Profile → API Tokens)
   - `CLOUDFLARE_ACCOUNT_ID` (depuis Cloudflare Dashboard → Workers & Pages)

---

## 📊 MONITORING & LOGS

### Voir les logs en temps réel

```powershell
# Logs production
wrangler pages deployment tail

# Logs d'une page spécifique
wrangler pages deployment tail --deployment-id=<id>
```

### Analytics Cloudflare

- Dashboard : https://dash.cloudflare.com/
- Pages → iapostemanager → Analytics
- Métriques :
  - Requests par seconde
  - Latence moyenne
  - Erreurs 4xx/5xx
  - Bandwidth utilisé

---

## 🛠️ COMMANDES UTILES

### Gestion Base de Données D1

```powershell
# Lister les bases
wrangler d1 list

# Créer backup
wrangler d1 export iapostemanager-db --output=backup.sql --remote

# Restaurer backup
wrangler d1 execute iapostemanager-db --file=backup.sql --remote

# Requête SQL directe
wrangler d1 execute iapostemanager-db --command="SELECT COUNT(*) FROM User;" --remote

# Reset complet (DANGER)
wrangler d1 execute iapostemanager-db --command="DROP TABLE IF EXISTS User;" --remote
```

### Gestion Déploiements

```powershell
# Lister déploiements
wrangler pages deployment list

# Rollback vers version précédente
wrangler pages deployment tail --deployment-id=<previous-id>

# Supprimer projet (DANGER)
wrangler pages project delete iapostemanager
```

---

## 🚨 TROUBLESHOOTING

### Erreur: "Build failed"

```powershell
# Vérifier compatibilité Next.js
npm install @cloudflare/next-on-pages@latest

# Rebuild propre
rimraf .next .vercel
npm run pages:build
```

### Erreur: "D1 binding not found"

```powershell
# Vérifier wrangler.toml
cat wrangler.toml

# Re-créer binding
wrangler pages project update iapostemanager --d1=DB:iapostemanager-db
```

### Erreur: "Environment variables missing"

```powershell
# Lister variables actuelles
wrangler pages secret list

# Re-set variables
.\scripts\deploy\cloudflare-env.ps1
```

### Performance lente

```powershell
# Activer minification
npm run pages:build -- --experimental-minify

# Activer cache KV
# Ajouter dans wrangler.toml :
[[kv_namespaces]]
binding = "CACHE"
id = "<votre-kv-id>"
```

---

## 💰 COÛTS CLOUDFLARE

### Plan Gratuit (Free Tier)

✅ **Inclus GRATUITEMENT:**
- 500 builds/mois
- 100,000 requests/jour
- Unlimited bandwidth
- D1 : 10GB storage + 5M reads/jour
- KV : 100k reads/jour
- Custom domains
- SSL automatique
- DDoS protection

### Au-delà du gratuit

- Pages: $0.50 / 1000 requests supplémentaires
- D1: $0.75 / million reads supplémentaires
- KV: $0.50 / million reads supplémentaires

**Pour 1000 utilisateurs/jour = 100% GRATUIT** ✅

---

## 🎯 CHECKLIST DÉPLOIEMENT

```
✅ Compte Cloudflare créé
✅ Wrangler CLI installé
✅ wrangler login effectué
✅ Base D1 créée (production + preview)
✅ Migrations Prisma appliquées
✅ Build Next.js réussi
✅ Variables d'environnement configurées
✅ Premier déploiement effectué
✅ Tests sur https://iapostemanager.pages.dev
✅ Custom domain configuré (optionnel)
✅ GitHub Actions configuré (optionnel)
✅ Monitoring activé
```

---

## 🔗 DOMAINE PERSONNALISÉ

### Ajouter votre domaine

```powershell
# Via CLI
wrangler pages domain add iapostemanager votre-domaine.com

# Ou via Dashboard :
# 1. Pages → iapostemanager → Custom domains
# 2. Add domain → votre-domaine.com
# 3. Suivre instructions DNS
```

### Configuration DNS

Chez votre registrar (OVH, Gandi, etc.) :

```
Type: CNAME
Name: @
Target: iapostemanager.pages.dev
```

---

## 📚 RESSOURCES

- **Dashboard:** https://dash.cloudflare.com/
- **Docs Next.js on Cloudflare:** https://developers.cloudflare.com/pages/framework-guides/nextjs/
- **Docs D1:** https://developers.cloudflare.com/d1/
- **Wrangler CLI:** https://developers.cloudflare.com/workers/wrangler/
- **Status Cloudflare:** https://www.cloudflarestatus.com/

---

## 🚀 SCRIPT AUTOMATIQUE COMPLET

```powershell
# deploy-cloudflare-complete.ps1

Write-Host "🚀 DÉPLOIEMENT CLOUDFLARE COMPLET" -ForegroundColor Cyan
Write-Host ""

# 1. Login
Write-Host "[1/6] Login Cloudflare..." -ForegroundColor Yellow
wrangler login

# 2. Créer D1
Write-Host "[2/6] Création base D1..." -ForegroundColor Yellow
wrangler d1 create iapostemanager-db

# 3. Migrations
Write-Host "[3/6] Migrations Prisma..." -ForegroundColor Yellow
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > migrations/init.sql
wrangler d1 execute iapostemanager-db --file=migrations/init.sql --remote

# 4. Build
Write-Host "[4/6] Build Next.js..." -ForegroundColor Yellow
npm run pages:build

# 5. Créer projet
Write-Host "[5/6] Création projet Pages..." -ForegroundColor Yellow
wrangler pages project create iapostemanager

# 6. Deploy
Write-Host "[6/6] Déploiement..." -ForegroundColor Yellow
npm run pages:deploy

Write-Host ""
Write-Host "✅ DÉPLOIEMENT TERMINÉ!" -ForegroundColor Green
Write-Host "🌍 URL: https://iapostemanager.pages.dev" -ForegroundColor Cyan
```

---

**Prêt à déployer !** 🎉

Exécutez simplement :

```powershell
.\deploy-cloudflare-complete.ps1
```

Ou suivez les étapes manuellement ci-dessus.

**Durée totale: 15-20 minutes** ⏱️
