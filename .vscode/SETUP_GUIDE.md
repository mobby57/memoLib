# 🎯 Configuration VS Code MemoLib - Guide Complet

**Date:** 4 février 2026
**Public:** Développeurs MemoLib
**Secteurs:** Juridique, Médical, Administratif

---

## 📋 Table des Matières

1. [Principe Fondamental](#principe-fondamental)
2. [Ordre de Priorité](#ordre-de-priorité)
3. [Extensions Obligatoires](#extensions-obligatoires)
4. [Configuration Par Rôle](#configuration-par-rôle)
5. [Zones Sensibles](#zones-sensibles)
6. [Workflow Recommandé](#workflow-recommandé)

---

## 🧭 Principe Fondamental

> **Une extension = un rôle clair**

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ESLint        → Autorité de vérité syntaxique          │
│  TypeScript    → Vérification statique stricte          │
│  Tailwind      → Assistance UI déclarative              │
│  IntelliCode   → Suggestions statistiques               │
│  Copilot       → Assistant conversationnel contrôlé     │
│  Amazon Q      → Expert cloud/infra uniquement          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**❌ Aucun outil ne décide seul**
**✅ Chaque outil a son domaine de responsabilité**

---

## 🎯 Ordre de Priorité des Actions de Code

Quand VS Code propose plusieurs actions, l'ordre est:

```
1️⃣ ESLint                  ← Source de vérité
2️⃣ TypeScript              ← Typage strict
3️⃣ Tailwind IntelliSense   ← UI uniquement
4️⃣ IntelliCode             ← Statistiques
5️⃣ Copilot                 ← Assistance
6️⃣ Amazon Q                ← Infrastructure
```

**Règle d'or:** Si ESLint dit non → tout le reste est ignoré

---

## 📦 Extensions Obligatoires

### Core (Requis pour tous)

```json
{
  "recommendations": [
    // 1️⃣ Qualité de code
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",

    // 2️⃣ TypeScript & JavaScript
    "ms-vscode.vscode-typescript-next",

    // 3️⃣ UI & CSS
    "bradlc.vscode-tailwindcss",

    // 4️⃣ Python (Backend)
    "ms-python.python",
    "ms-python.black-formatter",
    "ms-python.flake8",

    // 5️⃣ Intelligence
    "VisualStudioExptTeam.vscodeintellicode",
    "GitHub.copilot",
    "GitHub.copilot-chat"
  ]
}
```

### Optionnelles (Selon rôle)

```json
{
  "recommendations": [
    // Infrastructure
    "amazonwebservices.aws-toolkit-vscode",

    // Docker
    "ms-azuretools.vscode-docker",

    // Tests
    "Orta.vscode-jest",
    "hbenl.vscode-test-explorer",

    // Utils
    "aaron-bond.better-comments",
    "usernamehw.errorlens",
    "christian-kohler.path-intellisense"
  ]
}
```

---

## ⚙️ Configuration Par Rôle

### 1️⃣ ESLint - Source de Vérité

**Rôle:** Détecter, corriger, proposer des actions fiables

**Configuration clé:**

```json
{
  "eslint.enable": true,
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"],
  "eslint.codeActionsOnSave.mode": "all",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

**Actions proposées:**

- ✅ Quick Fix fiables
- ✅ Refactors sûrs
- ✅ Base solide pour Copilot

---

### 2️⃣ TypeScript - Vérification Statique

**Rôle:** Typage strict, imports automatiques

**Configuration clé:**

```json
{
  "typescript.tsdk": "src/frontend/node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

**Actions proposées:**

- ✅ Imports automatiques
- ✅ Refactor de types
- ✅ Rename symbols

---

### 3️⃣ Tailwind CSS - Assistance UI

**Rôle:** Autocomplétion, validation, refactor de classes

**⚠️ Piège:** Tailwind ne doit pas corriger le JS/TS

**Configuration clé:**

```json
{
  "tailwindCSS.validate": true,
  "tailwindCSS.emmetCompletions": true,
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ],
  "editor.quickSuggestions": {
    "strings": true
  }
}
```

**Actions proposées:**

- ✅ Tri des classes
- ✅ Correction de classes invalides
- ✅ Preview visuel

---

### 4️⃣ IntelliCode - Intelligence Statistique

**Rôle:** Prioriser les suggestions (pas décider)

**Configuration clé:**

```json
{
  "vsintellicode.modify.editor.suggestSelection": "automaticallyOverrodeDefaultValue"
}
```

**Ce qu'il fait:**

- ✅ Classe les suggestions
- ❌ Ne refactor pas
- ❌ Ne modifie pas

---

### 5️⃣ GitHub Copilot - Assistant Contrôlé

**Rôle:** Expliquer, proposer, accélérer (jamais décider)

**⚠️ Règle d'or:** Copilot n'est jamais une source de vérité

**Configuration clé:**

```json
{
  "github.copilot.enable": {
    "*": true,
    "plaintext": false,
    "markdown": true
  },
  "github.copilot.editor.enableAutoCompletions": true,
  "github.copilot.chat.localeOverride": "fr"
}
```

**Bonne pratique d'usage:**

```
❌ "Corrige ce code"
✅ "Propose un exemple sans modifier la logique métier"
```

---

### 6️⃣ Amazon Q - Expert Infrastructure

**Rôle pour MemoLib:** AWS, IAM, Terraform, Sécurité, Logs

**❌ Pas pour:**

- Logique métier
- Règles juridiques
- EventLog

**Configuration clé:**

Utiliser Amazon Q **uniquement** dans:

- `/infrastructure`
- `/terraform`
- `/aws`
- Fichiers `.tf`

---

## 🔒 Zones Sensibles - Copilot Désactivé

Pour MemoLib, certaines zones sont critiques et ne doivent **jamais** utiliser Copilot automatiquement:

```json
{
  "github.copilot.chat.excludeGlobs": [
    // 1️⃣ Migrations DB
    "**/prisma/migrations/**",

    // 2️⃣ Services métier critiques
    "**/src/lib/services/legal-proof.service.ts",
    "**/src/lib/services/event-log.service.ts",
    "**/src/lib/services/rgpd-compliance.service.ts",

    // 3️⃣ Sécurité & Secrets
    "**/.env*",
    "**/secrets/**",
    "**/config/security/**",

    // 4️⃣ RGPD & Conformité
    "**/src/lib/rgpd/**",
    "**/docs/legal/**"
  ]
}
```

**Pourquoi?**

- 🏛️ **Secteurs réglementés** (avocats, médecins)
- ⚖️ **Conformité RGPD stricte**
- 🔐 **Données sensibles**
- 📜 **Traçabilité légale requise**

---

## 🔄 Workflow Recommandé

### Développement Standard

```
1. Écrire du code
   ↓
2. ESLint détecte problèmes
   ↓
3. TypeScript vérifie types
   ↓
4. Tailwind valide classes
   ↓
5. Copilot suggère (si demandé)
   ↓
6. Sauvegarder → Auto-fix ESLint
```

### Développement en Zone Sensible

```
1. Désactiver Copilot manuellement
   ↓
2. Écrire du code avec attention
   ↓
3. ESLint + TypeScript strictes
   ↓
4. Review manuelle obligatoire
   ↓
5. Tests unitaires + E2E
   ↓
6. Documentation de chaque décision
```

---

## 📊 Règles ESLint Métier MemoLib

### Fichier `.eslintrc.cjs` (extrait)

```javascript
module.exports = {
  root: true,
  extends: ['next/core-web-vitals', 'eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  rules: {
    // 🚨 Sécurité
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',

    // 🔐 RGPD & Données sensibles
    'no-console': [
      'warn',
      {
        allow: ['warn', 'error'],
      },
    ],

    // 📝 EventLog - Immutabilité
    'no-param-reassign': [
      'error',
      {
        props: true,
        ignorePropertyModificationsFor: [],
      },
    ],

    // ⚖️ Conformité métier
    'prefer-const': 'error',
    'no-var': 'error',

    // 🧪 Tests requis
    '@typescript-eslint/explicit-function-return-type': [
      'warn',
      {
        allowExpressions: true,
      },
    ],
  },
};
```

---

## 🎯 Checklist d'Intégration

### Pour un nouveau développeur

- [ ] Installer VS Code
- [ ] Cloner le repo MemoLib
- [ ] Installer extensions recommandées
- [ ] Vérifier `.vscode/settings.json`
- [ ] Lancer `npm install` (frontend)
- [ ] Lancer `pip install -r requirements.txt` (backend)
- [ ] Tester ESLint: `npm run lint`
- [ ] Tester TypeScript: `npm run type-check`
- [ ] Lire ce guide complet
- [ ] Configurer Git hooks (pre-commit)

### Pour un projet existant

- [ ] Fusionner `.vscode/settings.json`
- [ ] Mettre à jour `.eslintrc.cjs`
- [ ] Ajouter règles métier spécifiques
- [ ] Configurer zones sensibles Copilot
- [ ] Documenter exceptions
- [ ] Former l'équipe

---

## 🚀 Prochaines Étapes Possibles

### 1️⃣ Politique Copilot par Dossier

Créer un fichier `.copilotignore` pour contrôler finement:

```
# .copilotignore
prisma/migrations/
src/lib/services/legal-proof.service.ts
src/lib/services/event-log.service.ts
.env*
secrets/
```

### 2️⃣ ESLint Rules Métier

Règles personnalisées pour:

- EventLog immutabilité
- RGPD compliance
- LegalProof validation

### 3️⃣ Setup Clé en Main

Script automatique:

```bash
./scripts/setup-vscode.sh
```

### 4️⃣ Mode Compliance Forte

Configuration spéciale pour:

- Cabinets d'avocats
- Cliniques médicales
- Administrations publiques

---

## 📚 Résumé

> Tu ne "configures pas des extensions",
> tu mets en place une **chaîne de responsabilité du code**.

**MemoLib devient:**

- ✅ Robuste
- ✅ Explicable
- ✅ Industrialisable
- ✅ Auditable

**Pour des secteurs réglementés (avocats, médecins):**

- ✅ Code traçable
- ✅ Décisions documentées
- ✅ Conformité RGPD
- ✅ Qualité professionnelle

---

## 🤝 Support

**Questions?**

- Slack: `#memolib-dev`
- Email: `dev@memolib.fr`
- Docs: `docs/ARCHITECTURE.md`

**Mise à jour:** 4 février 2026
