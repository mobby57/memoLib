# 🚀 Configuration Git, Commits et Repository

## ✅ Configuration Complète

Votre projet dispose maintenant d'une configuration professionnelle complète pour la gestion Git, les commits et la qualité du code.

## 📦 Outils Installés

### 1. **Husky** - Gestion des Git Hooks
Automatise les vérifications à chaque action Git.

### 2. **Commitlint** - Validation des Messages
Force l'utilisation de la convention Conventional Commits.

### 3. **Lint-staged** - Linting Optimisé
Exécute les linters uniquement sur les fichiers modifiés.

### 4. **Prettier** - Formatage Automatique
Assure un formatage cohérent du code.

## 🔧 Fichiers de Configuration

| Fichier | Description |
|---------|-------------|
| [.husky/pre-commit](.husky/pre-commit) | Hook exécuté avant chaque commit |
| [.husky/commit-msg](.husky/commit-msg) | Validation du message de commit |
| [.husky/pre-push](.husky/pre-push) | Vérifications avant push |
| [commitlint.config.js](commitlint.config.js) | Configuration Commitlint |
| [.lintstagedrc.js](.lintstagedrc.js) | Configuration lint-staged |
| [.prettierrc.json](.prettierrc.json) | Configuration Prettier |
| [.gitignore](.gitignore) | Fichiers ignorés par Git |

## 🎯 Workflow Git Automatisé

### Pre-commit (Avant chaque commit)
Exécuté automatiquement sur les fichiers staged :
- ✅ Formatage automatique avec Prettier
- ✅ Correction ESLint
- ✅ Vérification des types TypeScript
- ✅ Exécution des tests concernés

### Commit-msg (Validation du message)
Vérifie que le message respecte la convention :
```
<type>(<scope>): <subject>

[body]

[footer]
```

### Pre-push (Avant chaque push)
- ✅ Tous les tests unitaires
- ✅ Vérification complète des types
- ✅ Lint de tout le projet

## 📝 Convention de Commits

### Types Autorisés

| Type | Usage | Exemple |
|------|-------|---------|
| `feat` | Nouvelle fonctionnalité | `feat(auth): add OAuth login` |
| `fix` | Correction de bug | `fix(api): resolve CORS error` |
| `docs` | Documentation | `docs(readme): update setup guide` |
| `style` | Formatage | `style: fix indentation` |
| `refactor` | Refactorisation | `refactor(utils): simplify validation` |
| `perf` | Performance | `perf(api): optimize queries` |
| `test` | Tests | `test(auth): add login tests` |
| `chore` | Maintenance | `chore(deps): update dependencies` |
| `ci` | CI/CD | `ci: add GitHub Actions` |
| `build` | Build | `build: update webpack config` |

### Exemples de Messages Valides

```bash
# Simple
feat(dossiers): add PDF export

# Avec description
fix(extraction): correct date parsing

The French date format was not properly recognized.
Now supports DD/MM/YYYY format correctly.

Closes #123

# Breaking change
feat(api)!: change authentication endpoint

BREAKING CHANGE: Auth endpoint moved to /api/v2/auth
```

### Exemples de Messages Invalides

❌ `update code`  
❌ `fix bug`  
❌ `WIP`  
❌ `Added new feature`  

## 🛠️ Scripts npm Disponibles

### Développement
```bash
npm run dev              # Démarrer le serveur de développement
```

### Formatage & Linting
```bash
npm run format           # Formater tout le code
npm run format:check     # Vérifier le formatage
npm run lint             # Vérifier le linting
npm run lint:fix         # Corriger les erreurs de linting
```

### Tests
```bash
npm run test             # Lancer les tests avec couverture
npm run test:watch       # Mode watch
npm run test:ci          # Tests pour CI/CD
```

### Vérifications
```bash
npm run type-check       # Vérifier les types TypeScript
npm run validate         # Validation complète (types + lint + tests)
npm run check-quality    # Vérification de qualité complète
```

### Build
```bash
npm run build            # Build pour production
npm run start            # Démarrer le serveur de production
npm run analyze          # Analyser la taille du bundle
```

## 📖 Documentation

Consultez les guides complets :

- [GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) - Guide complet du workflow Git
- [REPOSITORY_STRUCTURE.md](docs/REPOSITORY_STRUCTURE.md) - Structure et conventions

## 🚀 Utilisation Quotidienne

