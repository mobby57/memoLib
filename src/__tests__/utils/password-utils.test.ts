/**
 * Tests pour les utilitaires de validation de mot de passe
 * Couverture: force, règles, sécurité
 */

describe('Password Validation Utils', () => {
  describe('Password Strength', () => {
    const calculateStrength = (password: string): number => {
      let strength = 0;
      
      if (password.length >= 8) strength += 1;
      if (password.length >= 12) strength += 1;
      if (/[a-z]/.test(password)) strength += 1;
      if (/[A-Z]/.test(password)) strength += 1;
      if (/[0-9]/.test(password)) strength += 1;
      if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
      
      return strength;
    };

    it('devrait retourner 0 pour un mot de passe vide', () => {
      expect(calculateStrength('')).toBe(0);
    });

    it('devrait retourner faible pour un mot simple', () => {
      expect(calculateStrength('abc')).toBeLessThan(3);
    });

    it('devrait retourner fort pour un mot de passe complexe', () => {
      expect(calculateStrength('MyP@ssw0rd123!')).toBeGreaterThanOrEqual(5);
    });

    it('devrait récompenser la longueur', () => {
      const short = calculateStrength('Aa1!');
      const long = calculateStrength('Aa1!Aa1!Aa1!');
      expect(long).toBeGreaterThan(short);
    });
  });

  describe('Password Rules Validation', () => {
    interface PasswordRules {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumber: boolean;
      requireSpecial: boolean;
    }

    const validatePassword = (
      password: string,
      rules: PasswordRules
    ): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];
      
      if (password.length < rules.minLength) {
        errors.push(`Minimum ${rules.minLength} caractères requis`);
      }
      if (rules.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Majuscule requise');
      }
      if (rules.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Minuscule requise');
      }
      if (rules.requireNumber && !/[0-9]/.test(password)) {
        errors.push('Chiffre requis');
      }
      if (rules.requireSpecial && !/[^a-zA-Z0-9]/.test(password)) {
        errors.push('Caractère spécial requis');
      }
      
      return { valid: errors.length === 0, errors };
    };

    const defaultRules: PasswordRules = {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSpecial: true,
    };

    it('devrait valider un mot de passe conforme', () => {
      const result = validatePassword('MyP@ssw0rd', defaultRules);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait rejeter un mot de passe trop court', () => {
      const result = validatePassword('Aa1!', defaultRules);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Minimum 8 caractères requis');
    });

    it('devrait rejeter sans majuscule', () => {
      const result = validatePassword('myp@ssw0rd', defaultRules);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Majuscule requise');
    });

    it('devrait rejeter sans minuscule', () => {
      const result = validatePassword('MYP@SSW0RD', defaultRules);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Minuscule requise');
    });

    it('devrait rejeter sans chiffre', () => {
      const result = validatePassword('MyP@sswrd', defaultRules);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Chiffre requis');
    });

    it('devrait rejeter sans caractère spécial', () => {
      const result = validatePassword('MyPassw0rd', defaultRules);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Caractère spécial requis');
    });
  });

  describe('Common Password Detection', () => {
    const commonPasswords = [
      '123456',
      'password',
      'azerty',
      'qwerty',
      '12345678',
      'motdepasse',
    ];

    const isCommonPassword = (password: string): boolean => {
      return commonPasswords.includes(password.toLowerCase());
    };

    it('devrait détecter un mot de passe commun', () => {
      expect(isCommonPassword('password')).toBe(true);
    });

    it('devrait détecter indépendamment de la casse', () => {
      expect(isCommonPassword('PASSWORD')).toBe(true);
    });

    it('devrait accepter un mot de passe unique', () => {
      expect(isCommonPassword('Xyj8!kLm9@nP')).toBe(false);
    });
  });

  describe('Password Entropy', () => {
    const calculateEntropy = (password: string): number => {
      const charsetSize = getCharsetSize(password);
      return Math.log2(Math.pow(charsetSize, password.length));
    };

    const getCharsetSize = (password: string): number => {
      let size = 0;
      if (/[a-z]/.test(password)) size += 26;
      if (/[A-Z]/.test(password)) size += 26;
      if (/[0-9]/.test(password)) size += 10;
      if (/[^a-zA-Z0-9]/.test(password)) size += 32;
      return size || 1;
    };

    it('devrait calculer une entropie faible pour un mot simple', () => {
      const entropy = calculateEntropy('abc');
      expect(entropy).toBeLessThan(20);
    });

    it('devrait calculer une entropie élevée pour un mot complexe', () => {
      const entropy = calculateEntropy('MyP@ssw0rd123!');
      expect(entropy).toBeGreaterThan(60);
    });
  });

  describe('Password History Check', () => {
    const isInHistory = (
      newPassword: string,
      history: string[],
      hashFn: (p: string) => string = (p) => p
    ): boolean => {
      const hashedNew = hashFn(newPassword);
      return history.some((h) => h === hashedNew);
    };

    it('devrait détecter un mot de passe dans l\'historique', () => {
      const history = ['pass1', 'pass2', 'pass3'];
      expect(isInHistory('pass2', history)).toBe(true);
    });

    it('devrait accepter un nouveau mot de passe', () => {
      const history = ['pass1', 'pass2', 'pass3'];
      expect(isInHistory('newpass', history)).toBe(false);
    });
  });

  describe('Password Generation Helpers', () => {
    const generateSecurePassword = (length: number = 16): string => {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
      let password = '';
      for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    it('devrait générer la bonne longueur', () => {
      const password = generateSecurePassword(20);
      expect(password.length).toBe(20);
    });

    it('devrait générer des mots de passe différents', () => {
      const pass1 = generateSecurePassword();
      const pass2 = generateSecurePassword();
      expect(pass1).not.toBe(pass2);
    });
  });

  describe('Password Similarity Check', () => {
    const isSimilar = (password1: string, password2: string, threshold: number = 0.8): boolean => {
      const p1 = password1.toLowerCase();
      const p2 = password2.toLowerCase();
      
      // Simple similarity: common characters ratio
      const chars1 = new Set(p1.split(''));
      const chars2 = new Set(p2.split(''));
      const common = [...chars1].filter((c) => chars2.has(c)).length;
      const total = Math.max(chars1.size, chars2.size);
      
      return common / total >= threshold;
    };

    it('devrait détecter des mots de passe similaires', () => {
      // password123 et Password123 partagent 90%+ des caractères
      expect(isSimilar('password123', 'Password123')).toBe(true);
    });

    it('devrait accepter des mots de passe différents', () => {
      expect(isSimilar('abc123', 'xyz789')).toBe(false);
    });
  });

  describe('Password Expiry Check', () => {
    const isPasswordExpired = (
      lastChanged: Date,
      maxAgeDays: number
    ): boolean => {
      const now = new Date();
      const diffTime = now.getTime() - lastChanged.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return diffDays > maxAgeDays;
    };

    it('devrait détecter un mot de passe expiré', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100);
      expect(isPasswordExpired(oldDate, 90)).toBe(true);
    });

    it('devrait accepter un mot de passe récent', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 10);
      expect(isPasswordExpired(recentDate, 90)).toBe(false);
    });
  });

  describe('Username in Password Check', () => {
    const containsUsername = (password: string, username: string): boolean => {
      return password.toLowerCase().includes(username.toLowerCase());
    };

    it('devrait détecter le nom d\'utilisateur dans le mot de passe', () => {
      expect(containsUsername('john123!', 'john')).toBe(true);
    });

    it('devrait accepter un mot de passe sans le nom', () => {
      expect(containsUsername('SecureP@ss1', 'john')).toBe(false);
    });
  });

  describe('Sequential Characters Detection', () => {
    const hasSequentialChars = (password: string, count: number = 3): boolean => {
      for (let i = 0; i <= password.length - count; i++) {
        let isSequence = true;
        for (let j = 1; j < count; j++) {
          if (password.charCodeAt(i + j) !== password.charCodeAt(i + j - 1) + 1) {
            isSequence = false;
            break;
          }
        }
        if (isSequence) return true;
      }
      return false;
    };

    it('devrait détecter abc', () => {
      expect(hasSequentialChars('myabc123')).toBe(true);
    });

    it('devrait détecter 123', () => {
      expect(hasSequentialChars('pass123!')).toBe(true);
    });

    it('devrait accepter un mot de passe sans séquence', () => {
      expect(hasSequentialChars('Xk9!mL2@')).toBe(false);
    });
  });

  describe('Repeated Characters Detection', () => {
    const hasRepeatedChars = (password: string, count: number = 3): boolean => {
      for (let i = 0; i <= password.length - count; i++) {
        const char = password[i];
        let repeated = true;
        for (let j = 1; j < count; j++) {
          if (password[i + j] !== char) {
            repeated = false;
            break;
          }
        }
        if (repeated) return true;
      }
      return false;
    };

    it('devrait détecter aaa', () => {
      expect(hasRepeatedChars('passaaas')).toBe(true);
    });

    it('devrait accepter un mot de passe sans répétition', () => {
      expect(hasRepeatedChars('password')).toBe(false);
    });
  });
});
