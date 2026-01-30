# 📦 Guide des environnements — memoLib

Ce guide décrit les variables d’environnement et secrets requis pour chaque environnement (Preview, Staging, Production), ainsi que les pratiques d’approbation et de rollback.

---

## 🗺️ Principes

- Ne jamais injecter de secrets dans le build. Les variables sont fournies par l’environnement (GitHub Actions/Vercel) au runtime.
- `NEXT_PUBLIC_*` = variables visibles côté client (non sensibles).
- Secrets (BD, tokens) restent côté serveur (Actions/Runtime), jamais commités.

---

## 🔧 Variables par environnement

### Preview (PR)
- Objectif : démonstration sécurisée.
- Exemples :
  - `NEXTAUTH_URL`: URL preview (ex. https://preview.example.vercel.app)
  - `NEXTAUTH_SECRET`: secret de preview (jetable)
  - `DATABASE_URL`: instance temporaire ou mock
  - `NEXT_PUBLIC_ENABLE_AI`: `false`
  - `SENTRY_DSN`: (optionnel) désactivé par défaut

### Staging (interne)
- Objectif : validation fonctionnelle réelle.
- Exemples :
  - `NEXTAUTH_URL`: URL staging
  - `NEXTAUTH_SECRET`: secret staging
  - `DATABASE_URL`: base staging (données non sensibles)
  - `UPSTASH_REDIS_URL`: cache staging
  - `SENTRY_DSN`: monitoring limité

### Production
- Objectif : stabilité + responsabilité.
- Exemples :
  - `NEXTAUTH_URL`: URL production
  - `NEXTAUTH_SECRET`: secret prod
  - `DATABASE_URL`: base prod
  - `UPSTASH_REDIS_URL`: cache prod
  - `STRIPE_SECRET_KEY`: paiements (si activé)
  - `SENTRY_DSN`: monitoring prod

---

## 🔑 Secrets requis (GitHub Actions / Vercel)

- Déploiement Vercel : `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- Auth : `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- Base de données : `DATABASE_URL`
- Optionnels : `UPSTASH_REDIS_URL`, `SENTRY_DSN`, `STRIPE_SECRET_KEY`

---

## ✅ Approvals & rollback

- Activer les approbations pour l’environnement `production` (GitHub Environments → protection rules).
- Workflow Prod manuel : déclenché via `workflow_dispatch` (voir `.github/workflows/deploy-optimized.yml`).
- Rollback : conserver la version précédente déployable; documenter la commande de retour (ex. relancer le workflow avec le tag/version N-1).

---

## 🔍 Vérifications rapides

- Preview PR : accès authentifié, IA désactivée, données factices.
- Staging : intégrations réelles, données non sensibles, accès restreint.
- Prod : monitoring passif, audit log actif, rollback prêt.

---

Dernière mise à jour : 2026-01-30
