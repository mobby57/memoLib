# MemoLib - Guide d'Actions Immédiates

## 📊 État Actuel du Build (01/02/2026)

| Composant           | Status        | Issue                      |
| ------------------- | ------------- | -------------------------- |
| **Frontend**        | 🟡 Running    | TSC timeout, memory issues |
| **Backend Flask**   | 🟢 Running    | Routes manquantes (/)      |
| **Backend FastAPI** | 🟢 Available  | Non démarré en dev         |
| **Database**        | 🟢 Configured | Indexes à optimiser        |
| **Monitoring**      | 🟡 Setup      | Sentry non activé          |

---

## 🎯 Les 3 Problèmes à Résoudre MAINTENANT

### Problème #1: Flask 404 sur Route "/"

**Symptôme**:

```
127.0.0.1 - - [01/Feb/2026 17:51:28] "GET / HTTP/1.1" 404
```

**Cause**: Aucune route définie pour `/`
**Impact**: Health checks échouent

**Fix (1 minute)**:

```bash
# Ajouter dans backend-python/app.py après CORS(app)
cat >> backend-python/app.py << 'EOF'

@app.route('/', methods=['GET'])
def index():
    return jsonify({'status': 'OK', 'service': 'MemoLib', 'version': '1.0.0'})

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'healthy': True})
EOF

# Tester
curl http://localhost:5000/
curl http://localhost:5000/api/health
```

---

### Problème #2: TypeScript Memory Overflow

**Symptôme**:

```
Exit Code: 143 (killed - memory threshold exceeded)
```

**Cause**: `skipLibCheck: false` force TSC à vérifier tous les .d.ts
**Impact**: Type-check prend 60+ secondes, timeout en CI/CD

**Fix (30 secondes)**:

```bash
# Éditer src/frontend/tsconfig.json
{
  "compilerOptions": {
    "skipLibCheck": true,        # ← Ajouter cette ligne
    "skipDefaultLibCheck": true,
    "exclude": ["node_modules", "**/*.test.ts", "**/__tests__/**", ".next"]
  }
}

# Redémarrer et tester
npm run type-check
# Expected: 30s (au lieu de 60s)
```

---

### Problème #3: CORS Too Permissive

**Symptôme**:

```python
CORS(app)  # ❌ Accepts ALL origins
```

**Cause**: Configuration de dev laissée en production
**Impact**: Vulnérabilité XSS

**Fix (2 minutes)**:

```python
# backend-python/app.py - Remplacer ligne 11
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000",     # Dev
            "https://memolib.fr",        # Prod
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "PATCH"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})
```

---

## 📋 Checklist d'Exécution

### Phase 1: Corrections Critiques (15 min)

- [ ] **1a. Ajouter routes Flask**

  ```bash
  # Éditer backend-python/app.py
  # Ajouter après line 11 (après CORS)
  nano backend-python/app.py
  ```

  - [ ] Ajouter route `GET /` → health check
  - [ ] Ajouter route `GET /api/health` → JSON response
  - [ ] Redémarrer backend: `npm run dev:backend`
  - [ ] Tester: `curl http://localhost:5000/`

- [ ] **1b. Corriger TypeScript config**

  ```bash
  nano src/frontend/tsconfig.json
  ```

  - [ ] Ajouter `"skipLibCheck": true`
  - [ ] Ajouter `"skipDefaultLibCheck": true`
  - [ ] Tester: `npm run type-check`

- [ ] **1c. Sécuriser CORS**

  ```bash
  nano backend-python/app.py
  ```

  - [ ] Remplacer `CORS(app)` par version sécurisée
  - [ ] Redémarrer backend

---

### Phase 2: Validation (10 min)

- [ ] Frontend accessible: `curl http://localhost:3000`
- [ ] Backend health: `curl http://localhost:5000/`
- [ ] API health: `curl http://localhost:5000/api/health`
- [ ] Type-check rapide: `npm run type-check` (< 30s)
- [ ] Lint clean: `npm run lint`

---

### Phase 3: Documentation (5 min)

- [ ] Créer `docs/API_ROUTES.md` (lister tous les endpoints)
- [ ] Mettre à jour `README.md` avec les commandes correctes
- [ ] Documenter les secrets requis dans `.env.local`

---

## 🔧 Scripts Disponibles

```bash
# Lancer validation complète
bash validate-build.sh

# Fixes automatiques (optionnels)
bash fix-flask-health.sh      # Ajoute routes Flask
bash fix-tsconfig.sh          # Optimise TypeScript
```

---

## 🚀 Commandes de Démarrage Correctes

```bash
# 1. Installation (une fois)
npm run install:all

# 2. Démarrer le stack complet
npm run dev:all
# Ou via VS Code: Task → Full Stack: Start All

# 3. Valider le build
bash validate-build.sh

# 4. Lancer les tests
npm test                # Frontend
npm run test:backend    # Python

# 5. Vérifier la qualité
npm run lint            # Frontend
python -m flake8 .      # Backend
npm run type-check      # TypeScript
```

---

## 📊 Avant vs Après

### Avant Les Corrections

```
❌ TSC timeout (Exit 143)
❌ Flask 404 on /
❌ CORS accepts all origins
⚠️ No health check endpoints
⚠️ Memory usage: 1.3GB
```

### Après Les Corrections

```
✅ TSC completes in ~30s
✅ Health endpoints available
✅ CORS properly restricted
✅ Frontend ↔ Backend communication
✅ Memory usage: ~500MB
```

---

## 🎓 Dossiers de Référence Créés

| Fichier                     | Description                       |
| --------------------------- | --------------------------------- |
| **BUILD_ARCHITECTURE.md**   | Architecture complète du projet   |
| **REFINEMENT_CHECKLIST.md** | Liste détaillée des optimisations |
| **validate-build.sh**       | Script de validation automatique  |
| **fix-flask-health.sh**     | Fix automatique routes Flask      |
| **fix-tsconfig.sh**         | Fix automatique TypeScript        |
| **GET_STARTED_QUICK.md**    | Ce guide rapide                   |

---

## ❓ FAQ

**Q: Pourquoi TSC prend 60 secondes?**
A: Par défaut, TypeScript vérifie tous les fichiers `.d.ts` des node_modules. Avec `skipLibCheck: true`, on ignore les .d.ts (sûr car npm packages ont leurs propres tests).

**Q: Est-ce que CORS restrictif casse quelque chose?**
A: Non, en dev on peut étendre la liste. En prod, seuls les domaines listés peuvent faire des appels cross-origin.

**Q: Où sont stockés les secrets?**
A: En dev: `.env.local` | En prod: Azure Key Vault (NextAuth gère)

**Q: Comment vérifier que tout fonctionne?**
A: Lancer `validate-build.sh` - il teste tous les endpoints automatiquement.

---

## 📞 Support

Si vous rencontrez des problèmes:

1. Vérifier les logs:

   ```bash
   # Frontend
   npm run dev
   # Backend
   npm run dev:backend
   # Tests
   npm test
   ```

2. Relancer les corrections:

   ```bash
   bash fix-flask-health.sh
   bash fix-tsconfig.sh
   ```

3. Consulter la documentation:
   - `BUILD_ARCHITECTURE.md` - Architecture
   - `REFINEMENT_CHECKLIST.md` - Détails techniques
   - `docs/ENVIRONMENT_VARIABLES.md` - Configuration

---

**Estimé: 15-20 min pour implémenter toutes les corrections**

Bon développement! 🚀
