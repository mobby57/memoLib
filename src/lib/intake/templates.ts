import type { IntakeFieldDef } from '@/lib/services/intake.service';

/**
 * Templates d'intake par type de procédure : champs attendus + documents requis.
 * Source unique utilisée par le webhook Sheet ET le formulaire UI, pour que la
 * complétude soit calculée de façon cohérente.
 */

export interface IntakeTemplate {
  type: string;
  title: string;
  fields: IntakeFieldDef[];
  documents: string[];
}

export const INTAKE_TEMPLATES: Record<string, IntakeTemplate> = {
  OQTF: {
    type: 'OQTF',
    title: 'Demande OQTF',
    fields: [
      { id: 'nom', label: 'Nom complet', type: 'text', required: true },
      { id: 'dateNaissance', label: 'Date de naissance', type: 'date', required: true },
      { id: 'nationalite', label: 'Nationalité', type: 'text', required: true },
      { id: 'dateNotification', label: 'Date notification OQTF', type: 'date', required: true },
      { id: 'delai', label: 'Délai accordé', type: 'select', required: true },
      { id: 'adresse', label: 'Adresse actuelle', type: 'text', required: true },
    ],
    documents: ['Copie OQTF', 'Passeport', 'Justificatif de domicile'],
  },
  Asile: {
    type: 'Asile',
    title: "Demande d'asile",
    fields: [
      { id: 'nom', label: 'Nom complet', type: 'text', required: true },
      { id: 'dateNaissance', label: 'Date de naissance', type: 'date', required: true },
      { id: 'nationalite', label: 'Nationalité', type: 'text', required: true },
      { id: 'typePersecution', label: 'Type de persécution', type: 'select', required: true },
      { id: 'dateArrivee', label: 'Date arrivée en France', type: 'date', required: true },
    ],
    documents: ['Récit de vie', "Preuve d'entrée sur le territoire"],
  },
  TitreSejour: {
    type: 'TitreSejour',
    title: 'Titre de séjour',
    fields: [
      { id: 'nom', label: 'Nom complet', type: 'text', required: true },
      { id: 'dateNaissance', label: 'Date de naissance', type: 'date', required: true },
      { id: 'nationalite', label: 'Nationalité', type: 'text', required: true },
      { id: 'typeTitre', label: 'Type de titre demandé', type: 'select', required: true },
      { id: 'prefecture', label: 'Préfecture compétente', type: 'text', required: true },
    ],
    documents: ['Passeport', 'Justificatif de domicile', 'Photos d’identité'],
  },
};

const DEFAULT_TEMPLATE: IntakeTemplate = INTAKE_TEMPLATES.OQTF;

/** Résout le template pour un type d'intake (insensible à la casse, fallback OQTF). */
export function getTemplateForIntakeType(type: string): IntakeTemplate {
  const normalized = (type || '').trim().toLowerCase();
  const match = Object.values(INTAKE_TEMPLATES).find((t) => t.type.toLowerCase() === normalized);
  if (match) return match;
  if (normalized.includes('oqtf')) return INTAKE_TEMPLATES.OQTF;
  if (normalized.includes('asile')) return INTAKE_TEMPLATES.Asile;
  if (normalized.includes('sejour') || normalized.includes('séjour')) return INTAKE_TEMPLATES.TitreSejour;
  return DEFAULT_TEMPLATE;
}
