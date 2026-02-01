/**
 * Service de gestion des quotas
 * Verifie et applique les limites par plan
 */

import { prisma } from '@/lib/prisma';

export interface QuotaCheck {
  allowed: boolean;
  current: number;
  limit: number;
  percentage: number;
  warningLevel?: 'normal' | 'warning' | 'critical' | 'exceeded';
}

export type ResourceType = 'workspaces' | 'dossiers' | 'clients' | 'users' | 'storage';

/**
 * Verifie si un tenant peut creer une ressource
 */
export async function checkQuota(
  tenantId: string,
  resourceType: ResourceType
): Promise<QuotaCheck> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      plan: {
        select: {
          maxWorkspaces: true,
          maxDossiers: true,
          maxClients: true,
          maxUsers: true,
          maxStorageGb: true,
        }
      }
    }
  });

  if (!tenant || !tenant.plan) {
    throw new Error('Tenant ou plan introuvable');
  }

  let current = 0;
  let limit = 0;

  switch (resourceType) {
    case 'workspaces':
      current = tenant.currentWorkspaces;
      limit = tenant.plan.maxWorkspaces;
      break;
    case 'dossiers':
      current = tenant.currentDossiers;
      limit = tenant.plan.maxDossiers;
      break;
    case 'clients':
      current = tenant.currentClients;
      limit = tenant.plan.maxClients;
      break;
    case 'users':
      current = tenant.currentUsers;
      limit = tenant.plan.maxUsers;
      break;
    case 'storage':
      current = tenant.currentStorageGb;
      limit = tenant.plan.maxStorageGb;
      break;
  }

  // Illimite = -1
  if (limit === -1) {
    return {
      allowed: true,
      current,
      limit: -1,
      percentage: 0,
      warningLevel: 'normal'
    };
  }

  const percentage = (current / limit) * 100;
  const allowed = current < limit;

  let warningLevel: 'normal' | 'warning' | 'critical' | 'exceeded' = 'normal';
  if (percentage >= 100) {
    warningLevel = 'exceeded';
  } else if (percentage >= 95) {
    warningLevel = 'critical';
  } else if (percentage >= 80) {
    warningLevel = 'warning';
  }

  return {
    allowed,
    current,
    limit,
    percentage,
    warningLevel
  };
}

/**
 * Applique le quota - bloque si depasse
 * @throws Error si quota depasse
 */
export async function enforceQuota(
  tenantId: string,
  resourceType: ResourceType
): Promise<void> {
  const quotaCheck = await checkQuota(tenantId, resourceType);

  if (!quotaCheck.allowed) {
    // Creer evenement quota
    await prisma.quotaEvent.create({
      data: {
        tenantId,
        quotaType: resourceType,
        currentValue: quotaCheck.current,
        limitValue: quotaCheck.limit,
        percentage: quotaCheck.percentage,
        eventType: 'exceeded',
        actionTaken: 'blocked_creation',
      }
    });

    throw new Error(
      `Quota ${resourceType} depasse (${quotaCheck.current}/${quotaCheck.limit}). ` +
      `Veuillez mettre a niveau votre plan.`
    );
  }

  // Creer alerte si proche de la limite
  if (quotaCheck.warningLevel === 'warning' || quotaCheck.warningLevel === 'critical') {
    await prisma.quotaEvent.create({
      data: {
        tenantId,
        quotaType: resourceType,
        currentValue: quotaCheck.current,
        limitValue: quotaCheck.limit,
        percentage: quotaCheck.percentage,
        eventType: quotaCheck.warningLevel === 'critical' ? 'critical' : 'warning',
        actionTaken: 'notification_sent',
      }
    });
  }
}

/**
 * Incremente l'usage d'une ressource
 */
export async function incrementUsage(
  tenantId: string,
  resourceType: ResourceType,
  amount: number = 1
): Promise<void> {
  const fieldMap: Record<ResourceType, string> = {
    workspaces: 'currentWorkspaces',
    dossiers: 'currentDossiers',
    clients: 'currentClients',
    users: 'currentUsers',
    storage: 'currentStorageGb',
  };

  const field = fieldMap[resourceType];

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      [field]: {
        increment: amount
      }
    }
  });
}

/**
 * Decremente l'usage d'une ressource
 */
export async function decrementUsage(
  tenantId: string,
  resourceType: ResourceType,
  amount: number = 1
): Promise<void> {
  const fieldMap: Record<ResourceType, string> = {
    workspaces: 'currentWorkspaces',
    dossiers: 'currentDossiers',
    clients: 'currentClients',
    users: 'currentUsers',
    storage: 'currentStorageGb',
  };

  const field = fieldMap[resourceType];

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      [field]: {
        decrement: amount
      }
    }
  });
}

/**
 * Obtient le statut de tous les quotas d'un tenant
 */
export async function getAllQuotas(tenantId: string) {
  const resourceTypes: ResourceType[] = ['workspaces', 'dossiers', 'clients', 'users', 'storage'];
  
  const quotas = await Promise.all(
    resourceTypes.map(async (type) => {
      const check = await checkQuota(tenantId, type);
      return {
        type,
        ...check
      };
    })
  );

  return quotas.filter(q => q.limit !== -1); // Filtrer les illimites
}
