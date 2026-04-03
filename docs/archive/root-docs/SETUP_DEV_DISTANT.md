# 🌐 CONFIGURATION DÉVELOPPEUR DISTANT

## 🔐 COMPTE DEMO UNIVERSEL

**Email**: SARRABOUDJELLAL57@GMAIL.COM  
**Password**: Demo2025!  
**Usage**: Tous les développeurs, tous les environnements

---

## 📋 CONFIGURATION INITIALE

### 1. Cloner le projet
```bash
git clone https://github.com/VOTRE_REPO/MemoLib.git
cd MemoLib/MemoLib.Api
```

### 2. Restaurer le projet
```bash
dotnet restore
dotnet ef database update
```

### 3. Configurer les secrets (OBLIGATOIRE)
```bash
# Compte demo
dotnet user-secrets set "DemoAccount:Email" "SARRABOUDJELLAL57@GMAIL.COM"
dotnet user-secrets set "DemoAccount:Password" "Demo2025!"

# Email Monitor
dotnet user-secrets set "EmailMonitor:Username" "SARRABOUDJELLAL57@GMAIL.COM"
dotnet user-secrets set "EmailMonitor:Password" "xxbz dbcr sgxp ncuw"

# Public Contact
dotnet user-secrets set "PublicContact:FromEmail" "sarraboudjellal57@gmail.com"
dotnet user-secrets set "PublicContact:ToEmail" "sarraboudjellal57@gmail.com"
dotnet user-secrets set "PublicContact:Password" "xxbz dbcr sgxp ncuw"
```

### 4. Démarrer l'API
```bash
dotnet run
```

### 5. Accéder à l'interface
```
http://localhost:5078/demo.html
```

---

## 🔒 SÉCURITÉ

### User Secrets (Local)
- ✅ Hors Git
- ✅ Par développeur
- ✅ Chiffré OS

### Vault (Production)
- ✅ Base de données chiffrée
- ✅ AES-256
- ✅ Audit trail

---

## 🚀 ACCÈS RAPIDE

### Login Demo
```bash
POST /api/auth/login
{
  "email": "SARRABOUDJELLAL57@GMAIL.COM",
  "password": "Demo2025!"
}
```

### Interface Web
```
http://localhost:5078/demo.html
```

---

## 📝 COMMANDES UTILES

```bash
# Vérifier secrets configurés
dotnet user-secrets list

# Supprimer un secret
dotnet user-secrets remove "KEY"

# Réinitialiser tous les secrets
dotnet user-secrets clear
```

---

## ⚠️ IMPORTANT

**NE JAMAIS COMMITER**:
- ❌ Mots de passe en clair
- ❌ Tokens API
- ❌ Fichiers secrets.json

**TOUJOURS UTILISER**:
- ✅ User Secrets (dev local)
- ✅ Vault (production)
- ✅ Azure Key Vault (cloud)

---

## 🆘 SUPPORT

**Problème de connexion ?**
1. Vérifier secrets: `dotnet user-secrets list`
2. Vérifier API: `http://localhost:5078/swagger`
3. Vérifier logs: `logs/memolib-*.txt`

**Email monitor ne fonctionne pas ?**
1. Vérifier IMAP Gmail activé
2. Vérifier App Password valide
3. Vérifier `EmailMonitor:Enabled = true` dans appsettings.json

---

**Créé**: 2025-03-09  
**Compte**: SARRABOUDJELLAL57@GMAIL.COM  
**Statut**: ✅ Prêt pour tous les devs
