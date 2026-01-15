# 🏗️ Structure du Repository

## 📂 Organisation des Dossiers

```
iaPostemanage/
├── .husky/                    # Git hooks (Husky)
│   ├── pre-commit            # Exécuté avant chaque commit
│   ├── commit-msg            # Validation des messages de commit
│   └── pre-push              # Exécuté avant chaque push
│
├── .next/                     # Build Next.js (ignoré par git)
├── node_modules/              # Dépendances npm (ignoré par git)
├── coverage/                  # Rapports de couverture de tests
│
├── docs/                      # Documentation du projet
│   ├── GIT_WORKFLOW.md       # Guide Git et commits
│   ├── API_INTEGRATION_STATUS.md
│   ├── GUIDE_DEMARRAGE_RAPIDE_IA.md
│   └── ...
│
├── prisma/                    # Configuration Prisma ORM
│   ├── schema.prisma         # Schéma de base de données
│   ├── migrations/           # Migrations de base de données
│   └── seed.ts               # Données d'initialisation
│
├── public/                    # Fichiers statiques
│   ├── images/
│   └── fonts/
│
├── scripts/                   # Scripts utilitaires
│   ├── check-quality.js      # Vérification de qualité du code
│   ├── figma-sync.ts         # Synchronisation Figma
│   └── ...
│
├── src/                       # Code source principal
│   ├── app/                  # Pages Next.js (App Router)
│   │   ├── layout.tsx        # Layout principal
│   │   ├── page.tsx          # Page d'accueil
│   │   ├── dossiers/         # Module dossiers
│   │   ├── documents/        # Module documents
│   │   └── api/              # Routes API
│   │
│   ├── components/           # Composants React réutilisables
│   │   ├── ui/               # Composants UI de base
│   │   ├── forms/            # Composants de formulaires
│   │   ├── layout/           # Composants de layout
│   │   └── ...
│   │
│   ├── lib/                  # Bibliothèques et utilitaires
│   │   ├── prisma.ts         # Client Prisma
│   │   ├── auth.ts           # Configuration authentification
│   │   ├── utils.ts          # Fonctions utilitaires
│   │   └── validations/      # Schémas de validation (Zod)
│   │
│   ├── hooks/                # Custom React Hooks
│   │   ├── useDossiers.ts
│   │   ├── useDocuments.ts
│   │   └── ...
│   │
│   ├── types/                # Types TypeScript
│   │   ├── index.ts
│   │   ├── dossier.ts
│   │   └── ...
│   │
│   └── styles/               # Styles globaux
│       └── globals.css
│
├── __tests__/                # Tests
│   ├── unit/                 # Tests unitaires
│   ├── integration/          # Tests d'intégration
│   └── e2e/                  # Tests end-to-end
│
├── __mocks__/                # Mocks pour les tests
│   ├── fileMock.js
│   └── styleMock.js
│
├── .env.example              # Template variables d'environnement
├── .env.local                # Variables locales (ignoré)
├── .eslintrc.json            # Configuration ESLint
├── .gitignore                # Fichiers ignorés par Git
├── .lintstagedrc.js          # Configuration lint-staged
├── .prettierrc.json          # Configuration Prettier
├── commitlint.config.js      # Configuration Commitlint
├── jest.config.js            # Configuration Jest
├── next.config.js            # Configuration Next.js
├── package.json              # Dépendances et scripts npm
├── postcss.config.js         # Configuration PostCSS
├── tailwind.config.js        # Configuration Tailwind CSS
├── tsconfig.json             # Configuration TypeScript
└── README.md                 # Documentation principale
```

## 📋 Fichiers de Configuration Importants

### Configuration Git et Quality

| Fichier | Description |
|---------|-------------|
| `.husky/` | Hooks Git automatiques (pre-commit, commit-msg, pre-push) |
| `commitlint.config.js` | Validation des messages de commit (Conventional Commits) |
| `.lintstagedrc.js` | Linting des fichiers staged uniquement |
| `.gitignore` | Fichiers et dossiers exclus du versioning |

### Configuration Code Quality

| Fichier | Description |
|---------|-------------|
| `.eslintrc.json` | Règles de linting JavaScript/TypeScript |
| `.prettierrc.json` | Règles de formatage du code |
| `tsconfig.json` | Configuration du compilateur TypeScript |
| `jest.config.js` | Configuration des tests unitaires |

### Configuration Build

| Fichier | Description |
|---------|-------------|
| `next.config.js` | Configuration Next.js (build, optimisations) |
| `tailwind.config.js` | Configuration Tailwind CSS |
| `postcss.config.js` | Configuration PostCSS |
| `package.json` | Dépendances et scripts npm |

## 🔐 Variables d'Environnement

### Fichiers

- `.env.example` : Template avec toutes les variables (committé)
- `.env.local` : Variables locales de développement (ignoré)
- `.env.production` : Variables de production (ignoré)

### Variables Requises

```bash
# Base de données
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# OpenAI (IA)
OPENAI_API_KEY="sk-..."

# Email (optionnel)
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="user@example.com"
EMAIL_SERVER_PASSWORD="password"
EMAIL_FROM="noreply@example.com"
```

