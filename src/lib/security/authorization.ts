import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  normalizeRole,
  type UserRole,
} from './roles';

export type AuthorizedContext = {
  userId: string;
  tenantId: string;
  role: UserRole;
  clientId?: string | null;
  groups?: string[];
};

export function unauthorized() {
  return NextResponse.json(
    { error: 'Non authentifié' },
    { status: 401 },
  );
}

export function forbidden() {
  return NextResponse.json(
    { error: 'Accès interdit' },
    { status: 403 },
  );
}

/**
 * Récupère l'identité authentifiée côté serveur.
 *
 * SECURITY:
 * - userId vient de la session
 * - role vient de la session
 * - tenantId vient de la session
 * - jamais du body/query/params pour établir l'identité
 */
export async function requireAuthorizedContext(): Promise<AuthorizedContext> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error('UNAUTHORIZED');
  }

  const role = normalizeRole(session.user.role);

  if (!role) {
    throw new Error('FORBIDDEN: invalid user role');
  }

  const tenantId = session.user.tenantId;

  /**
   * SUPER_ADMIN peut fonctionner sans tenant.
   * Tous les autres utilisateurs doivent appartenir à un tenant.
   */
  if (!tenantId && role !== 'SUPER_ADMIN') {
    throw new Error('FORBIDDEN: missing tenant');
  }

  return {
    userId: session.user.id,
    tenantId: tenantId ?? '',
    role,
    clientId: session.user.clientId ?? undefined,
    groups: session.user.groups ?? [],
  };
}

/**
 * Safe tenant constraint for Prisma queries.
 *
 * IMPORTANT:
 * Le tenantId doit provenir de requireAuthorizedContext().
 */
export function tenantWhere(
  tenantId: string,
  extra: Record<string, unknown> = {},
) {
  if (!tenantId) {
    throw new Error('SECURITY: tenantId is required');
  }

  return {
    ...extra,
    tenantId,
  };
}

/**
 * Safe dossier constraint.
 */
export function dossierWhere(
  dossierId: string,
  tenantId: string,
  extra: Record<string, unknown> = {},
) {
  if (!dossierId) {
    throw new Error('SECURITY: dossierId is required');
  }

  if (!tenantId) {
    throw new Error('SECURITY: tenantId is required');
  }

  return {
    ...extra,
    id: dossierId,
    tenantId,
  };
}
