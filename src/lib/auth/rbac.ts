import { NextResponse } from 'next/server';
import {
  RBAC_PERMISSIONS,
  buildRbacContext,
  type RbacPermission,
} from '@/lib/auth/rbac-core';

/**
 * RBAC — partie SERVEUR uniquement.
 *
 * La logique pure (constantes, mappings rôle→groupes→permissions, helpers) vit
 * dans `rbac-core.ts` (isomorphe). Ce module ne contient que ce qui dépend du
 * runtime serveur (`NextResponse`), et réexporte le core pour préserver les
 * imports existants (`@/lib/auth/rbac`).
 */

export {
  RBAC_PERMISSIONS,
  resolveGroupsFromRole,
  resolvePermissionsFromGroups,
  buildRbacContext,
  hasPermission,
} from '@/lib/auth/rbac-core';

export type { RbacPermission, RbacGroup } from '@/lib/auth/rbac-core';

type SessionLike = {
  user?: {
    role?: string;
    groups?: string[];
    rbacPermissions?: string[];
  };
};

export function requireApiPermission(
  session: SessionLike | null,
  required: RbacPermission
):
  | { ok: true; role: string; groups: string[]; permissions: RbacPermission[] }
  | { ok: false; response: NextResponse } {
  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const context = buildRbacContext({
    role: session.user.role,
    groups: session.user.groups,
  });

  const allowed = context.permissions.includes('*') || context.permissions.includes(required);
  if (!allowed) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return {
    ok: true,
    role: context.role,
    groups: context.groups,
    permissions: context.permissions,
  };
}

// Référence conservée pour compat (certains imports pourraient l'attendre).
void RBAC_PERMISSIONS;
