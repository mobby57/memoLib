/**
 * Tests pour les utilitaires de manipulation d'objets
 * Couverture: deep clone, merge, pick, omit, transform
 */

describe('Object Utils', () => {
  describe('Deep Clone', () => {
    const deepClone = <T>(obj: T): T => {
      return JSON.parse(JSON.stringify(obj));
    };

    it('devrait créer une copie indépendante', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);
      cloned.b.c = 999;
      expect(original.b.c).toBe(2);
    });

    it('devrait cloner les tableaux', () => {
      const original = { arr: [1, 2, 3] };
      const cloned = deepClone(original);
      cloned.arr.push(4);
      expect(original.arr).toEqual([1, 2, 3]);
    });

    it('devrait gérer null', () => {
      expect(deepClone(null)).toBeNull();
    });
  });

  describe('Shallow Merge', () => {
    const shallowMerge = <T extends object>(target: T, source: Partial<T>): T => {
      return { ...target, ...source };
    };

    it('devrait fusionner les propriétés', () => {
      const result = shallowMerge({ a: 1, b: 2 }, { b: 3, c: 4 } as { b?: number; c?: number });
      expect(result).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('devrait ne pas modifier l\'original', () => {
      const original = { a: 1 };
      shallowMerge(original, { a: 2 });
      expect(original.a).toBe(1);
    });
  });

  describe('Deep Merge', () => {
    const deepMerge = <T extends Record<string, unknown>>(
      target: T,
      source: Partial<T>
    ): T => {
      const result = { ...target };
      
      for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          const sourceValue = source[key];
          const targetValue = result[key];
          
          if (
            sourceValue &&
            typeof sourceValue === 'object' &&
            !Array.isArray(sourceValue) &&
            targetValue &&
            typeof targetValue === 'object' &&
            !Array.isArray(targetValue)
          ) {
            result[key] = deepMerge(
              targetValue as Record<string, unknown>,
              sourceValue as Record<string, unknown>
            ) as T[Extract<keyof T, string>];
          } else {
            result[key] = sourceValue as T[Extract<keyof T, string>];
          }
        }
      }
      
      return result;
    };

    it('devrait fusionner les objets imbriqués', () => {
      const target = { a: { b: 1, c: 2 } };
      const source = { a: { c: 3 } };
      const result = deepMerge(target, source);
      expect(result).toEqual({ a: { b: 1, c: 3 } });
    });
  });

  describe('Pick Properties', () => {
    const pick = <T extends object, K extends keyof T>(
      obj: T,
      keys: K[]
    ): Pick<T, K> => {
      const result = {} as Pick<T, K>;
      keys.forEach((key) => {
        if (key in obj) {
          result[key] = obj[key];
        }
      });
      return result;
    };

    it('devrait sélectionner les propriétés spécifiées', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
    });

    it('devrait ignorer les clés inexistantes', () => {
      const obj = { a: 1 };
      expect(pick(obj, ['a', 'b' as keyof typeof obj])).toEqual({ a: 1 });
    });
  });

  describe('Omit Properties', () => {
    const omit = <T extends object, K extends keyof T>(
      obj: T,
      keys: K[]
    ): Omit<T, K> => {
      const result = { ...obj };
      keys.forEach((key) => {
        delete result[key];
      });
      return result;
    };

    it('devrait exclure les propriétés spécifiées', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(omit(obj, ['b'])).toEqual({ a: 1, c: 3 });
    });
  });

  describe('Get Nested Value', () => {
    const get = (obj: Record<string, unknown>, path: string, defaultValue?: unknown): unknown => {
      const keys = path.split('.');
      let result: unknown = obj;
      
      for (const key of keys) {
        if (result === null || result === undefined) {
          return defaultValue;
        }
        result = (result as Record<string, unknown>)[key];
      }
      
      return result ?? defaultValue;
    };

    it('devrait accéder aux propriétés imbriquées', () => {
      const obj = { a: { b: { c: 42 } } };
      expect(get(obj, 'a.b.c')).toBe(42);
    });

    it('devrait retourner la valeur par défaut si non trouvé', () => {
      const obj = { a: 1 };
      expect(get(obj, 'b.c', 'default')).toBe('default');
    });

    it('devrait gérer undefined', () => {
      const obj = { a: undefined };
      expect(get(obj, 'a', 'default')).toBe('default');
    });
  });

  describe('Set Nested Value', () => {
    const set = (
      obj: Record<string, unknown>,
      path: string,
      value: unknown
    ): Record<string, unknown> => {
      const keys = path.split('.');
      const result = { ...obj };
      let current: Record<string, unknown> = result;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current) || typeof current[key] !== 'object') {
          current[key] = {};
        } else {
          current[key] = { ...(current[key] as Record<string, unknown>) };
        }
        current = current[key] as Record<string, unknown>;
      }
      
      current[keys[keys.length - 1]] = value;
      return result;
    };

    it('devrait définir une propriété imbriquée', () => {
      const obj = { a: { b: 1 } };
      const result = set(obj, 'a.c', 2);
      expect(result).toEqual({ a: { b: 1, c: 2 } });
    });

    it('devrait créer le chemin si nécessaire', () => {
      const obj = {};
      const result = set(obj, 'a.b.c', 42);
      expect(result).toEqual({ a: { b: { c: 42 } } });
    });
  });

  describe('Has Property', () => {
    const has = (obj: Record<string, unknown>, path: string): boolean => {
      const keys = path.split('.');
      let current: unknown = obj;
      
      for (const key of keys) {
        if (
          current === null ||
          current === undefined ||
          typeof current !== 'object'
        ) {
          return false;
        }
        if (!(key in (current as Record<string, unknown>))) {
          return false;
        }
        current = (current as Record<string, unknown>)[key];
      }
      
      return true;
    };

    it('devrait détecter une propriété existante', () => {
      const obj = { a: { b: 1 } };
      expect(has(obj, 'a.b')).toBe(true);
    });

    it('devrait retourner false pour propriété inexistante', () => {
      const obj = { a: 1 };
      expect(has(obj, 'b')).toBe(false);
    });
  });

  describe('Object Keys/Values/Entries', () => {
    it('devrait retourner les clés', () => {
      const obj = { a: 1, b: 2 };
      expect(Object.keys(obj)).toEqual(['a', 'b']);
    });

    it('devrait retourner les valeurs', () => {
      const obj = { a: 1, b: 2 };
      expect(Object.values(obj)).toEqual([1, 2]);
    });

    it('devrait retourner les entrées', () => {
      const obj = { a: 1, b: 2 };
      expect(Object.entries(obj)).toEqual([['a', 1], ['b', 2]]);
    });
  });

  describe('Is Empty Object', () => {
    const isEmpty = (obj: object): boolean => {
      return Object.keys(obj).length === 0;
    };

    it('devrait détecter un objet vide', () => {
      expect(isEmpty({})).toBe(true);
    });

    it('devrait détecter un objet non vide', () => {
      expect(isEmpty({ a: 1 })).toBe(false);
    });
  });

  describe('Object From Entries', () => {
    const fromEntries = <K extends string, V>(
      entries: [K, V][]
    ): Record<K, V> => {
      return Object.fromEntries(entries) as Record<K, V>;
    };

    it('devrait créer un objet depuis les entrées', () => {
      const entries: [string, number][] = [['a', 1], ['b', 2]];
      expect(fromEntries(entries)).toEqual({ a: 1, b: 2 });
    });
  });

  describe('Invert Object', () => {
    const invert = (obj: Record<string, string>): Record<string, string> => {
      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [value, key])
      );
    };

    it('devrait inverser clés et valeurs', () => {
      expect(invert({ a: 'x', b: 'y' })).toEqual({ x: 'a', y: 'b' });
    });
  });

  describe('Map Object Values', () => {
    const mapValues = <T, U>(
      obj: Record<string, T>,
      fn: (value: T, key: string) => U
    ): Record<string, U> => {
      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [key, fn(value, key)])
      );
    };

    it('devrait transformer les valeurs', () => {
      const obj = { a: 1, b: 2 };
      const result = mapValues(obj, (v) => v * 2);
      expect(result).toEqual({ a: 2, b: 4 });
    });
  });

  describe('Filter Object', () => {
    const filterObject = <T>(
      obj: Record<string, T>,
      predicate: (value: T, key: string) => boolean
    ): Record<string, T> => {
      return Object.fromEntries(
        Object.entries(obj).filter(([key, value]) => predicate(value, key))
      );
    };

    it('devrait filtrer les propriétés', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = filterObject(obj, (v) => v > 1);
      expect(result).toEqual({ b: 2, c: 3 });
    });
  });

  describe('Compare Objects', () => {
    const isEqual = (obj1: unknown, obj2: unknown): boolean => {
      return JSON.stringify(obj1) === JSON.stringify(obj2);
    };

    it('devrait détecter des objets égaux', () => {
      expect(isEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    });

    it('devrait détecter des objets différents', () => {
      expect(isEqual({ a: 1 }, { a: 2 })).toBe(false);
    });

    it('devrait comparer les objets imbriqués', () => {
      expect(isEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
    });
  });

  describe('Flatten Object', () => {
    const flattenObject = (
      obj: Record<string, unknown>,
      prefix: string = ''
    ): Record<string, unknown> => {
      const result: Record<string, unknown> = {};
      
      for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          Object.assign(result, flattenObject(value as Record<string, unknown>, newKey));
        } else {
          result[newKey] = value;
        }
      }
      
      return result;
    };

    it('devrait aplatir les objets imbriqués', () => {
      const obj = { a: { b: { c: 1 } } };
      expect(flattenObject(obj)).toEqual({ 'a.b.c': 1 });
    });

    it('devrait garder les tableaux intacts', () => {
      const obj = { a: { b: [1, 2, 3] } };
      expect(flattenObject(obj)).toEqual({ 'a.b': [1, 2, 3] });
    });
  });

  describe('Unflatten Object', () => {
    const unflattenObject = (
      obj: Record<string, unknown>
    ): Record<string, unknown> => {
      const result: Record<string, unknown> = {};
      
      for (const [key, value] of Object.entries(obj)) {
        const keys = key.split('.');
        let current = result;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!(keys[i] in current)) {
            current[keys[i]] = {};
          }
          current = current[keys[i]] as Record<string, unknown>;
        }
        
        current[keys[keys.length - 1]] = value;
      }
      
      return result;
    };

    it('devrait reconstruire les objets imbriqués', () => {
      const flat = { 'a.b.c': 1 };
      expect(unflattenObject(flat)).toEqual({ a: { b: { c: 1 } } });
    });
  });

  describe('Defaults', () => {
    const defaults = <T extends object>(obj: Partial<T>, defaultValues: T): T => {
      return { ...defaultValues, ...obj };
    };

    it('devrait appliquer les valeurs par défaut', () => {
      const result = defaults({ a: 1 }, { a: 0, b: 2 });
      expect(result).toEqual({ a: 1, b: 2 });
    });
  });
});
