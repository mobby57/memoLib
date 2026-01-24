/**
 * Moteur de templates pour generation de documents
 * Supporte les variables dynamiques: {{nom_client}}, {{date}}, etc.
 */

export interface TemplateVariable {
  key: string;
  label: string;
  description?: string;
  type: 'text' | 'date' | 'number' | 'email';
  required?: boolean;
}

export interface DocumentTemplate {
  id: string;
  nom: string;
  categorie: 'contrat' | 'courrier' | 'mise_en_demeure' | 'attestation' | 'autre';
  description?: string;
  contenu: string;
  variables: TemplateVariable[];
  createdAt: Date;
  updatedAt: Date;
}

// Variables globales disponibles dans tous les templates
export const GLOBAL_VARIABLES: TemplateVariable[] = [
  { key: 'cabinet_nom', label: 'Nom du cabinet', type: 'text', required: true },
  { key: 'cabinet_adresse', label: 'Adresse du cabinet', type: 'text', required: true },
  { key: 'cabinet_ville', label: 'Ville du cabinet', type: 'text', required: true },
  { key: 'cabinet_code_postal', label: 'Code postal', type: 'text', required: true },
  { key: 'cabinet_telephone', label: 'Telephone', type: 'text' },
  { key: 'cabinet_email', label: 'Email', type: 'email', required: true },
  { key: 'date_jour', label: 'Date du jour', type: 'date', required: true },
  { key: 'annee', label: 'Annee en cours', type: 'number', required: true },
];

// Variables courantes pour les clients
export const CLIENT_VARIABLES: TemplateVariable[] = [
  { key: 'client_nom', label: 'Nom du client', type: 'text', required: true },
  { key: 'client_prenom', label: 'Prenom du client', type: 'text' },
  { key: 'client_civilite', label: 'Civilite (M./Mme)', type: 'text' },
  { key: 'client_adresse', label: 'Adresse du client', type: 'text' },
  { key: 'client_ville', label: 'Ville du client', type: 'text' },
  { key: 'client_code_postal', label: 'Code postal du client', type: 'text' },
  { key: 'client_email', label: 'Email du client', type: 'email' },
  { key: 'client_telephone', label: 'Telephone du client', type: 'text' },
];

// Variables pour les dossiers
export const DOSSIER_VARIABLES: TemplateVariable[] = [
  { key: 'dossier_reference', label: 'Reference du dossier', type: 'text', required: true },
  { key: 'dossier_titre', label: 'Titre du dossier', type: 'text' },
  { key: 'dossier_type', label: 'Type de dossier', type: 'text' },
  { key: 'dossier_description', label: 'Description', type: 'text' },
  { key: 'dossier_date_ouverture', label: 'Date d\'ouverture', type: 'date' },
];

/**
 * Remplace les variables dans un template
 */
export function renderTemplate(
  template: string,
  values: Record<string, string | number>
): string {
  let result = template;
  
  // Remplacer toutes les variables {{key}}
  Object.entries(values).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, String(value));
  });
  
  return result;
}

/**
 * Extrait toutes les variables utilisees dans un template
 */
export function extractVariables(template: string): string[] {
  const regex = /{{\\s*([^}]+)\\s*}}/g;
  const matches = template.matchAll(regex);
  return Array.from(matches, m => m[1].trim());
}

/**
 * Valide qu'un template a toutes les variables requises remplies
 */
