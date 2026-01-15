# 🚀 GUIDE DE DÉPLOIEMENT CLOUDFLARE PAGES

**Date:** 15 janvier 2026  
**Projet:** IA Poste Manager  
**Type:** Next.js + Prisma + Redis

---

## 📋 MÉTHODES DE DÉPLOIEMENT

### 🎯 Méthode 1 : GitHub (RECOMMANDÉ pour Next.js)

✅ **Avantages:**
- Déploiement automatique à chaque push
- Preview pour chaque Pull Request
- Rollback facile
- Build optimisé Next.js

**📍 Étapes:**

#### 1. Vérifier le repository GitHub

```powershell
# Vérifier l'état Git
git status

# Vérifier la branche
git branch
# Devrait être sur: multitenant-render ou main
```

#### 2. Connecter GitHub à Cloudflare

1. **Aller sur Cloudflare Dashboard**
   ```
   https://dash.cloudflare.com/
   → Workers & Pages
   → Create application
   → Pages
   → Connect to Git
   ```

2. **Autoriser GitHub**
   - Cliquer "Connect GitHub"
   - Autoriser Cloudflare Pages
   - Sélectionner le repository: `mobby57/iapostemanager`

3. **Configurer le build**
   ```
   Project name: iapostemanager
   Production branch: multitenant-render (ou main)
   
   Build settings:
   Framework preset: Next.js
   Build command: npm run build
   Build output directory: .next
   Root directory: (laissez vide)
   
   Environment variables: (voir section Variables)
   ```

#### 3. Ajouter les variables d'environnement

**Dans Cloudflare Dashboard → Settings → Environment variables:**

```env
# OBLIGATOIRES (5)
DATABASE_URL=file:./dev.db
NEXTAUTH_URL=https://iapostemanager.pages.dev
NEXTAUTH_SECRET=vquobyYX9ptr8LfgJ0fcs7HtiA7B3HrC/0ji30D39OA=
UPSTASH_REDIS_REST_URL=https://intimate-bull-28349.upstash.io
UPSTASH_REDIS_REST_TOKEN=AW69AAIncDFmZGNmMzIyNjc5NjE0ODk3OTBjODY5MmM0ZTNhNTJjYnAxMjgzNDk

# RECOMMANDÉES
REDIS_ENABLED=true
NEXT_TELEMETRY_DISABLED=1
NODE_ENV=production
```

#### 4. Déclencher le déploiement

**Option A - Push Git (automatique):**
```powershell
git add .
git commit -m "feat: configure Cloudflare Pages deployment"
git push origin multitenant-render
```

**Option B - Deploy manuel (Dashboard):**
1. Dashboard → Workers & Pages → iapostemanager
2. Deployments → Create deployment
3. Sélectionner branche
4. Cliquer "Save and Deploy"

#### 5. Suivre le déploiement

```
Dashboard → Deployments → Logs en temps réel
```

**Durée estimée:** 3-5 minutes

---

### 🎯 Méthode 2 : Wrangler CLI (Déploiement direct)

✅ **Avantages:**
- Contrôle total
- Déploiement depuis local
- Pas besoin de push Git

**📍 Étapes:**

#### 1. Installer Wrangler

```powershell
# Installation globale
npm install -g wrangler

# Vérifier installation
wrangler --version
```

#### 2. Authentifier Cloudflare

```powershell
# Login interactif
wrangler login

# Ou avec API token
wrangler config
# Entrer CLOUDFLARE_API_TOKEN
```

#### 3. Builder le projet

```powershell
# Clean et build production
npm run build

# Vérifier que .next/standalone existe
dir .next\standalone
```

#### 4. Déployer avec Wrangler

```powershell
# Déploiement production
npx wrangler pages deploy .next/standalone `
  --project-name=iapostemanager `
  --branch=multitenant-render `
  --commit-message="Manual deploy from local"

# Ou si wrangler.toml configuré
npx wrangler pages deploy
```

#### 5. Configurer les variables

```powershell
# Via script automatisé (RECOMMANDÉ)
.\configure-cloudflare-env.ps1

