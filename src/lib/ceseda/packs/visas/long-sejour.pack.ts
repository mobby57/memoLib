import type { LegalPack } from '../../types';

export const visaLongSejourPack: LegalPack = {
  id: 'visas.long-sejour',
  label: 'Visa long séjour (VLS-TS)',
  article: 'L.311-1 CESEDA',
  category: 'visas',
  description:
    'Demande de visa long séjour valant titre de séjour (VLS-TS) : études, travail, famille.',
  deadlines: [
    {
      id: 'instruction-consulat',
      label: 'Instruction consulat (3 semaines)',
      duration: { weeks: 3 },
      trigger: 'dateDepot',
      type: 'instruction',
      court: 'Consulat',
      criticality: 'info',
    },
    {
      id: 'recours-crv',
      label: 'Recours CRV (2 mois)',
      duration: { months: 2 },
      trigger: 'dateNotification',
      type: 'recours',
      court: 'CRV',
      article: 'L.312-1 CESEDA',
      criticality: 'warning',
    },
    {
      id: 'recours-ta',
      label: 'Recours TA (2 mois, si CRV épuisé)',
      duration: { months: 2 },
      trigger: 'dateAudience',
      type: 'recours',
      court: 'TA',
      criticality: 'warning',
    },
  ],
  documents: [
    'Formulaire de demande de visa',
    'Passeport en cours de validité',
    'Justificatif du motif du séjour (acceptation université, contrat de travail, etc.)',
    'Justificatif de ressources financières',
    'Justificatif de logement en France',
    'Assurance voyage',
    'Photos d\'identité aux normes Schengen',
  ],
  intakeQuestions: [
    {
      id: 'motifVisa',
      question: 'Motif du visa ?',
      type: 'choice',
      options: ['Études', 'Travail', 'Famille', 'Visiteur'],
      required: true,
    },
    {
      id: 'dateDepotConsulat',
      question: 'Date de dépôt au consulat ?',
      type: 'date',
    },
  ],
  riskPatterns: [
    { regex: 'visa.{0,20}long.{0,20}s[ée]jour|VLS-TS', level: 'high', action: 'pack visa long séjour' },
    { regex: 'refus.{0,20}visa|recours.{0,20}CRV', level: 'medium', action: 'pack visa long séjour' },
  ],
};