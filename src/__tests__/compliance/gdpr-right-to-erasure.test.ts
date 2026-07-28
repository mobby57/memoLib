/**
 * Test E2E — Droit à l'oubli RGPD (Article 17)
 * Flux complet : requestDeletion → checkLegalRetention → executeDeletion → runRightToErasureE2E
 * @jest-environment node
 */

jest.mock('@/lib/prisma', () => {
  const prisma = {
    userConsent: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
    user: { findUnique: jest.fn(), update: jest.fn() },
    email: { findMany: jest.fn(), deleteMany: jest.fn() },
    subscription: { findFirst: jest.fn(), findMany: jest.fn() },
    deletionRequest: { create: jest.fn(), updateMany: jest.fn() },
    auditLog: { findMany: jest.fn(), updateMany: jest.fn() },
    dossier: { findMany: jest.fn(), findUnique: jest.fn() },
    notification: { deleteMany: jest.fn() },
    calendarEvent: { deleteMany: jest.fn() },
    stripeCustomer: { findUnique: jest.fn(), updateMany: jest.fn() },
    dataExportRequest: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    session: { findMany: jest.fn() },
    userSettings: { findUnique: jest.fn() },
  };
  (globalThis as Record<string, unknown>).__gdprPrismaMock = prisma;
  return { prisma };
});

jest.mock('@/lib/logger', () => ({ logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() } }));

import {
  GDPRCompliance,
  checkLegalRetention,
  runRightToErasureE2E,
  DATA_RETENTION,
} from '@/lib/compliance/gdpr';

const mockPrisma = (globalThis as Record<string, unknown>).__gdprPrismaMock as {
  user: { findUnique: jest.Mock; update: jest.Mock };
  email: { deleteMany: jest.Mock };
  subscription: { findFirst: jest.Mock };
  deletionRequest: { create: jest.Mock; updateMany: jest.Mock };
  auditLog: { updateMany: jest.Mock };
  dossier: { findMany: jest.Mock; findUnique: jest.Mock };
  notification: { deleteMany: jest.Mock };
  calendarEvent: { deleteMany: jest.Mock };
};

const TENANT_ID = 'tenant-test-rgpd';
const USER_ID = 'user-test-rgpd';

