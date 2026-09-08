/**
 * RGPD — droit à l'oubli / effacement (P2).
 *
 * Importe le service de production réel (RGPDComplianceService) et prouve que
 * l'anonymisation et la suppression effectuent de VRAIES mutations en base
 * (pas seulement une demande PENDING). Ferme le GAP RGPD-ERASURE.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma, createEventLog, purgeIntakeByClientEmail } = vi.hoisted(() => {
  const model = () => ({
    update: vi.fn().mockResolvedValue({}),
    updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    delete: vi.fn().mockResolvedValue({}),
    count: vi.fn().mockResolvedValue(0),
    findUnique: vi.fn(),
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({ id: 'req-1' }),
  });
  return {
    mockPrisma: {
      user: model(),
      client: model(),
      oAuthToken: model(),
      comment: model(),
      chatSession: model(),
      chatMessage: model(),
      mention: model(),
      document: model(),
      consentRecord: model(),
      dataExportRequest: model(),
    },
    createEventLog: vi.fn().mockResolvedValue({}),
    purgeIntakeByClientEmail: vi.fn().mockResolvedValue({ purgedRequests: 0, purgedFiles: 0 }),
  };
});

vi.mock('@/lib/prisma', () => ({ default: mockPrisma, prisma: mockPrisma }));
vi.mock('@/lib/services/event-log.service', () => ({
  EventLogService: class {
    createEventLog = createEventLog;
  },
}));
vi.mock('@/lib/services/intake.service', () => ({
  purgeIntakeByClientEmail,
}));

import { RGPDComplianceService } from '@/lib/services/rgpd-compliance.service';

const service = new RGPDComplianceService();

describe('[P2] RGPD — anonymisation & effacement effectifs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('anonymizeUser (Art. 17 — droit à l’oubli)', () => {
    it('remplace réellement les identifiants du User', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ clientId: null });

      await service.anonymizeUser({ userId: 'u1', tenantId: 't1', requestedBy: 'admin' });

      expect(mockPrisma.user.update).toHaveBeenCalledTimes(1);
      const data = mockPrisma.user.update.mock.calls[0][0].data;
      // Données personnelles réellement écrasées
      expect(data.email).toMatch(/anonymized.*@deleted\.local/);
      expect(data.name).toBe('Utilisateur Anonymisé');
      expect(data.phone).toBeNull();
    });

    it('anonymise le Client associé (dont passportNumber) quand il existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ clientId: 'c1' });

      await service.anonymizeUser({ userId: 'u1', tenantId: 't1', requestedBy: 'admin' });

      expect(mockPrisma.client.update).toHaveBeenCalledTimes(1);
      const data = mockPrisma.client.update.mock.calls[0][0].data;
      expect(data.passportNumber).toBeNull();
      expect(data.address).toBeNull();
      expect(data.lastName).toBe('ANONYMISE');
    });

    it('révoque les OAuthTokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ clientId: null });

      await service.anonymizeUser({ userId: 'u1', tenantId: 't1', requestedBy: 'admin' });

      expect(mockPrisma.oAuthToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'u1' },
          data: expect.objectContaining({ accessToken: 'REVOKED', refreshToken: 'REVOKED' }),
        })
      );
    });

    it('journalise DATA_ANONYMIZED', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ clientId: null });
      await service.anonymizeUser({ userId: 'u1', tenantId: 't1', requestedBy: 'admin' });
      expect(createEventLog).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'DATA_ANONYMIZED', entityId: 'u1' })
      );
    });
  });

  describe('deleteUserData (Art. 17 — effacement)', () => {
    it('supprime réellement le User (cascade) et journalise AVANT suppression', async () => {
      const result = await service.deleteUserData({ userId: 'u1', tenantId: 't1', requestedBy: 'admin' });

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
      expect(createEventLog).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'DATA_DELETED', entityId: 'u1' })
      );
      expect(result.deletedRecords.users).toBe(1);
      // L'EventLog est créé avant le delete (trace conservée)
      const logOrder = createEventLog.mock.invocationCallOrder[0];
      const deleteOrder = mockPrisma.user.delete.mock.invocationCallOrder[0];
      expect(logOrder).toBeLessThan(deleteOrder);
    });

    it('purge aussi les demandes d’intake liées à l’email (droit à l’oubli)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ email: 'client@example.com' });
      purgeIntakeByClientEmail.mockResolvedValue({ purgedRequests: 2, purgedFiles: 3 });

      const result = await service.deleteUserData({ userId: 'u1', tenantId: 't1', requestedBy: 'admin' });

      expect(purgeIntakeByClientEmail).toHaveBeenCalledWith('t1', 'client@example.com', 'admin');
      expect(result.deletedRecords.intake_requests).toBe(2);
      expect(result.deletedRecords.intake_files).toBe(3);
    });

    it('ne tente pas de purge intake si l’utilisateur n’a pas d’email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await service.deleteUserData({ userId: 'u1', tenantId: 't1', requestedBy: 'admin' });
      expect(purgeIntakeByClientEmail).not.toHaveBeenCalled();
    });
  });
});
