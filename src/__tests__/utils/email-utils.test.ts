/**
 * Tests pour les utilitaires de validation d'email
 * Couverture: format, domaine, sécurité
 */

describe('Email Validation Utils', () => {
  describe('Basic Email Validation', () => {
    const isValidEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    it('devrait valider un email simple', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
    });

    it('devrait valider un email avec sous-domaine', () => {
      expect(isValidEmail('test@mail.example.com')).toBe(true);
    });

    it('devrait rejeter un email sans @', () => {
      expect(isValidEmail('testexample.com')).toBe(false);
    });

    it('devrait rejeter un email sans domaine', () => {
      expect(isValidEmail('test@')).toBe(false);
    });

    it('devrait rejeter un email sans extension', () => {
      expect(isValidEmail('test@example')).toBe(false);
    });

    it('devrait rejeter un email vide', () => {
      expect(isValidEmail('')).toBe(false);
    });

    it('devrait rejeter un email avec espaces', () => {
      expect(isValidEmail('test @example.com')).toBe(false);
    });
  });

  describe('Strict Email Validation', () => {
    const isValidEmailStrict = (email: string): boolean => {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return emailRegex.test(email);
    };

    it('devrait valider un email standard', () => {
      expect(isValidEmailStrict('user@domain.com')).toBe(true);
    });

    it('devrait valider un email avec points', () => {
      expect(isValidEmailStrict('first.last@domain.com')).toBe(true);
    });

    it('devrait valider un email avec +', () => {
      expect(isValidEmailStrict('user+tag@domain.com')).toBe(true);
    });

    it('devrait rejeter un email avec caractères spéciaux invalides', () => {
      expect(isValidEmailStrict('user!#@domain.com')).toBe(false);
    });
  });

  describe('Domain Extraction', () => {
    const extractDomain = (email: string): string | null => {
      const parts = email.split('@');
      if (parts.length !== 2) return null;
      return parts[1].toLowerCase();
    };

    it('devrait extraire le domaine', () => {
      expect(extractDomain('user@example.com')).toBe('example.com');
    });

    it('devrait mettre en minuscules', () => {
      expect(extractDomain('user@EXAMPLE.COM')).toBe('example.com');
    });

    it('devrait retourner null pour email invalide', () => {
      expect(extractDomain('invalid')).toBeNull();
    });
  });

  describe('Email Normalization', () => {
    const normalizeEmail = (email: string): string => {
      return email.toLowerCase().trim();
    };

    it('devrait mettre en minuscules', () => {
      expect(normalizeEmail('Test@Example.COM')).toBe('test@example.com');
    });

    it('devrait supprimer les espaces', () => {
      expect(normalizeEmail('  test@example.com  ')).toBe('test@example.com');
    });
  });

  describe('Professional Email Detection', () => {
    const freeEmailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    
    const isProfessionalEmail = (email: string): boolean => {
      const domain = email.split('@')[1]?.toLowerCase();
      if (!domain) return false;
      return !freeEmailDomains.includes(domain);
    };

    it('devrait détecter un email professionnel', () => {
      expect(isProfessionalEmail('contact@entreprise.fr')).toBe(true);
    });

    it('devrait rejeter Gmail comme non professionnel', () => {
      expect(isProfessionalEmail('user@gmail.com')).toBe(false);
    });

    it('devrait rejeter Hotmail comme non professionnel', () => {
      expect(isProfessionalEmail('user@hotmail.com')).toBe(false);
    });
  });

  describe('Email Masking', () => {
    const maskEmail = (email: string): string => {
      const [local, domain] = email.split('@');
      if (!local || !domain) return email;
      
      if (local.length <= 2) {
        return `${local[0]}*@${domain}`;
      }
      
      const visibleChars = Math.min(3, Math.floor(local.length / 2));
      const masked = local.substring(0, visibleChars) + 
                    '*'.repeat(local.length - visibleChars);
      return `${masked}@${domain}`;
    };

    it('devrait masquer la partie locale', () => {
      const masked = maskEmail('johnsmith@example.com');
      expect(masked).toContain('@example.com');
      expect(masked).toContain('***');
    });

    it('devrait gérer les emails courts', () => {
      const masked = maskEmail('jo@example.com');
      expect(masked).toContain('@example.com');
    });
  });

  describe('Disposable Email Detection', () => {
    const disposableDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
    
    const isDisposableEmail = (email: string): boolean => {
      const domain = email.split('@')[1]?.toLowerCase();
      return disposableDomains.some(d => domain?.includes(d));
    };

    it('devrait détecter un email jetable', () => {
      expect(isDisposableEmail('user@tempmail.com')).toBe(true);
    });

    it('devrait accepter un email normal', () => {
      expect(isDisposableEmail('user@gmail.com')).toBe(false);
    });
  });

  describe('Email List Validation', () => {
    const validateEmailList = (emails: string[]): { valid: string[]; invalid: string[] } => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const valid: string[] = [];
      const invalid: string[] = [];
      
      emails.forEach(email => {
        if (emailRegex.test(email.trim())) {
          valid.push(email.trim());
        } else {
          invalid.push(email.trim());
        }
      });
      
      return { valid, invalid };
    };

    it('devrait séparer les emails valides et invalides', () => {
      const result = validateEmailList([
        'valid@example.com',
        'invalid',
        'also.valid@test.org',
      ]);
      
      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(1);
    });
  });

  describe('Email Comparison', () => {
    const emailsEqual = (email1: string, email2: string): boolean => {
      return email1.toLowerCase().trim() === email2.toLowerCase().trim();
    };

    it('devrait comparer indépendamment de la casse', () => {
      expect(emailsEqual('Test@Example.com', 'test@example.com')).toBe(true);
    });

    it('devrait détecter des emails différents', () => {
      expect(emailsEqual('user1@example.com', 'user2@example.com')).toBe(false);
    });
  });
});
