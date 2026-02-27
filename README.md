# 🚀 MemoLib - Système de Gestion d'Emails pour Cabinets d'Avocats

[![.NET](https://img.shields.io/badge/.NET-9.0-512BD4)](https://dotnet.microsoft.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Status](https://img.shields.io/badge/status-production--ready-brightgreen)]()
[![Tests](https://img.shields.io/badge/tests-100%25%20passing-success)](VALIDATION-100-PERCENT.md)

Système intelligent de gestion des communications par email avec détection automatique de clients, création de dossiers, workflow complet et fonctionnalités avancées.

## ✨ Fonctionnalités Principales

### 📧 Gestion Emails
- ✅ **Monitoring automatique Gmail** (IMAP) - Scan toutes les 60 secondes
- ✅ **Scan manuel** de tous les emails existants
- ✅ **Détection automatique des doublons** (par ID et contenu)
- ✅ **Extraction automatique** des informations clients (téléphone, adresse)
- ✅ **Envoi d'emails** depuis l'application (SMTP)
- ✅ **Templates réutilisables** avec variables dynamiques
- ✅ **Pièces jointes** - Upload/download sécurisé

### 📁 Gestion Dossiers
- ✅ **Création manuelle** avec extraction auto des coordonnées
- ✅ **Workflow de statut** (OPEN → IN_PROGRESS → CLOSED)
- ✅ **Attribution** à des avocats spécifiques
- ✅ **Tags et catégorisation** flexible
- ✅ **Priorités** (0-5) et **échéances**
- ✅ **Filtres avancés** multi-critères
- ✅ **Timeline complète** par dossier avec tous les événements
- ✅ **Fusion intelligente** des doublons
- ✅ **Notifications automatiques** sur changements d'état

### 👥 Gestion Clients
- ✅ **Création manuelle** avec suggestions depuis emails
- ✅ **Extraction auto** des coordonnées (regex intelligent)
- ✅ **Vue 360°** client avec historique complet
- ✅ **Détection de doublons** par email
- ✅ **Édition en ligne** des informations
- ✅ **Règles métier** (normalisation, VIP)

### 🔍 Recherche Intelligente
- ✅ **Recherche textuelle** classique
- ✅ **Recherche par embeddings** (similarité vectorielle)
- ✅ **Recherche sémantique IA** (compréhension du contexte)
- ✅ **Regroupement automatique** des doublons
- ✅ **Filtres combinés** (statut + tag + priorité)

### 📊 Analytics & Monitoring
- ✅ **Dashboard intelligent** avec vue d'ensemble
- ✅ **Statistiques complètes** (emails/jour, types, sévérité)
- ✅ **Centre d'anomalies** centralisé
- ✅ **Journal d'audit** complet de toutes les actions
- ✅ **Notifications** en temps réel
- ✅ **Alertes** pour emails nécessitant attention

## 🛠️ Stack Technique

### Backend
- **Framework**: ASP.NET Core 9.0
- **ORM**: Entity Framework Core 9.0
- **Base de données**: SQLite (production-ready)
- **Email**: MailKit 4.15.0 (IMAP/SMTP)
- **Authentification**: JWT Bearer avec BCrypt
- **Validation**: FluentValidation

### Frontend
- **Interface**: HTML5/CSS3/JavaScript ES6+
- **Design**: Responsive, mobile-friendly
- **PWA**: Installable sur desktop/mobile

### Sécurité
- **Hashing**: BCrypt pour mots de passe
- **Secrets**: User Secrets (hors du code)
- **Isolation**: Multi-tenant par utilisateur
- **Audit**: Traçabilité complète

## 📦 Installation Rapide

### Prérequis
- ✅ .NET 9.0 SDK ([Télécharger](https://dotnet.microsoft.com/download))
- ✅ Git ([Télécharger](https://git-scm.com/))
- ✅ Compte Gmail avec mot de passe d'application ([Guide](https://myaccount.google.com/apppasswords))

### Installation en 3 Commandes

```powershell
# 1. Cloner le projet
git clone https://github.com/VOTRE_USERNAME/MemoLib.git
cd MemoLib/MemoLib.Api

# 2. Restaurer automatiquement (packages + DB + secrets)
.\restore-project.ps1

# 3. Lancer l'application
dotnet run
```

**🌐 Accès:**
- **API**: http://localhost:5078
- **Interface**: http://localhost:5078/demo.html
- **Swagger**: http://localhost:5078/swagger (si activé)

### Installation Manuelle

```powershell
# Restaurer les packages
dotnet restore

# Créer la base de données
dotnet ef database update

# Configurer le mot de passe email
dotnet user-secrets set "EmailMonitor:Password" "votre-mot-de-passe-app"

# Compiler
dotnet build

# Lancer
dotnet run
```

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
- **[SCENARIOS_TOUTES_FONCTIONS.md](SCENARIOS_TOUTES_FONCTIONS.md)** - Scénarios détaillés des 12 fonctionnalités
- **[SCENARIOS_DEMO_COMPLETS.md](SCENARIOS_DEMO_COMPLETS.md)** - Scénarios de démo live
- **[FLUX_COMPLETS_TOUTES_FONCTIONS.md](FLUX_COMPLETS_TOUTES_FONCTIONS.md)** - Tous les flux possibles
- **[GUIDE_SCENARIOS.md](GUIDE_SCENARIOS.md)** - Guide rapide d'exécution
- **[test-all-features.http](test-all-features.http)** - Tests API

## 🧪 Test E2E Onboarding

Le flux complet onboarding (inscription utilisateur test, login, création template, invitation client, formulaire public, soumission avec participants) est automatisé via:

```powershell
npm run api:e2e:onboarding
```

Forcer une URL API précise:

```powershell
npm run api:e2e:onboarding:base -- -u http://localhost:5078
```

Prérequis:
- API démarrée localement sur `http://localhost:8091`
- Base de données accessible et migrations appliquées

Script utilisé:
- `scripts/e2e-onboarding.ps1`

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
# → Notification envoyée à l'utilisateur
# → Utilisateur crée dossier manuellement
# → Coordonnées extraites automatiquement

# 2. Avocat définit la priorité
PATCH /api/cases/{id}/priority
{ "priority": 5, "dueDate": "2025-06-30" }
# → Notification AUTO envoyée aux collaborateurs

# 3. Ajoute des tags
PATCH /api/cases/{id}/tags
{ "tags": ["urgent", "famille", "divorce"] }
# → Notification AUTO envoyée

# 4. Passe en cours
PATCH /api/cases/{id}/status
{ "status": "IN_PROGRESS" }
# → Notification AUTO changement d'état

# 5. Envoie un email au client
POST /api/email/send
{ "to": "client@example.com", "subject": "...", "body": "..." }

# 6. Clôture le dossier
PATCH /api/cases/{id}/status
{ "status": "CLOSED" }
# → Notification AUTO envoyée à tous
```

## 🔄 Sauvegarde & Restauration

### Sauvegarder vos Modifications

```powershell
# Méthode automatique (recommandée)
.\backup-git.ps1
git push

# OU manuellement
git add .
git commit -m "Description des changements"
git push origin main
```

### Restaurer sur un Autre PC

```powershell
# 1. Cloner depuis GitHub
git clone https://github.com/VOTRE_USERNAME/MemoLib.git
cd MemoLib/MemoLib.Api

# 2. Restaurer automatiquement
.\restore-project.ps1

# 3. Lancer
dotnet run
```

**✅ Le script `restore-project.ps1` fait tout automatiquement:**
- Restaure les packages NuGet
- Crée la base de données
- Compile le projet
- Configure les secrets utilisateur

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

### Production

#### Option 1: Local (Recommandé pour PME)
- ✅ Aucun coût
- ✅ Contrôle total
- ✅ Données en local
- ✅ Performance maximale

```powershell
# Publier en mode Release
dotnet publish -c Release

# Exécuter
cd bin/Release/net9.0/publish
.\MemoLib.Api.exe
```

#### Option 2: Cloud Azure (Optionnel)

**Prérequis:**
- Compte Azure
- Azure CLI installé

**Étapes:**
1. Créer une App Service
2. Remplacer SQLite par Azure SQL Database
3. Configurer secrets dans Azure Key Vault
4. Déployer via GitHub Actions

**Coût estimé:** ~50-100€/mois

**⚠️ Note:** Azure n'est nécessaire que pour:
- Accès depuis plusieurs bureaux distants
- Scalabilité 100+ utilisateurs
- Haute disponibilité 99.9%

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

## 📈 Roadmap

### Version 1.0 (Actuelle) ✅
- [x] Monitoring automatique Gmail
- [x] Gestion complète dossiers
- [x] Workflow statut/tags/priorités
- [x] Templates emails
- [x] Pièces jointes
- [x] Recherche intelligente
- [x] Dashboard analytics
- [x] Centre anomalies
- [x] Commentaires avec mentions
- [x] Notifications temps réel (SignalR)
- [x] Calendrier intégré
- [x] Tâches avec dépendances
- [x] Facturation & suivi temps
- [x] Recherche full-text globale
- [x] Webhooks sortants
- [x] Templates avancés
- [x] Signatures électroniques
- [x] Formulaires dynamiques

### Version 1.1 (Prochaine) 🚧
- [ ] Export PDF/Excel avancé
- [ ] Rapports personnalisés
- [ ] IA classification emails
- [ ] Templates IA intelligents

### Version 2.0 (Future) 💡
- [ ] Application mobile (iOS/Android)
- [ ] Facturation automatique
- [ ] Intégration tribunaux
- [ ] IA classification emails
- [ ] Reconnaissance vocale

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Fork le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

MIT License - Libre d'utilisation commerciale et personnelle.

Voir [LICENSE](LICENSE) pour plus de détails.

## 👥 Auteurs

Développé pour les cabinets d'avocats et professionnels du droit.

## 📞 Support

- 📧 **Email**: support@memolib.com
- 📚 **Documentation**: Voir les fichiers `.md` dans le projet
- 🐛 **Issues**: [GitHub Issues](https://github.com/VOTRE_USERNAME/MemoLib/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/VOTRE_USERNAME/MemoLib/discussions)

## ⭐ Star History

Si ce projet vous aide, n'hésitez pas à lui donner une étoile ⭐

---

**📌 Note Importante**: Ce projet est 100% local par défaut. Azure n'est nécessaire que pour un déploiement cloud multi-sites.

**🎯 Parfait pour**: Cabinets d'avocats, notaires, huissiers, experts juridiques, PME juridiques.

**💰 Coût**: Gratuit en local, ~50-100€/mois sur Azure (optionnel).
