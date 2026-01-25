/**
 * Tests pour la recherche
 * Couverture: recherche texte, filtres, tri, facettes
 */

describe('Search', () => {
  describe('Text Search', () => {
    const normalizeSearchText = (text: string): string => {
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
    };

    it('devrait convertir en minuscules', () => {
      expect(normalizeSearchText('HELLO')).toBe('hello');
    });

    it('devrait supprimer les accents', () => {
      expect(normalizeSearchText('éèêë')).toBe('eeee');
    });

    it('devrait supprimer les espaces', () => {
      expect(normalizeSearchText('  test  ')).toBe('test');
    });
  });

  describe('Search Filters', () => {
    interface SearchFilters {
      status?: string[];
      dateFrom?: Date;
      dateTo?: Date;
      type?: string;
      assignedTo?: string;
    }

    const buildFilterQuery = (filters: SearchFilters): string => {
      const parts: string[] = [];
      
      if (filters.status?.length) {
        parts.push(`status:${filters.status.join(',')}`);
      }
      if (filters.dateFrom) {
        parts.push(`from:${filters.dateFrom.toISOString().split('T')[0]}`);
      }
      if (filters.dateTo) {
        parts.push(`to:${filters.dateTo.toISOString().split('T')[0]}`);
      }
      if (filters.type) {
        parts.push(`type:${filters.type}`);
      }
      if (filters.assignedTo) {
        parts.push(`assignee:${filters.assignedTo}`);
      }
      
      return parts.join(' ');
    };

    it('devrait construire un filtre de statut', () => {
      const query = buildFilterQuery({ status: ['pending', 'active'] });
      expect(query).toBe('status:pending,active');
    });

    it('devrait construire un filtre de date', () => {
      const query = buildFilterQuery({ 
        dateFrom: new Date('2024-01-01'),
        dateTo: new Date('2024-12-31')
      });
      expect(query).toContain('from:2024-01-01');
      expect(query).toContain('to:2024-12-31');
    });
  });

  describe('Search Results', () => {
    interface SearchResult<T> {
      items: T[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
      query: string;
    }

    const createSearchResult = <T>(
      items: T[],
      total: number,
      page: number = 1,
      pageSize: number = 10,
      query: string = ''
    ): SearchResult<T> => ({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      query,
    });

    it('devrait calculer le nombre de pages', () => {
      const result = createSearchResult([1, 2, 3], 25, 1, 10);
      expect(result.totalPages).toBe(3);
    });

    it('devrait avoir la query', () => {
      const result = createSearchResult([], 0, 1, 10, 'test');
      expect(result.query).toBe('test');
    });
  });

  describe('Sorting', () => {
    type SortOrder = 'asc' | 'desc';
    
    interface SortOption {
      field: string;
      order: SortOrder;
    }

    const SORT_OPTIONS: SortOption[] = [
      { field: 'createdAt', order: 'desc' },
      { field: 'updatedAt', order: 'desc' },
      { field: 'name', order: 'asc' },
      { field: 'priority', order: 'desc' },
    ];

    const sortItems = <T extends Record<string, any>>(
      items: T[],
      field: keyof T,
      order: SortOrder = 'asc'
    ): T[] => {
      return [...items].sort((a, b) => {
        const valueA = a[field];
        const valueB = b[field];
        
        if (valueA < valueB) return order === 'asc' ? -1 : 1;
        if (valueA > valueB) return order === 'asc' ? 1 : -1;
        return 0;
      });
    };

    it('devrait trier par ordre croissant', () => {
      const items = [{ name: 'C' }, { name: 'A' }, { name: 'B' }];
      const sorted = sortItems(items, 'name', 'asc');
      expect(sorted[0].name).toBe('A');
      expect(sorted[2].name).toBe('C');
    });

    it('devrait trier par ordre décroissant', () => {
      const items = [{ name: 'A' }, { name: 'C' }, { name: 'B' }];
      const sorted = sortItems(items, 'name', 'desc');
      expect(sorted[0].name).toBe('C');
    });
  });

  describe('Facets', () => {
    interface Facet {
      field: string;
      values: { value: string; count: number }[];
    }

    const computeFacets = <T extends Record<string, any>>(
      items: T[],
      fields: string[]
    ): Facet[] => {
      return fields.map(field => {
        const counts: Record<string, number> = {};
        
        items.forEach(item => {
          const value = String(item[field] || 'unknown');
          counts[value] = (counts[value] || 0) + 1;
        });
        
        return {
          field,
          values: Object.entries(counts).map(([value, count]) => ({ value, count })),
        };
      });
    };

    it('devrait calculer les facettes', () => {
      const items = [
        { status: 'active' },
        { status: 'active' },
        { status: 'pending' },
      ];
      const facets = computeFacets(items, ['status']);
      expect(facets).toHaveLength(1);
      expect(facets[0].values.find(v => v.value === 'active')?.count).toBe(2);
    });
  });

  describe('Highlighting', () => {
    const highlightMatch = (text: string, query: string): string => {
      if (!query) return text;
      const regex = new RegExp(`(${query})`, 'gi');
      return text.replace(regex, '<mark>$1</mark>');
    };

    it('devrait mettre en évidence les correspondances', () => {
      const result = highlightMatch('Hello World', 'World');
      expect(result).toBe('Hello <mark>World</mark>');
    });

    it('devrait être insensible à la casse', () => {
      const result = highlightMatch('Hello World', 'world');
      expect(result).toBe('Hello <mark>World</mark>');
    });

    it('devrait retourner le texte original sans query', () => {
      const result = highlightMatch('Hello World', '');
      expect(result).toBe('Hello World');
    });
  });

  describe('Search History', () => {
    interface SearchHistory {
      query: string;
      timestamp: Date;
      resultsCount: number;
    }

    const MAX_HISTORY = 10;

    const addToHistory = (
      history: SearchHistory[],
      entry: SearchHistory
    ): SearchHistory[] => {
      const filtered = history.filter(h => h.query !== entry.query);
      return [entry, ...filtered].slice(0, MAX_HISTORY);
    };

    it('devrait ajouter une nouvelle recherche', () => {
      const history: SearchHistory[] = [];
      const newHistory = addToHistory(history, {
        query: 'test',
        timestamp: new Date(),
        resultsCount: 5,
      });
      expect(newHistory).toHaveLength(1);
    });

    it('devrait limiter à 10 entrées', () => {
      let history: SearchHistory[] = [];
      for (let i = 0; i < 15; i++) {
        history = addToHistory(history, {
          query: `query${i}`,
          timestamp: new Date(),
          resultsCount: i,
        });
      }
      expect(history.length).toBe(MAX_HISTORY);
    });

    it('devrait supprimer les doublons', () => {
      let history: SearchHistory[] = [];
      history = addToHistory(history, { query: 'test', timestamp: new Date(), resultsCount: 5 });
      history = addToHistory(history, { query: 'other', timestamp: new Date(), resultsCount: 3 });
      history = addToHistory(history, { query: 'test', timestamp: new Date(), resultsCount: 10 });
      expect(history.length).toBe(2);
      expect(history[0].query).toBe('test');
    });
  });

  describe('Suggestions', () => {
    const getSuggestions = (query: string, dictionary: string[]): string[] => {
      if (!query) return [];
      const normalized = query.toLowerCase();
      return dictionary
        .filter(word => word.toLowerCase().startsWith(normalized))
        .slice(0, 5);
    };

    it('devrait retourner des suggestions', () => {
      const dictionary = ['apple', 'application', 'banana', 'apply'];
      const suggestions = getSuggestions('app', dictionary);
      expect(suggestions).toHaveLength(3);
      expect(suggestions).toContain('apple');
      expect(suggestions).toContain('application');
      expect(suggestions).toContain('apply');
    });

    it('devrait limiter à 5 suggestions', () => {
      const dictionary = Array.from({ length: 20 }, (_, i) => `test${i}`);
      const suggestions = getSuggestions('test', dictionary);
      expect(suggestions).toHaveLength(5);
    });
  });
});

describe('Advanced Search', () => {
  describe('Boolean Operators', () => {
    const parseQuery = (query: string): { must: string[]; mustNot: string[]; should: string[] } => {
      const must: string[] = [];
      const mustNot: string[] = [];
      const should: string[] = [];
      
      const tokens = query.split(/\s+/);
      let currentOperator = 'must';
      
      for (const token of tokens) {
        if (token === 'AND') {
          currentOperator = 'must';
        } else if (token === 'NOT') {
          currentOperator = 'mustNot';
        } else if (token === 'OR') {
          currentOperator = 'should';
        } else {
          if (currentOperator === 'must') must.push(token);
          else if (currentOperator === 'mustNot') mustNot.push(token);
          else should.push(token);
        }
      }
      
      return { must, mustNot, should };
    };

    it('devrait parser AND', () => {
      const result = parseQuery('apple AND orange');
      expect(result.must).toContain('apple');
      expect(result.must).toContain('orange');
    });

    it('devrait parser NOT', () => {
      const result = parseQuery('apple NOT banana');
      expect(result.must).toContain('apple');
      expect(result.mustNot).toContain('banana');
    });

    it('devrait parser OR', () => {
      const result = parseQuery('apple OR orange');
      expect(result.must).toContain('apple');
      expect(result.should).toContain('orange');
    });
  });
});
