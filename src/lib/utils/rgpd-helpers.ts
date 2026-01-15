/**
 * RGPD Helper Utilities
 * 
 * Utilities for RGPD-compliant data handling:
 * - Data anonymization
 * - Audit logging
 * - Consent management
 * - Data export/deletion
 */

import { logger, logRGPDAction } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

/**
 * Anonymize personal data for AI processing
 */
export function anonymizeForAI<T extends Record<string, any>>(data: T): T {
  const anonymized = { ...data };

  // Fields to anonymize
  const sensitiveFields = [
    'firstName', 'lastName', 'prenom', 'nom', 'nomNaissance',
    'email', 'emailSecondaire', 'telephone', 'phone', 'phoneSecondaire',
    'address', 'adresse', 'adresseCorrespondance',
    'passportNumber', 'idCardNumber', 'titreSejourNumber',
    'numeroSecuriteSociale', 'iban', 'bic',
    'lieuNaissance', 'contactUrgenceNom', 'contactUrgenceTel'
  ];

  // Anonymize sensitive fields
  for (const field of sensitiveFields) {
    if (field in anonymized) {
      if (field.includes('email') || field.includes('Email')) {
        anonymized[field] = '[EMAIL_ANONYMISE]';
      } else if (field.includes('tel') || field.includes('phone') || field.includes('Tel')) {
        anonymized[field] = '[TELEPHONE_ANONYMISE]';
      } else if (field.includes('nom') || field.includes('Name') || field.includes('prenom')) {
        anonymized[field] = '[NOM_ANONYMISE]';
      } else if (field.includes('address') || field.includes('adresse')) {
        anonymized[field] = '[ADRESSE_ANONYMISEE]';
      } else {
        anonymized[field] = '[DONNEE_PERSONNELLE]';
      }
    }
  }

  return anonymized;
}

/**
 * Check if user has given RGPD consent
 */
export async function hasRGPDConsent(clientId: string): Promise<boolean> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { consentementRGPD: true, dateConsentementRGPD: true },
  });

  return client?.consentementRGPD === true && client?.dateConsentementRGPD !== null;
}

/**
 * Record RGPD consent
 */
export async function recordConsent(params: {
  clientId: string;
  userId: string;
  tenantId: string;
  consentType: 'data_processing' | 'marketing' | 'analytics';
}): Promise<void> {
  await prisma.client.update({
    where: { id: params.clientId },
    data: {
      consentementRGPD: true,
      dateConsentementRGPD: new Date(),
    },
  });

  logRGPDAction(
    'CONSENT_UPDATE',
    params.userId,
    params.tenantId,
    params.clientId,
    { consentType: params.consentType }
  );

  logger.info('RGPD consent recorded', {
    clientId: params.clientId,
    consentType: params.consentType,
  });
}

/**
 * Export client data (RGPD right to data portability)
 */
export async function exportClientData(params: {
  clientId: string;
  userId: string;
  tenantId: string;
}): Promise<{
  client: any;
  dossiers: any[];
  documents: any[];
  factures: any[];
}> {
  logger.info('Starting RGPD data export', {
    clientId: params.clientId,
    userId: params.userId,
  });

  const client = await prisma.client.findUnique({
    where: { id: params.clientId },
    include: {
      dossiers: {
        include: {
          documents: true,
          factures: true,
        },
      },
    },
  });

  if (!client) {
    throw new Error('Client not found');
  }

  // Validate tenant access
  if (client.tenantId !== params.tenantId) {
    throw new Error('Tenant isolation violation');
  }

  logRGPDAction(
    'EXPORT_DATA',
    params.userId,
    params.tenantId,
    params.clientId,
    { recordCount: client.dossiers.length }
  );

  return {
    client: {
      ...client,
      dossiers: undefined, // Remove to avoid duplication
    },
    dossiers: client.dossiers.map(d => ({
      ...d,
      documents: undefined,
      factures: undefined,
    })),
    documents: client.dossiers.flatMap(d => d.documents || []),
    factures: client.dossiers.flatMap(d => d.factures || []),
  };
}

/**
 * Anonymize client data (RGPD right to be forgotten)
 */
export async function anonymizeClientData(params: {
  clientId: string;
  userId: string;
  tenantId: string;
  reason: string;
}): Promise<void> {
  logger.info('Starting RGPD data anonymization', {
    clientId: params.clientId,
    reason: params.reason,
  });

  // Get client to validate tenant
  const client = await prisma.client.findUnique({
    where: { id: params.clientId },
    select: { tenantId: true },
  });

  if (!client || client.tenantId !== params.tenantId) {
    throw new Error('Client not found or tenant mismatch');
  }

  // Anonymize client data
  await prisma.client.update({
    where: { id: params.clientId },
    data: {
      firstName: 'ANONYMISE',
      lastName: 'ANONYMISE',
      email: `anonymise-${params.clientId}@deleted.local`,
      telephone: null,
      phoneSecondaire: null,
      address: null,
      adresse: null,
      passportNumber: null,
      idCardNumber: null,
      titreSejourNumber: null,
      dateOfBirth: null,
      lieuNaissance: null,
      iban: null,
      status: 'archive',
      dateArchivage: new Date(),
      raisonArchivage: `RGPD: ${params.reason}`,
    },
  });

  logRGPDAction(
    'ANONYMIZE',
    params.userId,
    params.tenantId,
    params.clientId,
    { reason: params.reason }
  );

  logger.info('Client data anonymized', {
    clientId: params.clientId,
  });
}

/**
 * Validate data processing compliance
 */
export function validateDataProcessing(params: {
  purpose: string;
  dataTypes: string[];
  hasConsent: boolean;
}): { allowed: boolean; reason?: string } {
  // Legal basis required
  if (!params.hasConsent) {
    return {
      allowed: false,
      reason: 'Consent RGPD required for data processing',
    };
  }

  // Sensitive data extra validation
  const sensitiveDataTypes = ['health', 'criminal', 'biometric'];
  const hasSensitiveData = params.dataTypes.some(type =>
    sensitiveDataTypes.includes(type)
  );

  if (hasSensitiveData) {
    return {
      allowed: false,
      reason: 'Sensitive data processing requires explicit legal basis',
    };
  }

  return { allowed: true };
}

/**
 * Log data access for audit trail
 */
export async function logDataAccess(params: {
  userId: string;
  tenantId: string;
  resourceType: 'client' | 'dossier' | 'document';
  resourceId: string;
  action: 'read' | 'write' | 'delete';
  purpose: string;
}): Promise<void> {
  logger.audit(
    `DATA_ACCESS: ${params.action.toUpperCase()}_${params.resourceType.toUpperCase()}`,
    params.userId,
    params.tenantId,
    {
      resourceId: params.resourceId,
      purpose: params.purpose,
      rgpdCompliant: true,
    }
  );
}
