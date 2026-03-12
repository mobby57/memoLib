# 🔐 MIGRATION SECRETS VERS VAULT

## ✅ PROCÉDURE

### 1. Démarrer l'API
```bash
dotnet run
```

### 2. Se connecter et obtenir le token
```bash
# Via demo.html ou:
curl -X POST http://localhost:5078/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"SARRABOUDJELLAL57@GMAIL.COM\",\"password\":\"Demo2025!\"}"
```

### 3. Exécuter la migration
```bash
migrate-secrets-to-vault.bat
```

---

## 📋 SECRETS MIGRÉS

### EmailMonitor
- ✅ EmailMonitor:Username
- ✅ EmailMonitor:Password

### DemoAccount
- ✅ DemoAccount:Email
- ✅ DemoAccount:Password

---

## 🔒 SÉCURITÉ

**Avant**: User Secrets (local)  
**Après**: Vault (base de données chiffrée)

**Avantages**:
- ✅ Chiffrement AES-256
- ✅ Isolation par utilisateur
- ✅ Audit trail
- ✅ Rotation facile

---

## 🚀 UTILISATION POST-MIGRATION

```csharp
// Récupérer depuis le Vault
var email = await _vaultService.GetSecretAsync(userId, "EmailMonitor:Username");
var password = await _vaultService.GetSecretAsync(userId, "EmailMonitor:Password");
```

---

**Statut**: ⏳ Prêt à migrer  
**Commande**: `migrate-secrets-to-vault.bat`