export function validateTemplate(
  template: string,
  values: Record<string, any>,
  requiredVars: TemplateVariable[]
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  requiredVars.forEach(variable => {
    if (variable.required && !values[variable.key]) {
      missing.push(variable.label);
    }
  });
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Formatte une valeur selon son type
 */
export function formatValue(value: any, type: TemplateVariable['type']): string {
  switch (type) {
    case 'date':
      if (value instanceof Date) {
        return value.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
      }
      return String(value);
    
    case 'number':
      return typeof value === 'number' ? value.toLocaleString('fr-FR') : String(value);
    
    case 'email':
    case 'text':
    default:
      return String(value || '');
  }
}

/**
 * Prepare les valeurs par defaut (date du jour, annee, etc.)
 */
export function getDefaultValues(): Record<string, any> {
  const today = new Date();
  
  return {
    date_jour: formatValue(today, 'date'),
    annee: today.getFullYear(),
    cabinet_nom: 'Cabinet Juridique', // a remplacer par les vraies valeurs
    cabinet_adresse: '123 Rue du Droit',
    cabinet_ville: 'Paris',
    cabinet_code_postal: '75001',
    cabinet_email: 'contact@cabinet.fr',
    cabinet_telephone: '01 23 45 67 89',
  };
}

// Templates pre-definis
export const DEFAULT_TEMPLATES: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    nom: 'Contrat de prestation de services',
    categorie: 'contrat',
    description: 'Contrat standard pour prestations juridiques',
    contenu: `CONTRAT DE PRESTATION DE SERVICES

Entre les soussignes :

{{cabinet_nom}}
{{cabinet_adresse}}
{{cabinet_code_postal}} {{cabinet_ville}}
Email : {{cabinet_email}}

Ci-apres denomme "Le Prestataire"

D'une part,

Et :

{{client_civilite}} {{client_nom}} {{client_prenom}}
{{client_adresse}}
{{client_code_postal}} {{client_ville}}
Email : {{client_email}}

Ci-apres denomme "Le Client"

D'autre part,

IL A eTe CONVENU CE QUI SUIT :

Article 1 - Objet du contrat
Le present contrat a pour objet la realisation de prestations juridiques dans le cadre du dossier {{dossier_reference}}.

Article 2 - Obligations du Prestataire
Le Prestataire s'engage a fournir ses services avec diligence et professionnalisme.

Article 3 - Honoraires
Les honoraires seront factures conformement aux conditions convenues.

Fait a {{cabinet_ville}}, le {{date_jour}}

En deux exemplaires originaux.

Le Prestataire                    Le Client`,
    variables: [...GLOBAL_VARIABLES, ...CLIENT_VARIABLES, ...DOSSIER_VARIABLES]
  },
  {
    nom: 'Lettre de mise en demeure',
    categorie: 'mise_en_demeure',
    description: 'Courrier de mise en demeure standard',
    contenu: `{{cabinet_nom}}
{{cabinet_adresse}}
{{cabinet_code_postal}} {{cabinet_ville}}
Tel : {{cabinet_telephone}}

{{client_ville}}, le {{date_jour}}

LETTRE RECOMMANDeE AVEC ACCUSe DE ReCEPTION

{{client_civilite}} {{client_nom}} {{client_prenom}}
{{client_adresse}}
{{client_code_postal}} {{client_ville}}

Objet : Mise en demeure - Dossier {{dossier_reference}}

{{client_civilite}},

Par la presente, nous vous mettons en demeure de bien vouloir proceder au reglement de...

[a completer selon les besoins]

a defaut de regularisation sous un delai de 8 jours a compter de la reception de ce courrier, nous nous verrons contraints d'engager les poursuites judiciaires necessaires.

Veuillez agreer, {{client_civilite}}, l'expression de nos salutations distinguees.

{{cabinet_nom}}`,
    variables: [...GLOBAL_VARIABLES, ...CLIENT_VARIABLES, ...DOSSIER_VARIABLES]
  },
  {
    nom: 'Attestation de suivi juridique',
    categorie: 'attestation',
    description: 'Attestation pour certifier le suivi d\'un dossier',
    contenu: `ATTESTATION DE SUIVI JURIDIQUE

Je soussigne(e), representant(e) de {{cabinet_nom}}, atteste par la presente que :

{{client_civilite}} {{client_nom}} {{client_prenom}}
Demeurant a {{client_adresse}}, {{client_code_postal}} {{client_ville}}

Fait l'objet d'un suivi juridique par notre cabinet dans le cadre du dossier reference {{dossier_reference}}.

Ce dossier, ouvert le {{dossier_date_ouverture}}, concerne : {{dossier_type}}.

La presente attestation est delivree pour servir et valoir ce que de droit.

Fait a {{cabinet_ville}}, le {{date_jour}}

{{cabinet_nom}}
{{cabinet_adresse}}
{{cabinet_code_postal}} {{cabinet_ville}}
Tel : {{cabinet_telephone}}
Email : {{cabinet_email}}`,
    variables: [...GLOBAL_VARIABLES, ...CLIENT_VARIABLES, ...DOSSIER_VARIABLES]
  },
  {
    nom: 'Courrier simple client',
    categorie: 'courrier',
    description: 'Modele de courrier simple pour communication client',
    contenu: `{{cabinet_nom}}
{{cabinet_adresse}}
{{cabinet_code_postal}} {{cabinet_ville}}
Tel : {{cabinet_telephone}}
Email : {{cabinet_email}}

{{cabinet_ville}}, le {{date_jour}}

{{client_civilite}} {{client_nom}} {{client_prenom}}
{{client_adresse}}
{{client_code_postal}} {{client_ville}}

Objet : {{dossier_titre}}
Ref. : {{dossier_reference}}

{{client_civilite}},

[Inserer le corps du courrier ici]

Restant a votre disposition pour toute information complementaire, je vous prie d'agreer, {{client_civilite}}, l'expression de mes salutations distinguees.

{{cabinet_nom}}`,
    variables: [...GLOBAL_VARIABLES, ...CLIENT_VARIABLES, ...DOSSIER_VARIABLES]
  }
];
