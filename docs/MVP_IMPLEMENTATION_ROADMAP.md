# 🎯 MVP IMPLEMENTATION ROADMAP

**IA Poste Manager — Moteur de Raisonnement**  
**Date:** 20 janvier 2026  
**Version:** 1.0 MVP

---

## ✅ ÉTAPES COMPLÉTÉES

### 1. Fondations Conceptuelles ✅

- [x] **Grammaire de raisonnement** définie (8 étapes obligatoires)
- [x] **Machine à états** formalisée (8 états MVP)
- [x] **Prompt système canonique** rédigé
- [x] **Schéma de données** complet documenté
- [x] **MVP strict** défini et figé

### 2. Schéma de Données Prisma ✅

**Ajouté au schema.prisma:**

- [x] `WorkspaceReasoning` - Modèle principal (état + métadonnées)
- [x] `ReasoningState` enum - 8 états MVP
- [x] `ReasoningTransition` - Journal audit trail (append-only)
- [x] Relations avec modèles existants (Tenant, Client, Dossier, Email)

**Champs par état MVP:**

| État                  | Champ Prisma            | Type      |
| --------------------- | ----------------------- | --------- |
| RECEIVED              | sourceRaw               | Text      |
| FACTS_EXTRACTED       | factsExtracted          | Text/JSON |
| CONTEXT_IDENTIFIED    | contextIdentified       | Text/JSON |
| OBLIGATIONS_DEDUCED   | obligationsDeduced      | Text/JSON |
| MISSING_IDENTIFIED ⭐  | missingIdentified       | Text/JSON |
| RISK_EVALUATED        | risksEvaluated          | Text/JSON |
| ACTION_PROPOSED       | actionProposed          | Text/JSON |
| READY_FOR_HUMAN       | completedAt             | DateTime  |

---

## 🔥 PROCHAINES ÉTAPES (Ordre d'implémentation)

### Phase 1: Infrastructure (1-2 jours)

#### 1.1 Migration Base de Données

```bash
# Générer migration
npx prisma migrate dev --name add_workspace_reasoning_mvp

# Générer client Prisma
npx prisma generate

# Vérifier
npx prisma studio
```

#### 1.2 Services de Base

**Créer:** `src/lib/reasoning/workspace-service.ts`

```typescript
// CRUD operations
- createWorkspace(sourceType, sourceId, sourceRaw, tenantId)
- getWorkspace(id)
- updateWorkspaceState(id, newState, data, triggeredBy)
- listWorkspaces(tenantId, filters)

// State machine enforcement
- canTransition(fromState, toState): boolean
- validateStateData(state, data): boolean
```

**Créer:** `src/lib/reasoning/transition-service.ts`

```typescript
// Audit trail (append-only)
- recordTransition(workspaceId, fromState, toState, reason, triggeredBy)
- getTransitionHistory(workspaceId)
- calculateHash(transition): string
```

**Créer:** `src/lib/reasoning/metrics-service.ts`

```typescript
// Calcul automatique
- calculateReasoningQuality(workspace): number
- calculateUncertaintyLevel(workspace): number
- isActionable(workspace): boolean (uncertaintyLevel <= 0.3)
```

---

### Phase 2: Moteur de Raisonnement (3-4 jours)

#### 2.1 Prompts IA Structurés

**Créer:** `src/lib/reasoning/prompts/`

```
prompts/
├── system-prompt.ts          # Prompt canonique (constitution)
├── extract-facts-prompt.ts   # État 1
├── identify-context-prompt.ts # État 2
├── deduce-obligations-prompt.ts # État 3
├── identify-missing-prompt.ts # État 4 ⭐ CŒUR
├── evaluate-risks-prompt.ts  # État 5
└── propose-action-prompt.ts  # État 6
```

**Structure type:**

```typescript
export const extractFactsPrompt = (sourceRaw: string) => ({
  system: CANONICAL_SYSTEM_PROMPT,
  user: `
SOURCE:
${sourceRaw}

TÂCHE:
Extraire UNIQUEMENT les faits certains.
Rejeter toute interprétation.

FORMAT DE SORTIE OBLIGATOIRE (JSON):
{
  "facts": [
    {
      "text": "...",
      "source": "quote exacte",
      "confidence": 1.0,
      "type": "date|person|document|reference"
    }
  ],
  "verifiable": {
    "dates": [],
    "phones": [],
    "emails": [],
    "references": []
  }
}
`,
});
```

#### 2.2 Orchestrateur de Raisonnement

**Créer:** `src/lib/reasoning/reasoning-engine.ts`

