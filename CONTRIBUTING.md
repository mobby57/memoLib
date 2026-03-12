# 🤝 Guide de Contribution - MemoLib

## 🌿 Workflow Git

### Branches
```
main            # Production (stable)
├── develop     # Développement (intégration)
├── feature/*   # Nouvelles fonctionnalités
├── bugfix/*    # Corrections de bugs
└── hotfix/*    # Corrections urgentes
```

### Créer une Feature
```bash
git checkout develop
git pull origin develop
git checkout -b feature/nom-de-la-feature
# ... développement ...
git add .
git commit -m "feat: description de la feature"
git push origin feature/nom-de-la-feature
# Créer Pull Request vers develop
```

### Conventions de Commit
```
feat:     Nouvelle fonctionnalité
fix:      Correction de bug
docs:     Documentation
style:    Formatage
refactor: Refactoring
test:     Tests
chore:    Maintenance

Exemples:
feat(intake): ajout formulaires personnalisables
fix(auth): correction validation JWT
docs(api): mise à jour documentation
```

## ✅ Checklist Avant Commit

- [ ] Code compilé sans erreur
- [ ] Tests unitaires passent
- [ ] Pas de secrets dans le code
- [ ] Code formaté (.editorconfig)
- [ ] Commit message respecte conventions

## 🧪 Tests

```bash
# Lancer tous les tests
dotnet test

# Lancer tests spécifiques
dotnet test --filter "FullyQualifiedName~ClientIntakeServiceTests"
```

## 📝 Standards de Code

### C#
```csharp
// PascalCase pour classes et méthodes
public class ClientIntakeService { }

// _camelCase pour champs privés
private readonly string _apiKey;

// PascalCase pour propriétés publiques
public string ApiEndpoint { get; }

// Commentaires XML pour méthodes publiques
/// <summary>
/// Crée un nouveau formulaire
/// </summary>
public async Task<Form> CreateAsync() { }
```

### JavaScript
```javascript
// camelCase pour variables et fonctions
const apiClient = new ApiClient();

// PascalCase pour classes
class FormBuilder { }

// UPPER_CASE pour constantes
const API_URL = 'http://localhost:5078';
```

## 🚀 Process de Review

1. Créer Pull Request
2. Décrire les changements
3. Lier les issues concernées
4. Attendre review (1-2 reviewers)
5. Corriger si nécessaire
6. Merge après approbation

## 📞 Support

Questions ? Ouvrez une issue sur GitHub.
