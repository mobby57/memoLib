/**
 * Tenant Isolation Middleware
 *
 * Enforces multi-tenant data isolation at the middleware level.
 * CRITICAL: Every API request must be scoped to the authenticated user's tenant.
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildRbacContext, resolveGroupsFromRole } from '@/lib/auth/rbac';
import { getAuthToken } from '@/lib/auth/nextauth-token';
import { logger } from '@/lib/logger';

interface TenantContext {
  tenantId: string;
  userId: string;
  role: string;
  groups: string[];
}

/**
 * Extract tenant context from authenticated session
 */
export async function getTenantContext(req: NextRequest): Promise<TenantContext | null> {
  try {
    const token = await getAuthToken(req);

    if (!token) {
      return null;
    }

    const rbac = buildRbacContext({ role: (token as any).role });

    return {
      tenantId: (token as any).tenantId,
      userId: (token as any).id || (token as any).sub,
      role: rbac.role,
      groups: rbac.groups,
    };
  } catch (error) {
    logger.error('Failed to extract tenant context', error);
    return null;
  }
}

/**
 * Validate tenant access for a resource
 */
export function validateTenantAccess(
  context: TenantContext,
  resourceTenantId: string
): boolean {
  // Super Admin can access all tenants
  if (context.groups.includes('platform-admin')) {
    return true;
  }

  // Other users can only access their own tenant
  if (context.tenantId !== resourceTenantId) {
    logger.warn('Tenant isolation violation attempt', {
      userId: context.userId,
      userTenantId: context.tenantId,
      requestedTenantId: resourceTenantId,
    });
    return false;
  }

  return true;
}

/**
 * Middleware wrapper for tenant-scoped API routes
 */
export function withTenantIsolation(
  handler: (
    req: NextRequest,
    context: TenantContext
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Extract tenant context
    const context = await getTenantContext(req);

    if (!context) {
      logger.warn('Unauthenticated request blocked', {
        path: req.nextUrl.pathname,
      });

      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Clients can only access their own data - enforce strict isolation
    if (context.groups.includes('client')) {
      const pathParts = req.nextUrl.pathname.split('/');
      const clientIdInPath = pathParts.find(part => part.match(/^[0-9a-f-]{36}$/i));

      // For client routes, validate they're accessing their own data
      if (clientIdInPath && clientIdInPath !== (context as any).clientId) {
        logger.warn('Client attempted cross-client access', {
          userId: context.userId,
          attemptedClientId: clientIdInPath,
        });

        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Log tenant-scoped request
    logger.info('Tenant-scoped request', {
      tenantId: context.tenantId,
      userId: context.userId,
      role: context.role,
      path: req.nextUrl.pathname,
      method: req.method,
    });

    try {
      return await handler(req, context);
    } catch (error) {
      logger.error('Request handler error', error, {
        tenantId: context.tenantId,
        userId: context.userId,
        path: req.nextUrl.pathname,
      });

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Check if user has required role
 */
export function requireRole(
  context: TenantContext,
  allowedRoles: string[]
): boolean {
  const allowedGroups = Array.from(new Set(allowedRoles.flatMap(role => resolveGroupsFromRole(role))));
  return (
    allowedRoles.some(role => context.role === String(role || '').trim().toUpperCase()) ||
    context.groups.some(group => allowedGroups.includes(group))
  );
}

/**
 * Helper to build tenant-scoped Prisma where clause
 */
export function tenantWhere<T extends { tenantId?: string }>(
  context: TenantContext,
  additionalWhere?: Partial<T>
): T {
  // Super Admin can query all tenants if no tenantId specified
  if (context.groups.includes('platform-admin') && !additionalWhere?.tenantId) {
    return { ...additionalWhere } as T;
  }

  // All other users are scoped to their tenant
  return {
    tenantId: context.tenantId,
    ...additionalWhere,
  } as T;
}
