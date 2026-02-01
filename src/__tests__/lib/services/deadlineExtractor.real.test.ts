/**
 * Tests réels pour le service d'extraction de délais
 * Ces tests IMPORTENT le vrai fichier pour augmenter le coverage
 */

import {
  calculateDeadlineStatus,
  calculateDeadlinePriority,
  deadlineExtractor,
} from '@/lib/services/deadlineExtractor';

describe('deadlineExtractor - calculateDeadlineStatus', () => {
  describe('Statut dépassé', () => {
    it('devrait retourner "depasse" pour une date passée (hier)', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(calculateDeadlineStatus(yesterday)).toBe('depasse');
    });

    it('devrait retourner "depasse" pour une date passée (la semaine dernière)', () => {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      expect(calculateDeadlineStatus(lastWeek)).toBe('depasse');
    });

    it('devrait retourner "depasse" pour une date passée (le mois dernier)', () => {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      expect(calculateDeadlineStatus(lastMonth)).toBe('depasse');
    });
  });

  describe('Statut urgent', () => {
    it('devrait retourner "urgent" pour aujourd\'hui', () => {
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Fin de journée
      expect(calculateDeadlineStatus(today)).toBe('urgent');
    });

    it('devrait retourner "urgent" pour demain', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(calculateDeadlineStatus(tomorrow)).toBe('urgent');
    });

    it('devrait retourner "urgent" pour dans 2 jours', () => {
      const in2Days = new Date();
      in2Days.setDate(in2Days.getDate() + 2);
      expect(calculateDeadlineStatus(in2Days)).toBe('urgent');
    });

    it('devrait retourner "urgent" pour dans 3 jours', () => {
      const in3Days = new Date();
      in3Days.setDate(in3Days.getDate() + 3);
      expect(calculateDeadlineStatus(in3Days)).toBe('urgent');
    });
  });

  describe('Statut proche', () => {
    it('devrait retourner "proche" pour dans 4 jours', () => {
      const in4Days = new Date();
      in4Days.setDate(in4Days.getDate() + 4);
      expect(calculateDeadlineStatus(in4Days)).toBe('proche');
    });

    it('devrait retourner "proche" pour dans 5 jours', () => {
      const in5Days = new Date();
      in5Days.setDate(in5Days.getDate() + 5);
      expect(calculateDeadlineStatus(in5Days)).toBe('proche');
    });

    it('devrait retourner "proche" pour dans 7 jours', () => {
      const in7Days = new Date();
      in7Days.setDate(in7Days.getDate() + 7);
      expect(calculateDeadlineStatus(in7Days)).toBe('proche');
    });
  });

  describe('Statut à venir', () => {
    it('devrait retourner "a_venir" pour dans 8 jours', () => {
      const in8Days = new Date();
      in8Days.setDate(in8Days.getDate() + 8);
      expect(calculateDeadlineStatus(in8Days)).toBe('a_venir');
    });

    it('devrait retourner "a_venir" pour dans 30 jours', () => {
      const in30Days = new Date();
      in30Days.setDate(in30Days.getDate() + 30);
      expect(calculateDeadlineStatus(in30Days)).toBe('a_venir');
    });

    it('devrait retourner "a_venir" pour dans un an', () => {
      const inOneYear = new Date();
      inOneYear.setFullYear(inOneYear.getFullYear() + 1);
      expect(calculateDeadlineStatus(inOneYear)).toBe('a_venir');
    });
  });
});

