/**
 * Tests pour src/lib/services/dossier.service.ts
 * Coverage: Service métier centralisé pour gestion des dossiers
 */

// Mock Prisma
const mockPrisma = {
  dossier: {
    count: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  client: {
    findFirst: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

jest.mock('@/lib/mappers/dossier.mapper', () => ({
  generateNumeroDossier: jest.fn((count: number) => `DOS-2026-${(count + 1).toString().padStart(4, '0')}`),
}));

jest.mock('@/lib/constants/dossier.constants', () => ({
  mapStatutToDB: jest.fn((statut: string) => statut.toLowerCase().replace(/_/g, '_')),
  mapPrioriteToDB: jest.fn((priorite: string) => priorite.toLowerCase()),
}));

describe('DossierService', () => {
  let DossierService: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();
    
    const module = await import('@/lib/services/dossier.service');
    DossierService = module.DossierService;
  });

  describe('generateNumeroDossier', () => {
    it('should generate first numero for new tenant', async () => {
      mockPrisma.dossier.count.mockResolvedValue(0);

      const result = await DossierService.generateNumeroDossier('tenant-123');
      
      expect(result).toBe('DOS-2026-0001');
      expect(mockPrisma.dossier.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123' },
      });
    });

    it('should generate sequential numero', async () => {
      mockPrisma.dossier.count.mockResolvedValue(42);

      const result = await DossierService.generateNumeroDossier('tenant-123');
      
      expect(result).toBe('DOS-2026-0043');
    });

    it('should handle large count', async () => {
      mockPrisma.dossier.count.mockResolvedValue(9999);

      const result = await DossierService.generateNumeroDossier('tenant-123');
      
      expect(result).toBe('DOS-2026-10000');
    });
  });

  describe('createDossier', () => {
    const validDossierData = {
      clientId: 'client-123',
      typeDossier: 'OQTF',
      objetDemande: 'Contestation OQTF',
      priorite: 'HAUTE',
      statut: 'EN_COURS',
      dateEcheance: '2026-03-15',
      notes: 'Dossier urgent',
    };

    it('should create dossier successfully', async () => {
      mockPrisma.client.findFirst.mockResolvedValue({
        id: 'client-123',
        tenantId: 'tenant-456',
      });
      
      mockPrisma.dossier.count.mockResolvedValue(5);
      
      mockPrisma.dossier.create.mockResolvedValue({
        id: 'dossier-789',
        numero: 'DOS-2026-0006',
        typeDossier: 'OQTF',
        objet: 'Contestation OQTF',
        client: { id: 'client-123', firstName: 'Jean', lastName: 'Dupont' },
        _count: { documents: 0, echeances: 0 },
      });

      const result = await DossierService.createDossier(validDossierData, 'tenant-456');
      
      expect(result.id).toBe('dossier-789');
      expect(result.numero).toBe('DOS-2026-0006');
      expect(mockPrisma.dossier.create).toHaveBeenCalled();
    });

    it('should throw error when client not found', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(null);

      await expect(
        DossierService.createDossier(validDossierData, 'tenant-456')
      ).rejects.toThrow('Client non trouve ou acces refuse');
    });

    it('should throw error when client belongs to different tenant', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(null);

      await expect(
        DossierService.createDossier(validDossierData, 'wrong-tenant')
      ).rejects.toThrow('Client non trouve ou acces refuse');
    });

    it('should handle optional fields', async () => {
      mockPrisma.client.findFirst.mockResolvedValue({
        id: 'client-123',
        tenantId: 'tenant-456',
      });
      
      mockPrisma.dossier.count.mockResolvedValue(0);
      mockPrisma.dossier.create.mockResolvedValue({
        id: 'dossier-new',
        numero: 'DOS-2026-0001',
      });

      const minimalData = {
        clientId: 'client-123',
        typeDossier: 'AUTRE',
        objetDemande: 'Test',
      };

      await DossierService.createDossier(minimalData, 'tenant-456');
      
      expect(mockPrisma.dossier.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            priorite: 'normale',
            statut: 'en_cours',
            notes: '',
          }),
        })
      );
    });
  });

  describe('createDemandeClient', () => {
    const demandeData = {
      typeDossier: 'NATURALISATION',
      objetDemande: 'Demande de naturalisation',
      urgence: true,
      complementInfo: 'Information supplémentaire',
      dateEcheance: '2026-06-01',
    };

    it('should create demande client successfully', async () => {
      mockPrisma.dossier.count.mockResolvedValue(10);
      mockPrisma.dossier.create.mockResolvedValue({
        id: 'dossier-demande',
        numero: 'DOS-2026-0011',
        typeDossier: 'NATURALISATION',
        priorite: 'haute',
      });

      const result = await DossierService.createDemandeClient(
        demandeData,
        'tenant-456',
        'client-123'
      );
      
      expect(result.id).toBe('dossier-demande');
      expect(mockPrisma.dossier.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            priorite: 'haute', // urgence = true
            clientId: 'client-123',
          }),
        })
      );
    });

    it('should set normal priority when not urgent', async () => {
      mockPrisma.dossier.count.mockResolvedValue(0);
      mockPrisma.dossier.create.mockResolvedValue({
        id: 'dossier-normal',
        priorite: 'normale',
      });

      const nonUrgentData = { ...demandeData, urgence: false };
      
      await DossierService.createDemandeClient(
        nonUrgentData,
        'tenant-456',
        'client-123'
      );
      
      expect(mockPrisma.dossier.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            priorite: 'normale',
          }),
        })
      );
    });

    it('should handle missing complementInfo', async () => {
      mockPrisma.dossier.count.mockResolvedValue(0);
      mockPrisma.dossier.create.mockResolvedValue({ id: 'dossier-new' });

      const minimalDemande = {
        typeDossier: 'AUTRE',
        objetDemande: 'Test demande',
        urgence: false,
      };

      await DossierService.createDemandeClient(
        minimalDemande,
        'tenant-456',
        'client-123'
      );
      
      expect(mockPrisma.dossier.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            notes: '',
          }),
        })
      );
    });
  });

  describe('getDossiersByTenant', () => {
    it('should return all dossiers for tenant', async () => {
      const mockDossiers = [
        { id: 'dossier-1', numero: 'DOS-2026-0001' },
        { id: 'dossier-2', numero: 'DOS-2026-0002' },
        { id: 'dossier-3', numero: 'DOS-2026-0003' },
      ];
      
      mockPrisma.dossier.findMany.mockResolvedValue(mockDossiers);

      const result = await DossierService.getDossiersByTenant('tenant-123');
      
      expect(result).toHaveLength(3);
      expect(mockPrisma.dossier.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123' },
        orderBy: { dateCreation: 'desc' },
        include: expect.any(Object),
      });
    });

    it('should return empty array for tenant with no dossiers', async () => {
      mockPrisma.dossier.findMany.mockResolvedValue([]);

      const result = await DossierService.getDossiersByTenant('empty-tenant');
      
      expect(result).toEqual([]);
    });
  });
});

