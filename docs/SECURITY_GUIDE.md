# 🔒 GUIDE DE SÉCURITÉ - IA POSTE MANAGER

## 📋 TABLE DES MATIÈRES

1. [Configuration initiale](#configuration-initiale)
2. [Gestion des clés et secrets](#gestion-des-clés-et-secrets)
3. [Utilisation dans le code](#utilisation-dans-le-code)
4. [Bonnes pratiques](#bonnes-pratiques)
5. [Checklist de sécurité](#checklist-de-sécurité)
6. [Conformité RGPD](#conformité-rgpd)

---

## 🚀 CONFIGURATION INITIALE

### 1. Installer les dépendances

```bash
pip install cryptography pyjwt python-dotenv
```

### 2. Générer la clé maître

```python
# Script pour générer une clé maître sécurisée
import secrets

master_key = secrets.token_urlsafe(32)
print(f"MASTER_ENCRYPTION_KEY={master_key}")
```

**⚠️ IMPORTANT** : Copiez cette clé dans votre fichier `.env` et **ne la partagez JAMAIS**.

### 3. Configurer les variables d'environnement

```bash
# Copier le template
cp .env.template .env

# Éditer avec vos vraies valeurs
# ATTENTION : Ne jamais commiter .env dans Git !
```

### 4. Vérifier que .env est dans .gitignore

```bash
# Vérifier
cat .gitignore | grep ".env"

# Doit afficher :
# .env
# .env.local
# *.env
```

---

## 🔐 GESTION DES CLÉS ET SECRETS

### Architecture de sécurité

```
┌─────────────────────────────────────────┐
│   Variables d'environnement (.env)      │ ← Niveau 1 : Secrets en clair
│   - Jamais committées dans Git          │
│   - Chargées au runtime uniquement      │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│   SecureSecretsManager                  │ ← Niveau 2 : Gestionnaire centralisé
│   - Cache mémoire (5 min TTL)           │
│   - Audit de tous les accès             │
│   - Support Azure Key Vault / AWS       │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│   Fichier chiffré (credentials.enc)     │ ← Niveau 3 : Stockage chiffré
│   - AES-256-GCM                         │
│   - Backup automatique                  │
└─────────────────────────────────────────┘
```

### Hiérarchie des secrets

1. **Variables d'environnement** (prioritaire)
   - Utilisées en production
   - Définies par le système de déploiement
   
2. **Azure Key Vault / AWS Secrets Manager** (optionnel)
   - Pour les environnements cloud
   - Rotation automatique des clés
   
3. **Fichier chiffré local** (fallback)
   - Pour le développement local
   - Chiffré avec la clé maître

---

## 💻 UTILISATION DANS LE CODE

### Exemple 1 : Récupérer un secret

```python
from security.secrets_manager import get_secret

# Simple
openai_key = get_secret('OPENAI_API_KEY')

# Avec valeur par défaut
smtp_host = get_secret('SMTP_HOST', default='smtp.gmail.com')

# Sans chercher dans les variables d'environnement
db_password = get_secret('DB_PASSWORD', use_env=False)
```

### Exemple 2 : Définir un secret

```python
from security.secrets_manager import set_secret

# Définir et sauvegarder
set_secret('NEW_API_KEY', 'sk-xxx...', save=True)

# Rotation de clé
from security.secrets_manager import get_secrets_manager

secrets_mgr = get_secrets_manager()
secrets_mgr.rotate_secret('OPENAI_API_KEY', 'nouvelle-valeur')
```

### Exemple 3 : Chiffrer des données utilisateur

```python
from security.encryption import get_encryption

encryption = get_encryption()

# Chiffrer du texte
email_content = "Contenu sensible..."
encrypted = encryption.encrypt_text(email_content)

# Déchiffrer
decrypted = encryption.decrypt_text(encrypted)

# Chiffrer un fichier
encryption.encrypt_file('document.pdf', 'document.pdf.enc')
```

### Exemple 4 : Protéger une route API

```python
from flask import Flask, jsonify
from security.middleware import get_security

app = Flask(__name__)
security = get_security()

@app.route('/api/protected')
@security.require_auth(roles=['admin'])
@security.rate_limit(max_requests=10, time_window=60)
def protected_route():
    # L'utilisateur est accessible via g.current_user
    from flask import g
    user_id = g.current_user['user_id']
    
    return jsonify({'message': 'OK', 'user': user_id})
```

### Exemple 5 : Générer et vérifier un JWT

```python
from security.middleware import get_security

security = get_security()

# Générer un token
token = security.generate_jwt_token(
    user_id='123',
    email='user@example.com',
    roles=['user', 'admin'],
    extra_claims={'tenant_id': 'acme-corp'}
)

# Vérifier un token
payload = security.verify_jwt_token(token)
if payload:
    print(f"Token valide pour {payload['email']}")
else:
    print("Token invalide ou expiré")
```

### Exemple 6 : Anonymiser des données (RGPD)

```python
from security.encryption import get_encryption

encryption = get_encryption()

# Anonymiser un email (irréversible)
email_hash = encryption.anonymize_email('user@example.com')
# Résultat : "a3b5c7d9e1f2g4h6"

# Anonymiser du texte en conservant la longueur
text = "Nom Prénom, 123 Rue Example"
anonymized = encryption.anonymize_text(text, keep_length=True)
# Résultat : "XXX XXXXXXX XXX XXX XXXXXXX"
```

---

## ✅ BONNES PRATIQUES

### ❌ À NE JAMAIS FAIRE

```python
# ❌ Hardcoder des clés dans le code
OPENAI_API_KEY = "sk-proj-xxx..."

# ❌ Logger des secrets
logger.info(f"API Key: {api_key}")

# ❌ Envoyer des secrets dans les réponses API
return jsonify({'api_key': api_key})

# ❌ Stocker des secrets non chiffrés
with open('secrets.json', 'w') as f:
    json.dump({'password': 'secret123'}, f)
```

### ✅ À FAIRE

```python
# ✅ Utiliser le gestionnaire de secrets
from security.secrets_manager import get_secret
api_key = get_secret('OPENAI_API_KEY')

# ✅ Logger sans valeurs sensibles
logger.info("API key chargée avec succès")

# ✅ Ne jamais exposer les secrets
return jsonify({'status': 'authenticated'})

# ✅ Chiffrer avant de stocker
from security.encryption import encrypt
encrypted_data = encrypt(sensitive_data)
```

### Validation des entrées

```python
from security.middleware import get_security

security = get_security()

# Valider avant traitement
user_input = request.json.get('query')

if not security.validate_input(user_input):
    return jsonify({'error': 'Entrée invalide'}), 400

# Nettoyer les entrées
clean_input = security.sanitize_input(user_input)
```

### Rotation des clés

```bash
# Planifier une rotation mensuelle
# Cron : 0 0 1 * * (chaque 1er du mois)

python scripts/rotate_keys.py
```

---

## 📝 CHECKLIST DE SÉCURITÉ

### Avant chaque déploiement

- [ ] Toutes les clés API sont dans `.env` ou Key Vault
- [ ] `.env` n'est **PAS** dans Git (vérifier `.gitignore`)
- [ ] Les fichiers `credentials.enc` sont chiffrés
- [ ] Aucun secret hardcodé dans le code (grep "sk-", "password", etc.)
- [ ] Les routes sensibles ont `@require_auth`
- [ ] Rate limiting activé sur les endpoints publics
- [ ] Audit trail activé et fonctionnel
- [ ] Certificats SSL à jour (si HTTPS)
- [ ] Variables d'environnement configurées en production
- [ ] Backups automatiques configurés

### Audit mensuel

- [ ] Rotation des clés API (OpenAI, Azure, AWS, etc.)
- [ ] Vérification des logs d'audit pour anomalies
- [ ] Mise à jour des dépendances de sécurité
- [ ] Test des sauvegardes chiffrées
- [ ] Revue des permissions utilisateurs
- [ ] Analyse des tentatives d'accès non autorisé

### Conformité RGPD

- [ ] Données personnelles chiffrées au repos
- [ ] Anonymisation pour les logs et analytics
- [ ] Droit à l'oubli implémenté
- [ ] Export de données utilisateur possible
- [ ] Audit trail de tous les accès aux données
- [ ] Consentement utilisateur enregistré
- [ ] Politique de rétention respectée

---

## 🛡️ CONFORMITÉ RGPD

### Chiffrement des données personnelles

```python
from security.encryption import get_encryption

encryption = get_encryption()

# Avant stockage
user_data = {
    'email': 'user@example.com',
    'phone': '+33612345678',
    'address': '123 Rue Example'
}

encrypted_data = {
    'email': encryption.encrypt_text(user_data['email']),
    'phone': encryption.encrypt_text(user_data['phone']),
    'address': encryption.encrypt_text(user_data['address'])
}
```

### Anonymisation pour les logs

```python
from security.encryption import get_encryption

encryption = get_encryption()

# Pour les logs et analytics
logger.info(f"Email traité : {encryption.anonymize_email(user_email)}")
# Log : "Email traité : a3b5c7d9e1f2g4h6"
```

### Droit à l'oubli

```python
from security.secrets_manager import get_secrets_manager
from security.encryption import get_encryption

def delete_user_data(user_id: str):
    """Supprime toutes les données d'un utilisateur (RGPD)"""
    
    # 1. Supprimer des bases de données
    db.delete_user(user_id)
    
    # 2. Supprimer les fichiers uploadés
    user_files = Path(f'data/uploads/{user_id}')
    if user_files.exists():
        shutil.rmtree(user_files)
    
    # 3. Anonymiser les logs (garder pour audit)
    anonymize_user_in_logs(user_id)
    
    # 4. Supprimer les secrets utilisateur
    secrets_mgr = get_secrets_manager()
    secrets_mgr.delete_secret(f'USER_{user_id}_TOKEN')
    
    logger.info(f"Données utilisateur {user_id} supprimées (RGPD)")
```

---

## 🚨 EN CAS DE FUITE DE SECRET

### Procédure d'urgence

1. **Révoquer immédiatement** la clé compromise
2. **Générer une nouvelle clé** via le provider
3. **Mettre à jour** `.env` et le vault
4. **Redéployer** l'application
5. **Auditer** les logs pour détecter une utilisation malveillante
6. **Notifier** les utilisateurs si nécessaire (RGPD)

```python
# Script de rotation d'urgence
from security.secrets_manager import get_secrets_manager

secrets_mgr = get_secrets_manager()

# Révoquer et remplacer
secrets_mgr.rotate_secret('OPENAI_API_KEY', 'nouvelle-clé-sécurisée')
secrets_mgr.rotate_secret('JWT_SECRET_KEY', secrets.token_urlsafe(64))

print("✅ Clés rotées avec succès")
```

---

## 📞 SUPPORT

Pour toute question de sécurité :
- 📧 Email : security@iapostemanager.com
- 🔒 PGP Key : [Clé publique]
- 🚨 Incident : https://security.iapostemanager.com/report

**En cas de vulnérabilité critique, contactez immédiatement l'équipe de sécurité.**

---

## 📚 RESSOURCES

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [ANSSI - Recommandations cryptographiques](https://www.ssi.gouv.fr/)
- [CNIL - Guide RGPD](https://www.cnil.fr/fr/rgpd-de-quoi-parle-t-on)
- [Azure Key Vault Best Practices](https://docs.microsoft.com/azure/key-vault/)
- [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)

---

**Dernière mise à jour** : 28 décembre 2025  
**Version** : 1.0.0