describe('deadlineExtractor - calculateDeadlinePriority', () => {
  describe('Priorité critique pour types OQTF/expulsion', () => {
    it('devrait retourner "critique" pour type oqtf', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      expect(calculateDeadlinePriority(futureDate, 'oqtf_sans_delai')).toBe('critique');
    });

    it('devrait retourner "critique" pour type expulsion', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 60);
      expect(calculateDeadlinePriority(futureDate, 'menace_expulsion')).toBe('critique');
    });
  });

  describe('Priorité critique pour recours contentieux courts', () => {
    it('devrait retourner "critique" pour recours contentieux dans 7 jours', () => {
      const in7Days = new Date();
      in7Days.setDate(in7Days.getDate() + 7);
      expect(calculateDeadlinePriority(in7Days, 'delai_recours_contentieux')).toBe('critique');
    });

    it('devrait retourner "critique" pour recours contentieux dans 3 jours', () => {
      const in3Days = new Date();
      in3Days.setDate(in3Days.getDate() + 3);
      expect(calculateDeadlinePriority(in3Days, 'delai_recours_contentieux')).toBe('critique');
    });
  });

  describe('Priorité basée sur les délais', () => {
    it('devrait retourner "critique" pour date dépassée', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(calculateDeadlinePriority(yesterday, 'autre_type')).toBe('critique');
    });

    it('devrait retourner "critique" pour dans 1 jour', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(calculateDeadlinePriority(tomorrow, 'autre_type')).toBe('critique');
    });

    it('devrait retourner "critique" pour dans 3 jours', () => {
      const in3Days = new Date();
      in3Days.setDate(in3Days.getDate() + 3);
      expect(calculateDeadlinePriority(in3Days, 'autre_type')).toBe('critique');
    });

    it('devrait retourner "haute" pour dans 5 jours', () => {
      const in5Days = new Date();
      in5Days.setDate(in5Days.getDate() + 5);
      expect(calculateDeadlinePriority(in5Days, 'autre_type')).toBe('haute');
    });

    it('devrait retourner "haute" pour dans 7 jours', () => {
      const in7Days = new Date();
      in7Days.setDate(in7Days.getDate() + 7);
      expect(calculateDeadlinePriority(in7Days, 'autre_type')).toBe('haute');
    });

    it('devrait retourner "normale" pour dans 15 jours', () => {
      const in15Days = new Date();
      in15Days.setDate(in15Days.getDate() + 15);
      expect(calculateDeadlinePriority(in15Days, 'autre_type')).toBe('normale');
    });

    it('devrait retourner "normale" pour dans 30 jours', () => {
      const in30Days = new Date();
      in30Days.setDate(in30Days.getDate() + 30);
      expect(calculateDeadlinePriority(in30Days, 'autre_type')).toBe('normale');
    });

    it('devrait retourner "basse" pour dans 31 jours', () => {
      const in31Days = new Date();
      in31Days.setDate(in31Days.getDate() + 31);
      expect(calculateDeadlinePriority(in31Days, 'autre_type')).toBe('basse');
    });

    it('devrait retourner "basse" pour dans 60 jours', () => {
      const in60Days = new Date();
      in60Days.setDate(in60Days.getDate() + 60);
      expect(calculateDeadlinePriority(in60Days, 'autre_type')).toBe('basse');
    });
  });
});

describe('deadlineExtractor - Export object', () => {
  it('devrait exporter un objet avec les fonctions', () => {
    expect(deadlineExtractor).toBeDefined();
    expect(typeof deadlineExtractor).toBe('object');
  });

  it('devrait avoir calculateDeadlineStatus', () => {
    expect(deadlineExtractor.calculateDeadlineStatus).toBeDefined();
    expect(typeof deadlineExtractor.calculateDeadlineStatus).toBe('function');
  });

  it('devrait avoir calculateDeadlinePriority', () => {
    expect(deadlineExtractor.calculateDeadlinePriority).toBeDefined();
    expect(typeof deadlineExtractor.calculateDeadlinePriority).toBe('function');
  });

  it('devrait avoir extractDeadlinesFromText', () => {
    expect(deadlineExtractor.extractDeadlinesFromText).toBeDefined();
    expect(typeof deadlineExtractor.extractDeadlinesFromText).toBe('function');
  });

  it('devrait avoir extractDeadlinesFromFile', () => {
    expect(deadlineExtractor.extractDeadlinesFromFile).toBeDefined();
    expect(typeof deadlineExtractor.extractDeadlinesFromFile).toBe('function');
  });
});

describe('Cohérence calculs', () => {
  it('les fonctions exportées devraient fonctionner de façon cohérente', () => {
    // Date dépassée = statut dépassé ET priorité critique
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    
    expect(calculateDeadlineStatus(pastDate)).toBe('depasse');
    expect(calculateDeadlinePriority(pastDate, 'standard')).toBe('critique');
  });

  it('les délais très courts sont critiques', () => {
    const in2Days = new Date();
    in2Days.setDate(in2Days.getDate() + 2);
    
    expect(calculateDeadlineStatus(in2Days)).toBe('urgent');
    expect(calculateDeadlinePriority(in2Days, 'standard')).toBe('critique');
  });

  it('les délais moyens ont des priorités proportionnelles', () => {
    const in14Days = new Date();
    in14Days.setDate(in14Days.getDate() + 14);
    
    expect(calculateDeadlineStatus(in14Days)).toBe('a_venir');
    expect(calculateDeadlinePriority(in14Days, 'standard')).toBe('normale');
  });
});
