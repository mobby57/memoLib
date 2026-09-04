# Audit architectural de MemoLib

> **Objectif** : déterminer, preuves à l'appui, si MemoLib possède une architecture métier cohérente avec une **source de vérité** claire par information, ou si elle a été construite par **accumulation de features** juxtaposées.
>
> **Méthode** : audit empirique sur le code réel (schéma Prisma, services, routes API, UI), pas sur le README. Chemins relatifs à la racine du dépôt.
>
> **Verdict** : 🔴 **L'architecture métier est fragmentée.** Il existe plusieurs modèles de données concurrents dans le même dépôt, la source de vérité des délais légaux est dédoublée, et le flux central « email → dossier » crée silencieusement **zéro délai** en production. Les 4555 tests qui passent donnent une **fausse confiance** car ils mockent des modèles qui n'existent pas dans le schéma actif.

---

## 1. Synthèse (TL;DR)

| Domaine | Impression | Preuve |
| --- | --- | --- |
| Stack technique | 🟢 solide | Next.js 16, Prisma 5, Postgres, tests nombreux |
| Richesse fonctionnelle | 🟢 très riche | ~180 pages UI, 314 routes API |
| **Cohérence du modèle de données** | 🔴 **fragmentée** | **9 fichiers `.prisma`** dans `prisma/` ; **45 fichiers source non-test** appellent des modèles absents du schéma actif |
| **Source de vérité des délais** | 🔴 **dédoublée + non synchronisée** | `LegalDeadline.dueDate` vs `Dossier.dateEcheance`, jamais synchronisés ; **4 implémentations CESEDA divergentes** |
| **Flux métier central (email→dossier)** | 🔴 **cassé en silence** | `legalDeadline.create` omet 4 champs requis + enum invalide, le tout avalé par `.catch(() => {})` |
| Concepts UI | 🟠 **doublonnés** | « Dossier » ET « Workspace » coexistent comme deux modèles parallèles du même objet |
| Migration auth | 🟠 inachevée | **170 fichiers** portent des marqueurs `CLERK-MIGRATION` non résolus |
| Valeur des tests | 🔴 **trompeuse** | tests mockent `echeances`, `_count.echeances`, modèles fantômes → verts alors que le schéma réel diffère |

**Conclusion** : ton intuition est confirmée par le code. Ce ne sont pas de simples bugs isolés — ce sont des **signaux architecturaux** d'un système où plusieurs générations de modèles n'ont jamais été fusionnées.

---

## 2. NIVEAU 2 — Le modèle de domaine réel

### 2.1 Le schéma actif

`prisma/schema.prisma` : **52 modèles, 26 enums, 1625 lignes**. Cœur métier :

```
Tenant ─┬─ User
        ├─ Client ──── Dossier ─┬─ LegalDeadline ─── DeadlineAlert
        │                       ├─ Document
        │                       ├─ Email
        │                       ├─ Facture ── LigneFacture ── Paiement
        │                       ├─ Proof
        │                       ├─ TimeEntry
        │                       └─ CalendarEvent
        └─ Plan / Subscription / UsageRecord
```

### 2.2 Fragilité structurelle du schéma

Les modèles utilisent `@id` **sans** `@default(cuid())` et `updatedAt` **sans** `@updatedAt`. Conséquence : **chaque appelant doit fournir manuellement `id` et `updatedAt`**. C'est une source d'erreurs systématique (cf. §5.1) et un anti-pattern Prisma.

### 2.3 Trois concepts de « délai » dans le même schéma

- `LegalDeadline` (l.698) — l'entité riche : `dueDate`, `referenceDate`, `legalDays`, `status`, drapeaux d'alerte `alertJ7/J3/J1Sent`, `escalatedAt`… C'est la **source de vérité de facto** pour les délais structurés.
- `Dossier.dateEcheance` (l.322) — un scalaire `DateTime?` dénormalisé, **jamais synchronisé** avec `LegalDeadline`.
- `DeadlineAlert` (l.256) — encore un autre modèle, lié à `LegalDeadline` mais distinct du cron `deadline-alerts.ts`.

---

## 3. 🔴 Le problème central : un modèle de données scindé

`prisma/` contient **9 fichiers de schéma concurrents** :

