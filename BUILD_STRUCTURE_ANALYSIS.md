# 📊 Analyse Structurée du Build MemoLib

## 🏗️ Architecture Global

```
MemoLib (Full-Stack)
├── Frontend (Next.js 16, App Router)
│   ├── /src/app - Pages et API routes (Server Components)
│   ├── /src/components - Composants React réutilisables
│   ├── /src/lib - Utilitaires et logique métier
│   ├── /src/hooks - Custom React hooks
│   ├── /src/types - Définitions TypeScript globales
│   └── /src/styles - Styles CSS/Tailwind
│
├── Backend Python (FastAPI dev + Flask local)
│   ├── /src/backend - Production (FastAPI, SQLAlchemy)
│   │   ├── main_fastapi.py - Entrée FastAPI
│   │   ├── routes/ - Endpoints organisés
│   │   ├── services/ - Logique métier (IA, emails, etc.)
│   │   ├── models.py - SQLAlchemy models
│   │   └── database.py - Gestion DB
│   │
│   └── /backend-python - Development local (Flask)
│       ├── app.py - Entrée Flask (port 5000)
│       └── Services intégrés
│
├── Infrastructure & Config
│   ├── Prisma (ORM Next.js) - /prisma
│   ├── Database - /data (SQLite dev)
│   ├── Docker - /docker + Dockerfile*
│   └── CI/CD - .github/workflows
│
└── Documentation & Tests
    ├── /tests - Tests E2E (Playwright)
    ├── /src/__tests__ - Tests unitaires Jest
    ├── /docs - Documentation
    └── .github/copilot-instructions.md - Conventions projet
```

---

## 📦 Build Stack & Dépendances Clés

### Frontend (Next.js 16 + TypeScript)

```
✅ Framework: Next.js 16 (App Router, Server Components)
✅ Language: TypeScript (strict mode)
✅ State: React Query, Zustand, Redux (si présent)
✅ Styling: Tailwind CSS + CSS Modules
✅ Testing: Jest + React Testing Library
✅ E2E: Playwright
✅ ORM: Prisma (@prisma/client)
✅ Auth: NextAuth.js (Azure AD SSO)
✅ Monitoring: Sentry (instrumentation.ts)
✅ Build Tools: Turbopack (turbo mode), SWC
```

**Key Configs:**

- `tsconfig.json` - Paths aliases: `@/*`, `@/components/*`, `@/lib/*`, etc.
- `next.config.js` - Output modes: export (Azure), standalone (Docker/Linux), undefined (Vercel/Windows)
- `jest.config.js` - Memory optimized: maxWorkers 50%, workerIdleMemoryLimit 512MB
- `tailwind.config.js` - Custom theme + plugins

### Backend (FastAPI + Flask)

```
✅ Framework: FastAPI (production) + Flask (dev local)
✅ Language: Python 3.12+
✅ ORM: SQLAlchemy (src/backend)
✅ Database: PostgreSQL + SQLite (dev)
✅ Authentication: JWT, Azure AD integration
✅ APIs: REST, WebSocket
✅ Services: IA (OpenAI/Llama), Email, Twilio, Graph
✅ Caching: Redis (LangCache)
✅ Testing: pytest
```

**Key Configs:**

- `pytest.ini` - pythonpath includes: `.`, `src/backend`
- `requirements-python.txt` - Pinned versions for reproducibility
- `src/backend/main_fastapi.py` - FastAPI app factory
- `backend-python/app.py` - Flask dev server (port 5000)

### Orchestration

```
✅ Docker: Multi-stage Dockerfile, docker-compose.yml
✅ Deployment: Vercel, Azure SWA, Docker, Railway, Render
✅ Package Manager: npm (frontend), pip (backend)
✅ Monorepo Tool: N/A (separate package.json areas)
```

---

## 🔄 Build Workflow Optimisé

### Phase 1️⃣: Install Dependencies

```bash
# Exécute en parallèle:
# 1. npm install --legacy-peer-deps (src/frontend)
# 2. pip install -r requirements-python.txt

# 💡 Points clés:
- Prisma generate() lors du postinstall
- Skip husky (ci-friendly)
- Legacy peer deps pour Next.js 16 + Prisma 5
```

### Phase 2️⃣: Type Check & Lint

```bash
# 🏃 Lint (ESLint)
npm run lint       # max-warnings: 50
npm run lint:fix   # Autofix

# ✅ Type Check (tsc)
tsc --noEmit --incremental --skipLibCheck

# 🔍 Flake8 (Python)
flake8 .
```

### Phase 3️⃣: Test

```bash
# Frontend (Jest)
npm test                # Fast, parallel
npm test:coverage       # Coverage report

# Backend (Pytest)
pytest -v --tb=short

# E2E (Playwright)
npm run test:e2e        # Full stack tests
```

### Phase 4️⃣: Build

```bash
# Frontend - Optimisé pour mémoire
cross-env NODE_OPTIONS=--max-old-space-size=8192 next build

# Variantes:
next build --turbo      # Turbopack (plus rapide)
AZURE_STATIC_EXPORT=true next build  # Static export (Azure SWA)
```

---

## 🎯 Scripts npm Critiques

| Commande                | Mode       | But                         | Durée   |
| ----------------------- | ---------- | --------------------------- | ------- |
| `npm run dev`           | Watch      | Dev local Turbo (port 3000) | Continu |
| `npm run build`         | Single     | Build Next.js optimisé      | 2-5min  |
| `npm run lint`          | CI/CD      | ESLint max 50 warnings      | 30-60s  |
| `npm run type-check`    | CI/CD      | tsc --noEmit incremental    | 10-30s  |
| `npm test`              | CI/CD      | Jest parallel 50%           | 30-90s  |
| `npm run validate`      | Pre-commit | type-check + lint + test    | 2-3min  |
| `npm run validate:full` | Pre-merge  | strict checks + CI tests    | 5-10min |

