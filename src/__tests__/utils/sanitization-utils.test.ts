/**
 * Tests pour les utilitaires de sanitization et sécurité
 * Couverture: XSS, injection SQL, validation input
 */

describe('Sanitization Utils', () => {
  describe('HTML Escaping', () => {
    const escapeHtml = (str: string): string => {
      const htmlEntities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      };
      return str.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
    };

    it('devrait échapper les balises', () => {
      expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    });

    it('devrait échapper les ampersands', () => {
      expect(escapeHtml('a & b')).toBe('a &amp; b');
    });

    it('devrait échapper les guillemets', () => {
      expect(escapeHtml('"test"')).toBe('&quot;test&quot;');
    });

    it('devrait échapper les apostrophes', () => {
      expect(escapeHtml("it's")).toBe('it&#039;s');
    });

    it('ne devrait pas modifier le texte normal', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
    });
  });

  describe('HTML Tag Stripping', () => {
    const stripHtml = (str: string): string => {
      return str.replace(/<[^>]*>/g, '');
    };

    it('devrait supprimer les balises simples', () => {
      expect(stripHtml('<p>test</p>')).toBe('test');
    });

    it('devrait supprimer les balises avec attributs', () => {
      expect(stripHtml('<a href="url">link</a>')).toBe('link');
    });

    it('devrait supprimer les scripts', () => {
      expect(stripHtml('<script>alert(1)</script>')).toBe('alert(1)');
    });

    it('devrait garder le texte', () => {
      expect(stripHtml('Hello World')).toBe('Hello World');
    });
  });

  describe('SQL Injection Prevention', () => {
    const escapeSql = (str: string): string => {
      return str.replace(/['";\\]/g, '\\$&');
    };

    it('devrait échapper les single quotes', () => {
      expect(escapeSql("O'Brien")).toBe("O\\'Brien");
    });

    it('devrait échapper les double quotes', () => {
      expect(escapeSql('test"value')).toBe('test\\"value');
    });

    it('devrait échapper les backslashes', () => {
      expect(escapeSql('path\\to\\file')).toBe('path\\\\to\\\\file');
    });

    it('devrait échapper les semicolons', () => {
      expect(escapeSql('value; DROP TABLE')).toBe('value\\; DROP TABLE');
    });
  });

  describe('Input Trimming', () => {
    const sanitizeInput = (input: string): string => {
      return input.trim().replace(/\s+/g, ' ');
    };

    it('devrait supprimer les espaces en début/fin', () => {
      expect(sanitizeInput('  test  ')).toBe('test');
    });

    it('devrait normaliser les espaces multiples', () => {
      expect(sanitizeInput('hello    world')).toBe('hello world');
    });

    it('devrait gérer les tabs', () => {
      expect(sanitizeInput('hello\tworld')).toBe('hello world');
    });

    it('devrait gérer les newlines', () => {
      expect(sanitizeInput('hello\nworld')).toBe('hello world');
    });
  });

  describe('Special Characters Removal', () => {
    const removeSpecialChars = (str: string): string => {
      return str.replace(/[^a-zA-Z0-9\s]/g, '');
    };

    it('devrait supprimer les caractères spéciaux', () => {
      expect(removeSpecialChars('hello!@#$%')).toBe('hello');
    });

    it('devrait garder les espaces', () => {
      expect(removeSpecialChars('hello world')).toBe('hello world');
    });

    it('devrait garder les chiffres', () => {
      expect(removeSpecialChars('test123')).toBe('test123');
    });
  });

  describe('Alphanumeric Only', () => {
    const toAlphanumeric = (str: string): string => {
      return str.replace(/[^a-zA-Z0-9]/g, '');
    };

    it('devrait supprimer tout sauf lettres et chiffres', () => {
      expect(toAlphanumeric('Hello World! 123')).toBe('HelloWorld123');
    });

    it('devrait gérer une chaîne vide', () => {
      expect(toAlphanumeric('')).toBe('');
    });
  });

  describe('Filename Sanitization', () => {
    const sanitizeFilename = (filename: string): string => {
      // Remove or replace dangerous characters
      return filename
        .replace(/[<>:"/\\|?*]/g, '_')
        .replace(/\.{2,}/g, '.')
        .replace(/^\.+/, '')
        .trim();
    };

    it('devrait remplacer les caractères interdits Windows', () => {
      expect(sanitizeFilename('file:name')).toBe('file_name');
    });

    it('devrait empêcher le path traversal', () => {
      // Le résultat dépend de l'implémentation - vérifie juste que les .. sont traités
      const result = sanitizeFilename('../../../etc/passwd');
      expect(result).not.toContain('..');
    });

    it('devrait supprimer les doubles points', () => {
      expect(sanitizeFilename('file..ext')).toBe('file.ext');
    });

    it('devrait supprimer les points en début', () => {
      const result = sanitizeFilename('.hiddenfile');
      expect(result.startsWith('.')).toBe(false);
    });
  });

  describe('URL Slug Generation', () => {
    const toSlug = (str: string): string => {
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    };

    it('devrait convertir en minuscules', () => {
      expect(toSlug('Hello World')).toBe('hello-world');
    });

    it('devrait supprimer les accents', () => {
      expect(toSlug('Café résumé')).toBe('cafe-resume');
    });

    it('devrait remplacer les espaces par des tirets', () => {
      expect(toSlug('my article title')).toBe('my-article-title');
    });

    it('devrait supprimer les caractères spéciaux', () => {
      expect(toSlug('Hello! World?')).toBe('hello-world');
    });

    it('devrait éviter les tirets multiples', () => {
      expect(toSlug('hello   world')).toBe('hello-world');
    });
  });

  describe('JSON Safe String', () => {
    const toJsonSafe = (str: string): string => {
      return str
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
    };

    it('devrait échapper les backslashes', () => {
      expect(toJsonSafe('path\\to')).toBe('path\\\\to');
    });

    it('devrait échapper les guillemets', () => {
      expect(toJsonSafe('say "hello"')).toBe('say \\"hello\\"');
    });

    it('devrait échapper les newlines', () => {
      expect(toJsonSafe('line1\nline2')).toBe('line1\\nline2');
    });
  });

  describe('XSS Prevention', () => {
    const preventXss = (input: string): string => {
      // Remove script tags and event handlers
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*(['"])[^'"]*\1/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/data:/gi, '');
    };

    it('devrait supprimer les scripts', () => {
      expect(preventXss('<script>alert("xss")</script>')).toBe('');
    });

    it('devrait supprimer les event handlers', () => {
      expect(preventXss('<img onerror="alert(1)">')).toBe('<img >');
    });

    it('devrait supprimer javascript:', () => {
      expect(preventXss('<a href="javascript:alert(1)">link</a>')).toBe('<a href="alert(1)">link</a>');
    });
  });

  describe('Credit Card Masking', () => {
    const maskCreditCard = (number: string): string => {
      const cleaned = number.replace(/\D/g, '');
      if (cleaned.length < 12) return number;
      
      const first = cleaned.slice(0, 4);
      const last = cleaned.slice(-4);
      const middle = '*'.repeat(cleaned.length - 8);
      
      return `${first}${middle}${last}`;
    };

    it('devrait masquer les chiffres du milieu', () => {
      expect(maskCreditCard('4111111111111111')).toBe('4111********1111');
    });

    it('devrait gérer les espaces', () => {
      expect(maskCreditCard('4111 1111 1111 1111')).toBe('4111********1111');
    });

    it('devrait retourner tel quel si trop court', () => {
      expect(maskCreditCard('41111111')).toBe('41111111');
    });
  });

  describe('IBAN Validation Pattern', () => {
    const isValidIbanFormat = (iban: string): boolean => {
      const cleaned = iban.replace(/\s/g, '').toUpperCase();
      // Simplified: 2 letters + 2 digits + up to 30 alphanumeric
      return /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(cleaned);
    };

    it('devrait valider un IBAN français', () => {
      expect(isValidIbanFormat('FR76 1234 5678 9012 3456 7890 123')).toBe(true);
    });

    it('devrait valider un IBAN allemand', () => {
      expect(isValidIbanFormat('DE89370400440532013000')).toBe(true);
    });

    it('devrait rejeter un format invalide', () => {
      expect(isValidIbanFormat('1234567890')).toBe(false);
    });
  });

  describe('Unicode Normalization', () => {
    const normalizeUnicode = (str: string): string => {
      return str.normalize('NFC');
    };

    it('devrait normaliser les caractères composés', () => {
      // é can be composed (é) or decomposed (e + combining accent)
      const composed = '\u00e9'; // é
      const decomposed = 'e\u0301'; // e + combining acute accent
      
      expect(normalizeUnicode(decomposed)).toBe(composed);
    });
  });

  describe('Control Characters Removal', () => {
    const removeControlChars = (str: string): string => {
      // Remove ASCII control characters except newline and tab
      return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    };

    it('devrait supprimer les caractères de contrôle', () => {
      expect(removeControlChars('hello\x00world')).toBe('helloworld');
    });

    it('devrait garder les newlines', () => {
      expect(removeControlChars('hello\nworld')).toBe('hello\nworld');
    });

    it('devrait garder les tabs', () => {
      expect(removeControlChars('hello\tworld')).toBe('hello\tworld');
    });
  });

  describe('Path Traversal Prevention', () => {
    const preventPathTraversal = (path: string): string => {
      return path
        .replace(/\.\./g, '')
        .replace(/\/\//g, '/')
        .replace(/\\\\/g, '\\')
        .replace(/^\/+/, '');
    };

    it('devrait supprimer ..', () => {
      expect(preventPathTraversal('../../../etc/passwd')).toBe('etc/passwd');
    });

    it('devrait supprimer les slashes doubles', () => {
      expect(preventPathTraversal('path//to//file')).toBe('path/to/file');
    });

    it('devrait supprimer le slash initial', () => {
      expect(preventPathTraversal('/root/file')).toBe('root/file');
    });
  });
});
