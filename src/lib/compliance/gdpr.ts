import { prisma } from '@/lib/prisma';

export const CONSENT_TYPES = [
  'essential',
  'analytics',
  'marketing',
  'personalization',
  'third_party',
] as const;

export type ConsentType = (typeof CONSENT_TYPES)[number];
export const CURRENT_PRIVACY_POLICY_VERSION = '2026-10-01';

export const DATA_CATEGORIES = ['profile', 'preferences', 'usage'] as const;
export type DataCategory = (typeof DATA_CATEGORIES)[number];

export interface ConsentRecord {
  type: ConsentType;
  granted: boolean;
  timestamp: Date;
  version: string | null;
}

export interface DeletionRequest {
  id: string;
  userId: string;
  requestedAt: Date;
  scheduledFor: Date;
  status: 'PENDING_REVIEW' | 'CANCELLED';
}

const DEFAULT_EXPORT_CATEGORIES: DataCategory[] = ['profile', 'preferences', 'usage'];
const ERASURE_GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Operational data-subject-rights helpers. Legal qualification of a request,
 * retention exceptions, and any action in Clerk remain subject to human review.
 */
export class GDPRCompliance {
  static async recordConsents(
    userId: string,
    consents: Array<{ type: ConsentType; granted: boolean; version: string }>
  ): Promise<void> {
    await prisma.$transaction(
      consents.map((consent) =>
        prisma.userConsent.create({
          data: {
            userId,
            type: consent.type,
            granted: consent.granted,
            policyVersion: consent.version,
          },
        })
      )
    );
  }

  static async getUserConsents(userId: string): Promise<ConsentRecord[]> {
    const consents = await prisma.userConsent.findMany({
      where: { userId },
      orderBy: { grantedAt: 'desc' },
      select: {
        type: true,
        granted: true,
        grantedAt: true,
        policyVersion: true,
      },
    });

    return consents.map((consent) => ({
      type: consent.type as ConsentType,
      granted: consent.granted,
      timestamp: consent.grantedAt,
      version: consent.policyVersion,
    }));
  }

  static async exportUserData(
    userId: string,
    categories: DataCategory[] = DEFAULT_EXPORT_CATEGORIES
  ): Promise<Record<string, unknown>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        tenantId: true,
        email: true,
        name: true,
        avatar: true,
        phone: true,
        language: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user?.tenantId) {
      throw new Error('Unable to prepare an export for this account.');
    }

    const exportData: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      categories: {},
    };
    const result = exportData.categories as Record<string, unknown>;

    if (categories.includes('profile')) {
      result.profile = {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        phone: user.phone,
        language: user.language,
        timezone: user.timezone,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    }

    if (categories.includes('preferences')) {
      result.preferences = { consents: await this.getUserConsents(userId) };
    }

    if (categories.includes('usage')) {
      result.usage = {
        auditEvents: await prisma.auditLog.findMany({
          where: { tenantId: user.tenantId, userId },
          orderBy: { timestamp: 'desc' },
          take: 1000,
          select: {
            action: true,
            entityType: true,
            entityId: true,
            timestamp: true,
          },
        }),
      };
    }

    return exportData;
  }

  static async requestDeletion(userId: string): Promise<DeletionRequest> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, tenantId: true },
    });

    if (!user?.tenantId) {
      throw new Error('Unable to create an erasure request for this account.');
    }

    const activeRequest = await prisma.dataSubjectRequest.findFirst({
      where: {
        tenantId: user.tenantId,
        userId,
        requestType: 'ERASURE',
        status: 'PENDING_REVIEW',
      },
      select: { id: true },
    });
    if (activeRequest) {
      throw new Error('An erasure request is already pending.');
    }

    const requestedAt = new Date();
    const scheduledFor = new Date(requestedAt.getTime() + ERASURE_GRACE_PERIOD_MS);
    const request = await prisma.dataSubjectRequest.create({
      data: {
        tenantId: user.tenantId,
        userId,
        requestType: 'ERASURE',
        status: 'PENDING_REVIEW',
        requestedAt,
        scheduledFor,
      },
      select: {
        id: true,
        userId: true,
        requestedAt: true,
        scheduledFor: true,
        status: true,
      },
    });

    return request as DeletionRequest;
  }

  static async cancelDeletion(userId: string): Promise<boolean> {
    const result = await prisma.dataSubjectRequest.updateMany({
      where: { userId, requestType: 'ERASURE', status: 'PENDING_REVIEW' },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
    return result.count > 0;
  }

  static async getDeletionRequests(userId: string) {
    return prisma.dataSubjectRequest.findMany({
      where: { userId, requestType: 'ERASURE' },
      orderBy: { requestedAt: 'desc' },
      select: {
        id: true,
        requestedAt: true,
        scheduledFor: true,
        status: true,
        cancelledAt: true,
        completedAt: true,
      },
    });
  }
}

export const DATA_RETENTION = {
  legalFiles: 1825,
} as const;

export async function checkLegalRetention(
  dossierId: string,
  tenantId: string
): Promise<{ canDelete: boolean; reason?: string; retentionEndDate?: Date }> {
  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, tenantId },
    select: { createdAt: true, dateCloture: true, statut: true },
  });

  if (!dossier) {
    return { canDelete: false, reason: 'Dossier absent du périmètre du tenant.' };
  }

  const closedStatuses = new Set(['archive', 'clos']);
  const isClosed =
    Boolean(dossier.dateCloture) || closedStatuses.has(dossier.statut.toLowerCase());
  if (!isClosed) {
    return { canDelete: false, reason: 'Dossier encore actif.' };
  }

  const referenceDate = dossier.dateCloture ?? dossier.createdAt;
  const retentionEndDate = new Date(
    referenceDate.getTime() + DATA_RETENTION.legalFiles * 24 * 60 * 60 * 1000
  );
  if (new Date() < retentionEndDate) {
    return {
      canDelete: false,
      reason: 'Période de conservation configurée non échue; validation humaine requise.',
      retentionEndDate,
    };
  }

  return { canDelete: true, retentionEndDate };
}
