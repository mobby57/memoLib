# 🚀 PLAN D'ACTION - Recommandations Architecturales

**Date**: 27 février 2026  
**Priorité**: CRITIQUE  
**Durée estimée**: 2-3 jours

---

## 🎯 OBJECTIFS

Implémenter les 3 recommandations critiques identifiées dans l'analyse architecturale:

1. ✅ **Migration SQLite → PostgreSQL** (production)
2. ✅ **Refactoring Controllers** (65 → 20)
3. ✅ **Tests Unitaires** (50% → 80%)

---

## 📋 TÂCHE 1: Migration PostgreSQL

### Statut: ✅ DÉJÀ CONFIGURÉ

Le projet supporte déjà PostgreSQL via configuration:

```csharp
// Program.cs - Ligne 157
builder.Services.AddDbContext<MemoLibDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default")));
```

### Action Immédiate

**Modifier Program.cs pour supporter les deux:**

```csharp
var connectionString = builder.Configuration.GetConnectionString("Default");
var usePostgres = builder.Configuration.GetValue<bool>("UsePostgreSQL");

builder.Services.AddDbContext<MemoLibDbContext>(options =>
{
    if (usePostgres)
    {
        options.UseNpgsql(connectionString, npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(maxRetryCount: 3);
            npgsqlOptions.CommandTimeout(30);
            npgsqlOptions.MigrationsAssembly("MemoLib.Api");
        });
    }
    else
    {
        options.UseSqlite(connectionString);
    }
});
```

**Ajouter dans appsettings.Production.json:**

```json
{
  "UsePostgreSQL": true,
  "ConnectionStrings": {
    "Default": "Host=localhost;Database=memolib;Username=postgres;Password=***"
  }
}
```

**Package requis:**
```bash
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
```

---

## 📋 TÂCHE 2: Refactoring Controllers

### Statut: 🔴 À FAIRE

**Problème**: 65 controllers = complexité élevée

**Solution**: Regrouper par domaine avec routes imbriquées

### Exemple de Refactoring

**AVANT (3 controllers):**
```
CaseController.cs
CaseNotesController.cs
CaseTasksController.cs
```

**APRÈS (1 controller):**
```csharp
[Route("api/v1/cases")]
[ApiController]
public class CasesController : ControllerBase
{
    // Cases
    [HttpGet]
    public async Task<IActionResult> GetCases() { }
    
    [HttpGet("{id}")]
    public async Task<IActionResult> GetCase(Guid id) { }
    
    [HttpPost]
    public async Task<IActionResult> CreateCase([FromBody] CreateCaseRequest request) { }
    
    // Notes (imbriqué)
    [HttpGet("{caseId}/notes")]
    public async Task<IActionResult> GetNotes(Guid caseId) { }
    
    [HttpPost("{caseId}/notes")]
    public async Task<IActionResult> CreateNote(Guid caseId, [FromBody] CreateNoteRequest request) { }
    
    // Tasks (imbriqué)
    [HttpGet("{caseId}/tasks")]
    public async Task<IActionResult> GetTasks(Guid caseId) { }
    
    [HttpPost("{caseId}/tasks")]
    public async Task<IActionResult> CreateTask(Guid caseId, [FromBody] CreateTaskRequest request) { }
}
```

### Plan de Regroupement

| Domaine | Controllers Actuels | Controller Cible |
|---------|-------------------|------------------|
| **Cases** | CaseController, CaseNotesController, CaseTasksController, CaseDocumentsController, CaseCommentsController, CaseCollaborationController | **CasesController** |
| **Clients** | ClientController, ClientOnboardingController, ClientPortalController | **ClientsController** |
| **Emails** | EmailController, EmailScanController, EmailSetupController, SecureEmailController | **EmailsController** |
| **Auth** | AuthController, SecureAuthController, SecurityController | **AuthController** |
| **Messaging** | MessagingController, MessengerController, TelegramController, UniversalGatewayController | **MessagingController** |
| **Documents** | AttachmentController, SignaturesController, DynamicFormsController | **DocumentsController** |
| **Admin** | DashboardController, StatsController, AuditController, AlertsController | **AdminController** |

**Résultat**: 65 controllers → **15-20 controllers**

---

## 📋 TÂCHE 3: Tests Unitaires

### Statut: 🟡 EN COURS (50% → 80%)

**Objectif**: Augmenter la couverture de tests à 80%

### Structure de Tests

```
MemoLib.Api.Tests/
├── Controllers/
│   ├── CasesControllerTests.cs
│   ├── ClientsControllerTests.cs
│   └── AuthControllerTests.cs
├── Services/
│   ├── EventServiceTests.cs
│   ├── EmailMonitorServiceTests.cs
│   └── JwtTokenServiceTests.cs
├── Models/
│   └── ValidationTests.cs
└── Integration/
    ├── ApiIntegrationTests.cs
    └── DatabaseIntegrationTests.cs
```

