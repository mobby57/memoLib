// Types globaux pour l'application
// Roles hierarchiques standardises
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'CLIENT';
export type TenantPlan = 'BASIC' | 'PREMIUM' | 'ENTERPRISE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  
  // Tenant (null pour SUPER_ADMIN)
  tenantId?: string;
  tenantName?: string;
  tenantPlan?: TenantPlan;
  
  // Client (pour role CLIENT uniquement)
  clientId?: string;
  
  // Permissions calculees
  permissions: UserPermissions;
}

// Permissions par role
export interface UserPermissions {
  canManageTenants: boolean;        // SUPER_ADMIN uniquement
  canManageClients: boolean;        // SUPER_ADMIN + ADMIN
  canManageDossiers: boolean;       // SUPER_ADMIN + ADMIN
  canViewOwnDossier: boolean;       // CLIENT uniquement
  canManageFactures: boolean;       // SUPER_ADMIN + ADMIN
  canViewOwnFactures: boolean;      // CLIENT uniquement
  canAccessAnalytics: boolean;      // SUPER_ADMIN + ADMIN
  canManageUsers: boolean;          // SUPER_ADMIN + ADMIN (dans son tenant)
}

export interface DashboardStats {
  totalCases: number;
  urgentCases: number;
  pendingInvoices: number;
  successRate: number;
}

export interface RecentActivity {
  id: number;
  type: 'dossier' | 'facture' | 'client' | 'rendez-vous' | 'deadline' | 'document';
  description: string;
  date: string;
}

export interface Dossier {
  id: string;
  tenantId: string;
  numero: string;
  
  // Client
  clientId: string;
  client?: string; // Nom du client (pour affichage)
  
  // Type et classification
  typeDossier: string;
  articleCeseda?: string;
  categorieJuridique?: string;
  
  // Statut et priorite
  statut: 'nouveau' | 'en_cours' | 'urgent' | 'en_attente' | 'termine' | 'suspendu' | 'archive';
  priorite: 'basse' | 'normale' | 'haute' | 'critique';
  phase: 'instruction' | 'recours' | 'audience' | 'decision' | 'execution';
  
  // Dates
  dateCreation: string | Date;
  dateOuverture?: string | Date;
  echeance?: string | Date;
  dateEcheance?: string | Date;
  dateProchaineEtape?: string | Date;
  dateCloture?: string | Date;
  dateArchivage?: string | Date;
  
  // Juridiction et procedure
  juridiction?: string;
  numeroJuridiction?: string;
  typeRecours?: string;
  instanceRecours?: string;
  
  // Affectation
  responsableId?: string;
  responsable?: string; // Nom pour affichage
  collaborateurs?: string[]; // IDs
  avocatAdverse?: string;
  
  // Details
  objet?: string;
  description?: string;
  contexteLegal?: string;
  notes?: string;
  notesPrivees?: string;
  
  // Financier
  honorairesEstimes?: number;
  honorairesReel?: number;
  avanceSurFrais?: number;
  fraisDossier?: number;
  tauxHoraire?: number;
  tempsEstime?: number; // heures
  tempsReel?: number; // heures
  modeFacturation?: 'forfait' | 'horaire' | 'resultat' | 'mixte';
  
  // Confidentialite
  niveauConfidentialite: 'public' | 'normal' | 'confidentiel' | 'secret';
  accessRestreint: boolean;
  autorisationsAcces?: Record<string, string[]>;
  
  // Archivage
  dureeConservation?: number; // annees
  dateDestructionPrevue?: string | Date;
  archivePhysique?: string;
  archiveNumerique?: string;
  
  // Workflow
  etapesWorkflow?: WorkflowStep[];
  checklistItems?: ChecklistItem[];
  jalons?: Milestone[];
  
  // IA
  prediction_ia?: number;
  aiAnalysis?: AIAnalysis;
  riskScore?: number;
  successProbability?: number;
  aiRecommendations?: AIRecommendation[];
  aiSummary?: string;
  predictedOutcome?: string;
  
