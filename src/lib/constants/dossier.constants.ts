/**
 * Constantes centralisees pour les dossiers
 * Mapping entre valeurs DB (snake_case) et UI (SCREAMING_CASE)
 */

// Statuts dans la base de donnees
export const STATUTS_DB = {
  EN_COURS: 'en_cours',
  EN_ATTENTE: 'en_attente',
  URGENT: 'urgent',
  TERMINE: 'termine',
  ARCHIVE: 'archive',
  SUSPENDU: 'suspendu',
} as const

// Statuts pour l'interface utilisateur
export const STATUTS_UI = {
  BROUILLON: 'BROUILLON',
  EN_COURS: 'EN_COURS',
  EN_ATTENTE: 'EN_ATTENTE',
  URGENT: 'URGENT',
  TERMINE: 'TERMINE',
  REJETE: 'REJETE',
  ANNULE: 'ANNULE',
} as const

// Priorites dans la base de donnees
export const PRIORITES_DB = {
  BASSE: 'basse',
  NORMALE: 'normale',
  HAUTE: 'haute',
  CRITIQUE: 'critique',
} as const

// Priorites pour l'interface utilisateur
export const PRIORITES_UI = {
  NORMALE: 'NORMALE',
  HAUTE: 'HAUTE',
  URGENTE: 'URGENTE',
  CRITIQUE: 'CRITIQUE',
} as const

// Types de dossiers
export const TYPES_DOSSIER = {
  TITRE_SEJOUR: 'TITRE_SEJOUR',
  RECOURS_OQTF: 'RECOURS_OQTF',
  NATURALISATION: 'NATURALISATION',
  REGROUPEMENT_FAMILIAL: 'REGROUPEMENT_FAMILIAL',
  ASILE: 'ASILE',
  VISA: 'VISA',
  AUTRE: 'AUTRE',
} as const

// Labels lisibles pour les types
export const TYPE_LABELS: Record<string, string> = {
  [TYPES_DOSSIER.TITRE_SEJOUR]: 'Titre de Sejour',
  [TYPES_DOSSIER.RECOURS_OQTF]: 'Recours OQTF',
  [TYPES_DOSSIER.NATURALISATION]: 'Naturalisation',
  [TYPES_DOSSIER.REGROUPEMENT_FAMILIAL]: 'Regroupement Familial',
  [TYPES_DOSSIER.ASILE]: 'Demande d\'Asile',
  [TYPES_DOSSIER.VISA]: 'Visa',
  [TYPES_DOSSIER.AUTRE]: 'Autre',
}

// Couleurs pour les statuts
export const STATUT_COLORS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  BROUILLON: 'default',
  EN_COURS: 'info',
  EN_ATTENTE: 'warning',
  URGENT: 'danger',
  TERMINE: 'success',
  REJETE: 'danger',
  ANNULE: 'default',
}

// Couleurs pour les priorites
export const PRIORITE_COLORS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  NORMALE: 'default',
  HAUTE: 'warning',
  URGENTE: 'warning',
  CRITIQUE: 'danger',
}

// Mappers bidirectionnels
export const mapStatutToUI = (statut: string): string => {
  const map: Record<string, string> = {
    'en_cours': STATUTS_UI.EN_COURS,
    'en_attente': STATUTS_UI.EN_ATTENTE,
    'urgent': STATUTS_UI.URGENT,
    'termine': STATUTS_UI.TERMINE,
    'archive': STATUTS_UI.ANNULE,
    'suspendu': STATUTS_UI.EN_ATTENTE,
  }
  return map[statut] || STATUTS_UI.EN_COURS
}

export const mapStatutToDB = (statut: string): string => {
  const map: Record<string, string> = {
    'BROUILLON': STATUTS_DB.EN_COURS,
    'EN_COURS': STATUTS_DB.EN_COURS,
    'EN_ATTENTE': STATUTS_DB.EN_ATTENTE,
    'URGENT': STATUTS_DB.URGENT,
    'TERMINE': STATUTS_DB.TERMINE,
    'REJETE': STATUTS_DB.TERMINE,
    'ANNULE': STATUTS_DB.ARCHIVE,
  }
  return map[statut] || STATUTS_DB.EN_COURS
}

export const mapPrioriteToUI = (priorite: string): string => {
  const map: Record<string, string> = {
    'basse': PRIORITES_UI.NORMALE,
    'normale': PRIORITES_UI.NORMALE,
    'haute': PRIORITES_UI.HAUTE,
    'critique': PRIORITES_UI.CRITIQUE,
  }
  return map[priorite] || PRIORITES_UI.NORMALE
}

export const mapPrioriteToDB = (priorite: string): string => {
  const map: Record<string, string> = {
    'NORMALE': PRIORITES_DB.NORMALE,
    'HAUTE': PRIORITES_DB.HAUTE,
    'URGENTE': PRIORITES_DB.HAUTE,
    'CRITIQUE': PRIORITES_DB.CRITIQUE,
  }
  return map[priorite] || PRIORITES_DB.NORMALE
}

// Types TypeScript pour validation
export type StatutDB = typeof STATUTS_DB[keyof typeof STATUTS_DB]
export type StatutUI = typeof STATUTS_UI[keyof typeof STATUTS_UI]
export type PrioriteDB = typeof PRIORITES_DB[keyof typeof PRIORITES_DB]
export type PrioriteUI = typeof PRIORITES_UI[keyof typeof PRIORITES_UI]
export type TypeDossier = typeof TYPES_DOSSIER[keyof typeof TYPES_DOSSIER]