# Ou manuellement
wrangler pages secret put DATABASE_URL --project-name=iapostemanager
# Répéter pour chaque variable
```

---

### 🎯 Méthode 3 : Upload Direct Dashboard

⚠️ **Pour sites statiques HTML/CSS/JS uniquement**  
❌ **Ne fonctionne PAS pour Next.js** (nécessite build Node.js)

**Si vous aviez un site HTML statique:**

1. Dashboard → Create application → Pages → Upload assets
2. Drag & drop dossier avec HTML/CSS/JS
3. Nommer projet
4. Deploy

**Pour Next.js, utilisez Méthode 1 ou 2.**

---

## 🔧 CONFIGURATION AVANCÉE

### Build Settings (Next.js)

Créer `wrangler.toml` à la racine:

```toml
name = "iapostemanager"
compatibility_date = "2024-01-15"
pages_build_output_dir = ".next"

[build]
command = "npm run build"

[env.production]
vars = { NODE_ENV = "production" }
```

### Optimisations Next.js

Dans `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // ✅ Déjà configuré
  
  // Optimisations Cloudflare
  experimental: {
    serverActions: true,
  },
  
  images: {
    domains: ['iapostemanager.pages.dev'],
    unoptimized: false, // Cloudflare Images
  },
  
  // Headers sécurité
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

---

## ✅ VÉRIFICATION POST-DÉPLOIEMENT

### 1. Vérifier URL

```powershell
# Test URL principale
curl https://iapostemanager.pages.dev

# Devrait retourner HTML de la page d'accueil
```

### 2. Tester API Health

```powershell
curl https://iapostemanager.pages.dev/api/health

# Réponse attendue:
{
  "status": "ok",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2026-01-15T..."
}
```

### 3. Vérifier Logs

**Dashboard → Deployments → Logs**

✅ **Logs attendus:**
```
Building application...
Running 'npm run build'
Build completed successfully
Deploying to Cloudflare Pages...
Deployment complete
```

❌ **Erreurs courantes:**
```
Error: Missing environment variable: NEXTAUTH_SECRET
→ Solution: Ajouter dans Dashboard → Environment variables

Error: Module not found: '@prisma/client'
→ Solution: Vérifier que prisma generate s'exécute dans build

Error: Redis connection failed
→ Solution: Vérifier UPSTASH_REDIS_REST_URL et TOKEN
```

### 4. Tester Authentification

1. Ouvrir: https://iapostemanager.pages.dev
2. Cliquer "Se connecter"
3. Vérifier redirection NextAuth
4. Essayer login avec credentials

---

## 🔄 WORKFLOW AUTOMATIQUE (GitHub Actions)

### Fichier existant: `.github/workflows/cloudflare-pages.yml`

Vérifier que le workflow contient:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - multitenant-render
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Generate Prisma Client
        run: npx prisma generate
      
      - name: Build Next.js
        run: npm run build
        env:
          DATABASE_URL: "file:./dev.db"
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: iapostemanager
          directory: .next/standalone
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

### GitHub Secrets requis

**Settings → Secrets and variables → Actions:**

| Secret | Valeur | Où trouver |
|--------|--------|------------|
| `CLOUDFLARE_API_TOKEN` | Token API | Dashboard → My Profile → API Tokens → Create Token |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID | Dashboard → Workers & Pages → Account ID (droite) |
| `NEXTAUTH_SECRET` | Secret auth | .env.local |

---

## 🎯 CHECKLIST DÉPLOIEMENT

### Avant déploiement

- [ ] Code committé et pushé sur GitHub
- [ ] Variables d'environnement dans .env.local
- [ ] Build local réussi: `npm run build`
- [ ] Tests passent: `npm test`
- [ ] Prisma schema à jour: `npx prisma generate`

### Configuration Cloudflare

- [ ] Compte Cloudflare créé
- [ ] Projet Pages créé (iapostemanager)
- [ ] GitHub connecté
- [ ] 5 variables obligatoires ajoutées
- [ ] Build settings configurés (Next.js)