  // Metriques
  tempsReponseJuridiction?: number;
  tauxReussite?: number;
  scoreComplexite?: number;
  
  // References
  dossiersPrecedents?: string[];
  jurisprudence?: JurisprudenceRef[];
  dossiersLies?: string[];
  
  // Communication
  dernierContactClient?: string | Date;
  prochaineRelance?: string | Date;
  frequenceRelance?: 'hebdomadaire' | 'mensuelle' | 'trimestrielle';
  canalContact?: 'email' | 'telephone' | 'courrier' | 'visio';
  
  // Metadonnees
  tags?: string[];
  couleurEtiquette?: string;
  emoji?: string;
  
  createdAt?: string | Date;
  updatedAt?: string | Date;
  lastActivityAt?: string | Date;
  
  // Relations (pour les details)
  factures?: Facture[];
  documents?: Document[];
  rendezVous?: RendezVous[];
  taches?: TacheDossier[];
  evenements?: EvenementDossier[];
  commentaires?: CommentaireDossier[];
}

// Types auxiliaires pour Dossier
export interface WorkflowStep {
  id: string;
  nom: string;
  statut: 'a_faire' | 'en_cours' | 'termine' | 'bloque';
  dateEcheance?: string | Date;
  assigneA?: string;
  ordre: number;
}

export interface ChecklistItem {
  id: string;
  texte: string;
  complete: boolean;
  obligatoire: boolean;
  categorie?: string;
}

export interface Milestone {
  id: string;
  titre: string;
  date: string | Date;
  type: 'creation' | 'depot' | 'audience' | 'decision' | 'cloture';
  description?: string;
}

export interface AIAnalysis {
  timestamp: string | Date;
  confidence: number;
  risques: string[];
  opportunites: string[];
  pointsCles: string[];
  recommandations: string[];
}

export interface AIRecommendation {
  id: string;
  type: 'action' | 'attention' | 'strategie';
  priorite: 'haute' | 'normale' | 'basse';
  texte: string;
  rationale: string;
}

export interface JurisprudenceRef {
  id: string;
  juridiction: string;
  numero: string;
  date: string | Date;
  resume: string;
  pertinence: number;
}

// Nouvelles entites de gestion de dossier
export interface TacheDossier {
  id: string;
  dossierId: string;
  titre: string;
  description?: string;
  type: 'administrative' | 'juridique' | 'client' | 'interne';
  priorite: 'critique' | 'haute' | 'normale' | 'basse';
  statut: 'a_faire' | 'en_cours' | 'bloquee' | 'terminee' | 'annulee';
  
  assigneA?: string;
  assigneNom?: string; // Pour affichage
  
  dateEcheance?: string | Date;
  dateDebut?: string | Date;
  dateFin?: string | Date;
  
  tempsEstime?: number; // minutes
  tempsReel?: number; // minutes
  
  dependances?: string[]; // IDs taches
  sousCategorie?: string;
  
  rappelEnvoye: boolean;
  rappelDate?: string | Date;
  
  pieceJointes?: string[]; // References documents
  commentaires?: string[];
  
  createdAt: string | Date;
  updatedAt: string | Date;
  completedAt?: string | Date;
  completedBy?: string;
  completedByName?: string;
}

export interface EvenementDossier {
  id: string;
  dossierId: string;
  type: 'action' | 'decision' | 'courrier' | 'appel' | 'email' | 'reunion' | 'audience' | 'depot';
  titre: string;
  description?: string;
  
  dateEvenement: string | Date;
  dateSaisie: string | Date;
  
  auteur?: string;
  auteurNom?: string;
  participants?: Participant[];
  
  importance: 'critique' | 'importante' | 'normale' | 'mineure';
  categorie?: 'procedure' | 'communication' | 'finance' | 'administratif';
  
  localisation?: string;
  duree?: number; // minutes
  
