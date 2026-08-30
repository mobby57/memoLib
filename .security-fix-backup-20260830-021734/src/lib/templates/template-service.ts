/**
 * Système de Templates de Documents
 * Templates personnalisables avec variables et conditions
 */

import Handlebars from 'handlebars';

// ==================== TYPES ====================

export interface TemplateVariable {
  name: string;
  type: 'text' | 'date' | 'number' | 'boolean' | 'list';
  label: string;
  required: boolean;
  defaultValue?: string | number | boolean;
  description?: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  content: string; // Contenu Handlebars
  variables: TemplateVariable[];
  createdAt: Date;
  updatedAt: Date;
  tenantId?: string;
  isSystem: boolean; // Templates système non modifiables
}

export type TemplateCategory =
  | 'courrier'
  | 'contrat'
  | 'facture'
  | 'convocation'
  | 'mise_en_demeure'
  | 'attestation'
  | 'autre';

// ==================== HELPERS HANDLEBARS ====================

// Enregistrer les helpers personnalisés
Handlebars.registerHelper('formatDate', (date: Date | string, format?: string) => {
  if (!date) return '';
  const d = new Date(date);

  if (format === 'long') {
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  return d.toLocaleDateString('fr-FR');
});

Handlebars.registerHelper('formatMoney', (amount: number) => {
  if (typeof amount !== 'number') return '0,00 €';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
});

Handlebars.registerHelper('uppercase', (str: string) => {
  return str?.toUpperCase() || '';
});

Handlebars.registerHelper('lowercase', (str: string) => {
  return str?.toLowerCase() || '';
});

Handlebars.registerHelper('capitalize', (str: string) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
});

