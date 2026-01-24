/**
 * [emoji] SCHeMA DE DONNeES CANONIQUE - IA POSTE MANAGER
 * 
 * Types stricts pour le systeme de raisonnement Workspace.
 * Conformite absolue au schema canonique MVP.
 * 
 * ️ Ce schema est dicte par le raisonnement, pas par la technique.
 * La base de donnees n'est qu'un support de cognition.
 * 
 * Version: 2.0 - Alignement strict avec machine a etats MVP
 */

// ============================================
// eTATS DU WORKSPACE (Machine a etats MVP)
// ============================================

export type WorkspaceState = 
  | 'RECEIVED'
  | 'FACTS_EXTRACTED'
  | 'CONTEXT_IDENTIFIED'
  | 'OBLIGATIONS_DEDUCED'
  | 'MISSING_IDENTIFIED'
  | 'RISK_EVALUATED'
  | 'ACTION_PROPOSED'
  | 'READY_FOR_HUMAN';

export const WORKSPACE_STATES: Record<WorkspaceState, { label: string; color: string; icon: string }> = {
  RECEIVED: { label: 'Recu', color: 'gray', icon: '[emoji]' },
  FACTS_EXTRACTED: { label: 'Faits extraits', color: 'blue', icon: '[emoji]' },
  CONTEXT_IDENTIFIED: { label: 'Contexte identifie', color: 'purple', icon: '[emoji]' },
  OBLIGATIONS_DEDUCED: { label: 'Obligations deduites', color: 'orange', icon: '[emoji]' },
  MISSING_IDENTIFIED: { label: 'Manques identifies', color: 'red', icon: '' },
  RISK_EVALUATED: { label: 'Risques evalues', color: 'yellow', icon: '️' },
  ACTION_PROPOSED: { label: 'Action proposee', color: 'indigo', icon: '[emoji]' },
  READY_FOR_HUMAN: { label: 'Pret pour humain', color: 'green', icon: '' },
};

// ============================================
// WORKSPACE
// ============================================

export interface WorkspaceReasoning {
  id: string;
  tenantId: string;
  
  // etat
  currentState: WorkspaceState;
  stateChangedAt: Date;
  stateChangedBy?: string;
  
  // Source
  sourceType: 'EMAIL' | 'FORM' | 'PHONE' | 'COURRIER' | 'API';
  sourceId?: string;
  sourceRaw: string;
  sourceMetadata?: string; // JSON
  
  // Metadonnees metier
  procedureType?: string;
  ownerUserId: string;
  
  // Metriques
  reasoningQuality?: number;
  uncertaintyLevel: number;
  confidenceScore?: number;
  
  // Verrouillage
  locked: boolean;
  
  // Validation
  validatedBy?: string;
  validatedAt?: Date;
  validationNote?: string;
  
  // Dates
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  
  // Relations metier
  clientId?: string;
  dossierId?: string;
  emailId?: string;
  
  // Relations reasoning
  facts?: Fact[];
  contexts?: ContextHypothesis[];
  obligations?: Obligation[];
  missingElements?: MissingElement[];
  risks?: Risk[];
  proposedActions?: ProposedAction[];
  traces?: ReasoningTrace[];
  transitions?: ReasoningTransition[];
}

// ============================================
// FACT
// ============================================

export interface Fact {
  id: string;
  workspaceId: string;
  
  label: string;
  value: string;
  
  source: 'EXPLICIT_MESSAGE' | 'METADATA' | 'DOCUMENT' | 'USER_PROVIDED';
  sourceRef?: string;
  
  confidence: number;
  
  extractedBy: string;
  createdAt: Date;
}

// ============================================
// CONTEXT HYPOTHESIS
// ============================================

export interface ContextHypothesis {
  id: string;
  workspaceId: string;
  
  type: 'LEGAL' | 'ADMINISTRATIVE' | 'CONTRACTUAL' | 'TEMPORAL' | 'ORGANIZATIONAL';
  description: string;
  reasoning?: string;
  
  certaintyLevel: 'POSSIBLE' | 'PROBABLE' | 'CONFIRMED';
  
  identifiedBy: string;
  createdAt: Date;
  
  obligations?: Obligation[];
}

// ============================================
// OBLIGATION
// ============================================

export interface Obligation {
  id: string;
  workspaceId: string;
  contextId: string;
  
  description: string;
  mandatory: boolean;
  
  deadline?: Date;
  critical: boolean;
  
  legalRef?: string;
  
  deducedBy: string;
  createdAt: Date;
}

// ============================================
// MISSING ELEMENT (CoeUR MVP)
// ============================================

