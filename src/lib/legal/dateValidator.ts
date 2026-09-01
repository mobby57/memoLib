/**
 * Service avancé de validation des dates extraites
 * Garantit la cohérence contextuelle avant toute décision juridique
 */

export interface ExtractedDates {
  decisionDate?: Date | string | null;
  notificationDate?: Date | string | null;
  deadlineDate?: Date | string | null;
  hearingDate?: Date | string | null;
  appealDate?: Date | string | null;
  otherDates?: Record<string, Date | string | null>;
}

export interface ValidationRule {
  id: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  check: (dates: NormalizedDates, context?: any) => boolean | string;
}

export interface ValidationError {
  ruleId: string;
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestedFix?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  infos: ValidationError[];
  confidence: number; // 0-1
  humanReviewRequired: boolean;
  metadata: {
    validatedAt: Date;
    rulesApplied: string[];
    context?: any;
  };
}

export interface NormalizedDates {
  decisionDate: Date | null;
  notificationDate: Date | null;
  deadlineDate: Date | null;
  hearingDate: Date | null;
  appealDate: Date | null;
  otherDates: Record<string, Date | null>;
}

const RULES: ValidationRule[] = [
  {
    id: 'NOTIFICATION_AFTER_DECISION',
    description: 'La date de notification doit être postérieure ou égale à la date de décision',
    severity: 'error',
    check: (dates) => {
      if (!dates.decisionDate || !dates.notificationDate) return true;
      return dates.notificationDate >= dates.decisionDate;
    },
  },
  {
    id: 'DEADLINE_AFTER_NOTIFICATION',
    description: 'La date limite doit être postérieure ou égale à la date de notification',
    severity: 'error',
    check: (dates) => {
      if (!dates.notificationDate || !dates.deadlineDate) return true;
      return dates.deadlineDate >= dates.notificationDate;
    },
  },
  {
    id: 'DEADLINE_NOT_PAST',
    description: 'La date limite ne doit pas être dans le passé (sauf si dossier déjà en retard)',
    severity: 'warning',
    check: (dates) => {
      if (!dates.deadlineDate) return true;
      return dates.deadlineDate >= new Date();
    },
  },
  {
    id: 'HEARING_AFTER_NOTIFICATION',
    description: "La date d'audience doit être postérieure à la date de notification",
    severity: 'error',
    check: (dates) => {
      if (!dates.notificationDate || !dates.hearingDate) return true;
      return dates.hearingDate >= dates.notificationDate;
    },
  },
  {
    id: 'DECISION_NOT_FUTURE',
    description: 'La date de décision ne doit pas être dans le futur',
    severity: 'warning',
    check: (dates) => {
      if (!dates.decisionDate) return true;
      return dates.decisionDate <= new Date();
    },
  },
  {
    id: 'DEADLINE_REASONABLE',
    description: 'Le délai entre notification et deadline doit être cohérent (≤ 2 ans)',
    severity: 'warning',
    check: (dates) => {
      if (!dates.notificationDate || !dates.deadlineDate) return true;
      const diff = dates.deadlineDate.getTime() - dates.notificationDate.getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      return days <= 730;
    },
  },
  {
    id: 'NO_CONTRADICTORY_DATES',
    description: 'Les dates ne doivent pas être contradictoires (ex: décision > deadline)',
    severity: 'error',
    check: (dates) => {
      if (!dates.decisionDate || !dates.deadlineDate) return true;
      return dates.decisionDate <= dates.deadlineDate;
    },
  },
];

function normalizeDate(input: Date | string | null | undefined): Date | null {
  if (!input) return null;
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }
  if (typeof input === 'string') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function normalizeDates(input: ExtractedDates): NormalizedDates {
  return {
    decisionDate: normalizeDate(input.decisionDate),
    notificationDate: normalizeDate(input.notificationDate),
    deadlineDate: normalizeDate(input.deadlineDate),
    hearingDate: normalizeDate(input.hearingDate),
    appealDate: normalizeDate(input.appealDate),
    otherDates: Object.fromEntries(
      Object.entries(input.otherDates || {})
        .map(([k, v]) => [k, normalizeDate(v)])
        .filter(([, v]) => v !== null)
    ) as Record<string, Date>,
  };
}

export class DateValidatorService {
  private rules: ValidationRule[] = RULES;

  validate(dates: ExtractedDates, context?: any): ValidationResult {
    const normalized = normalizeDates(dates);
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const infos: ValidationError[] = [];
    const appliedRules: string[] = [];

    for (const rule of this.rules) {
      try {
        const result = rule.check(normalized, context);
        if (result === false) {
          const error: ValidationError = {
            ruleId: rule.id,
            field: this.guessField(rule.id),
            message: rule.description,
            severity: rule.severity,
            suggestedFix: this.getSuggestedFix(rule.id, normalized),
          };
          if (rule.severity === 'error') errors.push(error);
          else if (rule.severity === 'warning') warnings.push(error);
          else infos.push(error);
        }
        appliedRules.push(rule.id);
      } catch {
        warnings.push({
          ruleId: rule.id,
          field: 'system',
          message: `Règle ${rule.id} non applicable`,
          severity: 'warning',
        });
      }
    }

    const hasErrors = errors.length > 0;
    const valid = !hasErrors;
    const baseConfidence = 0.95;
    const penalty = (errors.length * 0.3) + (warnings.length * 0.1);
    const confidence = Math.max(0, Math.min(1, baseConfidence - penalty));
    const humanReviewRequired = hasErrors || confidence < 0.7;

    return {
      valid,
      errors,
      warnings,
      infos,
      confidence,
      humanReviewRequired,
      metadata: {
        validatedAt: new Date(),
        rulesApplied: appliedRules,
        context,
      },
    };
  }

  private guessField(ruleId: string): string {
    if (ruleId.includes('NOTIFICATION')) return 'notificationDate';
    if (ruleId.includes('NOTIFICATION')) return 'notificationDate';
    if (ruleId.includes('DECISION')) return 'decisionDate';
    if (ruleId.includes('DEADLINE')) return 'deadlineDate';
    if (ruleId.includes('APPEAL')) return 'appealDate';
    return 'unknown';
  }

  private getSuggestedFix(ruleId: string, dates: NormalizedDates): string | undefined {
    switch (ruleId) {
      case 'NOTIFICATION_AFTER_DECISION':
        return 'Vérifier la date de notification (doit être ≥ date de décision)';
      case 'DEADLINE_AFTER_NOTIFICATION':
        return 'Vérifier la date limite (doit être ≥ date de notification)';
      case 'DEADLINE_NOT_PAST':
        return 'Si le dossier est en retard, marquer OVERDUE, sinon revoir la date';
      case 'HEARING_AFTER_NOTIFICATION':
        return "Vérifier la date d'audience";
      case 'DECISION_NOT_FUTURE':
        return 'Une décision ne peut pas être dans le futur. Vérifier la date.';
      case 'DEADLINE_REASONABLE':
        return 'Vérifier si le délai est anormalement long. Un recours classique est de 2 mois.';
      default:
        return undefined;
    }
  }
}

export const dateValidator = new DateValidatorService();
export default dateValidator;

// Ajout d’une méthode utilitaire pour récupérer les IDs des règles violées
export function getViolatedRuleIds(result: ValidationResult): string[] {
  const ids = result.errors.map(e => e.ruleId);
  ids.push(...result.warnings.map(w => w.ruleId));
  return [...new Set(ids)]; // dédoublonnage
}
