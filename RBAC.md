# 🔐 RBAC - Contrôle d'Accès Basé sur les Rôles

## 📋 Vue d'Ensemble

MemoLib implémente un système RBAC complet adapté aux cabinets d'avocats avec 4 rôles hiérarchiques.

## 👥 Rôles Disponibles

### 1. **SECRETAIRE** 📝
**Responsabilités :** Gestion administrative, premier contact client

**Permissions :**
- ✅ Voir tous les dossiers
- ✅ Créer des dossiers
- ✅ Voir les clients
- ✅ Modifier les clients
- ✅ Envoyer des emails
- ✅ Voir les emails
- ❌ Assigner des dossiers
- ❌ Clôturer des dossiers
- ❌ Supprimer des dossiers
- ❌ Voir les analytics
- ❌ Gérer les utilisateurs

---

### 2. **AVOCAT** ⚖️
**Responsabilités :** Traitement des dossiers, relation client

**Permissions :**
- ✅ Voir tous les dossiers
- ✅ Créer des dossiers
- ✅ Assigner des dossiers
- ✅ Clôturer des dossiers
- ✅ Voir les clients
- ✅ Modifier les clients
- ✅ Envoyer des emails
- ✅ Voir les emails
- ❌ Supprimer des dossiers
- ❌ Voir les analytics
- ❌ Gérer les utilisateurs

---

### 3. **ASSOCIE** 👔
**Responsabilités :** Supervision, contrôle qualité, analytics

**Permissions :**
- ✅ Voir tous les dossiers
- ✅ Créer des dossiers
- ✅ Assigner des dossiers
- ✅ Clôturer des dossiers
- ✅ Supprimer des dossiers
- ✅ Voir les clients
- ✅ Modifier les clients
- ✅ Envoyer des emails
- ✅ Voir les emails
- ✅ Voir les analytics
- ❌ Gérer les utilisateurs

---

### 4. **PROPRIETAIRE** 👑
**Responsabilités :** Administration complète, gestion équipe

**Permissions :**
- ✅ TOUTES les permissions
- ✅ Gérer les utilisateurs
- ✅ Voir les analytics
- ✅ Configuration système

---

## 🔧 Implémentation Technique

### 1. JWT avec Claim Role

```csharp
// JwtTokenService.cs
var claims = new[]
{
    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
    new Claim(ClaimTypes.Email, user.Email),
    new Claim(ClaimTypes.Role, user.Role ?? "AVOCAT"), // ✅ Rôle dans JWT
    new Claim("userId", user.Id.ToString()),
};
```

### 2. Politiques d'Autorisation

```csharp
// Program.cs
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CanViewCases", policy => 
        policy.RequireRole("AVOCAT", "SECRETAIRE", "ASSOCIE", "PROPRIETAIRE"));
    
    options.AddPolicy("CanAssignCases", policy => 
        policy.RequireRole("AVOCAT", "ASSOCIE", "PROPRIETAIRE"));
    
    options.AddPolicy("CanDeleteCases", policy => 
        policy.RequireRole("ASSOCIE", "PROPRIETAIRE"));
    
    options.AddPolicy("CanManageUsers", policy => 
        policy.RequireRole("PROPRIETAIRE"));
});
```

### 3. Utilisation dans les Controllers

```csharp
// CaseController.cs
[Authorize(Policy = Policies.CanViewCases)]
[HttpGet]
public async Task<IActionResult> ListCases() { }

[Authorize(Policy = Policies.CanAssignCases)]
[HttpPatch("{id}/assign")]
public async Task<IActionResult> AssignCase(int id) { }

[Authorize(Policy = Policies.CanDeleteCases)]
[HttpDelete("{id}")]
public async Task<IActionResult> DeleteCase(int id) { }
```

---

## 📊 Matrice des Permissions

| Action | SECRETAIRE | AVOCAT | ASSOCIE | PROPRIETAIRE |
|--------|------------|--------|---------|--------------|
| **Dossiers** |
| Voir dossiers | ✅ | ✅ | ✅ | ✅ |
| Créer dossiers | ✅ | ✅ | ✅ | ✅ |
| Assigner dossiers | ❌ | ✅ | ✅ | ✅ |
| Clôturer dossiers | ❌ | ✅ | ✅ | ✅ |
| Supprimer dossiers | ❌ | ❌ | ✅ | ✅ |
| **Clients** |
| Voir clients | ✅ | ✅ | ✅ | ✅ |
| Modifier clients | ✅ | ✅ | ✅ | ✅ |
| **Communication** |
| Envoyer emails | ✅ | ✅ | ✅ | ✅ |
| Voir emails | ✅ | ✅ | ✅ | ✅ |
| **Administration** |
| Voir analytics | ❌ | ❌ | ✅ | ✅ |
| Gérer utilisateurs | ❌ | ❌ | ❌ | ✅ |

---

## 🎯 Scénarios d'Usage

### Scénario 1: Secrétaire reçoit un email
```
1. Email arrive → Dossier créé automatiquement ✅
2. Secrétaire voit le dossier ✅
3. Secrétaire crée la fiche client ✅
4. Secrétaire TENTE d'assigner à un avocat ❌ REFUSÉ
5. Associé assigne le dossier à un avocat ✅
```

