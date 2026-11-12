import type { LegalPack } from '../../types';

export const salariePack: LegalPack = {
  id: 'titres-sejour.salarie',
  label: 'Titre de séjour - Salarié',
  article: 'L.421-1 CESEDA',
  category: 'titres-sejour',
  description:
    'Demande ou renouvellement d\'un titre de séjour "salarié" pour un emploi en CDI ou CDD.',

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
      label: 'Recours contre refus ou silence',
      duration: { months: 2 },
      trigger: 'finInstruction',
      type: 'recours',
      court: 'TA',
      criticality: 'warning',
    },
    {
      id: 'renouvellement',
      label: 'Renouvellement (2 mois avant expiration)',
      duration: { months: -2 },
      trigger: 'dateExpiration',
      type: 'action',
      criticality: 'critical',
    },
    {
      id: 'autorisation-travail',
      label: 'Validité autorisation de travail',
      duration: { months: 12 },
      trigger: 'dateDepot',
      type: 'action',
      article: 'R.5221-35 Code du travail',
      criticality: 'warning',
    },
  ],

  documents: [
    'Passeport en cours de validité',
    'Contrat de travail (CDI ou CDD)',
    '3 derniers bulletins de salaire',
    'Attestation employeur cerfa 15187*01',
    'Justificatif de domicile (-3 mois)',
    'Formulaire cerfa 15976*02',
    '3 photos d\'identité',
    'Timbre fiscal (225 €)',
  ],

  intakeQuestions: [
    {
      id: 'typeContrat',
      question: 'Type de contrat ?',
      type: 'choice',
      options: ['CDI', 'CDD'],
      required: true,
    },
    {
      id: 'salaireBrut',
      question: 'Salaire brut mensuel (€) ?',
      type: 'number',
      required: true,
    },
    {
      id: 'dateDebutContrat',
      question: 'Date de début du contrat ?',
      type: 'date',
      required: true,
    },
    {
      id: 'employeur',
      question: 'Nom de l\'employeur ?',
      type: 'text',
      required: true,
    },
  ],

  riskPatterns: [
    { regex: 'titre.{0,20}salari[ée]', level: 'high', action: 'pack salarié' },
    { regex: 'autorisation.{0,20}travail', level: 'medium', action: 'pack salarié' },
    { regex: 'contrat.{0,10}(CDI|CDD)', level: 'medium', action: 'pack salarié' },
  ],
};