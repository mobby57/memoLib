/**
 * Middleware de verification des quotas
 * Bloque les creations si quotas depasses
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthToken } from '@/lib/auth/nextauth-token';
import { checkQuota, ResourceType } from '@/lib/billing/quota-service';

/**
 * Routes protegees par quota
 */
const QUOTA_ROUTES: Record<string, ResourceType> = {
  '/api/workspaces': 'workspaces',
  '/api/dossiers': 'dossiers',
  '/api/clients': 'clients',
  '/api/users': 'users',
};

const QUOTA_ROUTE_ENTRIES = Object.entries(QUOTA_ROUTES) as [string, ResourceType][];

/**
 * Middleware de verification quota
 */
export async function quotaCheckMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verifier si c'est une requete POST (creation)
  if (request.method !== 'POST') {
    return NextResponse.next();
  }

  // Verifier si la route necessite un controle quota
  const quotaRoute = QUOTA_ROUTE_ENTRIES.find(([route]) => pathname.startsWith(route));

  if (!quotaRoute) {
    return NextResponse.next();
  }

  const [, resourceType] = quotaRoute;

  // Recuperer le token
  const token = await getAuthToken(request);

  if (!token || !token.tenantId) {
    return NextResponse.json(
      { error: 'Non authentifie' },
      { status: 401 }
    );
  }

  try {
    // Verifier le quota
    const quota = await checkQuota(
      token.tenantId as string,
      resourceType
    );

    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: 'Quota depasse',
          message: `Vous avez atteint la limite de votre plan (${quota.current}/${quota.limit} ${resourceType}).`,
          quotaInfo: {
            current: quota.current,
            limit: quota.limit,
            percentage: quota.percentage,
          },
          upgradeRequired: true,
        },
        {
          status: 402, // Payment Required
          headers: {
            'X-Quota-Exceeded': 'true',
            'X-Quota-Type': resourceType,
            'X-Quota-Limit': quota.limit.toString(),
            'X-Quota-Current': quota.current.toString(),
          }
        }
      );
    }

    // Alerte si proche de la limite
    if (quota.warningLevel === 'warning' || quota.warningLevel === 'critical') {
      const response = NextResponse.next();
      response.headers.set('X-Quota-Warning', quota.warningLevel);
      response.headers.set('X-Quota-Percentage', quota.percentage.toFixed(2));
      return response;
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Erreur verification quota:', error);
    return NextResponse.next(); // En cas d'erreur, on laisse passer (fail-open)
  }
}

/**
 * Configuration du matcher
 */
export const config = {
  matcher: [
    '/api/workspaces/:path*',
    '/api/dossiers/:path*',
    '/api/clients/:path*',
    '/api/users/:path*',
  ],
};
