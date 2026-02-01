# ⚖️ RÈGLES MÉTIER — MEMO LIB

**Version** : 1.0
**Date** : 1er février 2026
**Usage** : Référence pour implémentation, tests, et validation produit

---

## 🎯 OBJECTIF DE CE DOCUMENT

Transformer les **fonctionnalités produit** (PRODUCT_SPEC.md) en **règles métier testables** qui guident :

1. L'implémentation technique (code)
2. Les tests automatisés (unitaires, intégration, E2E)
3. La validation conformité (juridique, RGPD)

---

## 📐 FORMAT DES RÈGLES

Chaque règle suit ce template :

```
[RULE-XXX] Titre de la règle

Type : MUST | MUST NOT | SHOULD | SHOULD NOT
Priorité : P0 | P1 | P2
Fonctionnalité : #N (référence PRODUCT_SPEC.md)

Description :
<Description claire et non ambiguë>

Critère de test :
GIVEN <contexte>
WHEN <action>
THEN <résultat attendu>

Implémentation :
- Backend : <fichier/fonction>
- Frontend : <composant>
- DB : <contrainte/trigger>
```

---

## 🔥 RÈGLES CRITIQUES (P0)

### Ingestion & Immuabilité

#### [RULE-001] Capture exhaustive des flux

**Type** : MUST
**Priorité** : P0
**Fonctionnalité** : #1 (Monitoring des flux)

**Description** :
Tout flux entrant via un canal supporté (email, upload, API) DOIT être capturé et enregistré en base de données, sans exception.

**Critère de test** :

```gherkin
GIVEN un email est reçu sur l'adresse surveillée
WHEN le système polling détecte l'email
THEN un enregistrement IncomingFlow est créé en DB avec status="received"
  AND un EventLog de type "flow.received" est créé
  AND le contenu brut est stocké tel quel
```

**Implémentation** :

- Backend : `src/lib/email/gmail-monitor.ts::fetchNewEmails()`
- Frontend : N/A
- DB : Table `IncomingFlow` avec contrainte `NOT NULL` sur `rawContent`

---

#### [RULE-002] Immuabilité du contenu source

**Type** : MUST NOT
**Priorité** : P0
**Fonctionnalité** : #1, #2

**Description** :
Le contenu brut d'un flux (`rawContent`) ne DOIT JAMAIS être modifié après sa création. Toute transformation génère une version dérivée.

**Critère de test** :

```gherkin
GIVEN un flux avec rawContent = "contenu original"
WHEN un processus de normalisation est exécuté
THEN rawContent reste inchangé
  AND un nouveau champ `normalizedContent` est créé
  AND un EventLog "flow.normalized" est créé
```

**Implémentation** :

- Backend : Contrainte DB `rawContent` en lecture seule (trigger)
- DB :
  ```sql
  CREATE TRIGGER prevent_raw_content_update
  BEFORE UPDATE ON IncomingFlow
  FOR EACH ROW
  WHEN (OLD.rawContent IS DISTINCT FROM NEW.rawContent)
  EXECUTE FUNCTION raise_exception();
  ```

---

#### [RULE-003] Horodatage serveur fiable

**Type** : MUST
**Priorité** : P0
**Fonctionnalité** : #1, #3

**Description** :
L'horodatage de réception (`receivedAt`) DOIT utiliser l'horloge serveur (timestamp monotone), PAS le header `Date` de l'email qui peut être falsifié.

**Critère de test** :

```gherkin
GIVEN un email avec header Date="2025-01-01 00:00:00"
  AND l'heure serveur est "2026-02-01 10:00:00"
WHEN le flux est enregistré
THEN IncomingFlow.receivedAt = "2026-02-01 10:00:00"
  AND metadata.emailDate = "2025-01-01 00:00:00" (pour référence)
```

**Implémentation** :

- Backend : `new Date()` côté serveur dans `gmail-monitor.ts`
- DB : Contrainte `receivedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

---

### EventLog & Traçabilité

#### [RULE-004] Immuabilité absolue des EventLog

**Type** : MUST NOT
**Priorité** : P0
**Fonctionnalité** : #3

**Description** :
Un EventLog créé ne PEUT JAMAIS être modifié ou supprimé. Toute tentative DOIT échouer avec erreur.

**Critère de test** :

```gherkin
GIVEN un EventLog existant avec id="evt-123"
WHEN une requête UPDATE ou DELETE est exécutée sur cet EventLog
THEN la requête échoue avec erreur "EventLog are immutable"
  AND aucune modification n'est appliquée en DB
