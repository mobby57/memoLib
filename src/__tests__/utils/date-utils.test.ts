/**
 * Tests pour les utilitaires de formatage de dates
 * Couverture: formatage, parsing, calculs de délais
 */

describe('Date Formatting Utils', () => {
  describe('Format DD/MM/YYYY', () => {
    const formatDateFR = (date: Date): string => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    it('devrait formater une date correctement', () => {
      const date = new Date('2024-06-15');
      expect(formatDateFR(date)).toBe('15/06/2024');
    });

    it('devrait ajouter des zéros pour les jours < 10', () => {
      const date = new Date('2024-01-05');
      expect(formatDateFR(date)).toBe('05/01/2024');
    });
  });

  describe('Format ISO', () => {
    const formatDateISO = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };

    it('devrait formater en YYYY-MM-DD', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      expect(formatDateISO(date)).toBe('2024-06-15');
    });
  });

  describe('Format Relative', () => {
    const formatRelative = (date: Date): string => {
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Aujourd'hui";
      if (diffDays === 1) return 'Hier';
      if (diffDays < 7) return `Il y a ${diffDays} jours`;
      if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine(s)`;
      return `Il y a ${Math.floor(diffDays / 30)} mois`;
    };

    it('devrait retourner "Aujourd\'hui" pour la date du jour', () => {
      expect(formatRelative(new Date())).toBe("Aujourd'hui");
    });

    it('devrait retourner "Hier" pour hier', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(formatRelative(yesterday)).toBe('Hier');
    });

    it('devrait retourner les jours pour < 7 jours', () => {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      expect(formatRelative(fiveDaysAgo)).toBe('Il y a 5 jours');
    });
  });

  describe('Days Until', () => {
    const daysUntil = (targetDate: Date): number => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const target = new Date(targetDate);
      target.setHours(0, 0, 0, 0);
      return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    };

    it('devrait calculer les jours restants', () => {
      const inOneWeek = new Date();
      inOneWeek.setDate(inOneWeek.getDate() + 7);
      expect(daysUntil(inOneWeek)).toBe(7);
    });

    it('devrait retourner 0 pour aujourd\'hui', () => {
      expect(daysUntil(new Date())).toBe(0);
    });

    it('devrait retourner un nombre négatif pour dates passées', () => {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      expect(daysUntil(lastWeek)).toBe(-7);
    });
  });

  describe('Is Overdue', () => {
    const isOverdue = (deadline: Date): boolean => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return deadline < now;
    };

    it('devrait retourner true pour dates passées', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isOverdue(yesterday)).toBe(true);
    });

    it('devrait retourner false pour dates futures', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isOverdue(tomorrow)).toBe(false);
    });
  });

  describe('Add Days', () => {
    const addDays = (date: Date, days: number): Date => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    };

    it('devrait ajouter des jours', () => {
      const date = new Date('2024-01-15');
      const result = addDays(date, 10);
      expect(result.getDate()).toBe(25);
    });

    it('devrait gérer le passage de mois', () => {
      const date = new Date('2024-01-30');
      const result = addDays(date, 5);
      expect(result.getMonth()).toBe(1); // Février
    });

    it('devrait soustraire des jours avec valeur négative', () => {
      const date = new Date('2024-01-15');
      const result = addDays(date, -5);
      expect(result.getDate()).toBe(10);
    });
  });

  describe('Business Days Calculation', () => {
    const addBusinessDays = (date: Date, days: number): Date => {
      const result = new Date(date);
      let added = 0;
      
      while (added < days) {
        result.setDate(result.getDate() + 1);
        const dayOfWeek = result.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          added++;
        }
      }
      
      return result;
    };

    it('devrait ignorer les weekends', () => {
      // Vendredi 2024-01-05
      const friday = new Date('2024-01-05');
      const result = addBusinessDays(friday, 1);
      // Devrait être lundi 2024-01-08
      expect(result.getDay()).toBe(1); // Lundi
    });
  });

  describe('Parse Date String', () => {
    const parseDateFR = (dateStr: string): Date | null => {
      const parts = dateStr.split('/');
      if (parts.length !== 3) return null;
      
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      
      if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
      
      return new Date(year, month, day);
    };

    it('devrait parser DD/MM/YYYY', () => {
      const date = parseDateFR('15/06/2024');
      expect(date?.getDate()).toBe(15);
      expect(date?.getMonth()).toBe(5); // Juin = 5
      expect(date?.getFullYear()).toBe(2024);
    });

    it('devrait retourner null pour format invalide', () => {
      expect(parseDateFR('invalid')).toBeNull();
      expect(parseDateFR('2024-06-15')).toBeNull();
    });
  });

  describe('Date Comparison', () => {
    const isSameDay = (date1: Date, date2: Date): boolean => {
      return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
      );
    };

    it('devrait retourner true pour le même jour', () => {
      const date1 = new Date('2024-06-15T10:00:00');
      const date2 = new Date('2024-06-15T18:00:00');
      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('devrait retourner false pour des jours différents', () => {
      const date1 = new Date('2024-06-15');
      const date2 = new Date('2024-06-16');
      expect(isSameDay(date1, date2)).toBe(false);
    });
  });
});
