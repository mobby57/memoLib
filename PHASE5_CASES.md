# PHASE 5 — CASE + TIMELINE (MVP STRICT) ✅

## ✅ RÉALISÉ

### 1. DTO créé

- **Fichier**: `Contracts/CreateCaseRequest.cs`
- **Champ**: Title uniquement

### 2. CaseController créé

- **Route base**: `/api/cases`
- **3 endpoints**:
  1. `POST /api/cases` - Créer un case
  2. `POST /api/cases/{caseId}/events/{eventId}` - Attacher un event
  3. `GET /api/cases/{caseId}/timeline` - Voir la timeline

### 3. Fonctionnalités

✅ **Endpoints sécurisés**

- Tous les endpoints `/api/cases/*` nécessitent un JWT valide

✅ **Création de Case**

- Titre uniquement
- ID auto-généré
- Date de création auto

✅ **Liaison Event → Case**

- Relation many-to-many via CaseEvents
- Détection de doublon
- Pas de validation complexe

✅ **Timeline chronologique**

- Events triés par OccurredAt
- Payload brut visible
- Aucun DTO de sortie

---

## 🧪 SCÉNARIO DE TEST COMPLET

### 1. Démarrer l'API

```bash
dotnet run
```

### 2. Suivre test-cases.http

0. Login (`/api/auth/login`) pour récupérer un token JWT
1. Ingest 2 emails → Noter les 2 eventId
2. Créer un case → Noter le caseId
3. Attacher event 1 au case
4. Attacher event 2 au case
5. GET timeline → Voir les 2 events triés

### Résultat attendu

```json
[
  {
    "id": "guid-1",
    "occurredAt": "2026-02-10T08:30:00Z",
    "rawPayload": "{...email 1...}"
  },
  {
    "id": "guid-2",
    "occurredAt": "2026-02-10T14:00:00Z",
    "rawPayload": "{...email 2...}"
  }
]
```

---

## 📊 VÉRIFIER EN BASE

```bash
sqlite3 memolib.db
SELECT * FROM Cases;
SELECT * FROM CaseEvents;
SELECT * FROM Events;
```

---

## 🎯 CE QUI FONCTIONNE

1. ✅ Création manuelle de Case
2. ✅ Liaison manuelle Event → Case
3. ✅ Timeline chronologique
4. ✅ Déduplication des liaisons
5. ✅ Payload brut accessible
6. ✅ Aucune automatisation

---

## 📁 STRUCTURE FINALE

```text
MemoLib.Api/
├── Contracts/
│   ├── IngestEmailRequest.cs
│   └── CreateCaseRequest.cs
├── Controllers/
│   ├── EventsController.cs
│   ├── IngestionController.cs
│   └── CaseController.cs (nouveau)
├── Data/
│   └── MemoLibDbContext.cs
├── Models/
│   ├── User.cs
│   ├── Source.cs
│   ├── Event.cs
│   ├── Case.cs
│   └── CaseEvent.cs
├── test-ingest.http
└── test-cases.http (nouveau)
```

---

## 🚫 CE QUI N'EST PAS FAIT (volontairement)

- ❌ État/statut sur Case
- ✅ Workflow automatique minimal à l'ingestion (création/lien d'un case)
- ❌ Classification automatique
- ✅ Liaison automatique Event → Case à l'ingestion
- ❌ IA / ML
- ❌ Parsing avancé
- ❌ Métadonnées extraites

👉 **Ingestion auto minimale + contrôle manuel conservé.**

---

## 💡 USAGE RÉEL

**Scénario typique**:

1. Des emails arrivent (ingestion)
2. L'API lie automatiquement au dossier existant du même `ExternalId` (sinon crée un dossier)
3. L'avocat ajuste manuellement si nécessaire
4. Il consulte la timeline pour voir l'historique

**C'est exactement ce qu'on a construit.**

---

## ➡️ PROCHAINE ÉTAPE

### PHASE 6 — INDEXATION + RECHERCHE

- Rechercher des events par texte
- Rechercher par date
- Rechercher par expéditeur
- Préparer le terrain pour l'IA locale

---

## PHASE 5 terminée
