/**
 * Tests pour src/lib/compliance/gdpr.ts — GDPRCompliance class
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    userConsent: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    aIDecision: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    email: { findMany: vi.fn() },
    stripeCustomer: { findUnique: vi.fn() },
    subscription: { findMany: vi.fn(), findFirst: vi.fn() },
    auditLog: { findMany: vi.fn(), updateMany: vi.fn() },
    userSettings: { findUnique: vi.fn() },
    session: { findMany: vi.fn() },
    dataExportRequest: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    deletionRequest: {
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    dataBreach: {
      create: vi.fn(),
      update: vi.fn(),
    },
    dossier: { findMany: vi.fn() },
    notification: { deleteMany: vi.fn() },
    calendarEvent: { deleteMany: vi.fn() },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { prisma } from '@/lib/prisma';
import {
  GDPRCompliance,
  COOKIE_CATEGORIES,
  DATA_RETENTION,
  checkLegalRetention,
} from '@/lib/compliance/gdpr';

const mockPrisma = prisma as any;

describe('gdpr.ts — Full Coverage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('GDPRCompliance.recordConsent', () => {
    it('should create consent record', async () => {
      mockPrisma.userConsent.create.mockResolvedValue({});
      await GDPRCompliance.recordConsent('u1', {
        type: 'analytics',
        granted: true,
        ipAddress: '1.2.3.4',
        userAgent: 'Mozilla/5.0',
        version: '1.0',
      });
      expect(mockPrisma.userConsent.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ userId: 'u1', type: 'analytics', granted: true }),
      }));
    });
  });

  describe('GDPRCompliance.getUserConsents', () => {
    it('should return mapped consents', async () => {
      mockPrisma.userConsent.findMany.mockResolvedValue([
        { type: 'essential', granted: true, grantedAt: new Date(), ipAddress: '1.2.3.4', userAgent: 'UA', policyVersion: '1.0' },
      ]);
      const consents = await GDPRCompliance.getUserConsents('u1');
      expect(consents).toHaveLength(1);
      expect(consents[0].type).toBe('essential');
      expect(consents[0].granted).toBe(true);
    });
  });

  describe('GDPRCompliance.hasConsent', () => {
    it('should return true when granted', async () => {
      mockPrisma.userConsent.findFirst.mockResolvedValue({ granted: true });
      expect(await GDPRCompliance.hasConsent('u1', 'analytics')).toBe(true);
    });

    it('should return false when not granted', async () => {
      mockPrisma.userConsent.findFirst.mockResolvedValue({ granted: false });
      expect(await GDPRCompliance.hasConsent('u1', 'marketing')).toBe(false);
    });

    it('should return false when no record', async () => {
      mockPrisma.userConsent.findFirst.mockResolvedValue(null);
      expect(await GDPRCompliance.hasConsent('u1', 'third_party')).toBe(false);
    });
  });

  describe('GDPRCompliance.exportUserData', () => {
    it('should export all categories', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'test@test.com' });
      mockPrisma.email.findMany.mockResolvedValue([]);
      mockPrisma.stripeCustomer.findUnique.mockResolvedValue(null);
      mockPrisma.subscription.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.userConsent.findMany.mockResolvedValue([]);
      mockPrisma.userSettings.findUnique.mockResolvedValue(null);
      mockPrisma.session.findMany.mockResolvedValue([]);

      const data = await GDPRCompliance.exportUserData('u1');
      expect(data.exportedAt).toBeDefined();
      expect(data.categories.profile).toBeDefined();
      expect(data.categories.communications).toBeDefined();
      expect(data.categories.financial).toBeDefined();
      expect(data.categories.usage).toBeDefined();
      expect(data.categories.preferences).toBeDefined();
      expect(data.categories.technical).toBeDefined();
    });

    it('should export specific categories only', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });

      const data = await GDPRCompliance.exportUserData('u1', ['profile']);
      expect(data.categories.profile).toBeDefined();
      expect(data.categories.communications).toBeUndefined();
    });
  });

  describe('GDPRCompliance.requestDeletion', () => {
    it('should schedule deletion 30 days from now', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', tenantId: 't1' });
      mockPrisma.subscription.findFirst.mockResolvedValue(null);
      mockPrisma.deletionRequest.create.mockResolvedValue({
        userId: 'u1',
        requestedAt: new Date(),
        scheduledFor: new Date(Date.now() + 30 * 86400000),
        status: 'scheduled',
        reason: 'test',
      });

      const result = await GDPRCompliance.requestDeletion('u1', 'test');
      expect(result.status).toBe('scheduled');
      expect(result.userId).toBe('u1');
    });

    it('should throw if no tenant', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', tenantId: null });
      await expect(GDPRCompliance.requestDeletion('u1')).rejects.toThrow('tenant');
    });

    it('should throw if active subscription', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', tenantId: 't1' });
      mockPrisma.subscription.findFirst.mockResolvedValue({ status: 'active' });
      await expect(GDPRCompliance.requestDeletion('u1')).rejects.toThrow('subscription');
    });
  });

  describe('GDPRCompliance.cancelDeletion', () => {
    it('should update deletion request to cancelled', async () => {
      mockPrisma.deletionRequest.updateMany.mockResolvedValue({ count: 1 });
      await GDPRCompliance.cancelDeletion('u1');
      expect(mockPrisma.deletionRequest.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId: 'u1', status: 'scheduled' },
      }));
    });
  });

  describe('GDPRCompliance.executeDeletion', () => {
    it('should anonymize user and delete personal data', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', tenantId: 't1' });
      mockPrisma.dossier.findMany.mockResolvedValue([]);
      mockPrisma.notification.deleteMany.mockResolvedValue({});
      mockPrisma.calendarEvent.deleteMany.mockResolvedValue({});
      mockPrisma.auditLog.updateMany.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});

      await GDPRCompliance.executeDeletion('u1');

      expect(mockPrisma.notification.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
      expect(mockPrisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'deleted', name: 'Deleted User' }),
      }));
    });

    it('should throw if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(GDPRCompliance.executeDeletion('unknown')).rejects.toThrow('introuvable');
    });

    it('should handle dossiers with retention blocks', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', tenantId: 't1' });
      mockPrisma.dossier.findMany.mockResolvedValue([{ id: 'd1' }]);
      // checkLegalRetention will call prisma.dossier.findUnique
      const mockDossierFind = vi.fn().mockResolvedValue({
        id: 'd1',
        createdAt: new Date(),
        dateCloture: null,
        statut: 'EN_COURS',
        typeDossier: 'OQTF',
      });
      mockPrisma.dossier.findUnique = mockDossierFind;
      mockPrisma.notification.deleteMany.mockResolvedValue({});
      mockPrisma.calendarEvent.deleteMany.mockResolvedValue({});
      mockPrisma.auditLog.updateMany.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});

      // Should still complete (with warning log)
      await GDPRCompliance.executeDeletion('u1');
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });
  });

  describe('GDPRCompliance.reportDataBreach', () => {
    it('should create breach record and notify for critical', async () => {
      mockPrisma.dataBreach.create.mockResolvedValue({ id: 'breach1' });
      mockPrisma.dataBreach.update.mockResolvedValue({});

      await GDPRCompliance.reportDataBreach(
        ['u1', 'u2'],
        'unauthorized_access',
        'Data leaked',
        'critical'
      );

      expect(mockPrisma.dataBreach.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ severity: 'critical', affectedUsers: 2 }),
      }));
    });

    it('should handle low severity without authority notification', async () => {
      mockPrisma.dataBreach.create.mockResolvedValue({ id: 'breach2' });
      mockPrisma.dataBreach.update.mockResolvedValue({});

      await GDPRCompliance.reportDataBreach(['u1'], 'minor', 'Small issue', 'low');
      expect(mockPrisma.dataBreach.create).toHaveBeenCalled();
    });
  });

  describe('checkLegalRetention', () => {
    it('should allow deletion when dossier not found', async () => {
      mockPrisma.dossier.findUnique = vi.fn().mockResolvedValue(null);
      const result = await checkLegalRetention('nonexistent');
      expect(result.canDelete).toBe(true);
    });

    it('should block active dossiers', async () => {
      mockPrisma.dossier.findUnique = vi.fn().mockResolvedValue({
        id: 'd1',
        createdAt: new Date(),
        dateCloture: null,
        statut: 'EN_COURS',
        typeDossier: 'OQTF',
      });
      const result = await checkLegalRetention('d1');
      expect(result.canDelete).toBe(false);
      expect(result.reason).toContain('actif');
    });

    it('should block closed dossiers within retention period', async () => {
      const twoYearsAgo = new Date(Date.now() - 2 * 365 * 86400000);
      mockPrisma.dossier.findUnique = vi.fn().mockResolvedValue({
        id: 'd1',
        createdAt: new Date('2020-01-01'),
        dateCloture: twoYearsAgo,
        statut: 'CLOS',
        typeDossier: 'OQTF',
      });
      const result = await checkLegalRetention('d1');
      expect(result.canDelete).toBe(false);
      expect(result.reason).toContain('conservation');
    });

    it('should allow deletion after retention period', async () => {
      const tenYearsAgo = new Date(Date.now() - 10 * 365 * 86400000);
      mockPrisma.dossier.findUnique = vi.fn().mockResolvedValue({
        id: 'd1',
        createdAt: new Date('2010-01-01'),
        dateCloture: tenYearsAgo,
        statut: 'archive',
        typeDossier: 'TITRE_SEJOUR',
      });
      const result = await checkLegalRetention('d1');
      expect(result.canDelete).toBe(true);
    });
  });

  describe('COOKIE_CATEGORIES', () => {
    it('should have essential as required', () => {
      expect(COOKIE_CATEGORIES.essential.required).toBe(true);
    });

    it('should have optional categories', () => {
      expect(COOKIE_CATEGORIES.analytics.required).toBe(false);
      expect(COOKIE_CATEGORIES.marketing.required).toBe(false);
      expect(COOKIE_CATEGORIES.personalization.required).toBe(false);
    });
  });

  describe('DATA_RETENTION', () => {
    it('should define legal retention periods', () => {
      expect(DATA_RETENTION.legalFiles).toBe(1825); // 5 years
      expect(DATA_RETENTION.financialRecords).toBe(3650); // 10 years
      expect(DATA_RETENTION.taxDocuments).toBe(2555); // 7 years
      expect(DATA_RETENTION.deletedAccounts).toBe(30);
    });
  });
});
