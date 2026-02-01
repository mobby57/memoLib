/**
 * Middleware d'authentification
 * Gère la vérification des sessions et des tokens
 */

import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId?: string;
  };
}

export interface AuthResult {
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId?: string;
  };
  error?: string;
}

/**
 * Vérifie si la requête est authentifiée
 */
export async function verifyAuth(req: NextRequest): Promise<AuthResult> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return {
        authenticated: false,
        error: 'Non authentifié',
      };
    }

    return {
      authenticated: true,
      user: {
        id: session.user.id || '',
        email: session.user.email || '',
        role: (session.user as { role?: string }).role || 'user',
        tenantId: (session.user as { tenantId?: string }).tenantId,
      },
    };
  } catch (error) {
    console.error('Erreur de vérification auth:', error);
    return {
      authenticated: false,
      error: 'Erreur de session',
    };
  }
}

/**
 * Middleware pour protéger les routes API
 */
export async function authMiddleware(
  req: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const authResult = await verifyAuth(req);

  if (!authResult.authenticated) {
    return NextResponse.json({ error: authResult.error || 'Non autorisé' }, { status: 401 });
  }

  const authenticatedReq = req as AuthenticatedRequest;
  authenticatedReq.user = authResult.user;

  return handler(authenticatedReq);
}

/**
 * Vérifie si l'utilisateur a un rôle spécifique
 */
export function hasRole(user: AuthResult['user'], roles: string[]): boolean {
  if (!user?.role) return false;
  return roles.includes(user.role);
}

/**
 * Middleware pour vérifier les rôles
 */
export async function roleMiddleware(
  req: NextRequest,
  allowedRoles: string[],
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const authResult = await verifyAuth(req);

  if (!authResult.authenticated) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  if (!hasRole(authResult.user, allowedRoles)) {
    return NextResponse.json({ error: 'Accès refusé - Rôle insuffisant' }, { status: 403 });
  }

  const authenticatedReq = req as AuthenticatedRequest;
  authenticatedReq.user = authResult.user;

  return handler(authenticatedReq);
}

export default authMiddleware;
