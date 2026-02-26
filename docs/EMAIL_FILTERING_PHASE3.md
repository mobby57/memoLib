# Email Filtering avec FilterRule - Phase 3

**Status**: ✅ VALIDÉ (100% tests passing)
**Date**: 2025-02-01
**Features**: Feature 3 (Email Filtering) + Feature 1 (EventLog)

---

## Vue d'ensemble

La Phase 3 introduit le **filtrage automatique des emails** via des règles configurables. Les emails entrants sont automatiquement routés vers les bons dossiers, clients, catégories selon des conditions (from, subject, etc.).

### Flux de données

```
Email entrant (Gmail)
  ↓
/api/emails/incoming (Webhook)
  ↓
Analyse IA (FLOW_CLASSIFIED)
  ↓
[FilterRuleService.evaluateAllRules()] ← Évalue toutes règles actives
  ↓
Matches trouvés ? → OUI
  ↓
Pour chaque règle matchée:
  - Appliquer actions (ASSIGN_DOSSIER, SET_CATEGORY, etc.)
  - Mettre à jour Email en DB
  - [EventLog RULE_APPLIED] ← Tracer application
  - Incrémenter matchCount de la règle
```

---

## Schéma de données

### FilterRule model

**Table**: `filter_rules`

| Champ           | Type      | Description                                    |
| --------------- | --------- | ---------------------------------------------- |
| `id`            | UUID      | Identifiant unique                             |
| `tenantId`      | UUID      | Organisation propriétaire                      |
| `name`          | String    | Nom règle (ex: "VIP Clients Auto-Assign")      |
| `description`   | String?   | Description libre                              |
| `priority`      | Int       | Ordre évaluation (plus bas = plus prioritaire) |
| `enabled`       | Boolean   | Actif/inactif                                  |
| `conditions`    | JSON      | Array de `FilterCondition`                     |
| `actions`       | JSON      | Array de `FilterAction`                        |
| `dossierId`     | UUID?     | Dossier lié (relation optionnelle)             |
| `clientId`      | UUID?     | Client lié (relation optionnelle)              |
| `matchCount`    | Int       | Nombre d'applications                          |
| `lastMatchedAt` | DateTime? | Dernière application                           |
| `lastMatchedBy` | String?   | Email ID dernière application                  |

### FilterCondition (JSON)

```typescript
{
  field: 'from' | 'to' | 'subject' | 'body' | 'category' | 'urgency' | 'sentiment',
  operator: 'EQUALS' | 'CONTAINS' | 'STARTS_WITH' | 'ENDS_WITH' | 'REGEX' | 'IN' | 'NOT_IN',
  value: string | string[]
}
```

**Exemples**:

```json
[
  { "field": "from", "operator": "CONTAINS", "value": "@vip.com" },
  { "field": "subject", "operator": "STARTS_WITH", "value": "URGENT" },
  { "field": "category", "operator": "IN", "value": ["legal-question", "contentieux"] }
]
```

### FilterAction (JSON)

```typescript
{
  type: 'ASSIGN_DOSSIER' | 'ASSIGN_CLIENT' | 'SET_CATEGORY' | 'SET_URGENCY' | 'SET_TAGS' | 'MARK_STARRED' | 'ARCHIVE' | 'NOTIFY_USER' | 'TRIGGER_WORKFLOW',
  dossierId?: string,
  clientId?: string,
  value?: string,
  userId?: string,
  workflowId?: string
}
```

**Exemples**:

```json
[
  { "type": "ASSIGN_DOSSIER", "dossierId": "uuid-123" },
  { "type": "SET_CATEGORY", "value": "vip-request" },
  { "type": "SET_URGENCY", "value": "high" },
  { "type": "MARK_STARRED" }
]
```

---

## Implémentation

### 1. FilterRuleService

**Fichier**: `src/frontend/lib/services/filter-rule.service.ts`

**Responsabilités**:

- Évaluer règles contre emails entrants
- Appliquer actions sur emails matchés
- Tracer avec EventLog (RULE_APPLIED)
- Mettre à jour stats des règles

**Méthodes clés**:

```typescript
// Évaluer toutes règles actives pour un email
async evaluateAllRules(email: Email, tenantId: string): Promise<RuleMatch[]>

// Évaluer une règle individuelle
private evaluateRule(email: Email, rule: FilterRule): RuleMatch | null

// Évaluer une condition
private evaluateCondition(email: Email, condition: FilterCondition): boolean

// Appliquer actions d'une règle
async applyActions(emailId: string, rule: FilterRule, tenantId: string): Promise<void>

// Tracer règle non matchée (debug)
async logSkippedRule(emailId: string, rule: FilterRule, reason: string, tenantId: string): Promise<void>

// Valider règle avant création
validateRule(rule: Partial<FilterRule>): { valid: boolean; errors: string[] }
```

**Logique d'évaluation**:

1. Récupérer toutes règles actives (`enabled = true`) triées par `priority ASC`
2. Pour chaque règle:
   - Évaluer chaque condition
   - Si **toutes** conditions matchent → règle matchée
