import { describe, it, expect } from 'vitest';
import {
  buildRbacContext,
  hasPermission,
  resolveGroupsFromRole,
  resolvePermissionsFromGroups,
  RBAC_PERMISSIONS,
} from '@/lib/auth/rbac-core';

/**
 * Tests de la logique RBAC isomorphe (pure, sans runtime serveur).
 * C'est le socle de usePermissions() côté client ET de requireApiPermission()
 * côté serveur — d'où l'importance de le couvrir directement.
 */

describe('rbac-core', () => {
  it('SUPER_ADMIN a le wildcard (toutes permissions)', () => {
    expect(hasPermission({ role: 'SUPER_ADMIN', required: RBAC_PERMISSIONS.SETTINGS_WRITE })).toBe(
      true
    );
    expect(hasPermission({ role: 'SUPER_ADMIN', required: RBAC_PERMISSIONS.TENANTS_CREATE })).toBe(
      true
    );
  });

  it('ADMIN peut écrire les settings (settings:write)', () => {
    expect(hasPermission({ role: 'ADMIN', required: RBAC_PERMISSIONS.SETTINGS_WRITE })).toBe(true);
    expect(hasPermission({ role: 'ADMIN', required: RBAC_PERMISSIONS.SETTINGS_READ })).toBe(true);
  });

  it('STAGIAIRE peut lire mais pas écrire les settings', () => {
    expect(hasPermission({ role: 'STAGIAIRE', required: RBAC_PERMISSIONS.SETTINGS_READ })).toBe(
      true
    );
    expect(hasPermission({ role: 'STAGIAIRE', required: RBAC_PERMISSIONS.SETTINGS_WRITE })).toBe(
      false
    );
  });

  it('un rôle inconnu retombe sur le groupe client (défaut sûr)', () => {
    expect(resolveGroupsFromRole('ROLE_BIDON')).toEqual(['client']);
    // client n'a pas settings:write.
    expect(hasPermission({ role: 'ROLE_BIDON', required: RBAC_PERMISSIONS.SETTINGS_WRITE })).toBe(
      false
    );
  });

  it('normalise le rôle (casse/espaces)', () => {
    expect(resolveGroupsFromRole('  admin  ')).toEqual(['cabinet-admin', 'billing-manager']);
  });

  it('buildRbacContext fusionne rôle + groupes explicites sans doublons', () => {
    const ctx = buildRbacContext({ role: 'COLLABORATEUR', groups: ['lawyer', 'lawyer'] });
    expect(ctx.groups).toEqual(['lawyer']);
    expect(ctx.role).toBe('COLLABORATEUR');
  });

  it('resolvePermissionsFromGroups déduplique', () => {
    const perms = resolvePermissionsFromGroups(['lawyer', 'secretary']);
    const unique = new Set(perms);
    expect(perms.length).toBe(unique.size);
  });
});
