// ─── Types CESEDA Legal Packs ────────────────────────────────

export type ProcedureCategory =
  | 'titres-sejour'
  | 'asile'
  | 'eloignement'
  | 'regroupement-familial'
  | 'nationalite'
  | 'retention'
  | 'visas'
  | 'contentieux';

export type DeadlineType = 'instruction' | 'recours' | 'action' | 'audience';

export type DeadlineTrigger =
  | 'dateDepot'
  | 'dateNotification'
  | 'dateExpiration'
  | 'dateAudience'
  | 'finInstruction';

export interface Duration {
  days?: number;
  weeks?: number;
  months?: number;
  years?: number;
  /** négatif = AVANT la date déclencheuse (ex: renouvellement 2 mois avant expiration) */
}

export interface DeadlineRule {
  id: string;
  label: string;
  duration: Duration;
  trigger: DeadlineTrigger;
  type: DeadlineType;
  court?: string;
  article?: string;
  criticality?: 'info' | 'warning' | 'critical';
}

export interface IntakeQuestion {
  id: string;
  question: string;
  type: 'text' | 'number' | 'date' | 'choice' | 'boolean';
  options?: string[];
  required?: boolean;
}

export interface RiskPattern {
  regex: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  action: string;
  description?: string;
}

export interface LegalPack {
  id: string;
  label: string;
  article: string;
  category: ProcedureCategory;
  description: string;
  deadlines: DeadlineRule[];
  documents: string[];
  intakeQuestions: IntakeQuestion[];
  riskPatterns: RiskPattern[];
}

export interface ComputedDeadline {
  id: string;
  packId: string;
  label: string;
  dueDate: Date;
  type: DeadlineType;
  court?: string;
  article?: string;
  criticality: 'info' | 'warning' | 'critical';
  daysRemaining: number;
}

export interface DossierDates {
  dateDepot?: Date;
  dateNotification?: Date;
  dateExpiration?: Date;
  dateAudience?: Date;
  finInstruction?: Date;
}

export interface MatchResult {
  pack: LegalPack;
  confidence: number; // 0-1
  matchedPatterns: string[];
}