```

**Implémentation** :

- DB : Trigger PostgreSQL
  ```sql
  CREATE TRIGGER prevent_eventlog_modification
  BEFORE UPDATE OR DELETE ON EventLog
  FOR EACH ROW
  EXECUTE FUNCTION raise_exception('EventLog are immutable');
  ```
- Backend : Validation Prisma middleware
  ```typescript
  prisma.$use(async (params, next) => {
    if (params.model === 'EventLog' && ['update', 'delete'].includes(params.action)) {
      throw new Error('EventLog are immutable');
    }
    return next(params);
  });
  ```

---

#### [RULE-005] Exhaustivité des événements tracés

**Type** : MUST
**Priorité** : P0
**Fonctionnalité** : #3

**Description** :
TOUTE action significative (système ou utilisateur) DOIT générer un EventLog. Liste minimale :

- Réception flux
- Normalisation
- Classification automatique
- Validation/rejet suggestion
- Assignation dossier
- Fusion doublons
- Consultation données sensibles
- Export audit

**Critère de test** :

```gherkin
GIVEN un utilisateur assigne manuellement le flux #123 au dossier #456
WHEN l'assignation est validée
THEN un EventLog de type "user.assigned_flow" est créé
  AND EventLog.actorId = userId de l'utilisateur
  AND EventLog.metadata contient { flowId: 123, dossierId: 456 }
```

**Implémentation** :

- Backend : Fonction helper `createEventLog()` appelée systématiquement
  ```typescript
  async function createEventLog(eventType: string, metadata: any) {
    await prisma.eventLog.create({
      data: {
        eventType,
        timestamp: new Date(),
        metadata,
        immutable: true,
        checksum: hashEvent({ eventType, metadata }),
      },
    });
  }
  ```

---

#### [RULE-006] Checksum d'intégrité EventLog

**Type** : MUST
**Priorité** : P0
**Fonctionnalité** : #3

**Description** :
Chaque EventLog DOIT contenir un checksum (hash) permettant de vérifier que l'événement n'a pas été altéré.

**Critère de test** :

```gherkin
GIVEN un EventLog avec checksum calculé à la création
WHEN on recalcule le checksum à partir des données actuelles
THEN le checksum recalculé = checksum stocké
  AND si différent, une alerte de corruption est levée
```

**Implémentation** :

- Backend :
  ```typescript
  function hashEvent(event: EventLog): string {
    const canonical = JSON.stringify({
      eventType: event.eventType,
      timestamp: event.timestamp.toISOString(),
      entityId: event.entityId,
      metadata: event.metadata,
    });
    return createHash('sha256').update(canonical).digest('hex');
  }
  ```
- Validation périodique : Cron job vérifiant l'intégrité

---

### Validation Humaine

#### [RULE-007] Pas d'action automatique sur données sensibles

**Type** : MUST NOT
**Priorité** : P0
**Fonctionnalité** : #4, #6

**Description** :
Le système ne DOIT JAMAIS associer automatiquement un flux à un dossier, fusionner des entités, ou modifier des données sensibles sans validation humaine explicite.

**Critère de test** :

```gherkin
GIVEN une suggestion automatique avec confidence=0.95
  AND le flux est lié à un client "sensible" (avocat, juge, etc.)
WHEN le système génère la suggestion
THEN la suggestion est enregistrée avec status="pending"
  AND AUCUNE action automatique n'est appliquée
  AND l'utilisateur doit cliquer "Valider" pour appliquer
```

**Implémentation** :

- Backend : Pas de `autoApply` dans la logique
- Frontend : Bouton "Valider" obligatoire (pas de checkbox "Appliquer automatiquement")

---

#### [RULE-008] Traçabilité des décisions humaines

**Type** : MUST
**Priorité** : P0
**Fonctionnalité** : #3, #4

**Description** :
Toute validation ou rejet de suggestion DOIT être tracée dans EventLog avec userId, décision, et raison optionnelle.

**Critère de test** :

```gherkin
GIVEN une suggestion automatique id="sugg-123"
WHEN l'utilisateur clique "Rejeter" avec raison "Mauvaise entité détectée"
THEN un EventLog "user.rejected_suggestion" est créé
  AND EventLog.metadata.suggestionId = "sugg-123"
  AND EventLog.metadata.reason = "Mauvaise entité détectée"
  AND EventLog.actorId = userId
