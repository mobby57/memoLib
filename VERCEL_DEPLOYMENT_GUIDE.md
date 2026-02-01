# 🚀 Guide Complet: Déploiement MemoLib sur Vercel

**Date**: 1er février 2026
**Version**: 0.1.0
**Statut**: ✅ PRÊT POUR DÉPLOIEMENT

---

## 📋 Pré-requis

✅ Repo GitHub: mobby57/memoLib
✅ Branche main: À jour avec Phase 2 optimisations
✅ Dépendances: Toutes installées
✅ Build: Testé localement ✅
✅ Secrets: Générés ✅

---

## 🔑 Clés de Sécurité (À COPIER DANS VERCEL)

```bash
NEXTAUTH_SECRET=li+95I281EhJlwgImcfdszt79uTItIipFuZ23gQrbYs=
SECRET_KEY=225d23f8799ba86f844ab5e82c3cb351154e08b061d2c7dfcedac2b598c076ae
```

---

## 🎯 Étapes de Déploiement Vercel (5 min)

### 1️⃣ Connexion & Création Projet

- Allez sur https://vercel.com/new
- Authentifiez-vous avec GitHub
- Sélectionnez le repository: **mobby57/memoLib**
- Branche: **main**
- Cliquez **Continue**

### 2️⃣ Configuration Projet

- **Project Name**: memolib
- **Framework Preset**: Next.js (détecté automatiquement)
- **Root Directory**: ./ (racine)
- Cliquez **Continue**

### 3️⃣ Variables d'Environnement ⭐ IMPORTANT

Allez à **Environment Variables** et ajoutez :

**Obligatoires:**

```
NEXTAUTH_SECRET = li+95I281EhJlwgImcfdszt79uTItIipFuZ23gQrbYs=
NEXTAUTH_URL = https://memolib-ceseda.vercel.app (remplacer par votre URL)
DATABASE_URL = postgresql://user:pass@your-db.com:5432/memolib
SECRET_KEY = 225d23f8799ba86f844ab5e82c3cb351154e08b061d2c7dfcedac2b598c076ae
```

**Azure AD (SSO) - Optionnel en dev:**

```
AZURE_TENANT_ID = votre-tenant-id
AZURE_CLIENT_ID = votre-client-id
AZURE_CLIENT_SECRET = votre-client-secret
```

**Stripe (Facturation) - Optionnel en dev:**

```
STRIPE_SECRET_KEY = sk_test_votre-clé
STRIPE_PUBLISHABLE_KEY = pk_test_votre-clé
STRIPE_WEBHOOK_SECRET = whsec_votre-secret
```

**IA (Ollama local ou Azure OpenAI) - Optionnel:**

```
OLLAMA_BASE_URL = http://localhost:11434
OLLAMA_MODEL = llama2
```

### 4️⃣ Lancer le Déploiement

- Cliquez **Deploy**
- Attendez 3-5 minutes (First build plus long)
- Vérifiez les logs (onglet Deployments)

### 5️⃣ Post-Déploiement

**Vérifier l'URL:**

- Visitez: https://memolib-ceseda.vercel.app
- Vérifiez homepage CESEDA
- Vérifiez page /ceseda

**Headers de version:**

```bash
curl -I https://memolib-ceseda.vercel.app | grep x-app-version
curl -I https://memolib-ceseda.vercel.app | grep x-build-commit
```

---

## ⚡ Optimisations Vercel (Recommandé)

### Build Machine

- Settings → **Build & Development Settings**
- **Build Machine**: Standard (coût minimum) ou Pro si builds lentes
- **Save** ✅

### Builds Parallèles

- Settings → **Build & Development Settings**
- **Concurrent Builds**: Activé (si plan le permet)
- **Save** ✅

### Redéploiement Automatique

- Auto-enabled: GitHub push → Vercel build automatique
- Vérifiez: Deployments → Latest

---

## 🔄 Flux de Déploiement Continu

```
Git push origin main
         ↓
Vercel webhook trigger
         ↓
npm install (avec --legacy-peer-deps auto)
         ↓
npm run build (Next.js 16 Turbopack)
         ↓
Vercel deploys
         ↓
URL live en 3-5 min
```

---

## 🐛 Troubleshooting

### ❌ Erreur: "ERESOLVE could not resolve"

**Solution**: Vercel utilise automatiquement `--legacy-peer-deps`
✅ Résolu dans commit `5885e1a98` (@sentry/nextjs upgrade)

### ❌ Erreur: "DATABASE_URL missing"

**Solution**: Vérifiez Environment Variables dans Vercel
Relancez le deployment

### ❌ Erreur: "NEXTAUTH_SECRET not set"

**Solution**: Copier-coller exactement:
`li+95I281EhJlwgImcfdszt79uTItIipFuZ23gQrbYs=`

### ❌ Page blanche en production

**Solution**:

1. Vérifiez les logs (Deployments → Runtime logs)
2. Vérifiez DATABASE_URL en priorité
3. Relancez avec la bonne DATABASE_URL

---

## 📊 Statut Avant/Après Déploiement

| Étape           | Avant          | Après                     |
| --------------- | -------------- | ------------------------- |
| **Repo**        | GitHub ✅      | GitHub ✅                 |
| **Build**       | Local ✅       | Vercel ✅                 |
| **Dépendances** | Installées ✅  | Vercel install ✅         |
| **Secrets**     | .env.local ✅  | Vercel ENV ✅             |
| **URL**         | localhost:3000 | memolib-ceseda.vercel.app |
| **CI/CD**       | Manuel         | Automatique ✅            |

---

## 🎉 Prochaines Étapes Après Déploiement

1. ✅ Vérifier production URL
2. ✅ Tester features CESEDA
3. ✅ Lancer marketing campaign (voir VISION_MARKETING.md)
4. ✅ Monitorer avec Sentry (si SENTRY_DSN configuré)
5. ✅ Configurer domaine personnalisé (optionnel)

---

## 🔗 Ressources Utiles

- [DEPLOY_PRODUCTION.md](DEPLOY_PRODUCTION.md) - Guide détaillé
- [DEPLOY_SIMPLE.md](DEPLOY_SIMPLE.md) - Autres options (Railway, Azure)
- [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) - Pre-launch validation
- [VISION_MARKETING.md](VISION_MARKETING.md) - Go-to-market strategy
- [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) - Toutes les variables

---

**Statut**: 🟢 **PRÊT À DÉPLOYER**

Avez-vous besoin d'aide pour une étape spécifique?
