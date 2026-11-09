/**
 * Types pour le système de Draft (brouillon de dossier)
 * Un Draft est un objet partiel extrait d'un email, en attente de validation humaine.
 */

export type DraftStatus = 'PENDING' | 'VALIDATED' | 'REJECTED';

export interface LegalCaseDraft {
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  caseType?: string;
  caseSubType?: string;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  notificationDate?: string;
  deadline?: string;
  subject?: string;
  summary?: string;
  rawContent: string;
  confidence: Record<string, number>;
  sourceEmailId?: string;
}

export interface DraftRecord {
  id: string;
  tenantId: string;
  status: DraftStatus;
  extractedData: LegalCaseDraft;
  sourceEmailId?: string;
  validatedBy?: string;
  validatedAt?: Date | string;
  rejectionReason?: string;
  createdDossierId?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ValidateDraftPayload {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  caseType: string;
  caseSubType?: string;
  urgency?: string;
  notificationDate?: string;
  notes?: string;
}
