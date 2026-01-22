# 🤖 SYSTÈME D'EXTRACTION IA AUTOMATIQUE

## Vue d'ensemble

Le système d'extraction IA automatique permet de transformer un email brut (état `RECEIVED`) en un dossier juridique structuré avec **Facts**, **Contexts** et **Obligations** extraits automatiquement.

### Technologies utilisées

- **Ollama** (local) : `llama3.2:3b`
- **Prompts spécialisés CESEDA** : Droit des étrangers français
- **Validation automatique** : Scoring de confiance par entité
- **Transition automatique** : `RECEIVED` → `FACTS_EXTRACTED` ou `CONTEXT_IDENTIFIED`

---

## Architecture

### 1. Service d'extraction (`workspace-extraction-service.ts`)

```typescript
// Localisation: src/lib/ai/workspace-extraction-service.ts

export class WorkspaceExtractionService {
  async extractFromWorkspace(workspace: WorkspaceReasoning): Promise<ExtractionResult>
  async isAvailable(): Promise<boolean>
  validateExtraction(result: ExtractionResult): { valid: boolean; warnings: string[] }
}
```

**Fonctionnalités clés:**
- ✅ Extraction structurée avec Ollama (llama3.2:3b)
- ✅ Prompts CESEDA spécialisés (OQTF, Naturalisation, Asile, Titre séjour)
- ✅ Fallback automatique si Ollama indisponible
- ✅ Scoring de confiance global (0-1)
- ✅ Validation avec avertissements

### 2. Endpoint API (`/api/workspace-reasoning/[id]/extract`)

```http
POST /api/workspace-reasoning/{workspaceId}/extract
Content-Type: application/json

{
  "autoTransition": true  // Optionnel, true par défaut
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "extraction": {
    "factsCreated": 3,
    "contextsCreated": 1,
    "obligationsCreated": 1,
    "confidence": 0.88,
    "processingTime": 111666,
    "model": "llama3.2:3b"
  },
  "validation": {
    "valid": true,
    "warnings": []
  },
  "workspace": {
    "id": "...",
    "previousState": "RECEIVED",
    "currentState": "CONTEXT_IDENTIFIED",
    "transitioned": true
  },
  "entities": {
    "facts": [...],
    "contexts": [...],
    "obligations": [...]
  },
  "timestamp": "2026-01-21T..."
}
```

**Erreurs possibles:**
- `401` : Non authentifié
- `403` : Accès refusé (tenant isolation)
- `404` : Workspace non trouvé
- `400` : État invalide (doit être `RECEIVED`) ou workspace verrouillé
- `500` : Échec extraction IA

### 3. Interface utilisateur (ReceivedStateView)

**Bouton d'extraction IA:**
```typescript
// Composant: ReceivedStateView.tsx

<button onClick={handleAIExtraction} disabled={isExtracting}>
  {isExtracting ? '🤖 Extraction IA en cours...' : '🤖 Extraire avec IA'}
</button>
```

**États UI:**
- ⏳ **Chargement** : Spinner + "Extraction IA en cours..."
- ✅ **Succès** : Affichage résumé (faits/contextes/obligations + confiance)
- ❌ **Erreur** : Message d'erreur + suggestion analyse manuelle
- ⚠️ **Avertissements** : Liste des warnings de validation

---

## Prompts CESEDA spécialisés

### Prompt Système

```
Tu es un assistant juridique spécialisé en droit des étrangers (CESEDA) pour avocats français.

RÈGLES STRICTES:
1. Extrais UNIQUEMENT des faits certains (dates, noms, lieux explicites)
2. Propose des contextes juridiques POSSIBLES (pas de certitude absolue)
3. Identifie les obligations légales selon le type de procédure
4. Fournis un score de confiance (0-1) pour chaque élément extrait
5. Réponds UNIQUEMENT en JSON valide (pas de texte avant/après)

TYPES DE PROCÉDURES CESEDA:
- OQTF → Délais critiques 48h-30 jours
- Naturalisation → Procédure longue, nombreux documents
- Asile politique → OFPRA/CNDA, urgence variable
- Titre de séjour → Préfecture, renouvellement, première demande
```