  documentsLies?: string[]; // IDs documents
  resultats?: string;
  suitesDonner?: string;
  
  visible: boolean; // Visible par le client
  
  metadata?: Record<string, any>;
  
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Participant {
  id: string;
  nom: string;
  role: string;
  email?: string;
  telephone?: string;
}

export interface CommentaireDossier {
  id: string;
  dossierId: string;
  
  auteurId: string;
  auteurNom: string;
  auteurAvatar?: string;
  
  contenu: string;
  type: 'note' | 'analyse' | 'remarque' | 'question' | 'reponse';
  
  important: boolean;
  prive: boolean;
  
  reponseA?: string; // ID commentaire parent
  mentions?: string[]; // IDs users mentionnes
  
  pieceJointes?: string[];
  tags?: string[];
  
  modifie: boolean;
  
  createdAt: string | Date;
  updatedAt: string | Date;
  editedAt?: string | Date;
}

export interface RendezVous {
  id: string;
  dossierId: string;
  dossier?: string; // Titre dossier pour affichage
  
  titre: string;
  description?: string;
  type: 'consultation' | 'audience' | 'signature' | 'visio' | 'reunion' | 'expertise';
  
  dateDebut: string | Date;
  dateFin: string | Date;
  
  lieu?: string;
  lienVisio?: string;
  
  participants?: Participant[];
  organisateur?: string;
  
  statut: 'planifie' | 'confirme' | 'annule' | 'termine' | 'reporte';
  
  rappelEnvoye: boolean;
  rappels?: RappelConfig[];
  
  notes?: string;
  pieceJointes?: string[];
  
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface RappelConfig {
  delai: number; // minutes avant
  envoye: boolean;
  dateEnvoi?: string | Date;
}

export interface Facture {
  id: string;
  client: string;
  montant: number;
  statut: 'brouillon' | 'en_attente' | 'payee' | 'en_retard';
  dateEmission: string;
  dateEcheance?: string;
  datePaiement?: string;
  dateCreation?: string;
  description: string;
}

// ============================================
// SYSTeME DE VALIDATION IA - TYPES
// Base sur CHARTE_IA_JURIDIQUE.md v1.0
// ============================================

/**
 * Niveaux d'autonomie de l'IA selon la charte
 */
export enum AutonomyLevel {
  /** Actions automatiques sans validation */
  GREEN = 'GREEN',
  /** Actions semi-automatiques avec validation recommandee */
  ORANGE = 'ORANGE',
  /** Actions manuelles uniquement - validation obligatoire */
  RED = 'RED'
}

/**
 * Types d'actions que l'IA peut effectuer
 */
export enum AIActionType {
  // Niveau GREEN (automatique)
  EMAIL_TRIAGE = 'EMAIL_TRIAGE',
  WORKSPACE_CREATION = 'WORKSPACE_CREATION',
  METADATA_EXTRACTION = 'METADATA_EXTRACTION',
  URGENCY_DETECTION = 'URGENCY_DETECTION',
  CLASSIFICATION = 'CLASSIFICATION',
  
  // Niveau ORANGE (semi-automatique)
  FORM_GENERATION = 'FORM_GENERATION',
  DOCUMENT_REQUEST = 'DOCUMENT_REQUEST',
  DRAFT_GENERATION = 'DRAFT_GENERATION',
  ALERT_CREATION = 'ALERT_CREATION',
  
