# 🎯 Plan d'Action Post-Audit - MemoLib

**Date:** 2025-03-09  
**Basé sur:** AUDIT_DEV_SENIORS.md  
**Objectif:** Production-ready en 3-4 semaines

---

## 📋 Sprint 1: Sécurité & Tests (Semaine 1-2)

### 🔴 Jour 1-2: Sécurisation Secrets

**Tâches:**
- [ ] Migrer JWT SecretKey vers User Secrets
- [ ] Créer script de génération de secrets sécurisés
- [ ] Supprimer secrets de appsettings.json
- [ ] Ajouter appsettings.*.json au .gitignore
- [ ] Documenter configuration secrets

**Commandes:**
```powershell
# Générer secret JWT sécurisé
$secret = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
dotnet user-secrets set "JwtSettings:SecretKey" $secret

# Vault Master Key
$vaultKey = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
dotnet user-secrets set "Vault:MasterKey" $vaultKey
```

### 🔴 Jour 3-5: Tests Unitaires (Priorité 1)

**Objectif:** 50% coverage sur services critiques

**Tâches:**
- [ ] Configurer xUnit + Moq + FluentAssertions
- [ ] Tests PasswordService (hashing, validation)
- [ ] Tests JwtTokenService (génération, validation)
- [ ] Tests ClientInfoExtractor (regex, extraction)
- [ ] Tests EventService (création, recherche)

**Fichier:** `tests/Services/PasswordServiceTests.cs`
```csharp
public class PasswordServiceTests
{
    private readonly PasswordService _sut = new();

    [Fact]
    public void HashPassword_ShouldReturnDifferentHashForSamePassword()
    {
        var hash1 = _sut.HashPassword("Test123!");
        var hash2 = _sut.HashPassword("Test123!");
        Assert.NotEqual(hash1, hash2);
    }

    [Fact]
    public void VerifyPassword_WithCorrectPassword_ShouldReturnTrue()
    {
        var password = "Test123!";
        var hash = _sut.HashPassword(password);
        Assert.True(_sut.VerifyPassword(password, hash));
    }
}
```

### 🔴 Jour 6-8: Tests d'Intégration

**Objectif:** Tester les endpoints critiques

**Tâches:**
- [ ] Configurer WebApplicationFactory
- [ ] Tests AuthController (register, login)
- [ ] Tests CaseController (CRUD)
- [ ] Tests ClientController (CRUD)
- [ ] Tests avec base de données en mémoire

**Fichier:** `tests/Integration/AuthControllerTests.cs`
```csharp
public class AuthControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public AuthControllerTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Register_WithValidData_ReturnsToken()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "test@test.com",
            password = "Test123!",
            name = "Test User"
        });

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(result?.Token);
    }
}
```

### 🔴 Jour 9-10: Rate Limiting & Pagination

**Tâches:**
- [ ] Implémenter rate limiting par endpoint
- [ ] Ajouter pagination obligatoire sur toutes les listes
- [ ] Tests rate limiting
- [ ] Documentation API avec limites

**Fichier:** `Program.cs` (ajout)
```csharp
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("api", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.PermitLimit = 100;
        opt.QueueLimit = 0;
    });

    options.AddFixedWindowLimiter("auth", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(5);
        opt.PermitLimit = 5;
    });
});

app.UseRateLimiter();
```

---

## 📋 Sprint 2: Observabilité & Performance (Semaine 3)

### 🟠 Jour 11-12: OpenTelemetry

**Tâches:**
- [ ] Installer OpenTelemetry packages
- [ ] Configurer métriques (compteurs, histogrammes)
- [ ] Configurer tracing distribué
- [ ] Exporter vers Prometheus + Jaeger

**Packages:**
```xml
<PackageReference Include="OpenTelemetry.Extensions.Hosting" Version="1.7.0" />
<PackageReference Include="OpenTelemetry.Instrumentation.AspNetCore" Version="1.7.0" />
<PackageReference Include="OpenTelemetry.Instrumentation.EntityFrameworkCore" Version="1.0.0-beta.9" />
<PackageReference Include="OpenTelemetry.Exporter.Prometheus.AspNetCore" Version="1.7.0-rc.1" />
<PackageReference Include="OpenTelemetry.Exporter.Jaeger" Version="1.5.1" />
```

### 🟠 Jour 13-14: DTOs + AutoMapper

**Tâches:**
- [ ] Installer AutoMapper
- [ ] Créer DTOs pour toutes les entités
- [ ] Configurer mappings
- [ ] Refactorer controllers pour utiliser DTOs

**Structure:**
```
Contracts/
├── Dtos/
│   ├── CaseDto.cs
│   ├── CreateCaseDto.cs
│   ├── UpdateCaseDto.cs
│   ├── ClientDto.cs
│   └── ...
└── Mappings/
    └── AutoMapperProfile.cs
```

### 🟠 Jour 15-16: Swagger + Documentation

**Tâches:**
- [ ] Installer Swashbuckle
- [ ] Configurer Swagger UI
- [ ] Ajouter XML comments
- [ ] Documenter tous les endpoints

**Configuration:**
```csharp
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "MemoLib API",
        Version = "v2.0",
        Description = "API de gestion d'emails pour cabinets d'avocats"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });
});
```

### 🟠 Jour 17-18: Optimisations Performance