3. Retourner règles matchées avec métadata (`confidence`, `matchedConditions`)

**Opérateurs supportés**:

| Opérateur     | Description                        | Exemple                                |
| ------------- | ---------------------------------- | -------------------------------------- |
| `EQUALS`      | Égalité stricte (case-insensitive) | `from == "client@vip.com"`             |
| `CONTAINS`    | Contient substring                 | `from CONTAINS "@vip.com"`             |
| `STARTS_WITH` | Commence par                       | `subject STARTS_WITH "URGENT"`         |
| `ENDS_WITH`   | Finit par                          | `from ENDS_WITH "@gmail.com"`          |
| `REGEX`       | Match regex                        | `subject REGEX "^\[.*\]"`              |
| `IN`          | Dans liste                         | `category IN ["legal", "contentieux"]` |
| `NOT_IN`      | Pas dans liste                     | `urgency NOT_IN ["low"]`               |

---

### 2. Intégration webhook

**Fichier**: `src/app/api/emails/incoming/route.ts`

**Workflow complet**:

```typescript
// 1. Recevoir email (webhook Gmail)
const { from, to, subject, body } = await request.json();

// 2. Créer Email en DB
const email = await prisma.email.create({ ... });

// 3. Analyser avec IA
const aiAnalysis = await analyzeEmail({ subject, body, from });

// 4. Tracer FLOW_CLASSIFIED
await eventLogService.createEventLog({
  eventType: 'FLOW_CLASSIFIED',
  entityId: email.id,
  ...
});

// 5. NOUVEAU: Évaluer et appliquer règles de filtrage
const ruleMatches = await filterRuleService.evaluateAllRules(email, tenant.id);
for (const match of ruleMatches) {
  await filterRuleService.applyActions(email.id, match.rule, tenant.id);
  logger.info(`[FILTER-RULE] Appliquée: ${match.rule.name}`);
}

// 6. Créer workflow
const workflow = await prisma.workflowExecution.create({ ... });

// 7. Retourner succès
return NextResponse.json({ success: true, emailId: email.id });
```

---

## Tests

### Test d'intégration

**Fichier**: `src/__tests__/email-filtering-test.ts`

**Scénario**:

1. Créer tenant + client VIP + dossier VIP
2. Créer règle de filtrage:
   - **Condition**: `from CONTAINS "@client.com"`
   - **Actions**:
     - `ASSIGN_DOSSIER` → dossier VIP
     - `SET_CATEGORY` → "vip-request"
     - `SET_URGENCY` → "high"
     - `MARK_STARRED`
3. Créer email test (`from: vip@client.com`)
4. Évaluer règles → 1 match trouvé (confidence 100%)
5. Appliquer actions → email mis à jour
6. Vérifier EventLog `RULE_APPLIED` créé
7. Vérifier stats règle (`matchCount = 1`)

**Résultat**: ✅ **100% passing**

**Commande**:

```bash
npx tsx src/__tests__/email-filtering-test.ts
```

**Output attendu**:

```
✅ Règle de filtrage créée
✅ Règle appliquée sur email
✅ EventLog RULE_APPLIED créé
✅ Total events: 1
✅ Email assigné au dossier: OUI
✅ Catégorie changée: OUI
✅ Urgence changée: OUI
✅ Email marqué starred: OUI

🎉 Email Filtering VALIDÉ
```

---

## EventLog RULE_APPLIED

### Structure metadata

```json
{
  "ruleId": "uuid-règle",
  "ruleName": "VIP Clients Auto-Assign",
  "actions": ["ASSIGN_DOSSIER", "SET_CATEGORY", "SET_URGENCY", "MARK_STARRED"],
  "appliedChanges": ["dossierId", "category", "urgency", "isStarred"]
}
```

### Requête audit

**Liste tous emails filtrés**:

```sql
SELECT
  el."entityId" AS email_id,
  el.metadata->>'ruleName' AS rule_name,
  el.metadata->>'actions' AS actions,
  el."timestamp"
FROM "event_logs" el
WHERE
  el."eventType" = 'RULE_APPLIED'
  AND el."entityType" = 'email'
ORDER BY el."timestamp" DESC;
```

**Stats par règle**:

```sql
SELECT
  fr."name" AS rule_name,
  fr."matchCount",
  fr."lastMatchedAt",
  COUNT(el.id) AS total_applications
FROM "filter_rules" fr
LEFT JOIN "event_logs" el ON
  el."eventType" = 'RULE_APPLIED'
  AND el.metadata->>'ruleId' = fr."id"::TEXT
GROUP BY fr.id
ORDER BY fr."matchCount" DESC;
```

---

## Cas d'usage

### Exemple 1: VIP Clients

**Règle**:

```json
{
  "name": "VIP Clients Auto-Assign",
  "priority": 10,
  "conditions": [{ "field": "from", "operator": "CONTAINS", "value": "@vip.com" }],
  "actions": [
    { "type": "ASSIGN_DOSSIER", "dossierId": "dossier-vip-uuid" },
    { "type": "SET_URGENCY", "value": "high" },
    { "type": "MARK_STARRED" }
  ]
}
```

