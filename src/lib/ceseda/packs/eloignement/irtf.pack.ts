import type { LegalPack } from '../../types';

export const irtfPack: LegalPack = {
  id: 'eloignement.irtf',
  label: 'Interdiction de Retour sur le Territoire Français',
  article: 'L.612-6 CESEDA',
  category: 'eloignement',
  description:
    'IRTF prononcée avec ou sans OQTF. Contestation possible devant le TA.',
  deadlines: [
    {
      id: 'recours-irtf',
      label: 'Recours contentieux TA (2 mois)',
      duration: { months: 2 },
      trigger: 'dateNotification',
      type: 'recours',
      court: 'TA',
      article: 'L.612-6 CESEDA',
      criticality: 'high',
    },
    {
      id: 'demande-abrogation',
      label: 'Demande d\'abrogation possible après 1 an',
      duration: { years: 1 },
      trigger: 'dateNotification',
      type: 'action',
      criticality: 'info',
    },
  ],
  documents: [
    'Décision IRTF',
    'Justificatif de la date de notification',
    'Éléments de vie privée/familiale en France',
  ],
  intakeQuestions: [
    { id: 'dateNotification', question: 'Date de notification de l\'IRTF ?', type: 'date', required: true },
    { id: 'dureeIRTF', question: 'Durée de l\'IRTF (années) ?', type: 'number', required: true },
  ],
  riskPatterns: [
    { regex: 'IRTF|interdiction.{0,20}retour', level: 'high', action: 'pack IRTF' },
  ],
};