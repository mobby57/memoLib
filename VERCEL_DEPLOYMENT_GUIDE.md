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
# NextAuth
NEXTAUTH_SECRET=li+95I281EhJlwgImcfdszt79uTItIipFuZ23gQrbYs=
NEXTAUTH_URL=https://memolib.vercel.app

# Sentry
SENTRY_DSN=votre-sentry-dsn
SENTRY_RELEASE=1.0.0

# GitHub App (MemoLib Guardian)
GITHUB_APP_ID=2782101
GITHUB_APP_CLIENT_ID=Iv23li1esofvkxLzxiD1
GITHUB_APP_CLIENT_SECRET=<your-github-app-client-secret>
GITHUB_APP_PRIVATE_KEY=<PASTE_MULTILINE_PEM_PRIVATE_KEY>
GITHUB_WEBHOOK_SECRET=<your-webhook-secret>

# Base
SECRET_KEY=<generate-a-strong-secret>
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
NEXTAUTH_URL = https://memolib.vercel.app (remplacer par votre URL)
DATABASE_URL = postgresql://user:pass@your-db.com:5432/memolib
SECRET_KEY = <generate-a-strong-secret>
```

**GitHub App (MemoLib Guardian) - NOUVEAU:**

```
GITHUB_APP_ID = 2782101
GITHUB_APP_CLIENT_ID = Iv23li1esofvkxLzxiD1
GITHUB_APP_CLIENT_SECRET = <your-github-app-client-secret>
GITHUB_APP_PRIVATE_KEY = <PASTE_MULTILINE_PEM_PRIVATE_KEY>
GITHUB_WEBHOOK_SECRET = <your-webhook-secret>
```

**Sentry (Monitoring) - Optionnel:**

```
SENTRY_DSN = votre-sentry-dsn
SENTRY_RELEASE = 1.0.0
SENTRY_ENVIRONMENT = production
```

### 4️⃣ Lancer le Déploiement

- Cliquez **Deploy**
- Attendez 3-5 minutes (First build plus long)
- Vérifiez les logs (onglet Deployments)

### 5️⃣ Post-Déploiement

**Vérifier l'URL:**

- Visitez: https://memolib.vercel.app
- Vérifiez homepage CESEDA
- Vérifiez page /ceseda
- Vérifiez GitHub App OAuth: https://memolib.vercel.app/api/auth/signin (bouton "GitHub")
- Testez webhook GitHub: Créez une issue dans le repo → Vérifiez logs Vercel

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

## 🤖 Déploiement Automatique avec GitHub Actions

Un workflow GitHub Actions est maintenant configuré pour déployer automatiquement sur Vercel à chaque push sur `main` ou `production`.

**Secrets GitHub requis:**

```bash
VERCEL_TOKEN=     # Token d'authentification Vercel
VERCEL_ORG_ID=    # Org ID de votre compte Vercel
VERCEL_PROJECT_ID= # Project ID du projet memolib
```

**Obtenez les tokens:**

1. Allez sur https://vercel.com/account/tokens
2. Créez un nouveau token: `Vercel Deploy Token`
3. Copiez le token
4. GitHub Settings → Secrets → Actions → `New repository secret`
5. Ajoutez: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

**Flux automatique:**

```
Git push origin main
         ↓
GitHub Actions trigger (deploy-vercel.yml)
         ↓
Vercel CLI login avec VERCEL_TOKEN
         ↓
vercel deploy --prod
         ↓
URL en production en 3-5 min
         ↓
Health check automatique
         ↓
Slack notification (optionnel)
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
