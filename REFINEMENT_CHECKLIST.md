# MemoLib - Zones à Affiner (Refinement Checklist)

## 🔴 CRITIQUE - À Résoudre Immédiatement

### 1. Type Checking - Memory Overflow

**Localisation**: `src/frontend` | `tsconfig.json`

**Problème**:

```
TSC timeout - Memory threshold exceeded (8192 MB allocated)
Exit Code: 143 (killed by OS)
```

**Fichiers affectés**:

- `/workspaces/memolib/src/frontend/tsconfig.json`
- Contient probablement trop de `@types` ou bad imports

**Solutions (Ordre de priorité)**:

1. Activer `skipLibCheck: true` dans `tsconfig.json`

   ```json
   {
     "compilerOptions": {
       "skipLibCheck": true,
       "forceConsistentCasingInFileNames": true,
       "strict": true,
       "noImplicitAny": false
   }
   ```

2. Vérifier les alias problématiques

   ```bash
   grep -r "@/" src/frontend/app | head -20
   ```

3. Exclure les fichiers de test du type-check

   ```json
   {
     "exclude": ["**/*.test.ts", "**/__tests__/**", "node_modules"]
   }
   ```

4. Utiliser `skipDefaultLibCheck: true` pour les .d.ts

**Impact**: Bloque le build en CI/CD

---

### 2. Flask Backend - Route '/' Missing

**Localisation**: `backend-python/app.py` ligne ~1

**Problème**:

```
127.0.0.1 - - [01/Feb/2026 17:51:28] "GET / HTTP/1.1" 404
```

**Cause**: Aucune route `/` définie pour health check

**Solution Rapide** (5 lignes):

```python
# backend-python/app.py - Ajouter après line 11 (après CORS config)

@app.route('/', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'OK',
        'service': 'MemoLib Backend',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/health', methods=['GET'])
def api_health():
    """API health check"""
    return jsonify({'healthy': True})
```

**Testing**:

```bash
curl http://localhost:5000/
curl http://localhost:5000/api/health
```

---

## 🟡 IMPORTANT - À Adresser Rapidement

### 3. CORS Configuration - Too Permissive

**Localisation**: `backend-python/app.py` ligne ~11

**Problème Sécurité**:

```python
CORS(app)  # ❌ Accepte TOUS les origins!
```

**Fix**:

```python
# ✅ Sécurisé
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000",  # Dev
            "https://memolib.fr",      # Prod
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "PATCH"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
```

**Impact**: Vulnérabilité XSS en production

---

### 4. Database Indexes Missing

**Localisation**: `prisma/schema.prisma`

**Vérifier**:

```bash
grep "@@index" prisma/schema.prisma | wc -l
# Devrait avoir > 10 indexes pour performances
```

**À Ajouter** (exemple):

```prisma
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String

  @@index([email])  // ← Critique pour login
}

model Dossier {
  id        Int     @id @default(autoincrement())
  clientId  Int
  status    String
  createdAt DateTime @default(now())

  @@index([clientId])     // ← Foreign key
  @@index([status])       // ← Filter queries
  @@index([createdAt])    // ← Timeline queries
}
```

---

### 5. Environment Variables Incomplete

**Localisation**: `.env.example` | `.env.local`

**Vérifier** que tous les secrets sont en place:

```bash
# Critique pour production
NEXTAUTH_SECRET=??? # ← Obligatoire!
NEXTAUTH_URL=http://localhost:3000

# Azure AD
AZURE_AD_CLIENT_ID=???
AZURE_AD_CLIENT_SECRET=???

# API Keys
OPENAI_API_KEY=???

# Database
DATABASE_URL=???
```

**Solution**:

```bash
# Générer NEXTAUTH_SECRET
openssl rand -base64 32
```

---

### 6. Frontend Build Artifacts Not Excluded

**Localisation**: `.gitignore`

**À Vérifier**:

```bash
# Ajouter si manquant
.next/
out/
dist/
__pycache__/
*.pyc
.pytest_cache/
node_modules/.cache/
```

---

## 🟢 BON - À Documenter/Formaliser

### 7. API Routes Documentation

**Localisation**: Manquant actuellement

**À Créer**: `docs/API_ROUTES.md` avec:

- ✅ Tous les endpoints
- ✅ Request/Response examples
- ✅ Auth requirements
- ✅ Rate limits
- ✅ Error codes

**Template**:

