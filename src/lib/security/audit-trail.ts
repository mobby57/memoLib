/**
 * Comprehensive Audit Trail System
 * - RGPD/GDPR compliant logging
 * - Track all sensitive data access
 * - Immutable audit logs
 * - Compliance reporting
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type AuditAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'DOWNLOAD'
  | 'LOGIN'
  | 'LOGOUT'
  | 'FAILED_LOGIN'
  | 'PERMISSION_DENIED'
  | 'DATA_BREACH_ATTEMPT';

export type AuditResource =
  | 'CLIENT'
  | 'DOSSIER'
  | 'DOCUMENT'
  | 'EMAIL'
  | 'USER'
  | 'TENANT'
  | 'SYSTEM';

interface AuditLogData {
  userId: string;
  tenantId?: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  sensitiveData?: boolean;
}

/**
 * Create immutable audit log entry
 */
export async function createAuditLog(data: AuditLogData) {
  try {
    const log = await prisma.auditLog.create({
      data: {
        userId: data.userId,
        tenantId: data.tenantId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        description: data.description,
        metadata: data.metadata as any,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        success: data.success,
        sensitiveData: data.sensitiveData || false,
        timestamp: new Date(),
      },
    });

    // Log critical events to external monitoring (Sentry)
    if (!data.success || data.action === 'DATA_BREACH_ATTEMPT') {
      console.error('[SECURITY ALERT]', {
        action: data.action,
        userId: data.userId,
        resource: data.resource,
        description: data.description,
      });

      // Send security alert to Sentry
      import('@sentry/nextjs')
        .then(Sentry => {
          Sentry.captureMessage(`[SECURITY ALERT] ${data.action}`, {
            level: data.action === 'DATA_BREACH_ATTEMPT' ? 'fatal' : 'warning',
            tags: {
              action: data.action,
              resource: data.resource,
              success: String(data.success),
              category: 'security_audit',
            },
            extra: {
              userId: data.userId,
              tenantId: data.tenantId,
              resourceId: data.resourceId,
              description: data.description,
              ipAddress: data.ipAddress,
              userAgent: data.userAgent,
            },
          });
        })
        .catch(() => {
          // Sentry non disponible
        });
    }

    return log;
  } catch (error) {
    // Critical: Audit logging must never fail silently
    console.error('[AUDIT TRAIL FAILURE]', error, data);
    throw error;
  }
}

/**
 * Audit middleware for API routes
 */
export function auditMiddleware(action: AuditAction, resource: AuditResource) {
  return async (req: any, session: any, next: () => Promise<any>) => {
    const startTime = Date.now();
    let success = true;
    let error: any = null;

    try {
      const result = await next();
      return result;
    } catch (err) {
      success = false;
      error = err;
      throw err;
    } finally {
      // Log after request completes
      const duration = Date.now() - startTime;

      await createAuditLog({
        userId: session?.user?.id || 'anonymous',
        tenantId: session?.user?.tenantId,
        action,
        resource,
        resourceId: req.params?.id || req.query?.id,
        description: `${action} ${resource}`,
        metadata: {
          method: req.method,
          url: req.url,
          duration,
          error: error?.message,
        },
        ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        success,
        sensitiveData: ['CLIENT', 'DOCUMENT', 'EMAIL'].includes(resource),
      });
    }
  };
}

/**
 * Get audit logs with filters (for compliance reporting)
 */
export async function getAuditLogs(filters: {
  userId?: string;
  tenantId?: string;
  action?: AuditAction;
  resource?: AuditResource;
  startDate?: Date;
  endDate?: Date;
  sensitiveOnly?: boolean;
  limit?: number;
}) {
  return await prisma.auditLog.findMany({
    where: {
      userId: filters.userId,
      tenantId: filters.tenantId,
      action: filters.action,
      resource: filters.resource,
      timestamp: {
        gte: filters.startDate,
        lte: filters.endDate,
      },
      sensitiveData: filters.sensitiveOnly ? true : undefined,
    },
    orderBy: {
      timestamp: 'desc',
    },
    take: filters.limit || 100,
  });
}

/**
 * Generate RGPD compliance report
 */
export async function generateComplianceReport(tenantId: string, startDate: Date, endDate: Date) {
  const logs = await prisma.auditLog.findMany({
    where: {
      tenantId,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Aggregate statistics
  const stats = {
    totalActions: logs.length,
    sensitiveDataAccess: logs.filter(l => l.sensitiveData).length,
    failedActions: logs.filter(l => !l.success).length,
    actionsByType: logs.reduce(
      (acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    resourcesByType: logs.reduce(
      (acc, log) => {
        acc[log.resource] = (acc[log.resource] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    uniqueUsers: new Set(logs.map(l => l.userId)).size,
  };

  return {
    period: { start: startDate, end: endDate },
    tenantId,
    statistics: stats,
    logs: logs.map(log => ({
      timestamp: log.timestamp,
      user: log.userId,
      action: log.action,
      resource: log.resource,
      success: log.success,
    })),
  };
}

/**
 * Check for suspicious activity patterns
 */
export async function detectSuspiciousActivity(userId: string, hours: number = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const logs = await prisma.auditLog.findMany({
    where: {
      userId,
      timestamp: { gte: since },
    },
  });

  const suspicious = {
    multipleFailedLogins: logs.filter(l => l.action === 'FAILED_LOGIN').length > 5,

    excessiveExports: logs.filter(l => l.action === 'EXPORT').length > 20,

    unusualHours:
      logs.filter(l => {
        const hour = l.timestamp.getHours();
        return hour < 6 || hour > 22;
      }).length > 10,

    massDataAccess: logs.filter(l => l.action === 'READ' && l.sensitiveData).length > 100,
  };

  const isSuspicious = Object.values(suspicious).some(v => v === true);

  if (isSuspicious) {
    await createAuditLog({
      userId: 'SYSTEM',
      action: 'DATA_BREACH_ATTEMPT',
      resource: 'SYSTEM',
      description: `Suspicious activity detected for user ${userId}`,
      metadata: suspicious,
      success: true,
      sensitiveData: true,
    });
  }

  return { suspicious: isSuspicious, details: suspicious };
}
