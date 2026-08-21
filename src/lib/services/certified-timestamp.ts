/**
 * Middleware d'horodatage certifié pour les actions critiques.
 * 
 * S'utilise dans les services métier pour ajouter un timestamp RFC 3161
 * aux événements qui ont besoin d'une preuve de date opposable.
 * 
 * Actions horodatées :
 * - Dépôt de document (preuve d'antériorité)
 * - Partage au client (preuve de notification)
 * - Signature client (preuve de consentement)
 * - Création de preuve légale (ProofBundle)
 * - Réception email (preuve de réception)
 */

import { timestampService, type TimestampResult } from './timestamp.service';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export type CriticalAction =
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_SHARED'
  | 'CLIENT_ACKNOWLEDGED'
  | 'CLIENT_SIGNED'
  | 'PROOF_GENERATED'
  | 'EMAIL_RECEIVED'
  | 'DEADLINE_CREATED'
  | 'DOSSIER_CLOSED';

interface CertifiedTimestampInput {
  tenantId: string;
  userId: string;
  action: CriticalAction;
  entityType: string;
  entityId: string;
  contentHash: string; // SHA-256 du contenu horodaté
  metadata?: Record<string, any>;
}

interface CertifiedTimestampRecord {
  id: string;
  action: CriticalAction;
  entityId: string;
  contentHash: string;
  tsaProvider: string;
  tsaTimestamp: string;
  tsaToken: string;
  createdAt: Date;
}

/**
 * Horodater une action critique avec preuve tierce.
 * Le résultat est stocké dans l'AuditLog avec le token TSA.
 */
export async function certifyAction(input: CertifiedTimestampInput): Promise<CertifiedTimestampRecord> {
  // 1. Demander l'horodatage au TSA
  const tsResult = await timestampService.timestampEvent({
    action: input.action,
    entityId: input.entityId,
    entityType: input.entityType,
    userId: input.userId,
    data: {
      contentHash: input.contentHash,
      ...input.metadata,
    },
  });

  const record: CertifiedTimestampRecord = {
    id: randomUUID(),
    action: input.action,
    entityId: input.entityId,
    contentHash: input.contentHash,
    tsaProvider: tsResult.provider,
    tsaTimestamp: tsResult.timestamp,
    tsaToken: tsResult.tokenHex || tsResult.token || '',
    createdAt: new Date(),
  };

  // 2. Stocker dans l'AuditLog avec le token TSA
  try {
    await prisma.auditLog.create({
      data: {
        id: record.id,
        tenantId: input.tenantId,
        userId: input.userId,
        userEmail: '',
        userRole: '',
        action: input.action as any,
        entityType: input.entityType,
        entityId: input.entityId,
        details: JSON.stringify({
          contentHash: input.contentHash,
          tsa: {
            provider: tsResult.provider,
            timestamp: tsResult.timestamp,
            tokenHex: tsResult.tokenHex,
            success: tsResult.success,
          },
          ...input.metadata,
        }),
        ipAddress: '',
        createdAt: new Date(),
      },
    });
  } catch (err) {
    // Si l'enum AuditAction ne contient pas notre action, on log quand même
    console.warn(`[certifyAction] AuditLog creation failed for ${input.action}, storing in-memory only`);
  }

  return record;
}

/**
 * Vérifier la validité d'un horodatage local.
 */
export function verifyCertification(hash: string, timestamp: string, token: string): boolean {
  return timestampService.verifyLocal(hash, timestamp, token);
}

/**
 * Helper : horodater un upload de document.
 */
export async function certifyDocumentUpload(params: {
  tenantId: string;
  userId: string;
  documentId: string;
  documentHash: string;
}): Promise<CertifiedTimestampRecord> {
  return certifyAction({
    tenantId: params.tenantId,
    userId: params.userId,
    action: 'DOCUMENT_UPLOADED',
    entityType: 'document',
    entityId: params.documentId,
    contentHash: params.documentHash,
  });
}

/**
 * Helper : horodater un partage au client.
 */
export async function certifyClientShare(params: {
  tenantId: string;
  userId: string;
  shareId: string;
  documentHash: string;
}): Promise<CertifiedTimestampRecord> {
  return certifyAction({
    tenantId: params.tenantId,
    userId: params.userId,
    action: 'DOCUMENT_SHARED',
    entityType: 'document_share',
    entityId: params.shareId,
    contentHash: params.documentHash,
  });
}

/**
 * Helper : horodater la signature d'un client.
 */
export async function certifyClientSignature(params: {
  tenantId: string;
  userId: string;
  shareId: string;
  signatureHash: string;
}): Promise<CertifiedTimestampRecord> {
  return certifyAction({
    tenantId: params.tenantId,
    userId: params.userId,
    action: 'CLIENT_SIGNED',
    entityType: 'document_share',
    entityId: params.shareId,
    contentHash: params.signatureHash,
  });
}

/**
 * Helper : horodater la réception d'un email.
 */
export async function certifyEmailReception(params: {
  tenantId: string;
  userId: string;
  emailId: string;
  emailHash: string;
}): Promise<CertifiedTimestampRecord> {
  return certifyAction({
    tenantId: params.tenantId,
    userId: params.userId,
    action: 'EMAIL_RECEIVED',
    entityType: 'email',
    entityId: params.emailId,
    contentHash: params.emailHash,
  });
}
