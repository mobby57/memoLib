# 🧠 WORKSPACE REASONING ENGINE — SCHÉMA DE DONNÉES CANONIQUE

**Date:** 20 janvier 2026  
**Version:** 1.0.0 (Constitution)

> Ce schéma est la **matérialisation technique** de la grammaire de raisonnement IA Poste Manager.
> Il traduit les 9 états de la machine à états en structure de données persistable et auditable.

---

## 📌 PRINCIPE FONDAMENTAL

> **Chaque Workspace est un journal de raisonnement.**
> 
> Rien n'est écrasé, tout est versionné, chaque transition est tracée.

---

# 🧩 MODÈLE PRINCIPAL : `WorkspaceReasoning`

Le cœur du système. Un espace cognitif isolé où le raisonnement s'applique.

```prisma
model WorkspaceReasoning {
  id        String   @id @default(uuid())
  tenantId  String   // Isolation multi-tenant
  
  // ============================================
  // ÉTAT COURANT (Machine à états)
  // ============================================
  currentState   WorkspaceState   @default(RECEIVED)
  stateChangedAt DateTime         @default(now())
  stateChangedBy String?          // userId ou "SYSTEM"
  
  // ============================================
  // MÉTADONNÉES SOURCES
  // ============================================
  sourceType     String           // EMAIL, FORM, PHONE, COURRIER
  sourceId       String?          // emailId, formSubmissionId, etc.
  sourceMetadata Json?            // {from, subject, receivedAt, channel, etc.}
  
  // ============================================
  // CONTENU DU RAISONNEMENT (par étape)
  // ============================================
  // État 1: FACTS_EXTRACTED
  facts          WorkspaceFacts?
  
  // État 2: CONTEXT_IDENTIFIED
  context        WorkspaceContext?
  
  // État 3: OBLIGATIONS_DEDUCED
  obligations    WorkspaceObligations?
  
  // État 4: MISSING_IDENTIFIED (CŒUR)
  missing        WorkspaceMissing?
  
  // État 5: RISK_EVALUATED
  risks          WorkspaceRisks?
  
  // État 6: ACTION_PROPOSED
  proposedAction WorkspaceAction?
  
  // État 7: WAITING_INPUT
  waitingFor     WorkspaceWaiting?
  
  // ============================================
  // GESTION DES TRANSITIONS
  // ============================================
  transitions    WorkspaceTransition[]
  
  // ============================================
  // MÉTRIQUES DE RAISONNEMENT
  // ============================================
  reasoningQuality  Float?        // Score 0-1 (cohérence du raisonnement)
  uncertaintyLevel  Float         @default(1.0) // 1.0 = max incertitude, 0.0 = actionable
  confidenceScore   Float?        // Confiance IA dans son analyse
  
  // ============================================
  // RELATIONS MÉTIER
  // ============================================
  clientId       String?
  client         Client?          @relation(fields: [clientId], references: [id])
  
  dossierId      String?          // Si workspace → dossier
  dossier        Dossier?         @relation(fields: [dossierId], references: [id])
  
  // ============================================
  // VALIDATION HUMAINE
  // ============================================
  validatedBy    String?          // userId
  validatedAt    DateTime?
  validationNote String?          // Pourquoi validé/rejeté
  
  // ============================================
  // CYCLE DE VIE
  // ============================================
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
  completedAt    DateTime?        // Quand READY_FOR_HUMAN
  archivedAt     DateTime?
  
  @@index([tenantId, currentState])
  @@index([tenantId, uncertaintyLevel])
  @@index([currentState, createdAt])
  @@index([clientId])
}

// ============================================
// ENUM : ÉTATS DE LA MACHINE
// ============================================
enum WorkspaceState {
  RECEIVED              // 0 - Signal brut reçu
  FACTS_EXTRACTED       // 1 - Faits certains isolés
  CONTEXT_IDENTIFIED    // 2 - Cadre identifié
  OBLIGATIONS_DEDUCED   // 3 - Ce qui est requis
  MISSING_IDENTIFIED    // 4 - Ce qui manque ⭐
  RISK_EVALUATED        // 5 - Risques évalués
  ACTION_PROPOSED       // 6 - Action suggérée
  WAITING_INPUT         // 7 - En attente réponse
  REASSESSMENT          // 8 - Réévaluation avec nouveaux éléments
  READY_FOR_HUMAN       // 9 - Actionnable par humain
  BLOCKED               // État de blocage volontaire
  ARCHIVED              // Terminé/abandonné
}
```