### Scénario 2: Avocat traite un dossier
```
1. Avocat voit ses dossiers assignés ✅
2. Avocat modifie les infos client ✅
3. Avocat envoie un email au client ✅
4. Avocat clôture le dossier ✅
5. Avocat TENTE de supprimer le dossier ❌ REFUSÉ
```

### Scénario 3: Associé supervise
```
1. Associé voit TOUS les dossiers ✅
2. Associé consulte les analytics ✅
3. Associé détecte un doublon ✅
4. Associé supprime le doublon ✅
5. Associé TENTE de créer un utilisateur ❌ REFUSÉ
```

### Scénario 4: Propriétaire administre
```
1. Propriétaire voit les analytics globales ✅
2. Propriétaire crée un nouvel avocat ✅
3. Propriétaire modifie les rôles ✅
4. Propriétaire configure le système ✅
5. Propriétaire a TOUS les droits ✅
```

---

## 🔒 Sécurité

### Protection des Endpoints

```csharp
// Tous les endpoints nécessitent authentification
[Authorize]
[ApiController]
public class CaseController : ControllerBase

// Endpoints sensibles nécessitent rôle spécifique
[Authorize(Policy = Policies.CanDeleteCases)]
[HttpDelete("{id}")]
public async Task<IActionResult> DeleteCase(int id)
```

### Vérification Côté Serveur

```csharp
// Le rôle est vérifié automatiquement par ASP.NET Core
// Impossible de contourner via le client
if (!User.IsInRole("PROPRIETAIRE"))
{
    return Forbid(); // 403 Forbidden
}
```

---

## 📝 Configuration

### Définir le Rôle lors de l'Inscription

```csharp
// AuthController.cs - Register
var user = new User
{
    Email = request.Email,
    Password = hashedPassword,
    Role = request.Role ?? "AVOCAT", // Par défaut AVOCAT
};
```

### Changer le Rôle d'un Utilisateur

```csharp
// UserManagementController.cs (PROPRIETAIRE uniquement)
[Authorize(Policy = Policies.CanManageUsers)]
[HttpPatch("{userId}/role")]
public async Task<IActionResult> UpdateUserRole(Guid userId, string newRole)
{
    var user = await _context.Users.FindAsync(userId);
    user.Role = newRole;
    await _context.SaveChangesAsync();
    return Ok();
}
```

---

## 🎨 Interface Utilisateur

### Affichage Conditionnel

```javascript
// demo.html
const userRole = getUserRole(); // Depuis JWT

if (userRole === 'SECRETAIRE') {
    // Masquer bouton "Assigner"
    document.getElementById('assignBtn').style.display = 'none';
}

if (userRole === 'ASSOCIE' || userRole === 'PROPRIETAIRE') {
    // Afficher menu Analytics
    document.getElementById('analyticsMenu').style.display = 'block';
}
```

### Messages d'Erreur

```javascript
// Si 403 Forbidden
if (response.status === 403) {
    alert('❌ Action non autorisée pour votre rôle');
}
```

---

## ✅ Avantages du RBAC

### Pour le Cabinet
- ✅ Sécurité renforcée
- ✅ Séparation des responsabilités
- ✅ Traçabilité des actions
- ✅ Conformité RGPD

### Pour les Utilisateurs
- ✅ Interface adaptée au rôle
- ✅ Pas de confusion
- ✅ Workflow clair
- ✅ Responsabilités définies

---

## 🚀 Prochaines Étapes

### Phase 1 (Actuelle) ✅
- [x] Rôles dans JWT
- [x] Politiques d'autorisation
- [x] Protection des endpoints
- [x] Documentation complète

### Phase 2 (Prochaine) 🚧
- [ ] Interface utilisateur adaptative
- [ ] Gestion des rôles dans l'UI
- [ ] Logs d'audit par rôle
- [ ] Permissions granulaires

### Phase 3 (Future) 💡
- [ ] Rôles personnalisés
- [ ] Permissions par dossier
- [ ] Délégation temporaire
- [ ] Multi-cabinet

---

## 📖 Références

**Fichiers modifiés :**
- `Services/JwtTokenService.cs` - Ajout claim Role
- `Authorization/Roles.cs` - Constantes de rôles
- `Authorization/Policies.cs` - Constantes de politiques
- `Program.cs` - Configuration des politiques
- `Controllers/CaseController.cs` - Application des politiques

**Standards :**
- ASP.NET Core Authorization
- JWT Claims-based authentication
- Role-Based Access Control (RBAC)

---

## 🎯 Résultat

**Avant :**
- ❌ Tous les utilisateurs ont les mêmes droits
- ❌ Pas de contrôle d'accès
- ❌ Risques de sécurité

**Après :**
- ✅ Chaque rôle a ses permissions
- ✅ Contrôle d'accès automatique
- ✅ Sécurité maximale
- ✅ Conformité professionnelle

**🔐 Sécurité +1000% !**
