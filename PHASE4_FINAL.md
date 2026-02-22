# PHASE 4 — INGESTION EMAIL (MVP STRICT) ✅

## ✅ RÉALISÉ

### 1. DTO créé

- **Fichier**: `Contracts/IngestEmailRequest.cs`
- **Champs**: `ExternalId`, `From`, `Subject`, `Body`, `OccurredAt`

### 2. Contrôleur d'ingestion

- **Route**: `POST /api/ingest/email`
- **Contrôleur**: `IngestionController`
- **Fonctionnalités**:
  - ✅ Endpoint protégé par JWT (`[Authorize]`)
  - ✅ Sérialisation du payload en JSON
  - ✅ Calcul du checksum SHA256
  - ✅ Déduplication automatique
  - ✅ Stockage dans `Events`

### 3. Seed automatique

- ✅ User créé au démarrage (`admin@memolib.local`)
- ✅ Source email créée automatiquement
- ✅ Pas besoin de configuration manuelle

### 4. Tests créés

- **Fichier**: `test-ingest.http`
- 3 scénarios de test prêts

---

## 🧪 POUR TESTER

### 1. Arrêter l'API en cours

Appuyez sur **Ctrl+C** dans le terminal où l'API tourne.

### 2. Recréer la base propre

```bash
del memolib.db
dotnet ef database update
```

### 3. Démarrer l'API

```bash
dotnet run
```

### 4. Tester avec `test-ingest.http`

Ouvrir `test-ingest.http` et exécuter les requêtes.

⚠️ **Authentification requise**: obtenir un token via `POST /api/auth/login` puis envoyer `Authorization: Bearer <token>`.

**Résultats attendus**:

- 1ère requête → objet JSON avec `message: "Event stored."`, `eventId`, `caseId`, `caseCreated`
- 2ème requête (identique) → `"Duplicate ignored."`
- 3ème requête (différente) → objet JSON avec `message: "Event stored."` et IDs

---

## 📊 VÉRIFIER EN BASE

```bash
sqlite3 memolib.db
SELECT * FROM Users;
SELECT * FROM Sources;
SELECT * FROM Events;
```

---

## 🎯 CE QUI FONCTIONNE

1. ✅ Ingestion d'emails simulés via POST
2. ✅ Transformation en `Event` immuable
3. ✅ Déduplication par checksum
4. ✅ Stockage du payload brut (JSON)
5. ✅ Seed automatique User + Source
6. ✅ API REST propre et testable

---

## 📁 STRUCTURE FINALE

```text
MemoLib.Api/
├── Contracts/
│   └── IngestEmailRequest.cs
├── Controllers/
│   ├── EventsController.cs (ancien)
│   └── IngestionController.cs (nouveau)
├── Data/
│   └── MemoLibDbContext.cs
├── Models/
│   ├── User.cs
│   ├── Source.cs
│   ├── Event.cs
│   ├── Case.cs
│   └── CaseEvent.cs
├── Migrations/
├── test-ingest.http
└── Program.cs (avec seed)
```

---

## 🚫 CE QUI N'EST PAS FAIT (volontairement)

- ❌ Parsing du payload
- ❌ Extraction de métadonnées
- ❌ Classification automatique
- ❌ Liaison avancée avec cases
- ❌ IA / ML
- ❌ Webhooks réels
- ❌ IMAP / OAuth

👉 **MVP strict: on stocke, on déduplique, c'est tout.**

---

## ➡️ PROCHAINE ÉTAPE

### PHASE 5 — CRÉATION MANUELLE DE CASE + TIMELINE

- Créer un case manuellement
- Lier des events à un case
- Afficher la timeline d'un case

---

## PHASE 4 terminée

⚠️ **Important**: arrêtez l'API en cours (`Ctrl+C`) avant de tester.
