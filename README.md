# 🚀 MemoLib - Système de Gestion d'Emails pour Cabinets d'Avocats

Système intelligent de gestion des communications par email avec détection automatique de clients, création de dossiers, et workflow complet.

## ✨ Fonctionnalités

### 📧 Gestion Emails
- ✅ Monitoring automatique Gmail (IMAP)
- ✅ Scan manuel de tous les emails
- ✅ Détection automatique des doublons
- ✅ Extraction automatique des informations clients (téléphone, adresse)
- ✅ Envoi d'emails depuis l'application
- ✅ Templates d'emails réutilisables

### 📁 Gestion Dossiers
- ✅ Création automatique de dossiers
- ✅ Workflow de statut (OPEN → IN_PROGRESS → CLOSED)
- ✅ Attribution à des avocats
- ✅ Tags et catégorisation
- ✅ Priorités et échéances
- ✅ Filtres avancés multi-critères
- ✅ Timeline complète par dossier

### 👥 Gestion Clients
- ✅ Création automatique depuis emails
- ✅ Extraction auto des coordonnées
- ✅ Vue 360° client
- ✅ Historique complet
- ✅ Détection de doublons

### 🔍 Recherche Intelligente
- ✅ Recherche textuelle
- ✅ Recherche par embeddings (similarité)
- ✅ Recherche sémantique IA
- ✅ Regroupement automatique des doublons

### 📊 Analytics
- ✅ Dashboard intelligent
- ✅ Statistiques complètes
- ✅ Centre d'anomalies
- ✅ Journal d'audit complet

### 📎 Pièces Jointes
- ✅ Upload de fichiers
- ✅ Téléchargement sécurisé
- ✅ Association aux emails

## 🛠️ Technologies

- **Backend**: ASP.NET Core 9.0
- **Base de données**: SQLite (Entity Framework Core)
- **Email**: MailKit (IMAP/SMTP)
- **Auth**: JWT Bearer
- **Frontend**: HTML/CSS/JavaScript vanilla

## 📦 Installation

### Prérequis
- .NET 9.0 SDK
- Git
- Compte Gmail avec mot de passe d'application

### Étape 1: Cloner le projet
```powershell
git clone https://github.com/VOTRE_USERNAME/MemoLib.git
cd MemoLib/MemoLib.Api
```

### Étape 2: Restaurer le projet
```powershell
.\restore-project.ps1
```

Ce script va:
1. Restaurer les packages NuGet
2. Créer la base de données
3. Compiler le projet
4. Configurer les secrets utilisateur

### Étape 3: Lancer l'application
```powershell
dotnet run
```

**API**: http://localhost:5078  
**Interface**: http://localhost:5078/demo.html

## ⚙️ Configuration

### Gmail IMAP
1. Activez la validation en 2 étapes sur votre compte Gmail
2. Créez un mot de passe d'application: https://myaccount.google.com/apppasswords
3. Configurez dans `appsettings.json`:

```json
{
  "EmailMonitor": {
    "Enabled": true,
    "ImapHost": "imap.gmail.com",
    "ImapPort": 993,
    "Username": "votre-email@gmail.com",
    "IntervalSeconds": 60
  }
}
```

4. Stockez le mot de passe de manière sécurisée:
```powershell
dotnet user-secrets set "EmailMonitor:Password" "votre-mot-de-passe-application"
```

## 📚 Documentation

- **[FEATURES_COMPLETE.md](FEATURES_COMPLETE.md)** - Documentation complète des fonctionnalités
- **[IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md)** - Résumé de l'implémentation
- **[test-all-features.http](test-all-features.http)** - Tests API

## 🔐 Sécurité

- ✅ Authentification JWT obligatoire
- ✅ Mots de passe hashés (BCrypt)
- ✅ Secrets stockés hors du code
- ✅ Isolation par utilisateur
- ✅ Validation des entrées
- ✅ Audit complet des actions

