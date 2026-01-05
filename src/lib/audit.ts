/**
 * Service de journalisation d'audit (append-only)
 * Zero-Trust Architecture - IA Poste Manager
 */

import { PrismaClient } from '@prisma/client';
import { hashAuditEvent } from './crypto';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

export type AuditAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'EXPORT'
  | 'IMPORT'
  | 'UPLOAD'
  | 'DOWNLOAD'
  | 'SHARE'
  | 'UNAUTHORIZED_ACCESS';

export type AuditObjectType =
  | 'User'
  | 'Tenant'
  | 'Client'
  | 'Dossier'
  | 'Document'
  | 'Facture'
  | 'RendezVous'
  | 'Settings'
  | 'Plan'
  | 'AIAction'
  | 'Alert'
  | 'Workspace'
  | 'ChecklistItem'
  | 'TimelineEvent';

export interface AuditLogEntry {
  tenantId?: string | null;
  userId?: string | null;
  userRole?: string | null;
  action: AuditAction;
  objectType: AuditObjectType;
  objectId?: string | null;
  metadata?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
  success?: boolean;
  errorMessage?: string | null;
}

/**
 * Enregistre une entrée dans le journal d'audit
 * Cette fonction ne peut QUE créer, jamais modifier ou supprimer
 * @param entry - Entrée d'audit à enregistrer
 * @returns L'entrée créée
 */
export async function logAudit(entry: AuditLogEntry) {
  const timestamp = new Date();
  
  // Calcul du hash de l'événement pour garantir l'intégrité
  const hash = hashAuditEvent({
    tenantId: entry.tenantId || null,
    userId: entry.userId || null,
    action: entry.action,
    objectType: entry.objectType,
    objectId: entry.objectId || null,
    timestamp,
    metadata: entry.metadata
  });
  
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        tenantId: entry.tenantId || null,
        userId: entry.userId || null,
        userRole: entry.userRole || null,
        action: entry.action,
        objectType: entry.objectType,
        objectId: entry.objectId || null,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        ipAddress: entry.ipAddress || null,
        userAgent: entry.userAgent || null,
        hash,
        success: entry.success ?? true,
        errorMessage: entry.errorMessage || null,
        timestamp
      }
    });
    
    return auditLog;
  } catch (error) {
    logger.error('Erreur création log audit', { error, action: entry.action, tenantId: entry.tenantId, userId: entry.userId });
    throw error;
  }
}

/**
 * Récupère les logs d'audit pour un tenant
 * @param tenantId - ID du tenant
 * @param options - Options de filtrage et pagination
 * @returns Liste des logs d'audit
 */
export async function getAuditLogs(
  tenantId: string,
  options?: {
    userId?: string;
    action?: AuditAction;
    objectType?: AuditObjectType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }
) {
  const where: any = { tenantId };
  
  if (options?.userId) where.userId = options.userId;
  if (options?.action) where.action = options.action;
  if (options?.objectType) where.objectType = options.objectType;
  
  if (options?.startDate || options?.endDate) {
    where.timestamp = {};
    if (options.startDate) where.timestamp.gte = options.startDate;
    if (options.endDate) where.timestamp.lte = options.endDate;
  }
  
  return await prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: options?.limit || 100,
    skip: options?.offset || 0
  });
}

/**
 * Récupère les logs d'audit pour un objet spécifique
 * @param objectType - Type d'objet
 * @param objectId - ID de l'objet
 * @returns Historique complet de l'objet
 */
export async function getObjectHistory(
  objectType: AuditObjectType,
  objectId: string
) {
  return await prisma.auditLog.findMany({
    where: {
      objectType,
      objectId
    },
    orderBy: { timestamp: 'asc' }
  });
}

/**
 * Détecte les accès non autorisés (tentatives cross-tenant)
 * @param tenantId - ID du tenant à surveiller
 * @param hours - Nombre d'heures à analyser (par défaut 24h)
 * @returns Liste des tentatives d'accès non autorisé
 */
export async function detectUnauthorizedAccess(
  tenantId?: string,
  hours: number = 24
) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  const where: any = {
    action: 'UNAUTHORIZED_ACCESS',
    timestamp: { gte: since },
    success: false
  };
  
  if (tenantId) where.tenantId = tenantId;
  
  return await prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: 'desc' }
  });
}

/**
 * Compte les actions d'un utilisateur sur une période
 * Utile pour la détection d'anomalies
 * @param userId - ID de l'utilisateur
 * @param action - Type d'action à compter
 * @param hours - Période en heures
 * @returns Nombre d'actions
 */
export async function countUserActions(
  userId: string,
  action: AuditAction,
  hours: number = 1
): Promise<number> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return await prisma.auditLog.count({
    where: {
      userId,
      action,
      timestamp: { gte: since }
    }
  });
}

/**
 * Helpers pour journaliser des événements communs
 */
export const AuditHelpers = {
  /**
   * Log une connexion réussie
   */
  logLogin: (userId: string, tenantId: string | null, ip?: string, userAgent?: string) =>
    logAudit({
      userId,
      tenantId,
      action: 'LOGIN',
      objectType: 'User',
      objectId: userId,
      ipAddress: ip || null,
      userAgent: userAgent || null,
      success: true
    }),
  
  /**
   * Log une tentative de connexion échouée
   */
  logLoginFailed: (email: string, ip?: string, userAgent?: string) =>
    logAudit({
      action: 'LOGIN_FAILED',
      objectType: 'User',
      metadata: { email },
      ipAddress: ip || null,
      userAgent: userAgent || null,
      success: false
    }),
  
  /**
   * Log un accès non autorisé
   */
  logUnauthorizedAccess: (
    userId: string | null,
    tenantId: string | null,
    objectType: AuditObjectType,
    objectId: string,
    reason: string,
    ip?: string
  ) =>
    logAudit({
      userId,
      tenantId,
      action: 'UNAUTHORIZED_ACCESS',
      objectType,
      objectId,
      metadata: { reason },
      ipAddress: ip || null,
      success: false,
      errorMessage: reason
    }),
  
  /**
   * Log la création d'un document
   */
  logDocumentCreate: (
    tenantId: string,
    userId: string,
    documentId: string,
    filename: string,
    hash: string
  ) =>
    logAudit({
      tenantId,
      userId,
      action: 'CREATE',
      objectType: 'Document',
      objectId: documentId,
      metadata: { filename, hash },
      success: true
    }),
  
  /**
   * Log le téléchargement d'un document
   */
  logDocumentDownload: (
    tenantId: string,
    userId: string,
    documentId: string,
    ip?: string
  ) =>
    logAudit({
      tenantId,
      userId,
      action: 'DOWNLOAD',
      objectType: 'Document',
      objectId: documentId,
      ipAddress: ip || null,
      success: true
    })
};
