/**
 * Plan Limits & AI Guards - memoLib
 *
 * Syst�me de v�rification des limites par plan et garde-fous IA
 * Impl�mente la Charte IA et les niveaux d'autonomie
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// TYPES
// ============================================

export interface PlanLimits {
  maxDossiers: number;
  maxClients: number;
  maxStorageGb: number;
  maxUsers: number;
  aiAutonomyLevel: number; // 1-4
  humanValidation: boolean;
  advancedAnalytics: boolean;
  externalAiAccess: boolean;
  prioritySupport: boolean;
}

export interface TenantUsage {
  currentDossiers: number;
  currentClients: number;
  currentStorageGb: number;
  currentUsers: number;
}

export interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  currentUsage?: number;
  limit?: number;
}

export interface AIActionResult {
  allowed: boolean;
  requiresValidation: boolean;
  reason?: string;
  autonomyLevel?: number;
}

// ============================================
// ACTIONS IA (selon Charte IA)
// ============================================

export enum AIAction {
  // Actions autoris�es (niveau 1+)
  SORT_MESSAGES = 'SORT_MESSAGES',
  PRIORITIZE = 'PRIORITIZE',
  REQUEST_DOCUMENTS = 'REQUEST_DOCUMENTS',
  GENERATE_DRAFT = 'GENERATE_DRAFT',
  AUTO_REMINDER = 'AUTO_REMINDER',
  ARCHIVE = 'ARCHIVE',

  // Actions niveau 2+
  ANALYZE_RISK = 'ANALYZE_RISK',
  SUGGEST_ACTIONS = 'SUGGEST_ACTIONS',

  // Actions niveau 3+
  AUTO_REPLY_CLIENT = 'AUTO_REPLY_CLIENT',
  GENERATE_FORM = 'GENERATE_FORM',

  // Actions niveau 4 (Enterprise)
  ADVANCED_ANALYTICS = 'ADVANCED_ANALYTICS',
  EXTERNAL_AI_CALL = 'EXTERNAL_AI_CALL',

  // Actions INTERDITES sans validation humaine
  VALIDATE_LEGAL_ACT = 'VALIDATE_LEGAL_ACT',
  SEND_OFFICIAL_DOCUMENT = 'SEND_OFFICIAL_DOCUMENT',
  CHOOSE_LEGAL_STRATEGY = 'CHOOSE_LEGAL_STRATEGY',
  COMMIT_CABINET = 'COMMIT_CABINET',
}

// Niveau minimum requis par action
const AI_ACTION_LEVELS: Record<AIAction, number> = {
  [AIAction.SORT_MESSAGES]: 1,
  [AIAction.PRIORITIZE]: 1,
  [AIAction.REQUEST_DOCUMENTS]: 1,
  [AIAction.GENERATE_DRAFT]: 1,
  [AIAction.AUTO_REMINDER]: 1,
  [AIAction.ARCHIVE]: 1,

  [AIAction.ANALYZE_RISK]: 2,
  [AIAction.SUGGEST_ACTIONS]: 2,

  [AIAction.AUTO_REPLY_CLIENT]: 3,
  [AIAction.GENERATE_FORM]: 3,

  [AIAction.ADVANCED_ANALYTICS]: 4,
  [AIAction.EXTERNAL_AI_CALL]: 4,

  // Toujours interdit en autonome
  [AIAction.VALIDATE_LEGAL_ACT]: 999,
  [AIAction.SEND_OFFICIAL_DOCUMENT]: 999,
  [AIAction.CHOOSE_LEGAL_STRATEGY]: 999,
  [AIAction.COMMIT_CABINET]: 999,
};

// ============================================
// V�RIFICATION DES LIMITES
// ============================================

/**
 * V�rifie si un tenant peut cr�er un nouveau dossier
 */
