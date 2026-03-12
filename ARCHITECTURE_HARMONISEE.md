# 🏗️ ARCHITECTURE HARMONISÉE - MemoLib

**Version**: 2.0.0  
**Date**: Mars 2025  
**Statut**: ✅ Production-Ready

---

## 📐 ARCHITECTURE UNIFIÉE

### Stack Technologique Harmonisé

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Moderne & Cohérent)                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  HTML5 + CSS3 + Vanilla JavaScript ES6+                  │  │
│  │  • Design System unifié (variables CSS)                  │  │
│  │  • Composants réutilisables                              │  │
│  │  • Progressive Web App (PWA)                             │  │
│  │  • Responsive Mobile-First                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕ REST API
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND (ASP.NET Core 9.0)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Controllers (API REST) → Services → Data                │  │
│  │  • JWT Authentication                                     │  │
│  │  • RBAC (6 rôles)                                        │  │
│  │  • SignalR (temps réel)                                  │  │
│  │  • Background Services                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                    PERSISTENCE & INTÉGRATIONS                   │
│  SQLite (Dev) / PostgreSQL (Prod) + MailKit + Twilio + OpenAI  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 DESIGN SYSTEM UNIFIÉ

### Palette de Couleurs
```css
:root {
  /* Couleurs Principales */
  --primary: #667eea;
  --primary-dark: #5568d3;
  --primary-light: #7c8ef0;
  
  /* Couleurs Secondaires */
  --secondary: #764ba2;
  --accent: #f093fb;
  
  /* Couleurs Sémantiques */
  --success: #28a745;
  --warning: #ffc107;
  --danger: #dc3545;
  --info: #17a2b8;
  
  /* Neutres */
  --gray-50: #f8f9fa;
  --gray-100: #e9ecef;
  --gray-200: #dee2e6;
  --gray-300: #ced4da;
  --gray-700: #495057;
  --gray-900: #212529;
  
  /* Typographie */
  --font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  --font-size-base: 16px;
  --line-height-base: 1.5;
  
  /* Espacements */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Bordures */
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  --border-radius-xl: 16px;
  
  /* Ombres */
  --shadow-sm: 0 2px 4px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 8px rgba(0,0,0,0.15);
  --shadow-lg: 0 10px 30px rgba(0,0,0,0.2);
  
  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 300ms ease;
  --transition-slow: 500ms ease;
}
```

### Composants UI Standards
```css
/* Boutons */
.btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Cartes */
.card {
  background: white;
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
}

/* Formulaires */
.form-control {
  width: 100%;
  padding: var(--spacing-sm);
  border: 2px solid var(--gray-200);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  transition: border-color var(--transition-fast);
}

.form-control:focus {
  outline: none;
  border-color: var(--primary);
}
```

---

## 📁 STRUCTURE DE PROJET HARMONISÉE

```
MemoLib/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # CI/CD Pipeline
│       ├── deploy-dev.yml            # Déploiement Dev
│       └── deploy-prod.yml           # Déploiement Prod
│
├── MemoLib.Api/
│   ├── Controllers/                  # API Endpoints (REST)
│   │   ├── v1/                       # Version 1
│   │   │   ├── AuthController.cs
│   │   │   ├── CasesController.cs
│   │   │   ├── ClientsController.cs
│   │   │   └── ...
│   │   └── v2/                       # Version 2 (future)
│   │
│   ├── Services/                     # Business Logic
│   │   ├── Core/
│   │   ├── Security/
│   │   ├── Communication/
│   │   └── Integration/
│   │
│   ├── Models/                       # Entités de données
│   │   ├── Core/
│   │   ├── DTOs/
│   │   └── ViewModels/
│   │
│   ├── Data/                         # Persistence
│   │   ├── MemoLibDbContext.cs
│   │   └── Migrations/
│   │
│   ├── Middleware/                   # Middleware ASP.NET
│   │   ├── SecurityHeadersMiddleware.cs
│   │   ├── RateLimitingMiddleware.cs
│   │   └── GlobalExceptionMiddleware.cs
│   │
│   ├── wwwroot/                      # Frontend Assets
│   │   ├── css/
│   │   │   ├── design-system.css     # Design System
│   │   │   └── components.css        # Composants
│   │   ├── js/
│   │   │   ├── api-client.js         # Client API
│   │   │   └── components/           # Composants JS
│   │   ├── demo.html                 # Interface principale
│   │   ├── intake-forms.html         # Formulaires
│   │   └── manifest.json             # PWA Manifest
│   │
│   ├── Tests/                        # Tests unitaires
│   │   ├── Controllers/
│   │   ├── Services/
│   │   └── Integration/
│   │
│   ├── appsettings.json              # Configuration
│   ├── appsettings.Development.json
│   ├── appsettings.Production.json
│   └── Program.cs
│
├── docs/                             # Documentation
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── CONTRIBUTING.md
│
├── scripts/                          # Scripts utilitaires
│   ├── backup-git.ps1
│   ├── restore-project.ps1
│   └── deploy.ps1
│
├── .gitignore
├── .editorconfig                     # Standards de code
├── README.md
└── LICENSE
```