describe('RGPD — Droit à l\'oubli (Article 17) — E2E', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('checkLegalRetention', () => {
    it('autorise la suppression si dossier inexistant', async () => {
      mockPrisma.dossier.findUnique.mockResolvedValue(null);
      const result = await checkLegalRetention('dossier-inexistant');
      expect(result.canDelete).toBe(true);
    });

    it('bloque si dossier encore actif (non clôturé)', async () => {
      mockPrisma.dossier.findUnique.mockResolvedValue({
        id: 'd1',
        createdAt: new Date(),
        dateCloture: null,
        statut: 'en_cours',
        typeDossier: 'OQTF',
      });

      const result = await checkLegalRetention('d1');

      expect(result.canDelete).toBe(false);
      expect(result.reason).toContain('actif');
    });

    it('bloque si dossier clôturé depuis moins de 5 ans', async () => {
      const dateCloture = new Date();
      dateCloture.setFullYear(dateCloture.getFullYear() - 1);

      mockPrisma.dossier.findUnique.mockResolvedValue({
        id: 'd2',
        createdAt: new Date(dateCloture.getTime() - 86400000),
        dateCloture,
        statut: 'archive',
        typeDossier: 'OQTF',
      });

      const result = await checkLegalRetention('d2');

      expect(result.canDelete).toBe(false);
      expect(result.retentionEndDate).toBeInstanceOf(Date);
    });

    it('autorise la suppression si dossier clôturé depuis plus de 5 ans', async () => {
      const dateCloture = new Date();
      dateCloture.setFullYear(dateCloture.getFullYear() - 6);

      mockPrisma.dossier.findUnique.mockResolvedValue({
        id: 'd3',
        createdAt: new Date(dateCloture.getTime() - 86400000),
        dateCloture,
        statut: 'archive',
        typeDossier: 'OQTF',
      });

      const result = await checkLegalRetention('d3');

      expect(result.canDelete).toBe(true);
    });

    it('respecte DATA_RETENTION.legalFiles = 1825 jours (5 ans)', () => {
      expect(DATA_RETENTION.legalFiles).toBe(1825);
    });
  });

  describe('requestDeletion', () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue({ tenantId: TENANT_ID });
    });

    it('refuse si abonnement actif', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue({ id: 'sub-1', status: 'active' });

      await expect(GDPRCompliance.requestDeletion(USER_ID)).rejects.toThrow(
        'Cannot delete account with active subscription'
      );
    });

    it('planifie la suppression à J+30 si pas d\'abonnement actif', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(null);
      mockPrisma.deletionRequest.create.mockResolvedValue({
        userId: USER_ID,
        requestedAt: new Date(),
        scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'scheduled',
        reason: null,
      });

      const result = await GDPRCompliance.requestDeletion(USER_ID, 'Test');

      expect(result.status).toBe('scheduled');
      expect(result.scheduledFor.getTime()).toBeGreaterThan(Date.now() + 29 * 24 * 60 * 60 * 1000);
    });
  });

  describe('cancelDeletion', () => {
    it('annule la demande de suppression planifiée', async () => {
      mockPrisma.deletionRequest.updateMany.mockResolvedValue({ count: 1 });

      await GDPRCompliance.cancelDeletion(USER_ID);

      expect(mockPrisma.deletionRequest.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: USER_ID, status: 'scheduled' },
          data: expect.objectContaining({ status: 'cancelled' }),
        })
      );
    });
  });

  describe('executeDeletion — flux complet', () => {
    beforeEach(() => {
      const dateCloture = new Date();
      dateCloture.setFullYear(dateCloture.getFullYear() - 6);

      mockPrisma.user.findUnique.mockResolvedValue({ id: USER_ID, tenantId: TENANT_ID });
      mockPrisma.dossier.findMany.mockResolvedValue([{ id: 'd1' }]);
      mockPrisma.dossier.findUnique.mockResolvedValue({
        id: 'd1',
        createdAt: new Date(dateCloture.getTime() - 86400000),
        dateCloture,
        statut: 'archive',
        typeDossier: 'OQTF',
      });
      mockPrisma.email.deleteMany.mockResolvedValue({ count: 5 });
      mockPrisma.notification.deleteMany.mockResolvedValue({ count: 2 });
      mockPrisma.calendarEvent.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.auditLog.updateMany.mockResolvedValue({ count: 10 });
      mockPrisma.user.update.mockResolvedValue({ id: USER_ID });
      mockPrisma.deletionRequest.updateMany.mockResolvedValue({ count: 1 });
    });

    it('anonymise l\'email utilisateur', async () => {
      await GDPRCompliance.executeDeletion(USER_ID);

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: `deleted-${USER_ID}@anonymized.local`,
            name: 'Deleted User',
          }),
        })
      );
    });

    it('anonymise les logs d\'audit (userId → DELETED)', async () => {
      await GDPRCompliance.executeDeletion(USER_ID);

      expect(mockPrisma.auditLog.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: USER_ID },
          data: expect.objectContaining({ userId: 'DELETED' }),
        })
      );
    });

    it('ne supprime pas les emails partagés du tenant', async () => {
      await GDPRCompliance.executeDeletion(USER_ID);

      expect(mockPrisma.email.deleteMany).not.toHaveBeenCalled();
    });

    it('marque la demande de suppression comme completed', async () => {
      await GDPRCompliance.executeDeletion(USER_ID);

      expect(mockPrisma.deletionRequest.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'completed' }),
        })
      );
    });

    it('NE supprime PAS les emails si dossiers sous rétention légale', async () => {
      mockPrisma.dossier.findUnique.mockResolvedValue({
        id: 'd-actif',
        createdAt: new Date(),
        dateCloture: null,
        statut: 'en_cours',
        typeDossier: 'OQTF',
      });

      await GDPRCompliance.executeDeletion(USER_ID);

      expect(mockPrisma.email.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('runRightToErasureE2E', () => {
    beforeEach(() => {
      const dateCloture = new Date();
      dateCloture.setFullYear(dateCloture.getFullYear() - 6);

      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: USER_ID, tenantId: TENANT_ID })
        .mockResolvedValueOnce({ id: USER_ID, tenantId: TENANT_ID })
        .mockResolvedValue({ email: `deleted-${USER_ID}@anonymized.local`, name: 'Deleted User' });

      mockPrisma.dossier.findMany.mockResolvedValue([{ id: 'd1' }]);
      mockPrisma.dossier.findUnique.mockResolvedValue({
        id: 'd1',
        createdAt: new Date(dateCloture.getTime() - 86400000),
        dateCloture,
        statut: 'archive',
        typeDossier: 'OQTF',
      });
      mockPrisma.subscription.findFirst.mockResolvedValue(null);
      mockPrisma.deletionRequest.create.mockResolvedValue({
        userId: USER_ID,
        requestedAt: new Date(),
        scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'scheduled',
      });
      mockPrisma.email.deleteMany.mockResolvedValue({ count: 3 });
      mockPrisma.notification.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.calendarEvent.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.auditLog.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.user.update.mockResolvedValue({ id: USER_ID });
      mockPrisma.deletionRequest.updateMany.mockResolvedValue({ count: 1 });
    });

    it('exécute le flux complet de bout en bout', async () => {
      const result = await runRightToErasureE2E(USER_ID, 'Test E2E');

      expect(result.phase).toBe('executed');
      expect(result.retentionChecks).toHaveLength(1);
      expect(result.retentionChecks[0].canDelete).toBe(true);
      expect(result.deletionRequest?.status).toBe('scheduled');
      expect(result.emailsDeleted).toBe(true);
      expect(result.userAnonymized).toBe(true);
    });
  });
});
