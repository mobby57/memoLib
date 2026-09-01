/**
 * Tests exhaustifs pour src/lib/billing/cost-alerts.ts
 * Objectif: couvrir 100% du module
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => {
  return {
    prisma: {
      tenant: {
        findMany: vi.fn(),
      },
      aIUsageLog: {
        aggregate: vi.fn(),
      },
    },
  };
});

import { prisma as mockPrismaImport } from '@/lib/prisma';
const mockPrisma = vi.mocked(mockPrismaImport) as any;

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

import {
  checkAllTenantsForAlerts,
  sendAlertEmail,
  sendSuperAdminAlert,
  runCostAlertCheck,
} from '@/lib/billing/cost-alerts';

describe('cost-alerts.ts — Full Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true, text: async () => 'OK' });
  });

  describe('checkAllTenantsForAlerts', () => {
    it('should return empty array when no tenants', async () => {
      mockPrisma.tenant.findMany.mockResolvedValue([]);
      const alerts = await checkAllTenantsForAlerts();
      expect(alerts).toEqual([]);
    });

    it('should return no alerts when usage is low', async () => {
      mockPrisma.tenant.findMany.mockResolvedValue([
        {
          id: 't1',
          name: 'Cabinet A',
          plan: { name: 'CABINET' },
          users: [{ email: 'admin@a.com', name: 'Admin' }],
        },
      ]);
      mockPrisma.aIUsageLog.aggregate.mockResolvedValue({ _sum: { costEur: 1 } });

      const alerts = await checkAllTenantsForAlerts();
      expect(alerts).toEqual([]);
    });

    it('should return warning alert at 70%', async () => {
      mockPrisma.tenant.findMany.mockResolvedValue([
        {
          id: 't1',
          name: 'Cabinet A',
          plan: { name: 'CABINET' },
          users: [{ email: 'admin@a.com', name: 'Admin' }],
        },
      ]);
      // CABINET budget = 30, 70% = 21
      mockPrisma.aIUsageLog.aggregate.mockResolvedValue({ _sum: { costEur: 22 } });

      const alerts = await checkAllTenantsForAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].alertLevel).toBe('warning');
      expect(alerts[0].tenantName).toBe('Cabinet A');
    });

    it('should return critical alert at 90%', async () => {
      mockPrisma.tenant.findMany.mockResolvedValue([
        {
          id: 't1',
          name: 'Cabinet B',
          plan: { name: 'SOLO' },
          users: [{ email: 'admin@b.com' }],
        },
      ]);
      // SOLO budget = 5, 90% = 4.5
      mockPrisma.aIUsageLog.aggregate.mockResolvedValue({ _sum: { costEur: 4.6 } });

      const alerts = await checkAllTenantsForAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].alertLevel).toBe('critical');
    });

    it('should return blocked alert at 100%', async () => {
      mockPrisma.tenant.findMany.mockResolvedValue([
        {
          id: 't1',
          name: 'Cabinet C',
          plan: { name: 'SOLO' },
          users: [{ email: 'admin@c.com' }],
        },
      ]);
      // SOLO budget = 5, 100% = 5
      mockPrisma.aIUsageLog.aggregate.mockResolvedValue({ _sum: { costEur: 5 } });

      const alerts = await checkAllTenantsForAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].alertLevel).toBe('blocked');
    });

    it('should handle tenants without admin users', async () => {
      mockPrisma.tenant.findMany.mockResolvedValue([
        {
          id: 't1',
          name: 'Cabinet D',
          plan: { name: 'SOLO' },
          users: [], // No admin
        },
      ]);
      mockPrisma.aIUsageLog.aggregate.mockResolvedValue({ _sum: { costEur: 5 } });

      const alerts = await checkAllTenantsForAlerts();
      expect(alerts[0].adminEmail).toBe('');
    });

    it('should handle unknown plan name with default budget', async () => {
      mockPrisma.tenant.findMany.mockResolvedValue([
        {
          id: 't1',
          name: 'Cabinet E',
          plan: { name: 'UNKNOWN_PLAN' },
          users: [{ email: 'admin@e.com' }],
        },
      ]);
      // Default budget = 5, need 70% = 3.5
      mockPrisma.aIUsageLog.aggregate.mockResolvedValue({ _sum: { costEur: 4 } });

      const alerts = await checkAllTenantsForAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].budgetLimit).toBe(5);
    });

    it('should handle null plan', async () => {
      mockPrisma.tenant.findMany.mockResolvedValue([
        {
          id: 't1',
          name: 'Cabinet F',
          plan: null,
          users: [{ email: 'admin@f.com' }],
        },
      ]);
      mockPrisma.aIUsageLog.aggregate.mockResolvedValue({ _sum: { costEur: 0.4 } });

      const alerts = await checkAllTenantsForAlerts();
      // starter budget = 0.5, 80% -> warning
      expect(alerts).toHaveLength(1);
    });

    it('should handle DB errors gracefully', async () => {
      mockPrisma.tenant.findMany.mockRejectedValue(new Error('DB down'));
      const alerts = await checkAllTenantsForAlerts();
      expect(alerts).toEqual([]);
    });

    it('should handle null costEur sum', async () => {
      mockPrisma.tenant.findMany.mockResolvedValue([
        {
          id: 't1',
          name: 'Cabinet G',
          plan: { name: 'SOLO' },
          users: [{ email: 'admin@g.com' }],
        },
      ]);
      mockPrisma.aIUsageLog.aggregate.mockResolvedValue({ _sum: { costEur: null } });

      const alerts = await checkAllTenantsForAlerts();
      expect(alerts).toEqual([]);
    });

    it('should handle aggregate error gracefully', async () => {
      mockPrisma.tenant.findMany.mockResolvedValue([
        {
          id: 't1',
          name: 'Cabinet H',
          plan: { name: 'SOLO' },
          users: [{ email: 'admin@h.com' }],
        },
      ]);
      mockPrisma.aIUsageLog.aggregate.mockRejectedValue(new Error('Table not found'));

      const alerts = await checkAllTenantsForAlerts();
      // getCurrentMonthCost catches and returns 0
      expect(alerts).toEqual([]);
    });
  });

  describe('sendAlertEmail', () => {
    it('should send email successfully', async () => {
      mockFetch.mockResolvedValue({ ok: true, text: async () => 'OK' });

      const result = await sendAlertEmail({
        tenantId: 't1',
        tenantName: 'Cabinet A',
        adminEmail: 'admin@a.com',
        currentCost: 4.5,
        budgetLimit: 5,
        percentage: 90,
        alertLevel: 'critical',
        period: { month: 8, year: 2026 },
      });

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/email/send'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should return false on fetch failure', async () => {
      mockFetch.mockResolvedValue({ ok: false, text: async () => 'Error' });

      const result = await sendAlertEmail({
        tenantId: 't1',
        tenantName: 'Test',
        adminEmail: 'admin@test.com',
        currentCost: 5,
        budgetLimit: 5,
        percentage: 100,
        alertLevel: 'blocked',
        period: { month: 1, year: 2026 },
      });

      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await sendAlertEmail({
        tenantId: 't1',
        tenantName: 'Test',
        adminEmail: 'admin@test.com',
        currentCost: 3.5,
        budgetLimit: 5,
        percentage: 70,
        alertLevel: 'warning',
        period: { month: 6, year: 2026 },
      });

      expect(result).toBe(false);
    });

    it('should generate correct subject for each alert level', async () => {
      mockFetch.mockResolvedValue({ ok: true, text: async () => '' });

      await sendAlertEmail({
        tenantId: 't1',
        tenantName: 'Test',
        adminEmail: 'a@b.com',
        currentCost: 5,
        budgetLimit: 5,
        percentage: 100,
        alertLevel: 'blocked',
        period: { month: 1, year: 2026 },
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.subject).toContain('🚨');
      expect(body.subject).toContain('100%');
    });
  });

  describe('sendSuperAdminAlert', () => {
    it('should do nothing for empty alerts', async () => {
      await sendSuperAdminAlert([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should send report to super admin', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      await sendSuperAdminAlert([
        {
          tenantId: 't1',
          tenantName: 'Cabinet A',
          adminEmail: 'admin@a.com',
          currentCost: 5,
          budgetLimit: 5,
          percentage: 100,
          alertLevel: 'blocked',
          period: { month: 8, year: 2026 },
        },
        {
          tenantId: 't2',
          tenantName: 'Cabinet B',
          adminEmail: 'admin@b.com',
          currentCost: 3.5,
          budgetLimit: 5,
          percentage: 70,
          alertLevel: 'warning',
          period: { month: 8, year: 2026 },
        },
      ]);

      expect(mockFetch).toHaveBeenCalled();
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.subject).toContain('1 critiques');
      expect(body.subject).toContain('1 warnings');
      expect(body.type).toBe('super-admin-alert');
    });

    it('should handle fetch error gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('fail'));
      await expect(sendSuperAdminAlert([
        {
          tenantId: 't1',
          tenantName: 'X',
          adminEmail: 'a@b.com',
          currentCost: 5,
          budgetLimit: 5,
          percentage: 100,
          alertLevel: 'blocked',
          period: { month: 1, year: 2026 },
        },
      ])).resolves.toBeUndefined();
    });
  });

  describe('runCostAlertCheck', () => {
    it('should run complete check and return stats', async () => {
      mockPrisma.tenant.findMany.mockResolvedValue([
        {
          id: 't1',
          name: 'Cabinet A',
          plan: { name: 'SOLO' },
          users: [{ email: 'admin@a.com' }],
        },
      ]);
      mockPrisma.aIUsageLog.aggregate.mockResolvedValue({ _sum: { costEur: 5 } }); // blocked
      mockFetch.mockResolvedValue({ ok: true, text: async () => '' });

      const result = await runCostAlertCheck();
      expect(result.tenantsChecked).toBe(1);
      expect(result.alertsSent).toBe(1);
      // Also sends super admin alert because of critical alert
      expect(mockFetch).toHaveBeenCalledTimes(2); // 1 tenant alert + 1 super admin
    });

    it('should skip sending when no admin email', async () => {
      mockPrisma.tenant.findMany.mockResolvedValue([
        {
          id: 't1',
          name: 'Cabinet A',
          plan: { name: 'SOLO' },
          users: [],
        },
      ]);
      mockPrisma.aIUsageLog.aggregate.mockResolvedValue({ _sum: { costEur: 5 } });
      mockFetch.mockResolvedValue({ ok: true, text: async () => '' });

      const result = await runCostAlertCheck();
      expect(result.alertsSent).toBe(0);
    });

    it('should not send super admin alert for warning-only alerts', async () => {
      mockPrisma.tenant.findMany.mockResolvedValue([
        {
          id: 't1',
          name: 'Cabinet A',
          plan: { name: 'SOLO' },
          users: [{ email: 'admin@a.com' }],
        },
      ]);
      // 70% warning only
      mockPrisma.aIUsageLog.aggregate.mockResolvedValue({ _sum: { costEur: 3.5 } });
      mockFetch.mockResolvedValue({ ok: true, text: async () => '' });

      const result = await runCostAlertCheck();
      // Only 1 call (tenant alert), no super admin
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