```

**Implémentation** :

- Backend : `validateSuggestion(suggestionId, decision, reason)`
- Frontend : Champ texte optionnel "Raison du rejet"

---

### Doublons

#### [RULE-009] Pas de fusion automatique de doublons

**Type** : MUST NOT
**Priorité** : P0
**Fonctionnalité** : #5

**Description** :
Même si deux flux ont un hash 100% identique, le système ne DOIT PAS les fusionner automatiquement. Une alerte est créée, l'humain décide.

**Critère de test** :

```gherkin
GIVEN deux flux avec contentHash identique
WHEN le deuxième flux est normalisé
THEN une DuplicateAlert est créée avec status="pending"
  AND les deux flux restent distincts en DB
  AND aucune fusion n'est appliquée automatiquement
```

**Implémentation** :

- Backend : `detectDuplicates()` crée alert, pas fusion
- Frontend : Modal "Doublon détecté" avec choix utilisateur

---

#### [RULE-010] Conservation des flux fusionnés

**Type** : MUST
**Priorité** : P0
**Fonctionnalité** : #5

**Description** :
Lors d'une fusion de doublons, les DEUX flux DOIVENT être conservés en DB, avec un lien explicite (pas de suppression).

**Critère de test** :

```gherkin
GIVEN flux A et flux B détectés comme doublons
WHEN l'utilisateur valide "Fusionner" (A = primaire, B = doublon)
THEN flux A reste inchangé
  AND flux B.status = "duplicate"
  AND flux B.primaryFlowId = A.id
  AND les deux flux restent accessibles
```

**Implémentation** :

- DB : Champ `primaryFlowId` dans `IncomingFlow`
- Backend : Soft delete avec lien, jamais `DELETE`

---

### Sécurité

#### [RULE-011] Accès minimum nécessaire

**Type** : MUST
**Priorité** : P0
**Fonctionnalité** : #8

**Description** :
Un utilisateur ne DOIT accéder qu'aux flux/dossiers de son périmètre (tenant + rôle). Tout accès hors périmètre retourne HTTP 403.

**Critère de test** :

```gherkin
GIVEN un utilisateur avec rôle="Operator" et tenantId="tenant-A"
WHEN il tente d'accéder à un flux de tenantId="tenant-B"
THEN la requête échoue avec HTTP 403 Forbidden
  AND un EventLog "access.forbidden" est créé
```

**Implémentation** :

- Backend : Middleware `checkTenantAccess()` sur toutes routes API
- Frontend : Filtrage côté client (backup, pas sécurité principale)

---

#### [RULE-012] Journal d'accès exhaustif

**Type** : MUST
**Priorité** : P0
**Fonctionnalité** : #8

**Description** :
TOUT accès à un flux sensible (consultation, téléchargement PJ, export) DOIT être tracé dans EventLog.

**Critère de test** :

```gherkin
GIVEN un flux marqué "sensible"
WHEN un utilisateur consulte ce flux
THEN un EventLog "access.viewed_flow" est créé
  AND EventLog.metadata contient { flowId, userIp, userAgent }
```

**Implémentation** :

- Backend : Hook Prisma sur `findUnique` pour flux sensibles
- Frontend : Tracking côté client (backup)

---

## ⚠️ RÈGLES IMPORTANTES (P1)

### Normalisation

#### [RULE-013] Hash cryptographique SHA-256

**Type** : MUST
**Priorité** : P1
**Fonctionnalité** : #2

**Description** :
Le hash du contenu DOIT utiliser SHA-256 (minimum) sur le contenu brut complet (headers + body + attachments).

**Critère de test** :

```gherkin
GIVEN un flux avec rawContent = "email brut complet"
WHEN le hash est calculé
THEN contentHash = SHA256(rawContent)
  AND deux flux avec rawContent identique ont le même hash
```

**Implémentation** :

- Backend : `crypto.createHash('sha256').update(rawContent).digest('hex')`

---

#### [RULE-014] Versioning des transformations

**Type** : SHOULD
**Priorité** : P1
**Fonctionnalité** : #2

**Description** :
Chaque transformation du contenu (normalisation, extraction, etc.) DEVRAIT créer une version dérivée avec lien vers l'original.

**Critère de test** :

```gherkin
GIVEN un flux original avec rawContent
WHEN une extraction de texte est effectuée
THEN une DocumentVersion est créée avec type="text_extraction"
  AND DocumentVersion.sourceFlowId = flux.id
  AND DocumentVersion.version = 1