---

# 📊 MODÈLES DE CONTENU (par étape de raisonnement)

## 1️⃣ `WorkspaceFacts` — Les certitudes

```prisma
model WorkspaceFacts {
  id              String              @id @default(uuid())
  workspaceId     String              @unique
  workspace       WorkspaceReasoning  @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  // Liste des faits certains (JSON array)
  factsList       Json                // [{text: "...", source: "...", extractedAt: "...", confidence: 1.0}]
  
  // Citations exactes du message source
  exactQuotes     Json?               // [{quote: "...", position: 0}]
  
  // Éléments vérifiables objectivement
  verifiableData  Json?               // {dates: [], phones: [], emails: [], references: []}
  
  // Métadonnées extraction
  extractedBy     String              // "AI" ou userId
  extractedAt     DateTime            @default(now())
  extractionModel String?             // "llama3.2:3b", "gpt-4", etc.
  
  // Validation humaine
  validatedBy     String?
  validatedAt     DateTime?
  correctionsMade Json?               // Si l'humain a corrigé des faits
  
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
}
```

---

## 2️⃣ `WorkspaceContext` — Le cadre

```prisma
model WorkspaceContext {
  id              String              @id @default(uuid())
  workspaceId     String              @unique
  workspace       WorkspaceReasoning  @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  // Cadres identifiés (plusieurs possibles)
  identifiedFrames Json               // [{type: "legal", subtype: "CESEDA", confidence: 0.85, reasoning: "..."}]
  
  // Type de procédure (si applicable)
  procedureType   String?             // "OQTF", "Naturalisation", "Titre séjour", etc.
  
  // Contraintes connues
  constraints     Json?               // {temporal: [], legal: [], administrative: [], organizational: []}
  
  // Références légales/réglementaires
  legalReferences Json?               // [{article: "L313-11 CESEDA", applicable: true, source: "..."}]
  
  // Parties prenantes identifiées
  stakeholders    Json?               // [{role: "client", identified: true}, {role: "préfecture", identified: false}]
  
  // Métadonnées
  identifiedBy    String
  identifiedAt    DateTime            @default(now())
  
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
}
```

---

## 3️⃣ `WorkspaceObligations` — Ce qui est requis

```prisma
model WorkspaceObligations {
  id              String              @id @default(uuid())
  workspaceId     String              @unique
  workspace       WorkspaceReasoning  @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  // Obligations explicites (issues des faits)
  explicitOnes    Json                // [{obligation: "...", source: "fact_id", priority: "high"}]
  
  // Obligations implicites (issues du cadre)
  implicitOnes    Json                // [{obligation: "...", derivedFrom: "context_id", reasoning: "..."}]
  
  // Obligations légales/réglementaires
  legalOnes       Json?               // [{obligation: "...", legalBasis: "Art. L313-11", mandatory: true}]
  
  // Délais associés
  deadlines       Json?               // [{obligation: "...", deadline: "2026-02-15", critical: true}]
  
  // Métadonnées
  deducedBy       String
  deducedAt       DateTime            @default(now())
  
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
}
```

---

## 4️⃣ `WorkspaceMissing` — Les manques ⭐ (CŒUR)

