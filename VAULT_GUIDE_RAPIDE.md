# 🚀 Guide Rapide - Coffre-Fort Sécurisé

## Pour les Utilisateurs

### 🎯 Qu'est-ce que c'est ?

Le coffre-fort sécurisé centralise tous vos mots de passe (Gmail, bases de données, APIs) dans un seul endroit chiffré. Le système les récupère automatiquement quand nécessaire.

### ⚡ Démarrage en 3 Minutes

#### 1. Première Connexion
```
URL: http://localhost:5078/vault.html
Email: admin@memolib.local
Password: Admin123!
```

#### 2. Ajouter votre Mot de Passe Gmail
- **Clé** : `EmailMonitor:Password`
- **Valeur** : Votre mot de passe d'application Gmail
- **Catégorie** : Email
- Cliquez sur **💾 Sauvegarder**

#### 3. C'est Tout !
Le système utilise maintenant automatiquement ce mot de passe pour surveiller vos emails.

### 📋 Secrets Recommandés

| Clé | Description | Obligatoire |
|-----|-------------|-------------|
| `EmailMonitor:Password` | Mot de passe Gmail IMAP | ✅ Oui |
| `JwtSettings:SecretKey` | Clé JWT (min 32 caractères) | ✅ Oui |
| `SMTP:Password` | Mot de passe envoi emails | ❌ Non |
| `Database:Password` | Mot de passe base de données | ❌ Non |

### 🔒 Sécurité

- ✅ Chiffrement AES-256
- ✅ Isolation par utilisateur
- ✅ Audit automatique
- ✅ Jamais de mot de passe en clair

### ❓ Questions Fréquentes

**Q: Où sont stockés mes mots de passe ?**
R: Dans la base de données, chiffrés avec AES-256.

**Q: Qui peut voir mes mots de passe ?**
R: Personne. Même les administrateurs ne peuvent pas les déchiffrer sans la clé maître.

**Q: Que se passe-t-il si je perds la clé maître ?**
R: Vous devrez recréer tous vos secrets. Sauvegardez-la précieusement !

**Q: Comment obtenir un mot de passe d'application Gmail ?**
R: https://myaccount.google.com/apppasswords

### 🆘 Support

En cas de problème :
1. Vérifiez que vous êtes connecté
2. Consultez `/api/vault/list` pour voir vos secrets
3. Vérifiez les logs de l'application

---

## Pour les Administrateurs

### 🔧 Configuration Initiale

1. **Générer la clé maître** (automatique au 1er démarrage)
2. **Sauvegarder dans appsettings.json** :
```json
{
  "Vault": {
    "MasterKey": "VOTRE_CLE_GENEREE"
  }
}
```

### 📊 Monitoring

Vérifier les secrets stockés :
```bash
curl -H "Authorization: Bearer {token}" http://localhost:5078/api/vault/list
```

### 🔄 Migration depuis User Secrets

```powershell
# Lister les secrets actuels
dotnet user-secrets list

# Les ajouter via l'interface web
# http://localhost:5078/vault.html

# Supprimer les anciens
dotnet user-secrets clear
```

### 🛡️ Bonnes Pratiques

1. **Rotation** : Changer les secrets tous les 90 jours
2. **Backup** : Exporter avant toute migration
3. **Audit** : Vérifier régulièrement les logs d'accès
4. **Accès** : Limiter aux utilisateurs autorisés

### 📈 Métriques

- Nombre de secrets par catégorie
- Dernière mise à jour
- Fréquence d'accès
- Tentatives d'accès échouées