### GitHub (si Méthode 1)

- [ ] Repository public ou accès donné à Cloudflare
- [ ] Branch multitenant-render existe
- [ ] Workflow GitHub Actions configuré
- [ ] Secrets GitHub ajoutés (API_TOKEN, ACCOUNT_ID)

### Après déploiement

- [ ] URL accessible: https://iapostemanager.pages.dev
- [ ] Page d'accueil charge
- [ ] /api/health retourne OK
- [ ] Authentification fonctionne
- [ ] Logs sans erreurs critiques
- [ ] Redis connecté
- [ ] Database accessible

---

## 🚨 TROUBLESHOOTING

### Build échoue

**Erreur:** `npm ERR! Missing script: "build"`

**Solution:**
```powershell
# Vérifier package.json contient
{
  "scripts": {
    "build": "next build"
  }
}
```

### Déploiement échoue

**Erreur:** `Error: No such file or directory: .next/standalone`

**Solution:**
```javascript
// next.config.js
module.exports = {
  output: 'standalone', // ← Ajouter cette ligne
}
```

### Variables manquantes

**Erreur:** `Missing environment variable: XXX`

**Solution:**
1. Dashboard → Workers & Pages → iapostemanager
2. Settings → Environment variables
3. Ajouter variable manquante
4. Save and Deploy

### Redis erreur

**Erreur:** `ECONNREFUSED` ou `Redis connection failed`

**Solution:**
```env
# Vérifier format REST (pas TCP)
UPSTASH_REDIS_REST_URL=https://intimate-bull-28349.upstash.io
# PAS: redis://localhost:6379
```

---

## 📊 COMMANDES RAPIDES

```powershell
# 🔨 BUILD LOCAL
npm run build

# 🚀 DÉPLOYER (Wrangler)
npx wrangler pages deploy .next/standalone --project-name=iapostemanager

# 📋 LISTER PROJETS
npx wrangler pages project list

# 🔍 VOIR DÉPLOIEMENTS
npx wrangler pages deployment list --project-name=iapostemanager

# 🌐 OUVRIR DASHBOARD
start https://dash.cloudflare.com/

# 📊 LOGS EN TEMPS RÉEL
npx wrangler pages deployment tail

# ⚙️ CONFIGURER VARIABLES (automatique)
.\configure-cloudflare-env.ps1

# 🧪 TESTER HEALTH
curl https://iapostemanager.pages.dev/api/health
```

---

## 🎯 DÉPLOIEMENT EXPRESS (3 étapes)

### Méthode GitHub (Automatique)

```powershell
# 1. Configurer variables
.\configure-cloudflare-env.ps1

# 2. Pousser code
git add .
git commit -m "feat: deploy to Cloudflare Pages"
git push origin multitenant-render

# 3. Attendre build (3-5 min)
# Surveiller: https://github.com/mobby57/iapostemanager/actions
```

### Méthode Wrangler (Manuel)

```powershell
# 1. Login
wrangler login

# 2. Build + Deploy
npm run build
npx wrangler pages deploy .next/standalone --project-name=iapostemanager

# 3. Configurer variables
.\configure-cloudflare-env.ps1
```

---

## 🔗 LIENS UTILES

- **Dashboard Cloudflare:** https://dash.cloudflare.com/
- **Documentation Pages:** https://developers.cloudflare.com/pages/
- **GitHub Actions:** https://github.com/mobby57/iapostemanager/actions
- **Status Cloudflare:** https://www.cloudflarestatus.com/

---

## 📞 SUPPORT

**Problème de déploiement?**

1. Vérifier logs Dashboard
2. Consulter CLOUDFLARE_ENV_VARS_GUIDE.md
3. Tester build local: `npm run build`
4. Vérifier variables configurées

**Prêt à déployer!** ✅🚀

---

**Documentation créée:** 15 janvier 2026  
**Dernière mise à jour:** 15 janvier 2026
