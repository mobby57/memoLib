# Configuration 3 Environnements - Development, Staging, Production

**Date:** 21 janvier 2026  
**Projet:** iapostemanage  
**Objectif:** Setup complet des 3 environnements sur Vercel

---

## 🎯 Architecture des 3 Environnements

```
┌─────────────────────────────────────────────────────────────┐
│                     GIT BRANCHES                            │
├─────────────────────────────────────────────────────────────┤
│ develop      →  Development   (tests, features)             │
│ staging      →  Staging       (pre-production)              │
│ main         →  Production    (live)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 ENVIRONNEMENT 1: DEVELOPMENT

### URLs & Domaines
```
GitHub Branch: develop
Vercel URL: https://iapostemanage-dev.vercel.app
NEXTAUTH_URL: https://iapostemanage-dev.vercel.app
```

### Database (SQLite local pour dev)
```
DATABASE_URL: file:./prisma/dev.db
(ou PostgreSQL développement si distant)
```

### Configuration Complète - DEVELOPMENT

```bash
# Essentielles
vercel env add DATABASE_URL development
vercel env add NEXTAUTH_SECRET development
vercel env add NEXTAUTH_URL development

# Ollama
vercel env add OLLAMA_BASE_URL development
vercel env add OLLAMA_MODEL development

# Gmail (dev)
vercel env add GMAIL_CLIENT_ID development
vercel env add GMAIL_CLIENT_SECRET development
vercel env add GMAIL_REDIRECT_URI development
# Valeur: https://iapostemanage-dev.vercel.app/api/auth/callback/google

# GitHub App
vercel env add GITHUB_APP_ID development
vercel env add GITHUB_APP_PRIVATE_KEY_PATH development
vercel env add GITHUB_WEBHOOK_SECRET development
vercel env add GITHUB_REPOSITORY development
vercel env add GITHUB_BRANCH_MAIN development

# GitHub OAuth (dev)
vercel env add GITHUB_CLIENT_ID development
vercel env add GITHUB_CLIENT_SECRET development
vercel env add GITHUB_CALLBACK_URL development
# Valeur: https://iapostemanage-dev.vercel.app/api/auth/callback/github

# Webhooks (dev)
vercel env add PUBLIC_WEBHOOK_URL development
vercel env add WEBHOOK_GITHUB_ENABLED development
vercel env add WEBHOOK_GITHUB_EVENTS development
vercel env add WEBHOOK_GITHUB_VERIFY_SSL development

# Stripe (test keys)
vercel env add STRIPE_SECRET_KEY development
vercel env add STRIPE_PUBLISHABLE_KEY development
vercel env add STRIPE_WEBHOOK_SECRET development
vercel env add STRIPE_PRICE_SOLO_MONTHLY development
vercel env add STRIPE_PRICE_SOLO_YEARLY development
vercel env add STRIPE_PRICE_CABINET_MONTHLY development
vercel env add STRIPE_PRICE_CABINET_YEARLY development
vercel env add STRIPE_PRICE_ENTERPRISE_MONTHLY development
vercel env add STRIPE_PRICE_ENTERPRISE_YEARLY development

# Légifrance PISTE (sandbox)
vercel env add PISTE_SANDBOX_CLIENT_ID development
vercel env add PISTE_SANDBOX_CLIENT_SECRET development
vercel env add PISTE_SANDBOX_OAUTH_URL development
vercel env add PISTE_SANDBOX_API_URL development
vercel env add PISTE_PROD_CLIENT_ID development
vercel env add PISTE_PROD_CLIENT_SECRET development
vercel env add PISTE_PROD_OAUTH_URL development
vercel env add PISTE_PROD_API_URL development
vercel env add PISTE_ENVIRONMENT development
# Valeur PISTE_ENVIRONMENT: sandbox (pour dev)
```

---

## 📋 ENVIRONNEMENT 2: STAGING

### URLs & Domaines
```
GitHub Branch: staging
Vercel URL: https://iapostemanage-staging.vercel.app
NEXTAUTH_URL: https://iapostemanage-staging.vercel.app
```

### Database (PostgreSQL staging - données similaires à prod)
```
DATABASE_URL: postgresql://user:pass@host-staging/iapostemanage
```

### Configuration Complète - STAGING

```bash
# Essentielles
vercel env add DATABASE_URL staging
vercel env add NEXTAUTH_SECRET staging
vercel env add NEXTAUTH_URL staging

# Ollama
vercel env add OLLAMA_BASE_URL staging
vercel env add OLLAMA_MODEL staging

# Gmail (staging)
vercel env add GMAIL_CLIENT_ID staging
vercel env add GMAIL_CLIENT_SECRET staging
vercel env add GMAIL_REDIRECT_URI staging
# Valeur: https://iapostemanage-staging.vercel.app/api/auth/callback/google

# GitHub App
vercel env add GITHUB_APP_ID staging
vercel env add GITHUB_APP_PRIVATE_KEY_PATH staging
vercel env add GITHUB_WEBHOOK_SECRET staging
vercel env add GITHUB_REPOSITORY staging
vercel env add GITHUB_BRANCH_MAIN staging