```

**Implémentation** :

- DB : Table `DocumentVersion`
- Backend : Fonction `createDerivedVersion(flowId, type, content)`

---

### Supervision

#### [RULE-015] Alertes SLA dépassés

**Type** : SHOULD
**Priorité** : P1
**Fonctionnalité** : #6

**Description** :
Si un flux n'est pas classé après 24h, une alerte DEVRAIT être générée dans le dashboard.

**Critère de test** :

```gherkin
GIVEN un flux avec status="received"
  AND receivedAt = maintenant - 25 heures
WHEN le cron job de vérification SLA s'exécute
THEN une alerte "flux_unclassified_24h" est créée
  AND affichée dans le dashboard supervision
```

**Implémentation** :

- Backend : Cron job toutes les heures
  ```typescript
  async function checkSLA() {
    const unclassified = await prisma.incomingFlow.findMany({
      where: {
        status: 'received',
        receivedAt: { lt: new Date(Date.now() - 24 * 3600 * 1000) },
      },
    });
    // Créer alertes...
  }
  ```

---

#### [RULE-016] Commentaires internes horodatés

**Type** : MUST
**Priorité** : P1
**Fonctionnalité** : #6

**Description** :
Les commentaires internes DOIVENT être horodatés, liés à un utilisateur, et non modifiables après création.

**Critère de test** :

```gherkin
GIVEN un flux #123
WHEN un utilisateur ajoute un commentaire "À vérifier avec le client"
THEN un Comment est créé avec createdAt, userId, flowId
  AND le commentaire n'est plus éditable (immutable)
  AND un EventLog "user.added_comment" est créé
```

**Implémentation** :

- DB : Table `Comment` avec trigger immutabilité
- Frontend : Pas de bouton "Éditer" sur commentaires

---

### Recherche

#### [RULE-017] Score de pertinence explicable

**Type** : SHOULD
**Priorité** : P1
**Fonctionnalité** : #7

**Description** :
Le score de pertinence DEVRAIT être accompagné d'une explication (champs matchés, termes trouvés).

**Critère de test** :

```gherkin
GIVEN une recherche "contrat bail"
WHEN les résultats sont affichés
THEN chaque résultat a un score (ex: 87/100)
  AND une explication "Trouvé dans sujet (2×) et corps (1×)"
```

**Implémentation** :

- Backend : Fonction `explainScore(query, result)` avec highlighting

---

## 📈 RÈGLES OPTIONNELLES (P2)

### Métriques

#### [RULE-018] Calcul temps moyen traitement

**Type** : SHOULD
**Priorité** : P2
**Fonctionnalité** : #9

**Description** :
Le temps moyen entre réception et classification validée DEVRAIT être calculé et affiché.

**Critère de test** :

```gherkin
GIVEN 10 flux traités avec temps respectifs [5min, 10min, 3min, ...]
WHEN le dashboard métriques est consulté
THEN le temps moyen affiché = moyenne([...])
  AND actualisé en temps réel (< 5 min latence)
```

**Implémentation** :

- Backend : Agrégation Prisma
  ```typescript
  async function getAverageProcessingTime() {
    const flows = await prisma.incomingFlow.findMany({
      where: { status: 'classified' },
      select: { receivedAt: true, classifiedAt: true },
    });
    const durations = flows.map(f => f.classifiedAt - f.receivedAt);
    return average(durations);
  }
  ```

---

#### [RULE-019] Export PDF timeline conforme

**Type** : SHOULD
**Priorité** : P2
**Fonctionnalité** : #9

**Description** :
L'export PDF d'une timeline DEVRAIT être conforme à la norme NF Z42-013 (coffre-fort numérique).

**Critère de test** :

```gherkin
GIVEN un dossier avec EventLog complet
WHEN l'utilisateur clique "Exporter timeline PDF"
THEN un PDF est généré avec :
  - EventLog chronologique
  - Checksums vérifiables
  - Signature numérique serveur
  - Métadonnées (date export, utilisateur)
