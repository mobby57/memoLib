/**
 * Tests pour les utilitaires de formatage de montants
 * Couverture: formatage monétaire, pourcentages, nombres
 */

describe('Currency Formatting Utils', () => {
  describe('Format EUR', () => {
    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
      }).format(amount);
    };

    it('devrait formater un montant en euros', () => {
      const formatted = formatCurrency(1500);
      expect(formatted).toContain('1');
      expect(formatted).toContain('500');
      expect(formatted).toContain('€');
    });

    it('devrait gérer les décimales', () => {
      const formatted = formatCurrency(1500.50);
      expect(formatted).toContain('50');
    });

    it('devrait gérer zéro', () => {
      const formatted = formatCurrency(0);
      expect(formatted).toContain('0');
    });
  });

  describe('Format Simple', () => {
    const formatAmount = (amount: number): string => {
      return `${amount.toFixed(2)} €`;
    };

    it('devrait formater avec 2 décimales', () => {
      expect(formatAmount(100)).toBe('100.00 €');
      expect(formatAmount(1500.5)).toBe('1500.50 €');
    });
  });

  describe('Parse Amount', () => {
    const parseAmount = (str: string): number => {
      // Supprimer les caractères non numériques sauf le point décimal
      const cleaned = str.replace(/[^\d.-]/g, '').replace(',', '.');
      return parseFloat(cleaned) || 0;
    };

    it('devrait parser un montant simple', () => {
      expect(parseAmount('100')).toBe(100);
    });

    it('devrait parser un montant avec €', () => {
      expect(parseAmount('1 500 €')).toBe(1500);
    });

    it('devrait parser un montant avec virgule', () => {
      expect(parseAmount('1500,50')).toBe(1500.50);
    });

    it('devrait retourner 0 pour une valeur invalide', () => {
      expect(parseAmount('abc')).toBe(0);
    });
  });

  describe('Format Compact', () => {
    const formatCompact = (amount: number): string => {
      if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(1)}M €`;
      }
      if (amount >= 1000) {
        return `${(amount / 1000).toFixed(1)}k €`;
      }
      return `${amount} €`;
    };

    it('devrait formater en k pour milliers', () => {
      expect(formatCompact(1500)).toBe('1.5k €');
      expect(formatCompact(10000)).toBe('10.0k €');
    });

    it('devrait formater en M pour millions', () => {
      expect(formatCompact(1500000)).toBe('1.5M €');
    });

    it('devrait garder le format normal pour < 1000', () => {
      expect(formatCompact(500)).toBe('500 €');
    });
  });
});

describe('Percentage Formatting', () => {
  describe('Format Percentage', () => {
    const formatPercentage = (value: number): string => {
      return `${value.toFixed(1)}%`;
    };

    it('devrait formater avec 1 décimale', () => {
      expect(formatPercentage(75)).toBe('75.0%');
      expect(formatPercentage(33.33)).toBe('33.3%');
    });
  });

  describe('Calculate Percentage', () => {
    const calculatePercentage = (part: number, total: number): number => {
      if (total === 0) return 0;
      return (part / total) * 100;
    };

    it('devrait calculer le pourcentage correct', () => {
      expect(calculatePercentage(25, 100)).toBe(25);
      expect(calculatePercentage(1, 4)).toBe(25);
    });

    it('devrait retourner 0 si total est 0', () => {
      expect(calculatePercentage(10, 0)).toBe(0);
    });
  });

  describe('Format Change', () => {
    const formatChange = (oldValue: number, newValue: number): string => {
      if (oldValue === 0) return '+∞%';
      const change = ((newValue - oldValue) / oldValue) * 100;
      const sign = change >= 0 ? '+' : '';
      return `${sign}${change.toFixed(1)}%`;
    };

    it('devrait formater une augmentation', () => {
      expect(formatChange(100, 120)).toBe('+20.0%');
    });

    it('devrait formater une diminution', () => {
      expect(formatChange(100, 80)).toBe('-20.0%');
    });

    it('devrait gérer le cas où ancienne valeur est 0', () => {
      expect(formatChange(0, 100)).toBe('+∞%');
    });
  });
});

describe('Number Formatting', () => {
  describe('Format Number FR', () => {
    const formatNumber = (num: number): string => {
      return new Intl.NumberFormat('fr-FR').format(num);
    };

    it('devrait utiliser l\'espace comme séparateur de milliers', () => {
      const formatted = formatNumber(1234567);
      // En français, on utilise l'espace insécable ou normal
      expect(formatted.replace(/\s/g, '')).toBe('1234567');
    });
  });

  describe('Format With Decimals', () => {
    const formatWithDecimals = (num: number, decimals: number): string => {
      return num.toFixed(decimals);
    };

    it('devrait formater avec le nombre de décimales spécifié', () => {
      expect(formatWithDecimals(3.14159, 2)).toBe('3.14');
      expect(formatWithDecimals(3.14159, 4)).toBe('3.1416');
    });

    it('devrait ajouter des zéros si nécessaire', () => {
      expect(formatWithDecimals(10, 2)).toBe('10.00');
    });
  });

  describe('Round To', () => {
    const roundTo = (num: number, decimals: number): number => {
      const factor = Math.pow(10, decimals);
      return Math.round(num * factor) / factor;
    };

    it('devrait arrondir correctement', () => {
      expect(roundTo(3.456, 2)).toBe(3.46);
      expect(roundTo(3.454, 2)).toBe(3.45);
    });

    it('devrait gérer les entiers', () => {
      expect(roundTo(100, 2)).toBe(100);
    });
  });

  describe('Clamp', () => {
    const clamp = (value: number, min: number, max: number): number => {
      return Math.min(Math.max(value, min), max);
    };

    it('devrait retourner la valeur si dans la plage', () => {
      expect(clamp(50, 0, 100)).toBe(50);
    });

    it('devrait retourner min si en dessous', () => {
      expect(clamp(-10, 0, 100)).toBe(0);
    });

    it('devrait retourner max si au dessus', () => {
      expect(clamp(150, 0, 100)).toBe(100);
    });
  });
});

describe('Invoice Amount Calculations', () => {
  describe('TVA Calculation', () => {
    const calculateTVA = (montantHT: number, tauxTVA: number = 20): number => {
      return montantHT * (tauxTVA / 100);
    };

    const calculateTTC = (montantHT: number, tauxTVA: number = 20): number => {
      return montantHT * (1 + tauxTVA / 100);
    };

    it('devrait calculer la TVA à 20%', () => {
      expect(calculateTVA(1000)).toBe(200);
    });

    it('devrait calculer le TTC', () => {
      expect(calculateTTC(1000)).toBe(1200);
    });

    it('devrait supporter un taux personnalisé', () => {
      expect(calculateTVA(1000, 5.5)).toBe(55);
    });
  });

  describe('Discount Calculation', () => {
    const applyDiscount = (amount: number, discountPercent: number): number => {
      return amount * (1 - discountPercent / 100);
    };

    it('devrait appliquer une remise', () => {
      expect(applyDiscount(100, 10)).toBe(90);
      expect(applyDiscount(100, 25)).toBe(75);
    });

    it('devrait retourner 0 pour 100% de remise', () => {
      expect(applyDiscount(100, 100)).toBe(0);
    });
  });

  describe('Total Calculation', () => {
    const calculateTotal = (
      items: Array<{ quantity: number; unitPrice: number }>
    ): number => {
      return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    };

    it('devrait calculer le total des lignes', () => {
      const items = [
        { quantity: 2, unitPrice: 100 },
        { quantity: 1, unitPrice: 50 },
      ];
      expect(calculateTotal(items)).toBe(250);
    });

    it('devrait retourner 0 pour un tableau vide', () => {
      expect(calculateTotal([])).toBe(0);
    });
  });
});
