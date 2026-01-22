# 🧠 SCHÉMA DE DONNÉES CANONIQUE — MVP STRICT

## IA POSTE MANAGER — Moteur de Raisonnement

> ⚠️ **Ce schéma est dicté par le raisonnement, pas par la technique.**  
> La base de données n'est qu'un **support de cognition**.

**Date:** 20 janvier 2026  
**Version:** 1.0.0  
**Status:** ✅ Implémenté dans Prisma

---

## 🎯 PHILOSOPHIE DU SCHÉMA

### Principe Fondamental

**Le schéma force le raisonnement rigoureux** en empêchant :
- ❌ Les suppositions non sourcées
- ❌ Les actions sans analyse des manques
- ❌ Les raccourcis IA dangereux
- ❌ Les décisions prématurées

### Forces du Schéma

✅ **Force le raisonnement** - Structure obligatoire  
✅ **Empêche les raccourcis** - Relations obligatoires  
✅ **Auditable** - Traçabilité complète  
✅ **Juridiquement défendable** - Justifications explicites  
✅ **Transmissible** - Documentation auto-générée  
✅ **Indépendant du métier** - Noyau universel  

---

## 🧩 ENTITÉ CENTRALE : `WorkspaceReasoning`

### Description

Représente **UNE situation à raisonner** (un email, un formulaire, un appel).

### Structure

```typescript
WorkspaceReasoning {
  id: UUID
  tenantId: UUID
  
  // ÉTAT (Machine à états stricte)
  currentState: String           // RECEIVED, FACTS_EXTRACTED, CONTEXT_IDENTIFIED, etc.
  stateChangedAt: DateTime
  stateChangedBy: String?        // userId ou "SYSTEM" ou "AI"
  
  // SOURCE
  sourceType: String             // EMAIL, FORM, PHONE, COURRIER, API
  sourceId: String?              // emailId, formSubmissionId, etc.
  sourceRaw: String              // Contenu brut original
  sourceMetadata: String?        // JSON minimal
  
  // MÉTADONNÉES MÉTIER
  procedureType: String?         // OQTF, Naturalisation, etc.
  ownerUserId: String            // Responsable du workspace
  
  // MÉTRIQUES
  reasoningQuality: Float?       // 0-1 (cohérence du raisonnement)
  uncertaintyLevel: Float        // 1.0 = max, 0.0 = actionnable
  confidenceScore: Float?        // Confiance IA globale
  
  // VERROUILLAGE
  locked: Boolean                // true = prêt pour humain, stop auto
  
  // VALIDATION HUMAINE
  validatedBy: String?
  validatedAt: DateTime?
  validationNote: String?
  
  // CYCLE DE VIE
  createdAt: DateTime
  updatedAt: DateTime
  completedAt: DateTime?         // Quand READY_FOR_HUMAN
  
  // RELATIONS MÉTIER (optionnelles)
  clientId: String?
  dossierId: String?
  emailId: String?
}
```

### États de la Machine (MVP)

```
RECEIVED              → Signal brut reçu
FACTS_EXTRACTED       → Faits certains isolés
CONTEXT_IDENTIFIED    → Cadre identifié
OBLIGATIONS_DEDUCED   → Ce qui est requis
MISSING_IDENTIFIED    → Ce qui manque ⭐ CŒUR
RISK_EVALUATED        → Risques évalués
ACTION_PROPOSED       → Action suggérée
READY_FOR_HUMAN       → Actionnable par humain
```

📌 **Un workspace = une trajectoire de raisonnement unique**

---

## 🧾 ENTITÉ : `Fact` (Fait Certain)

### Description

Un fait **certain, daté, sourcé**. Jamais d'inférence.

### Structure

```typescript
Fact {
  id: UUID
  workspaceId: UUID
  
  label: String              // "Date de notification"
  value: String              // "2026-01-15"
  
  source: String             // EXPLICIT_MESSAGE, METADATA, DOCUMENT, USER_PROVIDED
  sourceRef: String?         // Référence précise (ligne email, etc.)
  
  confidence: Float          // Toujours 1.0 (fait certain)
  
  extractedBy: String        // "AI" ou userId
  createdAt: DateTime
}
```

### Sources Valides