Handlebars.registerHelper('if_eq', function(this: unknown, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
  return a === b ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('unless_eq', function(this: unknown, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
  return a !== b ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('if_gt', function(this: unknown, a: number, b: number, options: Handlebars.HelperOptions) {
  return a > b ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('pluralize', (count: number, singular: string, plural: string) => {
  return count === 1 ? singular : plural;
});

Handlebars.registerHelper('today', (format?: string) => {
  const d = new Date();
  if (format === 'long') {
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  return d.toLocaleDateString('fr-FR');
});

Handlebars.registerHelper('addDays', (date: Date | string, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('fr-FR');
});

// ==================== TEMPLATES SYSTÈME ====================

export const SYSTEM_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'sys_courrier_simple',
    name: 'Courrier Simple',
    category: 'courrier',
    description: 'Modèle de courrier standard',
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    variables: [
      { name: 'destinataire_nom', type: 'text', label: 'Nom du destinataire', required: true },
      { name: 'destinataire_adresse', type: 'text', label: 'Adresse', required: true },
      { name: 'objet', type: 'text', label: 'Objet du courrier', required: true },
      { name: 'corps', type: 'text', label: 'Corps du courrier', required: true },
      { name: 'expediteur_nom', type: 'text', label: 'Nom expéditeur', required: true },
      { name: 'expediteur_titre', type: 'text', label: 'Titre/Fonction', required: false },
    ],
    content: `{{expediteur_nom}}
{{#if expediteur_titre}}{{expediteur_titre}}{{/if}}

{{destinataire_nom}}
{{destinataire_adresse}}

Le {{today "long"}}

Objet : {{objet}}

Madame, Monsieur,

{{corps}}

Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

{{expediteur_nom}}`,
  },
  {
    id: 'sys_mise_en_demeure',
    name: 'Mise en demeure',
    category: 'mise_en_demeure',
    description: 'Modèle de mise en demeure de payer',
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    variables: [
      { name: 'debiteur_nom', type: 'text', label: 'Nom du débiteur', required: true },
      { name: 'debiteur_adresse', type: 'text', label: 'Adresse du débiteur', required: true },
      { name: 'montant', type: 'number', label: 'Montant dû', required: true },
      { name: 'date_facture', type: 'date', label: 'Date de la facture', required: true },
      { name: 'numero_facture', type: 'text', label: 'Numéro de facture', required: true },
      { name: 'delai_jours', type: 'number', label: 'Délai (jours)', required: true, defaultValue: 8 },
      { name: 'cabinet_nom', type: 'text', label: 'Nom du cabinet', required: true },
    ],
    content: `{{cabinet_nom}}

LETTRE RECOMMANDÉE AVEC ACCUSÉ DE RÉCEPTION

{{debiteur_nom}}
{{debiteur_adresse}}

Le {{today "long"}}

Objet : MISE EN DEMEURE DE PAYER

Madame, Monsieur,

Malgré nos précédentes relances, nous constatons que vous n'avez toujours pas procédé au règlement de la facture n°{{numero_facture}} du {{formatDate date_facture}}, d'un montant de {{formatMoney montant}}.

Par la présente, nous vous mettons en demeure de procéder au paiement de cette somme dans un délai de {{delai_jours}} jours à compter de la réception de ce courrier, soit au plus tard le {{addDays today delai_jours}}.

À défaut de règlement dans ce délai, nous nous verrons dans l'obligation d'engager une procédure judiciaire à votre encontre, sans autre avis, afin de recouvrer notre créance, majorée des intérêts légaux et des frais de procédure.

Dans l'attente de votre régularisation, nous vous prions d'agréer, Madame, Monsieur, nos salutations distinguées.

{{cabinet_nom}}`,
  },
  {
    id: 'sys_attestation',
    name: 'Attestation',
    category: 'attestation',
    description: 'Modèle d\'attestation générique',
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    variables: [
      { name: 'beneficiaire_civilite', type: 'text', label: 'Civilité (M./Mme)', required: true },
      { name: 'beneficiaire_nom', type: 'text', label: 'Nom complet', required: true },
      { name: 'beneficiaire_date_naissance', type: 'date', label: 'Date de naissance', required: false },
      { name: 'beneficiaire_adresse', type: 'text', label: 'Adresse', required: false },
      { name: 'contenu_attestation', type: 'text', label: 'Contenu de l\'attestation', required: true },
      { name: 'signataire_nom', type: 'text', label: 'Nom du signataire', required: true },
      { name: 'signataire_qualite', type: 'text', label: 'Qualité du signataire', required: true },
    ],
    content: `ATTESTATION

Je soussigné(e), {{signataire_nom}}, agissant en qualité de {{signataire_qualite}}, atteste que :

{{beneficiaire_civilite}} {{uppercase beneficiaire_nom}}
{{#if beneficiaire_date_naissance}}Né(e) le : {{formatDate beneficiaire_date_naissance}}{{/if}}
{{#if beneficiaire_adresse}}Demeurant : {{beneficiaire_adresse}}{{/if}}

{{contenu_attestation}}

Cette attestation est délivrée pour servir et valoir ce que de droit.

Fait à _____________, le {{today "long"}}

{{signataire_nom}}
{{signataire_qualite}}`,
  },
  {
    id: 'sys_convocation',
    name: 'Convocation',
    category: 'convocation',
    description: 'Modèle de convocation à un rendez-vous',
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    variables: [
      { name: 'destinataire_nom', type: 'text', label: 'Nom du destinataire', required: true },
      { name: 'date_rdv', type: 'date', label: 'Date du rendez-vous', required: true },
      { name: 'heure_rdv', type: 'text', label: 'Heure du rendez-vous', required: true },
      { name: 'lieu', type: 'text', label: 'Lieu', required: true },
      { name: 'objet_rdv', type: 'text', label: 'Objet du rendez-vous', required: true },
      { name: 'documents_requis', type: 'list', label: 'Documents à apporter', required: false },
      { name: 'cabinet_nom', type: 'text', label: 'Nom du cabinet', required: true },
      { name: 'cabinet_telephone', type: 'text', label: 'Téléphone', required: true },
    ],
    content: `{{cabinet_nom}}

{{destinataire_nom}}

Le {{today}}

Objet : Convocation

Madame, Monsieur,

Nous avons l'honneur de vous convoquer pour un rendez-vous :

📅 Date : {{formatDate date_rdv "long"}}
🕐 Heure : {{heure_rdv}}
📍 Lieu : {{lieu}}

Objet de l'entretien : {{objet_rdv}}

{{#if documents_requis}}
Nous vous prions de bien vouloir vous munir des documents suivants :
{{#each documents_requis}}
- {{this}}
{{/each}}
{{/if}}

En cas d'empêchement, merci de nous prévenir au plus tôt au {{cabinet_telephone}}.

Dans l'attente de vous rencontrer, nous vous prions d'agréer, Madame, Monsieur, l'expression de nos salutations distinguées.

{{cabinet_nom}}`,
  },
];

// ==================== SERVICE ====================

export class TemplateService {
  private templates: Map<string, DocumentTemplate> = new Map();

  constructor() {
    // Charger les templates système
    for (const template of SYSTEM_TEMPLATES) {
      this.templates.set(template.id, template);
    }
  }

  /**
   * Compiler et rendre un template
   */
  render(templateId: string, data: Record<string, unknown>): string {
    const template = this.templates.get(templateId);

    if (!template) {
      throw new Error(`Template non trouvé: ${templateId}`);
    }

    // Valider les variables requises
    for (const variable of template.variables) {
      if (variable.required && !(variable.name in data)) {
        // Utiliser la valeur par défaut si disponible
        if (variable.defaultValue !== undefined) {
          data[variable.name] = variable.defaultValue;
        } else {
          throw new Error(`Variable requise manquante: ${variable.label}`);
        }
      }
    }

    const compiled = Handlebars.compile(template.content);
    return compiled(data);
  }

  /**
   * Obtenir un template par ID
   */
  getTemplate(templateId: string): DocumentTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Lister tous les templates
   */
  listTemplates(category?: TemplateCategory): DocumentTemplate[] {
    const templates = Array.from(this.templates.values());

    if (category) {
      return templates.filter(t => t.category === category);
    }

    return templates;
  }

  /**
   * Ajouter un template personnalisé
   */
  addTemplate(template: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt' | 'isSystem'>): DocumentTemplate {
    const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newTemplate: DocumentTemplate = {
      ...template,
      id,
      isSystem: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.templates.set(id, newTemplate);
    return newTemplate;
  }

  /**
   * Mettre à jour un template personnalisé
   */
  updateTemplate(templateId: string, updates: Partial<DocumentTemplate>): DocumentTemplate {
    const template = this.templates.get(templateId);

    if (!template) {
      throw new Error(`Template non trouvé: ${templateId}`);
    }

    if (template.isSystem) {
      throw new Error('Les templates système ne peuvent pas être modifiés');
    }

    const updated: DocumentTemplate = {
      ...template,
      ...updates,
      id: template.id, // Préserver l'ID
      isSystem: false,
      updatedAt: new Date(),
    };

    this.templates.set(templateId, updated);
    return updated;
  }

  /**
   * Supprimer un template personnalisé
   */
  deleteTemplate(templateId: string): void {
    const template = this.templates.get(templateId);

    if (!template) {
      throw new Error(`Template non trouvé: ${templateId}`);
    }

    if (template.isSystem) {
      throw new Error('Les templates système ne peuvent pas être supprimés');
    }

    this.templates.delete(templateId);
  }

  /**
   * Prévisualiser un template avec des données
   */
  preview(templateContent: string, data: Record<string, unknown>): string {
    const compiled = Handlebars.compile(templateContent);
    return compiled(data);
  }

  /**
   * Extraire les variables d'un template
   */
  extractVariables(templateContent: string): string[] {
    const regex = /\{\{([^}#/]+)\}\}/g;
    const variables = new Set<string>();

    let match;
    while ((match = regex.exec(templateContent)) !== null) {
      const variable = match[1].trim().split(' ')[0]; // Prendre le premier mot (nom de variable)
      if (!variable.startsWith('!') && !['if', 'unless', 'each', 'with'].includes(variable)) {
        variables.add(variable);
      }
    }

    return Array.from(variables);
  }
}

// Export singleton
export const templateService = new TemplateService();

export default templateService;
