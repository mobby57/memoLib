# 🔐 RBAC Générique Multi-Secteurs

## 🎯 Système Universel

MemoLib implémente un RBAC générique adapté à **TOUS les secteurs** : Avocats, Médecins, Comptables, Agences, PME, etc.

## 👥 Hiérarchie des Rôles (5 Niveaux)

```
OWNER 👑 (Propriétaire)
    ↓
ADMIN 🔧 (Administrateur)
    ↓
MANAGER 👔 (Manager/Superviseur)
    ↓
AGENT ⚡ (Agent/Employé opérationnel)
    ↓
USER 👤 (Utilisateur lecture seule)
```

---

## 📊 Rôles Détaillés

### 1. **USER** 👤
**Profil :** Utilisateur externe, client, stagiaire, consultant

**Permissions :**
- ✅ Voir ses propres dossiers
- ✅ Voir ses contacts
- ✅ Voir ses messages
- ✅ Voir ses documents
- ❌ Créer/Modifier/Supprimer

**Cas d'usage :**
- Client d'un cabinet d'avocats
- Patient d'un cabinet médical
- Client d'une agence
- Stagiaire en observation

---

### 2. **AGENT** ⚡
**Profil :** Employé opérationnel, secrétaire, assistant

**Permissions :**
- ✅ Voir tous les dossiers
- ✅ Créer des dossiers
- ✅ Modifier des dossiers
- ✅ Créer/Modifier des contacts
- ✅ Envoyer des messages
- ✅ Utiliser des templates
- ✅ Uploader des documents
- ❌ Assigner des dossiers
- ❌ Supprimer
- ❌ Analytics

**Cas d'usage :**
- Secrétaire juridique
- Assistant médical
- Agent commercial
- Support client niveau 1

---

### 3. **MANAGER** 👔
**Profil :** Manager, superviseur, chef d'équipe

**Permissions :**
- ✅ Toutes les permissions AGENT
- ✅ Assigner des dossiers
- ✅ Clôturer des dossiers
- ✅ Supprimer des messages
- ✅ Gérer les templates
- ✅ Supprimer des documents
- ✅ Voir les analytics
- ✅ Voir les rapports
- ✅ Exporter les données
- ❌ Supprimer des dossiers/contacts
- ❌ Gérer les utilisateurs

**Cas d'usage :**
- Avocat senior
- Médecin chef de service
- Manager commercial
- Chef de projet

---

### 4. **ADMIN** 🔧
**Profil :** Administrateur système, responsable IT

**Permissions :**
- ✅ Toutes les permissions MANAGER
- ✅ Supprimer des dossiers
- ✅ Supprimer des contacts
- ✅ Gérer les utilisateurs
- ✅ Gérer les paramètres
- ✅ Voir les logs d'audit
- ✅ Gérer les intégrations
- ❌ Gérer les rôles
- ❌ Gérer la facturation

**Cas d'usage :**
- Associé d'un cabinet
- Directeur technique
- Responsable IT
- Administrateur système

---

### 5. **OWNER** 👑
**Profil :** Propriétaire, fondateur, CEO

**Permissions :**
- ✅ TOUTES les permissions
- ✅ Gérer les rôles
- ✅ Gérer la facturation
- ✅ Accès complet

**Cas d'usage :**
- Propriétaire du cabinet
- CEO de l'entreprise
- Fondateur
- Super administrateur

---

## 📋 Matrice Complète des Permissions