### 1. Créer une Nouvelle Fonctionnalité

```bash
# Créer une branche depuis develop
git checkout develop
git pull origin develop
git checkout -b feature/export-pdf

# Développer...
# Les fichiers sont automatiquement formatés et lintés à chaque commit

git add .
git commit -m "feat(export): add PDF export functionality"

# Push (les tests sont automatiquement exécutés)
git push origin feature/export-pdf
```

### 2. Corriger un Bug

```bash
git checkout -b fix/date-parsing-error

# Faire les corrections
git add .
git commit -m "fix(utils): correct French date format parsing

Fixes date extraction from DD/MM/YYYY format.
Closes #456"

git push origin fix/date-parsing-error
```

### 3. Mettre à Jour la Documentation

```bash
git checkout -b docs/update-readme

git add README.md
git commit -m "docs(readme): update installation instructions"

git push origin docs/update-readme
```

## ⚠️ Que Faire en Cas d'Erreur ?

### Le Hook Pre-commit Échoue

```bash
# Voir les erreurs
npm run lint
npm run type-check

# Corriger automatiquement
npm run lint:fix
npm run format

# Re-essayer le commit
git commit -m "feat: my feature"
```

### Message de Commit Rejeté

```bash
# ❌ Erreur
git commit -m "update stuff"
# ⧗   input: update stuff
# ✖   type may not be empty [type-empty]

# ✅ Correct
git commit -m "chore: update configuration"
```

### Les Tests Échouent Avant le Push

```bash
# Identifier les tests qui échouent
npm run test

# Corriger le code
# ...

# Re-tester
npm run test

# Push
git push
```

## 🎓 Bonnes Pratiques

### ✅ À Faire

- Faire des commits atomiques (un changement logique = un commit)
- Utiliser des messages descriptifs
- Committer fréquemment
- Tester avant de committer
- Lire la diff avec `git diff` avant de committer
- Créer une branche par fonctionnalité

### ❌ À Éviter

- Commits massifs avec des dizaines de fichiers
- Messages vagues ("fix", "update", "wip")
- Committer du code qui ne compile pas
- Utiliser `--no-verify` (sauf exception)
- Travailler directement sur `main` ou `develop`
- Committer des secrets ou fichiers de config locaux

## 🔒 Sécurité

### Fichiers JAMAIS à Committer

- `.env.local`, `.env.production`
- `*.key`, `*.pem`
- Clés API, tokens, secrets
- `node_modules/`
- Build artifacts (`.next/`, `dist/`, `out/`)
- Données personnelles de test
- Bases de données locales

### Vérification

Le fichier [.gitignore](.gitignore) est configuré pour ignorer automatiquement ces fichiers sensibles.

## 🐛 Debugging des Hooks

### Désactiver Temporairement les Hooks

```bash
# Commit sans hooks (urgence uniquement)
git commit --no-verify -m "hotfix: critical fix"

# Push sans hooks (urgence uniquement)
git push --no-verify
```

⚠️ **Attention** : N'utilisez `--no-verify` qu'en cas d'urgence absolue !

### Réinstaller les Hooks

```bash
npm run prepare
```

## 📊 Vérifier la Qualité du Projet

```bash
# Vérification complète
npm run check-quality

# Résultat
# ✅ Prettier - Formatage du code... OK
# ✅ ESLint - Qualité du code... OK
# ✅ TypeScript - Vérification des types... OK
# ✅ Jest - Tests unitaires... OK
# ⚠️  NPM Audit - Vulnérabilités... AVERTISSEMENT
# ⚠️  Dépendances obsolètes... AVERTISSEMENT
```

## 🎉 Prêt à Commencer !

Votre environnement est maintenant configuré avec :
- ✅ Git hooks automatiques
- ✅ Validation des commits
- ✅ Formatage automatique
- ✅ Linting sur les fichiers modifiés
- ✅ Tests avant push
- ✅ Documentation complète

Faites votre premier commit :

```bash
git add .
git commit -m "chore: setup git hooks and commit conventions"
git push
```

## 🆘 Aide et Support

- Consultez [GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) pour plus de détails
- Voir [REPOSITORY_STRUCTURE.md](docs/REPOSITORY_STRUCTURE.md) pour la structure
- En cas de problème, ouvrez une issue sur le repository

---

**Happy Coding! 🚀**
