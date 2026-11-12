import type {
  LegalPack,
  DeadlineRule,
  Duration,
  ComputedDeadline,
  DossierDates,
  DeadlineTrigger,
} from '../types';

/**
 * Applique une durée à une date de référence.
 * Gère les durées négatives (avant la date).
 */
export function applyDuration(baseDate: Date, duration: Duration): Date {
  // ⚠️ Travail en UTC pour éviter les dérives de fuseau horaire.
  // Pour un délai de 48h (OQTF), 1h de décalage peut être critique.
  const result = new Date(baseDate);

  if (duration.years) {
    result.setUTCFullYear(result.getUTCFullYear() + duration.years);
  }
  if (duration.months) {
    // Gestion des fins de mois : 31 janv + 1 mois doit donner 28/29 févr
    const targetMonth = result.getUTCMonth() + duration.months;
    const originalDay = result.getUTCDate();
    result.setUTCDate(1);
    result.setUTCMonth(targetMonth);
    const daysInTargetMonth = new Date(
      Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)
    ).getUTCDate();
    result.setUTCDate(Math.min(originalDay, daysInTargetMonth));
  }
  if (duration.weeks) {
    result.setUTCDate(result.getUTCDate() + duration.weeks * 7);
  }
  if (duration.days) {
    result.setUTCDate(result.getUTCDate() + duration.days);
  }

  return result;
}

/**
 * Résout la date de déclenchement selon la règle.
 * Retourne null si la date requise n'est pas disponible.
 */
function resolveTrigger(rule: DeadlineRule, dates: DossierDates): Date | null {
  const map: Record<DeadlineTrigger, Date | undefined> = {
    dateDepot: dates.dateDepot,
    dateNotification: dates.dateNotification,
    dateExpiration: dates.dateExpiration,
    dateAudience: dates.dateAudience,
    finInstruction: dates.finInstruction,
  };
  return map[rule.trigger] ?? null;
}

/**
 * Calcule toutes les échéances d'un dossier selon un pack.
 */
export function computeDeadlines(
  pack: LegalPack,
  dates: DossierDates,
  now: Date = new Date()
): ComputedDeadline[] {
  const results: ComputedDeadline[] = [];

  for (const rule of pack.deadlines) {
    const trigger = resolveTrigger(rule, dates);
    if (!trigger) continue;

    const dueDate = applyDuration(trigger, rule.duration);
    const diffMs = dueDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    results.push({
      id: rule.id,
      packId: pack.id,
      label: rule.label,
      dueDate,
      type: rule.type,
      court: rule.court,
      article: rule.article,
      criticality: rule.criticality ?? 'warning',
      daysRemaining,
    });
  }

  // Trier par urgence (échéances proches d'abord)
  return results.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

/**
 * Retourne les échéances critiques (< 7 jours).
 */
export function getUrgentDeadlines(deadlines: ComputedDeadline[]): ComputedDeadline[] {
  return deadlines.filter((d) => d.daysRemaining <= 7 && d.daysRemaining >= 0);
}