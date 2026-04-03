/**
 * Cross-Tenant Isolation Tests
 * P1 #3: Verify that tenant A can NEVER access tenant B data
 *
 * Covers:
 * - Middleware tenant isolation (validateTenantAccess)
 * - Prisma where clause scoping (tenantWhere)
 * - Role-based cross-tenant rules (SUPER_ADMIN vs others)
 * - Client cross-client access prevention
 */

// Mock next-auth and next/server before importing tenant-isolation
jest.mock('@/lib/auth/nextauth-token', () => ({
  getAuthToken: jest.fn(),
}));
jest.mock('@/lib/auth/rbac', () => ({
  buildRbacContext: jest.fn(({ role }: { role?: string }) => {
    const r = (role || 'CLIENT').toUpperCase();
    if (r === 'SUPER_ADMIN') return { role: r, groups: ['platform-admin'], permissions: ['*'] };
    if (r === 'ADMIN') return { role: r, groups: ['cabinet-admin'], permissions: [] };
    if (r === 'CLIENT') return { role: r, groups: ['client'], permissions: [] };
    return { role: r, groups: ['cabinet-staff'], permissions: [] };
  }),
  resolveGroupsFromRole: jest.fn((role: string) => {
    const r = role.toUpperCase();
    if (r === 'SUPER_ADMIN') return ['platform-admin'];
    if (r === 'ADMIN') return ['cabinet-admin'];
    if (r === 'CLIENT') return ['client'];
    return ['cabinet-staff'];
  }),
}));
jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import {
  validateTenantAccess,
  requireRole,
  tenantWhere,
} from '@/middleware/tenant-isolation';

const TENANT_A = 'tenant-aaa-111';
const TENANT_B = 'tenant-bbb-222';

function makeContext(overrides: Record<string, any> = {}) {
  return {
    tenantId: TENANT_A,
    userId: 'user-1',
    role: 'AVOCAT',
    groups: ['cabinet-staff'],
    ...overrides,
  };
}

