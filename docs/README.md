# 🔐 SecureVault v2.0 - Email Automation System

> Système d'automatisation d'emails avec IA, chiffrement AES-256, et fonctionnalités avancées

## 🚀 Démarrage Rapide

```bash
# Installation
pip install -r requirements.txt

# Lancer l'application web
python src/web/app.py

# Lancer l'interface GUI
python gui/main_app.py

# Lancer l'inscription
python gui/inscription.py
```

**URL**: http://127.0.0.1:5000

## ✨ Fonctionnalités

### Sécurité
- 🔒 Chiffrement AES-256 (Fernet)
- 🔑 PBKDF2 600,000 itérations
- 🛡️ Authentification 2FA (TOTP)
- 🔄 Rotation automatique des clés
- 📝 Audit trail complet

### Email
- 📧 Génération automatique avec IA
- 📅 Planification d'envois
- 🎤 Transcription vocale (Whisper)
- 📊 Analytics en temps réel

### Paiement
- 💳 Intégration Stripe
- 💰 Paiements sécurisés
- 📈 Tracking transactions

## 📁 Structure du Projet

```
iaPostemanage/
├── src/              # Code source
│   ├── core/         # Modules essentiels
│   ├── security/     # Sécurité (2FA, audit)
│   ├── email/        # Gestion emails
│   ├── ai/           # Intelligence artificielle
│   ├── payment/      # Paiements
│   ├── user/         # Utilisateurs
│   ├── analytics/    # Analytics
│   └── web/          # Application Flask
├── gui/              # Interfaces Tkinter
├── tests/            # Tests automatisés
├── docs/             # Documentation
├── config/           # Configuration
└── data/             # Données
```

## 📚 Documentation

- [Installation](INSTALLATION.md)
- [Démarrage Rapide](QUICKSTART.md)
- [Fonctionnalités](FEATURES.md)
- [Sécurité](SECURITY.md)
- [API](API.md)

## 🔧 Configuration

Créer `.env`:
```env
FLASK_ENV=development
SECRET_KEY=your-secret-key
STRIPE_API_KEY=sk_test_...
OPENAI_API_KEY=sk-...
```

## 🧪 Tests

```bash
# Tous les tests
pytest tests/ -v

# Avec couverture
pytest tests/ --cov=src --cov-report=html
```

## 📊 Versions

- **v2.0.0** - Restructuration complète, architecture modulaire
- **v1.0.0** - Version initiale

## 📄 Licence

Licence Commerciale - Voir [LICENCE_COMMERCIALE.md](../LICENCE_COMMERCIALE.md)

## 👥 Support

Email: support@securevault.com
