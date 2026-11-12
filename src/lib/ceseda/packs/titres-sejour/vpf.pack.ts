import type { LegalPack } from '../../types';

export const vpfPack: LegalPack = {
  id: 'titres-sejour.vpf',
  label: 'Titre de séjour - Vie Privée et Familiale',
  article: 'L.423-23 CESEDA',
  category: 'titres-sejour',
  description:
    'Demande ou renouvellement d\'un titre de séjour "vie privée et familiale" (conjoint de Français, parent d\'enfant français, liens personnels anciens).',

  deadlines: [
    {
      id: 'instruction',
      label: 'Délai d\'instruction préfecture',
      duration: { months: 4 },
      trigger: 'dateDepot',
      type: 'instruction',
      article: 'R.431-6 CESEDA',
      criticality: 'info',
    },
    {
      id: 'recours-silence',
      label: 'Recours contre silence (2 mois)',
      duration: { months: 2 },
      trigger: 'finInstruction',
      type: 'recours',
      court: 'TA',
      article: 'L.231-4 CRPA',
      criticality: 'warning',
    },
    {
      id: 'renouvellement',
      label: 'Renouvellement (2 mois avant expiration)',
      duration: { months: -2 },
      trigger: 'dateExpiration',
      type: 'action',
      article: 'L.433-1 CESEDA',
      criticality: 'critical',
    },
  ],

  documents: [
    'Passeport en cours de validité',
    'Justificatif de vie privée et familiale (acte de mariage, PACS, acte de naissance enfant, etc.)',
    'Justificatif de domicile (-3 mois)',
    '3 photos d\'identité récentes',
    'Formulaire cerfa 15276*03',
    'Timbre fiscal (225 €)',
  ],

  intakeQuestions: [
    {
      id: 'motifVPF',
      question: 'Quel est le motif de vie privée et familiale ?',
      type: 'choice',
      options: [
        'Conjoint(e) de Français',
        'Parent d\'enfant français',
        'Liens personnels anciens',
        'Autre',
      ],
      required: true,
    },
    {
      id: 'dateMariage',
      question: 'Date de mariage / PACS (si applicable) ?',
      type: 'date',
    },
    {
      id: 'dateArriveeFrance',
      question: 'Date d\'arrivée en France ?',
      type: 'date',
      required: true,
    },
  ],

  riskPatterns: [
    {
      regex: 'vie priv[ée]e.{0,20}familiale',
      level: 'high',
      action: 'pack VPF',
    },
    { regex: 'conjoint.{0,10}fran[çc]ais', level: 'high', action: 'pack VPF' },
    { regex: 'parent.{0,10}enfant.{0,10}fran[çc]ais', level: 'high', action: 'pack VPF' },
  ],
};