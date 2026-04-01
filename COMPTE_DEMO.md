# 🔐 COMPTE DEMO - Configuration

## ✅ COMPTE AJOUTÉ AU VAULT

**Email**: SARRABOUDJELLAL57@GMAIL.COM  
**Mot de passe**: Demo2025!  
**Usage**: Compte démo pour tous les parcours

---

## 📝 SECRETS CONFIGURÉS

```bash
dotnet user-secrets set "DemoAccount:Email" "SARRABOUDJELLAL57@GMAIL.COM"
dotnet user-secrets set "DemoAccount:Password" "Demo2025!"
```

---

## 🚀 UTILISATION

### Dans le code C#
```csharp
var demoEmail = Configuration["DemoAccount:Email"];
var demoPassword = Configuration["DemoAccount:Password"];
```

### Parcours concernés
- ✅ parcours-lawyer.html
- ✅ parcours-client.html
- ✅ parcours-assistant.html
- ✅ parcours-compliance.html
- ✅ parcours-finance.html
- ✅ parcours-manager.html
- ✅ parcours-owner.html

---

## 🔒 SÉCURITÉ

- ✅ Stocké dans user secrets (hors Git)
- ✅ Accessible uniquement en local
- ✅ Production: utiliser Azure Key Vault

---

**Créé**: 2025-03-09  
**Statut**: ✅ Configuré
