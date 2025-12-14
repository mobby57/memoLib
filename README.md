# IAPosteManager v2.2 - Email Automation avec IA

Application web Flask complète pour automatiser l'envoi d'emails avec génération IA, interface vocale et sécurité avancée.

## 🚀 Démarrage Rapide

### Option 1: Docker (Recommandé)
```bash
docker compose up --watch
```

### Option 2: Local
```bash
python src\web\app.py
```

**URL:** http://127.0.0.1:5000

## 📁 Structure du Projet

```
iaPostemanage/
├── src/
│   ├── web/app.py              # Application Flask principale
│   ├── core/                   # Configuration, crypto, database
│   │   ├── config.py
│   │   ├── crypto_utils.py
│   │   └── database.py
│   ├── services/               # Services email, IA, notifications
│   │   ├── ai_service.py
│   │   ├── email_service.py
│   │   └── voice_service.py
│   ├── accessibility/          # TTS, transcription vocale
│   ├── security/               # Audit, 2FA, rotation clés
│   ├── analytics/              # Dashboard statistiques
│   └── payment/                # Intégration Stripe
├── templates/                  # Pages HTML (Jinja2)
├── static/                     # CSS, JS, assets
├── data/                       # Données chiffrées
│   ├── credentials.enc
│   ├── salt.bin
│   └── metadata.json
├── tests/                      # Tests unitaires/intégration
├── docs/                       # Documentation API
├── deploy/                     # Configs déploiement
└── docker-compose.yml          # Orchestration Docker
```

## ⚙️ Configuration

### 1. Variables d'environnement
```bash
cp .env.example .env
```

### 2. Configuration initiale
1. Accéder à http://127.0.0.1:5000
2. Créer mot de passe maître (8+ caractères)
3. Ajouter Gmail/Outlook App Password
4. (Optionnel) Ajouter clé OpenAI pour l'IA

## 🎯 Fonctionnalités

### Core
- ✅ Envoi emails SMTP (Gmail, Outlook, custom)
- ✅ Génération IA (OpenAI GPT)
- ✅ Templates d'emails personnalisables
- ✅ Chiffrement AES-256 des credentials
- ✅ Interface web responsive

### Avancées
- 🎤 **Interface vocale** (TTS, reconnaissance vocale)
- 📊 **Analytics** (statistiques, historique)
- 🔐 **Sécurité** (audit trail, 2FA, rotation clés)
- 📱 **Accessibilité** (mode sombre, TTS)
- 🔄 **Automation** (envoi en masse, planification)
- 💳 **Paiements** (intégration Stripe)
- 🌐 **API REST** (endpoints documentés)

### Interfaces
- `/` - Dashboard principal
- `/composer` - Compositeur d'emails avec IA
- `/agent` - Agent IA vocal
- `/send` - Envoi simple
- `/api/` - API REST

## 🛠️ Installation

### Prérequis
- Python 3.8+
- Docker (optionnel)
- Compte Gmail/Outlook avec App Password
- Clé OpenAI (optionnel)

### Dépendances
```bash
pip install -r requirements.txt
```

**Principales dépendances:**
- Flask 3.0.0 (framework web)
- cryptography (chiffrement)
- openai (génération IA)
- pyttsx3 (synthèse vocale)
- SpeechRecognition (reconnaissance vocale)
- stripe (paiements)
- boto3 (AWS SES)

## 🔐 Sécurité

- **Chiffrement**: AES-256 avec Fernet
- **Dérivation clé**: PBKDF2HMAC (600k itérations)
- **Audit trail**: Traçabilité complète
- **2FA**: Authentification à deux facteurs
- **Rotation**: Rotation automatique des clés
- **Sessions**: Gestion sécurisée des sessions

## 📚 Documentation

- [Guide d'utilisation](GUIDE_UTILISATION.md)
- [Documentation API](docs/API_DOCUMENTATION.md)
- [Guide démarrage rapide](docs/QUICKSTART.md)

## 🧪 Tests

```bash
# Tests unitaires
pytest tests/unit/

# Tests d'intégration
pytest tests/integration/

# Tests E2E
pytest tests/e2e/
```

## 🚀 Déploiement

### Docker
```bash
docker compose up -d
```

### Cloud
- Heroku: `deploy/heroku.yml`
- Railway: `deploy/railway.json`
- Render: `deploy/render.yaml`

## 📈 Version

**v2.2.0** - Dernière version stable

- Interface vocale complète
- Analytics avancées
- Sécurité renforcée
- API REST documentée
- Support multi-plateforme