---

## 🐍 Scripts Python Critiques

| Commande                                  | But       | Durée   |
| ----------------------------------------- | --------- | ------- |
| `python -m flask run --debug --port 5000` | Dev local | Continu |
| `python -m pytest -v --tb=short`          | Tests     | 1-2min  |
| `python -m flake8 .`                      | Lint      | 10-20s  |

---

## 🚀 Tâches VS Code Intégrées

### Démarrage Complet

```
Full Stack: Start All
├── Frontend: Dev (npm run dev --turbo)
└── Backend: Flask Dev (python -m flask run --debug)
```

### Validation Pre-Commit

```
Pre-Commit: Full Check
├── lint
├── type-check (tsc)
└── build
```

### Tests & Couverture

```
Full Stack: Test All
├── Frontend: Test (jest)
└── Backend: Pytest
```

---

## ⚠️ Zones à Affiner (Points d'Optimisation)

### 🔴 Frontend

1. **TypeScript strict**
   - `noUnusedLocals: false` → revoir les imports inutilisés
   - `noImplicitReturns: false` → forcer les return explicites

2. **ESLint warnings (50 limit)**
   - À vérifier: `npm run lint` en mode strict
   - Considérer `npm run lint:strict` (0 warnings)

3. **Bundle Size**
   - Analyser: `npm run analyze`
   - Compression: images AVIF/WebP, tree-shake, code splitting

4. **Memory & Performance**
   - Jest: maxWorkers 50%, workerIdleMemoryLimit 512MB
   - Next.js build: NODE_OPTIONS=--max-old-space-size=8192
   - Turbopack: Mode `--turbo` pour dev plus rapide

5. **Database**
   - Prisma schema health: `/prisma/schema.prisma`
   - Migration safety: reverify indexes + constraints
   - N+1 query detection

### 🔴 Backend (Python)

1. **FastAPI vs Flask**
   - Prod: `/src/backend` (FastAPI)
   - Dev: `/backend-python` (Flask, port 5000)
   - **À confirmer**: Points d'intégration API Next.js → Flask local

2. **API Routes (Next.js)**
   - Exemple: `src/frontend/app/api/ai/process/route.ts`
   - Proxy vers: `http://localhost:5000/ai/process`
   - **À vérifier**: Tous les endpoints mappés

3. **Database Layer**
   - SQLAlchemy models en `src/backend/models.py`
   - Migration management (Alembic?)
   - **À tester**: Cohérence DB dev/prod

4. **Services (IA, Email, Intégrations)**
   - OpenAI/Llama: `/src/backend/services/`
   - Twilio (SMS/WhatsApp): webhooks
   - Microsoft Graph: Azure integration
   - **À vérifier**: Timeout, retry logic, error handling

5. **Caching (Redis)**
   - LangCache: `/src/backend/services/redis_langcache.py`
   - **À valider**: Cache keys, TTL, invalidation

### 🔴 Infrastructure & CI/CD

1. **Docker**
   - Dockerfile optimisé pour multi-stage
   - `.dockerignore` mise à jour
   - **À tester**: Build local, taille image

2. **Deployment Options**
   - Vercel: default (serverless)
   - Azure SWA: `AZURE_STATIC_EXPORT=true`
   - Docker: port 3000 exposed
   - **À configurer**: Secrets via Azure Key Vault / env vars

3. **Monitoring**
   - Sentry: `sentry.*.config.ts`, `instrumentation.ts`
   - **À vérifier**: Sampling rate, environment filtering

4. **Pre-Commit & Git Hooks**
   - `.husky/` hooks (lint-staged)
   - **À activer**: Commit linting, prettier

---

## 📋 Checklist Optimisation Build

- [ ] Lancer `npm run lint:strict` → corriger 0 warnings
- [ ] Lancer `tsc --noEmit --incremental` → pas d'erreurs
- [ ] Lancer `npm test --coverage` → coverage > 30% (baseline)
- [ ] Lancer `npm run analyze` → vérifier bundle size
- [ ] Lancer `pytest -v` → tous les tests Python OK
- [ ] Lancer `npm run validate:full` → full CI validation
- [ ] Vérifier tous les API routes vers Flask port 5000
- [ ] Tester docker build localement
- [ ] Configurer secrets Azure Key Vault
- [ ] Activer pre-commit hooks Husky
- [ ] Documenter mapping API Next.js ↔ Flask

---

## 🔗 Références Utiles

- **Copilot Instructions**: `docs/ARCHITECTURE.md`, `.github/copilot-instructions.md`
- **Environment Variables**: `docs/ENVIRONMENT_VARIABLES.md`
- **Config**: `next.config.js`, `tsconfig.json`, `pytest.ini`
- **Sentry**: `sentry.*.config.ts`, `instrumentation.ts`
- **Database**: `prisma/schema.prisma`, `src/backend/models.py`

---

## 🎯 Prochaines Étapes

1. ✅ **Installation** - Dépendances OK
2. ✅ **Lint & Type Check** - En cours...
3. → **Analyser les résultats lint/type**
4. → **Créer notebook détaillé par zone**
5. → **Proposer optimisations spécifiques**
6. → **Implémenter fixes critiques**
