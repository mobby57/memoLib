/**
 * Tests pour src/lib/ceseda/dossier-service.ts
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    dossier: {
      create: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { CesedaService } from '@/lib/ceseda/dossier-service';

const mockPrisma = prisma as any;

describe('CesedaService — Full Coverage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('calculatePriorite', () => {
    it('should return NORMALE without echeance', () => {
      expect(CesedaService.calculatePriorite('OQTF')).toBe('NORMALE');
    });

    it('should return CRITIQUE for OQTF <= 7 days', () => {
      const soon = new Date(Date.now() + 5 * 86400000);
      expect(CesedaService.calculatePriorite('OQTF', soon)).toBe('CRITIQUE');
    });

    it('should return HAUTE for OQTF 8-15 days', () => {
      const date = new Date(Date.now() + 10 * 86400000);
      expect(CesedaService.calculatePriorite('OQTF', date)).toBe('HAUTE');
    });

    it('should return NORMALE for OQTF > 15 days', () => {
      const date = new Date(Date.now() + 30 * 86400000);
      expect(CesedaService.calculatePriorite('OQTF', date)).toBe('NORMALE');
    });

    it('should return CRITIQUE for ASILE <= 15 days', () => {
      const date = new Date(Date.now() + 10 * 86400000);
      expect(CesedaService.calculatePriorite('ASILE', date)).toBe('CRITIQUE');
    });

    it('should return HAUTE for ASILE 16-30 days', () => {
      const date = new Date(Date.now() + 20 * 86400000);
      expect(CesedaService.calculatePriorite('ASILE', date)).toBe('HAUTE');
    });

    it('should return NORMALE for ASILE > 30 days', () => {
      const date = new Date(Date.now() + 60 * 86400000);
      expect(CesedaService.calculatePriorite('ASILE', date)).toBe('NORMALE');
    });

    it('should return HAUTE for other types <= 30 days', () => {
      const date = new Date(Date.now() + 20 * 86400000);
      expect(CesedaService.calculatePriorite('NATURALISATION', date)).toBe('HAUTE');
    });

    it('should return NORMALE for other types > 30 days', () => {
      const date = new Date(Date.now() + 60 * 86400000);
      expect(CesedaService.calculatePriorite('VISA', date)).toBe('NORMALE');
    });
  });

  describe('generateNumero', () => {
    it('should generate sequential number', async () => {
      mockPrisma.dossier.count.mockResolvedValue(5);
      const numero = await CesedaService.generateNumero('t1');
      const year = new Date().getFullYear();
      expect(numero).toBe(`D-${year}-006`);
    });

    it('should pad to 3 digits', async () => {
      mockPrisma.dossier.count.mockResolvedValue(0);
      const numero = await CesedaService.generateNumero('t1');
      expect(numero).toMatch(/D-\d{4}-001/);
    });
  });

  describe('createDossier', () => {
    it('should create dossier with calculated priority', async () => {
      mockPrisma.dossier.count.mockResolvedValue(10);
      mockPrisma.dossier.create.mockResolvedValue({ id: 'd1', numero: 'D-2026-011' });

      const result = await CesedaService.createDossier('t1', {
        type: 'OQTF',
        titre: 'Urgence OQTF',
        clientId: 'c1',
        echeance: new Date(Date.now() + 3 * 86400000),
      });

      expect(mockPrisma.dossier.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 't1',
          typeDossier: 'OQTF',
          priorite: 'CRITIQUE',
        }),
      }));
    });

    it('should use provided priority when given', async () => {
      mockPrisma.dossier.count.mockResolvedValue(0);
      mockPrisma.dossier.create.mockResolvedValue({ id: 'd1' });

      await CesedaService.createDossier('t1', {
        type: 'TITRE_SEJOUR',
        titre: 'Test',
        clientId: 'c1',
        priorite: 'HAUTE',
      });

      expect(mockPrisma.dossier.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ priorite: 'HAUTE' }),
      }));
    });
  });

  describe('updateStatut', () => {
    it('should update status', async () => {
      mockPrisma.dossier.update.mockResolvedValue({ id: 'd1', statut: 'CLOS' });
      await CesedaService.updateStatut('d1', 'CLOS');
      expect(mockPrisma.dossier.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'd1' },
        data: expect.objectContaining({ statut: 'CLOS' }),
      }));
    });

    it('should include userId when provided', async () => {
      mockPrisma.dossier.update.mockResolvedValue({});
      await CesedaService.updateStatut('d1', 'URGENT', 'user-1');
      expect(mockPrisma.dossier.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ updatedBy: 'user-1' }),
      }));
    });
  });

  describe('getDossiersUrgents', () => {
    it('should query urgent dossiers', async () => {
      mockPrisma.dossier.findMany.mockResolvedValue([{ id: 'd1' }]);
      const result = await CesedaService.getDossiersUrgents('t1');
      expect(result).toHaveLength(1);
      expect(mockPrisma.dossier.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ tenantId: 't1' }),
      }));
    });
  });

  describe('getStats', () => {
    it('should return dashboard stats', async () => {
      mockPrisma.dossier.count.mockResolvedValueOnce(50).mockResolvedValueOnce(10);
      mockPrisma.dossier.groupBy.mockResolvedValueOnce([
        { typeDossier: 'OQTF', _count: 20 },
      ]).mockResolvedValueOnce([
        { statut: 'EN_COURS', _count: 30 },
      ]);

      const stats = await CesedaService.getStats('t1');
      expect(stats.totalDossiers).toBe(50);
      expect(stats.dossiersUrgents).toBe(10);
      expect(stats.repartitionType).toHaveLength(1);
      expect(stats.repartitionStatut).toHaveLength(1);
    });
  });

  describe('updatePriorites', () => {
    it('should update priorities for dossiers whose priority changed', async () => {
      const soon = new Date(Date.now() + 3 * 86400000);
      mockPrisma.dossier.findMany.mockResolvedValue([
        { id: 'd1', typeDossier: 'OQTF', dateEcheance: soon, priorite: 'NORMALE' },
      ]);
      mockPrisma.dossier.update.mockResolvedValue({});

      const updates = await CesedaService.updatePriorites('t1');
      expect(updates).toHaveLength(1);
      expect(mockPrisma.dossier.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'd1' },
        data: { priorite: 'CRITIQUE' },
      }));
    });

    it('should skip dossiers with unchanged priority', async () => {
      const far = new Date(Date.now() + 60 * 86400000);
      mockPrisma.dossier.findMany.mockResolvedValue([
        { id: 'd1', typeDossier: 'VISA', dateEcheance: far, priorite: 'NORMALE' },
      ]);

      const updates = await CesedaService.updatePriorites('t1');
      expect(updates).toHaveLength(0);
    });
  });

  describe('searchDossiers', () => {
    it('should search with all filters', async () => {
      mockPrisma.dossier.findMany.mockResolvedValue([]);
      await CesedaService.searchDossiers('t1', {
        type: 'OQTF',
        statut: 'EN_COURS',
        priorite: 'CRITIQUE',
        clientId: 'c1',
        search: 'test',
      });
      expect(mockPrisma.dossier.findMany).toHaveBeenCalled();
    });

    it('should search with no filters', async () => {
      mockPrisma.dossier.findMany.mockResolvedValue([]);
      await CesedaService.searchDossiers('t1', {});
      expect(mockPrisma.dossier.findMany).toHaveBeenCalled();
    });
  });
});
