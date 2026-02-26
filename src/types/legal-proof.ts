/**
 * Types pour le système de preuves légales
 *
 * Pilier #4: Preuve Native
 * Génération de preuves horodatées et certifiées pour validité légale
 */

export enum ProofType {
  DOCUMENT = 'DOCUMENT',
  ACTION = 'ACTION',
  COMMUNICATION = 'COMMUNICATION',
  TRANSACTION = 'TRANSACTION',
  VALIDATION = 'VALIDATION',
}

export enum SignatureType {
  /** Signature électronique simple */
  SIMPLE = 'SIMPLE',
  /** Signature électronique avancée */
  ADVANCED = 'ADVANCED',
  /** Signature électronique qualifiée (eIDAS) */
  QUALIFIED = 'QUALIFIED',
}

export enum ProofFormat {
  JSON = 'JSON',
  PDF = 'PDF',
  XML = 'XML',
  BLOCKCHAIN = 'BLOCKCHAIN',
}

export interface DigitalSignature {
  /** ID du signataire */
  signerId: string;
  /** Nom du signataire */
  signerName: string;
  /** Email du signataire */
  signerEmail: string;
  /** Timestamp de la signature */
  timestamp: Date;
  /** Type de signature (eIDAS) */
  type: SignatureType;
  /** Certificat X.509 (si disponible) */
  certificate?: string;
  /** Hash de la signature */
  signatureHash: string;
  /** Algorithme utilisé */
  algorithm: string;
}

export interface TimestampAuthority {
  /** Nom de l'autorité de certification */
  name?: string;
  /** URL du service TSA (RFC 3161) */
  url: string;
  /** Token de timestamp RFC 3161 */
  token: string;
  /** Hash du timestamp */
  hash?: string;
  /** Timestamp UTC */
  timestamp: Date;
  /** Certificat de la TSA */
  certificate?: string;
}

export interface ProofBundle {
  /** ID unique de la preuve */
  id: string;
  /** Type de preuve */
  type: ProofType;
  /** ID du tenant */
  tenantId: string;
  /** ID de l'entité prouvée (dossier, document, etc.) */
  entityId: string;
  /** Type d'entité */
  entityType: string;
  /** Hash SHA-256 du document/action */
  documentHash: string;
  /** Timestamp de génération (serveur) */
  timestamp: Date;
  /** Autorité de certification timestamp (RFC 3161) */
  timestampAuthority?: TimestampAuthority;
  /** Signatures électroniques */
  signatures: DigitalSignature[];
  /** Chaîne d'audit liée */
  auditTrail: {
    eventLogIds: string[];
    checksums: string[];
  };
  /** Métadonnées du contexte */
  metadata: {
    /** Créé par */
    createdBy: string;
    /** Raison de la génération */
    reason?: string;
    /** Juridiction applicable */
    jurisdiction?: string;
    /** Documents liés */
    relatedDocuments?: string[];
    [key: string]: any;
  };
  /** Hash global de la preuve */
  proofHash: string;
  /** Statut de validation */
  validationStatus: {
    isValid: boolean;
    verifiedAt?: Date;
    verifiedBy?: string;
    errors?: string[];
  };
  /** Dates */
  createdAt: Date;
  updatedAt: Date;
  /** Expiration (optionnelle) */
  expiresAt?: Date;
}

export interface ProofVerificationResult {
  /** La preuve est-elle valide ? */
  isValid: boolean;
  /** Timestamp de vérification */
  verifiedAt: Date;
  /** Détails de la vérification */
  details: {
    /** Hash correspond ? */
    hashMatch: boolean;
    /** Signatures valides ? */
    signaturesValid: boolean;
    /** Timestamp valide ? */
    timestampValid: boolean;
    /** Audit trail intact ? */
    auditTrailIntact: boolean;
    /** Pas expiré ? */
    notExpired: boolean;
  };
  /** Erreurs détectées */
  errors: string[];
  /** Warnings */
  warnings: string[];
}

export interface GenerateProofParams {
  type: ProofType;
  tenantId: string;
  entityId: string;
  entityType: string;
  createdBy: string;
  reason?: string;
  jurisdiction?: string;
  includeTimestampAuthority?: boolean;
  signatures?: Omit<DigitalSignature, 'timestamp' | 'signatureHash'>[];
}

export interface ExportProofOptions {
  format: ProofFormat;
  includeAuditTrail?: boolean;
  includeSignatures?: boolean;
  watermark?: string;
  language?: 'fr' | 'en';
}
