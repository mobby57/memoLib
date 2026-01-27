/**
 * Tests unitaires pour le système d'alertes de coûts
 * @jest-environment node
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock Prisma
const mockPrismaFindMany = jest.fn();
const mockPrismaAggregate = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tenant: { findMany: mockPrismaFindMany },
    aiUsage: { aggregate: mockPrismaAggregate },
  },
}));

// Import après les mocks
import { checkAllTenantsForAlerts } from '@/lib/billing/cost-alerts';

describe('cost-alerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkAllTenantsForAlerts', () => {
    it('devrait retourner une liste vide si aucun tenant actif', async () => {
      mockPrismaFindMany.mockResolvedValueOnce([]);

      const alerts = await checkAllTenantsForAlerts();

      expect(alerts).toEqual([]);
      expect(mockPrismaFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'active' },
        })
      );
    });

    it('devrait générer une alerte warning à 70% du budget', async () => {
      const mockTenants = [
        {
          id: 'tenant_1',
          name: 'Tenant Warning',
          plan: { name: 'starter' },
          users: [{ email: 'admin@tenant1.com', name: 'Admin' }],
        },
      ];
      mockPrismaFindMany.mockResolvedValueOnce(mockTenants);
      // Simuler 70% de 50€ = 35€
      mockPrismaAggregate.mockResolvedValueOnce({ _sum: { cost: 35 } });

      const alerts = await checkAllTenantsForAlerts();

      expect(alerts.length).toBe(1);
      expect(alerts[0].alertLevel).toBe('warning');
      expect(alerts[0].tenantId).toBe('tenant_1');
    });

    it('devrait générer une alerte critical à 90% du budget', async () => {
      const mockTenants = [
        {
          id: 'tenant_2',
          name: 'Tenant Critical',
          plan: { name: 'starter' },
          users: [{ email: 'admin@tenant2.com' }],
        },
      ];
      mockPrismaFindMany.mockResolvedValueOnce(mockTenants);
      // Simuler 90% de 50€ = 45€
      mockPrismaAggregate.mockResolvedValueOnce({ _sum: { cost: 45 } });

      const alerts = await checkAllTenantsForAlerts();

      expect(alerts.length).toBe(1);
      expect(alerts[0].alertLevel).toBe('critical');
    });

    it('devrait générer une alerte blocked à 100% du budget', async () => {
      const mockTenants = [
        {
          id: 'tenant_3',
          name: 'Tenant Blocked',
          plan: { name: 'starter' },
          users: [{ email: 'admin@tenant3.com' }],
        },
      ];
      mockPrismaFindMany.mockResolvedValueOnce(mockTenants);
      // Simuler 100% de 50€ = 50€
      mockPrismaAggregate.mockResolvedValueOnce({ _sum: { cost: 50 } });

      const alerts = await checkAllTenantsForAlerts();

      expect(alerts.length).toBe(1);
      expect(alerts[0].alertLevel).toBe('blocked');
    });

    it('devrait ne pas générer d\'alerte en dessous de 70%', async () => {
      const mockTenants = [
        {
          id: 'tenant_ok',
          name: 'Tenant OK',
          plan: { name: 'pro' },
          users: [{ email: 'admin@ok.com' }],
        },
      ];
      mockPrismaFindMany.mockResolvedValueOnce(mockTenants);
      // Pro a un budget plus élevé, coût faible
      mockPrismaAggregate.mockResolvedValueOnce({ _sum: { cost: 10 } });

      const alerts = await checkAllTenantsForAlerts();

      expect(alerts.length).toBe(0);
    });

    it('devrait gérer plusieurs tenants simultanément', async () => {
      const mockTenants = [
        {
          id: 'tenant_a',
          name: 'Tenant A',
          plan: { name: 'starter' },
          users: [{ email: 'a@test.com' }],
        },
        {
          id: 'tenant_b',
          name: 'Tenant B',
          plan: { name: 'pro' },
          users: [{ email: 'b@test.com' }],
        },
        {
          id: 'tenant_c',
          name: 'Tenant C',
          plan: { name: 'enterprise' },
          users: [{ email: 'c@test.com' }],
        },
      ];
      mockPrismaFindMany.mockResolvedValueOnce(mockTenants);

      // Tenant A: 80% (warning)
      mockPrismaAggregate.mockResolvedValueOnce({ _sum: { cost: 40 } });
      // Tenant B: 50% (ok)
      mockPrismaAggregate.mockResolvedValueOnce({ _sum: { cost: 100 } });
      // Tenant C: 95% (critical)
      mockPrismaAggregate.mockResolvedValueOnce({ _sum: { cost: 950 } });

      const alerts = await checkAllTenantsForAlerts();

      // Devrait avoir au moins 2 alertes (A et C)
      expect(alerts.length).toBeGreaterThanOrEqual(2);
    });

    it('devrait gérer les erreurs gracieusement', async () => {
      mockPrismaFindMany.mockRejectedValueOnce(new Error('Database error'));

      const alerts = await checkAllTenantsForAlerts();

      expect(alerts).toEqual([]);
    });

    it('devrait gérer un tenant sans admin', async () => {
      const mockTenants = [
        {
          id: 'tenant_no_admin',
          name: 'No Admin Tenant',
          plan: { name: 'starter' },
          users: [], // Pas d'admin
        },
      ];
      mockPrismaFindMany.mockResolvedValueOnce(mockTenants);
      mockPrismaAggregate.mockResolvedValueOnce({ _sum: { cost: 45 } });

      const alerts = await checkAllTenantsForAlerts();

      expect(alerts.length).toBe(1);
      expect(alerts[0].adminEmail).toBe('');
    });

    it('devrait inclure les informations de période', async () => {
      const mockTenants = [
        {
          id: 'tenant_period',
          name: 'Period Test',
          plan: { name: 'starter' },
          users: [{ email: 'test@test.com' }],
        },
      ];
      mockPrismaFindMany.mockResolvedValueOnce(mockTenants);
      mockPrismaAggregate.mockResolvedValueOnce({ _sum: { cost: 40 } });

      const alerts = await checkAllTenantsForAlerts();

      expect(alerts.length).toBe(1);
      expect(alerts[0].period).toHaveProperty('month');
      expect(alerts[0].period).toHaveProperty('year');
      expect(alerts[0].period.month).toBeGreaterThanOrEqual(1);
      expect(alerts[0].period.month).toBeLessThanOrEqual(12);
    });
  });
});
