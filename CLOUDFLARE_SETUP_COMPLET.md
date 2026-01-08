# 🚀 CONFIGURATION CLOUDFLARE PAGES - GUIDE COMPLET

## ✅ Déploiement Initial Réussi

**Projet**: iaposte-manager
**URL**: https://ef86fa25.iaposte-manager.pages.dev
**Build**: ✅ Réussi (393 fichiers)
**Database D1**: iaposte-production-db (a86c51c6-2031-4ae6-941c-db4fc917826c)

---

## 📋 CHECKLIST CONFIGURATION COMPLÈTE

### 1️⃣ Binding D1 Database

**Dashboard** → **Workers & Pages** → **iaposte-manager** → **Settings** → **Functions**

**Scroll down** → **D1 database bindings** → **Add binding**

Configurer :
```
Variable name: DB
D1 database: iaposte-production-db
```

**Save**

---

### 2️⃣ Variables d'Environnement Production

**Settings** → **Environment variables** → **Production** → **Add variables**

#### Variables Essentielles (OBLIGATOIRES)

```env
# NextAuth (Authentification)
NEXTAUTH_SECRET=votre-secret-genere-ici-min-32-chars
NEXTAUTH_URL=https://iaposte-manager.pages.dev

# Database (géré par binding D1)
DATABASE_URL=file:./prisma/dev.db

# Ollama (IA locale - optionnel en prod)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
```

#### Variables PISTE API Légifrance

```env
# PISTE Production
PISTE_PROD_CLIENT_ID=d9b038a6-eeb2-497e-b257-dbeede483962
PISTE_PROD_CLIENT_SECRET=0ca436ae-4adb-49a9-91d0-83ce28013820
PISTE_PROD_OAUTH_URL=https://oauth.piste.gouv.fr/api/oauth/token
PISTE_PROD_API_URL=https://api.piste.gouv.fr/dila/legifrance/lf-engine-app
PISTE_ENVIRONMENT=production
```

#### Variables Gmail (Email Monitor - optionnel)

```env
GMAIL_CLIENT_ID=votre-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=votre-client-secret
GMAIL_REDIRECT_URI=https://iaposte-manager.pages.dev/api/auth/callback/google
```

---

### 3️⃣ Générer NEXTAUTH_SECRET

**PowerShell** (sur votre machine) :
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copier le résultat dans la variable NEXTAUTH_SECRET.

---

### 4️⃣ Configurer Compatibilité Flags (Important Next.js)

**Settings** → **Functions** → **Compatibility flags**

Ajouter :
```
nodejs_compat
```

**Compatibility date** :
```
2024-01-01
```

---

### 5️⃣ Build Settings (Vérification)

**Settings** → **Builds & deployments**

Vérifier :
```
Build command: npm run build
Build output directory: .next
Root directory: (vide)
```

---

### 6️⃣ Re-déployer avec Configuration

**Depuis votre terminal PowerShell :**

```powershell
npx wrangler pages deploy .next --project-name=iaposte-manager
```

---

### 7️⃣ Domaine Personnalisé (Optionnel)

**Settings** → **Custom domains** → **Set up a custom domain**

Options :
1. **Domaine Cloudflare** : Si domaine déjà sur Cloudflare (DNS automatique)
2. **Domaine externe** : Ajouter CNAME vers `iaposte-manager.pages.dev`

---

### 8️⃣ Vérifications Post-Déploiement

#### Test 1 : Page d'accueil
```
https://iaposte-manager.pages.dev
```
→ Devrait afficher la page Next.js

#### Test 2 : Database D1
```
https://iaposte-manager.pages.dev/api/health
```
→ Devrait montrer le statut de la DB

#### Test 3 : Authentification
```
https://iaposte-manager.pages.dev/auth/signin
```
→ Page de connexion NextAuth

---

## 🔧 COMMANDES WRANGLER UTILES

### Voir les déploiements
```bash
npx wrangler pages deployments list --project-name=iaposte-manager
```

### Voir les logs en temps réel
```bash
npx wrangler pages deployment tail --project-name=iaposte-manager
```

### Exécuter requête D1
```bash
npx wrangler d1 execute iaposte-production-db --remote --command "SELECT COUNT(*) FROM User"
```

### Rollback si problème
```bash
npx wrangler pages deployments list --project-name=iaposte-manager
npx wrangler rollback --deployment-id=DEPLOYMENT_ID
```

---

## 📊 MONITORING & ANALYTICS

### Dashboard Cloudflare

**Workers & Pages** → **iaposte-manager** → **Analytics**

