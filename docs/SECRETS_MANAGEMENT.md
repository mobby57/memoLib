# 🔐 Guide de Gestion des Secrets - IA Poste Manager

**Date** : 2 janvier 2026  
**Version** : 1.0  
**Classification** : Confidentiel - Usage interne uniquement

---

## Table des matières

1. [Principes fondamentaux](#1-principes-fondamentaux)
2. [Types de secrets](#2-types-de-secrets)
3. [Gestionnaires de secrets supportés](#3-gestionnaires-de-secrets-supportés)
4. [Procédures opérationnelles](#4-procédures-opérationnelles)
5. [Rotation des secrets](#5-rotation-des-secrets)
6. [Accès et audits](#6-accès-et-audits)
7. [Urgences et incidents](#7-urgences-et-incidents)

---

## 1. Principes fondamentaux

### 1.1 Règles d'or

**❌ JAMAIS** :
- Stocker des secrets en clair dans le code source
- Committer des fichiers `.env` avec des valeurs réelles
- Partager des secrets par email ou chat non chiffré
- Utiliser le même secret en dev et production
- Hardcoder des clés API dans le code

**✅ TOUJOURS** :
- Utiliser un gestionnaire de secrets centralisé
- Chiffrer les secrets au repos et en transit
- Appliquer le principe du moindre privilège
- Activer MFA pour accès aux secrets
- Documenter tous les accès

### 1.2 Architecture de sécurité

```
Application
    ↓
Secrets Manager (HashiCorp Vault / AWS Secrets / Azure KeyVault)
    ↓
Secrets chiffrés (AES-256)
    ↓
Audit Trail
```

## 2. Types de secrets

### 2.1 Inventaire des secrets

| Type | Exemples | Criticité | Rotation |
|------|----------|-----------|----------|
| **API Keys** | OpenAI, SendGrid, Twilio | 🔴 Critique | 90 jours |
| **Database** | PostgreSQL, MongoDB credentials | 🔴 Critique | 90 jours |
| **JWT Secrets** | Signature keys | 🔴 Critique | 180 jours |
| **OAuth** | Client secrets, refresh tokens | 🟡 Élevée | 90 jours |
| **Encryption Keys** | AES keys, master keys | 🔴 Critique | 180 jours |
| **Certificats SSL** | TLS certificates | 🟡 Élevée | 365 jours |
| **Cloud** | AWS access keys, Azure credentials | 🔴 Critique | 90 jours |
| **SMTP** | Email server passwords | 🟢 Modérée | 180 jours |

### 2.2 Classification

**Critique (🔴)** :
- Accès aux données clients
- Clés de chiffrement
- Credentials production

**Élevée (🟡)** :
- Accès services tiers
- Certificats
- Tokens longue durée

**Modérée (🟢)** :
- Credentials développement
- Tokens temporaires
- Services non critiques

## 3. Gestionnaires de secrets supportés

### 3.1 HashiCorp Vault (Recommandé)

**Installation** :
```bash
# Installation Vault
wget https://releases.hashicorp.com/vault/1.15.0/vault_1.15.0_linux_amd64.zip
unzip vault_1.15.0_linux_amd64.zip
sudo mv vault /usr/local/bin/

# Démarrage
vault server -dev
export VAULT_ADDR='http://127.0.0.1:8200'
```

**Configuration** :
```bash
# Initialisation
vault operator init

# Unsealing (utiliser 3 des 5 clés)
vault operator unseal <key1>
vault operator unseal <key2>
vault operator unseal <key3>

# Authentification
vault login <root-token>
```

**Stockage de secrets** :
```bash
# Créer un secret
vault kv put secret/iapostemanager/openai \
    api_key="sk-..." \
    org_id="org-..."

# Lire un secret
vault kv get secret/iapostemanager/openai

# Lister les secrets
vault kv list secret/iapostemanager/
```

**Intégration Python** :
```python
# /backend/security/vault_integration.py
import hvac

class VaultClient:
    def __init__(self):
        self.client = hvac.Client(
            url='http://vault:8200',
            token=os.getenv('VAULT_TOKEN')
        )
    
    def get_secret(self, path):
        """Récupérer un secret depuis Vault"""
        response = self.client.secrets.kv.v2.read_secret_version(
            path=path,
            mount_point='secret'
        )
        return response['data']['data']
    
    def set_secret(self, path, secret_data):
        """Stocker un secret dans Vault"""
        self.client.secrets.kv.v2.create_or_update_secret(
            path=path,
            secret=secret_data,
            mount_point='secret'
        )
```

### 3.2 AWS Secrets Manager

**Configuration** :
```bash
# Installation AWS CLI
pip install awscli boto3

# Configuration
aws configure
```

**Stockage de secrets** :
```bash
# Créer un secret
aws secretsmanager create-secret \
    --name iapostemanager/openai \
    --secret-string '{"api_key":"sk-...","org_id":"org-..."}'

# Récupérer un secret
aws secretsmanager get-secret-value \
    --secret-id iapostemanager/openai
```

**Intégration Python** :
```python
import boto3
import json

class AWSSecretsManager:
    def __init__(self, region='eu-west-1'):
        self.client = boto3.client('secretsmanager', region_name=region)
    
    def get_secret(self, secret_name):
        """Récupérer un secret depuis AWS Secrets Manager"""
        response = self.client.get_secret_value(SecretId=secret_name)
        return json.loads(response['SecretString'])
    
    def create_secret(self, secret_name, secret_value):
        """Créer un secret dans AWS Secrets Manager"""
        self.client.create_secret(
            Name=secret_name,
            SecretString=json.dumps(secret_value)
        )
```

### 3.3 Azure Key Vault

**Configuration** :
```bash
# Installation Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Connexion
az login

# Créer un Key Vault
az keyvault create \
    --name iapostemanager-vault \
    --resource-group production \
    --location westeurope
```

**Stockage de secrets** :
```bash
# Créer un secret
az keyvault secret set \
    --vault-name iapostemanager-vault \
    --name openai-api-key \
    --value "sk-..."

# Récupérer un secret
az keyvault secret show \
    --vault-name iapostemanager-vault \
    --name openai-api-key
```

**Intégration Python** :
```python
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient

class AzureKeyVaultManager:
    def __init__(self, vault_url):
        credential = DefaultAzureCredential()
        self.client = SecretClient(vault_url=vault_url, credential=credential)
    
    def get_secret(self, secret_name):
        """Récupérer un secret depuis Azure Key Vault"""
        return self.client.get_secret(secret_name).value
    
    def set_secret(self, secret_name, secret_value):
        """Stocker un secret dans Azure Key Vault"""
        self.client.set_secret(secret_name, secret_value)
```

## 4. Procédures opérationnelles

### 4.1 Ajout d'un nouveau secret

**Procédure** :
1. **Demande** : Remplir le formulaire de demande
2. **Validation** : Approbation par Tech Lead + Security Officer
3. **Génération** : Créer le secret (strong password/key)
4. **Stockage** : Ajouter au gestionnaire de secrets
5. **Configuration** : Mettre à jour l'application
6. **Documentation** : Documenter dans l'inventaire
7. **Test** : Vérifier le fonctionnement
8. **Audit** : Enregistrer dans l'audit trail

**Template de demande** :
```markdown
# Demande d'ajout de secret

**Demandeur** : [Nom]
**Date** : [YYYY-MM-DD]
**Environnement** : [dev/staging/production]

**Type de secret** : [API Key/Database/etc.]
**Nom** : [nom-du-secret]
**Service** : [service concerné]
**Justification** : [pourquoi ce secret est nécessaire]
**Criticité** : [Critique/Élevée/Modérée]
**Rotation** : [90/180/365 jours]

**Approbations** :
- [ ] Tech Lead
- [ ] Security Officer
```

### 4.2 Variables d'environnement

**Fichier .env.example** :
```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-key-here
OPENAI_ORG_ID=org-your-org-here

# Database
DATABASE_URL=postgresql://user:password@host:port/db
DB_ENCRYPTION_KEY=your-encryption-key

# JWT
JWT_SECRET_KEY=your-jwt-secret
JWT_ALGORITHM=HS256

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password

# Azure/AWS (if using)
AZURE_KEYVAULT_URL=https://your-vault.vault.azure.net
AWS_REGION=eu-west-1
```

**❌ NE JAMAIS committer** :
- `.env`
- `.env.production`
- `.env.local`
- Tout fichier contenant des secrets réels

**✅ TOUJOURS versionner** :
- `.env.example` (avec valeurs factices)
- `.env.template` (avec descriptions)

**Fichier .gitignore** :
```
# Secrets
.env
.env.local
.env.production
.env.*.local
secrets/
*.key
*.pem
credentials.json
```

### 4.3 Chargement des secrets

**Dans l'application** :
```python
# /backend/config/secrets_loader.py
import os
from backend.security.secrets_manager import SecretsManager

class Config:
    """Configuration avec chargement sécurisé des secrets"""
    
    def __init__(self):
        self.env = os.getenv('ENVIRONMENT', 'development')
        self.secrets = SecretsManager()
    
    def get_openai_key(self):
        """Récupérer la clé OpenAI"""
        if self.env == 'production':
            return self.secrets.get('openai/api_key')
        else:
            return os.getenv('OPENAI_API_KEY')
    
    def get_database_url(self):
        """Récupérer l'URL de la base de données"""
        if self.env == 'production':
            return self.secrets.get('database/url')
        else:
            return os.getenv('DATABASE_URL')
```

## 5. Rotation des secrets

### 5.1 Calendrier de rotation

| Secret | Fréquence | Dernier changement | Prochain |
|--------|-----------|-------------------|----------|
| OpenAI API Key | 90 jours | 2026-01-02 | 2026-04-02 |
| Database Password | 90 jours | 2026-01-02 | 2026-04-02 |
| JWT Secret | 180 jours | 2026-01-02 | 2026-07-01 |
| SSL Certificate | 365 jours | 2026-01-02 | 2027-01-02 |

### 5.2 Procédure de rotation

**Rotation sans interruption (Blue/Green)** :

```bash
# Étape 1 : Générer nouveau secret
NEW_SECRET=$(openssl rand -hex 32)

# Étape 2 : Ajouter nouveau secret (sans remplacer l'ancien)
vault kv put secret/iapostemanager/jwt \
    current_key="<old-key>" \
    next_key="$NEW_SECRET"

# Étape 3 : Déployer application (supporte les 2 clés)
# L'app valide avec current_key et signe avec next_key

# Étape 4 : Attendre propagation (24h-48h)

# Étape 5 : Basculer
vault kv put secret/iapostemanager/jwt \
    current_key="$NEW_SECRET"

# Étape 6 : Révoquer ancien secret
```

**Rotation avec interruption courte** :

```bash
# Fenêtre de maintenance (2h du matin)

# 1. Annoncer maintenance
echo "Maintenance planifiée"

# 2. Arrêter les services
docker-compose down

# 3. Générer et mettre à jour secret
NEW_SECRET=$(openssl rand -hex 32)
vault kv put secret/iapostemanager/database \
    password="$NEW_SECRET"

# 4. Mettre à jour la base de données
psql -c "ALTER USER iaposte_user PASSWORD '$NEW_SECRET';"

# 5. Redémarrer les services
docker-compose up -d

# 6. Vérifier health checks
curl http://localhost:5000/health

# 7. Documenter la rotation
echo "Rotation effectuée le $(date)" >> rotation_log.txt
```

### 5.3 Automatisation

**Script de rotation automatique** :
```python
# /scripts/rotate_secrets.py
import os
import secrets
from datetime import datetime, timedelta
from backend.security.secrets_manager import SecretsManager

class SecretRotator:
    def __init__(self):
        self.secrets_manager = SecretsManager()
    
    def rotate_secret(self, secret_name, secret_type):
        """Rotation automatique d'un secret"""
        # Générer nouveau secret
        if secret_type == 'api_key':
            new_value = f"sk-{secrets.token_urlsafe(32)}"
        elif secret_type == 'password':
            new_value = secrets.token_urlsafe(32)
        elif secret_type == 'jwt':
            new_value = secrets.token_hex(32)
        
        # Sauvegarder ancien secret (backup)
        old_value = self.secrets_manager.get(secret_name)
        backup_name = f"{secret_name}_backup_{datetime.now().strftime('%Y%m%d')}"
        self.secrets_manager.set(backup_name, old_value)
        
        # Mettre à jour avec nouveau secret
        self.secrets_manager.set(secret_name, new_value)
        
        # Logger la rotation
        self.log_rotation(secret_name)
        
        return new_value
    
    def check_rotation_needed(self):
        """Vérifier quels secrets doivent être rotés"""
        secrets_to_rotate = []
        
        for secret in self.secrets_manager.list_secrets():
            last_rotation = secret.get('last_rotation')
            rotation_period = secret.get('rotation_period_days', 90)
            
            if last_rotation:
                days_since_rotation = (datetime.now() - last_rotation).days
                if days_since_rotation >= rotation_period:
                    secrets_to_rotate.append(secret)
        
        return secrets_to_rotate
```

## 6. Accès et audits

### 6.1 Contrôle d'accès

**Matrice d'accès** :

| Rôle | Lecture | Écriture | Rotation | Audit |
|------|---------|----------|----------|-------|
| **Developer** | Dev only | Dev only | ❌ | ❌ |
| **DevOps** | All | Staging/Prod | ✅ | ✅ |
| **Security Officer** | All | All | ✅ | ✅ |
| **Tech Lead** | All | All | ✅ | ✅ |
| **Admin** | All | All | ✅ | ✅ |

**Configuration IAM** :
```hcl
# Vault policy pour developers
path "secret/data/iapostemanager/dev/*" {
  capabilities = ["read", "list"]
}

# Vault policy pour DevOps
path "secret/data/iapostemanager/prod/*" {
  capabilities = ["read", "list", "create", "update"]
}

# Vault policy pour Security Officers
path "secret/data/iapostemanager/*" {
  capabilities = ["read", "list", "create", "update", "delete"]
}
```

### 6.2 Audit Trail

**Logs d'accès** :
```json
{
  "timestamp": "2026-01-02T10:30:45Z",
  "user": "john.doe@iapostemanager.com",
  "action": "READ_SECRET",
  "secret_name": "openai/api_key",
  "environment": "production",
  "ip_address": "192.168.1.100",
  "result": "SUCCESS"
}
```

**Monitoring** :
```python
# /backend/security/audit_logger.py
import logging
from datetime import datetime

class SecretAuditLogger:
    def __init__(self):
        self.logger = logging.getLogger('secrets_audit')
    
    def log_access(self, user, action, secret_name, result):
        """Logger un accès aux secrets"""
        self.logger.info({
            'timestamp': datetime.utcnow().isoformat(),
            'user': user,
            'action': action,
            'secret': secret_name,
            'result': result
        })
```

**Alertes** :
- 🔴 Accès non autorisé
- 🔴 Échec d'authentification répété
- 🟡 Lecture de secret critique
- 🟡 Modification de secret en production

### 6.3 Revue régulière

**Checklist mensuelle** :
- [ ] Vérifier tous les accès actifs
- [ ] Révoquer comptes inactifs (>30 jours)
- [ ] Vérifier logs d'audit pour anomalies
- [ ] Tester restoration de secrets
- [ ] Vérifier dates de rotation
- [ ] Mettre à jour documentation

**Checklist trimestrielle** :
- [ ] Audit complet de tous les secrets
- [ ] Rotation des secrets critiques
- [ ] Revue des permissions
- [ ] Test de disaster recovery
- [ ] Formation équipe

## 7. Urgences et incidents

### 7.1 Secret compromis

**Procédure d'urgence** :

```markdown
# INCIDENT : Secret compromis

**IMMÉDIAT (dans les 15 minutes)** :
1. [ ] Révoquer le secret compromis
2. [ ] Générer nouveau secret
3. [ ] Déployer nouveau secret en urgence
4. [ ] Notifier équipe sécurité

**COURT TERME (dans l'heure)** :
5. [ ] Analyser les logs d'accès
6. [ ] Identifier l'étendue de la compromission
7. [ ] Vérifier utilisation non autorisée
8. [ ] Révoquer accès suspect

**MOYEN TERME (dans la journée)** :
9. [ ] Postmortem de l'incident
10. [ ] Identifier cause racine
11. [ ] Implémenter corrections
12. [ ] Documenter l'incident

**LONG TERME (dans la semaine)** :
13. [ ] Revue de sécurité complète
14. [ ] Améliorer procédures
15. [ ] Formation équipe
16. [ ] Mise à jour documentation
```

**Script d'urgence** :
```bash
#!/bin/bash
# /scripts/emergency_secret_revoke.sh

SECRET_NAME=$1

echo "⚠️  RÉVOCATION D'URGENCE: $SECRET_NAME"
echo "Date: $(date)"

# 1. Backup ancien secret
vault kv get -format=json secret/iapostemanager/$SECRET_NAME > /tmp/backup_$SECRET_NAME.json

# 2. Générer nouveau secret
NEW_SECRET=$(openssl rand -hex 32)

# 3. Mettre à jour
vault kv put secret/iapostemanager/$SECRET_NAME value="$NEW_SECRET"

# 4. Notifier équipe
curl -X POST https://hooks.slack.com/... \
  -d "{\"text\": \"🚨 Secret $SECRET_NAME révoqué et roté\"}"

echo "✅ Révocation terminée"
```

### 7.2 Perte d'accès au gestionnaire de secrets

**Backup offline** :
- Secrets critiques exportés chiffrés
- Stockés dans coffre-fort physique
- Accès limité à 2 personnes
- Protocole de récupération documenté

**Procédure de récupération** :
```bash
# Si Vault inaccessible

# 1. Récupérer backup chiffré
gpg --decrypt secrets_backup.gpg > secrets.json

# 2. Importer dans nouveau Vault
vault kv put secret/iapostemanager/openai @secrets.json

# 3. Vérifier import
vault kv get secret/iapostemanager/openai

# 4. Détruire backup en clair
shred -u secrets.json
```

### 7.3 Contacts d'urgence

**Escalade** :
1. **Premier niveau** : DevOps on-call
   - Email: devops@iapostemanager.com
   - Phone: +33 X XX XX XX XX

2. **Deuxième niveau** : Security Officer
   - Email: security@iapostemanager.com
   - Phone: +33 X XX XX XX XX

3. **Troisième niveau** : CTO
   - Email: cto@iapostemanager.com
   - Phone: +33 X XX XX XX XX

---

## Annexes

### A. Génération de secrets forts

```python
# Générer des secrets cryptographiquement sécurisés

import secrets
import string

# API Key format
def generate_api_key(length=32):
    return f"sk-{secrets.token_urlsafe(length)}"

# Password fort
def generate_password(length=32):
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(alphabet) for _ in range(length))

# JWT Secret
def generate_jwt_secret():
    return secrets.token_hex(32)

# Encryption Key (AES-256)
def generate_encryption_key():
    return secrets.token_bytes(32).hex()
```

### B. Checklist de départ d'employé

```markdown
# Checklist - Départ d'employé

**Employé** : [Nom]
**Date de départ** : [YYYY-MM-DD]
**Rôle** : [Poste]

**JOUR DU DÉPART** :
- [ ] Désactiver compte email
- [ ] Révoquer accès VPN
- [ ] Révoquer accès SSH
- [ ] Révoquer accès cloud (AWS/Azure)
- [ ] Révoquer accès Vault
- [ ] Révoquer accès GitHub
- [ ] Collecter équipements

**SEMAINE SUIVANTE** :
- [ ] Rotation secrets accessibles
- [ ] Audit logs d'accès
- [ ] Mettre à jour documentation
- [ ] Transférer connaissances
- [ ] Archiver emails/documents

**MOIS SUIVANT** :
- [ ] Vérification complète des accès
- [ ] Destruction données personnelles (RGPD)
```

---

**Document maintenu par** : Security Officer  
**Dernière mise à jour** : 2 janvier 2026  
**Prochaine révision** : 2 avril 2026
