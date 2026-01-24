/**
 * Tests pour les utilitaires de validation d'URL
 * Couverture: format, protocole, sécurité
 */

describe('URL Validation Utils', () => {
  describe('Basic URL Validation', () => {
    const isValidUrl = (url: string): boolean => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    it('devrait valider une URL HTTP', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
    });

    it('devrait valider une URL HTTPS', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
    });

    it('devrait valider une URL avec chemin', () => {
      expect(isValidUrl('https://example.com/path/to/page')).toBe(true);
    });

    it('devrait valider une URL avec query', () => {
      expect(isValidUrl('https://example.com?q=test&page=1')).toBe(true);
    });

    it('devrait rejeter une chaîne invalide', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
    });

    it('devrait rejeter une chaîne vide', () => {
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('Secure URL Check', () => {
    const isSecureUrl = (url: string): boolean => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:';
      } catch {
        return false;
      }
    };

    it('devrait valider HTTPS', () => {
      expect(isSecureUrl('https://secure.com')).toBe(true);
    });

    it('devrait rejeter HTTP', () => {
      expect(isSecureUrl('http://insecure.com')).toBe(false);
    });

    it('devrait rejeter FTP', () => {
      expect(isSecureUrl('ftp://files.com')).toBe(false);
    });
  });

  describe('URL Parsing', () => {
    const parseUrl = (url: string): {
      protocol: string;
      host: string;
      pathname: string;
      search: string;
      hash: string;
    } | null => {
      try {
        const parsed = new URL(url);
        return {
          protocol: parsed.protocol,
          host: parsed.host,
          pathname: parsed.pathname,
          search: parsed.search,
          hash: parsed.hash,
        };
      } catch {
        return null;
      }
    };

    it('devrait parser le protocole', () => {
      const result = parseUrl('https://example.com');
      expect(result?.protocol).toBe('https:');
    });

    it('devrait parser le host', () => {
      const result = parseUrl('https://example.com:8080');
      expect(result?.host).toBe('example.com:8080');
    });

    it('devrait parser le chemin', () => {
      const result = parseUrl('https://example.com/path/page');
      expect(result?.pathname).toBe('/path/page');
    });

    it('devrait parser la query string', () => {
      const result = parseUrl('https://example.com?q=test');
      expect(result?.search).toBe('?q=test');
    });

    it('devrait parser le hash', () => {
      const result = parseUrl('https://example.com#section');
      expect(result?.hash).toBe('#section');
    });

    it('devrait retourner null pour URL invalide', () => {
      expect(parseUrl('invalid')).toBeNull();
    });
  });

  describe('Query Parameters Extraction', () => {
    const extractQueryParams = (url: string): Record<string, string> => {
      try {
        const parsed = new URL(url);
        const params: Record<string, string> = {};
        parsed.searchParams.forEach((value, key) => {
          params[key] = value;
        });
        return params;
      } catch {
        return {};
      }
    };

    it('devrait extraire les paramètres simples', () => {
      const params = extractQueryParams('https://example.com?a=1&b=2');
      expect(params.a).toBe('1');
      expect(params.b).toBe('2');
    });

    it('devrait gérer les valeurs encodées', () => {
      const params = extractQueryParams('https://example.com?q=hello%20world');
      expect(params.q).toBe('hello world');
    });

    it('devrait retourner un objet vide sans paramètres', () => {
      const params = extractQueryParams('https://example.com');
      expect(Object.keys(params)).toHaveLength(0);
    });
  });

  describe('URL Building', () => {
    const buildUrl = (
      base: string,
      params: Record<string, string | number>
    ): string => {
      const url = new URL(base);
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, String(value));
      });
      return url.toString();
    };

    it('devrait ajouter des paramètres', () => {
      const result = buildUrl('https://api.example.com', { page: 1, limit: 10 });
      expect(result).toContain('page=1');
      expect(result).toContain('limit=10');
    });

    it('devrait encoder les caractères spéciaux', () => {
      const result = buildUrl('https://api.example.com', { q: 'hello world' });
      expect(result).toContain('q=hello+world');
    });
  });

  describe('Domain Extraction', () => {
    const extractDomain = (url: string): string | null => {
      try {
        const parsed = new URL(url);
        return parsed.hostname;
      } catch {
        return null;
      }
    };

    it('devrait extraire le domaine simple', () => {
      expect(extractDomain('https://example.com')).toBe('example.com');
    });

    it('devrait extraire le sous-domaine', () => {
      expect(extractDomain('https://www.example.com')).toBe('www.example.com');
    });

    it('devrait ignorer le port', () => {
      expect(extractDomain('https://example.com:8080')).toBe('example.com');
    });
  });

  describe('Relative URL Resolution', () => {
    const resolveRelativeUrl = (base: string, relative: string): string => {
      return new URL(relative, base).toString();
    };

    it('devrait résoudre un chemin relatif', () => {
      const result = resolveRelativeUrl('https://example.com/a/', 'b/c');
      expect(result).toBe('https://example.com/a/b/c');
    });

    it('devrait résoudre un chemin absolu', () => {
      const result = resolveRelativeUrl('https://example.com/a/b', '/x/y');
      expect(result).toBe('https://example.com/x/y');
    });
  });

  describe('URL Normalization', () => {
    const normalizeUrl = (url: string): string => {
      try {
        const parsed = new URL(url);
        // Remove trailing slash
        let pathname = parsed.pathname;
        if (pathname.endsWith('/') && pathname !== '/') {
          pathname = pathname.slice(0, -1);
        }
        return `${parsed.protocol}//${parsed.host}${pathname}`;
      } catch {
        return url;
      }
    };

    it('devrait supprimer le trailing slash', () => {
      expect(normalizeUrl('https://example.com/path/')).toBe('https://example.com/path');
    });

    it('devrait garder le slash root', () => {
      expect(normalizeUrl('https://example.com/')).toBe('https://example.com/');
    });
  });

  describe('Internal/External URL Check', () => {
    const isInternalUrl = (url: string, baseDomain: string): boolean => {
      try {
        const parsed = new URL(url);
        return parsed.hostname.endsWith(baseDomain);
      } catch {
        return true; // Relative URLs are internal
      }
    };

    it('devrait détecter une URL interne', () => {
      expect(isInternalUrl('https://www.example.com/page', 'example.com')).toBe(true);
    });

    it('devrait détecter une URL externe', () => {
      expect(isInternalUrl('https://other.com', 'example.com')).toBe(false);
    });

    it('devrait traiter les URLs relatives comme internes', () => {
      expect(isInternalUrl('/path/to/page', 'example.com')).toBe(true);
    });
  });

  describe('Allowed Protocols Check', () => {
    const hasAllowedProtocol = (
      url: string,
      allowed: string[] = ['http:', 'https:']
    ): boolean => {
      try {
        const parsed = new URL(url);
        return allowed.includes(parsed.protocol);
      } catch {
        return false;
      }
    };

    it('devrait accepter HTTP', () => {
      expect(hasAllowedProtocol('http://example.com')).toBe(true);
    });

    it('devrait accepter HTTPS', () => {
      expect(hasAllowedProtocol('https://example.com')).toBe(true);
    });

    it('devrait rejeter javascript:', () => {
      expect(hasAllowedProtocol('javascript:alert(1)')).toBe(false);
    });

    it('devrait rejeter data:', () => {
      expect(hasAllowedProtocol('data:text/html,<script>')).toBe(false);
    });
  });

  describe('URL Comparison', () => {
    const urlsEqual = (url1: string, url2: string): boolean => {
      try {
        const parsed1 = new URL(url1);
        const parsed2 = new URL(url2);
        return (
          parsed1.origin === parsed2.origin &&
          parsed1.pathname === parsed2.pathname
        );
      } catch {
        return false;
      }
    };

    it('devrait détecter des URLs identiques', () => {
      expect(urlsEqual(
        'https://example.com/path',
        'https://example.com/path'
      )).toBe(true);
    });

    it('devrait ignorer la query string', () => {
      expect(urlsEqual(
        'https://example.com/path?a=1',
        'https://example.com/path?b=2'
      )).toBe(true);
    });

    it('devrait détecter des URLs différentes', () => {
      expect(urlsEqual(
        'https://example.com/a',
        'https://example.com/b'
      )).toBe(false);
    });
  });

  describe('Slug Extraction', () => {
    const extractSlug = (url: string): string | null => {
      try {
        const parsed = new URL(url);
        const parts = parsed.pathname.split('/').filter(Boolean);
        return parts[parts.length - 1] || null;
      } catch {
        return null;
      }
    };

    it('devrait extraire le slug', () => {
      expect(extractSlug('https://blog.com/posts/my-article')).toBe('my-article');
    });

    it('devrait retourner null pour la racine', () => {
      expect(extractSlug('https://example.com/')).toBeNull();
    });
  });
});