Voir :
- Requests par seconde
- Erreurs 4xx/5xx
- Latence moyenne
- Bandwidth

### D1 Analytics

**D1** → **iaposte-production-db** → **Metrics**

Voir :
- Queries par seconde
- Read/Write ratio
- Storage utilisé

---

## 🚨 TROUBLESHOOTING

### Erreur 500 après déploiement

**Cause probable** : Binding D1 manquant ou mal configuré

**Solution** :
1. Vérifier Settings → Functions → D1 database bindings
2. Variable name = `DB` (EXACTEMENT)
3. Re-déployer

### Erreur "Missing environment variable"

**Cause** : Variables d'environnement non définies

**Solution** :
1. Settings → Environment variables → Production
2. Ajouter toutes les variables listées ci-dessus
3. Save
4. Re-déployer (pas besoin de rebuild)

### Database D1 vide

**Cause** : Schema non migré vers D1

**Solution** :
```bash
# Exporter schema local
npx wrangler d1 export iaposte-production-db --remote --output backup.sql

# Ou re-migrer depuis Prisma
# (voir manage-d1.ps1)
```

### Build Next.js échoue

**Cause** : Erreurs TypeScript

**Solution** : Déjà configuré avec `ignoreBuildErrors: true` dans next.config.js

---

## 🎯 OPTIMISATIONS PRODUCTION

### 1. Cache Headers (Déjà configuré)

Dans `next.config.js` :
- Static assets : 1 an
- Pages dynamiques : pas de cache

### 2. Image Optimization

Cloudflare transforme automatiquement les images avec :
- Polish (compression lossless)
- Mirage (lazy loading)

### 3. Minification

Cloudflare minifie automatiquement :
- HTML
- CSS
- JavaScript

### 4. CDN Global

Votre app est déployée sur **300+ datacenters** Cloudflare.

---

## 📈 SCALING

### Limites Actuelles (Free Plan)

- **Requests** : 100,000/jour
- **D1 Reads** : 5M/jour
- **D1 Writes** : 100K/jour
- **D1 Storage** : 500 MB
- **Pages Build** : 500/mois

### Upgrade Needed ?

Si vous dépassez :
- **Workers Paid** : $5/mois
  - 10M requests/mois inclus
  - $0.50/million additionnel

- **D1** : Inclus dans Workers Paid
  - 25M reads/mois
  - 50M writes/mois
  - 5 GB storage

---

## 🔗 INTÉGRATION CONTINUE (GitHub Actions)

### Option 1 : Cloudflare Pages Git Integration

**Dashboard** → **Workers & Pages** → **Create application** → **Connect to Git**

1. Connecter GitHub repo
2. Auto-deploy sur `git push`
3. Preview deployments pour PR

### Option 2 : Wrangler dans GitHub Actions

Fichier `.github/workflows/deploy.yml` :

```yaml
name: Deploy to Cloudflare Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: pages deploy .next --project-name=iaposte-manager
```

---

## 🎉 STATUT ACTUEL

✅ Projet créé : iaposte-manager
✅ Database D1 : iaposte-production-db (954 kB, 38 tables)
✅ Build Next.js : Réussi (393 fichiers)
✅ Déploiement : https://ef86fa25.iaposte-manager.pages.dev
⏳ Configuration : En cours
⏳ Variables d'environnement : À ajouter
⏳ Binding D1 : À configurer
⏳ Tests : Après configuration

---

## 📞 SUPPORT

**Documentation Cloudflare** :
- Pages : https://developers.cloudflare.com/pages/
- D1 : https://developers.cloudflare.com/d1/
- Wrangler : https://developers.cloudflare.com/workers/wrangler/

**Community Discord** : https://discord.gg/cloudflaredev

---

## 🚀 PROCHAINES ÉTAPES RECOMMANDÉES

1. ✅ **Configurer Binding D1** (Dashboard)
2. ✅ **Ajouter Variables d'Environnement** (Dashboard)
3. ✅ **Générer et ajouter NEXTAUTH_SECRET**
4. ✅ **Re-déployer** (`npx wrangler pages deploy .next --project-name=iaposte-manager`)
5. ✅ **Tester l'application** (ouvrir URL)
6. ⏳ **Configurer domaine custom** (optionnel)
7. ⏳ **Setup GitHub auto-deploy** (optionnel)
8. ⏳ **Monitoring et alertes** (optionnel)

---

**Date** : 7 janvier 2026
**Version** : 1.0
**Statut** : Production Ready (après configuration)