### Prompt Utilisateur (template)

```
Analyse cet email de client et extrais les informations juridiques pertinentes:

=== EMAIL CLIENT ===
{sourceRaw}
===================

Type de procédure détecté: {procedureType}

INSTRUCTIONS:
1. Identifie les FAITS certains (dates, noms, événements explicites)
2. Propose les CONTEXTES juridiques possibles (CESEDA)
3. Détermine les OBLIGATIONS légales (délais, recours, documents)
4. Score de confiance pour chaque élément

Réponds en JSON strict (aucun texte avant/après).
```

### Format de réponse attendu

```json
{
  "facts": [
    {
      "label": "Date de notification",
      "value": "2026-01-15",
      "source": "EXPLICIT_MESSAGE",
      "sourceRef": "ligne 3 de l'email",
      "confidence": 0.95
    }
  ],
  "contexts": [
    {
      "type": "LEGAL",
      "description": "OQTF avec délai de départ volontaire (Art. L511-1 CESEDA)",
      "reasoning": "Mention explicite d'une obligation de quitter le territoire avec délai",
      "certaintyLevel": "PROBABLE",
      "confidence": 0.85
    }
  ],
  "obligations": [
    {
      "description": "Déposer un recours contentieux devant le Tribunal administratif",
      "mandatory": true,
      "deadline": "2026-02-15",
      "critical": true,
      "legalRef": "Art. L512-1 CESEDA",
      "confidence": 0.90
    }
  ]
}
```

---

## Résultats de tests E2E

### Test avec email OQTF réaliste

**Email test:**
```
Objet: URGENT - Notification OQTF reçue

Je viens de recevoir une notification d'OQTF le 15 janvier 2026.
Délai de 30 jours pour quitter la France volontairement.
En France depuis 3 ans avec titre étudiant expiré il y a 6 mois.
Demande de renouvellement déposée en août 2025 sans réponse.
Décision mentionne Art. L511-1 CESEDA.
Possibilité de contester devant Tribunal administratif.
```

**Résultats extraction:**

| Métrique | Valeur |
|----------|--------|
| **Succès** | ✅ OUI |
| **Modèle** | llama3.2:3b |
| **Temps** | ~112 secondes |
| **Confiance globale** | 88% |
| **Faits extraits** | 3 |
| **Contextes** | 1 |
| **Obligations** | 1 |
| **Validation** | ✅ VALIDE (0 warnings) |
| **Transition** | RECEIVED → CONTEXT_IDENTIFIED |

**Détails entités créées:**

**Facts (3):**
1. Date de notification: "2026-01-15" (confiance: 95%)
2. Délai pour quitter la France: "30 jours" (confiance: 90%)
3. Date demande renouvellement: "août 2025" (confiance: 80%)

**Contexts (1):**
- Type: LEGAL
- Description: "OQTF avec délai de départ volontaire (Art. L511-1 CESEDA)"
- Certitude: PROBABLE (85%)
- Raisonnement: "Mention explicite d'une obligation de quitter le territoire avec délai et référence à l'article L511-1"

**Obligations (1):**
- Description: "Déposer un recours contentieux devant le Tribunal administratif"
- Obligatoire: OUI
- Critique: OUI ⚠️
- Deadline: 2026-02-15
- Référence légale: Art. L512-1 CESEDA
- Confiance: 90%

---

## Système de validation

### Règles de validation automatique

```typescript
// Dans validateExtraction()

✅ VALIDE si:
  - Confiance globale ≥ 50%
  - Au moins 1 entité extraite (fait OU contexte OU obligation)
  - Pas de date future suspecte (> 2030)
  - Moins de 3 warnings

⚠️ WARNINGS si:
  - Confiance globale < 50%
  - Aucun fait extrait
  - Aucun contexte identifié
  - Aucune obligation détectée
  - Dates futures suspectes
  - Deadlines critiques < 7 jours
```

### Exemples de warnings

```
⚠️ Confiance globale faible: 45%
⚠️ Aucun fait extrait - Vérification manuelle recommandée
⚠️ Aucun contexte identifié - Analyse juridique requise
⚠️ Aucune obligation détectée - Vérifier les délais manuellement
⚠️ Dates futures suspectes détectées
⚠️ 2 deadline(s) critique(s) < 7 jours
```

