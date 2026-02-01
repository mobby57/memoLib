/**
 * Tests unitaires pour le service de quotas
 * @jest-environment node
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock Prisma AVANT import
jest.mock('@/lib/prisma', () => {
  const mockFindUnique = jest.fn();
  const mockCreate = jest.fn();
  return {
    prisma: {
      tenant: { findUnique: mockFindUnique },
      quotaEvent: { create: mockCreate },
      $on: jest.fn(),
      $disconnect: jest.fn(),
    },
    __mockFindUnique: mockFindUnique,
    __mockCreate: mockCreate,
  };
});

const prismaMock = jest.requireMock('@/lib/prisma') as {
  __mockFindUnique: jest.Mock;
  __mockCreate: jest.Mock;
};

import { checkQuota, ResourceType } from '@/lib/billing/quota-service';

describe('quota-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkQuota', () => {
    const mockTenantWithPlan = (current: number, limit: number, resourceType: ResourceType) => {
      const tenant: Record<string, unknown> = {
        id: 'tenant_123',
        currentWorkspaces: 0,
        currentDossiers: 0,
        currentClients: 0,
        currentUsers: 0,
        currentStorageGb: 0,
        plan: {
          maxWorkspaces: 10,
          maxDossiers: 100,
          maxClients: 50,
          maxUsers: 5,
          maxStorageGb: 10,
        },
      };

      // Définir la valeur courante selon le type
      switch (resourceType) {
        case 'workspaces':
          tenant.currentWorkspaces = current;
          (tenant.plan as Record<string, number>).maxWorkspaces = limit;
          break;
        case 'dossiers':
          tenant.currentDossiers = current;
          (tenant.plan as Record<string, number>).maxDossiers = limit;
          break;
        case 'clients':
          tenant.currentClients = current;
          (tenant.plan as Record<string, number>).maxClients = limit;
          break;
        case 'users':
          tenant.currentUsers = current;
          (tenant.plan as Record<string, number>).maxUsers = limit;
          break;
        case 'storage':
          tenant.currentStorageGb = current;
          (tenant.plan as Record<string, number>).maxStorageGb = limit;
          break;
      }

      return tenant;
    };

    it('devrait autoriser quand quota non atteint', async () => {
      prismaMock.__mockFindUnique.mockResolvedValueOnce(
        mockTenantWithPlan(5, 10, 'workspaces')
      );

      const result = await checkQuota('tenant_123', 'workspaces');

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(5);
      expect(result.limit).toBe(10);
      expect(result.percentage).toBe(50);
      expect(result.warningLevel).toBe('normal');
    });

    it('devrait retourner warning à 80%', async () => {
      prismaMock.__mockFindUnique.mockResolvedValueOnce(
        mockTenantWithPlan(8, 10, 'dossiers')
      );

      const result = await checkQuota('tenant_123', 'dossiers');

      expect(result.allowed).toBe(true);
      expect(result.percentage).toBe(80);
      expect(result.warningLevel).toBe('warning');
    });

    it('devrait retourner critical à 95%', async () => {
      prismaMock.__mockFindUnique.mockResolvedValueOnce(
        mockTenantWithPlan(95, 100, 'clients')
      );

      const result = await checkQuota('tenant_123', 'clients');

      expect(result.allowed).toBe(true);
      expect(result.percentage).toBe(95);
      expect(result.warningLevel).toBe('critical');
    });

    it('devrait bloquer à 100%', async () => {
      prismaMock.__mockFindUnique.mockResolvedValueOnce(
        mockTenantWithPlan(10, 10, 'users')
      );

      const result = await checkQuota('tenant_123', 'users');

      expect(result.allowed).toBe(false);
      expect(result.percentage).toBe(100);
      expect(result.warningLevel).toBe('exceeded');
    });

    it('devrait toujours autoriser pour limite illimitée (-1)', async () => {
      const tenant = mockTenantWithPlan(1000, -1, 'storage');
      prismaMock.__mockFindUnique.mockResolvedValueOnce(tenant);

      const result = await checkQuota('tenant_123', 'storage');

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(-1);
      expect(result.percentage).toBe(0);
      expect(result.warningLevel).toBe('normal');
    });

    it('devrait lever une erreur si tenant introuvable', async () => {
      prismaMock.__mockFindUnique.mockResolvedValueOnce(null);

      await expect(checkQuota('unknown_tenant', 'workspaces')).rejects.toThrow(
        'Tenant ou plan introuvable'
      );
    });

    it('devrait lever une erreur si plan manquant', async () => {
      prismaMock.__mockFindUnique.mockResolvedValueOnce({
        id: 'tenant_123',
        plan: null,
      });

      await expect(checkQuota('tenant_123', 'dossiers')).rejects.toThrow(
        'Tenant ou plan introuvable'
      );
    });

    it('devrait gérer tous les types de ressources', async () => {
      const resourceTypes: ResourceType[] = [
        'workspaces',
        'dossiers',
        'clients',
        'users',
        'storage',
      ];

      for (const resourceType of resourceTypes) {
        prismaMock.__mockFindUnique.mockResolvedValueOnce(
          mockTenantWithPlan(5, 10, resourceType)
        );

        const result = await checkQuota('tenant_123', resourceType);
        expect(result.allowed).toBe(true);
        expect(result.current).toBe(5);
      }
    });
  });
});
