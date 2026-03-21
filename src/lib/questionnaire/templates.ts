export interface QuestionnaireQuestion {
  id: string;
  label: string;
  type: 'text' | 'boolean' | 'date' | 'select';
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
    description: 'Questions obligatoires avant clôture d\'un email client',
    questions: [
      {
        id: 'q1',
        label: 'Le besoin client est-il clairement identifié ? ',
        type: 'boolean',
        required: true,
      },
      {
        id: 'q2',
        label: 'Un dossier existant a-t-il été lié ? ',
        type: 'boolean',
        required: true,
      },
      {
        id: 'q3',
        label: 'Prochaine action planifiée',
        type: 'text',
        required: true,
      },
      {
        id: 'q4',
        label: 'Date limite de réponse',
        type: 'date',
        required: false,
      },
    ],
  },
  {
    id: 'q-oqtf-reception',
    eventType: 'oqtf',
    title: 'Qualification OQTF',
    description: 'Qualification initiale d\'un événement OQTF',
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
        label: 'Niveau d\'urgence',
        type: 'select',
        required: true,
        options: ['low', 'medium', 'high', 'critical'],
      },
    ],
  },
];

export function getTemplateForEvent(eventType: string): QuestionnaireTemplate {
  const normalized = eventType.toLowerCase();
  const exact = QUESTIONNAIRE_TEMPLATES.find(template => template.eventType === normalized);

  if (exact) return exact;

  if (normalized.includes('oqtf')) {
    return QUESTIONNAIRE_TEMPLATES[1];
  }

  return QUESTIONNAIRE_TEMPLATES[0];
}
