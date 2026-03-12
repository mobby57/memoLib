# 🔐 UTILISATION DU VAULT

## 🚀 MIGRATION VERS VAULT

### Prérequis
1. API démarrée: `dotnet run`
2. User Secrets configurés

### Exécution
```powershell
.\migrate-to-vault.ps1
```

---

## 📋 CE QUE FAIT LE SCRIPT

1. ✅ Crée/Login compte demo
2. ✅ Récupère token JWT automatiquement
3. ✅ Stocke 3 secrets dans Vault:
   - EmailMonitor:Password
   - DemoAccount:Password
   - PublicContact:Password

---

## 🔒 AVANTAGES VAULT

- ✅ Chiffrement AES-256
- ✅ Stockage base de données
- ✅ Isolation par utilisateur
- ✅ Audit trail complet
- ✅ Rotation facile

---

## 💻 UTILISATION EN CODE

### Récupérer un secret
```csharp
var password = await _vaultService.GetSecretAsync(userId, "EmailMonitor:Password");
```

### Stocker un secret
```csharp
await _vaultService.StoreSecretAsync(userId, "MyKey", "MyValue", "Category");
```

### Lister les secrets
```csharp
var secrets = await _vaultService.ListSecretsAsync(userId);
```

---

## 🌐 API ENDPOINTS

### Stocker
```http
POST /api/vault/store
Authorization: Bearer {token}
Content-Type: application/json

{
  "key": "MyKey",
  "value": "MyValue",
  "category": "General"
}
```

### Récupérer
```http
GET /api/vault/get/{key}
Authorization: Bearer {token}
```

### Lister
```http
GET /api/vault/list
Authorization: Bearer {token}
```

### Supprimer
```http
DELETE /api/vault/delete/{key}
Authorization: Bearer {token}
```

---

## ✅ APRÈS MIGRATION

**User Secrets**: Peuvent être supprimés  
**Vault**: Contient tous les secrets  
**Code**: Utilise VaultService

---

## 🔄 WORKFLOW

1. **Dev local**: User Secrets OU Vault
2. **Production**: Vault uniquement
3. **Cloud**: Azure Key Vault

---

**Fichier**: migrate-to-vault.ps1  
**Statut**: ✅ Prêt à utiliser
