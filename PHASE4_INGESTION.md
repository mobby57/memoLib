# PHASE 4 — INGESTION EMAIL ✅

## ✅ RÉALISÉ

### 1. Endpoint créé

- **Route**: `POST /api/events`
- **Contrôleur**: `EventsController`
- **Méthode**: `Ingest`

### 2. Fonctionnalités

✅ **Ingestion d'événement**

- Reçoit un payload brut (email)
- Calcule un checksum SHA256
- Stocke dans la table `Events`

✅ **Déduplication**

- Vérifie le checksum avant insertion
- Retourne `409 Conflict` si doublon

✅ **Métadonnées**

- `SourceId` (origine de l'événement)
- `ExternalId` (ID externe, ex: email ID)
- `OccurredAt` (date de l'événement)
- `IngestedAt` (date d'ingestion, auto)

### 3. Structure de requête

```json
{
  "sourceId": "guid",
  "externalId": "string",
  "occurredAt": "datetime",
  "payload": "string"
}
```

### 4. Réponses

**Succès (200)**:

```json
{
  "id": "guid",
  "checksum": "hex-string"
}
```

**Doublon (409)**:

```json
"Duplicate"
```

---

## 🧪 TESTER

### Démarrer l'API

```bash
cd MemoLib.Api
dotnet run
```

### Tester avec le fichier HTTP

Ouvrir `test-events.http` et exécuter les requêtes.

### Tester avec `curl`

```bash
curl -X POST http://localhost:5078/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "sourceId": "00000000-0000-0000-0000-000000000001",
    "externalId": "email-123",
    "occurredAt": "2026-02-11T18:00:00Z",
    "payload": "From: client@example.com\nSubject: Test\n\nContenu email"
  }'
```

---

## 📊 VÉRIFIER LES DONNÉES

### SQLite

```bash
sqlite3 memolib.db
SELECT * FROM Events;
```

---

## 🎯 CE QUI FONCTIONNE

1. ✅ Ingestion d'événements bruts
2. ✅ Déduplication par checksum
3. ✅ Stockage en base
4. ✅ Métadonnées complètes
5. ✅ API REST propre

---

## 🚫 CE QUI N'EST PAS FAIT (volontairement)

- ❌ Validation avancée
- ❌ Authentification
- ❌ Parsing du payload
- ❌ Extraction de métadonnées
- ❌ Liaison avec cases
- ❌ Webhooks
- ❌ Retry logic

👉 **Tout ça viendra dans les phases suivantes.**

---

## 📁 FICHIERS CRÉÉS

```text
MemoLib.Api/
├── Controllers/
│   └── EventsController.cs
└── test-events.http
```

---

## ➡️ PROCHAINE ÉTAPE

### PHASE 5 — EXTRACTION & LIAISON

- Parser le payload email
- Extraire expéditeur, sujet, date
- Créer ou lier à un case
- Créer la relation `CaseEvent`

---

## PHASE 4 terminée

Redémarrez l'API (arrêtez le processus en cours), puis testez avec `test-events.http`.
