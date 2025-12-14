# 🚀 Installation IAPosteManager v2.2

## Installation Rapide

### Option 1: Docker (Recommandé)
```bash
# Télécharger
git clone https://github.com/user/securevault.git
cd securevault

# Configurer
cp .env.production .env
# Éditer .env avec vos paramètres

# Lancer
docker compose up -d
```

### Option 2: Installation Locale
```bash
# Prérequis: Python 3.8+
pip install -r requirements.txt

# Configuration
cp .env.production .env

# Lancement
python src/web/app.py
```

## Configuration

### 1. Variables d'environnement (.env)
```bash
SECRET_KEY=votre-clé-secrète-unique
FLASK_ENV=production
DATABASE_URL=sqlite:///data/production.db
```

### 2. Premier démarrage
1. Accéder à http://localhost:5000
2. Créer mot de passe maître (12+ caractères)
3. Configurer Gmail/Outlook (App Password requis)
4. Optionnel: Ajouter clé OpenAI

## Sécurité

- ✅ Chiffrement AES-256 des credentials
- ✅ Sessions sécurisées HTTPS
- ✅ Validation des entrées
- ✅ Protection CSRF
- ✅ Rate limiting

## Support

- 📧 Email: support@securevault.com
- 📖 Docs: https://docs.securevault.com
- 🐛 Issues: https://github.com/user/securevault/issues