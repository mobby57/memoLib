# 🔐 SECRETS NÉCESSAIRES AU PROJET

## ✅ SECRETS OBLIGATOIRES

### 1. Compte Demo
```bash
dotnet user-secrets set "DemoAccount:Email" "SARRABOUDJELLAL57@GMAIL.COM"
dotnet user-secrets set "DemoAccount:Password" "Demo2025!"
```

### 2. Email Monitor (IMAP Gmail)
```bash
dotnet user-secrets set "EmailMonitor:Username" "SARRABOUDJELLAL57@GMAIL.COM"
dotnet user-secrets set "EmailMonitor:Password" "xxbz dbcr sgxp ncuw"
```

### 3. Public Contact (Formulaires publics)
```bash
dotnet user-secrets set "PublicContact:FromEmail" "sarraboudjellal57@gmail.com"
dotnet user-secrets set "PublicContact:ToEmail" "sarraboudjellal57@gmail.com"
dotnet user-secrets set "PublicContact:Password" "xxbz dbcr sgxp ncuw"
```

### 4. JWT (Déjà configuré)
```bash
dotnet user-secrets set "JwtSettings:SecretKey" "DaFTAbWowHOYBhKUynl2MVG3r9Lxgd8fEzmJQ1jSe5NPqR0puZ6XskIc4tC7vi"
```

---

## 📋 SECRETS OPTIONNELS (Services externes)

### Twilio (SMS/WhatsApp)
```bash
dotnet user-secrets set "Twilio:AccountSid" "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
dotnet user-secrets set "Twilio:AuthToken" "your_twilio_auth_token_here"
dotnet user-secrets set "Twilio:PhoneNumber" "+19564490871"
dotnet user-secrets set "Twilio:WhatsAppNumber" "+19564490871"
```

### Signal (Messagerie)
```bash
dotnet user-secrets set "Signal:PhoneNumber" "+33603983709"
dotnet user-secrets set "Signal:CliUrl" "http://127.0.0.1:8080"
```

### Vonage (SMS)
```bash
dotnet user-secrets set "Vonage:InboundWebhookKey" "05e4017a720747ed8e381ea6b551248b"
```

### Messaging (Forwarding)
```bash
dotnet user-secrets set "Messaging:ForwardingApiKey" "memolib-forward-local-2026"
```

---

## 🚀 CONFIGURATION RAPIDE (Copier-coller)

```bash
# OBLIGATOIRES
dotnet user-secrets set "DemoAccount:Email" "SARRABOUDJELLAL57@GMAIL.COM"
dotnet user-secrets set "DemoAccount:Password" "Demo2025!"
dotnet user-secrets set "EmailMonitor:Username" "SARRABOUDJELLAL57@GMAIL.COM"
dotnet user-secrets set "EmailMonitor:Password" "xxbz dbcr sgxp ncuw"
dotnet user-secrets set "PublicContact:FromEmail" "sarraboudjellal57@gmail.com"
dotnet user-secrets set "PublicContact:ToEmail" "sarraboudjellal57@gmail.com"
dotnet user-secrets set "PublicContact:Password" "xxbz dbcr sgxp ncuw"
dotnet user-secrets set "JwtSettings:SecretKey" "DaFTAbWowHOYBhKUynl2MVG3r9Lxgd8fEzmJQ1jSe5NPqR0puZ6XskIc4tC7vi"
```

---

## ✅ VÉRIFICATION

```bash
# Lister tous les secrets
dotnet user-secrets list

# Vérifier un secret spécifique
dotnet user-secrets list | findstr "DemoAccount"
```

---

## 📊 RÉSUMÉ

**Obligatoires**: 8 secrets  
**Optionnels**: 7 secrets  
**Total**: 15 secrets

**Compte unique**: SARRABOUDJELLAL57@GMAIL.COM  
**App Password**: xxbz dbcr sgxp ncuw

---

**Créé**: 2025-03-09  
**Statut**: ✅ Liste complète