```prisma
model WorkspaceMissing {
  id              String              @id @default(uuid())
  workspaceId     String              @unique
  workspace       WorkspaceReasoning  @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  // Manques informationnels
  informationGaps Json                // [{what: "Date de naissance", why: "Requis pour vérif nationalité", critical: true}]
  
  // Documents manquants
  documentGaps    Json                // [{document: "Passeport", requiredBy: "Art. X", blocking: true}]
  
  // Décisions non prises
  decisionGaps    Json?               // [{decision: "Choix recours gracieux/contentieux", decidedBy: "client"}]
  
  // Validations nécessaires
  validationGaps  Json?               // [{validation: "Accord client", requiredFor: "Envoi courrier", blocking: true}]
  
  // Intervenants manquants
  humanGaps       Json?               // [{role: "Avocat spécialisé", needed: true, urgency: "high"}]
  
  // Métadonnées
  identifiedBy    String
  identifiedAt    DateTime            @default(now())
  
  // Résolution des manques
  resolved        Json                @default("[]") // [{gap_id: "...", resolvedAt: "...", resolvedBy: "..."}]
  
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
}
```

---

## 5️⃣ `WorkspaceRisks` — Évaluation des risques

```prisma
model WorkspaceRisks {
  id              String              @id @default(uuid())
  workspaceId     String              @unique
  workspace       WorkspaceReasoning  @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  // Risques juridiques
  legalRisks      Json                // [{risk: "...", impact: "high", probability: 0.7, irreversible: true}]
  
  // Risques opérationnels
  operationalRisks Json?              // [{risk: "Délai raté", impact: "critical", mitigation: "..."}]
  
  // Risques temporels
  temporalRisks   Json?               // [{risk: "Expiration titre", deadline: "...", daysRemaining: 15}]
  
  // Risques humains (erreur, oubli)
  humanRisks      Json?               // [{risk: "Document oublié", frequency: "common", prevention: "..."}]
  
  // Score de risque global
  overallRiskScore Float              // 0-100 (pondéré)
  
  // Risques bloquants
  blockingRisks   Json?               // [{risk: "...", mustResolve: true}]
  
  // Métadonnées
  evaluatedBy     String
  evaluatedAt     DateTime            @default(now())
  
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
}
```

---

## 6️⃣ `WorkspaceAction` — Action proposée

```prisma
model WorkspaceAction {
  id              String              @id @default(uuid())
  workspaceId     String              @unique
  workspace       WorkspaceReasoning  @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  // Type d'action
  actionType      ActionType
  
  // Contenu de l'action
  actionContent   Json                // Structure dépend du type
  
  // Destinataire
  targetRole      String              // "client", "avocat", "admin", "system"
  targetId        String?             // userId ou clientId
  
  // Justification
  reasoning       String              // Pourquoi cette action réduit l'incertitude
  
  // Réduction d'incertitude attendue
  uncertaintyReduction Float?         // -0.3 = réduit de 30%
  
  // Priorité
  priority        ActionPriority      @default(NORMAL)
  
  // Délai suggéré
  suggestedDeadline DateTime?
  
  // Métadonnées
  proposedBy      String
  proposedAt      DateTime            @default(now())
  
  // Exécution
  executedBy      String?
  executedAt      DateTime?
  executionResult Json?               // Résultat de l'action
  
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
}

enum ActionType {
  ASK_QUESTION          // Poser une question ciblée
  REQUEST_DOCUMENT      // Demander un document
  ALERT_HUMAN           // Alerter un humain
  CLARIFY               // Demander clarification
  ESCALATE              // Escalader à niveau supérieur
  WAIT_DEADLINE         // Attendre une échéance
}

enum ActionPriority {
  LOW
  NORMAL
  HIGH
  CRITICAL
}
```

---

## 7️⃣ `WorkspaceWaiting` — En attente

