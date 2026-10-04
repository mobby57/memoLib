import { describe, it, expect, vi } from 'vitest';
import {
  validateTenantAccess,
  requireRole,
  tenantWhere,
} from '@/middleware/tenant-isolation';

// Isolation multi-tenant (EMAIL-SEC-005) : un cabinet ne doit JAMAIS voir
// les donnees d'un autre. Fonctions pures -> testables sans DB ni Clerk.

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const ctxCabinetA = { tenantId: 'tenant-A', userId: 'user-A', role: 'ADMIN' as const };
const ctxCabinetB = { tenantId: 'tenant-B', userId: 'user-B', role: 'ADMIN' as const };
const ctxSuperAdmin = { tenantId: 'tenant-A', userId: 'root', role: 'SUPER_ADMIN' as const };

describe('tenant-isolation — validateTenantAccess', () => {
  it('AUTORISE l’accès à une ressource de son propre cabinet', () => {
    expect(validateTenantAccess(ctxCabinetA, 'tenant-A')).toBe(true);
  });

  it('REFUSE l’accès à une ressource d’un autre cabinet (fuite inter-cabinets)', () => {
    // Le cas critique: cabinet A tente d'atteindre une donnée de cabinet B.
    expect(validateTenantAccess(ctxCabinetA, 'tenant-B')).toBe(false);
    expect(validateTenantAccess(ctxCabinetB, 'tenant-A')).toBe(false);
  });

  it('SUPER_ADMIN peut accéder à tous les cabinets', () => {
    expect(validateTenantAccess(ctxSuperAdmin, 'tenant-A')).toBe(true);
    expect(validateTenantAccess(ctxSuperAdmin, 'tenant-B')).toBe(true);
  });
});

describe('tenant-isolation — tenantWhere (scope Prisma)', () => {
  it('force le tenantId du contexte pour un ADMIN', () => {
    const where = tenantWhere(ctxCabinetA);
    expect(where).toEqual({ tenantId: 'tenant-A' });
  });

  it('un ADMIN ne peut PAS élargir la requête à un autre tenant via additionalWhere', () => {
    // TENANT-ISO-001 (regression): meme si un additionalWhere malveillant injecte
    // tenant-B, le tenantId du contexte doit TOUJOURS primer (applique apres le spread).
    const where = tenantWhere(ctxCabinetA, { tenantId: 'tenant-B' } as any);
    expect(where.tenantId).toBe('tenant-A');
  });

  it('SUPER_ADMIN sans tenantId explicite voit tous les tenants (pas de scope)', () => {
    const where = tenantWhere(ctxSuperAdmin);
    expect(where.tenantId).toBeUndefined();
  });

  it('SUPER_ADMIN peut cibler un tenant précis via additionalWhere', () => {
    const where = tenantWhere(ctxSuperAdmin, { tenantId: 'tenant-B' } as any);
    expect(where.tenantId).toBe('tenant-B');
  });
});

describe('tenant-isolation — requireRole', () => {
  it('autorise un rôle présent dans la liste', () => {
    expect(requireRole(ctxCabinetA, ['ADMIN', 'SUPER_ADMIN'])).toBe(true);
  });

  it('refuse un rôle absent de la liste', () => {
    expect(requireRole(ctxCabinetA, ['SUPER_ADMIN'])).toBe(false);
  });
});
