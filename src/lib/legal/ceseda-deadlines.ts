import { nextWorkingDay } from '@/lib/legal/workingDays';

/**
 * Valeurs valides de l'enum Prisma DeadlineType (prisma/schema.prisma).
 * Type local pour garder une securite de type a la compilation sans dependre
 * de l'export de type du client Prisma (non exporte dans cette version).
 */
export type DeadlineType =
  | 'RECOURS_GRACIEUX'
  | 'RECOURS_HIERARCHIQUE'
  | 'RECOURS_CONTENTIEUX'
  | 'APPEL'
  | 'CASSATION'
  | 'REPONSE_PREFECTURE'
  | 'CONVOCATION_AUDIENCE'
  | 'PRODUCTION_PIECES'
  | 'EXECUTION_DECISION'
  | 'OQTF'
  | 'RETENTION'
  | 'CUSTOM';

/**
 * Moteur CESEDA unifié — calcul des délais légaux (droit des étrangers).
 *
 * Ce module est LA source unique de vérité pour les délais CESEDA rattachés à
 * un dossier (utilisé par la chaîne Email -> Dossier). Il remplace le calcul
 * inline qui vivait dans src/app/api/emails/create-dossier/route.ts.
 *
 * Règles :
 *  - `type` est TOUJOURS une valeur valide de l'enum Prisma DeadlineType.
 *    La nature précise (départ volontaire, référé-liberté, OFPRA...) est portée
 *    par `label`.
 *  - Chaque échéance est calculée en jours calendaires (fromDate + N jours) PUIS
 *    reportée au prochain jour ouvré via nextWorkingDay() : un délai ne tombe
 *    jamais un week-end ou un jour férié (cf. src/lib/legal/workingDays.ts).
 */

export interface CesedaDeadline {
  type: DeadlineType;
  label: string;
  dueDate: Date;
}

// Délai calendaire brut, puis report au prochain jour ouvré (week-end + fériés).
function calendarThenWorkingDay(from: Date, days: number): Date {
  return nextWorkingDay(new Date(from.getTime() + days * 86400000));
}

export function getCesedaDeadlines(typeDossier: string, fromDate: Date): CesedaDeadline[] {
  const addDays = (d: Date, days: number) => calendarThenWorkingDay(d, days);

  const deadlines: Record<string, CesedaDeadline[]> = {
    OQTF: [
      { type: 'OQTF', label: 'Délai de départ volontaire (30 jours)', dueDate: addDays(fromDate, 30) },
      { type: 'RECOURS_CONTENTIEUX', label: 'Recours TA contre OQTF (30 jours)', dueDate: addDays(fromDate, 30) },
    ],
    OQTF_SANS_DELAI: [
      { type: 'OQTF', label: '⚠️ URGENT — Recours OQTF sans délai (48h)', dueDate: addDays(fromDate, 2) },
      { type: 'RECOURS_CONTENTIEUX', label: '⚠️ URGENT — Référé-liberté (48h)', dueDate: addDays(fromDate, 2) },
    ],
    IRTF: [
      { type: 'RECOURS_CONTENTIEUX', label: '⚠️ URGENT — Recours IRTF (48h si OQTF sans délai)', dueDate: addDays(fromDate, 2) },
    ],
    Asile: [
      { type: 'PRODUCTION_PIECES', label: 'Dépôt demande OFPRA (21 jours)', dueDate: addDays(fromDate, 21) },
      { type: 'RECOURS_CONTENTIEUX', label: 'Recours CNDA (1 mois)', dueDate: addDays(fromDate, 30) },
    ],
    Asile_accelere: [
      { type: 'RECOURS_CONTENTIEUX', label: '⚠️ URGENT — Recours CNDA procédure accélérée (15 jours)', dueDate: addDays(fromDate, 15) },
    ],
    TitreSejour: [
      { type: 'RECOURS_GRACIEUX', label: 'Recours gracieux préfecture (2 mois)', dueDate: addDays(fromDate, 60) },
      { type: 'RECOURS_CONTENTIEUX', label: 'Recours TA (2 mois)', dueDate: addDays(fromDate, 60) },
    ],
    Naturalisation: [
      { type: 'RECOURS_CONTENTIEUX', label: 'Recours contre refus (2 mois)', dueDate: addDays(fromDate, 60) },
    ],
    AppelDecision: [
      { type: 'APPEL', label: 'Appel CAA (2 mois)', dueDate: addDays(fromDate, 60) },
    ],
    RegroupementFamilial: [
      { type: 'RECOURS_CONTENTIEUX', label: 'Recours contre refus (2 mois)', dueDate: addDays(fromDate, 60) },
    ],
    Refere_suspension: [
      { type: 'RECOURS_CONTENTIEUX', label: '⚠️ URGENT — Référé-suspension (avant exécution)', dueDate: addDays(fromDate, 3) },
    ],
    Refere_liberte: [
      { type: 'RECOURS_CONTENTIEUX', label: '⚠️ URGENT — Référé-liberté (48h)', dueDate: addDays(fromDate, 2) },
    ],
    Retention: [
      { type: 'RETENTION', label: '⚠️ URGENT — Saisine JLD rétention (48h)', dueDate: addDays(fromDate, 2) },
      { type: 'APPEL', label: '⚠️ URGENT — Appel ordonnance JLD (24h)', dueDate: addDays(fromDate, 1) },
    ],
  };

  return deadlines[typeDossier] || [];
}