```prisma
model WorkspaceWaiting {
  id              String              @id @default(uuid())
  workspaceId     String              @unique
  workspace       WorkspaceReasoning  @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  // Ce qu'on attend
  waitingFor      String              // Description claire
  
  // De qui
  waitingFrom     String              // "client", "avocat", "préfecture", "system"
  waitingFromId   String?             // userId ou entityId
  
  // Délai
  expectedBy      DateTime?           // Deadline implicite ou explicite
  
  // Action envoyée
  actionSent      Json?               // Référence à l'action envoyée
  sentAt          DateTime?
  
  // Rappels
  reminders       Json                @default("[]") // [{sentAt: "...", attempt: 1}]
  maxReminders    Int                 @default(3)
  
  // Reçu
  received        Boolean             @default(false)
  receivedAt      DateTime?
  receivedContent Json?
  
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
}
```

---

# 🔄 MODÈLE DE TRAÇABILITÉ : `WorkspaceTransition`

Journalisation de chaque changement d'état (append-only, immuable)

```prisma
model WorkspaceTransition {
  id              String              @id @default(uuid())
  workspaceId     String
  workspace       WorkspaceReasoning  @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  // Transition
  fromState       WorkspaceState
  toState         WorkspaceState
  
  // Déclencheur
  triggeredBy     String              // userId ou "SYSTEM" ou "AI"
  triggeredAt     DateTime            @default(now())
  
  // Justification
  reason          String              // Pourquoi cette transition
  
  // Métadonnées
  metadata        Json?               // Contexte additionnel
  
  // Validation
  autoApproved    Boolean             @default(false)
  validatedBy     String?
  validatedAt     DateTime?
  
  // Données avant/après (snapshot)
  stateBefore     Json?               // État complet avant transition
  stateAfter      Json?               // État complet après transition
  
  // Hash d'intégrité
  hash            String?             // SHA-256 pour audit trail
  
  createdAt       DateTime            @default(now())
  
  @@index([workspaceId, triggeredAt])
  @@index([fromState, toState])
}
```

---

# 📐 RÈGLES DE GESTION DU SCHÉMA

## 1️⃣ Immutabilité des Transitions

✅ **Obligatoire:**
- Aucun `UPDATE` sur `WorkspaceTransition`
- Aucun `DELETE` sur `WorkspaceTransition`
- Append-only (journal inaltérable)

## 2️⃣ Versioning du Raisonnement

✅ **Obligatoire:**
- Chaque modification d'un sous-modèle (Facts, Context, etc.) crée une nouvelle version
- L'ancien contenu est conservé dans `WorkspaceTransition.stateBefore`

## 3️⃣ Contraintes de Cohérence

✅ **Interdictions:**
- Impossible de passer de `RECEIVED` à `ACTION_PROPOSED` directement
- Impossible d'être `READY_FOR_HUMAN` avec `uncertaintyLevel > 0.3`
- Impossible d'avoir `proposedAction` si `currentState != ACTION_PROPOSED`

## 4️⃣ Isolation Tenant

✅ **Obligatoire:**
- Tous les workspaces filtrent par `tenantId`
- Aucune fuite cross-tenant possible

---

# 🧪 MÉTRIQUES & OBSERVABILITÉ

## Score de Qualité du Raisonnement

Calculé automatiquement à chaque transition:

```typescript
reasoningQuality = (
  factsConfidence * 0.2 +
  contextConfidence * 0.15 +
  obligationsCompleteness * 0.2 +
  missingIdentificationAccuracy * 0.25 + // POIDS MAXIMUM
  riskEvaluationQuality * 0.15 +
  actionRelevance * 0.05
)
```

## Niveau d'Incertitude

Diminue à mesure que le raisonnement avance:

```typescript
uncertaintyLevel = (
  1.0 - (
    factsCertainty * 0.3 +
    contextCertainty * 0.2 +
    missingResolution * 0.4 + // POIDS MAXIMUM
    riskCoverage * 0.1
  )
)
```

**Seuil actionnable:** `uncertaintyLevel <= 0.3`

---

# 🎯 AVANTAGES DE CE SCHÉMA

## ✅ Technique

