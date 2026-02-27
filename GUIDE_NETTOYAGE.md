# 🧹 GUIDE NETTOYAGE CODE SOURCE

## 🎯 OBJECTIF

Nettoyer et optimiser le code source de MemoLib pour :
- Supprimer le code mort
- Optimiser les performances
- Améliorer la lisibilité
- Réduire la dette technique

---

## 📋 CHECKLIST NETTOYAGE

### **1. Fichiers inutiles** ✅

**À supprimer :**
```powershell
# Fichiers de build
Remove-Item bin, obj -Recurse -Force

# Fichiers temporaires
Remove-Item *.log, *.tmp -Force

# Fichiers de cache
Remove-Item .vs -Recurse -Force
```

**À garder :**
- Controllers/
- Services/
- Models/
- Data/
- wwwroot/
- Migrations/
- appsettings.json
- Program.cs

---

### **2. Code mort** 🗑️

**Rechercher :**
```csharp
// Méthodes jamais appelées
// Classes jamais utilisées
// Using inutiles
// Commentaires obsolètes
```

**Outils :**
```powershell
# Analyser avec Roslyn
dotnet build /p:TreatWarningsAsErrors=true

# Supprimer using inutiles
dotnet format --verify-no-changes
```

---

### **3. Optimisations** ⚡

**Controllers :**
```csharp
// ❌ Avant
public async Task<IActionResult> GetAll()
{
    var items = await _context.Items.ToListAsync();
    return Ok(items);
}

// ✅ Après
public async Task<IActionResult> GetAll()
{
    var items = await _context.Items
        .AsNoTracking()
        .Select(i => new { i.Id, i.Name })
        .ToListAsync();
    return Ok(items);
}
```

**Services :**
```csharp
// ❌ Avant
public async Task<List<Case>> GetCases(int userId)
{
    var cases = await _context.Cases
        .Where(c => c.UserId == userId)
        .ToListAsync();
    return cases;
}

// ✅ Après
public async Task<List<Case>> GetCases(int userId)
{
    return await _context.Cases
        .AsNoTracking()
        .Where(c => c.UserId == userId)
        .ToListAsync();
}
```

---

### **4. Conventions de nommage** 📝

**Respecter :**
```csharp
// Classes : PascalCase
public class EmailService { }

// Méthodes : PascalCase
public async Task SendEmail() { }

// Variables : camelCase
var emailAddress = "test@example.com";

// Constantes : UPPER_CASE
const int MAX_RETRIES = 3;

// Privés : _camelCase
private readonly ILogger _logger;
```

---

### **5. Documentation** 📚

**Ajouter XML comments :**
```csharp
/// <summary>
/// Envoie un email à un destinataire
/// </summary>
/// <param name="to">Adresse email destinataire</param>
/// <param name="subject">Sujet de l'email</param>
/// <returns>True si envoyé avec succès</returns>
public async Task<bool> SendEmail(string to, string subject)
{
    // ...
}
```

---

### **6. Gestion erreurs** ⚠️

**Standardiser :**
```csharp
// ❌ Avant
try {
    // code
} catch (Exception ex) {
    Console.WriteLine(ex.Message);
}

// ✅ Après
try {
    // code
} catch (Exception ex) {
    _logger.LogError(ex, "Erreur lors de l'envoi email");
    throw;
}
```

---

### **7. Injection dépendances** 💉

**Vérifier Program.cs :**
```csharp
// Tous les services enregistrés
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<CaseService>();
// etc.

// Pas de new() dans les controllers
// ❌ var service = new EmailService();
// ✅ private readonly EmailService _service;
```

---

### **8. Tests unitaires** 🧪

**Créer dossier Tests/ :**
```
MemoLib.Tests/
├── Services/
│   ├── EmailServiceTests.cs
│   └── CaseServiceTests.cs
├── Controllers/
│   └── CasesControllerTests.cs
└── MemoLib.Tests.csproj
```

**Exemple test :**
```csharp
[Fact]
public async Task SendEmail_ValidInput_ReturnsTrue()
{
    // Arrange
    var service = new EmailService(_mockLogger.Object);
    
    // Act
    var result = await service.SendEmail("test@test.com", "Test");
    
    // Assert
    Assert.True(result);
}
```

