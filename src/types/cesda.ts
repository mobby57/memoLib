// ============================================
// TYPES CESEDA - memoLib
// ============================================

/**
 * Types de procedures CESDA supportees
 */
export enum ProcedureType {
  OQTF = 'OQTF',
  REFUS_TITRE = 'REFUS_TITRE',
  RETRAIT_TITRE = 'RETRAIT_TITRE',
  ASILE = 'ASILE',
  REGROUPEMENT_FAMILIAL = 'REGROUPEMENT_FAMILIAL',
  NATURALISATION = 'NATURALISATION',
}

/**
 * Libelles francais des procedures
 */
export const PROCEDURE_LABELS: Record<ProcedureType, string> = {
  [ProcedureType.OQTF]: 'OQTF (Obligation de Quitter le Territoire Francais)',
  [ProcedureType.REFUS_TITRE]: 'Refus de Titre de Sejour',
  [ProcedureType.RETRAIT_TITRE]: 'Retrait de Titre de Sejour',
  [ProcedureType.ASILE]: "Demande d'Asile",
  [ProcedureType.REGROUPEMENT_FAMILIAL]: 'Regroupement Familial',
  [ProcedureType.NATURALISATION]: 'Naturalisation Francaise',
};

/**
 * Couleurs associees aux procedures
 */
export const PROCEDURE_COLORS: Record<ProcedureType, string> = {
  [ProcedureType.OQTF]: '#B91C1C', // Rouge bordeaux
  [ProcedureType.REFUS_TITRE]: '#CA8A04', // Or
  [ProcedureType.RETRAIT_TITRE]: '#EA580C', // Orange fonce
  [ProcedureType.ASILE]: '#1E40AF', // Bleu profond
  [ProcedureType.REGROUPEMENT_FAMILIAL]: '#7C3AED', // Violet
  [ProcedureType.NATURALISATION]: '#059669', // Vert emeraude
};

/**
 * Statuts d'un workspace
 */
export enum WorkspaceStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
}

/**
 * Niveaux d'urgence
 */
export enum UrgencyLevel {
  FAIBLE = 'faible',
  MOYEN = 'moyen',
  ELEVE = 'eleve',
  CRITIQUE = 'critique',
}

/**
 * Couleurs des niveaux d'urgence
 */
export const URGENCY_COLORS: Record<UrgencyLevel, string> = {
  [UrgencyLevel.FAIBLE]: '#10B981', // Vert
  [UrgencyLevel.MOYEN]: '#F59E0B', // Ambre
  [UrgencyLevel.ELEVE]: '#EA580C', // Orange fonce
  [UrgencyLevel.CRITIQUE]: '#DC2626', // Rouge vif
};

/**
 * Types de documents CESDA
 */
export enum DocumentType {
  DECISION_ADMINISTRATIVE = 'decision_administrative',
  PASSEPORT = 'passeport',
  CARTE_IDENTITE = 'carte_identite',
  JUSTIFICATIF_DOMICILE = 'justificatif_domicile',
  JUSTIFICATIF_RESSOURCES = 'justificatif_ressources',
  ACTE_NAISSANCE = 'acte_naissance',
  ACTE_MARIAGE = 'acte_mariage',
  CERTIFICAT_SCOLARITE = 'certificat_scolarite',
  ATTESTATION_TRAVAIL = 'attestation_travail',
  PREUVE_NOTIFICATION = 'preuve_notification',
  AUTRE = 'autre',
}

/**
 * Categories de checklist
 */
export enum ChecklistCategory {
  VERIFICATIONS = 'verifications',
  PIECES = 'pieces',
  ACTIONS = 'actions',
}

/**
 * Niveaux d'alerte
 */
export enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

/**
 * Types d'evenements timeline
 */
export enum TimelineEventType {
  CREATED = 'created',
  DOCUMENT_ADDED = 'document_added',
  DOCUMENT_VERIFIED = 'document_verified',
  DEADLINE_UPDATED = 'deadline_updated',
  STATUS_CHANGED = 'status_changed',
  URGENCY_CHANGED = 'urgency_changed',
  AI_SUGGESTION = 'ai_suggestion',
  HUMAN_VALIDATION = 'human_validation',
  CHECKLIST_COMPLETED = 'checklist_completed',
  ALERT_CREATED = 'alert_created',
  DRAFT_GENERATED = 'draft_generated',
  ASSIGNED = 'assigned',
}

/**
 * Types d'acteurs timeline
 */
export enum ActorType {
  USER = 'user',
  AI = 'ai',
  SYSTEM = 'system',
}

/**
 * Types de brouillons
 */