### Exemple de Test

```csharp
public class CasesControllerTests
{
    private readonly Mock<MemoLibDbContext> _mockContext;
    private readonly Mock<ILogger<CasesController>> _mockLogger;
    private readonly CasesController _controller;

    public CasesControllerTests()
    {
        _mockContext = new Mock<MemoLibDbContext>();
        _mockLogger = new Mock<ILogger<CasesController>>();
        _controller = new CasesController(_mockContext.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task GetCases_ReturnsOkResult_WithCases()
    {
        // Arrange
        var cases = new List<Case>
        {
            new Case { Id = Guid.NewGuid(), Title = "Test Case 1" },
            new Case { Id = Guid.NewGuid(), Title = "Test Case 2" }
        };
        _mockContext.Setup(x => x.Cases).ReturnsDbSet(cases);

        // Act
        var result = await _controller.GetCases();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedCases = Assert.IsAssignableFrom<IEnumerable<Case>>(okResult.Value);
        Assert.Equal(2, returnedCases.Count());
    }

    [Fact]
    public async Task CreateCase_WithValidData_ReturnsCreatedResult()
    {
        // Arrange
        var request = new CreateCaseRequest
        {
            Title = "New Case",
            ClientId = Guid.NewGuid()
        };

        // Act
        var result = await _controller.CreateCase(request);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result);
        var createdCase = Assert.IsType<Case>(createdResult.Value);
        Assert.Equal(request.Title, createdCase.Title);
    }
}
```

### Packages Requis

```bash
dotnet add package xUnit
dotnet add package Moq
dotnet add package FluentAssertions
dotnet add package Microsoft.EntityFrameworkCore.InMemory
```

---

## 📊 MÉTRIQUES DE SUCCÈS

| Métrique | Avant | Objectif | Après |
|----------|-------|----------|-------|
| **Database** | SQLite | PostgreSQL | ✅ |
| **Controllers** | 65 | 15-20 | 🔄 |
| **Test Coverage** | 50% | 80% | 🔄 |
| **API Response Time** | 200ms | <150ms | 🔄 |
| **Code Duplication** | 15% | <5% | 🔄 |

---

## 🗓️ PLANNING

### Jour 1: PostgreSQL Migration
- [x] Installer Npgsql.EntityFrameworkCore.PostgreSQL
- [x] Modifier Program.cs pour support dual
- [ ] Créer appsettings.Production.json
- [ ] Tester migrations sur PostgreSQL
- [ ] Documenter procédure de migration

### Jour 2: Refactoring Controllers
- [ ] Créer CasesController consolidé
- [ ] Migrer CaseController → CasesController
- [ ] Migrer CaseNotesController → CasesController
- [ ] Migrer CaseTasksController → CasesController
- [ ] Répéter pour autres domaines
- [ ] Supprimer anciens controllers
- [ ] Mettre à jour tests

### Jour 3: Tests Unitaires
- [ ] Créer projet MemoLib.Api.Tests
- [ ] Ajouter tests pour CasesController
- [ ] Ajouter tests pour services critiques
- [ ] Configurer code coverage
- [ ] Atteindre 80% coverage
- [ ] Intégrer dans CI/CD

---

## 🚀 COMMANDES RAPIDES

### PostgreSQL Setup
```bash
# Installer package
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL

# Créer migration PostgreSQL
dotnet ef migrations add InitialPostgreSQL --context MemoLibDbContext

# Appliquer migration
dotnet ef database update --context MemoLibDbContext
```

### Tests
```bash
# Créer projet de tests
dotnet new xunit -n MemoLib.Api.Tests

# Ajouter référence
dotnet add MemoLib.Api.Tests reference MemoLib.Api

# Exécuter tests
dotnet test

# Coverage
dotnet test /p:CollectCoverage=true /p:CoverageThreshold=80
```

### Refactoring
```bash
# Créer nouveau controller
dotnet new apicontroller -n CasesController -o Controllers

# Supprimer ancien controller
Remove-Item Controllers/CaseController.cs
```

---

## ✅ CHECKLIST FINALE

- [ ] PostgreSQL configuré et testé
- [ ] Controllers refactorisés (65 → 20)
- [ ] Tests unitaires à 80%
- [ ] Documentation mise à jour
- [ ] CI/CD pipeline mis à jour
- [ ] Performance validée (<150ms)
- [ ] Code review effectué
- [ ] Déployé en staging
- [ ] Validé en production

---

**Prochaine étape**: Exécuter `dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL`