- `EXPLICIT_MESSAGE` - Directement dans le message source
- `METADATA` - Métadonnées (headers, timestamp, etc.)
- `DOCUMENT` - Extrait d'un document joint
- `USER_PROVIDED` - Fourni par utilisateur

### Règles

✅ **Aucun fait sans source explicite** (Règle #2)  
✅ **Confiance toujours = 1.0** (sinon ce n'est pas un fait)  
✅ **Horodatage automatique** (traçabilité)  

📌 **Un fait n'est jamais inféré - il est observé**

---

## 🌐 ENTITÉ : `ContextHypothesis` (Cadre Possible)

### Description

Un cadre possible, **pas une vérité absolue**. Plusieurs contextes peuvent coexister.

### Structure

```typescript
ContextHypothesis {
  id: UUID
  workspaceId: UUID
  
  type: String               // LEGAL, ADMINISTRATIVE, CONTRACTUAL, TEMPORAL, ORGANIZATIONAL
  description: String
  reasoning: String?         // Pourquoi ce contexte est envisagé
  
  certaintyLevel: String     // POSSIBLE, PROBABLE, CONFIRMED
  
  identifiedBy: String       // "AI" ou userId
  createdAt: DateTime
}
```

### Types de Contexte

- `LEGAL` - Contexte juridique (ex: OQTF)
- `ADMINISTRATIVE` - Contexte administratif (ex: Préfecture)
- `CONTRACTUAL` - Contexte contractuel
- `TEMPORAL` - Contexte temporel (délais)
- `ORGANIZATIONAL` - Contexte organisationnel

### Niveaux de Certitude

- `POSSIBLE` - Possible mais non confirmé
- `PROBABLE` - Probable selon indices
- `CONFIRMED` - Confirmé par faits convergents

📌 **Plusieurs contextes peuvent coexister jusqu'à confirmation**

---

## 📜 ENTITÉ : `Obligation` (Ce Qui Est Requis)

### Description

Ce qui est requis **si le contexte est valide**.

### Structure

```typescript
Obligation {
  id: UUID
  workspaceId: UUID
  contextId: UUID            // ⚠️ OBLIGATOIRE
  
  description: String
  mandatory: Boolean         // true par défaut
  
  deadline: DateTime?
  critical: Boolean          // Deadline critique
  
  legalRef: String?          // "Art. L511-1 CESEDA"
  
  deducedBy: String          // "AI" ou userId
  createdAt: DateTime
}
```

### Règles

✅ **Toute obligation DOIT pointer vers un contexte** (Règle #3)  
✅ **Pas d'obligation sans justification juridique**  
✅ **Deadlines critiques marquées explicitement**  

📌 **Une obligation découle toujours d'un contexte identifié**

---

## ❗ ENTITÉ CLÉ : `MissingElement` (Cœur du MVP)

### Description

Le **cœur de la valeur produit**. Identifie explicitement ce qui manque pour progresser.

### Structure

```typescript
MissingElement {
  id: UUID
  workspaceId: UUID
  
  type: String               // INFORMATION, DOCUMENT, DECISION, VALIDATION, HUMAN_EXPERTISE
  description: String
  why: String                // Pourquoi c'est manquant
  
  blocking: Boolean          // ⚠️ Bloque le passage à READY_FOR_HUMAN
  
  resolved: Boolean
  resolvedBy: String?
  resolvedAt: DateTime?
  resolution: String?        // Comment résolu
  
  identifiedBy: String       // "AI" ou userId
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Types de Manque

- `INFORMATION` - Information manquante (ex: date de naissance)
- `DOCUMENT` - Document manquant (ex: passeport)
- `DECISION` - Décision humaine à prendre
- `VALIDATION` - Validation humaine requise
- `HUMAN_EXPERTISE` - Expertise humaine nécessaire

### Règles CRITIQUES

❌ **Aucun passage à READY_FOR_HUMAN si `blocking = true` non résolu** (Règle #5)  
✅ **Résolution obligatoirement tracée** (qui, quand, comment)  
✅ **Horodatage de résolution automatique**  

📌 **Le système ne peut progresser qu'en comblant les manques**

---

## ⚠️ ENTITÉ : `Risk` (Risque d'Action Prématurée)

### Description

Conséquence potentielle d'une action entreprise sans avoir comblé les manques.

### Structure

```typescript
Risk {
  id: UUID
  workspaceId: UUID
  
  description: String
  
  impact: String             // LOW, MEDIUM, HIGH
  probability: String        // LOW, MEDIUM, HIGH
  
  irreversible: Boolean      // Risque irréversible
  riskScore: Int             // 1-9 (impact × probability)
  
  evaluatedBy: String        // "AI" ou userId
  createdAt: DateTime
}
```

### Calcul du Score

```
LOW = 1, MEDIUM = 2, HIGH = 3
riskScore = impact_value × probability_value

Exemple:
- HIGH impact (3) × HIGH probability (3) = 9 (critique)
- LOW impact (1) × MEDIUM probability (2) = 2 (acceptable)
```

### Règles

✅ **Risques irréversibles bloquent automatiquement**  
✅ **Score ≥ 6 nécessite validation humaine**  

📌 **Un risque naît toujours d'un manque identifié**

---

## 👉 ENTITÉ : `ProposedAction` (Action Réductrice d'Incertitude)

### Description

Action proposée pour **réduire l'incertitude** en comblant un manque.

### Structure

```typescript
ProposedAction {
  id: UUID
  workspaceId: UUID
  
  type: String               // QUESTION, DOCUMENT_REQUEST, ALERT, ESCALATION, FORM_SEND
  content: String
  reasoning: String          // Pourquoi cette action
  
  target: String             // CLIENT, INTERNAL_USER, SYSTEM
  priority: String           // LOW, NORMAL, HIGH, CRITICAL
  
  executed: Boolean
  executedBy: String?
  executedAt: DateTime?
  result: String?            // Résultat de l'exécution
  
  proposedBy: String         // "AI" ou userId
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Types d'Action

- `QUESTION` - Poser une question au client
- `DOCUMENT_REQUEST` - Demander un document
- `ALERT` - Alerte/notification
- `ESCALATION` - Escalade vers humain
- `FORM_SEND` - Envoyer un formulaire de collecte

### Cibles d'Action

- `CLIENT` - Client final
- `INTERNAL_USER` - Utilisateur interne (avocat)
- `SYSTEM` - Système (automation)

### Règles

✅ **Une action n'est valide que si elle réduit au moins un manque** (Règle #4)  
✅ **Exécution tracée obligatoirement**  
✅ **Résultat documenté systématiquement**  

📌 **Action = Réduction mesurable de l'incertitude**

---

## 🧠 ENTITÉ : `ReasoningTrace` (Audit Trail)

### Description

Trace **immutable** du raisonnement pour audit, confiance et défense juridique.

### Structure

```typescript
ReasoningTrace {
  id: UUID
  workspaceId: UUID
  
  step: String               // "FACTS_EXTRACTED → CONTEXT_IDENTIFIED"
  explanation: String        // Explication de la transition
  
  metadata: String?          // JSON: données contextuelles
  
  createdBy: String          // "AI" ou userId
  createdAt: DateTime
}
```

### Utilité

✅ **Audit trail complet**  
✅ **Défense juridique** (pourquoi telle décision)  
✅ **Amélioration continue IA** (analyse des patterns)  
✅ **Transparence client**  

📌 **Chaque étape du raisonnement est documentée**

---

## 🔐 RÈGLES STRUCTURELLES (IMPÉRATIVES)

Ces règles sont **forcées par la structure DB** et **validées par l'applicatif**.

### 1️⃣ Aucune Donnée Sans Workspace

❌ **Interdit** : Fact, Context, Obligation, etc. orphelins  
✅ **Forcé par** : Foreign Key `workspaceId` + `onDelete: Cascade`

### 2️⃣ Aucun Fait Sans Source

❌ **Interdit** : `Fact.source = null`  
✅ **Forcé par** : Champ `source` **non nullable**  

### 3️⃣ Aucune Obligation Sans Contexte

❌ **Interdit** : `Obligation.contextId = null`  
✅ **Forcé par** : Foreign Key `contextId` + `onDelete: Cascade`

### 4️⃣ Aucune Action Sans Manque Associé

❌ **Interdit** : Action sans MissingElement correspondant  
✅ **Validé par** : Logique applicative (pas de contrainte DB directe)

### 5️⃣ Aucun READY_FOR_HUMAN Si Manque Bloquant

❌ **Interdit** : `currentState = READY_FOR_HUMAN` avec `MissingElement.blocking = true` non résolu  
✅ **Validé par** : Fonction de transition d'état

---

## 🔄 WORKFLOW DE TRANSITION D'ÉTAT

### Machine à États

```
RECEIVED
  ↓ extract_facts()
FACTS_EXTRACTED
  ↓ identify_context()
CONTEXT_IDENTIFIED
  ↓ deduce_obligations()
OBLIGATIONS_DEDUCED
  ↓ identify_missing()
MISSING_IDENTIFIED ⭐
  ↓ evaluate_risks()
RISK_EVALUATED
  ↓ propose_action()
ACTION_PROPOSED
  ↓ validate_readiness()
READY_FOR_HUMAN
```

### Fonction de Validation Critique

```typescript
async function canTransitionToReadyForHuman(workspaceId: string): Promise<boolean> {
  // Règle #5 : Aucun manque bloquant non résolu
  const blockingMissing = await prisma.missingElement.count({
    where: {
      workspaceId,
      blocking: true,
      resolved: false
    }
  });
  
  return blockingMissing === 0;
}
```

---

## 📊 EXEMPLE CONCRET (CESEDA - OQTF)

### Situation Initiale

**Email reçu :**
> "Bonjour, je viens de recevoir une OQTF. Que faire ?"

### Déroulé du Raisonnement

#### 1. RECEIVED

```typescript
WorkspaceReasoning.create({
  sourceType: "EMAIL",
  sourceRaw: "Bonjour, je viens de recevoir une OQTF. Que faire ?",
  currentState: "RECEIVED"
})
```

#### 2. FACTS_EXTRACTED

```typescript
Fact.create([
  { label: "Document reçu", value: "OQTF", source: "EXPLICIT_MESSAGE" },
  { label: "Date réception email", value: "2026-01-20", source: "METADATA" }
])
```

#### 3. CONTEXT_IDENTIFIED

```typescript
ContextHypothesis.create({
  type: "LEGAL",
  description: "Procédure OQTF - Obligation de Quitter le Territoire Français",
  certaintyLevel: "PROBABLE" // Pas confirmé tant qu'on n'a pas vu le document
})
```

#### 4. OBLIGATIONS_DEDUCED

```typescript
Obligation.create({
  contextId: context.id,
  description: "Recours contentieux à déposer",
  deadline: "2026-02-05", // 15 jours estimés
  critical: true,
  legalRef: "Art. L512-1 CESEDA"
})
```

#### 5. MISSING_IDENTIFIED ⭐

```typescript
MissingElement.create([
  {
    type: "DOCUMENT",
    description: "Copie de l'OQTF reçue",
    why: "Impossible de confirmer le type exact et calculer le délai précis",
    blocking: true
  },
  {
    type: "INFORMATION",
    description: "Date de notification officielle",
    why: "Délai de recours court à partir de la notification",
    blocking: true
  },
  {
    type: "INFORMATION",
    description: "Situation administrative actuelle",
    why: "Nécessaire pour déterminer les arguments juridiques",
    blocking: false
  }
])
```

#### 6. RISK_EVALUATED

```typescript
Risk.create({
  description: "Dépassement du délai de recours contentieux",
  impact: "HIGH",
  probability: "MEDIUM",
  irreversible: true, // Si délai dépassé, recours irrecevable
  riskScore: 6 // HIGH × MEDIUM = 3 × 2 = 6
})
```

#### 7. ACTION_PROPOSED

```typescript
ProposedAction.create({
  type: "DOCUMENT_REQUEST",
  content: "Demande urgente de copie OQTF au client",
  reasoning: "Document nécessaire pour calculer délai exact et préparer recours",
  target: "CLIENT",
  priority: "CRITICAL"
})
```

#### 8. BLOCAGE AVANT READY_FOR_HUMAN

```typescript
// canTransitionToReadyForHuman() = FALSE
// Raison : 2 MissingElement.blocking = true non résolus

WorkspaceReasoning.locked = false // Pas encore prêt
```

#### 9. RÉSOLUTION DES MANQUES

**Client envoie l'OQTF + date de notification**

```typescript
MissingElement.update({
  where: { id: missing1.id },
  data: {
    resolved: true,
    resolvedBy: "client-email-response",
    resolvedAt: new Date(),
    resolution: "Document OQTF reçu par email, date notification: 2026-01-18"
  }
})

// Mise à jour du Fact
Fact.create({
  label: "Date notification OQTF",
  value: "2026-01-18",
  source: "DOCUMENT"
})
```

#### 🎯 READY_FOR_HUMAN

```typescript
// canTransitionToReadyForHuman() = TRUE
// Tous les bloquants résolus

WorkspaceReasoning.update({
  currentState: "READY_FOR_HUMAN",
  locked: true,
  completedAt: new Date(),
  uncertaintyLevel: 0.15 // Très faible
})

// L'avocat peut maintenant agir en toute connaissance de cause
```

---

## 🎯 POURQUOI CE SCHÉMA EST PUISSANT

### 1. Force le Raisonnement

La structure **oblige** à passer par toutes les étapes :
- ✅ Pas de contexte sans faits
- ✅ Pas d'obligations sans contexte
- ✅ Pas d'actions sans analyse des manques
- ✅ Pas de "ready" si bloquants non résolus

### 2. Empêche les Raccourcis IA

L'IA **ne peut pas** :
- ❌ Supposer un fait (source obligatoire)
- ❌ Créer une obligation sans contexte
- ❌ Proposer une action sans manque identifié
- ❌ Marquer "prêt" sans résoudre les bloquants

### 3. Auditable & Défendable

**Chaque décision est justifiée** :
- 📝 Faits sourcés
- 📝 Contextes raisonnés
- 📝 Obligations référencées légalement
- 📝 Actions tracées
- 📝 Transitions horodatées

### 4. Transmissible

Un développeur **peut comprendre le système sans documentation** :
- 🔍 Le schéma **est** la documentation
- 🔍 Les relations forcent la logique
- 🔍 Les commentaires explicitent les règles

### 5. Indépendant du Métier

Le **noyau est universel** :
- ✅ Avocat CESEDA
- ✅ Médecin diagnostic
- ✅ Banquier évaluation risque crédit
- ✅ Support technique troubleshooting

👉 **On ajoute des métiers sans changer le cœur**

---

## 📈 ÉVOLUTIONS FUTURES

### Phase 2 : Graphe de Raisonnement

```typescript
ReasoningEdge {
  fromFactId → toContextId
  fromContextId → toObligationId
  fromMissingId → toActionId
}
```

### Phase 3 : ML sur Patterns

```typescript
ReasoningPattern {
  inputSignature: String
  successfulPath: String
  avgConfidence: Float
  usageCount: Int
}
```

### Phase 4 : Multi-Workspaces

```typescript
WorkspaceLink {
  sourceWorkspaceId
  targetWorkspaceId
  relationType: "SIMILAR" | "PRECEDENT" | "RELATED"
}
```

---

## 🚀 IMPLÉMENTATION PRISMA

### Migration Créée

✅ Schema Prisma validé (SQLite compatible)  
✅ Relations avec cascade  
✅ Indexes de performance  
✅ Contraintes de validation  

### Prochaines Étapes

1. **Générer le client Prisma**
   ```bash
   npx prisma generate
   ```

2. **Appliquer la migration**
   ```bash
   npx prisma db push
   ```

3. **Créer les services TypeScript**
   - `WorkspaceReasoningService`
   - `FactService`
   - `MissingElementService`
   - etc.

4. **Implémenter la machine à états**
   - Fonction de transition
   - Validations de règles
   - Hooks de progression

---

## 📚 RESSOURCES

- [Prisma Schema](../prisma/schema.prisma)
- [Types TypeScript](../src/types/workspace-reasoning.ts) *(à créer)*
- [Services](../src/lib/workspace-reasoning/) *(à créer)*
- [Tests](../src/__tests__/workspace-reasoning/) *(à créer)*

---

**Ce schéma est maintenant le socle technique du moteur de raisonnement IA Poste Manager.** 🎉

Chaque entité, chaque relation, chaque règle a été pensée pour **forcer la rigueur** et **empêcher les dérives**.

👉 **Prêt pour la phase d'implémentation des services et de l'UX.**

