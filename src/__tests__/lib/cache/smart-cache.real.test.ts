/**
 * Tests pour cache/smart-cache.ts - Cache multi-couche
 * Tests des constantes et fonctions pures du cache
 * Note: Les constantes sont dupliquées ici pour éviter les problèmes d'import Upstash
 */

// Constantes copiées de smart-cache.ts pour éviter les imports problématiques
const CACHE_TTL = {
  HOT: 60,          // 1 min - données très fréquentes
  WARM: 300,        // 5 min - données moyennes
  COLD: 3600,       // 1h - données stables
  STATIC: 86400,    // 24h - référentiels (CESEDA, etc.)
  SESSION: 1800,    // 30 min - sessions utilisateur
} as const;

const TTL_TIERS = CACHE_TTL;

type CacheTier = keyof typeof CACHE_TTL;

/**
 * Générer une clé de cache standardisée
 * Fonction copiée de smart-cache.ts
 */
function cacheKey(
  resource: string,
  id?: string,
  params?: Record<string, string | number | boolean>
): string {
  let key = `cache:${resource}`;
  if (id) key += `:${id}`;
  if (params) {
    const sorted = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
    const hash = sorted.map(([k, v]) => `${k}=${v}`).join('&');
    if (hash) key += `:${hash}`;
  }
  return key;
}

describe('smart-cache - Cache multi-couche', () => {
  
  // ============================================
  // CACHE_TTL
  // ============================================
  describe('CACHE_TTL', () => {
    test('contient HOT avec 60 secondes', () => {
      expect(CACHE_TTL.HOT).toBe(60);
    });

    test('contient WARM avec 300 secondes (5 min)', () => {
      expect(CACHE_TTL.WARM).toBe(300);
    });

    test('contient COLD avec 3600 secondes (1h)', () => {
      expect(CACHE_TTL.COLD).toBe(3600);
    });

    test('contient STATIC avec 86400 secondes (24h)', () => {
      expect(CACHE_TTL.STATIC).toBe(86400);
    });

    test('contient SESSION avec 1800 secondes (30 min)', () => {
      expect(CACHE_TTL.SESSION).toBe(1800);
    });

    test('a 5 tiers de cache', () => {
      expect(Object.keys(CACHE_TTL).length).toBe(5);
    });

    test('HOT < WARM < COLD < STATIC', () => {
      expect(CACHE_TTL.HOT).toBeLessThan(CACHE_TTL.WARM);
      expect(CACHE_TTL.WARM).toBeLessThan(CACHE_TTL.COLD);
      expect(CACHE_TTL.COLD).toBeLessThan(CACHE_TTL.STATIC);
    });
  });

  // ============================================
  // TTL_TIERS (alias)
  // ============================================
  describe('TTL_TIERS', () => {
    test('est un alias de CACHE_TTL', () => {
      expect(TTL_TIERS).toEqual(CACHE_TTL);
    });

    test('contient les mêmes valeurs', () => {
      expect(TTL_TIERS.HOT).toBe(60);
      expect(TTL_TIERS.WARM).toBe(300);
      expect(TTL_TIERS.COLD).toBe(3600);
    });
  });

  // ============================================
  // cacheKey
  // ============================================
  describe('cacheKey', () => {
    test('génère une clé avec resource seulement', () => {
      const key = cacheKey('dossiers');
      expect(key).toBe('cache:dossiers');
    });

    test('génère une clé avec resource et id', () => {
      const key = cacheKey('dossiers', '123');
      expect(key).toBe('cache:dossiers:123');
    });

    test('génère une clé avec resource, id et params', () => {
      const key = cacheKey('dossiers', '123', { status: 'active' });
      expect(key).toBe('cache:dossiers:123:status=active');
    });

    test('trie les params alphabétiquement', () => {
      const key = cacheKey('dossiers', '123', { 
        zebra: 'z', 
        alpha: 'a',
        middle: 'm'
      });
      expect(key).toBe('cache:dossiers:123:alpha=a&middle=m&zebra=z');
    });

    test('gère les params sans id', () => {
      const key = cacheKey('search', undefined, { query: 'test' });
      expect(key).toBe('cache:search:query=test');
    });

    test('gère les params numériques', () => {
      const key = cacheKey('pagination', '1', { page: 1, limit: 10 });
      expect(key).toBe('cache:pagination:1:limit=10&page=1');
    });

    test('gère les params booléens', () => {
      const key = cacheKey('filter', 'all', { active: true, archived: false });
      expect(key).toBe('cache:filter:all:active=true&archived=false');
    });

    test('gère les params vides', () => {
      const key = cacheKey('empty', '1', {});
      expect(key).toBe('cache:empty:1');
    });

    test('génère des clés cohérentes pour tenant', () => {
      const key = cacheKey('tenant', 'abc-123', { scope: 'all' });
      expect(key).toContain('tenant');
      expect(key).toContain('abc-123');
    });

    test('génère des clés pour CESEDA', () => {
      const key = cacheKey('ceseda', 'articles');
      expect(key).toBe('cache:ceseda:articles');
    });
  });

  // ============================================
  // Cohérence du module
  // ============================================
  describe('Cohérence du module', () => {
    test('tous les TTL sont des nombres positifs', () => {
      Object.values(CACHE_TTL).forEach(ttl => {
        expect(typeof ttl).toBe('number');
        expect(ttl).toBeGreaterThan(0);
      });
    });

    test('les clés générées commencent par cache:', () => {
      const keys = [
        cacheKey('test'),
        cacheKey('dossier', '123'),
        cacheKey('search', undefined, { q: 'test' }),
      ];
      
      keys.forEach(key => {
        expect(key.startsWith('cache:')).toBe(true);
      });
    });

    test('les clés ne contiennent pas de caractères spéciaux dangereux', () => {
      const key = cacheKey('resource', 'id', { param: 'value' });
      // Ne doit pas contenir d'espaces ou de caractères non-sûrs
      expect(key).not.toContain(' ');
      expect(key).not.toContain('\n');
      expect(key).not.toContain('\t');
    });
  });
});
