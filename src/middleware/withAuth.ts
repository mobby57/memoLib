// CLERK-MIGRATION: Remplacement session.user -> user (vérifier)
// CLERK-MIGRATION: Remplacement getServerSession() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
/**
 * HOC (Higher Order Component) pour les routes API protégées
 * Wrapper simplifié pour l'authentification
 */

import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  tenantId?: string;
}

export interface AuthenticatedContext {
  user: AuthenticatedUser;
  params?: Record<string, string>;
}

type AuthenticatedHandler = (
  req: NextRequest,
  context: AuthenticatedContext
) => Promise<NextResponse>;

/**
 * Wrapper pour protéger les routes API avec authentification
 *
 * @example
 * export const GET = withAuth(async (req, { user }) => {
 *   return NextResponse.json({ user });
 * });
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (
    req: NextRequest,
    context?: { params?: Record<string, string> }
  ): Promise<NextResponse> => {
    try {
      const session = await auth();

      if (!session?.user) {
        return NextResponse.json(
          { error: 'Non authentifié', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }

      const user: AuthenticatedUser = {
        id: user.id || '',
        email: user.email || '',
        name: user.name || undefined,
        role: (user as { role?: string }).role || 'user',
        tenantId: (user as { tenantId?: string }).tenantId,
      };

      return handler(req, {
        user,
        params: context?.params,
      });
    } catch (error) {
      console.error('Erreur withAuth:', error);
      return NextResponse.json({ error: 'Erreur serveur', code: 'SERVER_ERROR' }, { status: 500 });
    }
  };
}

/**
 * Wrapper avec vérification de rôle
 *
 * @example
 * export const GET = withRole(['admin', 'manager'])(async (req, { user }) => {
 *   return NextResponse.json({ user });
 * });
 */
export function withRole(allowedRoles: string[]) {
  return (handler: AuthenticatedHandler) => {
    return async (
      req: NextRequest,
      context?: { params?: Record<string, string> }
    ): Promise<NextResponse> => {
      try {
        const session = await auth();

        if (!session?.user) {
          return NextResponse.json(
            { error: 'Non authentifié', code: 'UNAUTHORIZED' },
            { status: 401 }
          );
        }

        const userRole = (user as { role?: string }).role || 'user';

        if (!allowedRoles.includes(userRole)) {
          return NextResponse.json({ error: 'Accès refusé', code: 'FORBIDDEN' }, { status: 403 });
        }

        const user: AuthenticatedUser = {
          id: user.id || '',
          email: user.email || '',
          name: user.name || undefined,
          role: userRole,
          tenantId: (user as { tenantId?: string }).tenantId,
        };

        return handler(req, {
          user,
          params: context?.params,
        });
      } catch (error) {
        console.error('Erreur withRole:', error);
        return NextResponse.json(
          { error: 'Erreur serveur', code: 'SERVER_ERROR' },
          { status: 500 }
        );
      }
    };
  };
}

/**
 * Wrapper pour les routes admin uniquement
 */
export const withAdmin = withRole(['admin', 'super_admin']);

/**
 * Wrapper pour les routes lawyer (avocat)
 */
export const withLawyer = withRole(['lawyer', 'admin', 'super_admin']);

export default withAuth;