## 📊 API Endpoints

### Authentification
```http
POST /api/auth/register
POST /api/auth/login
```

### Dossiers
```http
GET    /api/cases
POST   /api/cases
GET    /api/cases/{id}
GET    /api/cases/{id}/timeline
PATCH  /api/cases/{id}/status
PATCH  /api/cases/{id}/assign
PATCH  /api/cases/{id}/tags
PATCH  /api/cases/{id}/priority
GET    /api/cases/filter
```

### Emails
```http
POST /api/ingest/email
POST /api/email-scan/manual
POST /api/email/send
POST /api/email/templates
GET  /api/email/templates
```

### Clients
```http
GET  /api/client
POST /api/client
GET  /api/client/{id}/detail
PUT  /api/client/{id}
```

### Recherche
```http
POST /api/search/events
POST /api/embeddings/search
POST /api/semantic/search
```

### Pièces Jointes
```http
POST /api/attachment/upload/{eventId}
GET  /api/attachment/{id}
GET  /api/attachment/event/{eventId}
```

## 🎯 Workflow Typique

```bash
# 1. Email reçu automatiquement
# → Dossier créé automatiquement
# → Client créé automatiquement

# 2. Avocat définit la priorité
PATCH /api/cases/{id}/priority
{ "priority": 5, "dueDate": "2025-06-30" }

# 3. Ajoute des tags
PATCH /api/cases/{id}/tags
{ "tags": ["urgent", "famille", "divorce"] }

# 4. Passe en cours
PATCH /api/cases/{id}/status
{ "status": "IN_PROGRESS" }

# 5. Envoie un email au client
POST /api/email/send
{ "to": "client@example.com", "subject": "...", "body": "..." }

# 6. Clôture le dossier
PATCH /api/cases/{id}/status
{ "status": "CLOSED" }
```

## 🔄 Sauvegarde

### Sauvegarder sur Git
```powershell
.\backup-git.ps1
```

### Restaurer sur un autre PC
```powershell
git clone https://github.com/VOTRE_USERNAME/MemoLib.git
cd MemoLib/MemoLib.Api
.\restore-project.ps1
```

## 📁 Structure du Projet

```
MemoLib.Api/
├── Controllers/          # API endpoints
├── Models/              # Entités de données
├── Data/                # DbContext
├── Services/            # Logique métier
├── Migrations/          # Migrations EF Core
├── wwwroot/             # Interface web
│   └── demo.html        # Interface utilisateur
├── appsettings.json     # Configuration
└── Program.cs           # Point d'entrée
```

## 🚀 Déploiement

### Local (Développement)
```powershell
dotnet run
```

### Production (Azure - Optionnel)
1. Créer une App Service sur Azure
2. Remplacer SQLite par Azure SQL Database
3. Configurer les secrets dans Azure Key Vault
4. Déployer via GitHub Actions ou Azure DevOps

## 🐛 Dépannage

### L'API ne démarre pas
```powershell
# Vérifier le port
netstat -ano | findstr :5078

# Tuer le processus si nécessaire
taskkill /PID <PID> /F
```

### Erreur de connexion Gmail
- Vérifiez que la validation en 2 étapes est activée
- Utilisez un mot de passe d'application (pas votre mot de passe Gmail)
- Vérifiez que IMAP est activé dans Gmail

### Base de données corrompue
```powershell
# Supprimer et recréer
Remove-Item memolib.db
dotnet ef database update
```

## 📝 Licence

MIT License - Libre d'utilisation

## 👥 Auteur

Développé pour les cabinets d'avocats

## 🤝 Contribution

Les contributions sont les bienvenues ! Ouvrez une issue ou une pull request.

## 📞 Support

Pour toute question, consultez la documentation ou ouvrez une issue sur GitHub.

---

**⚠️ Note**: Ce projet est 100% local. Azure n'est nécessaire que pour un déploiement cloud en production.