**Effet**:

- Email de `client@vip.com` → assigné au dossier VIP
- Urgence passée à `high`
- Email marqué étoilé pour visibilité

### Exemple 2: Factures automatiques

**Règle**:

```json
{
  "name": "Factures Auto-Routing",
  "priority": 20,
  "conditions": [
    { "field": "subject", "operator": "CONTAINS", "value": "facture" },
    { "field": "subject", "operator": "CONTAINS", "value": "invoice" }
  ],
  "actions": [
    { "type": "SET_CATEGORY", "value": "billing" },
    { "type": "ASSIGN_DOSSIER", "dossierId": "dossier-compta-uuid" },
    { "type": "ARCHIVE" }
  ]
}
```

**Effet**:

- Email avec "facture" ou "invoice" dans sujet → catégorie "billing"
- Assigné au dossier comptabilité
- Archivé automatiquement (déjà traité)

### Exemple 3: Détection urgences

**Règle**:

```json
{
  "name": "Urgences OQTF",
  "priority": 1, // Très prioritaire
  "conditions": [
    { "field": "subject", "operator": "REGEX", "value": "OQTF|obligation.*quitter" },
    { "field": "urgency", "operator": "IN", "value": ["high", "critical"] }
  ],
  "actions": [
    { "type": "SET_URGENCY", "value": "critical" },
    { "type": "SET_CATEGORY", "value": "oqtf-urgence" },
    { "type": "MARK_STARRED" },
    { "type": "NOTIFY_USER", "userId": "admin-uuid" }
  ]
}
```

**Effet**:

- Email mentionnant OQTF → urgence passée à `critical`
- Catégorie spécifique OQTF
- Admin notifié immédiatement

---

## Prochaines étapes (Phase 4+)

### API CRUD /api/filter-rules

**Endpoints à créer**:

- `POST /api/filter-rules` - Créer règle
- `GET /api/filter-rules` - Lister règles (pagination + filtres)
- `GET /api/filter-rules/:id` - Détails règle
- `PATCH /api/filter-rules/:id` - Modifier règle
- `DELETE /api/filter-rules/:id` - Supprimer règle
- `POST /api/filter-rules/:id/toggle` - Activer/désactiver

**Validation**:

- Admin-only
- Validation côté serveur via `filterRuleService.validateRule()`
- Interdire règles trop larges (ex: `from CONTAINS "."` → match tout)

### UI FilterRuleManager

**Composant React**: `src/components/admin/FilterRuleManager.tsx`

**Features**:

- Liste règles avec tri par priority
- Form création règle (conditions + actions)
- Preview règle (afficher JSON)
- Toggle enable/disable
- Stats règle (matchCount, dernière application)
- Test règle sur email existant

### Smart Inbox Scoring (Phase 4)

**Objectif**: Score AI 0-100 pour priorité email

**EventLog requis**:

- `FLOW_SCORED` (acteur AI, metadata: score, factors, model)

**Intégration**:

- Appeler après FLOW_CLASSIFIED
- Utiliser score pour tri inbox
- Combiner avec FilterRule pour double filtrage

---

## Commandes utiles

### Test Email Filtering

```bash
npx tsx src/__tests__/email-filtering-test.ts
```

### Créer migration

```bash
npx prisma migrate dev --name add_filter_rules_phase3
```

### Monitoring règles en DB

```sql
-- Règles les plus utilisées
SELECT "name", "matchCount", "lastMatchedAt", "enabled"
FROM "filter_rules"
WHERE "enabled" = true
ORDER BY "matchCount" DESC
LIMIT 10;

-- Emails filtrés aujourd'hui
SELECT
  e.id,
  e."from",
  e.subject,
  e.category,
  el.metadata->>'ruleName' AS rule_applied,
  el."timestamp"
FROM "emails" e
JOIN "event_logs" el ON
  el."entityType" = 'email'
  AND el."entityId" = e.id
  AND el."eventType" = 'RULE_APPLIED'
WHERE el."timestamp" >= CURRENT_DATE
ORDER BY el."timestamp" DESC;
```

---

## Références

- **EventLog Phase 1**: [EVENTLOG_PHASE1_SUMMARY.md](./EVENTLOG_PHASE1_SUMMARY.md)
- **Gmail Integration Phase 2**: [GMAIL_INTEGRATION_PHASE2.md](./GMAIL_INTEGRATION_PHASE2.md)
- **FilterRuleService**: [src/frontend/lib/services/filter-rule.service.ts](../src/frontend/lib/services/filter-rule.service.ts)
- **Test**: [src/**tests**/email-filtering-test.ts](../src/__tests__/email-filtering-test.ts)

---

**Dernière mise à jour**: 2025-02-01
**Auteur**: Copilot (GitHub Agent)
**Validation**: ✅ Tests passing (100%)