---

## Fallback automatique

Si Ollama est indisponible, le système utilise un **fallback basé sur règles simples** :

### Logique de fallback

1. **Détection de dates** : Regex `\d{4}-\d{2}-\d{2}`
2. **Détection type procédure** : Basé sur `workspace.procedureType`
3. **Détection urgence** : Mots-clés ("urgent", "expulsion", "délai")

**Limitations fallback:**
- Confiance globale: 50% (vs 80-90% avec Ollama)
- Extraction limitée (faits basiques uniquement)
- Pas de raisonnement juridique
- Contextes génériques

**Exemple output fallback:**
```json
{
  "success": true,
  "facts": [
    {
      "label": "Date détectée",
      "value": "2026-01-15",
      "source": "EXPLICIT_MESSAGE",
      "confidence": 0.6
    }
  ],
  "contexts": [
    {
      "type": "LEGAL",
      "description": "Procédure OQTF détectée - Délais critiques",
      "certaintyLevel": "PROBABLE",
      "confidence": 0.7
    }
  ],
  "model": "fallback-rules"
}
```

---

## Flow complet extraction

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Utilisateur clique "🤖 Extraire avec IA"                    │
│     (ReceivedStateView)                                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. POST /api/workspace-reasoning/{id}/extract                  │
│     - Vérification auth & tenant isolation                      │
│     - Vérification état RECEIVED                                │
│     - Vérification workspace non verrouillé                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. WorkspaceExtractionService.extractFromWorkspace()           │
│     - Vérification Ollama disponible                            │
│     - Construction prompt CESEDA                                │
│     - Appel Ollama avec llama3.2:3b                             │
│     - Parse JSON response                                       │
│     - Calcul confiance globale                                  │
│     (Fallback si Ollama indisponible)                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Validation extraction                                        │
│     - validateExtraction()                                       │
│     - Génération warnings                                        │
│     - Vérification cohérence                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. Création entités en base (Prisma)                           │
│     - Fact.create() × N                                         │
│     - ContextHypothesis.create() × N                            │
│     - Obligation.create() × N                                   │
│     - ReasoningTrace.create() (audit)                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. Transition automatique (si autoTransition: true)            │
│     - Nouvel état: FACTS_EXTRACTED ou CONTEXT_IDENTIFIED        │
│     - WorkspaceReasoning.update()                               │
│     - ReasoningTransition.create()                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. Response JSON + UI update                                    │
│     - Affichage résumé extraction                                │
│     - Rechargement automatique après 3s                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sécurité & Audit

### Isolation multi-tenant

```typescript
// Vérification systématique
if (workspace.tenantId !== session.user.tenantId) {
  return 403; // Accès refusé
}
```

### Trail d'audit automatique

Chaque extraction crée automatiquement:

1. **ReasoningTrace** (trace de raisonnement):
```typescript
{
  step: 'AI Extraction automatique',
  explanation: 'Extraction IA réussie: 3 faits, 1 contexte, 1 obligation (confiance: 88%)',
  metadata: {
    model: 'llama3.2:3b',
    processingTime: 111666,
    confidence: 0.88,
    validation: { valid: true, warnings: [] }
  },
  createdBy: 'AI'
}
```

2. **ReasoningTransition** (si autoTransition):
```typescript
{
  fromState: 'RECEIVED',
  toState: 'CONTEXT_IDENTIFIED',
  triggeredBy: 'AI',
  reason: 'Extraction automatique réussie avec 3 faits',
  autoApproved: false, // Nécessite validation humaine
  metadata: { extractionResult: {...} }
}
```

### Protection workspace verrouillé

```typescript
if (workspace.locked) {
  return 400; // Extraction impossible
}
```

---

## Performance

### Métriques mesurées

| Opération | Temps moyen | Notes |
|-----------|-------------|-------|
| **Ollama call** | ~110 secondes | Variable selon charge CPU |
| **Parse JSON** | < 10ms | - |
| **Validation** | < 5ms | - |
| **DB inserts** | ~50ms | 3 facts + 1 context + 1 obligation |
| **Total** | ~112 secondes | Dominé par Ollama |

