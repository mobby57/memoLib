/**
 * Middleware de vérification des quotas
 * Bloque les créations si quotas dépassés
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { checkQuota, ResourceType } from '@/lib/billing/quota-service';

/**
 * Routes protégées par quota
 */
const QUOTA_ROUTES: Record<string, ResourceType> = {
  '/api/workspaces': 'workspaces',
  '/api/dossiers': 'dossiers',
  '/api/clients': 'clients',
  '/api/users': 'users',
};

/**
 * Middleware de vérification quota
 */
export async function quotaCheckMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Vérifier si c'est une requête POST (création)
  if (request.method !== 'POST') {
    return NextResponse.next();
  }

  // Vérifier si la route nécessite un contrôle quota
  const resourceType = Object.keys(QUOTA_ROUTES).find(route => 
    pathname.startsWith(route)
  );

  if (!resourceType) {
    return NextResponse.next();
  }

  // Récupérer le token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || '',
  });

  if (!token || !token.tenantId) {
    return NextResponse.json(
      { error: 'Non authentifié' },
      { status: 401 }
    );
  }

  try {
    // Vérifier le quota
    const quota = await checkQuota(
      token.tenantId as string,
      QUOTA_ROUTES[resourceType]
    );

    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: 'Quota dépassé',
          message: `Vous avez atteint la limite de votre plan (${quota.current}/${quota.limit} ${QUOTA_ROUTES[resourceType]}).`,
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
            'X-Quota-Type': QUOTA_ROUTES[resourceType],
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
    console.error('Erreur vérification quota:', error);
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
