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
