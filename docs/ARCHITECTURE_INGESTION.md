# Architecture cible — Ingestion & traitement du flux entrant

> **Thèse.** MemoLib n'est pas une GED, un CRM ou une messagerie améliorée. C'est un
> **système de traitement du flux entrant** : il transforme le chaos informationnel
> du cabinet (emails, pièces, SMS, portail, scans, appels…) en **dossiers structurés**.
>
> **Principe fondateur.** Le **dossier** est l'objet central. Les canaux ne sont que
> des **producteurs d'événements et de données** autour du dossier.

Ce document est le cadrage d'architecture. Il distingue explicitement **CE QUI EXISTE
DÉJÀ** dans le code de **CE QUI RESTE À CONSTRUIRE**, pour éviter toute confusion.

---

## 1. Le modèle mental

```
   Canaux (producteurs)                Moteur                     Consommateur
 ┌──────────────────────┐      ┌──────────────────────┐        ┌─────────────┐
 │ Email                │      │  IngestionService    │        │             │
 │ Portail client       │      │  (point d'entrée     │        │             │
 │ SMS / messagerie     │ ───► │   UNIQUE)            │ ─────► │   DOSSIER   │ ──► AVOCAT
 │ Documents / uploads  │      │        │             │        │  (agrège)   │
 │ Scan / OCR           │      │        ▼             │        │             │
 │ Téléphone (transcri.)│      │  InformationUnit     │        └─────────────┘
 └──────────────────────┘      │  + machine à états   │
                               │  Ingestion → Tri →   │
                               │  Identification →    │
                               │  Structuration →     │
                               │  Détection manquants │
                               │  → Action            │
                               └──────────────────────┘
```

Un même flux, un même modèle d'unité (`InformationUnit`), un dossier agrégateur.
Pas trois silos (GED + CRM + mail).

---

## 2. Ce qui EXISTE déjà (fondations posées ✅)

### 2.1 `InformationUnit` — l'unité d'information (le cœur)
`src/lib/services/information-unit.service.ts` + modèle Prisma `InformationUnit`.

- **Multi-source** : champ `source` (`EMAIL, UPLOAD, API, MANUAL, SCAN, FAX`).
- **Déduplication** : hash SHA-256 du contenu (`contentHash` unique) → anti-doublon natif.
- **Machine à états fermée** (pipeline) avec transitions **validées** :
  ```
  RECEIVED → CLASSIFIED → ANALYZED
                            ├→ INCOMPLETE ──┐
                            ├→ AMBIGUOUS ───┤→ HUMAN_ACTION_REQUIRED → RESOLVED → CLOSED
                            └→ RESOLVED ────┘
  ```
  Règle stricte : impossible de sauter à `CLOSED` sans passer par `RESOLVED`.
- **Détection des manquants** : statut `INCOMPLETE` + **escalade automatique** (cron
  `escalateStaleUnits`) : relance client à 48h, escalade `HUMAN_ACTION_REQUIRED` à 72h,
  alerte admin à 96h, `AMBIGUOUS` escaladé immédiatement.
- **Verrou métier "Zéro info ignorée"** : `validateWorkspaceClosurePossible()` **interdit
  de clôturer un dossier** tant qu'il reste des unités non résolues. C'est la
  matérialisation directe de la thèse « ne rien perdre ».
- **Traçabilité** : `statusHistory` complet + `exportAuditTrail()` avec hash d'intégrité.
- **Rattachement au dossier** : champ `linkedWorkspaceId`.

### 2.2 Journal d'événements
`EventLogService` (`src/lib/services/event-log.service.ts`) : EventLog immuable, chaîné
par checksum. Support d'un modèle « canaux = producteurs d'événements ».

### 2.3 Ingestion email
Route `src/app/api/webhooks/email-inbound/` : réception email, déduplication, analyse.

### 2.4 Couche multichannel (partielle)
`src/lib/multichannel/` : `channel-service`, `adapter-factory`, `adapters/`, `ai-processor`,
`audit-service`. Pattern d'adaptateur par canal déjà esquissé.

### 2.5 Moteur IA hybride (disponible mais pas branché sur l'ingestion)
`src/lib/ai/hybrid-client.ts` : `hybridAI` (Ollama → cloud → fallback), anonymisation PII
avant envoi, contrôle des coûts. **Fonctionnel** — mais **non appelé** par le pipeline
d'ingestion (voir §3).

---

## 3. Ce qui RESTE À CONSTRUIRE (le fossé vision ↔ code ⚠️)