```typescript
export class ReasoningEngine {
  async processWorkspace(workspaceId: string) {
    const workspace = await getWorkspace(workspaceId);

    // Ordre strict des étapes
    const pipeline = [
      { state: "FACTS_EXTRACTED", fn: this.extractFacts },
      { state: "CONTEXT_IDENTIFIED", fn: this.identifyContext },
      { state: "OBLIGATIONS_DEDUCED", fn: this.deduceObligations },
      { state: "MISSING_IDENTIFIED", fn: this.identifyMissing }, // ⭐
      { state: "RISK_EVALUATED", fn: this.evaluateRisks },
      { state: "ACTION_PROPOSED", fn: this.proposeAction },
    ];

    for (const step of pipeline) {
      if (workspace.currentState === step.state) {
        await step.fn(workspace);
        break; // Une étape à la fois
      }
    }

    // Vérifier si actionnable
    if (workspace.uncertaintyLevel <= 0.3) {
      await updateWorkspaceState(
        workspaceId,
        "READY_FOR_HUMAN",
        {},
        "SYSTEM"
      );
    }
  }

  private async extractFacts(workspace: WorkspaceReasoning) {
    const prompt = extractFactsPrompt(workspace.sourceRaw);
    const result = await ollama.generateJSON(prompt);

    await updateWorkspaceState(workspace.id, "FACTS_EXTRACTED", {
      factsExtracted: JSON.stringify(result),
      factsExtractedBy: "AI",
      factsExtractedAt: new Date(),
    });
  }

  // ... autres méthodes pour chaque état
}
```

---

### Phase 3: API Routes (2 jours)

#### 3.1 Routes Workspace

**Créer:** `src/app/api/reasoning/workspace/route.ts`

```typescript
// POST /api/reasoning/workspace
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const { sourceType, sourceId, sourceRaw } = await request.json();

  const workspace = await createWorkspace({
    sourceType,
    sourceId,
    sourceRaw,
    tenantId: session.user.tenantId,
  });

  // Lancer le raisonnement de façon async
  reasoningEngine.processWorkspace(workspace.id);

  return NextResponse.json({ workspaceId: workspace.id });
}

// GET /api/reasoning/workspace/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const workspace = await getWorkspace(params.id);
  const transitions = await getTransitionHistory(params.id);

  return NextResponse.json({
    workspace,
    transitions,
    isActionable: workspace.uncertaintyLevel <= 0.3,
  });
}
```

**Créer:** `src/app/api/reasoning/workspace/[id]/validate/route.ts`

```typescript
// POST /api/reasoning/workspace/[id]/validate
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const { validationNote, corrections } = await request.json();

  await updateWorkspace(params.id, {
    validatedBy: session.user.id,
    validatedAt: new Date(),
    validationNote,
  });

  // Si corrections → mettre à jour les données
  if (corrections) {
    // ...
  }

  return NextResponse.json({ success: true });
}
```

---

### Phase 4: Interface MVP (3 jours)

#### 4.1 Page Liste Workspaces

**Créer:** `src/app/lawyer/reasoning/page.tsx`

```tsx
export default function ReasoningWorkspacesPage() {
  const { data: workspaces } = useSWR("/api/reasoning/workspace");

  return (
    <div>
      <h1>Espaces de Raisonnement</h1>

      {workspaces.map((ws) => (
        <WorkspaceCard
          key={ws.id}
          workspace={ws}
          badge={
            <StateBadge
              state={ws.currentState}
              uncertainty={ws.uncertaintyLevel}
            />
          }
        />
      ))}
    </div>
  );
}
```

#### 4.2 Page Détail Workspace

**Créer:** `src/app/lawyer/reasoning/[id]/page.tsx`

```tsx
export default function WorkspaceDetailPage({ params }) {
  const { data } = useSWR(`/api/reasoning/workspace/${params.id}`);

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Colonne gauche: Raisonnement structuré */}
      <div>
        <ReasoningSteps workspace={data.workspace} />
        <TransitionHistory transitions={data.transitions} />
      </div>

      {/* Colonne droite: Actions */}
      <div>
        <UncertaintyGauge level={data.workspace.uncertaintyLevel} />

        {data.workspace.currentState === "MISSING_IDENTIFIED" && (
          <MissingItemsPanel missing={data.workspace.missingIdentified} />
        )}

        {data.workspace.currentState === "ACTION_PROPOSED" && (
          <ActionPanel action={data.workspace.actionProposed} />
        )}

        {data.isActionable && (
          <div className="bg-green-50 p-4 rounded">
            ✅ Workspace actionnable (incertitude ≤ 30%)
            <button>Valider et agir</button>
          </div>
        )}
      </div>
    </div>
  );
}
```

#### 4.3 Composants de Visualisation

**Créer:** `src/components/reasoning/`

```
reasoning/
├── ReasoningSteps.tsx       # Affichage structuré des 8 étapes
├── StateBadge.tsx           # Badge coloré par état
├── UncertaintyGauge.tsx     # Jauge 0-100%
├── FactsDisplay.tsx         # Liste des faits certains
├── MissingItemsPanel.tsx    # Liste des manques ⭐
├── RisksDisplay.tsx         # Matrice de risques
├── ActionPanel.tsx          # Actions proposées
└── TransitionHistory.tsx    # Timeline audit trail
```