export async function canCreateDossier(tenantId: string): Promise<LimitCheckResult> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });

  if (!tenant) {
    return { allowed: false, reason: 'Tenant not found' };
  }

  if (tenant.currentDossiers >= tenant.plan.maxDossiers) {
    return {
      allowed: false,
      reason: `Limit reached: ${tenant.plan.maxDossiers} dossiers max for ${tenant.plan.name} plan`,
      currentUsage: tenant.currentDossiers,
      limit: tenant.plan.maxDossiers,
    };
  }

  return { allowed: true };
}

/**
 * V�rifie si un tenant peut ajouter un nouveau client
 */
export async function canAddClient(tenantId: string): Promise<LimitCheckResult> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });

  if (!tenant) {
    return { allowed: false, reason: 'Tenant not found' };
  }

  if (tenant.currentClients >= tenant.plan.maxClients) {
    return {
      allowed: false,
      reason: `Limit reached: ${tenant.plan.maxClients} clients max for ${tenant.plan.name} plan`,
      currentUsage: tenant.currentClients,
      limit: tenant.plan.maxClients,
    };
  }

  return { allowed: true };
}

/**
 * V�rifie si un tenant peut ajouter un nouvel utilisateur
 */
export async function canAddUser(tenantId: string): Promise<LimitCheckResult> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });

  if (!tenant) {
    return { allowed: false, reason: 'Tenant not found' };
  }

  if (tenant.currentUsers >= tenant.plan.maxUsers) {
    return {
      allowed: false,
      reason: `Limit reached: ${tenant.plan.maxUsers} users max for ${tenant.plan.name} plan`,
      currentUsage: tenant.currentUsers,
      limit: tenant.plan.maxUsers,
    };
  }

  return { allowed: true };
}

/**
 * V�rifie si un tenant peut uploader un fichier
 */
export async function canUploadFile(
  tenantId: string,
  fileSizeGb: number
): Promise<LimitCheckResult> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });

  if (!tenant) {
    return { allowed: false, reason: 'Tenant not found' };
  }

  const newTotal = tenant.currentStorageGb + fileSizeGb;

  if (newTotal > tenant.plan.maxStorageGb) {
    return {
      allowed: false,
      reason: `Storage limit reached: ${tenant.plan.maxStorageGb}GB max for ${tenant.plan.name} plan`,
      currentUsage: tenant.currentStorageGb,
      limit: tenant.plan.maxStorageGb,
    };
  }

  return { allowed: true };
}

// ============================================
// GARDE-FOUS IA (selon Charte IA)
// ============================================

/**
 * V�rifie si une action IA est autoris�e selon le plan
 */
export async function canPerformAIAction(
  tenantId: string,
  action: AIAction
): Promise<AIActionResult> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });

  if (!tenant) {
    return {
      allowed: false,
      requiresValidation: true,
      reason: 'Tenant not found',
    };
  }

  const requiredLevel = AI_ACTION_LEVELS[action];
  const tenantLevel = tenant.plan.aiAutonomyLevel;

  // Actions toujours interdites en autonome (999)
  if (requiredLevel === 999) {
    return {
      allowed: false,
      requiresValidation: true,
      reason: 'Cette action n�cessite TOUJOURS une validation humaine (Charte IA)',
      autonomyLevel: tenantLevel,
    };
  }

  // V�rifier le niveau d'autonomie
  if (tenantLevel < requiredLevel) {
    return {
      allowed: false,
      requiresValidation: true,
      reason: `AI autonomy level ${requiredLevel} required, plan has level ${tenantLevel}`,
      autonomyLevel: tenantLevel,
    };
  }

  // V�rifier si validation humaine est forc�e par le plan
  const requiresValidation = tenant.plan.humanValidation;

  return {
    allowed: true,
    requiresValidation,
    autonomyLevel: tenantLevel,
  };
}

/**
 * V�rifie si l'acc�s aux analytics avanc�s est autoris�
 */