| Fichier | Modèles | Rôle apparent |
| --- | --- | --- |
| `schema.prisma` | **52** | actif (généré) |
| `schema_backup.prisma` | 30 | contient les modèles « fantômes » |
| `schema_new.prisma` | 11 | idem |
| `schema_final.prisma`, `schema-optimized`, `schema-postgres`, `schema-sqlite`, `schema-simple`, `schema-compliance` | — | variantes historiques |

### Les « modèles fantômes »

**~60 accesseurs `prisma.X` distincts** utilisés dans du code applicatif **non-test** référencent des modèles **absents du schéma actif** (mais présents dans `schema_backup`/`schema_new`) :

```
procedure · workspace · workspaceEmail · workspaceDocument · workspaceMessage
workspaceNote · workspaceAlert · workspaceReasoning · task · evenement · delai
echeance · riskAssessment · chatSession · chatMessage · reasoningTrace (10 fichiers!)
strategicDecision · timelineEvent · obligation · fact · missingElement
proposedAction · approvalTask · contextHypothesis · …
```

**45 fichiers source non-test** touchent au moins un modèle fantôme. À l'exécution, ces routes lèvent `Cannot read properties of undefined (reading 'create'/'findMany'…)`.

Exemples confirmés (throw runtime garanti) :
- `src/app/api/delais/route.ts` → `prisma.delai.*`
- `src/app/api/clients/[id]/route.ts` et `src/app/api/dossiers/[id]/route.ts` → `prisma.evenement.create`
- `src/lib/services/dossier.service.ts` + de nombreuses routes → `include: { echeances: true }` / `_count.echeances` alors que `Dossier` n'a **aucune** relation `echeances`.

> **Diagnostic** : deux (voire trois) générations de modèle de données cohabitent. Une partie du code cible `schema.prisma`, une autre partie cible un modèle « workspace/procedure/reasoning » qui n'a jamais été fusionné ni supprimé.

---

## 4. NIVEAU 3 — Source de vérité des délais légaux

### 4.1 Deux stores décorrélés

```
┌─────────────────────────┐        ┌──────────────────────────┐
│  LegalDeadline.dueDate   │  ✗✗✗  │   Dossier.dateEcheance     │
│  (entité riche, alertes) │ jamais │   (scalaire dénormalisé)   │
└───────────┬─────────────┘  sync   └────────────┬─────────────┘
            │                                     │
   écrit par : POST /api/legal-deadlines  écrit par : dossier.service.ts,
   (manuel), cron deadline-alerts,        ceseda/dossier-service.ts
   escalation, suspend                    (saisie utilisateur)
            │                                     │
   lu par : morning-brief, copilot IA,   lu par : moteur de priorité,
   risk-analysis, suggestions,           suggestions (relance),
   timeline, smart-inbox, export         dashboard client, export,
                                         vue SQL de risque (postgres-init.sql)
```

Créer un `LegalDeadline` **ne met pas à jour** `Dossier.dateEcheance`, et inversement. Les deux ensembles de consommateurs voient donc des vérités différentes.

### 4.2 Quatre calculs CESEDA divergents

Le même savoir métier (délais OQTF/asile/titre de séjour) est réimplémenté **4 fois**, avec des constantes qui ne coïncident pas :

1. `src/lib/cesda/deadlineEngine.ts` — moteur « pur » (OQTF 48h/30j, asile 30j/6 mois) — **non branché à la persistance**.
2. `src/app/api/legal-deadlines/route.ts` — map `defaultDays` codée en dur (OQTF:30, RECOURS_*:60, APPEL:30).
3. `src/lib/services/deadlineExtractor.ts` — `OQTF_TEMPLATES` (48h/30j/60j) — résultats **jamais persistés**.
4. `src/app/api/emails/create-dossier/route.ts` — `getCesedaDeadlines()` inline (OQTF 30j, asile 21j/30j, référés 48h…) avec des `type` **hors enum** `DeadlineType`.

À quoi s'ajoute une 5ᵉ dérivation SQL dans `scripts/postgres-init.sql` (`EXTRACT(DAY FROM (dateEcheance - NOW()))`).

### 4.3 Code mort / dupliqué autour des délais

- `src/lib/services/deadline-monitor.service.ts` : classe `DeadlineMonitorService` en `@ts-nocheck`, **jamais instanciée**, qui duplique la logique de statut du cron `deadline-alerts.ts`.
- Extracteurs IA (`deadlineExtractor.ts`, `documentAnalysisService.ts`) : calculent des délais **jamais écrits** en base.

