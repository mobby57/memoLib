/**
 * 🧠 SCHÉMA DE DONNÉES CANONIQUE - IA POSTE MANAGER
 * 
 * Types stricts pour le système de raisonnement Workspace.
 * Conformité absolue au schéma canonique MVP.
 * 
 * ⚠️ Ce schéma est dicté par le raisonnement, pas par la technique.
 * La base de données n'est qu'un support de cognition.
 * 
 * Version: 2.0 - Alignement strict avec machine à états MVP
 */

// ============================================
// ÉTATS DU WORKSPACE (Machine à états MVP)
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
  RECEIVED: { label: 'Reçu', color: 'gray', icon: '📥' },
  FACTS_EXTRACTED: { label: 'Faits extraits', color: 'blue', icon: '📋' },
  CONTEXT_IDENTIFIED: { label: 'Contexte identifié', color: 'purple', icon: '🧭' },
  OBLIGATIONS_DEDUCED: { label: 'Obligations déduites', color: 'orange', icon: '📜' },
  MISSING_IDENTIFIED: { label: 'Manques identifiés', color: 'red', icon: '❗' },
  RISK_EVALUATED: { label: 'Risques évalués', color: 'yellow', icon: '⚠️' },
  ACTION_PROPOSED: { label: 'Action proposée', color: 'indigo', icon: '👉' },
  READY_FOR_HUMAN: { label: 'Prêt pour humain', color: 'green', icon: '✅' },
};

// ============================================
// WORKSPACE
// ============================================

export interface WorkspaceReasoning {
  id: string;
  tenantId: string;
  
  // État
  currentState: WorkspaceState;
  stateChangedAt: Date;
  stateChangedBy?: string;
  
  // Source
  sourceType: 'EMAIL' | 'FORM' | 'PHONE' | 'COURRIER' | 'API';
  sourceId?: string;
  sourceRaw: string;
  sourceMetadata?: string; // JSON
  
  // Métadonnées métier
  procedureType?: string;
  ownerUserId: string;
  
  // Métriques
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
  
  // Relations métier
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
// MISSING ELEMENT (CŒUR MVP)
// ============================================

export interface MissingElement {
  id: string;
  workspaceId: string;
  
  type: 'INFORMATION' | 'DOCUMENT' | 'DECISION' | 'VALIDATION' | 'HUMAN_EXPERTISE';
  description: string;
  why: string;
  
  blocking: boolean;
  
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolution?: string;
  
  identifiedBy: string;
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
  if (level >= 0.8) return { label: 'Très incertain', color: 'text-red-600' };
  if (level >= 0.5) return { label: 'Incertain', color: 'text-orange-600' };
  if (level >= 0.2) return { label: 'Peu incertain', color: 'text-yellow-600' };
  return { label: 'Actionnable', color: 'text-green-600' };
}

export function calculateRiskScore(impact: Risk['impact'], probability: Risk['probability']): number {
  const values = { LOW: 1, MEDIUM: 2, HIGH: 3 };
  return values[impact] * values[probability];
}

// ============================================
// 🔒 RÈGLES STRUCTURELLES (IMPÉRATIVES)
// ============================================

/**
 * Règles de validation du raisonnement
 * Ces règles DOIVENT être respectées à tout moment
 */
export const STRUCTURAL_RULES = {
  /** ❌ Aucune donnée sans workspaceId */
  WORKSPACE_REQUIRED: 'All entities must have a workspaceId',
  
  /** ❌ Aucun fait sans source */
  FACT_SOURCE_REQUIRED: 'All facts must have a source',
  
  /** ❌ Aucune obligation sans contexte */
  OBLIGATION_CONTEXT_REQUIRED: 'All obligations must link to a context',
  
  /** ❌ Aucune action sans manque associé */
  ACTION_MISSING_REQUIRED: 'All actions must address at least one missing element',
  
  /** ❌ Aucun passage à READY_FOR_HUMAN s'il reste un manque bloquant */
  NO_READY_WITH_BLOCKING: 'Cannot transition to READY_FOR_HUMAN with blocking missing elements',
} as const;

/**
 * Vérifie si un workspace peut passer à READY_FOR_HUMAN
 * RÈGLE #5 : Pas de READY_FOR_HUMAN si blocking missing elements
 */
export function canTransitionToReadyForHuman(missingElements: MissingElement[]): boolean {
  return !missingElements.some(m => m.blocking && !m.resolved);
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
 * RÈGLE #2 : Aucun fait sans source
 */
export function validateFactHasSource(fact: Fact): boolean {
  return !!fact.source && fact.source.length > 0;
}

/**
 * Valide qu'une obligation est liée à un contexte
 * RÈGLE #3 : Aucune obligation sans contexte
 */
export function validateObligationHasContext(obligation: Obligation): boolean {
  return !!obligation.contextId && obligation.contextId.length > 0;
}

/**
 * Vérifie si une transition d'état est valide
 */
export function validateStateTransition(
  from: WorkspaceState,
  to: WorkspaceState,
  missingElements?: MissingElement[]
): { valid: boolean; reason?: string } {
  // Vérifier que la transition est autorisée
  if (!canTransitionTo(from, to)) {
    return {
      valid: false,
      reason: `Transition ${from} → ${to} not allowed`,
    };
  }
  
  // Vérifier règle #5 pour READY_FOR_HUMAN
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
 * Transitions autorisées de la machine à états
 */
export const ALLOWED_TRANSITIONS: Record<WorkspaceState, WorkspaceState[]> = {
  RECEIVED: ['FACTS_EXTRACTED'],
  FACTS_EXTRACTED: ['CONTEXT_IDENTIFIED'],
  CONTEXT_IDENTIFIED: ['OBLIGATIONS_DEDUCED'],
  OBLIGATIONS_DEDUCED: ['MISSING_IDENTIFIED'],
  MISSING_IDENTIFIED: ['RISK_EVALUATED'],
  RISK_EVALUATED: ['ACTION_PROPOSED'],
  ACTION_PROPOSED: ['READY_FOR_HUMAN'],
  READY_FOR_HUMAN: [], // État terminal
};

// ============================================
// 🧾 POURQUOI CE SCHÉMA EST FORT
// ============================================

/**
 * Avantages du schéma canonique :
 * 
 * ✅ Il FORCE le raisonnement
 * ✅ Il empêche les raccourcis IA
 * ✅ Il est AUDITABLE
 * ✅ Il est JURIDIQUEMENT défendable
 * ✅ Il est TRANSMISSIBLE
 * ✅ Il est INDÉPENDANT du métier
 * 
 * 👉 On peut ajouter des métiers SANS changer ce noyau.
 */


export function getRiskColor(score: number): string {
  if (score >= 6) return 'text-red-600';
  if (score >= 4) return 'text-orange-600';
  return 'text-yellow-600';
}
