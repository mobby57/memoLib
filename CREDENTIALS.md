# 🔑 IDENTIFIANTS DE CONNEXION

## Utilisateur par Défaut

**Email:** `admin@memolib.local`  
**Mot de passe:** *(aucun - l'utilisateur est créé sans mot de passe)*

---

## 🚀 Solution: Créer un Utilisateur avec Mot de Passe

### Option 1: Via API (Recommandé)

```http
POST http://localhost:5078/api/auth/register
Content-Type: application/json

{
  "email": "admin@freetime.com",
  "password": "VotreMotDePasse123!",
  "name": "Admin"
}
```

### Option 2: Via Console C#

Ajouter dans `Program.cs` après la création de l'utilisateur par défaut:

```csharp
// Créer utilisateur avec mot de passe
var passwordService = scope.ServiceProvider.GetRequiredService<PasswordService>();
var userWithPassword = new User
{
    Id = Guid.NewGuid(),
    Email = "admin@freetime.com",
    Password = passwordService.HashPassword("VotreMotDePasse123!"),
    Role = Roles.Owner,
    Name = "Admin",
    CreatedAt = DateTime.UtcNow
};
db.Users.Add(userWithPassword);
db.SaveChanges();
```

---

## 🎯 Utilisation dans la Démo

### Page: demo-complete.html

1. Ouvrir http://localhost:5078/demo-complete.html
2. Aller à l'onglet "🔐 Authentication"
3. Remplir:
   - **Email**: `admin@freetime.com`
   - **Password**: `VotreMotDePasse123!`
4. Cliquer "🔑 Login"

---

## ✅ Vérification

```http
GET http://localhost:5078/health
```

Si l'API répond `{"status":"healthy"}`, tout fonctionne !

---

## 📝 Note

L'utilisateur `admin@memolib.local` est créé automatiquement au démarrage **sans mot de passe** pour faciliter le développement. Pour une utilisation réelle, créez toujours des utilisateurs avec des mots de passe forts via l'endpoint `/api/auth/register`.
