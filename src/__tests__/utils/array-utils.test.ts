/**
 * Tests pour les utilitaires de manipulation de tableaux
 * Couverture: filtrage, tri, groupage, pagination
 */

describe('Array Utils', () => {
  describe('Unique Items', () => {
    const unique = <T>(arr: T[]): T[] => {
      return [...new Set(arr)];
    };

    it('devrait retourner les éléments uniques', () => {
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    });

    it('devrait gérer un tableau vide', () => {
      expect(unique([])).toEqual([]);
    });

    it('devrait gérer les chaînes', () => {
      expect(unique(['a', 'b', 'a'])).toEqual(['a', 'b']);
    });
  });

  describe('Unique By Property', () => {
    const uniqueBy = <T>(arr: T[], key: keyof T): T[] => {
      const seen = new Set();
      return arr.filter((item) => {
        const value = item[key];
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      });
    };

    it('devrait retourner les éléments uniques par clé', () => {
      const items = [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
        { id: 1, name: 'c' },
      ];
      expect(uniqueBy(items, 'id')).toHaveLength(2);
    });
  });

  describe('Group By', () => {
    const groupBy = <T>(arr: T[], key: keyof T): Record<string, T[]> => {
      return arr.reduce((groups, item) => {
        const groupKey = String(item[key]);
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(item);
        return groups;
      }, {} as Record<string, T[]>);
    };

    it('devrait grouper par propriété', () => {
      const items = [
        { type: 'a', value: 1 },
        { type: 'b', value: 2 },
        { type: 'a', value: 3 },
      ];
      const grouped = groupBy(items, 'type');
      expect(grouped.a).toHaveLength(2);
      expect(grouped.b).toHaveLength(1);
    });
  });

  describe('Chunk Array', () => {
    const chunk = <T>(arr: T[], size: number): T[][] => {
      const chunks: T[][] = [];
      for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
      }
      return chunks;
    };

    it('devrait diviser en morceaux égaux', () => {
      expect(chunk([1, 2, 3, 4, 5, 6], 2)).toEqual([[1, 2], [3, 4], [5, 6]]);
    });

    it('devrait gérer le dernier morceau plus petit', () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('devrait gérer un tableau vide', () => {
      expect(chunk([], 2)).toEqual([]);
    });
  });

  describe('Flatten Array', () => {
    const flatten = <T>(arr: (T | T[])[]): T[] => {
      return arr.reduce<T[]>((flat, item) => {
        return flat.concat(Array.isArray(item) ? item : [item]);
      }, []);
    };

    it('devrait aplatir un niveau', () => {
      expect(flatten([[1, 2], [3, 4]])).toEqual([1, 2, 3, 4]);
    });

    it('devrait gérer les éléments mixtes', () => {
      expect(flatten([1, [2, 3], 4])).toEqual([1, 2, 3, 4]);
    });
  });

  describe('Intersection', () => {
    const intersection = <T>(arr1: T[], arr2: T[]): T[] => {
      const set2 = new Set(arr2);
      return arr1.filter((item) => set2.has(item));
    };

    it('devrait retourner les éléments communs', () => {
      expect(intersection([1, 2, 3], [2, 3, 4])).toEqual([2, 3]);
    });

    it('devrait retourner vide sans éléments communs', () => {
      expect(intersection([1, 2], [3, 4])).toEqual([]);
    });
  });

  describe('Difference', () => {
    const difference = <T>(arr1: T[], arr2: T[]): T[] => {
      const set2 = new Set(arr2);
      return arr1.filter((item) => !set2.has(item));
    };

    it('devrait retourner les éléments différents', () => {
      expect(difference([1, 2, 3, 4], [2, 4])).toEqual([1, 3]);
    });

    it('devrait retourner tout si aucun commun', () => {
      expect(difference([1, 2], [3, 4])).toEqual([1, 2]);
    });
  });

  describe('Sort By Property', () => {
    const sortBy = <T>(arr: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] => {
      return [...arr].sort((a, b) => {
        const valA = a[key];
        const valB = b[key];
        
        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
      });
    };

    it('devrait trier par ordre croissant', () => {
      const items = [{ n: 3 }, { n: 1 }, { n: 2 }];
      expect(sortBy(items, 'n')).toEqual([{ n: 1 }, { n: 2 }, { n: 3 }]);
    });

    it('devrait trier par ordre décroissant', () => {
      const items = [{ n: 1 }, { n: 3 }, { n: 2 }];
      expect(sortBy(items, 'n', 'desc')).toEqual([{ n: 3 }, { n: 2 }, { n: 1 }]);
    });
  });

  describe('Paginate Array', () => {
    const paginate = <T>(
      arr: T[],
      page: number,
      pageSize: number
    ): { items: T[]; totalPages: number; currentPage: number } => {
      const totalPages = Math.ceil(arr.length / pageSize);
      const start = (page - 1) * pageSize;
      const items = arr.slice(start, start + pageSize);
      
      return { items, totalPages, currentPage: page };
    };

    it('devrait retourner la première page', () => {
      const result = paginate([1, 2, 3, 4, 5], 1, 2);
      expect(result.items).toEqual([1, 2]);
      expect(result.currentPage).toBe(1);
    });

    it('devrait calculer le nombre de pages', () => {
      const result = paginate([1, 2, 3, 4, 5], 1, 2);
      expect(result.totalPages).toBe(3);
    });

    it('devrait retourner la dernière page', () => {
      const result = paginate([1, 2, 3, 4, 5], 3, 2);
      expect(result.items).toEqual([5]);
    });
  });

  describe('Take and Skip', () => {
    const take = <T>(arr: T[], n: number): T[] => arr.slice(0, n);
    const skip = <T>(arr: T[], n: number): T[] => arr.slice(n);

    it('devrait prendre les n premiers', () => {
      expect(take([1, 2, 3, 4, 5], 3)).toEqual([1, 2, 3]);
    });

    it('devrait sauter les n premiers', () => {
      expect(skip([1, 2, 3, 4, 5], 2)).toEqual([3, 4, 5]);
    });
  });

  describe('Shuffle Array', () => {
    const shuffle = <T>(arr: T[]): T[] => {
      const shuffled = [...arr];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    it('devrait conserver tous les éléments', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffle(original);
      expect(shuffled.sort()).toEqual(original);
    });

    it('devrait retourner une nouvelle référence', () => {
      const original = [1, 2, 3];
      const shuffled = shuffle(original);
      expect(shuffled).not.toBe(original);
    });
  });

  describe('Find With Index', () => {
    const findWithIndex = <T>(
      arr: T[],
      predicate: (item: T) => boolean
    ): { item: T; index: number } | null => {
      const index = arr.findIndex(predicate);
      if (index === -1) return null;
      return { item: arr[index], index };
    };

    it('devrait retourner l\'élément et l\'index', () => {
      const result = findWithIndex([10, 20, 30], (x) => x > 15);
      expect(result).toEqual({ item: 20, index: 1 });
    });

    it('devrait retourner null si non trouvé', () => {
      const result = findWithIndex([1, 2, 3], (x) => x > 10);
      expect(result).toBeNull();
    });
  });

  describe('Count By', () => {
    const countBy = <T>(arr: T[], key: keyof T): Record<string, number> => {
      return arr.reduce((counts, item) => {
        const groupKey = String(item[key]);
        counts[groupKey] = (counts[groupKey] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);
    };

    it('devrait compter par propriété', () => {
      const items = [
        { type: 'a' },
        { type: 'b' },
        { type: 'a' },
        { type: 'a' },
      ];
      expect(countBy(items, 'type')).toEqual({ a: 3, b: 1 });
    });
  });

  describe('Sum By', () => {
    const sumBy = <T>(arr: T[], key: keyof T): number => {
      return arr.reduce((sum, item) => sum + Number(item[key]), 0);
    };

    it('devrait additionner par propriété', () => {
      const items = [{ value: 10 }, { value: 20 }, { value: 30 }];
      expect(sumBy(items, 'value')).toBe(60);
    });
  });

  describe('Average By', () => {
    const avgBy = <T>(arr: T[], key: keyof T): number => {
      if (arr.length === 0) return 0;
      const sum = arr.reduce((acc, item) => acc + Number(item[key]), 0);
      return sum / arr.length;
    };

    it('devrait calculer la moyenne', () => {
      const items = [{ value: 10 }, { value: 20 }, { value: 30 }];
      expect(avgBy(items, 'value')).toBe(20);
    });

    it('devrait retourner 0 pour un tableau vide', () => {
      expect(avgBy([], 'value' as never)).toBe(0);
    });
  });

  describe('Min/Max By', () => {
    const minBy = <T>(arr: T[], key: keyof T): T | null => {
      if (arr.length === 0) return null;
      return arr.reduce((min, item) => (item[key] < min[key] ? item : min));
    };

    const maxBy = <T>(arr: T[], key: keyof T): T | null => {
      if (arr.length === 0) return null;
      return arr.reduce((max, item) => (item[key] > max[key] ? item : max));
    };

    it('devrait trouver le minimum', () => {
      const items = [{ n: 5 }, { n: 2 }, { n: 8 }];
      expect(minBy(items, 'n')).toEqual({ n: 2 });
    });

    it('devrait trouver le maximum', () => {
      const items = [{ n: 5 }, { n: 2 }, { n: 8 }];
      expect(maxBy(items, 'n')).toEqual({ n: 8 });
    });
  });

  describe('Partition', () => {
    const partition = <T>(arr: T[], predicate: (item: T) => boolean): [T[], T[]] => {
      const truthy: T[] = [];
      const falsy: T[] = [];
      arr.forEach((item) => {
        if (predicate(item)) {
          truthy.push(item);
        } else {
          falsy.push(item);
        }
      });
      return [truthy, falsy];
    };

    it('devrait partitionner selon le prédicat', () => {
      const [even, odd] = partition([1, 2, 3, 4, 5], (n) => n % 2 === 0);
      expect(even).toEqual([2, 4]);
      expect(odd).toEqual([1, 3, 5]);
    });
  });

  describe('Range Generation', () => {
    const range = (start: number, end: number, step: number = 1): number[] => {
      const result: number[] = [];
      for (let i = start; i < end; i += step) {
        result.push(i);
      }
      return result;
    };

    it('devrait générer une plage simple', () => {
      expect(range(0, 5)).toEqual([0, 1, 2, 3, 4]);
    });

    it('devrait respecter le pas', () => {
      expect(range(0, 10, 2)).toEqual([0, 2, 4, 6, 8]);
    });

    it('devrait gérer un début différent', () => {
      expect(range(5, 10)).toEqual([5, 6, 7, 8, 9]);
    });
  });

  describe('First and Last', () => {
    const first = <T>(arr: T[]): T | undefined => arr[0];
    const last = <T>(arr: T[]): T | undefined => arr[arr.length - 1];

    it('devrait retourner le premier élément', () => {
      expect(first([1, 2, 3])).toBe(1);
    });

    it('devrait retourner le dernier élément', () => {
      expect(last([1, 2, 3])).toBe(3);
    });

    it('devrait retourner undefined pour un tableau vide', () => {
      expect(first([])).toBeUndefined();
      expect(last([])).toBeUndefined();
    });
  });
});
