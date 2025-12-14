# ✅ Backend Minimal - Prêt à Utiliser

## 🎯 Fonctionnalités Implémentées

### 1. **Inscription Utilisateur**
- `POST /api/users/register` - Crée user + email interne automatique
- Génère `prenom.nom@dev.local` (unique)
- Stocke email perso pour notifications

### 2. **Génération IA**
- `POST /api/ai/generate-mail` - Texte + audio → email
- Transcription Whisper (local/API/fallback)
- Génération OpenAI ou templates heuristiques

### 3. **Envoi Email**
- `POST /api/mails/send` - Envoi via MailHog (dev) ou SES (prod)
- Historique en DB
- Support pièces jointes

### 4. **Réception Webhook**
- `POST /api/inbound/webhook` - Reçoit réponses
- Forward automatique vers email perso
- Support SES/Mailgun

## 🚀 Démarrage Rapide

### Option 1: Docker (Recommandé)
```bash
# Copier config
cp .env.minimal .env

# Lancer stack complète
docker-compose -f docker-compose.minimal.yml up --build

# Vérifier services
curl http://localhost:8000/health
```

### Option 2: Local
```bash
cd backend_minimal

# Créer venv
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Installer dépendances
pip install -r requirements.txt

# Configurer DB (SQLite local)
export DATABASE_URL="sqlite:///./app.db"
export MAIL_MODE="dev"
export MAILHOG_HOST="localhost"

# Lancer API
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 📊 Services Disponibles

| Service | URL | Description |
|---------|-----|-------------|
| API | http://localhost:8000 | Backend FastAPI |
| MailHog | http://localhost:8025 | Interface emails dev |
| MinIO | http://localhost:9001 | Stockage fichiers |
| PostgreSQL | localhost:5432 | Base de données |

## 🧪 Tests Rapides

### 1. Health Check
```bash
curl http://localhost:8000/health
```

### 2. Inscription User
```bash
curl -X POST http://localhost:8000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Dupont",
    "prenom": "Jean",
    "email_notification": "jean.dupont@gmail.com"
  }'
```

### 3. Génération Email
```bash
curl -X POST http://localhost:8000/api/ai/generate-mail \
  -F "text=Je souhaite obtenir un acte de naissance" \
  -F "user_name=Jean Dupont" \
  -F "email_type=demande"
```

### 4. Envoi Email
```bash
curl -X POST http://localhost:8000/api/mails/send \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "to_addr": "test@example.com",
    "subject": "Test Email",
    "body": "Ceci est un test",
    "ai_generated": true
  }'
```

### 5. Vérifier MailHog
Ouvrir http://localhost:8025 pour voir les emails envoyés

## 📁 Structure Créée

```
backend_minimal/
├── main.py                 # FastAPI app
├── requirements.txt        # Dépendances
├── Dockerfile             # Container
├── core/
│   ├── database.py        # DB config
│   └── config.py          # Settings
├── models/
│   ├── user.py           # Model User
│   └── mail.py           # Model Mail
├── api/
│   ├── users.py          # API users
│   ├── ai.py             # API IA
│   ├── mails.py          # API emails
│   └── inbound.py        # Webhooks
└── services/
    ├── mailer.py         # Envoi emails
    ├── transcriber.py    # Transcription
    └── ai_engine.py      # Génération IA
```

## 🔧 Configuration

### Variables .env
```bash
# Base de données
DATABASE_URL=postgresql://dev:dev@db:5432/appdb

# Mode email (dev=MailHog, prod=SES)
MAIL_MODE=dev

# Domaine pour emails internes
DOMAIN=dev.local

# OpenAI (optionnel)
OPENAI_API_KEY=sk-...
```

## 📋 Endpoints API

### Users
- `POST /api/users/register` - Inscription
- `GET /api/users/{id}` - Détails user
- `GET /api/users/` - Liste users

### AI
- `POST /api/ai/generate-mail` - Génération email
- `POST /api/ai/transcribe` - Transcription seule

### Mails
- `POST /api/mails/send` - Envoi email
- `GET /api/mails/user/{id}` - Emails d'un user
- `GET /api/mails/{id}` - Détails email

### Inbound
- `POST /api/inbound/webhook` - Webhook réception
- `POST /api/inbound/test` - Test forward

## 🎯 Workflow Complet

```
1. User s'inscrit → email interne généré
   ↓
2. User saisit texte/audio → transcription
   ↓
3. IA génère subject + body
   ↓
4. User valide → envoi email
   ↓
5. Réponse reçue → forward email perso
```

## 🔄 Prochaines Étapes

1. **Frontend minimal** - Formulaire HTML/JS
2. **Tests E2E** - Workflow complet
3. **Production** - Migration SES/S3
4. **Sécurité** - Auth, validation
5. **Monitoring** - Logs, métriques

## 📞 Support

### Logs
```bash
# Docker
docker-compose logs -f api

# Local
tail -f app.log
```

### Debug
- API docs: http://localhost:8000/docs
- MailHog: http://localhost:8025
- MinIO: http://localhost:9001

---

**Status**: ✅ Backend complet et fonctionnel  
**Temps**: ~2h d'implémentation  
**Prêt pour**: Frontend + tests + production