export interface MissingElement {
  id: string;
  workspaceId: string;
  
  type: string; // document, information, decision, action
  description: string;
  priority: string; // low, normal, high, urgent
  
  // Pour compatibilite avec l'ancienne API
  why?: string;
  blocking?: boolean;
  identifiedBy?: string;
  
  resolved: boolean;
  resolvedBy?: string | null;
  resolvedAt?: Date | null;
  resolution?: string | null;
  
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// RISK
// ============================================

export interface Risk {
  id: string;
  workspaceId: string;
  
  description: string;
  
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  probability: 'LOW' | 'MEDIUM' | 'HIGH';
  
  irreversible: boolean;
  riskScore: number; // 1-9
  
  evaluatedBy: string;
  createdAt: Date;
}

// ============================================
// PROPOSED ACTION
// ============================================

export interface ProposedAction {
  id: string;
  workspaceId: string;
  
  type: 'QUESTION' | 'DOCUMENT_REQUEST' | 'ALERT' | 'ESCALATION' | 'FORM_SEND';
  content: string;
  reasoning: string;
  
  target: 'CLIENT' | 'INTERNAL_USER' | 'SYSTEM';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  
  executed: boolean;
  executedBy?: string;
  executedAt?: Date;
  result?: string;
  
  proposedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// REASONING TRACE
// ============================================

export interface ReasoningTrace {
  id: string;
  workspaceId: string;
  
  step: string;
  explanation: string;
  
  metadata?: string; // JSON
  
  createdBy: string;
  createdAt: Date;
}

// ============================================
// REASONING TRANSITION
// ============================================

export interface ReasoningTransition {
  id: string;
  workspaceId: string;
  
  fromState: string;
  toState: string;
  
  triggeredBy: string;
  triggeredAt: Date;
  
  reason: string;
  metadata?: string;
  
  autoApproved: boolean;
  validatedBy?: string;
  validatedAt?: Date;
  
  stateBefore?: string;
  stateAfter?: string;
  
  hash?: string;
  