---

### **9. Sécurité** 🔒

**Vérifier :**
```csharp
// ✅ Pas de secrets en dur
// ❌ var password = "MonMotDePasse123";
// ✅ var password = _config["EmailMonitor:Password"];

// ✅ Validation entrées
// ✅ Authentification JWT
// ✅ HTTPS obligatoire
// ✅ CORS configuré
```

---

### **10. Performance** 🚀

**Optimiser requêtes :**
```csharp
// ❌ N+1 queries
foreach (var case in cases) {
    var client = await _context.Clients.FindAsync(case.ClientId);
}

// ✅ Include
var cases = await _context.Cases
    .Include(c => c.Client)
    .ToListAsync();
```

---

## 🛠️ OUTILS RECOMMANDÉS

### **1. Analyzers**
```xml
<ItemGroup>
  <PackageReference Include="Microsoft.CodeAnalysis.NetAnalyzers" />
  <PackageReference Include="StyleCop.Analyzers" />
  <PackageReference Include="SonarAnalyzer.CSharp" />
</ItemGroup>
```

### **2. Formatage**
```powershell
# Installer dotnet-format
dotnet tool install -g dotnet-format

# Formater le code
dotnet format
```

### **3. Analyse statique**
```powershell
# SonarQube (gratuit pour open source)
dotnet sonarscanner begin /k:"MemoLib"
dotnet build
dotnet sonarscanner end
```

---

## 📊 MÉTRIQUES QUALITÉ

### **Objectifs :**
```
Code Coverage : > 80%
Complexité cyclomatique : < 10
Duplication : < 5%
Warnings : 0
Erreurs : 0
```

### **Mesurer :**
```powershell
# Coverage
dotnet test /p:CollectCoverage=true

# Complexité
dotnet tool install -g dotnet-complexity
dotnet complexity

# Duplication
dotnet tool install -g duplicate-finder
duplicate-finder
```

---

## ✅ CHECKLIST FINALE

Avant de commiter :

- [ ] Code compilé sans warnings
- [ ] Tests passent (si existants)
- [ ] Pas de secrets en dur
- [ ] Documentation à jour
- [ ] Formatage correct
- [ ] Pas de code commenté
- [ ] Pas de console.log/debug
- [ ] Migrations à jour
- [ ] README.md à jour

---

## 🚀 SCRIPT AUTOMATIQUE

**Exécuter :**
```powershell
.\clean-and-update.ps1
```

**Ce script fait :**
1. Nettoie bin/obj
2. Restaure packages
3. Applique migrations
4. Compile en Release
5. Supprime fichiers temporaires
6. Vérifie configuration

---

## 📝 COMMIT MESSAGE

**Format :**
```
type(scope): description

[optional body]
[optional footer]
```

**Types :**
- feat: Nouvelle fonctionnalité
- fix: Correction bug
- refactor: Refactoring
- docs: Documentation
- style: Formatage
- test: Tests
- chore: Maintenance

**Exemple :**
```
refactor(services): optimiser requêtes EmailService

- Ajouter AsNoTracking()
- Réduire projections
- Supprimer code mort

Performance: -30% temps requête
```

---

## 🎯 RÉSULTAT ATTENDU

**Avant nettoyage :**
```
Fichiers : 250
Lignes : 15,000
Warnings : 45
Build : 12s
```

**Après nettoyage :**
```
Fichiers : 180
Lignes : 12,000
Warnings : 0
Build : 8s
```

**Amélioration : 20-30%** ✅

---

## 💡 BONNES PRATIQUES

1. **Nettoyer régulièrement** (1x/semaine)
2. **Commiter souvent** (petits commits)
3. **Tester avant commit**
4. **Documenter changements**
5. **Reviewer code** (pair programming)

---

## 🚀 PROCHAINES ÉTAPES

Après nettoyage :
1. Ajouter tests unitaires
2. Configurer CI/CD
3. Automatiser déploiement
4. Monitoring production

**Code propre = Succès assuré ! 🎉**