export enum DraftType {
  RECOURS_CONTENTIEUX = 'recours_contentieux',
  RECOURS_GRACIEUX = 'recours_gracieux',
  COURRIER_CLIENT = 'courrier_client',
  EMAIL_CLIENT = 'email_client',
  MEMOIRE = 'memoire',
  REQUETE = 'requete',
}

/**
 * Statuts de brouillons
 */
export enum DraftStatus {
  DRAFT = 'draft',
  REVIEWED = 'reviewed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * Types d'alertes workspace
 */
export enum AlertType {
  DEADLINE_CRITICAL = 'deadline_critical',
  DEADLINE_APPROACHING = 'deadline_approaching',
  DOCUMENT_MISSING = 'document_missing',
  INCOHERENCE_DETECTED = 'incoherence_detected',
  VERIFICATION_REQUIRED = 'verification_required',
  AI_LOW_CONFIDENCE = 'ai_low_confidence',
}

// ============================================
// INTERFACES MeTIER
// ============================================

/**
 * Metadonnees OQTF
 */
export interface OQTFMetadata {
  oqtfType: 'sans_delai' | 'avec_delai';
  modeNotification: 'main_propre' | 'courrier' | 'autre';
  paysDestination: string;
  irtfAssociee: boolean;
  irtfDuree?: number; // en annees
  delaiDepartVolontaire?: number; // en jours
}

/**
 * Metadonnees Asile
 */
export interface AsileMetadata {
  stade: 'OFPRA' | 'CNDA' | 'REEXAMEN';
  motifsInvoques: string[];
  vulnerabilites: string[];
  langueRequise?: string;
  interpreteNecessaire: boolean;
  procedureAcceleree: boolean;
  procedureDublin: boolean;
  paysResponsable?: string;
}

/**
 * Metadonnees Regroupement Familial
 */
export interface RegroupementFamilialMetadata {
  typeDemandeur: 'conjoint' | 'enfants' | 'ascendants';
  ressourcesMensuelles: number;
  logementSurface: number;
  logementConforme: boolean;
  ancienneteSejourMois: number;
  compositionFamille: {
    adultes: number;
    enfants: number;
  };
}

/**
 * Metadonnees Naturalisation
 */
export interface NaturalisationMetadata {
  dureeResidence: number; // en annees
  niveauLangue: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  diplomeObtenu?: string;
  serviceMilitaire: boolean;
  casierJudiciaire: 'vierge' | 'condamnations';
  integrationProfessionnelle: boolean;
}

/**
 * Donnees extraites par IA d'un document
 */
export interface AIExtractedData {
  // Dates detectees
  dates?: {
    decision?: string;
    notification?: string;
    echeance?: string;
  };
  // Parties identifiees
  parties?: {
    autorite?: string;
    beneficiaire?: string;
    nationalite?: string;
  };
  // Type de document detecte
  documentType?: DocumentType;
  // elements cles extraits
  elements?: {
    [key: string]: string | number | boolean;
  };
  // Confiance globale
  confidence: number;
}

/**
 * Checklist item avec donnees completes
 */
export interface ChecklistItemData {
  id: string;
  category: ChecklistCategory;
  label: string;
  description?: string;
  completed: boolean;
  completedAt?: Date;
  required: boolean;
  order: number;
}

/**
 * Suggestion IA
 */
export interface AISuggestion {
  type: 'action' | 'verification' | 'document' | 'jurisprudence';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number;
  metadata?: Record<string, any>;
}

/**
 * Calcul de delai
 */
export interface DeadlineCalculation {
  notificationDate: Date;
  deadlineDate: Date;
  daysRemaining: number;
  hoursRemaining: number;
  urgencyLevel: UrgencyLevel;
  isExpired: boolean;
  procedureType: ProcedureType;
}

/**
 * Workspace complet avec relations
 */
export interface WorkspaceWithRelations {
  id: string;
  tenantId: string;
  clientId: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    nationality?: string;
  };
  procedureType: ProcedureType;
  title: string;
  description?: string;
  reference?: string;
  status: WorkspaceStatus;
  urgencyLevel: UrgencyLevel;
  notificationDate?: Date;
  deadlineDate?: Date;
  closedAt?: Date;
  metadata?: OQTFMetadata | AsileMetadata | RegroupementFamilialMetadata | NaturalisationMetadata;
  createdAt: Date;
  updatedAt: Date;
  checklist: ChecklistItemData[];
  documents: any[];
  alerts: any[];
  timeline: any[];
  _count?: {
    checklist: number;
    documents: number;
    alerts: number;
  };
}

/**
 * Stats dashboard
 */
export interface DashboardStats {
  totalActive: number;
  byCriticity: {
    critique: number;
    eleve: number;
    moyen: number;
    faible: number;
  };
  byProcedure: Record<ProcedureType, number>;
  deadlinesNext7Days: number;
  documentsToVerify: number;
  aiSuggestionsPending: number;
}

