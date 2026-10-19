export interface QuestionnaireQuestion {
  id: string;
  label: string;
  type: 'text' | 'boolean' | 'date' | 'select' | 'dossier-select';
  required: boolean;
  options?: string[];
}

export interface QuestionnaireTemplate {
  id: string;
  eventType: string;
  title: string;
  description: string;
  questions: QuestionnaireQuestion[];
}

export const QUESTIONNAIRE_TEMPLATES: QuestionnaireTemplate[] = [
  {
    id: 'q-email-client-cloture',
    eventType: 'email-client',
    title: 'Clôture email client',
    description: "Validez ces points avant de clôturer l'email. Le dossier lié sera réellement associé.",
    questions: [
      {
        id: 'q1_besoin',
        label: 'Décrivez le besoin client identifié',
        type: 'text',
        required: true,
      },
      {
        id: 'q2_dossierId',
        label: 'Dossier à lier',
        type: 'dossier-select',
        required: true,
      },
      {
        id: 'q3_prochaineAction',
        label: 'Prochaine action planifiée',
        type: 'text',
        required: true,
      },
      {
        id: 'q4_dateLimite',
        label: 'Date limite de réponse',
        type: 'date',
        required: true,
      },
      {
        id: 'q5_statut',
        label: 'Statut de clôture',
        type: 'select',
        required: true,
        options: ['Résolu', 'En attente client', 'Escaladé', 'Sans suite'],
      },
      {
        id: 'q6_resume',
        label: 'Résumé de la clôture',
        type: 'text',
        required: true,
      },
    ],
  },
  {
    id: 'q-oqtf-reception',
    eventType: 'oqtf',
    title: 'Qualification OQTF',
    description: "Qualification initiale d'un événement OQTF",
    questions: [
      {
        id: 'oqtf-1',
        label: 'Date de notification confirmée',
        type: 'date',
        required: true,
      },
      {
        id: 'oqtf-2',
        label: 'Présence de pièces justificatives',
        type: 'boolean',
        required: true,
      },
      {
        id: 'oqtf-3',
        label: "Niveau d'urgence",
        type: 'select',
        required: true,
        options: ['low', 'medium', 'high', 'critical'],
      },
    ],
  },
];

export function getTemplateForEvent(eventType: string): QuestionnaireTemplate {
  const normalized = eventType.toLowerCase();
  const exact = QUESTIONNAIRE_TEMPLATES.find((t) => t.eventType === normalized);
  if (exact) return exact;
  if (normalized.includes('oqtf')) return QUESTIONNAIRE_TEMPLATES[1];
  return QUESTIONNAIRE_TEMPLATES[0];
}
