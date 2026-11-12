import type { LegalPack } from '../../types';

export const oqtf48hPack: LegalPack = {
  id: 'eloignement.oqtf-48h',
  label: 'OQTF - Délai de 48h',
  article: 'L.612-1 CESEDA',
  category: 'eloignement',
  description:
    'Obligation de Quitter le Territoire Français avec délai de départ volontaire de 48h. Recours contentieux possible dans les 48h devant le TA.',

  deadlines: [
    {
      id: 'recours-ta',
      label: 'Recours contentieux TA (48h)',
      duration: { days: 2 },
      trigger: 'dateNotification',
      type: 'recours',
      court: 'TA',
      article: 'L.614-1 CESEDA',
      criticality: 'critical',
    },
    {
      id: 'depart-volontaire',
      label: 'Départ volontaire (48h)',
      duration: { days: 2 },
      trigger: 'dateNotification',
      type: 'action',
      criticality: 'critical',
    },
    {
      id: 'decision-ta',
      label: 'Décision du TA (72h après audience)',
      duration: { days: 3 },
      trigger: 'dateAudience',
      type: 'audience',
      court: 'TA',
      article: 'L.614-3 CESEDA',
      criticality: 'warning',
    },
  ],

  documents: [
    'OQTF notifiée',
    'Justificatif de la date de notification',
    'Passeport',
    'Justificatif de domicile',
    'Éléments prouvant l\'atteinte disproportionnée à la vie privée/familiale',
    'Justificatifs médicaux (si applicable)',
    'Requête TA en référé',
  ],

  intakeQuestions: [
    {
      id: 'dateNotification',
      question: 'Date de notification de l\'OQTF ?',
      type: 'date',
      required: true,
    },
    {
      id: 'motifOQTF',
      question: 'Motif de l\'OQTF ?',
      type: 'choice',
      options: [
        'Séjour irrégulier',
        'Menace à l\'ordre public',
        'Signalement par un tiers',
        'Autre',
      ],
      required: true,
    },
    {
      id: 'aFamilleFrance',
      question: 'Avez-vous de la famille en France ?',
      type: 'boolean',
      required: true,
    },
  ],

  riskPatterns: [
    { regex: 'OQTF|obligation.{0,20}quitter.{0,20}fran[çc]ais', level: 'critical', action: 'pack OQTF 48h' },
    { regex: 'd[ée]lai.{0,10}48h', level: 'critical', action: 'pack OQTF 48h' },
    { regex: 'd[ée]part.{0,10}volontaire', level: 'high', action: 'pack OQTF 48h' },
  ],
};