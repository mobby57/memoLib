'use client';

import { useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  buildRbacContext,
  RBAC_PERMISSIONS,
  type RbacPermission,
} from '@/lib/auth/rbac-core';

/**
 * usePermissions — permissions RBAC côté client, dérivées du rôle utilisateur.
 *
 * ⚠️ SÉCURITÉ — À LIRE :
 * Ce hook sert UNIQUEMENT à l'affichage (masquer/afficher un bouton, un onglet).
 * Il n'est JAMAIS une frontière de sécurité. Toute action sensible DOIT être
 * re-vérifiée côté serveur (requireApiPermission dans les routes API), avec
 * l'isolation tenant. Cacher un bouton n'empêche pas un appel API direct.
 *
 *   UI usePermissions()  → confort d'affichage
 *          ↓
 *   API requireApiPermission() → vraie sécurité (tenant + permission)
 *          ↓
 *   Prisma query scoped par tenantId
 */

export interface UsePermissionsResult {
  role: string;
  groups: string[];
  permissions: RbacPermission[];
  isLoading: boolean;
  /** true si l'utilisateur possède la permission (ou '*'). */
  can: (permission: RbacPermission) => boolean;
  /** inverse de can(). */
  cannot: (permission: RbacPermission) => boolean;
  /** true si au moins une des permissions est accordée. */
  canAny: (permissions: RbacPermission[]) => boolean;
  /** true si toutes les permissions sont accordées. */
  canAll: (permissions: RbacPermission[]) => boolean;
}

export function usePermissions(): UsePermissionsResult {
  const { user, isLoading } = useAuth();

  const context = useMemo(
    () => buildRbacContext({ role: user?.role }),
    [user?.role]
  );

  const can = useCallback(
    (permission: RbacPermission): boolean =>
      context.permissions.includes('*') || context.permissions.includes(permission),
    [context.permissions]
  );

  const cannot = useCallback((permission: RbacPermission) => !can(permission), [can]);

  const canAny = useCallback(
    (permissions: RbacPermission[]) => permissions.some((p) => can(p)),
    [can]
  );

  const canAll = useCallback(
    (permissions: RbacPermission[]) => permissions.every((p) => can(p)),
    [can]
  );

  return {
    role: context.role,
    groups: context.groups,
    permissions: context.permissions,
    isLoading,
    can,
    cannot,
    canAny,
    canAll,
  };
}

export { RBAC_PERMISSIONS };
