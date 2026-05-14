import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  resolveGroupsFromRole,
  resolvePermissionsFromGroups,
  buildRbacContext,
  RBAC_PERMISSIONS,
} from '../../src/lib/auth/rbac';

describe('RBAC System', () => {
  describe('resolveGroupsFromRole', () => {
    it('SUPER_ADMIN → platform-admin', () => {
      expect(resolveGroupsFromRole('SUPER_ADMIN')).toContain('platform-admin');
    });

    it('AVOCAT → cabinet-admin', () => {
      expect(resolveGroupsFromRole('AVOCAT')).toContain('cabinet-admin');
    });

    it('CLIENT → client', () => {
      expect(resolveGroupsFromRole('CLIENT')).toContain('client');
    });

    it('STAGIAIRE → intern', () => {
      expect(resolveGroupsFromRole('STAGIAIRE')).toContain('intern');
    });

    it('rôle inconnu → client par défaut', () => {
      expect(resolveGroupsFromRole('UNKNOWN')).toEqual(['client']);
    });

    it('rôle vide → client par défaut', () => {
      expect(resolveGroupsFromRole('')).toEqual(['client']);
    });

    it('normalise la casse', () => {
      expect(resolveGroupsFromRole('avocat')).toContain('cabinet-admin');
    });
  });

  describe('hasPermission', () => {
    it('SUPER_ADMIN a toutes les permissions (*)', () => {
      expect(hasPermission({ role: 'SUPER_ADMIN', required: RBAC_PERMISSIONS.DOSSIERS_MANAGE })).toBe(true);
      expect(hasPermission({ role: 'SUPER_ADMIN', required: RBAC_PERMISSIONS.TENANTS_CREATE })).toBe(true);
    });

    it('AVOCAT peut gérer les dossiers', () => {
      expect(hasPermission({ role: 'AVOCAT', required: RBAC_PERMISSIONS.DOSSIERS_MANAGE })).toBe(true);
    });

    it('AVOCAT peut gérer les factures', () => {
      expect(hasPermission({ role: 'AVOCAT', required: RBAC_PERMISSIONS.FACTURES_MANAGE })).toBe(true);
    });

    it('CLIENT peut lire les dossiers', () => {
      expect(hasPermission({ role: 'CLIENT', required: RBAC_PERMISSIONS.DOSSIERS_READ })).toBe(true);
    });

    it('CLIENT ne peut PAS gérer les dossiers', () => {
      expect(hasPermission({ role: 'CLIENT', required: RBAC_PERMISSIONS.DOSSIERS_MANAGE })).toBe(false);
    });

    it('CLIENT ne peut PAS accéder aux analytics', () => {
      expect(hasPermission({ role: 'CLIENT', required: RBAC_PERMISSIONS.ANALYTICS_READ })).toBe(false);
    });

    it('STAGIAIRE peut lire les dossiers', () => {
      expect(hasPermission({ role: 'STAGIAIRE', required: RBAC_PERMISSIONS.DOSSIERS_READ })).toBe(true);
    });

    it('STAGIAIRE ne peut PAS gérer les factures', () => {
      expect(hasPermission({ role: 'STAGIAIRE', required: RBAC_PERMISSIONS.FACTURES_MANAGE })).toBe(false);
    });

    it('SECRETAIRE peut gérer les documents', () => {
      expect(hasPermission({ role: 'SECRETAIRE', required: RBAC_PERMISSIONS.DOCUMENTS_MANAGE })).toBe(true);
    });

    it('COMPTABLE peut gérer les factures', () => {
      expect(hasPermission({ role: 'COMPTABLE', required: RBAC_PERMISSIONS.FACTURES_MANAGE })).toBe(true);
    });

    it('COMPTABLE ne peut PAS gérer les dossiers', () => {
      expect(hasPermission({ role: 'COMPTABLE', required: RBAC_PERMISSIONS.DOSSIERS_MANAGE })).toBe(false);
    });
  });

  describe('buildRbacContext', () => {
    it('construit le contexte complet pour un AVOCAT', () => {
      const ctx = buildRbacContext({ role: 'AVOCAT' });
      expect(ctx.role).toBe('AVOCAT');
      expect(ctx.groups).toContain('cabinet-admin');
      expect(ctx.permissions).toContain(RBAC_PERMISSIONS.DOSSIERS_MANAGE);
      expect(ctx.permissions).toContain(RBAC_PERMISSIONS.ANALYTICS_READ);
    });

    it('fusionne les groupes explicites', () => {
      const ctx = buildRbacContext({ role: 'CLIENT', groups: ['billing-manager'] });
      expect(ctx.groups).toContain('client');
      expect(ctx.groups).toContain('billing-manager');
      expect(ctx.permissions).toContain(RBAC_PERMISSIONS.FACTURES_MANAGE);
    });
  });
});
