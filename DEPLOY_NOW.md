# 🚀 Déploiement Production - Guide Rapide

## Étape 1: Vérifier que tout fonctionne

```bash
cd src/frontend
npm run lint          # ✅ OK
npx tsc --noEmit      # Vérifier types
npx playwright test   # Lancer tests E2E
```

## Étape 2: Configurer Vercel

### A. Installer Vercel CLI
```bash
npm i -g vercel
```

### B. Login
```bash
vercel login
```

### C. Lier le projet
```bash
cd src/frontend
vercel link
```

## Étape 3: Configurer les Variables d'Environnement

**Dashboard Vercel → Settings → Environment Variables**

Variables minimales requises:
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<générer avec: openssl rand -base64 32>
NEXTAUTH_URL=https://votre-domaine.vercel.app
```

## Étape 4: Déployer

```bash
cd src/frontend
vercel --prod
```

## Étape 5: Vérifier

```bash
# Attendre 30 secondes puis:
curl https://votre-url.vercel.app/api/health
```

---

## 🎉 C'est tout !

Votre application est maintenant en production sur Vercel.

**Prochaines étapes:**
1. Configurer Stripe webhooks
2. Configurer monitoring (Sentry)
3. Ajouter domaine custom (optionnel)

**URL de déploiement:** Affichée dans le terminal après `vercel --prod`
