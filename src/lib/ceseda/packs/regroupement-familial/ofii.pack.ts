import type { LegalPack } from '../../types';

export const regroupementFamilialPack: LegalPack = {
  id: 'regroupement-familial.ofii',
  label: 'Regroupement familial - OFII',
  article: 'L.434-1 CESEDA',
  category: 'regroupement-familial',
  description:
    'Procédure de regroupement familial pour conjoint et enfants mineurs.',
  deadlines: [
    {
      id: 'instruction-ofii',
      label: 'Instruction OFII (6 mois)',
      duration: { months: 6 },
      trigger: 'dateDepot',
      type: 'instruction',
      court: 'OFII',
      article: 'R.421-4 CESEDA',
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
      id: 'depot-dossier-maire',
      label: 'Dépôt dossier en mairie',
      duration: { months: 3 },
      trigger: 'dateNotification',
      type: 'action',
      criticality: 'high',
    },
  ],
  documents: [
    'Formulaire cerfa 11436*05',
    'Justificatif de séjour stable et ancien',
    'Justificatif de ressources (SMIC annuel)',
    'Justificatif de logement',
    'Acte de mariage',
    'Actes de naissance des enfants',
  ],
  intakeQuestions: [
    {
      id: 'lienParente',
      question: 'Lien de parenté avec la personne à rejoindre ?',
      type: 'choice',
      options: ['Conjoint', 'Enfant', 'Parent'],
      required: true,
    },
    { id: 'dateMariage', question: 'Date de mariage (si conjoint) ?', type: 'date' },
  ],
  riskPatterns: [
    { regex: 'regroupement.{0,20}familial', level: 'high', action: 'pack regroupement familial' },
    { regex: 'OFII', level: 'medium', action: 'pack regroupement familial' },
  ],
};