# 🏗️ Schéma CI/CD Cible — memoLib

Ce document décrit le pipeline CI/CD cible, sobre et défendable, organisé en trois niveaux : Vue d’ensemble, détails par environnement, et règles d’or. Il sert de référence officielle pour l’équipe, les auditeurs et les partenaires.

---

## 1️⃣ Vue d’ensemble

```
┌──────────────┐
│   Developer  │
└──────┬───────┘
       │ git push / PR
       ▼
┌──────────────────┐
│   CI (Rapide)    │
│  tests + lint    │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│   Build Pur      │
│  (sans services) │
└──────┬───────────┘
       │
 ┌─────┴─────────┬─────────────┐
 ▼               ▼             ▼
Preview        Staging        Production
(sécurisé)     (interne)      (client)
```

Principes clés :

- Le build ne dépend jamais de l’environnement (artefact unique).
- L’environnement injecte la configuration après (variables et secrets).

---

## 2️⃣ Détail par étape

### 🧪 CI — Continuous Integration (rapide)

- Déclenchement : Push/PR.
- Contenu : Lint, tests unitaires rapides, type-check.
- Interdit : accès réseau externe, déploiement, jobs IA.
- Durée cible : < 3 minutes.

### 🏗️ Build — Artefact unique

- Objectif : produire un artefact fiable et traçable.
- Caractéristiques : build Next.js/back-end sans intégrations externes (mock only).
- Résultat : artefact versionné, `APP_VERSION=commit SHA`, hash vérifiable.
  - Un build = une vérité.

### 👀 Preview (PR / démo)

- Accès authentifié, IA désactivée, logs réduits, données factices.
- Public : équipe, client pilote, auditeur technique.
- Preview ≠ bac à sable public.

### 🧩 Staging (interne)

- Validation fonctionnelle réelle : IA activée (limitée), intégrations réelles.
- Données non sensibles, accès restreint.
- Staging = répétition générale.

### 🏛️ Production

- Stabilité + responsabilité : déploiement manuel validé, rollback immédiat, audit log, monitoring.
- Aucune surprise en prod.

---

## 3️⃣ Règles d’or memoLib

1. Zéro dépendance externe au build

   > Si Twilio, Azure ou autre tombe, le build doit quand même passer.

2. Synchronisation front/back

   > Une version = un commit = un déploiement.

3. IA jamais critique

   > Si l’IA tombe, le système continue.

4. Preview ≠ public

   > Tout accès est volontaire, identifié, révocable.

5. La CI/CD fait partie du produit
   > Une chaîne saine augmente la valorisation autant que les features.

---

## 4️⃣ Simplifications à appliquer (état actuel → cible)

Pour aligner le dépôt sur le schéma cible, réduire la complexité et le coût :

- Unifier les déploiements sur un seul provider primaire (Vercel pour prod). Supprimer ou archiver les workflows multi-cibles : `.github/workflows/deploy-multi.yml` et les scripts spécifiques Azure/Cloudflare/Fly.io si non utilisés.
- Séparer strictement CI (lint/tests/type-check) et Build (artefact). La CI ne doit ni dépendre de services externes, ni faire des déploiements.
- Réduire les scripts doublons (`build:azure`, `cf:*`, etc.) et maintenir une commande `build` unique sans variables d’environnement externes.
- Activer `concurrency` et `paths-ignore` dans CI pour éviter les exécutions inutiles (déjà présent dans `ci-optimized.yml`).
- Limiter les tests E2E aux environnements Preview/Staging, pas en CI par défaut.
- Centraliser la configuration par environnement (Preview/Staging/Prod) via secrets et variables (GitHub Environments / Vercel Env), jamais dans le build.

---

## 5️⃣ Implémentation recommandée (workflows)

- CI (rapide) : déclenchement sur push/PR, jobs `lint`, `type-check`, `test:ci`, cache Node, durée cible < 3 min.
- Build artefact : job dédié déclenché après CI succès, sans accès réseau externe, export de l’artefact.
- Preview : déploiement automatique sur PR (protégé) avec variables mock et accès authentifié.
- Staging/Prod : déploiement manuel (workflow_dispatch) avec approbation, rollback prêt.

---

## 6️⃣ Gouvernance et conformité

- Journaliser déploiements (GitHub Deployments), garder un changelog par version.
- Activer `required reviewers` et approbations manuelles pour Prod.
- Respect RGPD : secrets en vault, pas de données sensibles en Preview.
- Monitoring passif (Sentry/Logs) et alerte de rollback.

### 🔑 Secrets requis (GitHub Actions / Vercel)

- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (déploiements Vercel)
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (auth)
- `DATABASE_URL` (Prisma/PostgreSQL)
- Optionnels : `UPSTASH_REDIS_URL`, `SENTRY_DSN`, `STRIPE_SECRET_KEY`

Note : les approbations Prod se configurent via GitHub Environments (protect rules). Le workflow `Deploy Pipeline (Manual)` utilise `environment: production` pour bénéficier des protections.

### ♻️ Procédure de rollback rapide

- Via Actions (recommandé) :
   1. Ouvrir le workflow « Deploy Pipeline (Manual) ».
   2. Choisir `environment = production` et `ref = <tag ou commit SHA>` de la version précédente.
   3. Lancer le workflow (les approbations de l’environnement s’appliquent).

- Via Vercel Dashboard :
   - Promouvoir explicitement un déploiement antérieur depuis le projet (fonctionnalité de promotion) lorsqu’un artefact précédent est stable et validé.

Exemple CLI (optionnel) :

```bash
gh workflow run "Deploy Pipeline (Manual)" -f environment=production -f ref=v1.2.3
```

---

## 7️⃣ Coûts indicatifs (ordre de grandeur)

- GitHub Actions : CI rapide (<3 min/job) ≈ 150–500 minutes/mois selon cadence des PR.
- Hébergeur (Vercel) : environ 20–50€/mois pour Pro de base + surcoûts usage.
- Base de données (PostgreSQL géré) : 30–100€/mois selon volumétrie.
- Cache/queues (Redis/Upstash) : 0–20€/mois.
- Monitoring (Sentry) : 0–30€/mois.

Ces montants servent d’estimation initiale ; affiner par métriques réelles (trafic, taux de build, bande passante).

---

## 8️⃣ Roadmap de transition

1. Déprécier les workflows multi-cibles et scripts non utilisés.
2. Consolider une CI minimaliste et un build artefact unique.
3. Mettre en place Preview sécurisé, Staging interne, Prod avec approbation.
4. Documenter les variables/env par environnement et activer les audits.
5. Suivre les coûts et ajuster la capacité.

---

Dernière mise à jour : 2026-01-30
