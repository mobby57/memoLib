# MemoLib - Architecture du Build

## 📋 Vue d'Ensemble

MemoLib est une application full-stack composée de:

- **Frontend**: Next.js 16 (App Router) en TypeScript
- **Backend Flask**: Backend local de développement en Python (port 5000)
- **Backend FastAPI**: Backend de production en Python (src/backend)
- **Base de données**: Prisma (Next.js) + SQLAlchemy (Python)

---

## 🏗️ Structure du Projet

```
memolib/
├── src/
│   ├── frontend/          # Next.js App Router + UI
│   │   ├── app/           # Server Components & Routes
│   │   ├── lib/           # Utilitaires & Services
│   │   ├── hooks/         # React Hooks
│   │   ├── components/    # Composants réutilisables
│   │   └── __tests__/     # Tests Frontend
│   │
│   └── backend/           # FastAPI Production
│       ├── main_fastapi.py
│       ├── routes/        # Endpoints
│       ├── services/      # Logique métier
│       ├── models.py      # Modèles SQLAlchemy
│       └── security/      # Auth & Validation
│
├── backend-python/        # Flask Développement
│   └── app.py            # Main Flask app (port 5000)
│
├── prisma/               # Schéma DB + Migrations
├── docs/                 # Documentation
└── .github/              # Workflows CI/CD
```

---

## 🔌 Routes Flask Backend (Port 5000)

### Authentication

- `POST /api/auth/login` - Connexion utilisateur
- `POST /api/auth/register` - Inscription

### CESEDA (Droit des Étrangers)

- `POST /api/ceseda/predict` - Prédiction IA taux de succès
- `POST /api/ceseda/analyze` - Analyse document légal
  - Détecte urgence (OQTF, expulsion)
  - Score facteurs positifs

### Gestion des Délais Légaux

- `POST /api/legal/delais/calculer` - Calcul deadline (recours, appel, cassation)
- `GET /api/legal/delais/a-venir` - Prochains délais
- `GET /api/legal/delais/urgents` - Délais critiques (< 7 jours)

### Facturation

- `POST /api/legal/facturation/facture` - Créer facture
- `GET /api/legal/facturation/factures` - Liste factures
- `PATCH /api/legal/facturation/facture/:id` - Modifier facture

### Gestion des Dossiers

- `GET /api/dossiers` - Liste dossiers
- `POST /api/dossiers` - Créer dossier
- `PUT /api/dossiers/:id` - Modifier dossier

### Documents & Email

- `POST /api/documents/generer` - Générer document
- `POST /api/emails/envoyer` - Envoyer email
- `GET /api/templates` - Templates disponibles

### WebHooks

- `POST /api/webhooks/twilio` - WhatsApp/SMS webhooks
- `POST /api/webhooks/mail` - Email webhooks

---

## 🔄 Flux de Communication

```
Frontend (Next.js)
    ↓
Next.js API Routes (/api/**)
    ├─ Auth: Azure AD (NextAuth)
    ├─ Webhooks: Twilio, Email
    └─ Orchestration → Python
    ↓
Backend Flask/FastAPI (http://localhost:5000)
    ├─ Routes métier
    ├─ Services IA (OpenAI/Llama)
    ├─ Intégrations (Microsoft Graph, Azure Blob)
    └─ Database
```

---

## 📦 Dépendances Clés

### Frontend

- `next@16` - Framework React App Router
- `typescript` - Type safety
- `tailwindcss` - Styles
- `prisma` - ORM Database
- `next-auth` - Azure AD auth
- `sentry` - Error tracking

### Backend Python

- `fastapi` ou `flask` - Web framework
- `sqlalchemy` - ORM
- `pydantic` - Data validation
- `openai` - LLM API
- `python-dotenv` - Configuration

---

## 🚀 Commandes Build

### Installation

```bash
# Installer toutes les dépendances
npm run install:all  # ou task: Install: All Dependencies
```

### Développement

```bash
# Démarrer tout (Frontend + Backend)
npm run dev:all  # ou task: Full Stack: Start All

# Individuellement
npm run dev         # Frontend (src/frontend)
npm run dev:backend # Flask Backend
```

### Validation

```bash
# Lint
npm run lint        # Frontend
python -m flake8   # Backend

# Type checking
npm run type-check  # Frontend TSC

# Tests
npm run test        # Frontend
npm run test:backend # Pytest
```

### Build

```bash
npm run build       # Frontend Next.js build
npm run build:backend # Backend FastAPI/Flask
```

---

## ⚠️ Zones à Affiner

### 🔴 Type Checking Frontend

**Problème**: TSC timeout (memory issues)
**Cause**: `src/frontend` contient trop de fichiers
**Solution**:

- Activer `skipLibCheck: true` dans `tsconfig.json`
- Vérifier alias paths
- Limiter scope à fichiers critiques

### 🟡 Routes Manquantes

**Status**: Flask 404 sur route `/`
**Fix**: Ajouter route de santé check

```python
@app.route('/', methods=['GET'])
def health():
    return jsonify({'status': 'OK', 'service': 'MemoLib Backend'})
```

### 🟡 CORS Configuration

**Besoin**: Sécuriser origins en production
**Fichier**: `backend-python/app.py` ligne ~11

```python
CORS(app, origins=['http://localhost:3000', 'https://memolib.fr'])
```

### 🔴 Performance Database

**Index manquants**: Vérifier `prisma/schema.prisma`
**Migrations**: Utiliser `prisma migrate dev`

### 🟡 Secrets Management

**En dev**: `.env.local`
**En prod**: Azure Key Vault (via NextAuth)
**Vérifier**: Aucun secret hardcodé

---

## 📊 Metrics & Monitoring

- **Sentry**: Error tracking (client + server)
- **Lighthouse**: Performance audit
- **OpenNext**: Next.js build optimization
- **Prometheus**: Metrics (optionnel)

---

## 📝 Fichiers de Configuration Clés

| Fichier                 | Rôle                  |
| ----------------------- | --------------------- |
| `next.config.js`        | Next.js build config  |
| `tsconfig.json`         | TypeScript config     |
| `tailwind.config.js`    | Tailwind styles       |
| `open-next.config.ts`   | OpenNext optimization |
| `sentry.*.config.ts`    | Error tracking        |
| `src/backend/config.py` | Backend config        |
| `backend-python/app.py` | Flask app setup       |
| `prisma/schema.prisma`  | Database schema       |

---

## 🔗 Prochaines Étapes

1. ✅ Lancer `Full Stack: Start All` (Frontend + Backend)
2. ✅ Vérifier routes `/api/auth/login` depuis Frontend
3. 🔧 Optimiser TSC (memory issues)
4. 📊 Ajouter monitoring Sentry
5. 🧪 Implémenter E2E tests (Playwright)