describe('Cross-Tenant Isolation', () => {
  describe('validateTenantAccess', () => {
    it('should ALLOW access to own tenant', () => {
      const ctx = makeContext({ tenantId: TENANT_A });
      expect(validateTenantAccess(ctx, TENANT_A)).toBe(true);
    });

    it('should DENY access to another tenant', () => {
      const ctx = makeContext({ tenantId: TENANT_A });
      expect(validateTenantAccess(ctx, TENANT_B)).toBe(false);
    });

    it('should DENY access when tenantId is empty', () => {
      const ctx = makeContext({ tenantId: '' });
      expect(validateTenantAccess(ctx, TENANT_B)).toBe(false);
    });

    it('should DENY access when tenantId is undefined', () => {
      const ctx = makeContext({ tenantId: undefined });
      expect(validateTenantAccess(ctx, TENANT_B)).toBe(false);
    });

    it('should ALLOW SUPER_ADMIN to access any tenant', () => {
      const ctx = makeContext({
        tenantId: TENANT_A,
        role: 'SUPER_ADMIN',
        groups: ['platform-admin'],
      });
      expect(validateTenantAccess(ctx, TENANT_B)).toBe(true);
    });

    it('should DENY ADMIN cross-tenant access', () => {
      const ctx = makeContext({
        tenantId: TENANT_A,
        role: 'ADMIN',
        groups: ['cabinet-admin'],
      });
      expect(validateTenantAccess(ctx, TENANT_B)).toBe(false);
    });

    it('should DENY AVOCAT cross-tenant access', () => {
      const ctx = makeContext({
        tenantId: TENANT_A,
        role: 'AVOCAT',
        groups: ['cabinet-staff'],
      });
      expect(validateTenantAccess(ctx, TENANT_B)).toBe(false);
    });

    it('should DENY CLIENT cross-tenant access', () => {
      const ctx = makeContext({
        tenantId: TENANT_A,
        role: 'CLIENT',
        groups: ['client'],
      });
      expect(validateTenantAccess(ctx, TENANT_B)).toBe(false);
    });

    it('should DENY COLLABORATEUR cross-tenant access', () => {
      const ctx = makeContext({
        tenantId: TENANT_A,
        role: 'COLLABORATEUR',
        groups: ['cabinet-staff'],
      });
      expect(validateTenantAccess(ctx, TENANT_B)).toBe(false);
    });

    it('should DENY SECRETAIRE cross-tenant access', () => {
      const ctx = makeContext({
        tenantId: TENANT_A,
        role: 'SECRETAIRE',
        groups: ['cabinet-staff'],
      });
      expect(validateTenantAccess(ctx, TENANT_B)).toBe(false);
    });

    it('should DENY COMPTABLE cross-tenant access', () => {
      const ctx = makeContext({
        tenantId: TENANT_A,
        role: 'COMPTABLE',
        groups: ['cabinet-staff'],
      });
      expect(validateTenantAccess(ctx, TENANT_B)).toBe(false);
    });

    it('should DENY STAGIAIRE cross-tenant access', () => {
      const ctx = makeContext({
        tenantId: TENANT_A,
        role: 'STAGIAIRE',
        groups: ['cabinet-staff'],
      });
      expect(validateTenantAccess(ctx, TENANT_B)).toBe(false);
    });
  });

  describe('tenantWhere (Prisma scope)', () => {
    it('should scope queries to user tenant', () => {
      const ctx = makeContext({ tenantId: TENANT_A });
      const where = tenantWhere(ctx);
      expect(where).toEqual({ tenantId: TENANT_A });
    });

    it('should merge additional where clauses', () => {
      const ctx = makeContext({ tenantId: TENANT_A });
      const where = tenantWhere(ctx, { statut: 'en_cours' });
      expect(where).toEqual({ tenantId: TENANT_A, statut: 'en_cours' });
    });

    it('should NEVER allow non-admin to override tenantId in where', () => {
      const ctx = makeContext({ tenantId: TENANT_A, groups: ['cabinet-staff'] });
      const where = tenantWhere(ctx, { tenantId: TENANT_B });
      // tenantId from context must win over the additional where
      expect(where.tenantId).toBe(TENANT_A);
    });

    it('should allow SUPER_ADMIN to query without tenant scope', () => {
      const ctx = makeContext({
        tenantId: TENANT_A,
        groups: ['platform-admin'],
      });
      const where = tenantWhere(ctx);
      // platform-admin should NOT have tenantId forced
      expect(where.tenantId).toBeUndefined();
    });

    it('should allow SUPER_ADMIN to query specific tenant', () => {
      const ctx = makeContext({
        tenantId: TENANT_A,
        groups: ['platform-admin'],
      });
      const where = tenantWhere(ctx, { tenantId: TENANT_B });
      expect(where.tenantId).toBe(TENANT_B);
    });
  });

  describe('requireRole', () => {
    it('should allow matching role', () => {
      const ctx = makeContext({ role: 'AVOCAT', groups: ['cabinet-staff'] });
      expect(requireRole(ctx, ['AVOCAT'])).toBe(true);
    });

    it('should deny non-matching role', () => {
      const ctx = makeContext({ role: 'CLIENT', groups: ['client'] });
      expect(requireRole(ctx, ['AVOCAT', 'ADMIN'])).toBe(false);
    });

    it('should allow SUPER_ADMIN for admin-only routes', () => {
      const ctx = makeContext({ role: 'SUPER_ADMIN', groups: ['platform-admin'] });
      expect(requireRole(ctx, ['SUPER_ADMIN'])).toBe(true);
    });

    it('should deny STAGIAIRE for admin routes', () => {
      const ctx = makeContext({ role: 'STAGIAIRE', groups: ['cabinet-staff'] });
      expect(requireRole(ctx, ['ADMIN', 'SUPER_ADMIN'])).toBe(false);
    });
  });

  describe('Cross-tenant attack scenarios', () => {
    it('Scenario: AVOCAT tenant-A tries to read tenant-B dossier', () => {
      const ctx = makeContext({ tenantId: TENANT_A, role: 'AVOCAT' });
      const canAccess = validateTenantAccess(ctx, TENANT_B);
      const where = tenantWhere(ctx, { id: 'dossier-from-tenant-b' });

      expect(canAccess).toBe(false);
      expect(where.tenantId).toBe(TENANT_A); // Query scoped to own tenant
    });

    it('Scenario: CLIENT tries to access another client data in same tenant', () => {
      const ctx = makeContext({
        tenantId: TENANT_A,
        role: 'CLIENT',
        groups: ['client'],
        clientId: 'client-1',
      });
      // Client should only see own data — requireRole blocks write
      expect(requireRole(ctx, ['AVOCAT', 'ADMIN'])).toBe(false);
    });

    it('Scenario: Forged tenantId in request body should be overridden', () => {
      const ctx = makeContext({ tenantId: TENANT_A, groups: ['cabinet-staff'] });
      // Attacker sends tenantId: TENANT_B in request body
      const where = tenantWhere(ctx, { tenantId: TENANT_B });
      // Middleware must enforce TENANT_A
      expect(where.tenantId).toBe(TENANT_A);
    });

    it('Scenario: Empty groups should deny all access', () => {
      const ctx = makeContext({ tenantId: TENANT_A, groups: [] });
      expect(requireRole(ctx, ['AVOCAT'])).toBe(false);
    });
  });
});
