# Configuration Sécurisée MemoLib

## Secrets Utilisateur (Recommandé)

### Configuration Email IMAP
```bash
dotnet user-secrets set "EmailMonitor:Username" "votre-email@gmail.com"
dotnet user-secrets set "EmailMonitor:Password" "votre-mot-de-passe-application"
```

### Configuration SMTP
```bash
dotnet user-secrets set "PublicContact:ToEmail" "contact@votre-cabinet.fr"
dotnet user-secrets set "PublicContact:FromEmail" "noreply@votre-cabinet.fr"
dotnet user-secrets set "PublicContact:SmtpPassword" "votre-mot-de-passe-smtp"
```

### Configuration JWT
```bash
dotnet user-secrets set "JwtSettings:SecretKey" "votre-cle-secrete-32-caracteres-minimum"
```

## Variables d'Environnement (Production)

### Windows
```cmd
set EmailMonitor__Username=votre-email@gmail.com
set EmailMonitor__Password=votre-mot-de-passe
set JwtSettings__SecretKey=votre-cle-secrete
```

### Linux/Mac
```bash
export EmailMonitor__Username="votre-email@gmail.com"
export EmailMonitor__Password="votre-mot-de-passe"
export JwtSettings__SecretKey="votre-cle-secrete"
```

## Configuration Gmail

1. Activer la validation en 2 étapes
2. Créer un mot de passe d'application: https://myaccount.google.com/apppasswords
3. Utiliser ce mot de passe (pas votre mot de passe Gmail)

## Sécurité

- ❌ Jamais d'identifiants dans appsettings.json
- ✅ Utiliser user-secrets en développement
- ✅ Utiliser variables d'environnement en production
- ✅ Mots de passe d'application Gmail uniquement