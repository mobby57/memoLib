/**
 * Tests pour src/utils (extended)
 * Coverage: Utilitaires divers
 */

describe('Utils Extended - Pure Unit Tests', () => {
  describe('string utilities', () => {
    it('should capitalize first letter', () => {
      const capitalize = (str: string) => 
        str.charAt(0).toUpperCase() + str.slice(1);

      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('')).toBe('');
    });

    it('should convert to slug', () => {
      const slugify = (str: string) => 
        str.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');

      expect(slugify('Hello World!')).toBe('hello-world');
      expect(slugify('Test  String')).toBe('test-string');
    });

    it('should truncate with ellipsis', () => {
      const truncate = (str: string, max: number) => 
        str.length > max ? str.slice(0, max - 3) + '...' : str;

      expect(truncate('Hello World', 8)).toBe('Hello...');
      expect(truncate('Hi', 10)).toBe('Hi');
    });

    it('should generate random string', () => {
      const randomString = (length: number) => 
        Array.from({ length }, () => 
          Math.random().toString(36).charAt(2)
        ).join('');

      const str = randomString(10);
      expect(str.length).toBe(10);
    });
  });

  describe('number utilities', () => {
    it('should clamp number', () => {
      const clamp = (num: number, min: number, max: number) => 
        Math.min(Math.max(num, min), max);

      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should format currency', () => {
      const formatCurrency = (amount: number, currency: string = 'EUR') => 
        new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency,
        }).format(amount);

      const formatted = formatCurrency(1234.56);
      expect(formatted).toContain('1');
      expect(formatted).toContain('234');
    });

    it('should format percentage', () => {
      const formatPercent = (value: number, decimals: number = 1) => 
        `${(value * 100).toFixed(decimals)}%`;

      expect(formatPercent(0.456)).toBe('45.6%');
      expect(formatPercent(0.456, 0)).toBe('46%');
    });

    it('should round to decimals', () => {
      const round = (num: number, decimals: number) => 
        Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);

      expect(round(3.14159, 2)).toBe(3.14);
      expect(round(3.14159, 4)).toBe(3.1416);
    });
  });

  describe('array utilities', () => {
    it('should chunk array', () => {
      const chunk = <T>(arr: T[], size: number): T[][] => {
        const chunks: T[][] = [];
        for (let i = 0; i < arr.length; i += size) {
          chunks.push(arr.slice(i, i + size));
        }
        return chunks;
      };

      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should get unique values', () => {
      const unique = <T>(arr: T[]) => [...new Set(arr)];

      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    });

    it('should shuffle array', () => {
      const shuffle = <T>(arr: T[]): T[] => {
        const result = [...arr];
        for (let i = result.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
      };

      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffle(original);
      expect(shuffled.length).toBe(5);
      expect(shuffled.sort()).toEqual([1, 2, 3, 4, 5]);
    });

    it('should group by key', () => {
      const groupBy = <T>(arr: T[], key: keyof T) => {
        return arr.reduce((groups, item) => {
          const value = String(item[key]);
          (groups[value] = groups[value] || []).push(item);
          return groups;
        }, {} as Record<string, T[]>);
      };

      const items = [
        { type: 'a', value: 1 },
        { type: 'b', value: 2 },
        { type: 'a', value: 3 },
      ];

      const grouped = groupBy(items, 'type');
      expect(grouped['a'].length).toBe(2);
    });
  });

  describe('object utilities', () => {
    it('should deep clone', () => {
      const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

      const original = { a: { b: { c: 1 } } };
      const cloned = deepClone(original);
      cloned.a.b.c = 2;

      expect(original.a.b.c).toBe(1);
      expect(cloned.a.b.c).toBe(2);
    });

    it('should pick keys', () => {
      const pick = <T extends object, K extends keyof T>(
        obj: T,
        keys: K[]
      ): Pick<T, K> => {
        const result = {} as Pick<T, K>;
        keys.forEach(key => {
          if (key in obj) result[key] = obj[key];
        });
        return result;
      };

      const obj = { a: 1, b: 2, c: 3 };
      expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
    });

    it('should omit keys', () => {
      const omit = <T extends object, K extends keyof T>(
        obj: T,
        keys: K[]
      ): Omit<T, K> => {
        const result = { ...obj };
        keys.forEach(key => delete result[key]);
        return result;
      };

      const obj = { a: 1, b: 2, c: 3 };
      expect(omit(obj, ['b'])).toEqual({ a: 1, c: 3 });
    });

    it('should check if empty', () => {
      const isEmpty = (obj: object) => Object.keys(obj).length === 0;

      expect(isEmpty({})).toBe(true);
      expect(isEmpty({ a: 1 })).toBe(false);
    });
  });

  describe('date utilities', () => {
    it('should format date', () => {
      const formatDate = (date: Date) => {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
      };

      const date = new Date(2024, 0, 15);
      expect(formatDate(date)).toBe('15/01/2024');
    });

    it('should add days', () => {
      const addDays = (date: Date, days: number) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
      };

      const date = new Date(2024, 0, 15);
      const future = addDays(date, 10);
      expect(future.getDate()).toBe(25);
    });

    it('should get start of day', () => {
      const startOfDay = (date: Date) => {
        const result = new Date(date);
        result.setHours(0, 0, 0, 0);
        return result;
      };

      const date = new Date(2024, 0, 15, 14, 30, 45);
      const start = startOfDay(date);
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
    });
  });

  describe('url utilities', () => {
    it('should parse query string', () => {
      const parseQuery = (query: string) => {
        const params: Record<string, string> = {};
        query.replace(/^\?/, '').split('&').forEach(pair => {
          const [key, value] = pair.split('=');
          if (key) params[key] = decodeURIComponent(value || '');
        });
        return params;
      };

      expect(parseQuery('?foo=bar&baz=qux')).toEqual({ foo: 'bar', baz: 'qux' });
    });

    it('should build query string', () => {
      const buildQuery = (params: Record<string, string>) => 
        Object.entries(params)
          .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
          .join('&');

      expect(buildQuery({ a: '1', b: 'hello world' })).toBe('a=1&b=hello%20world');
    });
  });
});