```

**Implémentation** :

- Backend : Librairie `pdfkit` + signature crypto
- Validation : Vérification PDF/A compliance

---

## 🧪 RÈGLES DE TEST

### [RULE-TEST-001] Tests unitaires sur règles critiques

**Priorité** : P0

Toute règle MUST (P0) DOIT avoir au moins un test unitaire automatisé.

**Exemple** (RULE-004 : Immuabilité EventLog) :

```typescript
// tests/eventlog.test.ts
describe('EventLog Immutability', () => {
  it('should prevent UPDATE on EventLog', async () => {
    const event = await prisma.eventLog.create({ data: {...} });

    await expect(
      prisma.eventLog.update({
        where: { id: event.id },
        data: { eventType: 'modified' }
      })
    ).rejects.toThrow('EventLog are immutable');
  });

  it('should prevent DELETE on EventLog', async () => {
    const event = await prisma.eventLog.create({ data: {...} });

    await expect(
      prisma.eventLog.delete({ where: { id: event.id } })
    ).rejects.toThrow('EventLog are immutable');
  });
});
```

---

### [RULE-TEST-002] Tests E2E sur workflows critiques

**Priorité** : P0

Les workflows utilisateur critiques DOIVENT avoir des tests E2E (Playwright).

**Exemple** (Workflow validation suggestion) :

```typescript
// e2e/suggestion-validation.spec.ts
test('User can validate AI suggestion', async ({ page }) => {
  // Setup: flux avec suggestion automatique
  const flow = await createTestFlow();
  const suggestion = await createTestSuggestion(flow.id);

  // Navigate to supervision dashboard
  await page.goto('/supervision');

  // Find suggestion
  await page.click(`[data-suggestion-id="${suggestion.id}"]`);

  // Validate
  await page.click('button:has-text("Valider")');

  // Assert: EventLog created
  const eventLog = await prisma.eventLog.findFirst({
    where: {
      eventType: 'user.validated_suggestion',
      metadata: { path: ['suggestionId'], equals: suggestion.id },
    },
  });
  expect(eventLog).toBeDefined();
});
```

---

### [RULE-TEST-003] Tests de charge sur ingestion

**Priorité** : P1

Le système DOIT supporter 1000 flux/jour sans perte de données.

**Exemple** :

```typescript
// tests/load/ingestion.test.ts
test('System handles 1000 concurrent flux', async () => {
  const promises = Array.from({ length: 1000 }, (_, i) => createTestFlow({ subject: `Test ${i}` }));

  const results = await Promise.allSettled(promises);

  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  expect(succeeded).toBe(1000);

  // Verify no data loss
  const count = await prisma.incomingFlow.count();
  expect(count).toBeGreaterThanOrEqual(1000);
});
```

---

## 🔗 MAPPING RÈGLES → CODE

### Backend

| Règle    | Module                   | Fonction/Endpoint            |
| -------- | ------------------------ | ---------------------------- |
| RULE-001 | `gmail-monitor.ts`       | `fetchNewEmails()`           |
| RULE-002 | DB trigger               | `prevent_raw_content_update` |
| RULE-004 | `eventlog.service.ts`    | Prisma middleware            |
| RULE-007 | `suggestions.service.ts` | `generateSuggestion()`       |
| RULE-009 | `duplicates.service.ts`  | `detectDuplicates()`         |

### Frontend

| Règle    | Composant                  | Action                       |
| -------- | -------------------------- | ---------------------------- |
| RULE-007 | `SuggestionCard.tsx`       | Bouton "Valider" obligatoire |
| RULE-009 | `DuplicateAlert.tsx`       | Modal choix utilisateur      |
| RULE-015 | `SupervisionDashboard.tsx` | Badge alertes SLA            |

### Database

| Règle    | Table          | Contrainte                     |
| -------- | -------------- | ------------------------------ |
| RULE-001 | `IncomingFlow` | `NOT NULL` sur `rawContent`    |
| RULE-004 | `EventLog`     | Trigger `prevent_modification` |
| RULE-010 | `IncomingFlow` | Champ `primaryFlowId` (FK)     |

---

## ✅ CHECKLIST VALIDATION

Avant de considérer une fonctionnalité "terminée" :

- [ ] Toutes règles MUST (P0) implémentées
- [ ] Tests unitaires passent (règles critiques)
- [ ] Tests E2E passent (workflows)
- [ ] Revue de code avec focus sécurité
- [ ] Documentation API à jour
- [ ] Conformité RGPD vérifiée (si applicable)

---

## 🔗 RÉFÉRENCES

- **Spec produit** : [PRODUCT_SPEC.md](./PRODUCT_SPEC.md)
- **Mapping technique** : [FEATURE_MAPPING.md](./FEATURE_MAPPING.md)
- **Tests** : Voir dossiers `tests/` et `e2e/`

---

**Auteur** : Équipe Memo Lib
**Validation** : À définir
**Prochaine révision** : Après implémentation phase 1