| Permission | USER | AGENT | MANAGER | ADMIN | OWNER |
|------------|------|-------|---------|-------|-------|
| **Dossiers/Cas** |
| Voir dossiers | ✅ (siens) | ✅ | ✅ | ✅ | ✅ |
| Créer dossiers | ❌ | ✅ | ✅ | ✅ | ✅ |
| Modifier dossiers | ❌ | ✅ | ✅ | ✅ | ✅ |
| Assigner dossiers | ❌ | ❌ | ✅ | ✅ | ✅ |
| Clôturer dossiers | ❌ | ❌ | ✅ | ✅ | ✅ |
| Supprimer dossiers | ❌ | ❌ | ❌ | ✅ | ✅ |
| Exporter dossiers | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Contacts/Clients** |
| Voir contacts | ✅ (siens) | ✅ | ✅ | ✅ | ✅ |
| Créer contacts | ❌ | ✅ | ✅ | ✅ | ✅ |
| Modifier contacts | ❌ | ✅ | ✅ | ✅ | ✅ |
| Supprimer contacts | ❌ | ❌ | ❌ | ✅ | ✅ |
| Exporter contacts | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Communication** |
| Voir messages | ✅ (siens) | ✅ | ✅ | ✅ | ✅ |
| Envoyer messages | ❌ | ✅ | ✅ | ✅ | ✅ |
| Supprimer messages | ❌ | ❌ | ✅ | ✅ | ✅ |
| Utiliser templates | ❌ | ✅ | ✅ | ✅ | ✅ |
| Gérer templates | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Documents** |
| Voir documents | ✅ (siens) | ✅ | ✅ | ✅ | ✅ |
| Uploader documents | ❌ | ✅ | ✅ | ✅ | ✅ |
| Supprimer documents | ❌ | ❌ | ✅ | ✅ | ✅ |
| Partager documents | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Analytics** |
| Voir analytics | ❌ | ❌ | ✅ | ✅ | ✅ |
| Voir rapports | ❌ | ❌ | ✅ | ✅ | ✅ |
| Exporter rapports | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Administration** |
| Gérer utilisateurs | ❌ | ❌ | ❌ | ✅ | ✅ |
| Gérer rôles | ❌ | ❌ | ❌ | ❌ | ✅ |
| Gérer paramètres | ❌ | ❌ | ❌ | ✅ | ✅ |
| Voir logs audit | ❌ | ❌ | ❌ | ✅ | ✅ |
| Gérer intégrations | ❌ | ❌ | ❌ | ✅ | ✅ |
| Gérer facturation | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🏢 Adaptation par Secteur

### Cabinet d'Avocats ⚖️
- **USER** = Client
- **AGENT** = Secrétaire juridique
- **MANAGER** = Avocat
- **ADMIN** = Associé
- **OWNER** = Propriétaire du cabinet

### Cabinet Médical 🏥
- **USER** = Patient
- **AGENT** = Secrétaire médicale
- **MANAGER** = Médecin
- **ADMIN** = Chef de service
- **OWNER** = Directeur de la clinique

### Agence Immobilière 🏠
- **USER** = Client/Prospect
- **AGENT** = Agent immobilier junior
- **MANAGER** = Agent senior/Chef d'équipe
- **ADMIN** = Directeur d'agence
- **OWNER** = Propriétaire du réseau

### Cabinet Comptable 💼
- **USER** = Client
- **AGENT** = Assistant comptable
- **MANAGER** = Expert-comptable
- **ADMIN** = Associé
- **OWNER** = Propriétaire du cabinet

### Agence Marketing 📢
- **USER** = Client
- **AGENT** = Chargé de projet
- **MANAGER** = Chef de projet
- **ADMIN** = Directeur de clientèle
- **OWNER** = CEO de l'agence

### PME Générique 🏭
- **USER** = Stagiaire/Consultant
- **AGENT** = Employé
- **MANAGER** = Manager
- **ADMIN** = Directeur
- **OWNER** = PDG

---

## 🔧 Implémentation Technique

### 1. Constantes de Rôles
```csharp
// Authorization/Roles.cs
public static class Roles
{
    public const string User = "USER";
    public const string Agent = "AGENT";
    public const string Manager = "MANAGER";
    public const string Admin = "ADMIN";
    public const string Owner = "OWNER";
}
```

### 2. Constantes de Politiques
```csharp
// Authorization/Policies.cs
public static class Policies
{
    public const string ViewCases = "ViewCases";
    public const string CreateCases = "CreateCases";
    public const string AssignCases = "AssignCases";
    public const string DeleteCases = "DeleteCases";
    // ... 40+ politiques
}
```

