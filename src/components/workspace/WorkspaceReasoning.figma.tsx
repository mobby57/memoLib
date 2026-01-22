/**
 * 🎨 Figma Code Connect - WorkspaceReasoning FSM
 * 
 * Composant: IA Poste Manager > Reasoning Engine > WorkspaceReasoning
 * Documenter la machine à états du pipeline "Zéro Information Ignorée"
 */

import { CodeConnect } from '@figma/code-connect';
import WorkspaceReasoningComponent from './WorkspaceReasoning';

CodeConnect.figma(
  'https://www.figma.com/design/YOUR_FILE_ID/IA-Poste-Manager?node-id=REASONING_WORKFLOW_ID',
  WorkspaceReasoningComponent,
  {
    workspace: figma.nestedProps('Workspace Data', {
      id: figma.string('ID'),
      currentState: figma.enum('FSM State', {
        'RECEIVED': 'RECEIVED',
        'FACTS_EXTRACTED': 'FACTS_EXTRACTED',
        'CONTEXT_IDENTIFIED': 'CONTEXT_IDENTIFIED',
        'OBLIGATIONS_DEDUCED': 'OBLIGATIONS_DEDUCED',
        'MISSING_IDENTIFIED': 'MISSING_IDENTIFIED',
        'RISK_EVALUATED': 'RISK_EVALUATED',
        'ACTION_PROPOSED': 'ACTION_PROPOSED',
        'READY_FOR_HUMAN': 'READY_FOR_HUMAN'
      }),
      uncertaintyLevel: figma.number('Uncertainty (0-1)'),
      confidenceScore: figma.number('Confidence (0-1)'),
      procedureType: figma.enum('CESEDA Type', {
        'OQTF': 'OQTF',
        'REFUS_TITRE': 'REFUS_TITRE',
        'NATURALISATION': 'NATURALISATION'
      })
    }),
    
    // Pipeline visualization
    showTimeline: figma.boolean('Show Timeline'),
    expandDetails: figma.boolean('Expanded View'),
    highlightBlockers: figma.boolean('Highlight Blockers'),
    
    // Controls
    onStateChange: figma.action('On State Transition'),
    onValidate: figma.action('On Validation'),
    onEscalate: figma.action('On Escalation')
  }
);

/**
 * **Machine à états du raisonnement juridique**
 * 
 * Implémente la "Garantie Zéro Information Ignorée" avec:
 * - 8 états immuables (RECEIVED → READY_FOR_HUMAN)
 * - Transition unidirectionnelle
 * - Audit trail inviolable
 * - Escalades automatiques
 * 
 * ### États FSM
 * 1. **RECEIVED** - Information brute reçue (max 5 min)
 * 2. **FACTS_EXTRACTED** - Faits certains isolés (max 15 min)
 * 3. **CONTEXT_IDENTIFIED** - Cadre identifié (max 30 min)
 * 4. **OBLIGATIONS_DEDUCED** - Obligations requises
 * 5. **MISSING_IDENTIFIED** - Éléments manquants ⭐
 * 6. **RISK_EVALUATED** - Risques évalués
 * 7. **ACTION_PROPOSED** - Actions suggérées
 * 8. **READY_FOR_HUMAN** - Prêt pour validation
 * 
 * ### Garanties
 * ✅ Pas d'information orpheline
 * ✅ Audit trail immuable (SHA-256)
 * ✅ Escalade auto (48h/72h/96h)
 * ✅ Blocage si éléments manquants
 * 
 * ### Intégrations
 * - IA: Ollama (extraction + raisonnement)
 * - DB: PostgreSQL (InformationUnit table)
 * - Real-time: WebSocket notifications
 */
