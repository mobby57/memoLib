# 📚 Guide de Gestion Git et Commits

## 🎯 Convention de Commits (Conventional Commits)

Ce projet utilise la convention **Conventional Commits** pour maintenir un historique Git clair et générer automatiquement des changelogs.

### Format des Messages de Commit

```
<type>(<scope>): <subject>

[body optionnel]

[footer optionnel]
```

### Types de Commits

| Type | Description | Exemple |
|------|-------------|---------|
| `feat` | Nouvelle fonctionnalité | `feat(auth): add OAuth2 authentication` |
| `fix` | Correction de bug | `fix(api): resolve CORS issue` |
| `docs` | Documentation | `docs(readme): update installation guide` |
| `style` | Formatage (pas de changement fonctionnel) | `style(components): fix indentation` |
| `refactor` | Refactorisation | `refactor(utils): simplify validation logic` |
| `perf` | Amélioration de performance | `perf(api): optimize database queries` |
| `test` | Ajout ou modification de tests | `test(auth): add login unit tests` |
| `chore` | Maintenance, configuration | `chore(deps): update dependencies` |
| `ci` | CI/CD | `ci(github): add workflow for tests` |
| `build` | Build system | `build(webpack): update config` |
| `revert` | Annulation d'un commit précédent | `revert: revert commit abc123` |

### Exemples de Messages Valides

```bash
# Simple
feat(dossiers): add export to PDF functionality

# Avec scope et description détaillée
fix(extraction): resolve issue with date parsing

Fixes date extraction from documents in French format.
- Update regex pattern
- Add unit tests

Closes #123

# Breaking change
feat(api)!: change authentication endpoint

BREAKING CHANGE: /auth/login endpoint moved to /api/v2/auth/login
```

## 🔄 Workflow Git

### Structure des Branches

```
main (production)
  ↓
develop (développement)
  ↓
feature/xxx (nouvelles fonctionnalités)
fix/xxx (corrections de bugs)
hotfix/xxx (correctifs urgents)
```

### Branches Recommandées