### 3. Configuration
```csharp
// Program.cs
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(Policies.ViewCases, policy => 
        policy.RequireRole(Roles.User, Roles.Agent, Roles.Manager, Roles.Admin, Roles.Owner));
    
    options.AddPolicy(Policies.AssignCases, policy => 
        policy.RequireRole(Roles.Manager, Roles.Admin, Roles.Owner));
    
    options.AddPolicy(Policies.ManageUsers, policy => 
        policy.RequireRole(Roles.Admin, Roles.Owner));
});
```

### 4. Utilisation
```csharp
// Controllers
[Authorize(Policy = Policies.ViewCases)]
[HttpGet]
public async Task<IActionResult> ListCases() { }

[Authorize(Policy = Policies.AssignCases)]
[HttpPatch("{id}/assign")]
public async Task<IActionResult> AssignCase(int id) { }

[Authorize(Policy = Policies.ManageUsers)]
[HttpPost("users")]
public async Task<IActionResult> CreateUser() { }
```

---

## 🎯 Scénarios Multi-Secteurs

### Scénario 1: Cabinet d'Avocats
```
1. Client (USER) se connecte → Voit ses dossiers ✅
2. Secrétaire (AGENT) reçoit email → Crée dossier ✅
3. Avocat (MANAGER) assigne à lui-même → Traite ✅
4. Associé (ADMIN) supervise → Analytics ✅
5. Propriétaire (OWNER) gère facturation ✅
```

### Scénario 2: Agence Immobilière
```
1. Prospect (USER) consulte ses biens ✅
2. Agent junior (AGENT) crée fiche bien ✅
3. Chef d'équipe (MANAGER) assigne visites ✅
4. Directeur (ADMIN) voit statistiques ✅
5. Propriétaire (OWNER) configure système ✅
```

### Scénario 3: Cabinet Médical
```
1. Patient (USER) voit ses RDV ✅
2. Secrétaire (AGENT) crée RDV ✅
3. Médecin (MANAGER) consulte dossier ✅
4. Chef service (ADMIN) gère équipe ✅
5. Directeur (OWNER) gère facturation ✅
```

---

## ✅ Avantages du Système Générique

### Flexibilité
- ✅ S'adapte à TOUS les secteurs
- ✅ Noms de rôles universels
- ✅ Hiérarchie claire

### Sécurité
- ✅ Permissions granulaires
- ✅ Principe du moindre privilège
- ✅ Audit complet

### Évolutivité
- ✅ Facile à étendre
- ✅ Nouvelles politiques simples
- ✅ Rôles personnalisables

### Maintenabilité
- ✅ Code réutilisable
- ✅ Documentation claire
- ✅ Standards ASP.NET Core

---

## 🚀 Migration depuis l'Ancien Système

### Mapping des Rôles
```
AVOCAT → MANAGER
SECRETAIRE → AGENT
ASSOCIE → ADMIN
PROPRIETAIRE → OWNER
```

### Compatibilité
- ✅ JWT mis à jour automatiquement
- ✅ Politiques renommées
- ✅ Endpoints protégés
- ✅ Rétrocompatible

---

## 📖 Références

**Fichiers modifiés :**
- `Authorization/Roles.cs` - 5 rôles génériques
- `Authorization/Policies.cs` - 40+ politiques
- `Program.cs` - Configuration complète
- `Models/User.cs` - Rôle par défaut AGENT
- `Services/JwtTokenService.cs` - Claim Role
- `Controllers/CaseController.cs` - Politiques appliquées

**Standards :**
- ASP.NET Core Authorization
- JWT Claims-based authentication
- Role-Based Access Control (RBAC)
- Principle of Least Privilege

---

## 🎯 Résultat

**Système Universel :**
- ✅ 5 rôles génériques
- ✅ 40+ politiques granulaires
- ✅ Adaptable à TOUS les secteurs
- ✅ Sécurité maximale
- ✅ Évolutif et maintenable

**🌍 Multi-Secteurs +100% !**