## 🗂️ Conventions de Nommage

### Fichiers et Dossiers

```
# Composants React
PascalCase.tsx          → Button.tsx, UserProfile.tsx

# Pages Next.js
kebab-case.tsx          → dossiers-list.tsx, user-settings.tsx

# Utilitaires et fonctions
camelCase.ts            → formatDate.ts, validateEmail.ts

# Types TypeScript
PascalCase.ts           → User.ts, DossierType.ts

# Fichiers de configuration
kebab-case.config.js    → next.config.js, tailwind.config.js

# Constantes
UPPER_SNAKE_CASE.ts     → API_ROUTES.ts, ERROR_MESSAGES.ts
```

### Dossiers

```
kebab-case/             → user-management/, pdf-exports/
PascalCase/             → Composants uniquement si nom de composant
```

## 📦 Dépendances

### Production (`dependencies`)

Packages nécessaires en production :
- `next` : Framework React
- `react`, `react-dom` : Bibliothèque React
- `@prisma/client` : ORM base de données
- `next-auth` : Authentification
- `zod` : Validation de schémas
- `tailwind-merge` : Utilitaire Tailwind
- Et autres...

### Développement (`devDependencies`)

Packages nécessaires uniquement en développement :
- `typescript` : Langage TypeScript
- `@types/*` : Définitions de types
- `eslint` : Linting
- `prettier` : Formatage
- `jest` : Tests
- `husky` : Git hooks
- Et autres...

## 🚀 Scripts npm

### Développement

```bash
npm run dev              # Démarrer le serveur de développement
npm run dev:turbo        # Avec Turbopack (plus rapide)
```

### Build

```bash
npm run build            # Build pour production
npm run start            # Démarrer le serveur de production
npm run analyze          # Analyser la taille du bundle
```

### Quality

```bash
npm run lint             # Vérifier le linting
npm run lint:fix         # Corriger les erreurs de linting
npm run format           # Formater tout le code
npm run format:check     # Vérifier le formatage
npm run type-check       # Vérifier les types TypeScript
npm run validate         # Validation complète (lint + types + tests)
```

### Tests

```bash
npm run test             # Lancer tous les tests avec couverture
npm run test:watch       # Mode watch pour développement
npm run test:ci          # Tests pour CI/CD
```

### Utilitaires

```bash
npm run clean            # Nettoyer les builds
npm run figma:sync       # Synchroniser avec Figma
npx prisma studio        # Interface UI pour la base de données
npx prisma migrate dev   # Créer une migration
```

## 🔄 Workflow de Développement

### 1. Initialisation

```bash
# Clone du repository
git clone <url>
cd iaPostemanage

# Installation des dépendances
npm install

# Configuration de l'environnement
cp .env.example .env.local
# Éditer .env.local avec vos valeurs

# Initialisation de la base de données
npx prisma migrate dev
npx prisma db seed
```

### 2. Développement

```bash
# Créer une branche
git checkout -b feature/ma-fonctionnalite

# Démarrer le serveur de dev
npm run dev

# Faire des modifications...

# Vérifier la qualité
npm run validate

# Committer (les hooks se déclenchent automatiquement)
git add .
git commit -m "feat(module): add new feature"

# Pousser
git push origin feature/ma-fonctionnalite
```

### 3. Pre-merge Checklist

- [ ] Tous les tests passent : `npm run test`
- [ ] Pas d'erreurs de types : `npm run type-check`
- [ ] Code linté : `npm run lint`
- [ ] Code formaté : `npm run format`
- [ ] Documentation à jour
- [ ] Message de commit conforme
- [ ] Pas de secrets committés

## 📊 Métriques de Qualité

### Objectifs

- **Couverture de tests** : > 80%
- **TypeScript strict** : Activé
- **Erreurs ESLint** : 0
- **Warnings ESLint** : < 10
- **Bundle size** : < 500KB (First Load JS)
- **Lighthouse Score** : > 90

### Vérification

```bash
# Couverture de tests
npm run test -- --coverage

# Size du bundle
npm run analyze

# Lighthouse
npm run build
npm run start
# Puis ouvrir Chrome DevTools > Lighthouse
```

## 🐛 Debugging

### Outils

- **React DevTools** : Inspection des composants
- **Redux DevTools** : Si Redux utilisé
- **Network Tab** : Requêtes API
- **VSCode Debugger** : Points d'arrêt

### Logs

```typescript
// Utiliser console.log uniquement en développement
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}
```

## 🔒 Sécurité

### Fichiers Sensibles (JAMAIS committer)

- `.env.local`, `.env.production`
- `*.key`, `*.pem`
- Clés API, secrets, tokens
- Données personnelles de test

### Audit de Sécurité

```bash
# Vérifier les vulnérabilités
npm audit

# Corriger automatiquement si possible
npm audit fix

# Forcer les corrections (attention aux breaking changes)
npm audit fix --force
```

## 📚 Ressources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