  createdAt: Date;
}

// ============================================
// HELPERS
// ============================================

export function getStateBadgeColor(state: WorkspaceState): string {
  const colors: Record<WorkspaceState, string> = {
    RECEIVED: 'bg-gray-100 text-gray-800',
    FACTS_EXTRACTED: 'bg-blue-100 text-blue-800',
    CONTEXT_IDENTIFIED: 'bg-purple-100 text-purple-800',
    OBLIGATIONS_DEDUCED: 'bg-orange-100 text-orange-800',
    MISSING_IDENTIFIED: 'bg-red-100 text-red-800',
    RISK_EVALUATED: 'bg-yellow-100 text-yellow-800',
    ACTION_PROPOSED: 'bg-indigo-100 text-indigo-800',
    READY_FOR_HUMAN: 'bg-green-100 text-green-800',
  };
  
  return colors[state];
}

export function canTransitionTo(currentState: WorkspaceState, targetState: WorkspaceState): boolean {
  const validTransitions: Record<WorkspaceState, WorkspaceState[]> = {
    RECEIVED: ['FACTS_EXTRACTED'],
    FACTS_EXTRACTED: ['CONTEXT_IDENTIFIED'],
    CONTEXT_IDENTIFIED: ['OBLIGATIONS_DEDUCED'],
    OBLIGATIONS_DEDUCED: ['MISSING_IDENTIFIED'],
    MISSING_IDENTIFIED: ['RISK_EVALUATED'],
    RISK_EVALUATED: ['ACTION_PROPOSED'],
    ACTION_PROPOSED: ['READY_FOR_HUMAN'],
    READY_FOR_HUMAN: [], // Terminal state
  };
  
  return validTransitions[currentState]?.includes(targetState) ?? false;
}

export function formatUncertaintyLevel(level: number): { label: string; color: string } {
  if (level >= 0.8) return { label: 'Tres incertain', color: 'text-red-600' };
  if (level >= 0.5) return { label: 'Incertain', color: 'text-orange-600' };
  if (level >= 0.2) return { label: 'Peu incertain', color: 'text-yellow-600' };
  return { label: 'Actionnable', color: 'text-green-600' };
}

export function calculateRiskScore(impact: Risk['impact'], probability: Risk['probability']): number {
  const values = { LOW: 1, MEDIUM: 2, HIGH: 3 };
  return values[impact] * values[probability];
}

// ============================================
// [emoji] ReGLES STRUCTURELLES (IMPeRATIVES)
// ============================================

/**
 * Regles de validation du raisonnement
 * Ces regles DOIVENT etre respectees a tout moment
 */
export const STRUCTURAL_RULES = {
  /**  Aucune donnee sans workspaceId */
  WORKSPACE_REQUIRED: 'All entities must have a workspaceId',
  
  /**  Aucun fait sans source */
  FACT_SOURCE_REQUIRED: 'All facts must have a source',
  
  /**  Aucune obligation sans contexte */
  OBLIGATION_CONTEXT_REQUIRED: 'All obligations must link to a context',
  
  /**  Aucune action sans manque associe */
  ACTION_MISSING_REQUIRED: 'All actions must address at least one missing element',
  
  /**  Aucun passage a READY_FOR_HUMAN s'il reste un manque bloquant */
  NO_READY_WITH_BLOCKING: 'Cannot transition to READY_FOR_HUMAN with blocking missing elements',
} as const;

/**
 * Verifie si un workspace peut passer a READY_FOR_HUMAN
 * ReGLE #5 : Pas de READY_FOR_HUMAN si blocking missing elements
 * Si 'blocking' n'est pas defini, on considere la priorite 'urgent' ou 'high' comme bloquant
 */
export function canTransitionToReadyForHuman(missingElements: MissingElement[]): boolean {
  return !missingElements.some(m => {
    const isBlocking = m.blocking ?? (m.priority === 'urgent' || m.priority === 'high');
    return isBlocking && !m.resolved;
  });
}

/**
 * Calcule le niveau d'incertitude global
 * Plus de faits = moins d'incertitude
 * Plus de manques = plus d'incertitude
 */
export function calculateUncertaintyLevel(
  factsCount: number,
  missingCount: number,
  risksCount: number
): number {
  if (factsCount === 0) return 1.0;
  
  const baseUncertainty = missingCount / (factsCount + missingCount);
  const riskFactor = Math.min(risksCount * 0.1, 0.5); // Max 50% d'impact
  
  return Math.min(baseUncertainty + riskFactor, 1.0);
}

/**
 * Valide qu'un fait a bien une source
 * ReGLE #2 : Aucun fait sans source
 */
export function validateFactHasSource(fact: Fact): boolean {
  return !!fact.source && fact.source.length > 0;
}

/**
 * Valide qu'une obligation est liee a un contexte
 * ReGLE #3 : Aucune obligation sans contexte
 */
export function validateObligationHasContext(obligation: Obligation): boolean {
  return !!obligation.contextId && obligation.contextId.length > 0;
}

/**
 * Verifie si une transition d'etat est valide
 */
export function validateStateTransition(
  from: WorkspaceState,
  to: WorkspaceState,
  missingElements?: MissingElement[]
): { valid: boolean; reason?: string } {
  // Verifier que la transition est autorisee
  if (!canTransitionTo(from, to)) {
    return {
      valid: false,
      reason: `Transition ${from} [Next] ${to} not allowed`,
    };
  }
  
  // Verifier regle #5 pour READY_FOR_HUMAN
  if (to === 'READY_FOR_HUMAN' && missingElements) {
    if (!canTransitionToReadyForHuman(missingElements)) {
      return {
        valid: false,
        reason: STRUCTURAL_RULES.NO_READY_WITH_BLOCKING,
      };
    }
  }
  
  return { valid: true };
}

/**
 * Transitions autorisees de la machine a etats
 */
export const ALLOWED_TRANSITIONS: Record<WorkspaceState, WorkspaceState[]> = {
  RECEIVED: ['FACTS_EXTRACTED'],
  FACTS_EXTRACTED: ['CONTEXT_IDENTIFIED'],
  CONTEXT_IDENTIFIED: ['OBLIGATIONS_DEDUCED'],
  OBLIGATIONS_DEDUCED: ['MISSING_IDENTIFIED'],
  MISSING_IDENTIFIED: ['RISK_EVALUATED'],
  RISK_EVALUATED: ['ACTION_PROPOSED'],
  ACTION_PROPOSED: ['READY_FOR_HUMAN'],
  READY_FOR_HUMAN: [], // etat terminal
};

// ============================================
// [emoji] POURQUOI CE SCHeMA EST FORT
// ============================================

/**
 * Avantages du schema canonique :
 * 
 *  Il FORCE le raisonnement
 *  Il empeche les raccourcis IA
 *  Il est AUDITABLE
 *  Il est JURIDIQUEMENT defendable
 *  Il est TRANSMISSIBLE
 *  Il est INDePENDANT du metier
 * 
 * [emoji] On peut ajouter des metiers SANS changer ce noyau.
 */


export function getRiskColor(score: number): string {
  if (score >= 6) return 'text-red-600';
  if (score >= 4) return 'text-orange-600';
  return 'text-yellow-600';
}