```markdown
## POST /api/auth/login

### Description

Authentifie un utilisateur et retourne un token.

### Request

\`\`\`json
{
"username": "admin",
"password": "admin123"
}
\`\`\`

### Response (200)

\`\`\`json
{
"success": true,
"user": {
"username": "admin",
"role": "admin"
}
}
\`\`\`

### Error (401)

\`\`\`json
{"success": false}
\`\`\`
```

---

### 8. Monitoring & Error Tracking

**Status**: Configuré mais pas de données

**À Faire**:

1. Activer Sentry en prod
2. Ajouter custom breadcrumbs
3. Configurer alert rules

**Fichiers**:

- `sentry.client.config.ts` - Client errors
- `sentry.server.config.ts` - Server errors
- `instrumentation.ts` - Tracing

---

### 9. Performance Optimization

**À Vérifier**:

#### Frontend

- [ ] Code splitting enabled
- [ ] Image optimization (next/image)
- [ ] CSS tree-shaking working
- [ ] Bundle size < 200KB (gzipped)

**Check**:

```bash
cd src/frontend
npm run build
# Regarde la taille dans: .next/static/
```

#### Backend

- [ ] Query optimization (N+1 problem)
- [ ] Connection pooling configured
- [ ] Caching strategy in place

---

### 10. Testing Coverage

**À Améliorer**:

```bash
# Frontend
npm test -- --coverage
# Target: > 80% coverage

# Backend
pytest --cov=src/backend
# Target: > 75% coverage
```

---

## 📋 Checklist d'Actions

### Immédiate (Aujourd'hui)

- [ ] Ajouter routes `/` et `/api/health` au Flask backend
- [ ] Fixer CORS configuration
- [ ] Activer `skipLibCheck` dans tsconfig.json
- [ ] Tester `/api/auth/login` depuis Frontend

### Court Terme (Semaine 1)

- [ ] Ajouter indexes manquants en DB
- [ ] Compléter `.env.local` avec tous les secrets
- [ ] Créer `docs/API_ROUTES.md`
- [ ] Configurer Sentry alerts

### Moyen Terme (Semaine 2-3)

- [ ] Optimiser bundle size Frontend
- [ ] Ajouter E2E tests (Playwright)
- [ ] Performance audit (Lighthouse)
- [ ] Documentation complète

### Long Terme

- [ ] Migrer Flask → FastAPI (optionnel)
- [ ] Implémenter caching Redis
- [ ] GraphQL API (optionnel)
- [ ] Kubernetes deployment

---

## 📊 Métriques de Suivi

| Métrique         | Cible   | Actuel    | Status   |
| ---------------- | ------- | --------- | -------- |
| TSC Time         | < 30s   | ~60s ❌   | Critical |
| Bundle Size      | < 200KB | ???       | Review   |
| DB Query Time    | < 100ms | ???       | Check    |
| Test Coverage    | > 80%   | ???       | Improve  |
| Lighthouse Score | > 90    | ???       | Audit    |
| API Latency      | < 200ms | ???       | Monitor  |
| Memory Usage     | < 512MB | ~1.3GB ❌ | Optimize |

---

## 🔗 Fichiers Clés à Vérifier

```
src/frontend/
├── tsconfig.json        ← À corriger (skipLibCheck)
├── next.config.js       ← Build optimization
├── package.json         ← Vérifier dépendances
└── jest.config.js       ← Test config

backend-python/
├── app.py              ← Ajouter routes manquantes
└── requirements.txt    ← À jour?

prisma/
└── schema.prisma       ← Ajouter indexes

docs/
├── ARCHITECTURE.md     ✅ Créé
├── API_ROUTES.md       ← À créer
└── MONITORING_SETUP.md ← À compléter

.env.local             ← Secrets complets?
.gitignore             ← Coverage correct?
```

---

## 🚀 Commandes Utiles

```bash
# Tester les routes Flask
curl http://localhost:5000/
curl http://localhost:5000/api/health

# Check TSC performance
time npm run type-check

# Check bundle size
npm run build && du -sh src/frontend/.next

# Database migrations
npx prisma migrate dev

# Run tests with coverage
npm test -- --coverage

# Lint everything
npm run lint && python -m flake8
```

---

**Dernière mise à jour**: 01/02/2026
**Version**: 1.0.0
**Priority**: 🔴 Critical → 🟡 Important → 🟢 Good-to-have
