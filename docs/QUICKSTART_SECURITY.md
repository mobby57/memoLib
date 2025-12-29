# 🚀 GUIDE RAPIDE - Intégration des clés API

## ⚡ Démarrage en 5 minutes

### 1️⃣ Installer les dépendances

```bash
pip install cryptography pyjwt python-dotenv
```

### 2️⃣ Initialiser la sécurité

```bash
python scripts/init_security.py
```

Ce script va :
- ✅ Générer automatiquement toutes les clés de sécurité
- ✅ Créer le fichier `.env` depuis le template
- ✅ Initialiser le gestionnaire de secrets
- ✅ Vérifier la configuration

### 3️⃣ Ajouter vos API keys

Éditez le fichier `.env` créé et ajoutez vos clés :

```bash
# Clés déjà générées automatiquement ✅
MASTER_ENCRYPTION_KEY=xxx...
JWT_SECRET_KEY=xxx...
FLASK_SECRET_KEY=xxx...

# À compléter avec vos vraies clés 👇
OPENAI_API_KEY=sk-proj-votre-clé-ici
SMTP_USERNAME=votre@email.com
SMTP_PASSWORD=votre-mot-de-passe
```

### 4️⃣ Utiliser dans votre code

```python
# Simple et sécurisé !
from security.secrets_manager import get_secret

openai_key = get_secret('OPENAI_API_KEY')
smtp_password = get_secret('SMTP_PASSWORD')
```

### 5️⃣ Tester

```bash
python scripts/test_security.py
```

---

## 📖 Exemples d'utilisation

### Protéger une route API

```python
from flask import Flask, jsonify, g
from security.middleware import get_security

app = Flask(__name__)
security = get_security()

@app.route('/api/emails')
@security.require_auth(roles=['user'])
@security.rate_limit(max_requests=30, time_window=60)
def get_emails():
    # Utilisateur authentifié disponible dans g.current_user
    user_id = g.current_user['user_id']
    return jsonify({'emails': []})
```

### Chiffrer des données sensibles

```python
from security.encryption import get_encryption

encryption = get_encryption()

# Chiffrer
email_content = "Message confidentiel..."
encrypted = encryption.encrypt_text(email_content)

# Déchiffrer plus tard
decrypted = encryption.decrypt_text(encrypted)
```

### Générer un token JWT

```python
from security.middleware import get_security

security = get_security()

# Lors de la connexion
token = security.generate_jwt_token(
    user_id='123',
    email='user@example.com',
    roles=['user', 'admin']
)

# Le client utilise ce token dans le header :
# Authorization: Bearer <token>
```

---

## 🔐 Points clés de sécurité

### ✅ À FAIRE

```python
# Utiliser le gestionnaire de secrets
from security.secrets_manager import get_secret
api_key = get_secret('OPENAI_API_KEY')

# Chiffrer avant stockage
from security.encryption import encrypt
encrypted_data = encrypt(sensitive_data)

# Protéger les routes
@security.require_auth()
def protected_route():
    pass
```

### ❌ À NE JAMAIS FAIRE

```python
# ❌ Hardcoder des clés
API_KEY = "sk-proj-xxx..."

# ❌ Logger des secrets
logger.info(f"Key: {api_key}")

# ❌ Commiter .env dans Git
# ❌ Envoyer des secrets dans les réponses API
```

---

## 📁 Structure de sécurité

```
iaPostemanage/
├── .env                          # Secrets (JAMAIS dans Git)
├── .env.template                 # Template (sans valeurs)
├── .gitignore                    # .env est dedans ✅
│
├── security/
│   ├── secrets_manager.py        # Gestionnaire centralisé
│   ├── encryption.py             # Chiffrement AES/RSA
│   └── middleware.py             # JWT, rate limiting, audit
│
├── scripts/
│   ├── init_security.py          # Initialisation auto
│   └── test_security.py          # Tests complets
│
└── docs/
    └── SECURITY_GUIDE.md         # Guide complet
```

---

## 🛡️ Checklist de déploiement

Avant de déployer en production :

- [ ] `.env` n'est **PAS** dans Git (vérifier `.gitignore`)
- [ ] Toutes les clés API sont dans `.env` ou Azure Key Vault
- [ ] `MASTER_ENCRYPTION_KEY` est sauvegardée en lieu sûr
- [ ] Les routes sensibles ont `@require_auth`
- [ ] Rate limiting activé sur les endpoints publics
- [ ] Tests de sécurité passés (`python scripts/test_security.py`)

---

## 🆘 Aide rapide

### La clé maître est perdue ?

```bash
# Générer une nouvelle clé
python -c "import secrets; print(secrets.token_urlsafe(32))"

# ⚠️ Vous devrez reconfigurer tous les secrets
```

### Erreur "MASTER_ENCRYPTION_KEY manquante" ?

```bash
# Vérifier que .env existe
ls -la .env

# Relancer l'initialisation
python scripts/init_security.py
```

### Tester rapidement

```python
# Dans un terminal Python
from security.secrets_manager import get_secret

# Doit retourner une valeur
print(get_secret('MASTER_ENCRYPTION_KEY'))
```

---

## 📚 Documentation complète

Pour plus de détails : **[docs/SECURITY_GUIDE.md](./SECURITY_GUIDE.md)**

---

**Créé le** : 28 décembre 2025  
**Pour** : IA Poste Manager MVP
