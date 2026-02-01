/**
 * Middleware Zero-Trust pour Next.js
 * Authentification + Autorisation + Journalisation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createAuditLog, getAuditContext } from '@/lib/audit';

/**
 * Extraction du contexte de la requete
 */
function extractContext(req: NextRequest): {
  pathname: string
  tenantId: string | null
  resourceType: string | null
  method: string
  ip: string
  userAgent: string
} {
  const pathname = req.nextUrl.pathname;
  
  // Extraction tenantId depuis l'URL (ex: /api/tenant/[id]/...)
  const tenantMatch = pathname.match(/\/api\/tenant\/([^\/]+)/);
  const tenantId: string | null = tenantMatch ? tenantMatch[1] : null;
  
  // Determination du type de ressource
  let resourceType: string | null = null;
  if (pathname.includes('/dossiers')) resourceType = 'Dossier';
  else if (pathname.includes('/clients')) resourceType = 'Client';
  else if (pathname.includes('/documents')) resourceType = 'Document';
  else if (pathname.includes('/factures')) resourceType = 'Facture';
  else if (pathname.includes('/tenants')) resourceType = 'Tenant';
  
  return {
    pathname,
    tenantId,
    resourceType,
    method: req.method,
    ip: (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'),
    userAgent: req.headers.get('user-agent') || 'unknown'
  };
}

/**
 * Verification des autorisations
 */
async function checkAuthorization(
  user: any,
  tenantId: string | null,
  resourceType: string | null,
  method: string
): Promise<{ authorized: boolean; reason?: string }> {
  // SUPER_ADMIN : acces structure uniquement, pas au contenu
  if (user.role === 'SUPER_ADMIN') {
    // Peut acceder aux routes /api/super-admin
    if (resourceType === 'Tenant') {
      return { authorized: true };
    }
    // Ne peut PAS acceder au contenu des tenants
    if (tenantId && resourceType !== 'Tenant') {
      return {
        authorized: false,
        reason: 'SUPER_ADMIN ne peut acceder au contenu des tenants'
      };
    }
  }
  
  // ADMIN : doit appartenir au meme tenant
  if (user.role === 'ADMIN') {
    if (!tenantId) {
      return { authorized: true }; // Routes non tenant-specific
    }
    if (user.tenantId !== tenantId) {
      return {
        authorized: false,
        reason: 'Acces cross-tenant interdit'
      };
    }
    return { authorized: true };
  }
  
  // CLIENT : acces restreint a ses propres donnees
  if (user.role === 'CLIENT') {
    // Les clients ne peuvent acceder qu'a leurs propres dossiers
    if (method === 'GET' && (resourceType === 'Dossier' || resourceType === 'Facture')) {
      // Verification additionnelle necessaire au niveau de la route
      return { authorized: true };
    }
    // Pas de creation/modification pour les clients
    if (method !== 'GET') {
      return {
        authorized: false,
        reason: 'Les clients ne peuvent que consulter'
      };
    }
  }
  
  return { authorized: true };
}

/**
 * Routes publiques (pas de verification)
 */
const PUBLIC_ROUTES = [
  '/api/auth/',
  '/_next/',
  '/favicon.ico',
  '/manifest.json',
  '/sw.js'
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Middleware principal Zero-Trust
 */
export async function zeroTrustMiddleware(req: NextRequest) {
  const context = extractContext(req);
  
  // Routes publiques : bypass
  if (isPublicRoute(context.pathname)) {
    return NextResponse.next();
  }
  
  // 1. AUTHENTIFICATION
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  if (!token) {
    // Log tentative d'acces non authentifie
    await logAudit({
      action: 'UNAUTHORIZED_ACCESS',
      objectType: context.resourceType as any || 'Unknown',
      metadata: {
        pathname: context.pathname,
        method: context.method
      },
      ipAddress: context.ip || null,
      userAgent: context.userAgent,
      success: false,
      errorMessage: 'Non authentifie'
    });
    
    return NextResponse.json(
      { error: 'Non authentifie' },
      { status: 401 }
    );
  }
  
  // 2. AUTORISATION
  const authCheck = await checkAuthorization(
    token as any,
    context.tenantId,
    context.resourceType,
    context.method
  );
  
  if (!authCheck.authorized) {
    // Log acces non autorise
    await AuditHelpers.logUnauthorizedAccess(
      (token.id as string) || 'anonymous',
      context.tenantId as string | null,
      context.resourceType as any || 'Unknown',
      'route',
      authCheck.reason || 'Non autorise',
      context.ip || undefined
    );
    
    return NextResponse.json(
      { error: authCheck.reason || 'Non autorise' },
      { status: 403 }
    );
  }
  
  // 3. JOURNALISATION (actions sensibles uniquement)
  if (context.method !== 'GET' || context.resourceType === 'Document') {
    await logAudit({
      tenantId: context.tenantId as string | undefined,
      userId: token.id as string,
      userRole: token.role as string,
      action: context.method as any,
      objectType: context.resourceType as any || 'Unknown',
      metadata: {
        pathname: context.pathname
      },
      ipAddress: context.ip || null,
      userAgent: context.userAgent,
      success: true
    });
  }
  
  // 4. PASSAGE a LA RESSOURCE
  return NextResponse.next();
}

/**
 * Configuration du middleware
 */
export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
};
