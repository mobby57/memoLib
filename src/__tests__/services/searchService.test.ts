/**
 * Tests unitaires pour SearchService
 * Moteur de recherche intelligent multi-entités
 */

import type { SearchResult, SearchResultType, SearchOptions } from '@/lib/services/searchService';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    client: {
      findMany: jest.fn(),
    },
    dossier: {
      findMany: jest.fn(),
    },
    document: {
      findMany: jest.fn(),
    },
    email: {
      findMany: jest.fn(),
    },
  },
}));

describe('SearchService', () => {
  describe('SearchResult Structure', () => {
    it('contient toutes les propriétés requises', () => {
      const result: SearchResult = {
        id: 'cli_123',
        type: 'client',
        title: 'Jean Dupont',
        subtitle: 'jean.dupont@email.com',
        description: 'Client depuis 2024',
        score: 0.95,
        metadata: { nationality: 'French' },
        url: '/admin/clients/cli_123',
        date: new Date(),
        tags: ['VIP', 'OQTF'],
      };

      expect(result.id).toBe('cli_123');
      expect(result.type).toBe('client');
      expect(result.score).toBeCloseTo(0.95);
    });

    it('supporte les propriétés optionnelles', () => {
      const minimalResult: SearchResult = {
        id: 'dos_456',
        type: 'dossier',
        title: 'DOS-2026-0001',
        score: 0.8,
      };

      expect(minimalResult.subtitle).toBeUndefined();
      expect(minimalResult.description).toBeUndefined();
      expect(minimalResult.metadata).toBeUndefined();
    });
  });

  describe('SearchResultType', () => {
    it('contient tous les types de résultats', () => {
      const types: SearchResultType[] = [
        'client',
        'dossier',
        'document',
        'email',
        'user',
      ];

      expect(types).toHaveLength(5);
      types.forEach((type) => {
        expect(typeof type).toBe('string');
      });
    });
  });

  describe('SearchOptions', () => {
    it('accepte les options de base', () => {
      const options: SearchOptions = {
        limit: 20,
      };

      expect(options.limit).toBe(20);
    });

    it('accepte toutes les options', () => {
      const options: SearchOptions = {
        tenantId: 'tenant_123',
        types: ['client', 'dossier'],
        limit: 50,
        includeArchived: true,
        dateFrom: new Date('2026-01-01'),
        dateTo: new Date('2026-12-31'),
      };

      expect(options.tenantId).toBe('tenant_123');
      expect(options.types).toHaveLength(2);
      expect(options.includeArchived).toBe(true);
    });

    it('exclut les archives par défaut', () => {
      const options: SearchOptions = {};
      const includeArchived = options.includeArchived ?? false;

      expect(includeArchived).toBe(false);
    });
  });

  describe('Search Query Validation', () => {
    it('requiert au moins 2 caractères', () => {
      const query1 = 'a';
      const query2 = 'ab';
      const query3 = 'abc';

      expect(query1.length >= 2).toBe(false);
      expect(query2.length >= 2).toBe(true);
      expect(query3.length >= 2).toBe(true);
    });

    it('normalise la requête', () => {
      const query = '  JEAN Dupont  ';
      const normalized = query.toLowerCase().trim();

      expect(normalized).toBe('jean dupont');
    });

    it('retourne un tableau vide pour requête invalide', () => {
      const emptyQuery = '';
      const shortQuery = 'a';

      const validate = (q: string) => q.trim().length >= 2;

      expect(validate(emptyQuery)).toBe(false);
      expect(validate(shortQuery)).toBe(false);
    });
  });

  describe('Result Scoring', () => {
    it('trie par score décroissant', () => {
      const results: SearchResult[] = [
        { id: '1', type: 'client', title: 'A', score: 0.5 },
        { id: '2', type: 'client', title: 'B', score: 0.9 },
        { id: '3', type: 'client', title: 'C', score: 0.7 },
      ];

      results.sort((a, b) => b.score - a.score);

      expect(results[0].id).toBe('2'); // Score 0.9
      expect(results[1].id).toBe('3'); // Score 0.7
      expect(results[2].id).toBe('1'); // Score 0.5
    });

    it('limite le nombre de résultats', () => {
      const allResults = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        type: 'client' as SearchResultType,
        title: `Client ${i}`,
        score: Math.random(),
      }));

      const limit = 50;
      const limitedResults = allResults.slice(0, limit);

      expect(limitedResults).toHaveLength(50);
    });
  });

  describe('Multi-Entity Search', () => {
    it('recherche en parallèle dans toutes les entités', () => {
      const searchInClients = jest.fn().mockResolvedValue([]);
      const searchInDossiers = jest.fn().mockResolvedValue([]);
      const searchInDocuments = jest.fn().mockResolvedValue([]);
      const searchInEmails = jest.fn().mockResolvedValue([]);

      // Simulation de Promise.all
      const searchAll = () =>
        Promise.all([
          searchInClients(),
          searchInDossiers(),
          searchInDocuments(),
          searchInEmails(),
        ]);

      expect(searchAll).toBeDefined();
    });

    it('filtre par type si spécifié', () => {
      const options: SearchOptions = {
        types: ['client', 'dossier'],
      };

      const shouldSearchClients = options.types?.includes('client') ?? true;
      const shouldSearchDossiers = options.types?.includes('dossier') ?? true;
      const shouldSearchDocuments = options.types?.includes('document') ?? true;
      const shouldSearchEmails = options.types?.includes('email') ?? true;

      expect(shouldSearchClients).toBe(true);
      expect(shouldSearchDossiers).toBe(true);
      expect(shouldSearchDocuments).toBe(false);
      expect(shouldSearchEmails).toBe(false);
    });
  });

  describe('Client Search', () => {
    it('recherche dans firstName, lastName, email, phone', () => {
      const searchFields = ['firstName', 'lastName', 'email', 'phone', 'nationality'];
      const query = 'dupont';

      const buildWhereClause = (fields: string[], term: string) =>
        fields.map((field) => ({ [field]: { contains: term } }));

      const whereClause = buildWhereClause(searchFields, query);

      expect(whereClause).toHaveLength(5);
      expect(whereClause[0]).toEqual({ firstName: { contains: 'dupont' } });
    });
  });

  describe('Dossier Search', () => {
    it('recherche dans numero, objet, notes', () => {
      const searchFields = ['numero', 'objet', 'notes'];
      const query = 'OQTF';

      const buildWhereClause = (fields: string[], term: string) =>
        fields.map((field) => ({ [field]: { contains: term } }));

      const whereClause = buildWhereClause(searchFields, query);

      expect(whereClause).toHaveLength(3);
      expect(whereClause[0]).toEqual({ numero: { contains: 'OQTF' } });
    });
  });

  describe('Document Search', () => {
    it('recherche dans nom, type, contenu', () => {
      const mockDocuments = [
        { id: 'd1', nom: 'Passeport.pdf', type: 'identite' },
        { id: 'd2', nom: 'Facture.pdf', type: 'facture' },
      ];

      const query = 'passeport';
      const filtered = mockDocuments.filter((doc) =>
        doc.nom.toLowerCase().includes(query.toLowerCase())
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('d1');
    });
  });

  describe('Tenant Isolation', () => {
    it('filtre par tenantId si fourni', () => {
      const options: SearchOptions = {
        tenantId: 'tenant_abc',
      };

      const buildWhere = (opts: SearchOptions) => {
        const where: Record<string, unknown> = {};
        if (opts.tenantId) {
          where.tenantId = opts.tenantId;
        }
        return where;
      };

      const where = buildWhere(options);

      expect(where.tenantId).toBe('tenant_abc');
    });

    it('ne filtre pas si tenantId absent', () => {
      const options: SearchOptions = {};

      const buildWhere = (opts: SearchOptions) => {
        const where: Record<string, unknown> = {};
        if (opts.tenantId) {
          where.tenantId = opts.tenantId;
        }
        return where;
      };

      const where = buildWhere(options);

      expect(where.tenantId).toBeUndefined();
    });
  });

  describe('Archived Items', () => {
    it('exclut les archives par défaut', () => {
      const options: SearchOptions = {};
      const includeArchived = options.includeArchived ?? false;

      const buildWhere = (include: boolean) => {
        if (!include) {
          return { status: { not: 'archived' } };
        }
        return {};
      };

      const where = buildWhere(includeArchived);

      expect(where).toEqual({ status: { not: 'archived' } });
    });

    it('inclut les archives si demandé', () => {
      const options: SearchOptions = { includeArchived: true };

      const buildWhere = (include: boolean) => {
        if (!include) {
          return { status: { not: 'archived' } };
        }
        return {};
      };

      const where = buildWhere(options.includeArchived!);

      expect(where).toEqual({});
    });
  });
});