### Optimisations possibles

1. **Ollama GPU** : Réduction temps à ~10-20s (avec CUDA)
2. **Cache prompts** : Réutilisation résultats similaires
3. **Batch processing** : Extraction multiple workspaces
4. **OpenAI API** : Alternative cloud plus rapide (~3-5s)

---

## Utilisation

### 1. Via Interface UI

1. Naviguer vers workspace en état `RECEIVED`
2. Cliquer sur bouton **"🤖 Extraire avec IA"**
3. Attendre extraction (~2 minutes avec Ollama local)
4. Vérifier résumé affiché (faits/contextes/obligations)
5. Rechargement automatique après 3s
6. Workspace transitionné vers `CONTEXT_IDENTIFIED`

### 2. Via API directe

```bash
curl -X POST http://localhost:3000/api/workspace-reasoning/{workspaceId}/extract \
  -H "Content-Type: application/json" \
  -d '{"autoTransition": true}'
```

### 3. Via script de test

```bash
npx tsx scripts/test-ai-extraction.ts
```

---

## Limitations connues

1. **Temps d'extraction long** : ~110s avec Ollama local (CPU)
2. **Dépendance Ollama** : Nécessite Ollama running sur `http://localhost:11434`
3. **Langue française** : Optimisé uniquement pour français
4. **Domaine CESEDA** : Prompts spécialisés droit des étrangers français
5. **Confiance variable** : 80-90% en moyenne, dépend qualité email source

---

## Prochaines évolutions

### Court terme (Priority 2-3)

- [ ] **Cache résultats** : Éviter re-extraction identiques
- [ ] **Extraction batch** : Traiter plusieurs workspaces simultanément
- [ ] **Metrics dashboard** : Temps moyen, taux succès, confiance moyenne
- [ ] **Prompts personnalisables** : Par type de procédure

### Moyen terme (Priority 4-5)

- [ ] **OpenAI GPT-4 option** : Alternative cloud pour rapidité
- [ ] **Fine-tuning Ollama** : Modèle spécialisé CESEDA
- [ ] **Extraction incrémentale** : Ajout facts/contexts sans recréation
- [ ] **Multi-langue** : Support anglais, espagnol

### Long terme (Roadmap)

- [ ] **Extraction documents** : PDF, images (OCR + extraction)
- [ ] **Validation humaine en boucle** : Feedback pour amélioration modèle
- [ ] **Auto-learning** : Amélioration prompts basée sur corrections
- [ ] **Intégration Légifrance** : Enrichissement automatique articles CESEDA

---

## Troubleshooting

### Erreur: "Ollama unavailable"

**Cause**: Ollama non démarré ou port incorrect

**Solution**:
```bash
# Vérifier Ollama
ollama list

# Démarrer Ollama
ollama serve

# Tester connexion
curl http://localhost:11434/api/tags
```

### Erreur: "Confiance globale faible"

**Cause**: Email source peu structuré ou ambiguë

**Solution**: Utiliser analyse manuelle ou enrichir email avec plus de détails

### Erreur: "État invalide"

**Cause**: Workspace pas en état `RECEIVED`

**Solution**: Extraction possible uniquement depuis état initial `RECEIVED`

### Extraction très lente (> 5 minutes)

**Cause**: CPU surchargé ou modèle Ollama trop grand

**Solution**:
- Fermer applications lourdes
- Utiliser modèle plus petit (`llama3.2:1b`)
- Considérer OpenAI API pour production

---

## Support & Contact

- **Documentation complète**: `docs/WORKSPACE_REASONING_SYSTEM.md`
- **Tests E2E**: `scripts/test-ai-extraction.ts`
- **Code source service**: `src/lib/ai/workspace-extraction-service.ts`
- **Code source API**: `src/app/api/workspace-reasoning/[id]/extract/route.ts`
- **Code source UI**: `src/components/workspace-reasoning/ReceivedStateView.tsx`

**Dernière mise à jour**: 21 janvier 2026
**Version**: 1.0.0
**Statut**: ✅ PRODUCTION READY