  // Niveau RED (manuel uniquement)
  DOCUMENT_SEND = 'DOCUMENT_SEND',
  LEGAL_ADVICE = 'LEGAL_ADVICE', // INTERDIT a l'IA
  STRATEGY_CHOICE = 'STRATEGY_CHOICE', // INTERDIT a l'IA
  LEGAL_INTERPRETATION = 'LEGAL_INTERPRETATION' // INTERDIT a l'IA
}

/**
 * Statuts de validation
 */
export enum ValidationStatus {
  /** En attente de validation humaine */
  PENDING = 'PENDING',
  /** Valide et approuve */
  APPROVED = 'APPROVED',
  /** Rejete par l'humain */
  REJECTED = 'REJECTED',
  /** Modifie puis approuve */
  MODIFIED_APPROVED = 'MODIFIED_APPROVED',
  /** Automatique (pas de validation requise) */
  AUTO_APPROVED = 'AUTO_APPROVED'
}

/**
 * Niveaux de validation requis
 */
export enum ValidationLevel {
  /** Pas de validation requise */
  NONE = 'NONE',
  /** Validation rapide (<2 min) */
  QUICK = 'QUICK',
  /** Validation standard */
  STANDARD = 'STANDARD',
  /** Validation renforcee (4 yeux) */
  REINFORCED = 'REINFORCED'
}

/**
 * Niveaux d'urgence
 */
export enum UrgencyLevel {
  /** Moins de 48h */
  CRITICAL = 'CRITICAL',
  /** Moins de 7 jours */
  HIGH = 'HIGH',
  /** Normal */
  NORMAL = 'NORMAL',
  /** Basse priorite */
  LOW = 'LOW'
}

/**
 * Types de documents
 */
export enum DocumentType {
  // Automatiques (niveau GREEN/ORANGE)
  ACKNOWLEDGMENT = 'ACKNOWLEDGMENT',
  DOCUMENT_REQUEST = 'DOCUMENT_REQUEST',
  APPOINTMENT_CONFIRMATION = 'APPOINTMENT_CONFIRMATION',
  REMINDER = 'REMINDER',
  
  // Necessitent validation (niveau ORANGE)
  SIMPLE_LETTER = 'SIMPLE_LETTER',
  CASE_SUMMARY = 'CASE_SUMMARY',
  
  // Interdits a l'IA (niveau RED)
  LEGAL_PROCEEDING = 'LEGAL_PROCEEDING',
  LEGAL_CONCLUSION = 'LEGAL_CONCLUSION',
  LEGAL_CONSULTATION = 'LEGAL_CONSULTATION',
  TRANSACTION = 'TRANSACTION'
}

/**
 * Interface pour une action IA
 */
export interface AIAction {
  id: string;
  actionType: AIActionType;
  autonomyLevel: AutonomyLevel;
  
  /** Niveau de confiance de l'IA (0-1) */
  confidence: number;
  
  /** Validation requise ? */
  requiresValidation: boolean;
  
  /** Niveau de validation requis */
  validationLevel: ValidationLevel;
  
  /** Statut de validation actuel */
  validationStatus: ValidationStatus;
  
  /** Contenu de l'action (JSON) */
  content: Record<string, any>;
  
  /** Justification de l'action */
  rationale: string;
  
  /** ID du dossier concerne */
  dossierId?: string;
  
  /** ID du tenant */
  tenantId: string;
  
  /** Cree par (IA) */
  createdBy: string;
  
  /** Date de creation */
  createdAt: Date;
  
  /** Valide par (humain) */
  validatedBy?: string;
  
  /** Date de validation */
  validatedAt?: Date;
  
  /** Commentaire de validation */
  validationComment?: string;
  
  /** Metadonnees supplementaires */
  metadata?: Record<string, any>;
}

/**
 * Interface pour un log d'audit
 */
export interface AuditLog {
  id: string;
  eventType: string;
  actionId?: string;
  dossierId?: string;
  tenantId: string;
  userId?: string;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Interface pour une alerte
 */
export interface Alert {
  id: string;
  alertType: 'legal_deadline' | 'inconsistency' | 'blocked_case' | 'missing_document';
  severity: 'INFO' | 'WARNING' | 'ALERT' | 'CRITICAL';
  
  dossierId: string;
  tenantId: string;
  
  message: string;
  deadline?: Date;
  suggestedAction?: string;
  
  /** Canaux de notification */
  notificationChannels: ('email' | 'push' | 'sms')[];
  