### 3.1 🔴 La classification IA est SIMULÉE, pas réelle
Dans `InformationUnitService.create()`, la transition `RECEIVED → CLASSIFIED` utilise
des valeurs **codées en dur** :
```ts
metadata: { confidence: 0.89, classifier: 'llama3.2:3b' } // simulé
```
**À faire** : brancher `hybridAI` pour produire une **vraie** classification (type de
document, dossier candidat, extraction d'entités/dates), avec la confiance réelle et le
verrou de validation humaine si confiance faible.

### 3.2 🔴 L'ingestion n'est pas un point d'entrée UNIQUE
Chaque canal a aujourd'hui son propre chemin (l'email a sa route ; les autres canaux ne
créent pas systématiquement d'`InformationUnit`). **À faire** : un `IngestionService.ingest()`
que **tous** les canaux appellent, garantissant que **rien n'entre dans le cabinet sans
devenir une `InformationUnit` tracée**.

### 3.3 🔴 Le rattachement au dossier est MANUEL, pas inféré
`linkedWorkspaceId` doit être fourni. **À faire** : inférence du dossier
(expéditeur → client → dossiers ouverts ; référence dans le corps ; IA) avec fallback
`AMBIGUOUS` → validation humaine si incertain.

### 3.4 🟠 Canaux non encore connectés à l'ingestion
SMS, portail, upload, scan/OCR, transcription téléphonique → doivent produire des
`InformationUnit` via `ingest()`.

### 3.5 🟠 Vue "flux entrant" pour l'avocat
Inbox unifiée par dossier : unités classées, « nouvel élément potentiellement important »,
pièces manquantes, chronologie mise à jour.

### 3.6 🟠 Dette technique bloquante sur ce module
- `information-unit.service.ts` commence par `// @ts-nocheck` → **typage désactivé** sur
  le cœur du système. À retirer et typer.
- `source` est typé `string` (pas l'enum Prisma `InformationUnitSource`) → à contraindre.
- La classification simulée n'est **pas testée** avec le vrai code IA.

---

## 4. Architecture cible (event-driven léger)

```
Canal ──produit──► IngestionEvent ──► IngestionService.ingest({ source, content, tenantId, sourceMetadata })
                                            │
                                            │ 1. dédup SHA-256              [EXISTE]
                                            ▼
                                     InformationUnit (RECEIVED)            [EXISTE]
                                            │
                                            │ 2. IA: classifier + extraire  [À BRANCHER §3.1]
                                            ▼
                                        CLASSIFIED → ANALYZED              [EXISTE]
                                            │
                                            │ 3. IA: rattacher au Dossier   [À CRÉER §3.3]
                                            │    (sinon AMBIGUOUS → humain)
                                            ▼
                                     linkedWorkspaceId                     [champ EXISTE]
                                            │
                                            │ 4. détecter manquants         [EXISTE: INCOMPLETE + escalade]
                                            ▼
                              Dossier agrège ses InformationUnit + EventLog
                                            │
                                            ▼
                        Avocat : inbox unifiée, « nouvel élément important »,
                                 pièces manquantes, chrono à jour            [À CRÉER §3.5]
```

**Invariants à garantir :**
1. Rien n'entre sans devenir une `InformationUnit` (point d'entrée unique).
2. Aucune unité n'est perdue : pipeline fermé + verrou de clôture de dossier.
3. Toute automatisation IA à faible confiance → `AMBIGUOUS`/`HUMAN_ACTION_REQUIRED`
   (jamais d'action irréversible sans validation humaine).
4. Traçabilité intégrale (statusHistory + EventLog chaîné).

---

## 5. Feuille de route (effort estimé, jours-dev senior)

| # | Chantier | Réf. | Effort |
|---|---|---|---|
| 1 | `IngestionService.ingest()` — point d'entrée unique | §3.2 | 3–5 j |
| 2 | Brancher la vraie classification IA (`hybridAI`) dans `create()` | §3.1 | 4–6 j |
| 3 | Rattachement automatique au dossier (+ fallback humain) | §3.3 | 5–8 j |
| 4 | Connecter les canaux restants (SMS, portail, upload, OCR, tel) | §3.4 | 4–8 j |
| 5 | Inbox « flux entrant » avocat | §3.5 | 5–8 j |
| 6 | Retirer `@ts-nocheck` + typer `source` + tests de la chaîne IA | §3.6 | 3–5 j |
| | **Total** | | **~24–40 j** |

**Ordre recommandé :** 6 (assainir le socle) → 1 (point d'entrée) → 2 (IA réelle) →
3 (rattachement) → 4 (canaux) → 5 (UX avocat).

---

## 6. Ce que cette architecture évite

- Penser MemoLib comme **3 silos** (GED + CRM + mail) qui se resynchronisent mal.
- Des canaux qui écrivent directement dans le dossier sans traçabilité ni dédup.
- De l'automatisation IA « boîte noire » sans point de validation humaine.

La fondation (`InformationUnit` + machine à états + escalade + verrou de clôture) est
**déjà la bonne**. Le travail restant consiste à **brancher l'IA réelle** et à **unifier
l'ingestion** — c'est ce qui transforme MemoLib d'un « système de collecte » en un
« système de traitement du flux entrant ».