**Tâches:**
- [ ] Ajouter response compression (Gzip)
- [ ] Configurer response caching
- [ ] Optimiser queries EF Core (Include, AsNoTracking)
- [ ] Ajouter pagination helper

**Fichier:** `Helpers/PagedResult.cs`
```csharp
public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasPrevious => Page > 1;
    public bool HasNext => Page < TotalPages;
}
```

---

## 📋 Sprint 3: DevOps & Production (Semaine 4)

### 🟡 Jour 19-20: CI/CD Pipeline

**Tâches:**
- [ ] Créer workflow GitHub Actions
- [ ] Build + Test automatique
- [ ] Analyse de code (SonarCloud)
- [ ] Déploiement automatique staging

**Fichier:** `.github/workflows/ci-cd.yml`
```yaml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v3
        with:
          dotnet-version: '9.0.x'
      
      - name: Restore
        run: dotnet restore
      
      - name: Build
        run: dotnet build --no-restore --configuration Release
      
      - name: Test
        run: dotnet test --no-build --configuration Release --verbosity normal
      
      - name: Publish
        run: dotnet publish -c Release -o ./publish
```

### 🟡 Jour 21-22: Consolidation Migrations

**Tâches:**
- [ ] Backup base de données
- [ ] Générer script SQL consolidé
- [ ] Créer migration unique
- [ ] Tester sur environnement propre

**Commandes:**
```powershell
# Générer script SQL complet
dotnet ef migrations script --idempotent -o migrations-consolidated.sql

# Supprimer anciennes migrations (après backup!)
Remove-Item Migrations/*.cs

# Créer migration consolidée
dotnet ef migrations add ConsolidatedSchema
```

### 🟡 Jour 23-24: Monitoring Production

**Tâches:**
- [ ] Configurer health checks détaillés
- [ ] Ajouter alerting (email/Slack)
- [ ] Créer dashboards Grafana
- [ ] Documenter runbooks

**Health Checks:**
```csharp
builder.Services.AddHealthChecks()
    .AddDbContextCheck<MemoLibDbContext>("database")
    .AddCheck<EmailServiceHealthCheck>("email")
    .AddCheck<RedisHealthCheck>("cache")
    .AddCheck("disk_space", () =>
    {
        var drive = new DriveInfo("C");
        var freeSpaceGB = drive.AvailableFreeSpace / 1024 / 1024 / 1024;
        return freeSpaceGB > 10
            ? HealthCheckResult.Healthy($"{freeSpaceGB}GB free")
            : HealthCheckResult.Degraded($"Only {freeSpaceGB}GB free");
    });
```

### 🟡 Jour 25-26: Documentation Finale

**Tâches:**
- [ ] Mettre à jour README.md
- [ ] Créer PRODUCTION_CHECKLIST.md
- [ ] Documenter architecture (ADR)
- [ ] Guide de troubleshooting

---

## 📊 Métriques de Succès

### Avant (Actuel)
```
Tests:              0
Code Coverage:      0%
Secrets sécurisés:  ❌
Rate Limiting:      Partiel
Pagination:         ❌
Observabilité:      Basique
CI/CD:              ❌
Documentation API:  ❌
```

### Après (Objectif)
```
Tests:              200+
Code Coverage:      80%
Secrets sécurisés:  ✅
Rate Limiting:      ✅ Par endpoint
Pagination:         ✅ Obligatoire
Observabilité:      ✅ OpenTelemetry
CI/CD:              ✅ GitHub Actions
Documentation API:  ✅ Swagger
```

---

## 🚀 Commandes Rapides

### Lancer tous les tests
```powershell
dotnet test --collect:"XPlat Code Coverage"
```

### Générer rapport de coverage
```powershell
dotnet tool install -g dotnet-reportgenerator-globaltool
reportgenerator -reports:**/coverage.cobertura.xml -targetdir:coverage-report
```

### Vérifier secrets
```powershell
dotnet user-secrets list
```

### Build production
```powershell
dotnet publish -c Release -o ./publish
```

---

## 📝 Checklist Production-Ready

- [ ] ✅ Tests unitaires (80% coverage)
- [ ] ✅ Tests d'intégration (endpoints critiques)
- [ ] ✅ Secrets sécurisés (User Secrets / Key Vault)
- [ ] ✅ Rate limiting par endpoint
- [ ] ✅ Pagination obligatoire
- [ ] ✅ DTOs + AutoMapper
- [ ] ✅ Swagger documentation
- [ ] ✅ OpenTelemetry (métriques + tracing)
- [ ] ✅ Response compression
- [ ] ✅ Response caching
- [ ] ✅ CI/CD pipeline
- [ ] ✅ Migrations consolidées
- [ ] ✅ Health checks détaillés
- [ ] ✅ Monitoring + alerting
- [ ] ✅ Documentation complète

---

## 🎯 Prochaines Étapes

1. **Lire l'audit complet:** `AUDIT_DEV_SENIORS.md`
2. **Commencer Sprint 1:** Sécurité + Tests
3. **Daily standup:** Suivre progression
4. **Code review:** Chaque PR
5. **Re-audit:** Fin semaine 4

**Effort estimé:** 3-4 semaines (1 dev senior)

**Contact:** Ouvrir issue GitHub pour questions
