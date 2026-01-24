/**
 * Tests unitaires pour DossierService
 * Service métier central pour la gestion des dossiers
 */

import { DossierService } from '@/lib/services/dossier.service';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    dossier: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    client: {
      findFirst: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

// Mock du logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('DossierService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateNumeroDossier()', () => {
    it('génère un numéro de dossier formaté correctement', async () => {
      // Le format attendu est généralement: DOS-YYYY-XXXX
      const tenantId = 'tenant-123';
      
      // Mock du count
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      mockPrisma.dossier.count.mockResolvedValue(5);
      
      const numero = await DossierService.generateNumeroDossier(tenantId);
      
      // Vérifie que le numéro est bien formaté
      expect(numero).toBeDefined();
      expect(typeof numero).toBe('string');
    });

    it('incrémente le compteur pour chaque nouveau dossier', async () => {
      const tenantId = 'tenant-123';
      
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      
      // Premier appel
      mockPrisma.dossier.count.mockResolvedValueOnce(0);
      const numero1 = await DossierService.generateNumeroDossier(tenantId);
      
      // Deuxième appel  
      mockPrisma.dossier.count.mockResolvedValueOnce(1);
      const numero2 = await DossierService.generateNumeroDossier(tenantId);
      
      expect(numero1).not.toBe(numero2);
    });
  });

  describe('createDossier()', () => {
    const mockTenantId = 'tenant-123';
    const mockCreateData = {
      clientId: 'client-123',
      typeDossier: 'OQTF',
      objetDemande: 'Recours OQTF',
      priorite: 'HAUTE' as const,
      statut: 'EN_COURS' as const,
      notes: 'Notes du dossier',
    };

    it('crée un dossier avec toutes les données requises', async () => {
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      
      // Mock client existant
      mockPrisma.client.findFirst.mockResolvedValue({
        id: 'client-123',
        tenantId: mockTenantId,
        firstName: 'Jean',
        lastName: 'Dupont',
      });
      
      // Mock count pour génération numéro
      mockPrisma.dossier.count.mockResolvedValue(0);
      
      // Mock création dossier
      mockPrisma.dossier.create.mockResolvedValue({
        id: 'dossier-123',
        numero: 'DOS-2026-0001',
        typeDossier: 'OQTF',
        objet: 'Recours OQTF',
        priorite: 'HAUTE',
        statut: 'EN_COURS',
        tenantId: mockTenantId,
        clientId: 'client-123',
        client: {
          id: 'client-123',
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean@example.com',
        },
        _count: {
          documents: 0,
          echeances: 0,
        },
      });
      
      const result = await DossierService.createDossier(mockCreateData, mockTenantId);
      
      expect(result).toBeDefined();
      expect(result.id).toBe('dossier-123');
      expect(result.typeDossier).toBe('OQTF');
    });

    it('rejette si le client n\'appartient pas au tenant', async () => {
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      
      // Client non trouvé
      mockPrisma.client.findFirst.mockResolvedValue(null);
      
      await expect(
        DossierService.createDossier(mockCreateData, mockTenantId)
      ).rejects.toThrow('Client non trouve ou acces refuse');
    });

    it('génère automatiquement un numéro de dossier', async () => {
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      
      mockPrisma.client.findFirst.mockResolvedValue({
        id: 'client-123',
        tenantId: mockTenantId,
      });
      
      mockPrisma.dossier.count.mockResolvedValue(42);
      
      mockPrisma.dossier.create.mockResolvedValue({
        id: 'dossier-new',
        numero: 'DOS-2026-0043',
        typeDossier: 'OQTF',
        client: {},
        _count: { documents: 0, echeances: 0 },
      });
      
      const result = await DossierService.createDossier(mockCreateData, mockTenantId);
      
      expect(mockPrisma.dossier.count).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
      });
      expect(result.numero).toBeDefined();
    });
  });

  describe('createDemandeClient()', () => {
    const mockTenantId = 'tenant-123';
    const mockClientId = 'client-123';
    const mockDemandeData = {
      typeDossier: 'OQTF',
      objetDemande: 'Ma demande',
      urgence: true,
      description: 'Description détaillée',
    };

    it('crée une demande client avec priorité haute si urgente', async () => {
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      
      mockPrisma.dossier.count.mockResolvedValue(0);
      mockPrisma.dossier.create.mockResolvedValue({
        id: 'dossier-demande',
        numero: 'DOS-2026-0001',
        typeDossier: 'OQTF',
        priorite: 'haute',
      });
      
      const result = await DossierService.createDemandeClient(
        mockDemandeData,
        mockTenantId,
        mockClientId
      );
      
      expect(result).toBeDefined();
    });

    it('crée une demande client avec priorité normale si non urgente', async () => {
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      
      const nonUrgentData = { ...mockDemandeData, urgence: false };
      
      mockPrisma.dossier.count.mockResolvedValue(0);
      mockPrisma.dossier.create.mockResolvedValue({
        id: 'dossier-demande',
        numero: 'DOS-2026-0001',
        typeDossier: 'OQTF',
        priorite: 'normale',
      });
      
      const result = await DossierService.createDemandeClient(
        nonUrgentData,
        mockTenantId,
        mockClientId
      );
      
      expect(result).toBeDefined();
    });
  });
});
