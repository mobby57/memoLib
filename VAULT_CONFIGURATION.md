# 🔐 Configuration Coffre-Fort - Secrets Requis

## Secrets Critiques (Priorité 1)

### Email Monitor
```
Key: EmailMonitor:Password
Category: Email
Description: Mot de passe d'application Gmail pour IMAP
Requis: OUI
```

### JWT Authentication
```
Key: JwtSettings:SecretKey
Category: JWT
Description: Clé secrète pour signature des tokens JWT (min 32 caractères)
Requis: OUI
```

### Database
```
Key: Database:ConnectionString
Category: Database
Description: Chaîne de connexion base de données (si PostgreSQL)
Requis: NON (SQLite par défaut)
```

## Secrets Optionnels (Priorité 2)

### SMTP
```
Key: SMTP:Password
Category: Email
Description: Mot de passe pour envoi d'emails
Requis: NON
```

### APIs Externes
```
Key: Twilio:AuthToken
Category: API
Description: Token d'authentification Twilio
Requis: NON

Key: OpenAI:ApiKey
Category: API
Description: Clé API OpenAI pour IA
Requis: NON
```

## 📋 Checklist Configuration

- [ ] Générer Master Key (automatique au 1er démarrage)
- [ ] Sauvegarder Master Key dans appsettings.json
- [ ] Ajouter EmailMonitor:Password via interface
- [ ] Vérifier JwtSettings:SecretKey (min 32 caractères)
- [ ] Tester connexion email
- [ ] Vérifier logs (aucun mot de passe en clair)

## 🔒 Règles de Sécurité

1. **Master Key** : JAMAIS dans Git, toujours dans appsettings.json
2. **Rotation** : Changer les secrets tous les 90 jours
3. **Accès** : Uniquement utilisateurs authentifiés
4. **Audit** : Toutes les actions tracées dans AuditLog
5. **Backup** : Exporter les clés avant migration

## 🎯 Migration depuis User Secrets

```powershell
# 1. Lister secrets actuels
dotnet user-secrets list

# 2. Pour chaque secret, l'ajouter via l'interface web
# http://localhost:5078/vault.html

# 3. Vérifier que tout fonctionne

# 4. Supprimer les anciens secrets
dotnet user-secrets clear
```

## ⚠️ Troubleshooting

### Erreur "Master Key non trouvée"
**Solution** : Copier la clé affichée au démarrage dans appsettings.json :
```json
{
  "Vault": {
    "MasterKey": "VOTRE_CLE_ICI"
  }
}
```

### Service ne trouve pas son secret
**Solution** : Vérifier que la clé existe avec `/api/vault/list`

### Erreur de déchiffrement
**Solution** : La Master Key a changé, recréer les secrets
