/**
 * Tests pour les utilitaires de manipulation de chaînes
 * Couverture: formatage, transformation, recherche
 */

describe('String Utils', () => {
  describe('Capitalize', () => {
    const capitalize = (str: string): string => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    it('devrait capitaliser la première lettre', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('devrait mettre le reste en minuscules', () => {
      expect(capitalize('HELLO')).toBe('Hello');
    });

    it('devrait gérer une chaîne vide', () => {
      expect(capitalize('')).toBe('');
    });

    it('devrait gérer un seul caractère', () => {
      expect(capitalize('a')).toBe('A');
    });
  });

  describe('Title Case', () => {
    const toTitleCase = (str: string): string => {
      return str
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    it('devrait capitaliser chaque mot', () => {
      expect(toTitleCase('hello world')).toBe('Hello World');
    });

    it('devrait gérer les majuscules', () => {
      expect(toTitleCase('HELLO WORLD')).toBe('Hello World');
    });
  });

  describe('Camel Case', () => {
    const toCamelCase = (str: string): string => {
      return str
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
    };

    it('devrait convertir depuis kebab-case', () => {
      expect(toCamelCase('hello-world')).toBe('helloWorld');
    });

    it('devrait convertir depuis snake_case', () => {
      expect(toCamelCase('hello_world')).toBe('helloWorld');
    });

    it('devrait convertir depuis les espaces', () => {
      expect(toCamelCase('hello world')).toBe('helloWorld');
    });
  });

  describe('Kebab Case', () => {
    const toKebabCase = (str: string): string => {
      return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
    };

    it('devrait convertir depuis camelCase', () => {
      expect(toKebabCase('helloWorld')).toBe('hello-world');
    });

    it('devrait convertir depuis les espaces', () => {
      expect(toKebabCase('Hello World')).toBe('hello-world');
    });

    it('devrait convertir depuis snake_case', () => {
      expect(toKebabCase('hello_world')).toBe('hello-world');
    });
  });

  describe('Snake Case', () => {
    const toSnakeCase = (str: string): string => {
      return str
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\s-]+/g, '_')
        .toLowerCase();
    };

    it('devrait convertir depuis camelCase', () => {
      expect(toSnakeCase('helloWorld')).toBe('hello_world');
    });

    it('devrait convertir depuis les espaces', () => {
      expect(toSnakeCase('Hello World')).toBe('hello_world');
    });
  });

  describe('Truncate', () => {
    const truncate = (str: string, length: number, suffix: string = '...'): string => {
      if (str.length <= length) return str;
      return str.slice(0, length - suffix.length) + suffix;
    };

    it('devrait tronquer avec ellipsis', () => {
      expect(truncate('Hello World', 8)).toBe('Hello...');
    });

    it('ne devrait pas tronquer si assez court', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
    });

    it('devrait utiliser un suffixe personnalisé', () => {
      expect(truncate('Hello World', 8, '…')).toBe('Hello W…');
    });
  });

  describe('Pad String', () => {
    const padLeft = (str: string, length: number, char: string = ' '): string => {
      return str.padStart(length, char);
    };

    const padRight = (str: string, length: number, char: string = ' '): string => {
      return str.padEnd(length, char);
    };

    it('devrait ajouter des espaces à gauche', () => {
      expect(padLeft('5', 3)).toBe('  5');
    });

    it('devrait ajouter des zéros à gauche', () => {
      expect(padLeft('5', 3, '0')).toBe('005');
    });

    it('devrait ajouter des espaces à droite', () => {
      expect(padRight('5', 3)).toBe('5  ');
    });
  });

  describe('Strip Whitespace', () => {
    const stripWhitespace = (str: string): string => {
      return str.replace(/\s+/g, '');
    };

    it('devrait supprimer tous les espaces', () => {
      expect(stripWhitespace('hello world')).toBe('helloworld');
    });

    it('devrait supprimer les tabs', () => {
      expect(stripWhitespace('hello\tworld')).toBe('helloworld');
    });

    it('devrait supprimer les newlines', () => {
      expect(stripWhitespace('hello\nworld')).toBe('helloworld');
    });
  });

  describe('Word Count', () => {
    const wordCount = (str: string): number => {
      if (!str.trim()) return 0;
      return str.trim().split(/\s+/).length;
    };

    it('devrait compter les mots', () => {
      expect(wordCount('Hello world from here')).toBe(4);
    });

    it('devrait retourner 0 pour une chaîne vide', () => {
      expect(wordCount('')).toBe(0);
    });

    it('devrait gérer les espaces multiples', () => {
      expect(wordCount('hello    world')).toBe(2);
    });
  });

  describe('Reverse String', () => {
    const reverse = (str: string): string => {
      return str.split('').reverse().join('');
    };

    it('devrait inverser la chaîne', () => {
      expect(reverse('hello')).toBe('olleh');
    });

    it('devrait gérer une chaîne vide', () => {
      expect(reverse('')).toBe('');
    });
  });

  describe('Is Palindrome', () => {
    const isPalindrome = (str: string): boolean => {
      const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
      return cleaned === cleaned.split('').reverse().join('');
    };

    it('devrait détecter un palindrome', () => {
      expect(isPalindrome('radar')).toBe(true);
    });

    it('devrait ignorer les espaces et la casse', () => {
      expect(isPalindrome('A man a plan a canal Panama')).toBe(true);
    });

    it('devrait rejeter un non-palindrome', () => {
      expect(isPalindrome('hello')).toBe(false);
    });
  });

  describe('Contains Substring', () => {
    const contains = (str: string, substring: string, caseSensitive: boolean = true): boolean => {
      if (caseSensitive) {
        return str.includes(substring);
      }
      return str.toLowerCase().includes(substring.toLowerCase());
    };

    it('devrait détecter une sous-chaîne', () => {
      expect(contains('Hello World', 'World')).toBe(true);
    });

    it('devrait être sensible à la casse par défaut', () => {
      expect(contains('Hello World', 'world')).toBe(false);
    });

    it('devrait ignorer la casse si demandé', () => {
      expect(contains('Hello World', 'world', false)).toBe(true);
    });
  });

  describe('Replace All', () => {
    const replaceAll = (str: string, search: string, replacement: string): string => {
      return str.split(search).join(replacement);
    };

    it('devrait remplacer toutes les occurrences', () => {
      expect(replaceAll('hello hello', 'hello', 'hi')).toBe('hi hi');
    });
  });

  describe('Extract Numbers', () => {
    const extractNumbers = (str: string): number[] => {
      const matches = str.match(/\d+/g);
      return matches ? matches.map(Number) : [];
    };

    it('devrait extraire les nombres', () => {
      expect(extractNumbers('a1b2c3')).toEqual([1, 2, 3]);
    });

    it('devrait retourner un tableau vide sans nombres', () => {
      expect(extractNumbers('hello')).toEqual([]);
    });
  });

  describe('Initials', () => {
    const getInitials = (name: string): string => {
      return name
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase())
        .join('');
    };

    it('devrait extraire les initiales', () => {
      expect(getInitials('John Doe')).toBe('JD');
    });

    it('devrait gérer un seul mot', () => {
      expect(getInitials('John')).toBe('J');
    });

    it('devrait gérer plusieurs mots', () => {
      expect(getInitials('Jean Pierre Dupont')).toBe('JPD');
    });
  });

  describe('Escape Regex', () => {
    const escapeRegex = (str: string): string => {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    it('devrait échapper les caractères spéciaux', () => {
      expect(escapeRegex('hello.world')).toBe('hello\\.world');
    });

    it('devrait échapper les parenthèses', () => {
      expect(escapeRegex('(test)')).toBe('\\(test\\)');
    });
  });

  describe('Template String', () => {
    const template = (str: string, data: Record<string, unknown>): string => {
      return str.replace(/\{(\w+)\}/g, (_, key) => String(data[key] ?? ''));
    };

    it('devrait remplacer les variables', () => {
      expect(template('Hello {name}!', { name: 'World' })).toBe('Hello World!');
    });

    it('devrait gérer les variables manquantes', () => {
      expect(template('Hello {name}!', {})).toBe('Hello !');
    });
  });

  describe('Wrap Text', () => {
    const wrapText = (str: string, maxWidth: number): string[] => {
      const words = str.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      
      words.forEach((word) => {
        if ((currentLine + ' ' + word).trim().length <= maxWidth) {
          currentLine = (currentLine + ' ' + word).trim();
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      });
      
      if (currentLine) lines.push(currentLine);
      return lines;
    };

    it('devrait découper en lignes', () => {
      const result = wrapText('Hello World from here', 10);
      expect(result.length).toBeGreaterThan(1);
    });
  });

  describe('Remove Accents', () => {
    const removeAccents = (str: string): string => {
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    };

    it('devrait supprimer les accents', () => {
      expect(removeAccents('café')).toBe('cafe');
    });

    it('devrait gérer plusieurs accents', () => {
      expect(removeAccents('résumé')).toBe('resume');
    });
  });

  describe('Repeat String', () => {
    const repeat = (str: string, count: number): string => {
      return str.repeat(count);
    };

    it('devrait répéter la chaîne', () => {
      expect(repeat('ab', 3)).toBe('ababab');
    });

    it('devrait retourner vide pour count 0', () => {
      expect(repeat('ab', 0)).toBe('');
    });
  });

  describe('String Comparison', () => {
    const compareStrings = (a: string, b: string, ignoreCase: boolean = false): number => {
      const strA = ignoreCase ? a.toLowerCase() : a;
      const strB = ignoreCase ? b.toLowerCase() : b;
      return strA.localeCompare(strB);
    };

    it('devrait comparer alphabétiquement', () => {
      expect(compareStrings('apple', 'banana')).toBeLessThan(0);
    });

    it('devrait être sensible à la casse par défaut', () => {
      expect(compareStrings('Apple', 'apple')).not.toBe(0);
    });

    it('devrait ignorer la casse si demandé', () => {
      expect(compareStrings('Apple', 'apple', true)).toBe(0);
    });
  });
});
