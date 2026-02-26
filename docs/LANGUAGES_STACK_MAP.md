# 🗂️ MAPPING COMPLET : STACK + DOSSIER + LANGAGES

> **memoLib** - Référentiel des langages par dossier
> Généré le 27 janvier 2026

---

## 📊 VUE D'ENSEMBLE

| Couche          | Langages principaux | Langages secondaires           |
| --------------- | ------------------- | ------------------------------ |
| Frontend        | TypeScript, TSX     | CSS, JavaScript                |
| Backend API     | TypeScript          | JavaScript                     |
| Backend IA      | Python 3.11+        | Shell                          |
| Base de données | SQL, Prisma DSL     | -                              |
| CI/CD           | YAML                | Bash, Shell                    |
| Infrastructure  | Dockerfile DSL      | Terraform (optionnel)          |
| Scripts         | PowerShell, Bash    | TypeScript, Python, JavaScript |
| Documentation   | Markdown            | -                              |
| Configuration   | JSON, YAML, TOML    | dotenv                         |

---

## 🏗️ STRUCTURE DÉTAILLÉE PAR DOSSIER

### 📁 `/src/` - Code source principal

| Dossier                | Langage attendu    | Type de fichiers | Rôle                               |
| ---------------------- | ------------------ | ---------------- | ---------------------------------- |
| `src/app/`             | **TypeScript/TSX** | `.tsx`, `.ts`    | Pages Next.js App Router           |
| `src/app/api/`         | **TypeScript**     | `.ts`            | API Routes Next.js                 |
| `src/app/*/page.tsx`   | **TSX**            | `.tsx`           | Composants de page                 |
| `src/app/*/layout.tsx` | **TSX**            | `.tsx`           | Layouts de page                    |
| `src/app/globals.css`  | **CSS/Tailwind**   | `.css`           | Styles globaux                     |
| `src/components/`      | **TypeScript/TSX** | `.tsx`, `.ts`    | Composants React réutilisables     |
| `src/hooks/`           | **TypeScript**     | `.ts`            | Custom React Hooks                 |
| `src/lib/`             | **TypeScript**     | `.ts`            | Logique métier, utilitaires        |
| `src/lib/ai/`          | **TypeScript**     | `.ts`            | Intégration IA (OpenAI, LangChain) |
| `src/lib/services/`    | **TypeScript**     | `.ts`            | Services métier                    |
| `src/lib/auth.ts`      | **TypeScript**     | `.ts`            | Configuration NextAuth             |
| `src/lib/prisma.ts`    | **TypeScript**     | `.ts`            | Client Prisma                      |
| `src/types/`           | **TypeScript**     | `.ts`, `.d.ts`   | Définitions de types               |
| `src/utils/`           | **TypeScript**     | `.ts`            | Fonctions utilitaires              |
| `src/middleware/`      | **TypeScript**     | `.ts`            | Middlewares Next.js                |
| `src/styles/`          | **CSS/SCSS**       | `.css`, `.scss`  | Feuilles de style                  |
| `src/pages/`           | **TypeScript/TSX** | `.tsx`           | Pages Router (legacy)              |
| `src/examples/`        | **TypeScript**     | `.ts`, `.tsx`    | Exemples de code                   |

---

### 📁 `/src/backend/` - Backend Python (Flask/FastAPI)

| Dossier/Fichier               | Langage attendu    | Type de fichiers | Rôle                        |
| ----------------------------- | ------------------ | ---------------- | --------------------------- |
| `src/backend/*.py`            | **Python 3.11+**   | `.py`            | Code backend principal      |
| `src/backend/main.py`         | **Python**         | `.py`            | Point d'entrée Flask        |
| `src/backend/main_fastapi.py` | **Python**         | `.py`            | Point d'entrée FastAPI      |
| `src/backend/api/`            | **Python**         | `.py`            | Endpoints API REST          |
| `src/backend/routes/`         | **Python**         | `.py`            | Définitions de routes       |
| `src/backend/services/`       | **Python**         | `.py`            | Services métier Python      |
| `src/backend/models.py`       | **Python**         | `.py`            | Modèles SQLAlchemy/Pydantic |
| `src/backend/security/`       | **Python**         | `.py`            | Sécurité, auth              |
| `src/backend/controllers/`    | **Python**         | `.py`            | Contrôleurs MVC             |
| `src/backend/Dockerfile`      | **Dockerfile DSL** | `Dockerfile`     | Image Docker backend        |

---

### 📁 `/ai-service/` - Service IA dédié

