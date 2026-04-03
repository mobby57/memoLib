# 🚀 GUIDE RAPIDE - Architecture Harmonisée

## 📁 Structure Projet

```
MemoLib.Api/
├── Controllers/        # API REST endpoints
├── Services/          # Business logic
├── Models/            # Entités de données
├── Data/              # DbContext + Migrations
├── Middleware/        # Middleware ASP.NET
├── wwwroot/           # Frontend (HTML/CSS/JS)
│   ├── css/           # Design System
│   ├── demo.html      # Interface principale
│   └── intake-forms.html
├── .github/workflows/ # CI/CD
├── appsettings.json   # Configuration
└── Program.cs         # Point d'entrée
```

## 🎨 Design System

### Utilisation
```html
<link rel="stylesheet" href="/css/design-system.css">

<button class="btn btn-primary">Bouton</button>
<div class="card">Carte</div>
<input class="form-control" type="text">
<span class="badge badge-success">Succès</span>
```

### Variables CSS
```css
var(--primary)      /* #667eea */
var(--success)      /* #28a745 */
var(--spacing-4)    /* 16px */
var(--border-radius-md) /* 8px */
```

## 🌿 Git Workflow

```bash
# Feature
git switch develop
git switch -c feature/ma-feature
git commit -m "feat: description"
git push origin feature/ma-feature

# Bugfix
git switch -c bugfix/mon-fix
git commit -m "fix: description"

# Hotfix
git switch main
git switch -c hotfix/urgent
git commit -m "hotfix: description"
```

### Règle durable

- Utiliser `git switch -c <branche>` pour créer une branche.
- Eviter `git checkout -b` et ne jamais utiliser `-f` lors d'un changement de branche sauf cas de récupération explicite.

Option recommandée (alias):

```bash
git config --global alias.nb "switch -c"
# usage: git nb feature/ma-feature
```

## 🔄 CI/CD

### Branches
- `main` → Production (auto-deploy)
- `develop` → Development (auto-deploy)
- `feature/*` → Features (PR vers develop)

### Pipeline
1. Push code
2. GitHub Actions build + test
3. Deploy automatique si main/develop

## 🧪 Tests

```bash
# Tous les tests
dotnet test

# Tests spécifiques
dotnet test --filter "FullyQualifiedName~ServiceTests"

# Avec couverture
dotnet test /p:CollectCoverage=true
```

## 📝 Conventions

### Commits
```
feat:     Nouvelle fonctionnalité
fix:      Correction bug
docs:     Documentation
refactor: Refactoring
test:     Tests
```

### Code C#
```csharp
public class MyService { }           // PascalCase
private readonly string _field;      // _camelCase
public string Property { get; }      // PascalCase
```

### Code JavaScript
```javascript
const myVariable = 'value';          // camelCase
class MyClass { }                    // PascalCase
const API_URL = 'http://...';        // UPPER_CASE
```

## 🚀 Déploiement

### Local
```bash
dotnet run
# → http://localhost:5078
```

### Production
```bash
dotnet publish -c Release
# Déployer sur Azure/Docker
```

## 📊 Monitoring

### Logs
```csharp
_logger.LogInformation("Message {Param}", value);
_logger.LogWarning("Attention {Param}", value);
_logger.LogError(ex, "Erreur {Param}", value);
```

### Métriques
- Logs: `logs/memolib-*.txt`
- Serilog console output
- Azure App Insights (production)

## 🔒 Sécurité

### Secrets
```bash
# Development
dotnet user-secrets set "Key" "Value"

# Production
# Azure Key Vault ou variables d'environnement
```

### Checklist
- [x] JWT authentication
- [x] HTTPS en production
- [x] Rate limiting
- [x] CORS configuré
- [x] Secrets hors du code

## 📚 Documentation

- `README.md` - Vue d'ensemble
- `ARCHITECTURE_HARMONISEE.md` - Architecture complète
- `CONTRIBUTING.md` - Guide contribution
- `DEPLOYMENT.md` - Guide déploiement
- `CHANGELOG.md` - Historique versions
- `FORMULAIRES_INTELLIGENTS.md` - Feature formulaires

## 🆘 Commandes Utiles

```bash
# Build
dotnet build

# Run
dotnet run

# Tests
dotnet test

# Migration
dotnet ef migrations add NomMigration
dotnet ef database update

# Publish
dotnet publish -c Release

# Clean
dotnet clean
```

## 📞 Support

- GitHub Issues: https://github.com/VOTRE_USERNAME/MemoLib/issues
- Documentation: Voir fichiers `.md`
- Email: support@memolib.com

---

**✅ Architecture harmonisée et prête pour la production !**