- **main** : Code en production, stable
- **develop** : Branche de développement principal
- **feature/*** : Nouvelles fonctionnalités (`feature/auth-oauth`, `feature/pdf-export`)
- **fix/*** : Corrections de bugs (`fix/login-error`, `fix/date-parsing`)
- **hotfix/*** : Correctifs urgents en production
- **chore/*** : Maintenance (`chore/update-deps`, `chore/cleanup`)

### Workflow Standard

```bash
# 1. Créer une nouvelle branche depuis develop
git checkout develop
git pull origin develop
git checkout -b feature/nouvelle-fonctionnalite

# 2. Faire des commits
git add .
git commit -m "feat(module): add new feature"

# 3. Pousser la branche
git push origin feature/nouvelle-fonctionnalite

# 4. Créer une Pull Request vers develop
# (via GitHub/GitLab/Bitbucket interface)

# 5. Après merge, supprimer la branche
git branch -d feature/nouvelle-fonctionnalite
git push origin --delete feature/nouvelle-fonctionnalite
```

## 🛠️ Pre-commit Hooks

Les hooks automatiques s'exécutent avant chaque commit :

### Pre-commit
- ✅ Lint du code (ESLint)
- ✅ Formatage automatique (Prettier)
- ✅ Vérification des types (TypeScript)
- ✅ Tests des fichiers modifiés

### Commit-msg
- ✅ Validation du format du message de commit
- ✅ Conformité à Conventional Commits

### Pre-push
- ✅ Exécution de tous les tests
- ✅ Vérification complète des types
- ✅ Lint de tout le projet

## 📋 Commandes Utiles

### Vérifications Manuelles

```bash
# Formater le code
npm run format

# Vérifier le formatage
npm run format:check

# Linting
npm run lint
npm run lint:fix

# Tests
npm run test
npm run test:watch
npm run test:ci

# Vérification des types
npm run type-check

# Validation complète (avant push)
npm run validate
```

### Commits

```bash
# Commit standard
git commit -m "feat(auth): add two-factor authentication"

# Commit avec description détaillée
git commit

# Amender le dernier commit
git commit --amend

# Contourner les hooks (déconseillé)
git commit --no-verify -m "message"
```

### Gestion des Branches

```bash
# Lister les branches
git branch -a

# Créer une branche
git checkout -b feature/ma-fonctionnalite

# Changer de branche
git checkout develop

# Mettre à jour une branche
git pull origin develop

# Supprimer une branche locale
git branch -d feature/ma-fonctionnalite

# Supprimer une branche distante
git push origin --delete feature/ma-fonctionnalite
```

## 🚫 Fichiers Ignorés (.gitignore)

Les fichiers suivants ne doivent **jamais** être committés :

- `node_modules/` - Dépendances npm
- `.next/` - Build Next.js
- `dist/`, `out/` - Fichiers compilés
- `.env*` - Variables d'environnement (sauf `.env.example`)
- `*.log` - Fichiers de logs
- `coverage/` - Rapports de tests
- `.DS_Store` - Fichiers système macOS

## 📝 Bonnes Pratiques

### Messages de Commit

✅ **À faire :**
- Utiliser l'impératif : "add feature" et non "added feature"
- Être concis mais descriptif
- Utiliser le bon type de commit
- Référencer les issues : `Closes #123`

❌ **À éviter :**
- Messages vagues : "fix bug", "update code"
- Messages trop longs (> 100 caractères pour le subject)
- Mélanger plusieurs changements non liés

### Commits

✅ **À faire :**
- Faire des commits atomiques (un changement = un commit)
- Committer fréquemment
- Tester avant de committer
- Relire les changements avec `git diff`

❌ **À éviter :**
- Commits massifs avec 50 fichiers
- Committer du code qui ne compile pas
- Committer des fichiers de configuration locale
- Utiliser `--no-verify` sans raison valable

### Branches

✅ **À faire :**
- Noms descriptifs : `feature/pdf-export`
- Créer une branche par fonctionnalité
- Mettre à jour régulièrement depuis `develop`
- Supprimer les branches après merge

❌ **À éviter :**
- Travailler directement sur `main` ou `develop`
- Noms génériques : `test`, `temp`, `fix`
- Garder des branches abandonnées

## 🔍 Résolution de Problèmes

### Le hook pre-commit échoue

```bash
# Vérifier les erreurs
npm run lint
npm run type-check

# Corriger automatiquement
npm run lint:fix
npm run format
```

### Message de commit rejeté

```bash
# Exemple d'erreur
⧗   input: updates
✖   subject may not be empty [subject-empty]

# Solution : utiliser le bon format
git commit -m "feat(auth): add login feature"
```

### Conflit de merge

```bash
# 1. Mettre à jour la branche
git checkout develop
git pull origin develop

# 2. Retourner sur votre branche
git checkout feature/ma-fonctionnalite

# 3. Rebaser ou merger
git rebase develop
# ou
git merge develop

# 4. Résoudre les conflits dans les fichiers
# 5. Continuer le rebase
git rebase --continue
# ou terminer le merge
git commit
```

## 📊 Exemples de Workflow Complet

### Nouvelle Fonctionnalité

```bash
# 1. Créer la branche
git checkout develop
git pull origin develop
git checkout -b feature/export-pdf

# 2. Développer
# ... coder ...
git add src/components/ExportButton.tsx
git commit -m "feat(export): add PDF export button component"

# ... coder encore ...
git add src/lib/pdf-generator.ts
git commit -m "feat(export): implement PDF generation logic"

# 3. Tests
npm run test
npm run validate

# 4. Push et PR
git push origin feature/export-pdf
# Créer une Pull Request via l'interface web

# 5. Après merge
git checkout develop
git pull origin develop
git branch -d feature/export-pdf
```

### Correction de Bug

```bash
# 1. Créer la branche depuis develop
git checkout develop
git pull origin develop
git checkout -b fix/date-parsing-issue

# 2. Corriger le bug
git add src/utils/date-parser.ts
git commit -m "fix(utils): correct French date format parsing

Fixes parsing of dates in DD/MM/YYYY format.
Closes #456"

# 3. Tests spécifiques
npm run test -- date-parser.test.ts

# 4. Push et PR
git push origin fix/date-parsing-issue
```

### Hotfix en Production

```bash
# 1. Créer depuis main
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-patch

# 2. Corriger
git add src/auth/security.ts
git commit -m "fix(security)!: patch XSS vulnerability

BREAKING CHANGE: Update authentication token validation
CVE-2024-XXXXX

Closes #789"

# 3. Merge vers main ET develop
git checkout main
git merge hotfix/critical-security-patch
git push origin main

git checkout develop
git merge hotfix/critical-security-patch
git push origin develop

# 4. Tag de version
git tag -a v1.2.3 -m "Security hotfix release"
git push origin v1.2.3
```

## 🎓 Ressources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [Semantic Versioning](https://semver.org/)
- [Husky Documentation](https://typicode.github.io/husky/)