  /** Lu ? */
  read: boolean;
  
  /** Snoozed jusqu'a */
  snoozedUntil?: Date;
  
  createdAt: Date;
  readAt?: Date;
}

/**
 * Interface pour un brouillon de document
 */
export interface DocumentDraft {
  id: string;
  documentType: DocumentType;
  status: 'DRAFT' | 'READY_TO_SEND' | 'SENT';
  
  dossierId: string;
  tenantId: string;
  
  /** Contenu du document (Markdown ou HTML) */
  content: string;
  
  /** Zones necessitant attention */
  placeholders: {
    marker: string;
    reason: string;
    resolved: boolean;
  }[];
  
  /** Niveau de validation requis */
  validationLevel: ValidationLevel;
  
  /** Statut de validation */
  validationStatus: ValidationStatus;
  
  /** Destinataire */
  recipient?: {
    name: string;
    email?: string;
    address?: string;
    type: 'client' | 'court' | 'adverse' | 'other';
  };
  
  /** Pieces jointes */
  attachments: {
    filename: string;
    path: string;
    size: number;
  }[];
  
  createdBy: string;
  createdAt: Date;
  
  validatedBy?: string;
  validatedAt?: Date;
  
  sentBy?: string;
  sentAt?: Date;
}

/**
 * Interface pour un formulaire de collecte
 */
export interface CollectionForm {
  id: string;
  formType: 'initial_intake' | 'document_request' | 'clarification';
  caseType: string;
  dossierId: string;
  tenantId: string;
  
  questions: {
    id: string;
    type: 'text' | 'date' | 'file' | 'select' | 'number' | 'textarea';
    label: string;
    helpText?: string;
    required: boolean;
    validation?: string;
    options?: string[]; // Pour type 'select'
  }[];
  
  estimatedTime: string;
  
  /** Reponses (si formulaire complete) */
  responses?: Record<string, any>;
  
  status: 'SENT' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  
  sentAt: Date;
  completedAt?: Date;
  
  /** Relances */
  reminders: {
    sentAt: Date;
    attempt: number;
  }[];
}

/**
 * Interface pour les metriques de supervision
 */
export interface AIMetrics {
  tenantId: string;
  period: string; // 'daily' | 'weekly' | 'monthly'
  
  /** Taux de rejet des brouillons */
  draftRejectionRate: number;
  
  /** Taux d'erreur de classification */
  classificationErrorRate: number;
  
  /** Temps moyen de validation (heures) */
  avgValidationTime: number;
  
  /** Nombre d'escalades non traitees */
  untreatedEscalations: number;
  
  /** Actions par type */
  actionsByType: Record<AIActionType, number>;
  
  /** Niveau de confiance moyen */
  avgConfidence: number;
  
  calculatedAt: Date;
}

export interface Client {
  id: string;
  tenantId: string;
  
  // Informations personnelles
  civilite?: 'M.' | 'Mme' | 'Autre';
  firstName: string;
  lastName: string;
  nom?: string; // Alias pour lastName (retrocompatibilite)
  prenom?: string; // Alias pour firstName (retrocompatibilite)
  nomNaissance?: string;
  prenomUsuel?: string;
  
  // Contacts
  email: string;
  emailSecondaire?: string;
  telephone?: string;
  phone?: string; // Alias pour telephone
  phoneSecondaire?: string;
  telephoneUrgence?: string;
  
  // Naissance et nationalite
  dateOfBirth?: string | Date;
  lieuNaissance?: string;
  nationality?: string;
  nationalite?: string; // Alias
  nationaliteOrigine?: string;
  
  // Adresse principale
  address?: string;
  adresse?: string; // Alias
  codePostal?: string;
  code_postal?: string; // Alias
  ville?: string;
  pays?: string;
  
  // Adresse de correspondance
  adresseCorrespondance?: string;
  codePostalCorrespondance?: string;
  villeCorrespondance?: string;
  paysCorrespondance?: string;
  
