# 🔧 MemoLib.Api - Backend .NET

[![.NET](https://img.shields.io/badge/.NET-9.0-512BD4)](https://dotnet.microsoft.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

> **Ce dossier contient le backend API .NET de MemoLib.**
> Pour la documentation complète du projet (frontend Next.js + backend .NET), voir le [README principal](../README.md).

## 🛠️ Stack

| Composant       | Technologie                        |
| --------------- | ---------------------------------- |
| Framework       | ASP.NET Core 9.0                   |
| ORM             | Entity Framework Core 9.0          |
| Base de données | SQLite (local) / PostgreSQL (prod) |
| Email           | MailKit (IMAP/SMTP)                |
| Auth            | JWT Bearer + BCrypt                |
| Validation      | FluentValidation                   |
| PDF             | QuestPDF                           |
| Excel           | ClosedXML                          |
| Cache           | StackExchange.Redis                |
| Temps réel      | SignalR                            |
| SMS             | Twilio                             |
| Logs            | Serilog                            |

## ⚠️ Azure n'est PAS requis

Ce backend tourne en **local** ou via **Docker**. Azure n'intervient nulle part dans l'exécution. Le frontend est déployé sur **Vercel** séparément.

## 📦 Installation

### Prérequis

- .NET 9.0 SDK
- Git
- (Optionnel) Compte Gmail avec mot de passe d'application

### Démarrage rapide

```powershell
cd MemoLib.Api

# Restauration automatique (packages + DB + secrets)
.\restore-project.ps1

# Lancer
dotnet run
```

### Installation manuelle

```powershell
dotnet restore
dotnet ef database update
dotnet user-secrets set "EmailMonitor:Password" "votre-mot-de-passe-app"
dotnet build
dotnet run
```

**Accès :**

- API : http://localhost:5078
- Interface web : http://localhost:5078/demo.html
- Swagger : http://localhost:5078/swagger

## ⚙️ Configuration Gmail IMAP

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

```powershell
dotnet user-secrets set "EmailMonitor:Password" "votre-mot-de-passe-application"
```

## 📁 Structure

```
MemoLib.Api/
├── Controllers/       # API endpoints
├── Services/          # Logique métier
├── Models/            # Entités de données
├── Data/              # DbContext EF Core
├── Migrations/        # Migrations PostgreSQL
├── Hubs/              # SignalR (temps réel)
├── Middleware/         # Rate limiting, sécurité, cache
├── Validators/        # FluentValidation
├── wwwroot/           # Interface web statique
├── appsettings.json   # Configuration
└── Program.cs         # Point d'entrée
```

## 📊 API Endpoints principaux

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/cases
POST /api/cases
GET  /api/cases/{id}/timeline
PATCH /api/cases/{id}/status
POST /api/ingest/email
POST /api/email-scan/manual
POST /api/email/send
GET  /api/client
POST /api/client
POST /api/search/events
POST /api/attachment/upload/{eventId}
GET  /api/dashboard
```

## 🚀 Déploiement

### Local

```powershell
dotnet publish -c Release
cd bin/Release/net9.0/publish
.\MemoLib.Api.exe
```

### Docker

```powershell
docker-compose up -d
```

## 🐛 Dépannage

```powershell
# Port occupé
netstat -ano | findstr :5078
taskkill /PID <PID> /F

# DB corrompue (SQLite)
Remove-Item memolib.db
dotnet ef database update
```

## 📝 Licence

MIT License
