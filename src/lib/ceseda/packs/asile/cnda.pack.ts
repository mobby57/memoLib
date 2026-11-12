import type { LegalPack } from '../../types';

export const cndaPack: LegalPack = {
  id: 'asile.cnda',
  label: 'Recours CNDA',
  article: 'L.532-1 CESEDA',
  category: 'asile',
  description:
    'Recours contre une décision OFPRA devant la Cour Nationale du Droit d\'Asile.',
  deadlines: [
    {
      id: 'recours-cnda',
      label: 'Recours CNDA (21 jours)',
      duration: { days: 21 },
      trigger: 'dateNotification',
      type: 'recours',
      court: 'CNDA',
      article: 'L.532-1 CESEDA',
      criticality: 'critical',
    },
    {
      id: 'audience-cnda',
      label: 'Convocation audience CNDA',
      duration: { months: 4 },
      trigger: 'dateDepot',
      type: 'audience',
      court: 'CNDA',
      criticality: 'warning',
    },
    {
      id: 'decision-cnda',
      label: 'Décision CNDA (5 mois)',
      duration: { months: 5 },
      trigger: 'dateDepot',
      type: 'instruction',
      court: 'CNDA',
      criticality: 'info',
    },
  ],
  documents: [
    'Décision OFPRA',
    'Récit détaillé et signé',
    'Justificatif d\'identité',
    'Preuves des persécutions',
    'Formulaire de recours CNDA',
  ],
  intakeQuestions: [
    { id: 'paysOrigine', question: 'Pays d\'origine ?', type: 'text', required: true },
    { id: 'dateOFPRA', question: 'Date de décision OFPRA ?', type: 'date', required: true },
  ],
  riskPatterns: [
    { regex: 'CNDA|cour.{0,20}nationale.{0,20}asile', level: 'critical', action: 'pack asile CNDA' },
    { regex: 'OFPRA|office.{0,20}fran[çc]ais.{0,20}protection', level: 'high', action: 'pack asile CNDA' },
  ],
};