---

## 🔄 CI/CD PIPELINE

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup .NET
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: '9.0.x'
    
    - name: Restore dependencies
      run: dotnet restore
      working-directory: ./MemoLib.Api
    
    - name: Build
      run: dotnet build --no-restore --configuration Release
      working-directory: ./MemoLib.Api
    
    - name: Run tests
      run: dotnet test --no-build --verbosity normal
      working-directory: ./MemoLib.Api
    
    - name: Publish
      run: dotnet publish -c Release -o ./publish
      working-directory: ./MemoLib.Api
    
    - name: Upload artifact
      uses: actions/upload-artifact@v3
      with:
        name: memolib-api
        path: ./MemoLib.Api/publish

  deploy-dev:
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    
    steps:
    - name: Download artifact
      uses: actions/download-artifact@v3
      with:
        name: memolib-api
    
    - name: Deploy to Dev
      run: echo "Deploy to development environment"
      # Ajouter commandes de déploiement

  deploy-prod:
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Download artifact
      uses: actions/download-artifact@v3
      with:
        name: memolib-api
    
    - name: Deploy to Production
      run: echo "Deploy to production environment"
      # Ajouter commandes de déploiement
```

---

## 🌿 STRATÉGIE GIT

### Branches
```
main            # Production (stable)
├── develop     # Développement (intégration)
├── feature/*   # Nouvelles fonctionnalités
├── bugfix/*    # Corrections de bugs
├── hotfix/*    # Corrections urgentes
└── release/*   # Préparation releases
```

### Workflow Git Flow

```bash
# Nouvelle fonctionnalité
git checkout develop
git checkout -b feature/formulaires-intelligents
# ... développement ...
git add .
git commit -m "feat: ajout formulaires intelligents"
git push origin feature/formulaires-intelligents
# Créer Pull Request vers develop

# Correction de bug
git checkout develop
git checkout -b bugfix/fix-email-validation
# ... correction ...
git commit -m "fix: validation email corrigée"
git push origin bugfix/fix-email-validation

# Hotfix production
git checkout main
git checkout -b hotfix/critical-security-fix
# ... correction ...
git commit -m "hotfix: correction faille sécurité"
git push origin hotfix/critical-security-fix
# Merge vers main ET develop
```

### Conventions de Commit

```bash
# Format: <type>(<scope>): <description>

# Types
feat:     # Nouvelle fonctionnalité
fix:      # Correction de bug
docs:     # Documentation
style:    # Formatage, pas de changement de code
refactor: # Refactoring
test:     # Ajout de tests
chore:    # Maintenance

# Exemples
feat(intake): ajout formulaires personnalisables
fix(auth): correction validation JWT
docs(api): mise à jour documentation endpoints
refactor(services): simplification ClientIntakeService
test(controllers): ajout tests CasesController
```

---

## 📦 VERSIONING SÉMANTIQUE

```
MAJOR.MINOR.PATCH

MAJOR: Changements incompatibles (breaking changes)
MINOR: Nouvelles fonctionnalités (rétrocompatibles)
PATCH: Corrections de bugs

Exemples:
1.0.0 → 1.0.1  (bugfix)
1.0.1 → 1.1.0  (nouvelle fonctionnalité)
1.1.0 → 2.0.0  (breaking change)
```

---

## 🚀 DÉPLOIEMENT

### Environnements

```
Development  → localhost:5078
Staging      → staging.memolib.com
Production   → app.memolib.com
```

### Configuration par Environnement

```json
// appsettings.Development.json
{
  "ConnectionStrings": {
    "Default": "Data Source=memolib-dev.db"
  },
  "UsePostgreSQL": false,
  "Logging": {
    "LogLevel": {
      "Default": "Debug"
    }
  }
}

// appsettings.Production.json
{
  "ConnectionStrings": {
    "Default": "Host=prod-db;Database=memolib;Username=app;Password=***"
  },
  "UsePostgreSQL": true,
  "Logging": {
    "LogLevel": {
      "Default": "Warning"
    }
  }
}
```

---

## 🧪 TESTS

### Structure des Tests

```
Tests/
├── Unit/
│   ├── Services/
│   │   ├── ClientIntakeServiceTests.cs
│   │   └── SharedWorkspaceServiceTests.cs
│   └── Controllers/
│       ├── CasesControllerTests.cs
│       └── ClientIntakeControllerTests.cs
├── Integration/
│   ├── ApiIntegrationTests.cs
│   └── DatabaseIntegrationTests.cs
└── E2E/
    └── OnboardingFlowTests.cs
```

### Exemple de Test

```csharp
public class ClientIntakeServiceTests
{
    [Fact]
    public async Task CreateFormTemplate_ShouldReturnForm()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<MemoLibDbContext>()
            .UseInMemoryDatabase("TestDb")
            .Options;
        var context = new MemoLibDbContext(options);
        var service = new ClientIntakeService(context);
        
        var form = new ClientIntakeForm
        {
            Name = "Test Form",
            Fields = new List<IntakeFormField>()
        };
        
        // Act
        var result = await service.CreateFormTemplateAsync(Guid.NewGuid(), form);
        
        // Assert
        Assert.NotNull(result);
        Assert.Equal("Test Form", result.Name);
    }
}
```

---

## 📊 MONITORING & OBSERVABILITÉ

### Logs Structurés (Serilog)

```csharp
Log.Information(
    "Form created: {FormId} by user {UserId}",
    form.Id, userId);

Log.Warning(
    "Failed login attempt for {Email} from {IpAddress}",
    email, ipAddress);

Log.Error(ex,
    "Error processing submission {SubmissionId}",
    submissionId);
```

### Métriques

```csharp
// Compteurs
_metrics.IncrementCounter("forms_created");
_metrics.IncrementCounter("submissions_received");

// Timers
using (_metrics.Timer("form_processing_duration"))
{
    await ProcessFormAsync(form);
}
```

---

## 🔒 SÉCURITÉ

### Checklist Sécurité

- [x] JWT avec expiration
- [x] HTTPS obligatoire en production
- [x] Rate limiting global et par endpoint
- [x] Validation des entrées (FluentValidation)
- [x] Protection CSRF
- [x] Headers de sécurité (CSP, HSTS, X-Frame-Options)
- [x] Secrets hors du code (User Secrets, Azure Key Vault)
- [x] Audit logging complet
- [x] GDPR compliance
- [x] Isolation multi-tenant

---

## 📚 DOCUMENTATION

### Documentation API (Swagger)

```csharp
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "MemoLib API",
        Version = "v1",
        Description = "API de gestion de dossiers juridiques"
    });
    
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey
    });
});
```

### Documentation Utilisateur

```
docs/
├── USER_GUIDE.md           # Guide utilisateur
├── ADMIN_GUIDE.md          # Guide administrateur
├── API_REFERENCE.md        # Référence API
├── DEPLOYMENT_GUIDE.md     # Guide de déploiement
└── TROUBLESHOOTING.md      # Dépannage
```

---

## 🎯 ROADMAP

### Version 2.0 (Q2 2025)
- [ ] Migration vers architecture microservices
- [ ] Kubernetes pour orchestration
- [ ] Redis pour cache distribué
- [ ] RabbitMQ pour messaging
- [ ] Elasticsearch pour recherche avancée

### Version 2.1 (Q3 2025)
- [ ] Application mobile (React Native)
- [ ] Notifications push
- [ ] Mode offline
- [ ] Synchronisation multi-device

---

## ✅ CHECKLIST QUALITÉ

### Avant chaque commit
- [ ] Code compilé sans erreur
- [ ] Tests unitaires passent
- [ ] Pas de secrets dans le code
- [ ] Code formaté (editorconfig)
- [ ] Commit message respecte conventions

### Avant chaque release
- [ ] Tous les tests passent
- [ ] Documentation à jour
- [ ] CHANGELOG.md mis à jour
- [ ] Version incrémentée
- [ ] Tag Git créé
- [ ] Release notes rédigées

---

## 🤝 CONTRIBUTION

### Process de Contribution

1. Fork le projet
2. Créer une branche feature
3. Développer et tester
4. Créer une Pull Request
5. Code review
6. Merge après approbation

### Standards de Code

```csharp
// Nommage
public class ClientIntakeService { }  // PascalCase pour classes
private readonly string _apiKey;      // _camelCase pour privés
public string ApiEndpoint { get; }    // PascalCase pour publics

// Commentaires
/// <summary>
/// Crée un nouveau formulaire d'inscription
/// </summary>
/// <param name="userId">ID de l'utilisateur</param>
/// <returns>Formulaire créé</returns>
public async Task<ClientIntakeForm> CreateFormAsync(Guid userId)
{
    // Implémentation
}
```

---

**🎉 Architecture harmonisée et prête pour la production !**