---

### Phase 5: Tests & Validation (2 jours)

#### 5.1 Tests Unitaires

**Créer:** `src/__tests__/reasoning/`

```typescript
describe("WorkspaceService", () => {
  it("crée un workspace en état RECEIVED", async () => {
    const ws = await createWorkspace({ ... });
    expect(ws.currentState).toBe("RECEIVED");
  });

  it("empêche les transitions illégales", async () => {
    await expect(
      updateWorkspaceState(ws.id, "ACTION_PROPOSED", {}, "AI")
    ).rejects.toThrow("Invalid state transition");
  });
});

describe("ReasoningEngine", () => {
  it("extrait les faits correctement", async () => {
    const ws = await processWorkspace(testWorkspace.id);
    expect(ws.factsExtracted).toBeDefined();
    expect(JSON.parse(ws.factsExtracted).facts).toHaveLength(3);
  });

  it("identifie les manques critiques", async () => {
    // Test du cœur du produit
    const ws = await processWorkspace(incompleteWorkspace.id);
    const missing = JSON.parse(ws.missingIdentified);
    expect(missing.filter((m) => m.critical)).toHaveLength(2);
  });
});
```

#### 5.2 Tests End-to-End

**Scénario 1:** Email incomplet → Workspace MISSING_IDENTIFIED

```typescript
test("Email incomplet génère liste de manques", async () => {
  const email = "Je veux renouveler mon titre de séjour";
  const ws = await createWorkspaceFromEmail(email);

  await waitFor(() => expect(ws.currentState).toBe("MISSING_IDENTIFIED"));

  const missing = JSON.parse(ws.missingIdentified);
  expect(missing).toContainEqual(
    expect.objectContaining({
      what: "Date expiration titre actuel",
      critical: true,
    })
  );
});
```

**Scénario 2:** Email complet → Workspace READY_FOR_HUMAN

```typescript
test("Email complet devient actionnable", async () => {
  const email = `
    Mon titre de séjour expire le 15/02/2026.
    Je suis salarié en CDI.
    Voici mon passeport et justificatif domicile.
  `;

  const ws = await createWorkspaceFromEmail(email);
  await waitFor(() => expect(ws.currentState).toBe("READY_FOR_HUMAN"));
  expect(ws.uncertaintyLevel).toBeLessThanOrEqual(0.3);
});
```

---

## 🎯 CRITÈRES DE SUCCÈS MVP

Le MVP est validé si:

1. ✅ **Un workspace passe par les 8 états dans l'ordre**
2. ✅ **Aucune transition illégale n'est possible**
3. ✅ **Les manques sont identifiés correctement** (taux > 80%)
4. ✅ **L'incertitude diminue à chaque étape**
5. ✅ **Un humain peut valider chaque étape**
6. ✅ **L'audit trail est complet et immuable**
7. ✅ **Une démo 5 minutes convainc un avocat**

---

## 📊 MÉTRIQUES À SUIVRE

| Métrique                     | Objectif MVP   |
| ---------------------------- | -------------- |
| Taux extraction faits        | > 90%          |
| Taux identification manques  | > 80%          |
| Précision risques            | > 70%          |
| Temps raisonnement complet   | < 30 secondes  |
| Incertitude moyenne finale   | < 0.3          |
| Taux validation humaine      | 100% (MVP)     |
| Transitions invalides        | 0              |
| Perte données audit trail    | 0              |

---

## 🚀 TIMELINE ESTIMÉE

| Phase                          | Durée      | Dépendances |
| ------------------------------ | ---------- | ----------- |
| 1. Infrastructure              | 1-2 jours  | -           |
| 2. Moteur de Raisonnement      | 3-4 jours  | Phase 1     |
| 3. API Routes                  | 2 jours    | Phase 2     |
| 4. Interface MVP               | 3 jours    | Phase 3     |
| 5. Tests & Validation          | 2 jours    | Phase 4     |
| **TOTAL MVP**                  | **11-13j** |             |

---

## 🔥 QUICK WINS IMMÉDIATS

Pour valider l'approche rapidement (1-2 jours):

1. ✅ Migration Prisma
2. ✅ Service création workspace basique
3. ✅ Prompt extraction faits + test Ollama
4. ✅ Page affichage d'un workspace
5. ✅ Démo live 1 email → raisonnement visible

**Objectif:** Montrer le raisonnement structuré en < 48h

---

## 🎯 PROCHAINE ACTION IMMÉDIATE

```bash
# 1. Lancer migration Prisma
npx prisma migrate dev --name add_workspace_reasoning_mvp

# 2. Générer client
npx prisma generate

# 3. Créer service basique
touch src/lib/reasoning/workspace-service.ts

# 4. Tester création workspace
npm run test src/__tests__/reasoning/workspace-service.test.ts
```

**Dis "GO" pour lancer la Phase 1 (Infrastructure).** 🚀
