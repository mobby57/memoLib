/**
 * Tests pour src/lib/mappers/dossier.mapper.ts
 * Coverage: Mappers pour convertir les données dossiers
 */

describe('Dossier Mapper', () => {
  let mapDossierToUI: any;
  let mapDossiersToUI: any;
  let generateNumeroDossier: any;
  let formatDate: any;
  let formatDateForInput: any;
  let getTypeLabel: any;

  beforeEach(async () => {
    jest.resetModules();
    const module = await import('@/lib/mappers/dossier.mapper');
    mapDossierToUI = module.mapDossierToUI;
    mapDossiersToUI = module.mapDossiersToUI;
    generateNumeroDossier = module.generateNumeroDossier;
    formatDate = module.formatDate;
    formatDateForInput = module.formatDateForInput;
    getTypeLabel = module.getTypeLabel;
  });

  describe('generateNumeroDossier', () => {
    it('should generate first dossier number', () => {
      const result = generateNumeroDossier(0);
      expect(result).toMatch(/^D-\d{4}-001$/);
    });

    it('should generate sequential dossier numbers', () => {
      const result = generateNumeroDossier(9);
      expect(result).toMatch(/^D-\d{4}-010$/);
    });

    it('should generate three-digit padded numbers', () => {
      const result = generateNumeroDossier(99);
      expect(result).toMatch(/^D-\d{4}-100$/);
    });

    it('should include current year', () => {
      const year = new Date().getFullYear();
      const result = generateNumeroDossier(0);
      expect(result).toContain(year.toString());
    });

    it('should handle large counts', () => {
      const result = generateNumeroDossier(999);
      expect(result).toMatch(/^D-\d{4}-1000$/);
    });
  });

  describe('formatDate', () => {
    it('should format Date object', () => {
      const date = new Date('2026-01-15');
      const result = formatDate(date);
      expect(result).toMatch(/15\/01\/2026/);
    });

    it('should format date string', () => {
      const result = formatDate('2026-01-15');
      expect(result).toMatch(/15\/01\/2026/);
    });

    it('should return dash for undefined', () => {
      const result = formatDate(undefined);
      expect(result).toBe('-');
    });

    it('should return dash for null', () => {
      const result = formatDate(null as any);
      expect(result).toBe('-');
    });

    it('should format ISO date string', () => {
      const result = formatDate('2026-06-25T10:30:00.000Z');
      expect(result).toMatch(/25\/06\/2026/);
    });
  });

  describe('formatDateForInput', () => {
    it('should format Date for datetime-local input', () => {
      const date = new Date('2026-01-15T10:30:00.000Z');
      const result = formatDateForInput(date);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    it('should format date string for input', () => {
      const result = formatDateForInput('2026-01-15T10:30:00.000Z');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    it('should return empty string for undefined', () => {
      const result = formatDateForInput(undefined);
      expect(result).toBe('');
    });

    it('should return empty string for null', () => {
      const result = formatDateForInput(null as any);
      expect(result).toBe('');
    });
  });

  describe('getTypeLabel', () => {
    it('should return label for TITRE_SEJOUR', () => {
      const result = getTypeLabel('TITRE_SEJOUR');
      expect(result).toBe('Titre de Sejour');
    });

    it('should return label for RECOURS_OQTF', () => {
      const result = getTypeLabel('RECOURS_OQTF');
      expect(result).toBe('Recours OQTF');
    });

    it('should return label for NATURALISATION', () => {
      const result = getTypeLabel('NATURALISATION');
      expect(result).toBe('Naturalisation');
    });

    it('should return label for REGROUPEMENT_FAMILIAL', () => {
      const result = getTypeLabel('REGROUPEMENT_FAMILIAL');
      expect(result).toBe('Regroupement Familial');
    });

    it('should return label for VISA', () => {
      const result = getTypeLabel('VISA');
      expect(result).toBe('Visa');
    });

    it('should return label for AUTRE', () => {
      const result = getTypeLabel('AUTRE');
      expect(result).toBe('Autre');
    });

    it('should return type itself for unknown type', () => {
      const result = getTypeLabel('UNKNOWN_TYPE');
      expect(result).toBe('UNKNOWN_TYPE');
    });
  });

  describe('mapDossierToUI', () => {
    const mockDossierDB = {
      id: 'dossier-123',
      numero: 'D-2026-001',
      typeDossier: 'TITRE_SEJOUR',
      objet: 'Demande de renouvellement',
      statut: 'en_cours',
      priorite: 'haute',
      dateCreation: new Date('2026-01-10'),
      dateEcheance: new Date('2026-03-15'),
      client: {
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@example.com',
      },
      _count: {
        documents: 5,
        echeances: 2,
      },
    };

    it('should map dossier ID', () => {
      const result = mapDossierToUI(mockDossierDB);
      expect(result.id).toBe('dossier-123');
    });

    it('should map numero to numeroDossier', () => {
      const result = mapDossierToUI(mockDossierDB);
      expect(result.numeroDossier).toBe('D-2026-001');
    });

    it('should map typeDossier', () => {
      const result = mapDossierToUI(mockDossierDB);
      expect(result.typeDossier).toBe('TITRE_SEJOUR');
    });

    it('should map objet to objetDemande', () => {
      const result = mapDossierToUI(mockDossierDB);
      expect(result.objetDemande).toBe('Demande de renouvellement');
    });

    it('should map client info', () => {
      const result = mapDossierToUI(mockDossierDB);
      expect(result.client.nom).toBe('Dupont');
      expect(result.client.prenom).toBe('Jean');
      expect(result.client.email).toBe('jean.dupont@example.com');
    });

    it('should map _count', () => {
      const result = mapDossierToUI(mockDossierDB);
      expect(result._count.documents).toBe(5);
      expect(result._count.echeances).toBe(2);
    });

    it('should handle null objet', () => {
      const dossier = { ...mockDossierDB, objet: null };
      const result = mapDossierToUI(dossier);
      expect(result.objetDemande).toBe('');
    });

    it('should handle null dateEcheance', () => {
      const dossier = { ...mockDossierDB, dateEcheance: null };
      const result = mapDossierToUI(dossier);
      expect(result.dateEcheance).toBeUndefined();
    });
  });

  describe('mapDossiersToUI', () => {
    it('should map array of dossiers', () => {
      const dossiers = [
        {
          id: 'dossier-1',
          numero: 'D-2026-001',
          typeDossier: 'TITRE_SEJOUR',
          objet: 'Test 1',
          statut: 'en_cours',
          priorite: 'normale',
          dateCreation: new Date(),
          dateEcheance: null,
          client: { firstName: 'A', lastName: 'B', email: 'a@b.com' },
          _count: { documents: 0, echeances: 0 },
        },
        {
          id: 'dossier-2',
          numero: 'D-2026-002',
          typeDossier: 'NATURALISATION',
          objet: 'Test 2',
          statut: 'termine',
          priorite: 'haute',
          dateCreation: new Date(),
          dateEcheance: new Date(),
          client: { firstName: 'C', lastName: 'D', email: 'c@d.com' },
          _count: { documents: 3, echeances: 1 },
        },
      ];

      const result = mapDossiersToUI(dossiers);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('dossier-1');
      expect(result[1].id).toBe('dossier-2');
    });

    it('should return empty array for empty input', () => {
      const result = mapDossiersToUI([]);
      expect(result).toEqual([]);
    });
  });
});