export async function canAccessAdvancedAnalytics(tenantId: string): Promise<boolean> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });

  return tenant?.plan.advancedAnalytics ?? false;
}

/**
 * V�rifie si l'acc�s aux IA externes est autoris�
 */
export async function canAccessExternalAI(tenantId: string): Promise<boolean> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });

  return tenant?.plan.externalAiAccess ?? false;
}

/**
 * V�rifie si le support prioritaire est activ�
 */
export async function hasPrioritySupport(tenantId: string): Promise<boolean> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });

  return tenant?.plan.prioritySupport ?? false;
}

// ============================================
// UTILITAIRES
// ============================================

/**
 * R�cup�re les limites du plan d'un tenant
 */
export async function getTenantLimits(tenantId: string): Promise<PlanLimits | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });

  if (!tenant) return null;

  return {
    maxDossiers: tenant.plan.maxDossiers,
    maxClients: tenant.plan.maxClients,
    maxStorageGb: tenant.plan.maxStorageGb,
    maxUsers: tenant.plan.maxUsers,
    aiAutonomyLevel: tenant.plan.aiAutonomyLevel,
    humanValidation: tenant.plan.humanValidation,
    advancedAnalytics: tenant.plan.advancedAnalytics,
    externalAiAccess: tenant.plan.externalAiAccess,
    prioritySupport: tenant.plan.prioritySupport,
  };
}

/**
 * R�cup�re l'usage actuel d'un tenant
 */
export async function getTenantUsage(tenantId: string): Promise<TenantUsage | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) return null;

  return {
    currentDossiers: tenant.currentDossiers,
    currentClients: tenant.currentClients,
    currentStorageGb: tenant.currentStorageGb,
    currentUsers: tenant.currentUsers,
  };
}

/**
 * Incr�mente le compteur de dossiers d'un tenant
 */
export async function incrementDossierCount(tenantId: string): Promise<void> {
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { currentDossiers: { increment: 1 } },
  });
}

/**
 * Incr�mente le compteur de clients d'un tenant
 */
export async function incrementClientCount(tenantId: string): Promise<void> {
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { currentClients: { increment: 1 } },
  });
}

/**
 * Incr�mente le compteur d'utilisateurs d'un tenant
 */
export async function incrementUserCount(tenantId: string): Promise<void> {
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { currentUsers: { increment: 1 } },
  });
}

/**
 * Ajoute du stockage utilis� pour un tenant
 */
export async function addStorageUsage(tenantId: string, sizeGb: number): Promise<void> {
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { currentStorageGb: { increment: sizeGb } },
  });
}

/**
 * Log une action IA (pour traçabilité - Charte IA)
 */
export async function logAIAction(data: {
  tenantId: string;
  action: AIAction;
  userId?: string;
  validated: boolean;
  metadata?: any;
}): Promise<void> {
  try {
    // Utiliser le logger professionnel pour traçabilité IA
    const { logger } = await import('@/lib/logger');

    logger.audit(
      `AI_${data.action}`,
      data.userId || 'system',
      data.tenantId,
      {
        module: 'AI',
        message: `Action IA: ${data.action} - ${data.validated ? 'Validé' : 'Non validé'}`,
        validated: data.validated,
        ...data.metadata,
      }
    );

    // En production, envoyer aussi à Sentry pour suivi IA
    if (process.env.NODE_ENV === 'production') {
      import('@sentry/nextjs')
        .then(Sentry => {
          Sentry.addBreadcrumb({
            category: 'ai.action',
            message: `${data.action} - ${data.validated ? 'validated' : 'rejected'}`,
            level: data.validated ? 'info' : 'warning',
            data: {
              tenantId: data.tenantId,
              userId: data.userId,
            },
          });
        })
        .catch(() => {});
    }
  } catch (error) {
    // Log silencieusement en cas d'erreur pour ne pas bloquer le flux
    console.error('[AI Audit] Failed to log AI action:', error);
  }
}