/**
 * Filtres workspace
 */
export interface WorkspaceFilters {
  procedureType?: ProcedureType[];
  urgencyLevel?: UrgencyLevel[];
  status?: WorkspaceStatus[];
  search?: string;
  clientId?: string;
  hasDeadline?: boolean;
  deadlineBefore?: Date;
  createdAfter?: Date;
  createdBefore?: Date;
}

/**
 * Options de tri
 */
export interface WorkspaceSortOptions {
  field: 'createdAt' | 'deadlineDate' | 'urgencyLevel' | 'title';
  direction: 'asc' | 'desc';
}

/**
 * Formulaire de creation workspace
 */
export interface CreateWorkspaceInput {
  clientId: string;
  procedureType: ProcedureType;
  title: string;
  description?: string;
  notificationDate?: Date;
  metadata?: Record<string, any>;
}

/**
 * Formulaire de mise a jour workspace
 */
export interface UpdateWorkspaceInput {
  title?: string;
  description?: string;
  status?: WorkspaceStatus;
  urgencyLevel?: UrgencyLevel;
  notificationDate?: Date;
  deadlineDate?: Date;
  metadata?: Record<string, any>;
  assignedToId?: string;
}

// ============================================
// TYPES UTILITAIRES
// ============================================

/**
 * Resultat d'analyse IA
 */
export interface AIAnalysisResult<T = any> {
  success: boolean;
  data?: T;
  confidence: number;
  suggestions: AISuggestion[];
  warnings: string[];
  errors: string[];
}

/**
 * Configuration delais par procedure
 */
export interface DeadlineConfig {
  procedureType: ProcedureType;
  defaultDays?: number;
  defaultHours?: number;
  calculateFrom: 'notification' | 'decision' | 'reception';
  workingDays: boolean;
}

/**
 * Delais standards CESDA
 */
export const STANDARD_DEADLINES: Record<string, DeadlineConfig> = {
  OQTF_SANS_DELAI: {
    procedureType: ProcedureType.OQTF,
    defaultHours: 48,
    calculateFrom: 'notification',
    workingDays: false,
  },
  OQTF_AVEC_DELAI: {
    procedureType: ProcedureType.OQTF,
    defaultDays: 30,
    calculateFrom: 'notification',
    workingDays: false,
  },
  REFUS_TITRE: {
    procedureType: ProcedureType.REFUS_TITRE,
    defaultDays: 60,
    calculateFrom: 'notification',
    workingDays: false,
  },
  ASILE_CNDA: {
    procedureType: ProcedureType.ASILE,
    defaultDays: 30,
    calculateFrom: 'notification',
    workingDays: false,
  },
};

/**
 * Template de checklist par procedure
 */
export interface ChecklistTemplate {
  procedureType: ProcedureType;
  items: Array<{
    category: ChecklistCategory;
    label: string;
    description?: string;
    required: boolean;
    order: number;
  }>;
}

/**
 * Templates de checklists
 */
