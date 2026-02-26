import prisma from '@/lib/prisma';
import crypto from 'crypto';

export interface AuditContext {
  tenantId: string;
  userId: string;
  userEmail: string;
  userRole: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(
  context: AuditContext,
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPORT' | 'APPROVE' | 'REJECT' | 'ESCALATE' | 'ARCHIVE',
  entityType: string,
  entityId: string,
  oldValue?: unknown,
  newValue?: unknown
) {
  try {
    const lastLog = await prisma.auditLog.findFirst({
      where: { tenantId: context.tenantId },
      orderBy: { timestamp: 'desc' },
      select: { id: true, timestampHash: true },
    });

    const timestamp = new Date();
    const hashData = `${action}|${entityType}|${entityId}|${timestamp.toISOString()}|${lastLog?.timestampHash || ''}`;
    const timestampHash = crypto.createHash('sha256').update(hashData).digest('hex');

    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        userId: context.userId,
        userEmail: context.userEmail,
        userRole: context.userRole,
        action,
        entityType,
        entityId,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        timestamp,
        timestampHash,
        previousLogId: lastLog?.id || null,
      },
    });
  } catch (error) {
    console.error('Erreur création audit log:', error);
  }
}

export function getAuditContext(request: Request, user: { id: string; email: string; role: string; tenantId?: string }): AuditContext {
  return {
    tenantId: user.tenantId || '',
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    userAgent: request.headers.get('user-agent') || undefined,
  };
}

// ============================================
// Compatibilité legacy (middleware zero-trust)
// ============================================

type LegacyAuditParams = {
  action: string;
  objectType: string;
  metadata?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  tenantId?: string | null;
  userId?: string;
  userRole?: string;
};

export async function logAudit(params: LegacyAuditParams): Promise<void> {
  const context: AuditContext = {
    tenantId: params.tenantId || 'unknown',
    userId: params.userId || 'anonymous',
    userEmail: 'unknown',
    userRole: params.userRole || 'UNKNOWN',
    ipAddress: params.ipAddress || undefined,
    userAgent: params.userAgent || undefined,
  };

  await createAuditLog(
    context,
    'READ',
    params.objectType,
    params.action,
    undefined,
    {
      success: params.success,
      errorMessage: params.errorMessage,
      metadata: params.metadata,
    }
  );
}

export const AuditHelpers = {
  async logUnauthorizedAccess(
    userId: string,
    tenantId: string | null,
    objectType: string,
    _objectId: string,
    reason: string,
    ipAddress?: string
  ) {
    const context: AuditContext = {
      tenantId: tenantId || 'unknown',
      userId: userId || 'anonymous',
      userEmail: 'unknown',
      userRole: 'UNKNOWN',
      ipAddress,
    };

    await createAuditLog(context, 'READ', objectType, 'UNAUTHORIZED', undefined, {
      success: false,
      errorMessage: reason,
    });
  },
};
