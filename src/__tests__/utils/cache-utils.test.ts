/**
 * Tests pour les utilitaires de cache et memoization
 * Couverture: LRU cache, TTL cache, memoization
 */

describe('Cache Utils', () => {
  describe('Simple Cache', () => {
    const createCache = <K, V>() => {
      const cache = new Map<K, V>();
      
      return {
        get: (key: K): V | undefined => cache.get(key),
        set: (key: K, value: V): void => { cache.set(key, value); },
        has: (key: K): boolean => cache.has(key),
        delete: (key: K): boolean => cache.delete(key),
        clear: (): void => cache.clear(),
        size: (): number => cache.size,
      };
    };

    it('devrait stocker et récupérer des valeurs', () => {
      const cache = createCache<string, number>();
      cache.set('a', 1);
      expect(cache.get('a')).toBe(1);
    });

    it('devrait retourner undefined pour clé inexistante', () => {
      const cache = createCache<string, number>();
      expect(cache.get('unknown')).toBeUndefined();
    });

    it('devrait vérifier l\'existence d\'une clé', () => {
      const cache = createCache<string, number>();
      cache.set('a', 1);
      expect(cache.has('a')).toBe(true);
      expect(cache.has('b')).toBe(false);
    });

    it('devrait supprimer une clé', () => {
      const cache = createCache<string, number>();
      cache.set('a', 1);
      cache.delete('a');
      expect(cache.has('a')).toBe(false);
    });

    it('devrait vider le cache', () => {
      const cache = createCache<string, number>();
      cache.set('a', 1);
      cache.set('b', 2);
      cache.clear();
      expect(cache.size()).toBe(0);
    });
  });

  describe('LRU Cache', () => {
    const createLRUCache = <K, V>(maxSize: number) => {
      const cache = new Map<K, V>();
      
      return {
        get: (key: K): V | undefined => {
          const value = cache.get(key);
          if (value !== undefined) {
            // Move to end (most recently used)
            cache.delete(key);
            cache.set(key, value);
          }
          return value;
        },
        set: (key: K, value: V): void => {
          if (cache.has(key)) {
            cache.delete(key);
          } else if (cache.size >= maxSize) {
            // Remove oldest (first item)
            const firstKey = cache.keys().next().value;
            if (firstKey !== undefined) {
              cache.delete(firstKey);
            }
          }
          cache.set(key, value);
        },
        size: (): number => cache.size,
      };
    };

    it('devrait respecter la taille maximale', () => {
      const cache = createLRUCache<string, number>(2);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      expect(cache.size()).toBe(2);
      expect(cache.get('a')).toBeUndefined();
    });

    it('devrait garder les éléments récemment utilisés', () => {
      const cache = createLRUCache<string, number>(2);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.get('a'); // Access a, making it most recently used
      cache.set('c', 3); // Should evict b
      expect(cache.get('a')).toBe(1);
      expect(cache.get('b')).toBeUndefined();
    });
  });

  describe('TTL Cache', () => {
    const createTTLCache = <K, V>(defaultTTL: number) => {
      const cache = new Map<K, { value: V; expiry: number }>();
      
      return {
        get: (key: K): V | undefined => {
          const item = cache.get(key);
          if (!item) return undefined;
          if (Date.now() > item.expiry) {
            cache.delete(key);
            return undefined;
          }
          return item.value;
        },
        set: (key: K, value: V, ttl: number = defaultTTL): void => {
          cache.set(key, { value, expiry: Date.now() + ttl });
        },
        has: (key: K): boolean => {
          const value = cache.get(key);
          if (!value) return false;
          if (Date.now() > value.expiry) {
            cache.delete(key);
            return false;
          }
          return true;
        },
      };
    };

    it('devrait stocker avec TTL', () => {
      const cache = createTTLCache<string, number>(1000);
      cache.set('a', 1);
      expect(cache.get('a')).toBe(1);
    });

    it('devrait expirer après TTL', () => {
      jest.useFakeTimers();
      const cache = createTTLCache<string, number>(100);
      cache.set('a', 1);
      
      jest.advanceTimersByTime(50);
      expect(cache.get('a')).toBe(1);
      
      jest.advanceTimersByTime(100);
      expect(cache.get('a')).toBeUndefined();
      
      jest.useRealTimers();
    });
  });

  describe('Memoization', () => {
    const memoize = <T extends (...args: unknown[]) => unknown>(fn: T): T => {
      const cache = new Map<string, ReturnType<T>>();
      
      return ((...args: Parameters<T>): ReturnType<T> => {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
          return cache.get(key)!;
        }
        const result = fn(...args) as ReturnType<T>;
        cache.set(key, result);
        return result;
      }) as T;
    };

    it('devrait mémoriser les résultats', () => {
      let callCount = 0;
      const expensive = (n: number) => {
        callCount++;
        return n * 2;
      };
      
      const memoized = memoize(expensive);
      
      expect(memoized(5)).toBe(10);
      expect(memoized(5)).toBe(10);
      expect(callCount).toBe(1);
    });

    it('devrait différencier les arguments', () => {
      let callCount = 0;
      const fn = (a: number, b: number) => {
        callCount++;
        return a + b;
      };
      
      const memoized = memoize(fn);
      
      expect(memoized(1, 2)).toBe(3);
      expect(memoized(2, 1)).toBe(3);
      expect(callCount).toBe(2);
    });
  });

  describe('Cache Statistics', () => {
    const createCacheWithStats = <K, V>() => {
      const cache = new Map<K, V>();
      let hits = 0;
      let misses = 0;
      
      return {
        get: (key: K): V | undefined => {
          if (cache.has(key)) {
            hits++;
            return cache.get(key);
          }
          misses++;
          return undefined;
        },
        set: (key: K, value: V): void => { cache.set(key, value); },
        stats: () => ({ hits, misses, hitRate: hits / (hits + misses) || 0 }),
        resetStats: () => { hits = 0; misses = 0; },
      };
    };

    it('devrait tracker les hits et misses', () => {
      const cache = createCacheWithStats<string, number>();
      cache.set('a', 1);
      
      cache.get('a'); // hit
      cache.get('b'); // miss
      cache.get('a'); // hit
      
      const stats = cache.stats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
    });

    it('devrait calculer le hit rate', () => {
      const cache = createCacheWithStats<string, number>();
      cache.set('a', 1);
      
      cache.get('a');
      cache.get('a');
      cache.get('b');
      
      expect(cache.stats().hitRate).toBeCloseTo(0.67, 1);
    });
  });

  describe('Multi-Level Cache', () => {
    const createMultiLevelCache = <K, V>(l1Size: number) => {
      const l1 = new Map<K, V>();
      const l2 = new Map<K, V>();
      
      return {
        get: (key: K): V | undefined => {
          if (l1.has(key)) return l1.get(key);
          if (l2.has(key)) {
            const value = l2.get(key)!;
            // Promote to L1
            if (l1.size >= l1Size) {
              const firstKey = l1.keys().next().value;
              if (firstKey !== undefined) l1.delete(firstKey);
            }
            l1.set(key, value);
            return value;
          }
          return undefined;
        },
        set: (key: K, value: V): void => {
          l1.set(key, value);
          l2.set(key, value);
          if (l1.size > l1Size) {
            const firstKey = l1.keys().next().value;
            if (firstKey !== undefined) l1.delete(firstKey);
          }
        },
      };
    };

    it('devrait stocker dans les deux niveaux', () => {
      const cache = createMultiLevelCache<string, number>(2);
      cache.set('a', 1);
      expect(cache.get('a')).toBe(1);
    });
  });

  describe('Cache Key Generation', () => {
    const generateCacheKey = (...parts: unknown[]): string => {
      return parts
        .map((part) => {
          if (typeof part === 'object') return JSON.stringify(part);
          return String(part);
        })
        .join(':');
    };

    it('devrait générer une clé depuis des primitives', () => {
      expect(generateCacheKey('user', 123)).toBe('user:123');
    });

    it('devrait gérer les objets', () => {
      const key = generateCacheKey('query', { page: 1 });
      expect(key).toContain('query');
      expect(key).toContain('page');
    });
  });

  describe('Cache Warming', () => {
    const warmCache = <K, V>(
      cache: { set: (key: K, value: V) => void },
      data: Array<{ key: K; value: V }>
    ): number => {
      let count = 0;
      data.forEach(({ key, value }) => {
        cache.set(key, value);
        count++;
      });
      return count;
    };

    it('devrait pré-remplir le cache', () => {
      const cache = new Map<string, number>();
      const mockCache = {
        set: (key: string, value: number) => cache.set(key, value),
      };
      
      const count = warmCache(mockCache, [
        { key: 'a', value: 1 },
        { key: 'b', value: 2 },
      ]);
      
      expect(count).toBe(2);
      expect(cache.size).toBe(2);
    });
  });

  describe('Async Cache', () => {
    const createAsyncCache = <K, V>() => {
      const cache = new Map<K, Promise<V>>();
      
      return {
        getOrSet: async (key: K, factory: () => Promise<V>): Promise<V> => {
          if (cache.has(key)) {
            return cache.get(key)!;
          }
          const promise = factory();
          cache.set(key, promise);
          return promise;
        },
      };
    };

    it('devrait éviter les appels redondants', async () => {
      let callCount = 0;
      const cache = createAsyncCache<string, number>();
      
      const factory = async () => {
        callCount++;
        return 42;
      };
      
      const [result1, result2] = await Promise.all([
        cache.getOrSet('key', factory),
        cache.getOrSet('key', factory),
      ]);
      
      expect(result1).toBe(42);
      expect(result2).toBe(42);
      expect(callCount).toBe(1);
    });
  });

  describe('Cache Invalidation', () => {
    const createInvalidatingCache = <K, V>() => {
      const cache = new Map<K, V>();
      const tags = new Map<string, Set<K>>();
      
      return {
        set: (key: K, value: V, itemTags: string[] = []): void => {
          cache.set(key, value);
          itemTags.forEach((tag) => {
            if (!tags.has(tag)) tags.set(tag, new Set());
            tags.get(tag)!.add(key);
          });
        },
        get: (key: K): V | undefined => cache.get(key),
        invalidateByTag: (tag: string): number => {
          const keys = tags.get(tag);
          if (!keys) return 0;
          let count = 0;
          keys.forEach((key) => {
            cache.delete(key);
            count++;
          });
          tags.delete(tag);
          return count;
        },
      };
    };

    it('devrait invalider par tag', () => {
      const cache = createInvalidatingCache<string, number>();
      cache.set('user:1', 100, ['users']);
      cache.set('user:2', 200, ['users']);
      cache.set('post:1', 1, ['posts']);
      
      const invalidated = cache.invalidateByTag('users');
      
      expect(invalidated).toBe(2);
      expect(cache.get('user:1')).toBeUndefined();
      expect(cache.get('post:1')).toBe(1);
    });
  });
});
