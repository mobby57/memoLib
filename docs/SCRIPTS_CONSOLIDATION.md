# Scripts Consolidés - MemoLib

## 🎯 Commandes Essentielles (Top 10)

```bash
# 1. Développement
npm run dev              # Dev avec Turbopack
npm run dev:debug        # Dev avec debugger

# 2. Build & Deploy
npm run build            # Build production
npm run deploy:azure     # Deploy Azure
npm run deploy:vercel    # Deploy Vercel

# 3. Tests
npm run test             # Tests unitaires
npm run test:e2e         # Tests E2E Playwright
npm run test:all         # Tous les tests

# 4. Base de données
npm run db               # Alias: db:push + db:generate
npm run db:migrate       # Migration dev
npm run db:studio        # Prisma Studio UI

# 5. Qualité
npm run validate         # Type-check + lint + test
npm run security         # Audit sécurité complet

# 6. Maintenance
npm run clean            # Nettoyer cache
npm run fresh            # Clean + install + build
```

---

## 📦 Scripts par Catégorie

### **Development**
| Script | Description |
|--------|-------------|
| `dev` | Next.js dev avec Turbopack |
| `dev:debug` | Dev avec Node inspector |
| `start` | Production server |

### **Build**
| Script | Description |
|--------|-------------|
| `build` | Build production standard |
| `build:azure` | Build pour Azure SWA |
| `build:fast` | Build rapide (no telemetry) |
| `analyze` | Analyse bundle size |

### **Tests**
| Script | Description |
|--------|-------------|
| `test` | Jest unitaires |
| `test:e2e` | Playwright E2E |
| `test:coverage` | Coverage report |
| `test:ci` | Tests CI/CD |

### **Database**
| Script | Description |
|--------|-------------|
| `db:migrate` | Migration dev |
| `db:push` | Push schema sans migration |
| `db:studio` | UI Prisma Studio |
| `db:seed` | Seed données |
| `db:backup` | Backup DB |

### **Deploy**
| Script | Description |
|--------|-------------|
| `deploy:azure` | Deploy Azure SWA |
| `deploy:vercel` | Deploy Vercel prod |
| `cf:deploy` | Deploy Cloudflare |

### **Security**
| Script | Description |
|--------|-------------|
| `security:scan` | Scan secrets (GitGuardian) |
| `security:audit` | npm audit + custom checks |
| `security:fix` | Auto-fix vulnérabilités |

### **Quality**
| Script | Description |
|--------|-------------|
| `lint` | ESLint check |
| `lint:fix` | ESLint auto-fix |
| `type-check` | TypeScript check |
| `format` | Prettier format |
| `validate` | Lint + type + test |

### **Email**
| Script | Description |
|--------|-------------|
| `email:monitor` | Monitor Gmail |
| `email:stats` | Stats emails |
| `email:to-workspace` | Email → Workspace |

### **AI**
| Script | Description |
|--------|-------------|
| `ai:test` | Test IA générale |
| `ai:test:ceseda` | Test IA CESEDA |

---

## 🔧 Scripts à Supprimer (Doublons)

### **Doublons Build**
```json
// GARDER
"build": "cross-env NODE_OPTIONS=--max-old-space-size=8192 next build"

// SUPPRIMER (doublons)
"build:turbo"  // Turbopack activé par défaut
"build:fast"   // Même chose que build
```

### **Doublons Prisma**
```json
// GARDER
"db:migrate": "prisma migrate dev"
"db:push": "prisma db push"
"db:studio": "prisma studio"

// SUPPRIMER (doublons)
"prisma:migrate"  // = db:migrate
"prisma:push"     // = db:push
"prisma:studio"   // = db:studio
```

### **Doublons Cloudflare**
```json
// GARDER
"cf:deploy": "npm run build && wrangler pages deploy"

// SUPPRIMER (trop spécifiques)
"cf:dev"
"cf:staging"
"cf:list"
"cf:deployments"
"cf:logs"
"cf:status"
```

### **Doublons Email**
```json
// GARDER
"email:monitor": "tsx scripts/start-gmail-monitor.ts"

// SUPPRIMER (doublons)
"email:monitor:integrated"  // Même chose
"gmail:auth"                // Intégrer dans email:setup
```

---

## ✅ Scripts Recommandés (Simplifiés)

```json
{
  "scripts": {
    // Core
    "dev": "next dev --turbo",
    "build": "cross-env NODE_OPTIONS=--max-old-space-size=8192 next build",
    "start": "next start",
    "preview": "npm run build && npm run start",
    
    // Quality
    "lint": "eslint src --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "validate": "npm run type-check && npm run lint && npm run test",
    
    // Tests
    "test": "jest --passWithNoTests",
    "test:e2e": "playwright test",
    "test:coverage": "jest --coverage",
    
    // Database
    "db": "prisma db push && prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts",
    
    // Deploy
    "deploy:azure": "npm run build:azure && swa deploy",
    "deploy:vercel": "vercel --prod",
    
    // Security
    "security": "npm audit && ggshield secret scan path .",
    
    // Maintenance
    "clean": "rimraf .next out dist .turbo node_modules/.cache",
    "fresh": "npm run clean && npm install && npm run build"
  }
}
```

---

## 📊 Réduction Scripts

| Avant | Après | Gain |
|-------|-------|------|
| 100+ scripts | 20 scripts | -80% |
| Doublons | Unifiés | Clarté |
| Complexe | Simple | DX++ |

---

**Prochaine étape**: Appliquer ces changements à `package.json`
