# PHASE 3 — SETUP TECHNIQUE MINIMAL ✅

## ✅ RÉALISÉ

### 1. Projet .NET créé

- **Framework**: .NET 9 (compatible .NET 8)
- **Type**: ASP.NET Core Web API
- **Localisation**: `c:\Users\moros\Desktop\memolib\MemoLib.Api`

### 2. Packages installés

- ✅ `Microsoft.EntityFrameworkCore` 9.0.0
- ✅ `Microsoft.EntityFrameworkCore.SqlServer` 9.0.0
- ✅ `Microsoft.EntityFrameworkCore.Sqlite` 9.0.0 (pour dev local)
- ✅ `Microsoft.EntityFrameworkCore.Tools` 9.0.0

### 3. Structure créée

```text
MemoLib.Api/
├── Data/
│   └── MemoLibDbContext.cs
├── Models/
│   ├── User.cs
│   ├── Source.cs
│   ├── Event.cs
│   ├── Case.cs
│   └── CaseEvent.cs
├── Migrations/
│   └── 20260211175428_InitialCreate.cs
├── Program.cs
└── appsettings.json
```

### 4. Modèles de données

- ✅ **User**: `Id`, `Email`, `CreatedAt`
- ✅ **Source**: `Id`, `Type`, `UserId`
- ✅ **Event**: `Id`, `SourceId`, `ExternalId`, `Checksum`, `OccurredAt`, `IngestedAt`, `RawPayload`
- ✅ **Case**: `Id`, `Title`, `CreatedAt`
- ✅ **CaseEvent**: `CaseId`, `EventId` (clé composite)

### 5. Base de données

- ✅ **Local**: SQLite (`memolib.db`)
- ✅ Migration créée et appliquée
- ✅ 5 tables créées
- ✅ `DbContext` configuré

### 6. API fonctionnelle

- ✅ L'API démarre sur `http://localhost:5078`
- ✅ Build réussi
- ✅ Aucune erreur

---

## 🔧 CONFIGURATION LOCALE

### Connection String (SQLite)

```json
"ConnectionStrings": {
  "Default": "Data Source=memolib.db"
}
```

### Démarrer l'API

```bash
cd MemoLib.Api
dotnet run
```

---

## ☁️ AZURE — À FAIRE

### 1. Azure SQL Database

- [ ] Créer une base de données Azure SQL
- [ ] Tier: **Basic (5 DTU)** — ~5€/mois
- [ ] Région: Europe West
- [ ] Firewall: Autoriser les services Azure

### 2. Azure App Service

- [ ] Créer un App Service
- [ ] Plan: **Free F1** — 0€
- [ ] Runtime: .NET 8
- [ ] Région: Europe West

### 3. Configuration Azure

```json
"ConnectionStrings": {
  "Default": "Server=tcp:<server>.database.windows.net,1433;Database=MemoLibDb;User ID=<user>;Password=<password>;Encrypt=True;"
}
```

### 4. Déploiement

```bash
# Changer UseSqlite en UseSqlServer dans Program.cs
dotnet publish -c Release
# Déployer via Azure Portal ou CLI
```

---

## 💰 COÛT ESTIMÉ

| Service | Tier | Coût/mois |
| --- | --- | --- |
| Azure SQL Database | Basic (5 DTU) | ~5€ |
| Azure App Service | Free F1 | 0€ |
| **TOTAL** | — | **~5€/mois** |

---

## 📝 NOTES

- **SQLite** utilisé en local (pas de SQL Server LocalDB requis)
- **SQL Server** sera utilisé sur Azure
- Aucune authentification (MVP mono-user)
- Aucun contrôleur créé (PHASE 4)
- Architecture minimale (pas de DTO, repository, CQRS)

---

## ➡️ PROCHAINE ÉTAPE

### PHASE 4 — INGESTION EMAIL

- Créer un endpoint `POST /events`
- Ingérer un email brut
- Stocker dans la table `Events`
- Déduplication par checksum