# GitHub OAuth (staging)
vercel env add GITHUB_CLIENT_ID staging
vercel env add GITHUB_CLIENT_SECRET staging
vercel env add GITHUB_CALLBACK_URL staging
# Valeur: https://iapostemanage-staging.vercel.app/api/auth/callback/github

# Webhooks (staging)
vercel env add PUBLIC_WEBHOOK_URL staging
vercel env add WEBHOOK_GITHUB_ENABLED staging
vercel env add WEBHOOK_GITHUB_EVENTS staging
vercel env add WEBHOOK_GITHUB_VERIFY_SSL staging

# Stripe (test keys - mêmes que dev ou séparées)
vercel env add STRIPE_SECRET_KEY staging
vercel env add STRIPE_PUBLISHABLE_KEY staging
vercel env add STRIPE_WEBHOOK_SECRET staging
vercel env add STRIPE_PRICE_SOLO_MONTHLY staging
vercel env add STRIPE_PRICE_SOLO_YEARLY staging
vercel env add STRIPE_PRICE_CABINET_MONTHLY staging
vercel env add STRIPE_PRICE_CABINET_YEARLY staging
vercel env add STRIPE_PRICE_ENTERPRISE_MONTHLY staging
vercel env add STRIPE_PRICE_ENTERPRISE_YEARLY staging

# Légifrance PISTE (sandbox pour staging - ou prod pour tester)
vercel env add PISTE_SANDBOX_CLIENT_ID staging
vercel env add PISTE_SANDBOX_CLIENT_SECRET staging
vercel env add PISTE_SANDBOX_OAUTH_URL staging
vercel env add PISTE_SANDBOX_API_URL staging
vercel env add PISTE_PROD_CLIENT_ID staging
vercel env add PISTE_PROD_CLIENT_SECRET staging
vercel env add PISTE_PROD_OAUTH_URL staging
vercel env add PISTE_PROD_API_URL staging
vercel env add PISTE_ENVIRONMENT staging
# Valeur PISTE_ENVIRONMENT: sandbox (recommandé pour staging)
```

---

## 📋 ENVIRONNEMENT 3: PRODUCTION

### URLs & Domaines
```
GitHub Branch: main
Vercel URL: https://iapostemanage.vercel.app
Custom Domain: https://app.iapostemanage.com (optionnel)
NEXTAUTH_URL: https://iapostemanage.vercel.app (ou custom domain)
```

### Database (PostgreSQL production - données réelles)
```
DATABASE_URL: postgresql://user:pass@host-prod/iapostemanage
```

### Configuration Complète - PRODUCTION

```bash
# Essentielles
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production

# Ollama
vercel env add OLLAMA_BASE_URL production
vercel env add OLLAMA_MODEL production

# Gmail (prod)
vercel env add GMAIL_CLIENT_ID production
vercel env add GMAIL_CLIENT_SECRET production
vercel env add GMAIL_REDIRECT_URI production
# Valeur: https://iapostemanage.vercel.app/api/auth/callback/google
# OU: https://app.iapostemanage.com/api/auth/callback/google (custom domain)

# GitHub App
vercel env add GITHUB_APP_ID production
vercel env add GITHUB_APP_PRIVATE_KEY_PATH production
vercel env add GITHUB_WEBHOOK_SECRET production
vercel env add GITHUB_REPOSITORY production
vercel env add GITHUB_BRANCH_MAIN production

# GitHub OAuth (prod)
vercel env add GITHUB_CLIENT_ID production
vercel env add GITHUB_CLIENT_SECRET production
vercel env add GITHUB_CALLBACK_URL production
# Valeur: https://iapostemanage.vercel.app/api/auth/callback/github
# OU: https://app.iapostemanage.com/api/auth/callback/github (custom domain)

# Webhooks (prod)
vercel env add PUBLIC_WEBHOOK_URL production
vercel env add WEBHOOK_GITHUB_ENABLED production
vercel env add WEBHOOK_GITHUB_EVENTS production
vercel env add WEBHOOK_GITHUB_VERIFY_SSL production

# Stripe (live keys - ATTENTION!)
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_PUBLISHABLE_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add STRIPE_PRICE_SOLO_MONTHLY production
vercel env add STRIPE_PRICE_SOLO_YEARLY production
vercel env add STRIPE_PRICE_CABINET_MONTHLY production
vercel env add STRIPE_PRICE_CABINET_YEARLY production
vercel env add STRIPE_PRICE_ENTERPRISE_MONTHLY production
vercel env add STRIPE_PRICE_ENTERPRISE_YEARLY production