describe('DossierService Edge Cases', () => {
  let DossierService: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();
    
    const module = await import('@/lib/services/dossier.service');
    DossierService = module.DossierService;
  });

  it('should handle database errors in createDossier', async () => {
    mockPrisma.client.findFirst.mockResolvedValue({ id: 'client-1' });
    mockPrisma.dossier.count.mockResolvedValue(0);
    mockPrisma.dossier.create.mockRejectedValue(new Error('Database error'));

    await expect(
      DossierService.createDossier(
        { clientId: 'client-1', typeDossier: 'AUTRE', objetDemande: 'Test' },
        'tenant-1'
      )
    ).rejects.toThrow('Database error');
  });

  it('should handle concurrent dossier creation', async () => {
    mockPrisma.client.findFirst.mockResolvedValue({ id: 'client-1' });
    mockPrisma.dossier.count.mockResolvedValue(0);
    mockPrisma.dossier.create
      .mockResolvedValueOnce({ id: 'dossier-1', numero: 'DOS-2026-0001' })
      .mockResolvedValueOnce({ id: 'dossier-2', numero: 'DOS-2026-0002' });

    const [result1, result2] = await Promise.all([
      DossierService.createDossier(
        { clientId: 'client-1', typeDossier: 'OQTF', objetDemande: 'Test 1' },
        'tenant-1'
      ),
      DossierService.createDossier(
        { clientId: 'client-1', typeDossier: 'REFUS_TITRE', objetDemande: 'Test 2' },
        'tenant-1'
      ),
    ]);

    expect(result1.id).toBe('dossier-1');
    expect(result2.id).toBe('dossier-2');
  });
});