export const CHECKLIST_TEMPLATES: Record<ProcedureType, ChecklistTemplate> = {
  [ProcedureType.OQTF]: {
    procedureType: ProcedureType.OQTF,
    items: [
      {
        category: ChecklistCategory.VERIFICATIONS,
        label: "Type d'OQTF identifie",
        description: 'Sans delai ou avec delai de depart volontaire',
        required: true,
        order: 1,
      },
      {
        category: ChecklistCategory.VERIFICATIONS,
        label: 'Date de notification confirmee',
        required: true,
        order: 2,
      },
      {
        category: ChecklistCategory.VERIFICATIONS,
        label: 'Mode de notification verifie',
        description: 'Main propre, courrier recommande, ou autre',
        required: true,
        order: 3,
      },
      {
        category: ChecklistCategory.PIECES,
        label: 'Decision OQTF',
        required: true,
        order: 1,
      },
      {
        category: ChecklistCategory.PIECES,
        label: 'Preuve de notification',
        description: 'PV main propre ou AR courrier',
        required: true,
        order: 2,
      },
      {
        category: ChecklistCategory.PIECES,
        label: "Passeport / Carte d'identite",
        required: true,
        order: 3,
      },
      {
        category: ChecklistCategory.PIECES,
        label: 'Justificatifs de presence en France',
        description: 'Factures, bail, attestations',
        required: false,
        order: 4,
      },
      {
        category: ChecklistCategory.PIECES,
        label: 'Documents situation familiale',
        description: 'Actes de naissance, mariage, etc.',
        required: false,
        order: 5,
      },
    ],
  },
  [ProcedureType.ASILE]: {
    procedureType: ProcedureType.ASILE,
    items: [
      {
        category: ChecklistCategory.VERIFICATIONS,
        label: 'Stade de la procedure identifie',
        description: 'OFPRA ou CNDA',
        required: true,
        order: 1,
      },
      {
        category: ChecklistCategory.VERIFICATIONS,
        label: 'Langue requise determinee',
        required: false,
        order: 2,
      },
      {
        category: ChecklistCategory.VERIFICATIONS,
        label: 'Vulnerabilites detectees',
        description: 'Mineur, torture, LGBT+, etc.',
        required: false,
        order: 3,
      },
      {
        category: ChecklistCategory.PIECES,
        label: 'Decision OFPRA (si recours CNDA)',
        required: false,
        order: 1,
      },
      {
        category: ChecklistCategory.PIECES,
        label: 'Recit de persecution',
        required: true,
        order: 2,
      },
      {
        category: ChecklistCategory.PIECES,
        label: "Pieces d'identite",
        required: true,
        order: 3,
      },
      {
        category: ChecklistCategory.PIECES,
        label: 'Preuves des persecutions',
        description: 'Photos, rapports medicaux, articles de presse',
        required: false,
        order: 4,
      },
    ],
  },
  [ProcedureType.REFUS_TITRE]: {
    procedureType: ProcedureType.REFUS_TITRE,
    items: [
      {
        category: ChecklistCategory.VERIFICATIONS,
        label: 'Type de titre refuse',
        required: true,
        order: 1,
      },
      {
        category: ChecklistCategory.VERIFICATIONS,
        label: 'Motif administratif exact',
        required: true,
        order: 2,
      },
      {
        category: ChecklistCategory.PIECES,
        label: 'Decision prefectorale',
        required: true,
        order: 1,
      },
      {
        category: ChecklistCategory.PIECES,
        label: 'Historique de sejour',
        required: false,
        order: 2,
      },
      {
        category: ChecklistCategory.PIECES,
        label: 'Justificatifs actuels',
        description: 'Ressources, logement, integration',
        required: true,
        order: 3,
      },
    ],
  },
  [ProcedureType.RETRAIT_TITRE]: {
    procedureType: ProcedureType.RETRAIT_TITRE,
    items: [
      {
        category: ChecklistCategory.VERIFICATIONS,
        label: 'Motif du retrait',
        required: true,
        order: 1,
      },
      {
        category: ChecklistCategory.PIECES,
        label: 'Decision de retrait',
        required: true,
        order: 1,
      },
      {
        category: ChecklistCategory.PIECES,
        label: 'Ancien titre de sejour',
        required: true,
        order: 2,
      },
    ],
  },
  [ProcedureType.REGROUPEMENT_FAMILIAL]: {
    procedureType: ProcedureType.REGROUPEMENT_FAMILIAL,
    items: [
      {
        category: ChecklistCategory.VERIFICATIONS,
        label: 'Statut du demandeur verifie',
        required: true,
        order: 1,
      },
      {
        category: ChecklistCategory.VERIFICATIONS,
        label: 'Ressources suffisantes',
        description: 'Minimum SMIC',
        required: true,
        order: 2,
      },
      {
        category: ChecklistCategory.VERIFICATIONS,
        label: 'Logement conforme',
        required: true,
        order: 3,
      },
      {
        category: ChecklistCategory.PIECES,
        label: 'Justificatifs ressources',
        required: true,
        order: 1,
      },
      {
        category: ChecklistCategory.PIECES,
        label: 'Titre propriete ou bail',
        required: true,
        order: 2,
      },
      {
        category: ChecklistCategory.PIECES,
        label: "Actes d'etat civil",
        required: true,
        order: 3,
      },
    ],
  },
  [ProcedureType.NATURALISATION]: {
    procedureType: ProcedureType.NATURALISATION,
    items: [
      {
        category: ChecklistCategory.VERIFICATIONS,
        label: 'Anciennete de sejour',
        description: 'Minimum 5 ans sauf exceptions',
        required: true,
        order: 1,
      },
      {
        category: ChecklistCategory.VERIFICATIONS,
        label: 'Niveau de langue francais',
        description: 'B1 oral minimum',
        required: true,
        order: 2,
      },
      {
        category: ChecklistCategory.PIECES,
        label: 'Justificatifs residence 5 ans',
        required: true,
        order: 1,
      },
      {
        category: ChecklistCategory.PIECES,
        label: 'Attestation langue francaise',
        required: true,
        order: 2,
      },
      {
        category: ChecklistCategory.PIECES,
        label: 'Casier judiciaire',
        required: true,
        order: 3,
      },
    ],
  },
};