| Dossier/Fichier               | Langage attendu    | Type de fichiers | Rôle                      |
| ----------------------------- | ------------------ | ---------------- | ------------------------- |
| `ai-service/app/`             | **Python 3.11+**   | `.py`            | Code IA principal         |
| `ai-service/tests/`           | **Python**         | `.py`            | Tests pytest              |
| `ai-service/requirements.txt` | **pip format**     | `.txt`           | Dépendances Python        |
| `ai-service/Dockerfile`       | **Dockerfile DSL** | `Dockerfile`     | Image Docker IA           |
| `ai-service/.env.example`     | **dotenv**         | `.env`           | Variables d'environnement |

---

### 📁 `/backend-python/` - Backend Python alternatif

| Dossier/Fichier                   | Langage attendu  | Type de fichiers | Rôle              |
| --------------------------------- | ---------------- | ---------------- | ----------------- |
| `backend-python/app.py`           | **Python 3.11+** | `.py`            | Application Flask |
| `backend-python/requirements.txt` | **pip format**   | `.txt`           | Dépendances       |
| `backend-python/data/`            | **JSON/CSV**     | `.json`, `.csv`  | Données           |

---

### 📁 `/prisma/` - Base de données

| Dossier/Fichier        | Langage attendu | Type de fichiers | Rôle                      |
| ---------------------- | --------------- | ---------------- | ------------------------- |
| `prisma/schema.prisma` | **Prisma DSL**  | `.prisma`        | Schéma de base de données |
| `prisma/migrations/`   | **SQL**         | `.sql`           | Migrations de schéma      |
| `prisma/seed.ts`       | **TypeScript**  | `.ts`            | Script de seed            |
| `prisma/*.sql`         | **SQL**         | `.sql`           | Scripts SQL manuels       |

---

### 📁 `/docker/` - Conteneurisation

| Dossier/Fichier       | Langage attendu    | Type de fichiers | Rôle                     |
| --------------------- | ------------------ | ---------------- | ------------------------ |
| `docker/Dockerfile.*` | **Dockerfile DSL** | `Dockerfile`     | Images Docker            |
| `docker/nginx/`       | **Nginx conf**     | `.conf`          | Configuration Nginx      |
| `docker/prometheus/`  | **YAML**           | `.yml`           | Configuration Prometheus |
| `docker-compose*.yml` | **YAML**           | `.yml`           | Orchestration Docker     |

---

### 📁 `/.github/` - CI/CD GitHub Actions

| Dossier/Fichier           | Langage attendu | Type de fichiers | Rôle                    |
| ------------------------- | --------------- | ---------------- | ----------------------- |
| `.github/workflows/*.yml` | **YAML**        | `.yml`           | Workflows CI/CD         |
| `.github/dependabot.yml`  | **YAML**        | `.yml`           | Mise à jour dépendances |
| `.github/codeql/`         | **YAML**        | `.yml`           | Analyse de sécurité     |

---

### 📁 `/scripts/` - Scripts d'automatisation

| Extension | Langage attendu | Quantité | Rôle                  |
| --------- | --------------- | -------- | --------------------- |
| `*.ps1`   | **PowerShell**  | ~40      | Scripts Windows/Azure |
| `*.sh`    | **Bash/Shell**  | ~10      | Scripts Linux/Unix    |
| `*.ts`    | **TypeScript**  | ~50      | Scripts Node.js (tsx) |
| `*.js`    | **JavaScript**  | ~15      | Scripts Node.js       |
| `*.py`    | **Python**      | ~5       | Scripts Python        |

---

### 📁 `/tests/` et `/__tests__/` - Tests

| Dossier/Fichier         | Langage attendu | Framework             | Rôle                     |
| ----------------------- | --------------- | --------------------- | ------------------------ |
| `__tests__/*.test.ts`   | **TypeScript**  | Jest/Vitest           | Tests unitaires frontend |
| `__tests__/*.test.tsx`  | **TSX**         | React Testing Library | Tests composants         |
| `tests/*.py`            | **Python**      | pytest                | Tests backend Python     |
| `ai-service/tests/*.py` | **Python**      | pytest                | Tests service IA         |

---

### 📁 Racine `/` - Configuration

