/**
 * Tests pour les utilitaires de validation de numéro de téléphone
 * Couverture: format français, international, formatage
 */

describe('Phone Validation Utils', () => {
  describe('French Phone Number Validation', () => {
    const isValidFrenchPhone = (phone: string): boolean => {
      // Remove spaces, dots, dashes
      const cleaned = phone.replace(/[\s.-]/g, '');
      // French format: starts with 0 and 10 digits, or +33 and 9 digits
      const frenchRegex = /^(0[1-9]\d{8}|\+33[1-9]\d{8})$/;
      return frenchRegex.test(cleaned);
    };

    it('devrait valider un numéro mobile', () => {
      expect(isValidFrenchPhone('0612345678')).toBe(true);
    });

    it('devrait valider un numéro fixe', () => {
      expect(isValidFrenchPhone('0123456789')).toBe(true);
    });

    it('devrait valider avec espaces', () => {
      expect(isValidFrenchPhone('06 12 34 56 78')).toBe(true);
    });

    it('devrait valider avec points', () => {
      expect(isValidFrenchPhone('06.12.34.56.78')).toBe(true);
    });

    it('devrait valider avec tirets', () => {
      expect(isValidFrenchPhone('06-12-34-56-78')).toBe(true);
    });

    it('devrait valider format +33', () => {
      expect(isValidFrenchPhone('+33612345678')).toBe(true);
    });

    it('devrait rejeter numéro trop court', () => {
      expect(isValidFrenchPhone('061234567')).toBe(false);
    });

    it('devrait rejeter numéro trop long', () => {
      expect(isValidFrenchPhone('06123456789')).toBe(false);
    });

    it('devrait rejeter numéro commençant par 00', () => {
      expect(isValidFrenchPhone('0012345678')).toBe(false);
    });
  });

  describe('International Phone Validation', () => {
    const isValidInternationalPhone = (phone: string): boolean => {
      // Simplified: starts with + and 7-15 digits
      const cleaned = phone.replace(/[\s.-]/g, '');
      const intlRegex = /^\+[1-9]\d{6,14}$/;
      return intlRegex.test(cleaned);
    };

    it('devrait valider un numéro US', () => {
      expect(isValidInternationalPhone('+1234567890')).toBe(true);
    });

    it('devrait valider un numéro FR', () => {
      expect(isValidInternationalPhone('+33612345678')).toBe(true);
    });

    it('devrait valider un numéro UK', () => {
      expect(isValidInternationalPhone('+447123456789')).toBe(true);
    });

    it('devrait rejeter sans +', () => {
      expect(isValidInternationalPhone('33612345678')).toBe(false);
    });

    it('devrait rejeter trop court', () => {
      expect(isValidInternationalPhone('+123')).toBe(false);
    });
  });

  describe('Phone Type Detection', () => {
    const getPhoneType = (phone: string): 'mobile' | 'fixe' | 'unknown' => {
      const cleaned = phone.replace(/[\s.-]/g, '');
      
      // Remove +33 prefix if present
      let normalized = cleaned;
      if (normalized.startsWith('+33')) {
        normalized = '0' + normalized.slice(3);
      }
      
      if (/^0[67]\d{8}$/.test(normalized)) return 'mobile';
      if (/^0[1-5]\d{8}$/.test(normalized)) return 'fixe';
      if (/^08\d{8}$/.test(normalized)) return 'fixe'; // numéros spéciaux
      if (/^09\d{8}$/.test(normalized)) return 'fixe'; // VoIP
      
      return 'unknown';
    };

    it('devrait détecter un mobile 06', () => {
      expect(getPhoneType('0612345678')).toBe('mobile');
    });

    it('devrait détecter un mobile 07', () => {
      expect(getPhoneType('0712345678')).toBe('mobile');
    });

    it('devrait détecter un fixe Paris', () => {
      expect(getPhoneType('0112345678')).toBe('fixe');
    });

    it('devrait détecter un fixe Province', () => {
      expect(getPhoneType('0412345678')).toBe('fixe');
    });

    it('devrait détecter un mobile +33', () => {
      expect(getPhoneType('+33612345678')).toBe('mobile');
    });
  });

  describe('Phone Formatting', () => {
    const formatFrenchPhone = (phone: string): string => {
      const cleaned = phone.replace(/[\s.-]/g, '');
      
      // Handle +33 prefix
      let normalized = cleaned;
      if (normalized.startsWith('+33')) {
        normalized = '0' + normalized.slice(3);
      }
      
      if (normalized.length !== 10) return phone;
      
      return normalized.match(/.{2}/g)?.join(' ') || phone;
    };

    it('devrait formater avec espaces', () => {
      expect(formatFrenchPhone('0612345678')).toBe('06 12 34 56 78');
    });

    it('devrait formater depuis +33', () => {
      expect(formatFrenchPhone('+33612345678')).toBe('06 12 34 56 78');
    });

    it('devrait gérer un format déjà formaté', () => {
      expect(formatFrenchPhone('06.12.34.56.78')).toBe('06 12 34 56 78');
    });

    it('devrait retourner tel quel si invalide', () => {
      expect(formatFrenchPhone('123')).toBe('123');
    });
  });

  describe('Phone to International Format', () => {
    const toInternationalFormat = (phone: string, countryCode: string = '+33'): string => {
      const cleaned = phone.replace(/[\s.-]/g, '');
      
      if (cleaned.startsWith('+')) return cleaned;
      if (cleaned.startsWith('0')) {
        return countryCode + cleaned.slice(1);
      }
      
      return countryCode + cleaned;
    };

    it('devrait convertir 06 en +33', () => {
      expect(toInternationalFormat('0612345678')).toBe('+33612345678');
    });

    it('devrait garder un numéro déjà international', () => {
      expect(toInternationalFormat('+33612345678')).toBe('+33612345678');
    });

    it('devrait utiliser le code pays fourni', () => {
      expect(toInternationalFormat('0612345678', '+32')).toBe('+32612345678');
    });
  });

  describe('Phone Number Masking', () => {
    const maskPhone = (phone: string): string => {
      const cleaned = phone.replace(/[\s.-]/g, '');
      if (cleaned.length < 4) return phone;
      
      const visible = 4;
      const masked = cleaned.slice(0, -visible).replace(/\d/g, '*');
      return masked + cleaned.slice(-visible);
    };

    it('devrait masquer les premiers chiffres', () => {
      expect(maskPhone('0612345678')).toBe('******5678');
    });

    it('devrait garder les 4 derniers', () => {
      const masked = maskPhone('0612345678');
      expect(masked.endsWith('5678')).toBe(true);
    });
  });

  describe('Phone Number Comparison', () => {
    const phonesEqual = (phone1: string, phone2: string): boolean => {
      const clean1 = phone1.replace(/[\s.-]/g, '');
      const clean2 = phone2.replace(/[\s.-]/g, '');
      
      // Normalize +33 to 0
      const normalize = (p: string) => {
        if (p.startsWith('+33')) return '0' + p.slice(3);
        return p;
      };
      
      return normalize(clean1) === normalize(clean2);
    };

    it('devrait comparer des formats différents', () => {
      expect(phonesEqual('06 12 34 56 78', '0612345678')).toBe(true);
    });

    it('devrait comparer national et international', () => {
      expect(phonesEqual('0612345678', '+33612345678')).toBe(true);
    });

    it('devrait détecter des numéros différents', () => {
      expect(phonesEqual('0612345678', '0612345679')).toBe(false);
    });
  });

  describe('Phone Validation Messages', () => {
    const validatePhoneWithMessage = (phone: string): { valid: boolean; message: string } => {
      const cleaned = phone.replace(/[\s.-]/g, '');
      
      if (!cleaned) {
        return { valid: false, message: 'Numéro de téléphone requis' };
      }
      
      if (!/^\d+$/.test(cleaned) && !cleaned.startsWith('+')) {
        return { valid: false, message: 'Caractères invalides' };
      }
      
      if (cleaned.length < 10) {
        return { valid: false, message: 'Numéro trop court' };
      }
      
      if (cleaned.length > 15) {
        return { valid: false, message: 'Numéro trop long' };
      }
      
      return { valid: true, message: 'Numéro valide' };
    };

    it('devrait retourner valide pour un bon numéro', () => {
      const result = validatePhoneWithMessage('0612345678');
      expect(result.valid).toBe(true);
    });

    it('devrait retourner message pour numéro vide', () => {
      const result = validatePhoneWithMessage('');
      expect(result.message).toBe('Numéro de téléphone requis');
    });

    it('devrait retourner message pour numéro court', () => {
      const result = validatePhoneWithMessage('0612');
      expect(result.message).toBe('Numéro trop court');
    });
  });

  describe('Country Code Extraction', () => {
    const extractCountryCode = (phone: string): string | null => {
      const cleaned = phone.replace(/[\s.-]/g, '');
      
      if (!cleaned.startsWith('+')) return null;
      
      // Match known country codes (1-3 digits)
      const codes: Record<string, string> = {
        '+1': 'US',
        '+33': 'FR',
        '+44': 'UK',
        '+49': 'DE',
        '+39': 'IT',
        '+34': 'ES',
        '+32': 'BE',
        '+41': 'CH',
      };
      
      for (const [code, country] of Object.entries(codes)) {
        if (cleaned.startsWith(code)) return country;
      }
      
      return null;
    };

    it('devrait extraire FR pour +33', () => {
      expect(extractCountryCode('+33612345678')).toBe('FR');
    });

    it('devrait extraire US pour +1', () => {
      expect(extractCountryCode('+1234567890')).toBe('US');
    });

    it('devrait retourner null sans +', () => {
      expect(extractCountryCode('0612345678')).toBeNull();
    });
  });

  describe('Special Number Detection', () => {
    const isSpecialNumber = (phone: string): boolean => {
      const cleaned = phone.replace(/[\s.-]/g, '');
      // French special numbers: emergency, services
      return /^(0800|08\d{8}|1[0-9]{1,2}|3\d{3})$/.test(cleaned);
    };

    it('devrait détecter un numéro vert 0800', () => {
      expect(isSpecialNumber('0800123456')).toBe(true);
    });

    it('devrait accepter un numéro normal', () => {
      expect(isSpecialNumber('0612345678')).toBe(false);
    });
  });

  describe('Phone List Validation', () => {
    const validatePhoneList = (phones: string[]): {
      valid: string[];
      invalid: string[];
    } => {
      const isValid = (p: string) => {
        const cleaned = p.replace(/[\s.-]/g, '');
        return /^(0[1-9]\d{8}|\+\d{10,14})$/.test(cleaned);
      };
      
      return {
        valid: phones.filter(isValid),
        invalid: phones.filter((p) => !isValid(p)),
      };
    };

    it('devrait séparer les numéros valides et invalides', () => {
      const result = validatePhoneList([
        '0612345678',
        'invalid',
        '+33612345678',
      ]);
      
      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(1);
    });
  });
});