---

## 5. NIVEAU 1 & 4 — Workflow réel vs UI

### 5.1 🔴 Le flux « email → dossier » (cœur de la proposition de valeur) est cassé en silence

`src/app/api/emails/create-dossier/route.ts`, étape 6 :

```ts
await prisma.legalDeadline.create({
  data: {
    tenantId, dossierId: dossier.id, clientId: client?.id,
    type: dl.type,          // ex. 'OQTF_DEPART' — HORS enum DeadlineType
    label: dl.label,
    dueDate: dl.dueDate,
    status: 'PENDING',
    // ❌ id manquant        (schema: @id sans @default)
    // ❌ referenceDate manquant (requis, non-null)
    // ❌ createdBy manquant  (requis, non-null)
    // ❌ updatedAt manquant  (requis, sans @updatedAt)
  },
}).catch(() => {});          // ⬅️ l'erreur est AVALÉE
```

Chaque `create` échoue (4 champs requis absents **et** valeur d'enum invalide), l'exception est **avalée par `.catch(() => {})`**, et l'API renvoie `success: true` avec `deadlinesCreated: N`. **En production, la création automatique des délais CESEDA est un no-op silencieux.** C'est exactement le symptôme que tu avais repéré (seed avec mauvais champs + try/catch masquant l'erreur), mais ici sur le chemin métier le plus important.

Le fichier accumule d'ailleurs *tous* les symptômes : 4ᵉ calcul CESEDA inline, enum invalide, `.catch(() => {})` sur le lien email↔dossier aussi, et en-tête `CLERK-MIGRATION` dupliqué.

### 5.2 Doublons de concepts dans l'UI

Deux (voire trois) UIs modélisent **le même objet métier** :

- **« Dossier »** (18 pages : `dossiers/`, `admin/dossiers/`, `client/dossiers/`) → adossé au schéma actif.
- **« Workspace »** (8 pages : `workspaces/`, `lawyer/workspaces/`, `lawyer/workspace/` + `components/workspace/*`) → adossé aux **modèles fantômes** (`workspace`, `workspaceEmail`, `workspaceDocument`, `workspaceNote`). L'UI **fait réellement des `fetch`** vers `/api/lawyer/workspaces/…` et `/api/workspaces` → routes cassées à l'exécution.
- Variante orpheline `lawyer/workspaces/[id]/page-complete.tsx` (tentative dupliquée).

Même schéma de doublon pour « Tâches » (6 pages, modèle `task` fantôme) et « Délais » (`delais` fantôme).

### 5.3 Migration d'authentification inachevée

**170 fichiers** portent des marqueurs `CLERK-MIGRATION` (ex. `// CLERK-MIGRATION: Remplacement auth() -> auth()`), signe d'une migration NextAuth→Clerk laissée en l'état.

---

## 6. Pourquoi les 4555 tests ne protègent pas l'architecture

Les tests mockent Prisma avec des relations/modèles qui **n'existent pas** dans le schéma actif :

- `src/__tests__/api/dossiers/dossiers.test.ts` : `include: { client: true, documents: true, echeances: true }`
- `src/__tests__/lib/mappers/dossier.mapper.test.ts` : `_count: { documents, echeances }`, `expect(result._count.echeances).toBe(2)`

Ils valident donc un comportement **contre un modèle mocké** différent du modèle réel. Un test vert ne prouve ici ni que la route fonctionne, ni que le workflow global est cohérent. C'est le piège classique : **beaucoup de tests unitaires, aucune garantie d'intégrité métier de bout en bout.**

---

## 7. Modèle mental cible proposé

Une seule source de vérité par information, un seul flux :

```
                        ┌──────────────┐
                        │    EMAIL      │  (ingestion webhook + dédup)
                        └──────┬───────┘
                               ▼
                        ┌──────────────┐
                        │  IA / ANALYSE │  (résumé, classification, extraction)
                        └──────┬───────┘
                 ┌─────────────┴─────────────┐
                 ▼                           ▼
            ┌─────────┐                 ┌──────────┐
            │ CLIENT  │◄────────────────│ DOSSIER  │  (UNE entité — plus de « Workspace »)
            └─────────┘                 └────┬─────┘
                                             │
                           ┌─────────────────┼─────────────────┐
                           ▼                 ▼                 ▼
                     LEGAL_DEADLINE      DOCUMENTS           TÂCHES
                     (SEULE SoT délai)
                           │
                           ▼
                   ALERTES / IA / COPILOT   (lisent LegalDeadline, ne recalculent pas)
```

**Règles d'architecture cibles :**
1. `LegalDeadline` = **unique source de vérité** des délais. `Dossier.dateEcheance` devient soit supprimé, soit une **projection dérivée** (calculée depuis le prochain `LegalDeadline` actif), jamais écrite indépendamment.
2. **Un seul module CESEDA** (`deadlineEngine.ts`) — toutes les créations de délai passent par lui. Suppression des 3 autres implémentations.
3. **Un seul modèle** pour l'objet « affaire » : fusionner « Workspace » dans « Dossier » (ou supprimer Workspace).
4. **Zéro `.catch(() => {})`** sur un chemin d'écriture métier : les erreurs remontent et échouent visiblement.
5. `@id @default(cuid())` + `@updatedAt` sur tous les modèles → plus d'`id`/`updatedAt` manuels.
6. Un seul fichier `schema.prisma`. Les 8 autres partent dans `prisma/_archive_schemas/` (ou sont supprimés).

---

## 8. Plan de remédiation priorisé

### 🔴 P0 — Arrêter l'hémorragie (jours)
1. **Réparer `email → dossier`** : ajouter `id/referenceDate/createdBy/updatedAt`, mapper `dl.type` sur l'enum `DeadlineType` valide, **retirer les `.catch(() => {})`**. Ajouter un test d'intégration qui vérifie que N délais sont *réellement* créés en base.
2. **Inventaire des routes cassées** : lister les 45 fichiers ciblant un modèle fantôme ; décider par route → réécrire vers le schéma actif ou supprimer.
3. **Corriger les tests trompeurs** : retirer les mocks `echeances`/`_count.echeances`/modèles fantômes, remplacer par la relation réelle `LegalDeadline`.

### 🟠 P1 — Unifier la source de vérité (1–2 semaines)
4. **Unifier les délais** : router toute création de `LegalDeadline` via `deadlineEngine.ts` ; faire de `Dossier.dateEcheance` une projection dérivée (ou la supprimer). Supprimer `DeadlineMonitorService`.
5. **Fusionner Workspace ↔ Dossier** : choisir un seul modèle, migrer l'UI, supprimer les pages/routes/composants dupliqués (`workspaces/*`, `lawyer/workspace(s)/*`, `page-complete.tsx`).
6. **Terminer la migration Clerk** : résoudre les 170 marqueurs `CLERK-MIGRATION`.

### 🟢 P2 — Hygiène & garde-fous (continu)
7. **Un seul `schema.prisma`** ; archiver/supprimer les 8 autres `.prisma`.
8. `@default(cuid())` + `@updatedAt` généralisés.
9. **Tests d'intégration DB réels** (au moins sur le flux email→dossier→délai→alerte) pour empêcher la régression « split-brain ».
10. Lint/CI : interdire les nouveaux `prisma.<modèle>` hors schéma (règle simple : comparer les accesseurs au schéma).

---

## 9. Fichiers de référence

| Fichier | Rôle dans l'audit |
| --- | --- |
| `prisma/schema.prisma` | schéma actif (52 modèles) |
| `prisma/schema_backup.prisma`, `prisma/schema_new.prisma` | contiennent les modèles fantômes |
| `src/app/api/emails/create-dossier/route.ts` | flux central cassé en silence (§5.1) |
| `src/lib/cesda/deadlineEngine.ts` | moteur CESEDA « pur » non branché |
| `src/app/api/legal-deadlines/route.ts` | seul écrivain manuel de `LegalDeadline` |
| `src/lib/cron/deadline-alerts.ts` | machine à états des alertes de délai |
| `src/lib/services/dossier.service.ts` | référence la relation inexistante `echeances` |
| `src/app/api/delais/route.ts` | route cassée (`prisma.delai`) |
| `src/lib/services/deadline-monitor.service.ts` | code mort dupliquant le cron |

---

*Audit réalisé par analyse statique du dépôt. L'installation des dépendances (`npm install`) n'était pas possible dans l'environnement (registre npm bloqué), donc build/type-check/tests n'ont pas été relancés ; les constats reposent sur le code source, le schéma Prisma et les rapports pré-générés du dépôt.*