| Fichier              | Langage/Format     | Rôle                      |
| -------------------- | ------------------ | ------------------------- |
| `package.json`       | **JSON**           | Dépendances Node.js       |
| `tsconfig.json`      | **JSON**           | Configuration TypeScript  |
| `next.config.js`     | **JavaScript**     | Configuration Next.js     |
| `tailwind.config.js` | **JavaScript**     | Configuration Tailwind    |
| `postcss.config.js`  | **JavaScript**     | Configuration PostCSS     |
| `jest.config.js`     | **JavaScript**     | Configuration Jest        |
| `eslint.config.mjs`  | **JavaScript ESM** | Configuration ESLint      |
| `.prettierrc.json`   | **JSON**           | Configuration Prettier    |
| `wrangler.toml`      | **TOML**           | Configuration Cloudflare  |
| `vercel.json`        | **JSON**           | Configuration Vercel      |
| `.env*`              | **dotenv**         | Variables d'environnement |
| `Dockerfile`         | **Dockerfile DSL** | Image Docker principale   |
| `Makefile.figma`     | **Makefile**       | Automatisation Figma      |

---

## 🎯 RÈGLES DE NOMMAGE PAR LANGAGE

### TypeScript/TSX (Frontend)

```
src/app/**/page.tsx          → Pages
src/app/**/layout.tsx        → Layouts
src/app/**/loading.tsx       → Loading states
src/app/**/error.tsx         → Error boundaries
src/app/api/**/route.ts      → API Routes
src/components/**/*.tsx      → Composants
src/hooks/use*.ts            → Hooks (préfixe use)
src/lib/**/*.ts              → Logique métier
src/types/**/*.ts            → Types/Interfaces
```

### Python (Backend/IA)

```
src/backend/*.py             → Modules backend
src/backend/api/*.py         → Endpoints API
ai-service/app/*.py          → Modules IA
**/tests/test_*.py           → Tests (préfixe test_)
**/requirements*.txt         → Dépendances
```

### Configuration

```
*.config.js                  → Config JavaScript
*.config.ts                  → Config TypeScript
*.config.mjs                 → Config ESM
.env.*                       → Variables d'environnement
*.json                       → Config JSON
*.yaml / *.yml               → Config YAML
*.toml                       → Config TOML
```

---

## 📈 STATISTIQUES DU PROJET

| Langage                   | Fichiers estimés | Pourcentage |
| ------------------------- | ---------------- | ----------- |
| TypeScript/TSX            | ~400             | 55%         |
| Python                    | ~80              | 12%         |
| JavaScript                | ~50              | 7%          |
| YAML                      | ~30              | 4%          |
| SQL/Prisma                | ~20              | 3%          |
| PowerShell                | ~40              | 5%          |
| Bash/Shell                | ~15              | 2%          |
| CSS                       | ~20              | 3%          |
| Markdown                  | ~50              | 7%          |
| Autres (JSON, TOML, etc.) | ~30              | 2%          |

---

## ✅ VALIDATION PAR EXTENSION

| Extension | Langage          | Linter/Formatter | Build tool      |
| --------- | ---------------- | ---------------- | --------------- |
| `.ts`     | TypeScript       | ESLint, Prettier | tsc, Turbopack  |
| `.tsx`    | TypeScript React | ESLint, Prettier | tsc, Turbopack  |
| `.js`     | JavaScript       | ESLint, Prettier | Node.js         |
| `.py`     | Python           | flake8, black    | Python 3.11+    |
| `.prisma` | Prisma DSL       | prisma format    | prisma generate |
| `.sql`    | SQL              | -                | PostgreSQL      |
| `.yml`    | YAML             | yamllint         | GitHub Actions  |
| `.css`    | CSS              | Prettier         | PostCSS         |
| `.md`     | Markdown         | markdownlint     | -               |
| `.ps1`    | PowerShell       | PSScriptAnalyzer | PowerShell      |
| `.sh`     | Bash             | shellcheck       | bash            |

---

## 🔐 FICHIERS SENSIBLES (NE PAS COMMITER)

| Pattern           | Contenu          | Protection        |
| ----------------- | ---------------- | ----------------- |
| `.env.local`      | Secrets locaux   | .gitignore        |
| `.env.production` | Secrets prod     | .gitignore        |
| `*.pem`           | Clés privées     | .gitignore        |
| `*-key.json`      | Service accounts | .gitignore        |
| `.env.vault`      | Vault chiffré    | Peut être commité |

---

## 🧠 RÈGLE D'OR FINALE

```
┌─────────────────────────────────────────────────────────────┐
│  1. TypeScript (.ts/.tsx) = Frontend + API Routes           │
│  2. Python (.py) = Backend IA + Traitement documentaire     │
│  3. Prisma (.prisma) + SQL = Base de données                │
│  4. YAML (.yml) = CI/CD + Configuration                     │
│  5. Bash/PowerShell = Scripts d'automatisation              │
│  6. Dockerfile = Conteneurisation                           │
│  7. Markdown (.md) = Documentation                          │
└─────────────────────────────────────────────────────────────┘
```

---

_Document généré automatiquement - memoLib_
