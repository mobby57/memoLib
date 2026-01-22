# 🔴 DIAGNOSTIC - Erreur 404 Déploiement Cloudflare

## Statut
❌ Déploiement échoué - Page non trouvée (404)

## 🔍 Cause Probable

### Issue #1: Build Environment Variables (CRITIQUE)
Les variables que vous avez ajoutées au Dashboard sont **Runtime Only**. 
Cloudflare Pages a BESOIN de variables de **BUILD TIME** pour:
- ✅ Générer le Prisma client
- ✅ Compiler TypeScript
- ✅ Générer le build Next.js
- ✅ Configurer les API routes

**Solution:** Certaines variables doivent être disponibles AUSSI au build time.

### Issue #2: Configuration Git/Cloudflare
Vérifier que:
- [ ] Cloudflare Pages est connecté au bon repo GitHub
- [ ] La branche `main` est configurée
- [ ] Les déploiements automatiques sont activés

## 📋 Checklist Diagnostic

### Step 1: Vérifier les logs de déploiement Cloudflare

1. Aller à: **https://dash.cloudflare.com/**
2. Cliquer: **Pages** (menu de gauche)
3. Cliquer: **iapostemanage** (votre projet)
4. Cliquer: **Deployments** (onglet top)
5. Cliquer sur le **dernier déploiement** (top de la liste)
6. Cliquer: **Build logs** (pour voir l'erreur complète)

**Erreurs courantes attendues:**
```
Error: Build failed
- NextJS build failed
- Prisma client generation failed
- Environment variables not found
```

### Step 2: Vérifier la configuration GitHub

1. Dashboard: **Pages > iapostemanage > Settings**
2. Chercher: **Build Settings**
3. Vérifier:
   - [ ] Build command: `npm run build`
   - [ ] Build output directory: `.next` ou `out`
   - [ ] Root directory: `/` (ou vide)
   - [ ] Node version: 20 (minimum)

### Step 3: Solution Recommandée - Méthode Cloudflare

**OPTION A: Ajouter variables BUILD TIME (Recommandé)**

Certaines variables doivent être disponibles au BUILD TIME:

Dans **Cloudflare Dashboard > Pages > iapostemanage > Settings > Environment variables:**

Créer un nouvel environment: **"Staging"** avec:
```
DATABASE_URL=postgresql://...  (même valeur que Production)
NEXTAUTH_SECRET=your_secret     (même valeur que Production)
NEXTAUTH_URL=https://9fd537bc.iapostemanage.pages.dev
OLLAMA_BASE_URL=http://localhost:11434
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=IA Poste Manager
```

Puis dans **Build Settings:**
- Production environment: Production
- Preview environment: Staging
- Development environment: (laisser vide)

**OPTION B: Utiliser wrangler.json pour Build vars**

Éditer `wrangler.json`:

```json
{
  "name": "iapostemanage",
  "pages_build_output_dir": ".next",
  "compatibility_date": "2026-01-22",
  "compatibility_flags": ["nodejs_compat"],
  
  "vars": {
    "NODE_ENV": "production",
    "NEXT_PUBLIC_APP_NAME": "IA Poste Manager"
  },
  
  "env": {
    "production": {
      "name": "iapostemanage-prod",
      "routes": [
        { "pattern": "9fd537bc.iapostemanage.pages.dev", "zone_name": "iapostemanage.com" }
      ]
    }
  }
}
```

Puis faire: `git add wrangler.json && git commit -m "..."`

## 🚀 Plan d'Action Immédiat

### Phase 1: Diagnostic (5 min)
1. Ouvrir Cloudflare Dashboard
2. Aller à Pages > iapostemanage > Deployments
3. **LIRE les build logs** du dernier déploiement échoué
4. Copier-coller l'erreur exacte

### Phase 2: Correction (10-15 min)
Basé sur l'erreur lue:

Si erreur = **"Prisma client not generated":**
→ Ajouter `DATABASE_URL` en BUILD TIME (Option A ci-dessus)

Si erreur = **"Cannot find module '@prisma/client'":**
→ Installer ou générer Prisma: `npx prisma generate`

Si erreur = **"DATABASE_URL not found":**
→ Ajouter toutes les 4 variables en BUILD TIME

### Phase 3: Redéployer (5 min)
Après correction:

**Option 1: Via Cloudflare Dashboard** (plus simple)
1. Dashboard > Pages > iapostemanage > Deployments
2. Cliquer: **Retry** sur le dernier déploiement échoué
3. Attendre 2-3 minutes

**Option 2: Via Git push** (plus lent)
```bash
git commit --allow-empty -m "Redeploy via git"
git push origin main
```

## 📊 Vérification du Statut

Après redéploiement, vérifier:

✅ Dashboard > Pages > iapostemanage > Deployments
  → Statut = **Green "Success"**

✅ URL: https://9fd537bc.iapostemanage.pages.dev/login
  → Page charge sans 404

✅ Login form visible
  → Database connected ✅

## 🆘 Si Toujours en Erreur

Envoyer les infos:
1. **Build logs exacts** de Cloudflare Dashboard
2. **Erreur complète** (copier-coller)
3. **Node version** utilisée (`node --version`)
4. **Prisma version** (`npm list @prisma/client`)

## ⚡ Commandes Utiles (Local Testing)

Simuler le build Cloudflare:
```bash
# Nettoyer
rm -r .next node_modules/.prisma

# Générer Prisma
npx prisma generate

# Build Next.js (comme Cloudflare le ferait)
npm run build

# Test local
npm start
```

---

**Créé:** 22 Jan 2026
**Prochaine action:** Accéder à Cloudflare Dashboard et lire les build logs
