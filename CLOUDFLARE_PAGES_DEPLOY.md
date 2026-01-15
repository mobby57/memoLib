# 🚀 Déploiement Cloudflare Pages - Guide Complet

## 🐛 Erreur Submodules Git (RÉSOLU)

### Problème Rencontré
```
Failed: error occurred while updating repository submodules
```

### Solution Appliquée
✅ Fichier `.gitmodules` vide créé pour éviter l'erreur

---

## 📋 Configuration Cloudflare Pages

### 1. Configuration Build

**Framework preset:** Next.js  
**Build command:** `npm run build`  
**Build output directory:** `.next`  
**Root directory:** `/`  
**Node.js version:** 20.x

### 2. Variables d'Environnement Requises

Copiez ces variables dans Cloudflare Pages Settings > Environment Variables :

```env
# Database
DATABASE_URL=file:./prisma/dev.db

# NextAuth
NEXTAUTH_URL=https://votre-site.pages.dev
NEXTAUTH_SECRET=Q97Ygwujvkq5DO4xFbTJsCaU6WScoArP

# Ollama (Optionnel en production)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b

# GitHub OAuth
GITHUB_CLIENT_ID=Iv23liQZx66Gmczb3xSp
GITHUB_CLIENT_SECRET=17f7a38a3832bbf5daaacf13ad5af5b07989846c
GITHUB_CALLBACK_URL=https://votre-site.pages.dev/api/auth/callback/github

# Email (Optionnel)
EMAIL_ENABLED=false
```

### 3. Build Settings (Advanced)

**Package manager:** npm  
**Install command:** `npm ci`  
**Build command:**
```bash
npm run build && npx prisma generate
```

### 4. Fonctions Serverless

Cloudflare Pages supporte les API routes Next.js automatiquement.

**Limites importantes :**
- Timeout : 30 secondes max
- Taille bundle : 25 Mo max
- SQLite : Possible avec D1 (base Cloudflare)

---

## 🔧 Migration vers Cloudflare D1 (Recommandé)

### Pourquoi D1 ?
- ✅ Base SQLite native Cloudflare
- ✅ Pas de cold start
- ✅ Réplication globale
- ✅ 100% compatible Prisma

### Configuration D1

```bash
# 1. Installer Wrangler
npm install -g wrangler

# 2. Créer base D1
wrangler d1 create iapostemanage-db

# 3. Récupérer l'ID de base (dans la sortie)
# Exemple: database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### Mise à jour Prisma pour D1

Dans `prisma/schema.prisma` :
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

Dans `.env` (local) :
```env
DATABASE_URL="file:./dev.db"
```

Dans Cloudflare Pages (production) :
```env
DATABASE_URL="cloudflare-d1://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### Migration D1

```bash
# 1. Générer migration
npx prisma migrate dev --name init

# 2. Appliquer à D1
wrangler d1 migrations apply iapostemanage-db --local
wrangler d1 migrations apply iapostemanage-db --remote
```

---

## 🌐 Configuration DNS

### Option 1 : Sous-domaine Cloudflare
Cloudflare Pages fournit : `votre-projet.pages.dev`

### Option 2 : Domaine Personnalisé

1. **Ajouter domaine dans Cloudflare Pages**
   - Settings > Custom domains
   - Add custom domain

2. **Configurer DNS (Cloudflare Dashboard)**
   ```
   Type: CNAME
   Name: iapostemanage (ou @)
   Target: votre-projet.pages.dev
   Proxy: Enabled (orange cloud)
   ```

3. **Mettre à jour .env**
   ```env
   NEXTAUTH_URL=https://iapostemanage.votredomaine.com
   GITHUB_CALLBACK_URL=https://iapostemanage.votredomaine.com/api/auth/callback/github
   ```

---

## 🔒 Sécurité Production

### Headers de Sécurité

Créer `_headers` dans `public/` :
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### Content Security Policy

Dans `next.config.js` :
```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
        }
      ]
    }
  ]
}
```

---

## 📊 Monitoring Cloudflare

### Analytics Disponibles

1. **Web Analytics**
   - Trafic en temps réel
   - Pages vues
   - Géolocalisation visiteurs

2. **Performance**
   - Core Web Vitals
   - Temps de chargement
   - Disponibilité

3. **Logs**
   - Erreurs build
   - Logs fonctions
   - Requêtes API

### Accès Logs
```bash
# Voir logs en temps réel
wrangler pages deployment tail
```

---

## 🚀 Workflow CI/CD

### Déploiement Automatique

Cloudflare Pages se connecte à GitHub automatiquement :

1. **Production** : Push sur `main` → Déploiement auto
2. **Preview** : PR → Déploiement preview avec URL unique

### Configuration Avancée

Créer `wrangler.toml` :
```toml
name = "iapostemanage"
compatibility_date = "2024-01-01"

[site]
bucket = "./.next"

[env.production]
vars = { NODE_ENV = "production" }
```

---

## 🐛 Dépannage

### Erreur : "Module not found"
**Solution :** Vérifier `package.json` dependencies

### Erreur : "Build timeout"
**Solution :** Optimiser build (next.config.js)
```javascript
module.exports = {
  output: 'standalone',
  compress: true,
  swcMinify: true
}
```

### Erreur : "Database connection failed"
**Solutions :**
1. Utiliser D1 au lieu de SQLite fichier
2. Vérifier DATABASE_URL dans variables environnement
3. S'assurer que Prisma generate est exécuté

### Erreur : "Function timeout"
**Solutions :**
1. Optimiser les requêtes Prisma
2. Utiliser pagination
3. Implémenter cache Redis (Cloudflare KV)

---

## ✅ Checklist Déploiement

- [ ] `.gitmodules` vide créé
- [ ] `npm run build` fonctionne localement
- [ ] Variables d'environnement configurées
- [ ] `NEXTAUTH_URL` pointe vers domaine production
- [ ] `GITHUB_CALLBACK_URL` mis à jour
- [ ] Base D1 créée et migrée (optionnel)
- [ ] DNS configuré (si domaine personnalisé)
- [ ] Headers sécurité configurés
- [ ] Tests de l'application en preview

---

## 🎯 Commandes Utiles

```bash
# Build local (test avant déploiement)
npm run build

# Tester production localement
npm run start

# Deploy manuel (si besoin)
npx wrangler pages deploy .next

# Voir déploiements
npx wrangler pages deployments list

# Rollback
npx wrangler pages deployments rollback <deployment-id>
```

---

## 📚 Ressources

- Documentation Cloudflare Pages : https://developers.cloudflare.com/pages
- Next.js sur Cloudflare : https://developers.cloudflare.com/pages/framework-guides/nextjs
- Cloudflare D1 : https://developers.cloudflare.com/d1
- Wrangler CLI : https://developers.cloudflare.com/workers/wrangler

---

**Créé le 7 janvier 2026**  
**Problème submodules résolu ✅**
