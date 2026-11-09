# 🧪 MemoLib Tests

Tests unitaires et d'intégration pour l'API MemoLib.

## 📦 Installation

```bash
cd Tests
dotnet restore
```

## 🚀 Exécution

### Tous les tests
```bash
dotnet test
```

### Tests avec verbosité
```bash
dotnet test --verbosity detailed
```

### Tests spécifiques
```bash
# Tests d'un controller
dotnet test --filter "FullyQualifiedName~AuthController"

# Tests d'une méthode
dotnet test --filter "FullyQualifiedName~Register"
```

### Couverture de code
```bash
dotnet test --collect:"XPlat Code Coverage"
```

## 📊 Rapport de Couverture

```bash
# Installer ReportGenerator
dotnet tool install -g dotnet-reportgenerator-globaltool

# Générer le rapport HTML
reportgenerator -reports:"**/coverage.cobertura.xml" -targetdir:"coveragereport" -reporttypes:Html

# Ouvrir le rapport
start coveragereport/index.html
```

## 📝 Structure

```
Tests/
├── Controllers/
│   ├── AuthControllerTests.cs
│   ├── CaseControllerTests.cs
│   └── ClientControllerTests.cs
├── Services/
│   ├── JwtTokenServiceTests.cs
│   └── PasswordServiceTests.cs
└── Integration/
    └── ApiIntegrationTests.cs
```

## ✅ Tests Implémentés

### AuthController (5 tests)
- ✅ Register avec données valides
- ✅ Register avec email invalide
- ✅ Login avec credentials valides
- ✅ Login avec credentials invalides
- ✅ Protection brute-force

### CaseController (5 tests)
- ✅ Création de dossier
- ✅ Récupération par ID
- ✅ Mise à jour statut
- ✅ Filtrage par priorité
- ✅ Tests paramétrés (Theory)

## 🎯 Objectifs de Couverture

- **Minimum**: 70%
- **Cible**: 80%
- **Idéal**: 90%+

## 🔧 Configuration

### appsettings.Test.json
```json
{
  "ConnectionStrings": {
    "Default": "Data Source=:memory:"
  }
}
```

## 📈 CI/CD

Les tests sont exécutés automatiquement sur chaque:
- Push sur develop/main
- Pull Request
- Nightly build (2 AM)

## 🐛 Debugging

### Visual Studio
1. Ouvrir Test Explorer
2. Clic droit > Debug

### VS Code
1. Installer extension .NET Test Explorer
2. Clic sur icône debug

### CLI
```bash
dotnet test --logger "console;verbosity=detailed"
```

## 📚 Ressources

- [xUnit Documentation](https://xunit.net/)
- [Moq Documentation](https://github.com/moq/moq4)
- [.NET Testing Best Practices](https://docs.microsoft.com/dotnet/core/testing/)