  // Documents d'identite
  passportNumber?: string;
  passportExpiry?: string | Date;
  passportCountry?: string;
  
  idCardNumber?: string;
  idCardExpiry?: string | Date;
  
  titreSejourNumber?: string;
  titreSejourType?: string;
  titreSejourExpiry?: string | Date;
  
  numeroOFII?: string;
  numeroAgrefe?: string;
  
  // Situation personnelle
  situationFamiliale?: 'celibataire' | 'marie' | 'pacse' | 'divorce' | 'veuf';
  nombreEnfants?: number;
  personneACharge?: number;
  
  // Situation professionnelle
  profession?: string;
  employeur?: string;
  secteurActivite?: string;
  situationPro?: 'emploi_cdi' | 'emploi_cdd' | 'chomage' | 'etudiant' | 'retraite' | 'sans_emploi';
  revenusAnnuels?: number;
  
  // Informations bancaires
  iban?: string;
  bic?: string;
  titulaireBancaire?: string;
  
  // Contact d'urgence
  contactUrgenceNom?: string;
  contactUrgenceLien?: string;
  contactUrgenceTel?: string;
  
  // Preferences de communication
  languePrincipale?: string;
  languesSecondaires?: string[];
  prefCommunication?: 'email' | 'telephone' | 'courrier' | 'sms';
  accepteNotifications?: boolean;
  accepteNewsletter?: boolean;
  
  // Statut et classification
  status: 'actif' | 'inactif' | 'archive' | 'prospect';
  statut?: 'actif' | 'inactif' | 'archive'; // Alias
  categorie?: 'particulier' | 'entreprise' | 'association';
  source?: string;
  qualite?: 'vip' | 'standard' | 'risque';
  scoreRisque?: number;
  
  // Gestion financiere
  tarifHoraire?: number;
  plafondHoraire?: number;
  modeFacturation?: 'forfait' | 'horaire' | 'resultat';
  delaiPaiement?: number; // jours
  
  // Suivi relationnel
  origineClient?: string;
  datePremiereVisite?: string | Date;
  dateDernierContact?: string | Date;
  frequenceContact?: 'hebdomadaire' | 'mensuelle' | 'trimestrielle';
  satisfactionScore?: number; // 1-5
  
  // Confidentialite
  niveauConfidentialite?: 'public' | 'normal' | 'confidentiel';
  consentementRGPD?: boolean;
  dateConsentementRGPD?: string | Date;
  
  // Metadonnees
  notes?: string;
  notesPrivees?: string;
  tags?: string[];
  couleurEtiquette?: string;
  emoji?: string;
  
  // Archivage
  dateArchivage?: string | Date;
  raisonArchivage?: string;
  
  // Champs personnalises
  champsPersonnalises?: Record<string, any>;
  
  // Dates systeme
  created_at?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  lastActivityAt?: string | Date;
  
  // Relations (pour details)
  dossiers?: Dossier[];
  nombreDossiers?: number;
  dossiersActifs?: number;
  
  // Stats
  chiffreAffaires?: number;
  honorairesTotaux?: number;
  tempsTotal?: number;
}

export interface Document {
  id: number;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  type_document: string;
  statut: 'uploaded' | 'validated' | 'rejected';
  uploaded_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface TenantDashboardResponse {
  success: boolean;
  tenantId: string;
  totalCases: number;
  urgentCases: number;
  pendingInvoices: number;
  successRate: number;
  recentActivity: RecentActivity[];
  timestamp: string;
}

export interface TenantDossiersResponse {
  success: boolean;
  tenantId: string;
  count: number;
  dossiers: Dossier[];
  timestamp: string;
}

export interface TenantFacturesResponse {
  success: boolean;
  tenantId: string;
  count: number;
  factures: Facture[];
  totaux: {
    montantTotal: number;
    montantPaye: number;
    montantEnAttente: number;
    montantEnRetard: number;
  };
  timestamp: string;
}
