# 🔐 Système de Coffre-Fort Automatisé

## Vue d'ensemble

Le système de coffre-fort sécurisé permet de stocker et gérer tous vos mots de passe de manière centralisée et chiffrée. Le système récupère automatiquement les mots de passe nécessaires pour Gmail, SMTP, JWT, etc.

## ✨ Fonctionnalités

- ✅ **Chiffrement AES-256** - Tous les secrets sont chiffrés
- ✅ **Stockage sécurisé** - Base de données SQLite avec index unique
- ✅ **Récupération automatique** - Les services récupèrent automatiquement leurs mots de passe
- ✅ **Interface web** - Gestion visuelle des secrets
- ✅ **Catégorisation** - Organisation par catégories (Email, Database, API, JWT, etc.)
- ✅ **Isolation utilisateur** - Chaque utilisateur a son propre coffre

## 🚀 Utilisation

### 1. Configuration initiale

Générez une clé maître (automatique au premier démarrage) :

```json
{
  "Vault": {
    "MasterKey": "VOTRE_CLE_GENEREE_AUTOMATIQUEMENT"
  }
}
```

⚠️ **IMPORTANT** : Sauvegardez cette clé dans `appsettings.json` !

### 2. Interface Web

Accédez à l'interface : **http://localhost:5078/vault.html**

### 3. API Endpoints

#### Stocker un secret
```http
POST /api/vault/store
Authorization: Bearer {token}
Content-Type: application/json

{
  "key": "EmailMonitor:Password",
  "value": "mon-mot-de-passe-secret",
  "category": "Email"
}
```

#### Récupérer un secret
```http
GET /api/vault/get/{key}
Authorization: Bearer {token}
```

#### Lister tous les secrets
```http
GET /api/vault/list
Authorization: Bearer {token}
```

#### Supprimer un secret
```http
DELETE /api/vault/delete/{key}
Authorization: Bearer {token}
```

## 📋 Secrets Recommandés

### Email (Gmail/SMTP)
```
EmailMonitor:Password
SMTP:Password
```

### Base de données
```
Database:ConnectionString
Database:Password
```

### JWT
```
JWT:SecretKey
```

### APIs externes
```
Twilio:AuthToken
Stripe:SecretKey
OpenAI:ApiKey
```

## 🔧 Intégration dans les Services

Les services peuvent récupérer automatiquement leurs secrets :

```csharp
public class EmailMonitorService
{
    private readonly VaultService _vault;
    
    public async Task StartAsync()
    {
        // Récupération automatique du mot de passe
        var password = await _vault.GetSecretGlobalAsync("EmailMonitor:Password");
        
        if (password != null)
        {
            // Utiliser le mot de passe
            _imapClient.Authenticate(_username, password);
        }
    }
}
```

## 🔒 Sécurité

- **Chiffrement** : AES-256 avec IV aléatoire
- **Clé maître** : Stockée dans appsettings.json (hors du code)
- **Isolation** : Chaque utilisateur a son propre espace
- **Audit** : Toutes les actions sont tracées
- **Index unique** : Empêche les doublons (UserId + Key)

## 📊 Structure de la Table

```sql
CREATE TABLE SecretVaults (
    Id INTEGER PRIMARY KEY,
    UserId INTEGER NOT NULL,
    Key TEXT NOT NULL,
    EncryptedValue TEXT NOT NULL,
    Category TEXT NOT NULL,
    CreatedAt DATETIME NOT NULL,
    UpdatedAt DATETIME,
    UNIQUE(UserId, Key)
);
```

## 🎯 Avantages

1. **Centralisation** - Un seul endroit pour tous les mots de passe
2. **Automatisation** - Les services récupèrent automatiquement leurs secrets
3. **Sécurité** - Chiffrement fort et isolation
4. **Simplicité** - Interface intuitive
5. **Traçabilité** - Historique complet des modifications

## 🔄 Migration depuis User Secrets

Pour migrer vos secrets existants :

```powershell
# 1. Lister vos secrets actuels
dotnet user-secrets list

# 2. Les ajouter via l'API ou l'interface web
# 3. Supprimer les anciens secrets
dotnet user-secrets clear
```

## 📝 Exemple Complet

```javascript
// 1. Connexion
const loginResponse = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'admin@freetime.com',
        password: 'Admin123!'
    })
});
const { token } = await loginResponse.json();

// 2. Ajouter un secret
await fetch('/api/vault/store', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
        key: 'EmailMonitor:Password',
        value: 'mon-mot-de-passe-gmail',
        category: 'Email'
    })
});

// 3. Le système utilise automatiquement ce mot de passe !
```

## 🆘 Dépannage

### Erreur "Master Key non trouvée"
- Vérifiez que `Vault:MasterKey` est dans `appsettings.json`
- Copiez la clé affichée au premier démarrage

### Erreur "Secret non trouvé"
- Vérifiez que vous êtes connecté avec le bon utilisateur
- Listez vos secrets avec `/api/vault/list`

### Erreur de déchiffrement
- La clé maître a peut-être changé
- Recréez vos secrets avec la nouvelle clé

## 🎉 Résultat

Vous avez maintenant un coffre-fort sécurisé qui :
- ✅ Stocke tous vos mots de passe chiffrés
- ✅ Les fournit automatiquement aux services
- ✅ Offre une interface de gestion intuitive
- ✅ Garantit la sécurité et l'isolation

**Plus besoin de gérer manuellement les mots de passe dans la configuration !**
