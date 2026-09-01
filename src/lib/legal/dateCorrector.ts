/**
 * Corrections automatiques pour les dates incohérentes
 * Utilisé en fallback quand la validation échoue
 */

import type { ExtractedDates, NormalizedDates } from './dateValidator';

export interface CorrectionResult {
  corrected: ExtractedDates;
  applied: string[];
  confidence: number;
}

export class DateCorrector {
  /**
   * Tente de corriger automatiquement les incohérences
   */
  correct(dates: ExtractedDates, rulesViolated: string[]): CorrectionResult {
    const corrected = { ...dates };
    const applied: string[] = [];
    let confidence = 1.0;

    // Règle : notification doit être après décision
    if (rulesViolated.includes('NOTIFICATION_AFTER_DECISION')) {
      if (dates.decisionDate && !dates.notificationDate) {
        // Si notification manquante, on la déduit de la décision + 1 jour
        const decision = new Date(dates.decisionDate);
        decision.setDate(decision.getDate() + 1);
        corrected.notificationDate = decision.toISOString().split('T')[0];
        applied.push('NOTIFICATION_DEDUCED_FROM_DECISION');
        confidence -= 0.1;
      } else if (dates.decisionDate && dates.notificationDate) {
        // On décale notification après décision
        corrected.notificationDate = dates.decisionDate;
        applied.push('NOTIFICATION_SHIFTED_TO_DECISION');
        confidence -= 0.15;
      }
    }

    // Règle : deadline après notification
    if (rulesViolated.includes('DEADLINE_AFTER_NOTIFICATION')) {
      if (dates.notificationDate && !dates.deadlineDate) {
        // Deadline par défaut : notification + 30 jours
        const notif = new Date(dates.notificationDate);
        notif.setDate(notif.getDate() + 30);
        corrected.deadlineDate = notif.toISOString().split('T')[0];
        applied.push('DEADLINE_DEFAULT_30_DAYS');
        confidence -= 0.2;
      } else if (dates.notificationDate && dates.deadlineDate) {
        // On décale deadline à notification + 30 jours
        const notif = new Date(dates.notificationDate);
        notif.setDate(notif.getDate() + 30);
        corrected.deadlineDate = notif.toISOString().split('T')[0];
        applied.push('DEADLINE_RESET_TO_30_DAYS');
        confidence -= 0.2;
      }
    }

    // Règle : décision pas dans le futur
    if (rulesViolated.includes('DECISION_NOT_FUTURE')) {
      if (dates.decisionDate) {
        const decision = new Date(dates.decisionDate);
        if (decision > new Date()) {
          // On la met à aujourd'hui
          corrected.decisionDate = new Date().toISOString().split('T')[0];
          applied.push('DECISION_SET_TO_TODAY');
          confidence -= 0.1;
        }
      }
    }

    return { corrected, applied, confidence: Math.max(0, confidence) };
  }
}

export const dateCorrector = new DateCorrector();
