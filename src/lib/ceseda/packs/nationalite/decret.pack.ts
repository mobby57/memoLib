import type { LegalPack } from '../../types';

export const decretNationalitePack: LegalPack = {
  id: 'nationalite.decret',
  label: 'Naturalisation par décret',
  article: 'L.21-1 à L.21-27 Code civil',
  category: 'nationalite',
  description:
    'Demande d\'acquisition de la nationalité française par décret (naturalisation, réintégration).',
  deadlines: [
    {
      id: 'instruction-sdanf',
      label: 'Instruction SDANF (12-18 mois)',
      duration: { months: 18 },
      trigger: 'dateDepot',
      type: 'instruction',
      court: 'SDANF',
      article: 'Décret n°93-1362 du 30 déc. 1993',
      criticality: 'info',
    },
    {
      id: 'recours-ta',
      label: 'Recours TA (2 mois)',
      duration: { months: 2 },
      trigger: 'dateNotification',
      type: 'recours',
      court: 'TA',
      criticality: 'warning',
    },
    {
      id: 'recours-ce',
      label: 'Recours Conseil d\'État (2 mois)',
      duration: { months: 2 },
      trigger: 'dateAudience',
      type: 'recours',
      court: 'CE',
      criticality: 'warning',
    },
  ],
  documents: [
    'Formulaire cerfa 12753*03',
    'Passeport en cours de validité',
    'Acte de naissance (traduit si nécessaire)',
    'Justificatif de domicile (-3 mois)',
    'Justificatif de séjour régulier (5 ans min)',
    'Justificatifs de ressources (3 ans)',
    'Justificatif de niveau B1 français (DELF B1, TCF...)',
    'Casier judiciaire',
    '3 photos d\'identité',
  ],
  intakeQuestions: [
    {
      id: 'motifDemande',
      question: 'Motif de la demande ?',
      type: 'choice',
      options: ['Naturalisation', 'Réintégration', 'Déclaration (mariage)'],
      required: true,
    },
    {
      id: 'dateArriveeFrance',
      question: 'Date d\'arrivée en France ?',
      type: 'date',
      required: true,
    },
    {
      id: 'niveauFrancais',
      question: 'Niveau de français ?',
      type: 'choice',
      options: ['B1', 'B2', 'C1', 'C2'],
      required: true,
    },
  ],
  riskPatterns: [
    { regex: 'naturalisation|nationalit[ée].{0,20}fran[çc]aise', level: 'high', action: 'pack nationalité' },
    { regex: 'SDANF|d[ée]cret.{0,10}naturalisation', level: 'medium', action: 'pack nationalité' },
  ],
};