# Configuration de Protection de Branche pour IaPosteManager

## 🔒 Recommandations GitHub Branch Protection

### Configuration pour la branche `main`

Allez dans **Settings** → **Branches** → **Add branch protection rule**

#### Paramètres recommandés :

```yaml
Branch name pattern: main

✅ Require a pull request before merging
   ✅ Require approvals: 1
   ✅ Dismiss stale pull request approvals when new commits are pushed
   ✅ Require review from Code Owners

✅ Require status checks to pass before merging
   ✅ Require branches to be up to date before merging
   Status checks required:
   - "✅ PR Ready"
   - "🏗️ Build Test"
   - "📘 TypeScript Check"

✅ Require conversation resolution before merging

✅ Require signed commits (recommandé pour prod)

✅ Require linear history (optionnel)

❌ Allow force pushes (JAMAIS en prod)

❌ Allow deletions (JAMAIS en prod)
```

### Configuration pour la branche `develop`

```yaml
Branch name pattern: develop

✅ Require a pull request before merging
   ✅ Require approvals: 1

✅ Require status checks to pass before merging
   Status checks required:
   - "⚡ Quick Check"
   - "📘 TypeScript Check"

❌ Require signed commits (optionnel pour dev)

✅ Allow force pushes (avec restrictions)
   - Only administrators
```

## 📋 Règles de Nommage des Branches

```
feature/*     → Nouvelles fonctionnalités
bugfix/*      → Corrections de bugs
hotfix/*      → Corrections urgentes en production
release/*     → Préparation de release
docs/*        → Documentation uniquement
refactor/*    → Refactoring sans changement fonctionnel
```

## 🏷️ Labels Automatiques

Les PR sont automatiquement labellisées par type de changement :

| Label           | Condition                                      |
| --------------- | ---------------------------------------------- |
| `feature`       | Branche `feature/*`                            |
| `bug`           | Branche `bugfix/*` ou `hotfix/*`               |
| `documentation` | Changements dans `docs/` ou `*.md`             |
| `dependencies`  | Changements dans `package.json`                |
| `frontend`      | Changements dans `src/app/`, `src/components/` |
| `backend`       | Changements dans `src/lib/`, `prisma/`         |

## 🔐 Secrets Requis

### Obligatoires

| Secret              | Description                        |
| ------------------- | ---------------------------------- |
| `AZURE_CREDENTIALS` | Credentials Azure pour déploiement |
| `DATABASE_URL`      | URL PostgreSQL Neon                |
| `NEXTAUTH_SECRET`   | Secret NextAuth (32+ chars)        |

### Optionnels

| Secret              | Description                              |
| ------------------- | ---------------------------------------- |
| `CODECOV_TOKEN`     | Token Codecov pour couverture            |
| `SLACK_WEBHOOK_URL` | Webhook Slack pour notifications         |
| `FLY_API_TOKEN`     | Token Fly.io pour déploiement alternatif |

## 📊 Variables de Configuration

### Repository Variables

```yaml
ENABLE_NOTIFICATIONS: 'true' # Activer les notifications Slack
NODE_VERSION: '20' # Version Node.js
```

## 🚀 Workflow de Déploiement

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Feature   │────▶│   Develop   │────▶│    Main     │
│   Branch    │     │   (staging) │     │   (prod)    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
   PR Review           Auto-test           Auto-deploy
   + Tests           + Preview URL        + Azure/Fly
```

## 📝 Commits Conventionnels

Format : `<type>(<scope>): <description>`

| Type       | Description                         |
| ---------- | ----------------------------------- |
| `feat`     | Nouvelle fonctionnalité             |
| `fix`      | Correction de bug                   |
| `docs`     | Documentation                       |
| `style`    | Formatage (sans changement logique) |
| `refactor` | Refactoring                         |
| `test`     | Tests                               |
| `chore`    | Maintenance                         |

Exemples :

```
feat(dossiers): add bulk export functionality
fix(auth): resolve session timeout issue
docs(api): update rate limiting documentation
chore(deps): update prisma to 5.20
```