# Légifrance PISTE (production)
vercel env add PISTE_SANDBOX_CLIENT_ID production
vercel env add PISTE_SANDBOX_CLIENT_SECRET production
vercel env add PISTE_SANDBOX_OAUTH_URL production
vercel env add PISTE_SANDBOX_API_URL production
vercel env add PISTE_PROD_CLIENT_ID production
vercel env add PISTE_PROD_CLIENT_SECRET production
vercel env add PISTE_PROD_OAUTH_URL production
vercel env add PISTE_PROD_API_URL production
vercel env add PISTE_ENVIRONMENT production
# Valeur PISTE_ENVIRONMENT: production (pour la vraie API)
```

---

## 🔄 Git Workflow (Branches → Environnements)

### Branch Mapping
```
develop  ──Merge→ staging ──Merge→ main
   ↓                  ↓              ↓
 DEV            STAGING        PRODUCTION
Auto-deploy    Manual-deploy  Auto-deploy
```

### Configuration Vercel (automatique)
1. **develop** → Déploie sur environnement `development`
2. **staging** → Déploie sur environnement `staging`
3. **main** → Déploie sur environnement `production`

---

## ✅ Configuration Git dans Vercel

### Fichier `vercel.json` (optionnel - pour contrôle avancé)

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "env": {
    "development": {
      "DATABASE_URL": "@database_url_dev",
      "NEXTAUTH_URL": "https://iapostemanage-dev.vercel.app"
    },
    "staging": {
      "DATABASE_URL": "@database_url_staging",
      "NEXTAUTH_URL": "https://iapostemanage-staging.vercel.app"
    },
    "production": {
      "DATABASE_URL": "@database_url_prod",
      "NEXTAUTH_URL": "https://iapostemanage.vercel.app"
    }
  }
}
```

---

## 📊 Tableau Comparatif

| Aspect | Development | Staging | Production |
|--------|-------------|---------|------------|
| **GitHub Branch** | develop | staging | main |
| **Vercel URL** | -dev.vercel.app | -staging.vercel.app | .vercel.app |
| **Database** | SQLite local/dev | PostgreSQL staging | PostgreSQL prod |
| **Stripe Keys** | Test (sk_test_) | Test | Live (sk_live_) |
| **PISTE API** | Sandbox | Sandbox/Prod | Production |
| **Ollama** | http://localhost:11434 | Endpoint distant (opt) | Endpoint distant (opt) |
| **Déploiement** | Automatique | Manuel recommandé | Automatique |
| **Data** | Test/Fake | Similaire à prod | RÉELLES ⚠️ |
| **Access** | Équipe complète | QA/Product | Restreint |

---

## 🚀 Checklist de Déploiement

### Phase 1: Configurer Git (local)
```bash
# Créer les branches
git checkout -b develop
git push -u origin develop

git checkout -b staging
git push -u origin staging

git checkout main
# main existe déjà
```

### Phase 2: Connecter à Vercel
1. Dans Vercel Dashboard:
   - Project → Settings → Git
   - Production Branch: `main`
   - Preview Branches: `develop`, `staging`

### Phase 3: Ajouter les Variables d'Environnement
- Remplir les 3 ensembles (development, staging, production)
- Utiliser les commandes `vercel env add` ci-dessus
- Tester avec `vercel env list development`, etc.

### Phase 4: Vérifier les Déploiements
```bash
# Voir tous les environnements et déploiements
vercel list --prod
vercel list --no-limit
```

---

## 🔐 Bonnes Pratiques Sécurité

### ✅ À FAIRE
- [ ] Utiliser des secrets chiffrés dans Vercel
- [ ] STRIPE_SECRET_KEY jamais dans Git
- [ ] GITHUB_APP_PRIVATE_KEY jamais dans Git
- [ ] DATABASE_URL jamais en clair
- [ ] PISTE credentials jamais en clair
- [ ] Rotation des secrets régulièrement
- [ ] Audit logs pour production

### ❌ À ÉVITER
- ❌ Hardcoder les secrets dans le code
- ❌ Pousser .env.local sur Git (même le .example)
- ❌ Réutiliser les mêmes clés entre envs
- ❌ Stocker les clés dans des fichiers texte

---

## 📝 Commandes Utiles

```bash
# Lister les envs
vercel env list development
vercel env list staging
vercel env list production

# Lister les secrets (masqués)
vercel env list --sensitive

# Pull les vars localement
vercel env pull .env.local --environment development
vercel env pull .env.staging --environment staging
vercel env pull .env.production --environment production

# Supprimer une var (si erreur)
vercel env rm NOM_VAR development

# Voir les déploiements par env
vercel deploy --prod (production)
vercel deploy (preview/staging)
```

---

## 📌 Notes Importantes

1. **DOTENV_KEY** → Déjà configuré pour production ✅
2. **NEXTAUTH_SECRET** → Doit être différent par env (sécurité)
3. **DATABASE_URL** → Pointent vers des BD différentes (isolation)
4. **STRIPE_SECRET_KEY** → Test pour dev/staging, Live pour prod
5. **PISTE_ENVIRONMENT** → sandbox pour dev/staging, production pour prod
6. **Custom Domain** → À configurer après déploiement prod

---

**Prêt à déployer sur les 3 environnements!** 🚀