- **Traçabilité totale** (audit trail complet)
- **Versioning natif** (aucune perte d'information)
- **Performance** (index optimisés)
- **Scalabilité** (isolation tenant)

## ✅ Métier

- **Explicabilité** (chaque étape documentée)
- **Défense juridique** (journal inaltérable)
- **Transmission équipe** (raisonnement visible)
- **Amélioration continue** (métriques fiables)

## ✅ Produit

- **Indépendance IA** (structure agnostique du modèle)
- **Evolutivité** (ajout de champs sans migration lourde grâce à Json)
- **Testabilité** (états et transitions unitairement testables)
- **Vendabilité** (transparence totale du raisonnement)

---

# 🔥 IMPLÉMENTATION PRIORITAIRE

## Phase 1 (MVP)

1. ✅ `WorkspaceReasoning` (modèle principal)
2. ✅ `WorkspaceFacts`
3. ✅ `WorkspaceMissing` (CŒUR)
4. ✅ `WorkspaceAction`
5. ✅ `WorkspaceTransition`

## Phase 2 (Raisonnement complet)

6. ✅ `WorkspaceContext`
7. ✅ `WorkspaceObligations`
8. ✅ `WorkspaceRisks`

## Phase 3 (Workflow avancé)

9. ✅ `WorkspaceWaiting`

---

# 📊 EXEMPLE CONCRET DE WORKFLOW

```
1. Email arrive → WorkspaceReasoning créé (state: RECEIVED)
   └─ sourceType: "EMAIL", sourceId: "email_123"

2. IA extrait faits → WorkspaceFacts créé
   └─ factsList: [{text: "Titre de séjour expire le 15/02/2026", confidence: 1.0}]
   └─ Transition: RECEIVED → FACTS_EXTRACTED

3. IA identifie contexte → WorkspaceContext créé
   └─ identifiedFrames: [{type: "legal", subtype: "CESEDA", confidence: 0.9}]
   └─ Transition: FACTS_EXTRACTED → CONTEXT_IDENTIFIED

4. IA déduit obligations → WorkspaceObligations créé
   └─ explicitOnes: [{obligation: "Renouveler avant expiration"}]
   └─ Transition: CONTEXT_IDENTIFIED → OBLIGATIONS_DEDUCED

5. IA identifie manques → WorkspaceMissing créé
   └─ documentGaps: [{document: "Justificatif domicile", critical: true}]
   └─ uncertaintyLevel: 0.6 (trop élevé)
   └─ Transition: OBLIGATIONS_DEDUCED → MISSING_IDENTIFIED

6. IA évalue risques → WorkspaceRisks créé
   └─ temporalRisks: [{risk: "Expiration titre", daysRemaining: 25}]
   └─ Transition: MISSING_IDENTIFIED → RISK_EVALUATED

7. IA propose action → WorkspaceAction créé
   └─ actionType: REQUEST_DOCUMENT
   └─ actionContent: {document: "Justificatif domicile de moins de 3 mois"}
   └─ Transition: RISK_EVALUATED → ACTION_PROPOSED

8. Humain valide et envoie → WorkspaceWaiting créé
   └─ waitingFor: "Justificatif domicile"
   └─ waitingFrom: "client_456"
   └─ Transition: ACTION_PROPOSED → WAITING_INPUT

9. Client répond avec document → WorkspaceMissing.resolved mis à jour
   └─ uncertaintyLevel: 0.2 (actionnable!)
   └─ Transition: WAITING_INPUT → REASSESSMENT → READY_FOR_HUMAN

10. Avocat prend la main → workspace.completedAt
```

---

**Ce schéma est maintenant la CONSTITUTION TECHNIQUE du projet.**

Prochaine étape logique:

1. **Implémenter dans Prisma** (migration)
2. **Coder les services de transition** (state machine)
3. **Créer les prompts IA** qui remplissent ces structures
4. **Définir le MVP** (états minimum requis)

Dis-moi **1, 2, 3 ou 4**.
