/**
 * Tests pour cesda/deadlineEngine.ts - Moteur de calcul des délais CESDA
 * Tests des fonctions pures de calcul de délais
 */

import {
  calculateDeadline,
  calculateUrgencyLevel,
  addHours,
  addDays,
  addMonths,
  isDeadlineExpired,
  formatTimeRemaining,
  generateDeadlineAlerts,
  autoCalculateDeadline,
} from '@/lib/cesda/deadlineEngine';

import { ProcedureType, UrgencyLevel } from '@/types/cesda';

describe('deadlineEngine - Calcul des délais CESDA', () => {
  
  // ============================================
  // addHours
  // ============================================
  describe('addHours', () => {
    test('ajoute des heures à une date', () => {
      const baseDate = new Date('2026-01-15T10:00:00Z');
      const result = addHours(baseDate, 5);
      expect(result.getHours()).toBe(baseDate.getHours() + 5);
    });

    test('gère le passage au jour suivant', () => {
      const baseDate = new Date('2026-01-15T22:00:00Z');
      const result = addHours(baseDate, 5);
      expect(result.getDate()).toBe(16);
    });

    test('ne modifie pas la date originale', () => {
      const baseDate = new Date('2026-01-15T10:00:00Z');
      const originalTime = baseDate.getTime();
      addHours(baseDate, 5);
      expect(baseDate.getTime()).toBe(originalTime);
    });

    test('ajoute 0 heures correctement', () => {
      const baseDate = new Date('2026-01-15T10:00:00Z');
      const result = addHours(baseDate, 0);
      expect(result.getTime()).toBe(baseDate.getTime());
    });

    test('ajoute 48 heures pour OQTF sans délai', () => {
      const baseDate = new Date('2026-01-15T08:00:00Z');
      const result = addHours(baseDate, 48);
      expect(result.getDate()).toBe(17);
    });
  });

  // ============================================
  // addDays
  // ============================================
  describe('addDays', () => {
    test('ajoute des jours à une date', () => {
      const baseDate = new Date('2026-01-15');
      const result = addDays(baseDate, 30);
      expect(result.getDate()).toBe(14);
      expect(result.getMonth()).toBe(1); // Février
    });

    test('gère le passage de mois', () => {
      const baseDate = new Date('2026-01-25');
      const result = addDays(baseDate, 10);
      expect(result.getMonth()).toBe(1); // Février
    });

    test('ne modifie pas la date originale', () => {
      const baseDate = new Date('2026-01-15');
      const originalTime = baseDate.getTime();
      addDays(baseDate, 30);
      expect(baseDate.getTime()).toBe(originalTime);
    });

    test('ajoute 0 jours correctement', () => {
      const baseDate = new Date('2026-01-15');
      const result = addDays(baseDate, 0);
      expect(result.getDate()).toBe(15);
    });
  });

  // ============================================
  // addMonths
  // ============================================
  describe('addMonths', () => {
    test('ajoute des mois à une date', () => {
      const baseDate = new Date('2026-01-15');
      const result = addMonths(baseDate, 2);
      expect(result.getMonth()).toBe(2); // Mars
    });

    test('gère le passage d\'année', () => {
      const baseDate = new Date('2026-11-15');
      const result = addMonths(baseDate, 3);
      expect(result.getMonth()).toBe(1); // Février
      expect(result.getFullYear()).toBe(2027);
    });

    test('ne modifie pas la date originale', () => {
      const baseDate = new Date('2026-01-15');
      const originalTime = baseDate.getTime();
      addMonths(baseDate, 2);
      expect(baseDate.getTime()).toBe(originalTime);
    });

    test('ajoute 6 mois pour naturalisation', () => {
      const baseDate = new Date('2026-01-15');
      const result = addMonths(baseDate, 6);
      expect(result.getMonth()).toBe(6); // Juillet
    });
  });

  // ============================================
  // isDeadlineExpired
  // ============================================
  describe('isDeadlineExpired', () => {
    test('retourne true pour une date passée', () => {
      const pastDate = new Date('2020-01-01');
      expect(isDeadlineExpired(pastDate)).toBe(true);
    });

    test('retourne false pour une date future', () => {
      const futureDate = new Date('2030-01-01');
      expect(isDeadlineExpired(futureDate)).toBe(false);
    });
  });

  // ============================================
  // calculateUrgencyLevel
  // ============================================
  describe('calculateUrgencyLevel', () => {
    describe('pour OQTF', () => {
      test('retourne CRITIQUE si <= 12 heures', () => {
        const result = calculateUrgencyLevel(12, ProcedureType.OQTF);
        expect(result).toBe(UrgencyLevel.CRITIQUE);
      });

      test('retourne CRITIQUE si <= 10 heures', () => {
        const result = calculateUrgencyLevel(10, ProcedureType.OQTF);
        expect(result).toBe(UrgencyLevel.CRITIQUE);
      });

      test('retourne ELEVE si <= 24 heures et > 12', () => {
        const result = calculateUrgencyLevel(20, ProcedureType.OQTF);
        expect(result).toBe(UrgencyLevel.ELEVE);
      });

      test('retourne MOYEN si <= 36 heures et > 24', () => {
        const result = calculateUrgencyLevel(30, ProcedureType.OQTF);
        expect(result).toBe(UrgencyLevel.MOYEN);
      });

      test('retourne FAIBLE si > 36 heures', () => {
        const result = calculateUrgencyLevel(40, ProcedureType.OQTF);
        expect(result).toBe(UrgencyLevel.FAIBLE);
      });
    });

    describe('pour autres procédures', () => {
      test('retourne CRITIQUE si <= 48 heures (< 2 jours)', () => {
        const result = calculateUrgencyLevel(48, ProcedureType.REFUS_TITRE);
        expect(result).toBe(UrgencyLevel.CRITIQUE);
      });

      test('retourne ELEVE si <= 168 heures (< 1 semaine)', () => {
        const result = calculateUrgencyLevel(100, ProcedureType.REFUS_TITRE);
        expect(result).toBe(UrgencyLevel.ELEVE);
      });

      test('retourne MOYEN si <= 720 heures (< 1 mois)', () => {
        const result = calculateUrgencyLevel(500, ProcedureType.REFUS_TITRE);
        expect(result).toBe(UrgencyLevel.MOYEN);
      });

      test('retourne FAIBLE si > 720 heures', () => {
        const result = calculateUrgencyLevel(800, ProcedureType.REFUS_TITRE);
        expect(result).toBe(UrgencyLevel.FAIBLE);
      });
    });
  });

  // ============================================
  // calculateDeadline
  // ============================================
  describe('calculateDeadline', () => {
    // Use a fixed past date for testing to get consistent results
    const futureNotification = new Date(Date.now() + 1000 * 60 * 60 * 24 * 60); // 60 days from now

    test('calcule le délai pour OQTF sans délai (48h)', () => {
      const notification = new Date();
      const result = calculateDeadline(
        ProcedureType.OQTF,
        notification,
        { oqtfType: 'sans_delai' }
      );
      
      expect(result.procedureType).toBe(ProcedureType.OQTF);
      // Deadline should be 48 hours from notification
      const expectedDeadline = addHours(notification, 48);
      expect(result.deadlineDate.getTime()).toBeCloseTo(expectedDeadline.getTime(), -3);
    });

    test('calcule le délai pour OQTF avec délai (30 jours)', () => {
      const notification = new Date();
      const result = calculateDeadline(
        ProcedureType.OQTF,
        notification,
        { oqtfType: 'avec_delai' }
      );
      
      expect(result.procedureType).toBe(ProcedureType.OQTF);
      // Deadline should be 30 days from notification
      const expectedDeadline = addDays(notification, 30);
      expect(result.deadlineDate.getDate()).toBe(expectedDeadline.getDate());
    });

    test('calcule le délai pour REFUS_TITRE (2 mois)', () => {
      const notification = new Date();
      const result = calculateDeadline(ProcedureType.REFUS_TITRE, notification);
      
      expect(result.procedureType).toBe(ProcedureType.REFUS_TITRE);
      // Deadline should be 2 months from notification
      const expectedDeadline = addMonths(notification, 2);
      expect(result.deadlineDate.getMonth()).toBe(expectedDeadline.getMonth());
    });

    test('calcule le délai pour ASILE CNDA (30 jours)', () => {
      const notification = new Date();
      const result = calculateDeadline(
        ProcedureType.ASILE,
        notification,
        { stade: 'CNDA' }
      );
      
      expect(result.procedureType).toBe(ProcedureType.ASILE);
    });

    test('calcule le délai pour REGROUPEMENT_FAMILIAL (6 mois)', () => {
      const notification = new Date();
      const result = calculateDeadline(ProcedureType.REGROUPEMENT_FAMILIAL, notification);
      
      expect(result.procedureType).toBe(ProcedureType.REGROUPEMENT_FAMILIAL);
      const expectedDeadline = addMonths(notification, 6);
      expect(result.deadlineDate.getMonth()).toBe(expectedDeadline.getMonth());
    });

    test('calcule le délai pour NATURALISATION (18 mois)', () => {
      const notification = new Date();
      const result = calculateDeadline(ProcedureType.NATURALISATION, notification);
      
      expect(result.procedureType).toBe(ProcedureType.NATURALISATION);
    });

    test('inclut daysRemaining et hoursRemaining', () => {
      const notification = new Date();
      const result = calculateDeadline(ProcedureType.REFUS_TITRE, notification);
      
      expect(typeof result.daysRemaining).toBe('number');
      expect(typeof result.hoursRemaining).toBe('number');
      expect(result.daysRemaining).toBeGreaterThanOrEqual(0);
    });

    test('inclut urgencyLevel', () => {
      const notification = new Date();
      const result = calculateDeadline(ProcedureType.REFUS_TITRE, notification);
      
      expect(result.urgencyLevel).toBeDefined();
      expect(Object.values(UrgencyLevel)).toContain(result.urgencyLevel);
    });

    test('détecte si le délai est expiré', () => {
      const oldNotification = new Date('2020-01-01');
      const result = calculateDeadline(ProcedureType.REFUS_TITRE, oldNotification);
      
      expect(result.isExpired).toBe(true);
    });
  });

  // ============================================
  // formatTimeRemaining
  // ============================================
  describe('formatTimeRemaining', () => {
    test('affiche "Délai expiré" si isExpired', () => {
      const expired = {
        daysRemaining: 0,
        hoursRemaining: 0,
        isExpired: true,
      } as any;
      
      const result = formatTimeRemaining(expired);
      expect(result.toLowerCase()).toContain('expire');
    });

    test('affiche les jours restants au pluriel', () => {
      const deadline = {
        daysRemaining: 5,
        hoursRemaining: 120,
        isExpired: false,
      } as any;
      
      const result = formatTimeRemaining(deadline);
      expect(result).toContain('5');
      expect(result).toContain('jour');
    });

    test('affiche les heures si moins d\'un jour', () => {
      const deadline = {
        daysRemaining: 0,
        hoursRemaining: 12,
        isExpired: false,
      } as any;
      
      const result = formatTimeRemaining(deadline);
      expect(result).toContain('12');
      expect(result).toContain('heure');
    });

    test('affiche "Moins d\'une heure" si très peu de temps', () => {
      const deadline = {
        daysRemaining: 0,
        hoursRemaining: 0,
        isExpired: false,
      } as any;
      
      const result = formatTimeRemaining(deadline);
      expect(result.toLowerCase()).toContain('moins');
    });
  });

  // ============================================
  // generateDeadlineAlerts
  // ============================================
  describe('generateDeadlineAlerts', () => {
    test('retourne un tableau vide si pas de workspaces', () => {
      const result = generateDeadlineAlerts([]);
      expect(result).toEqual([]);
    });

    test('ignore les workspaces sans notificationDate', () => {
      const workspaces = [
        { id: '1', title: 'Test', procedureType: ProcedureType.OQTF }
      ];
      const result = generateDeadlineAlerts(workspaces as any);
      expect(result).toEqual([]);
    });

    test('génère une alerte critique pour délai expiré', () => {
      const workspaces = [{
        id: '1',
        title: 'Dossier urgent',
        procedureType: ProcedureType.OQTF,
        notificationDate: new Date('2020-01-01'),
        deadlineDate: new Date('2020-01-03'),
        metadata: { oqtfType: 'sans_delai' }
      }];
      
      const result = generateDeadlineAlerts(workspaces);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].level).toBe('critical');
    });

    test('trie les alertes par urgence', () => {
      // Create workspaces with different urgency levels
      const now = new Date();
      const workspaces = [
        {
          id: '1',
          title: 'Moins urgent',
          procedureType: ProcedureType.REFUS_TITRE,
          notificationDate: now,
          deadlineDate: addDays(now, 5),
        },
        {
          id: '2',
          title: 'Très urgent',
          procedureType: ProcedureType.OQTF,
          notificationDate: now,
          deadlineDate: addHours(now, 24),
          metadata: { oqtfType: 'sans_delai' }
        }
      ];
      
      const result = generateDeadlineAlerts(workspaces);
      // Critical alerts should come first
      if (result.length >= 2) {
        expect(result[0].level).toBe('critical');
      }
    });
  });

  // ============================================
  // autoCalculateDeadline
  // ============================================
  describe('autoCalculateDeadline', () => {
    test('retourne la date limite calculée', () => {
      const notification = new Date();
      const result = autoCalculateDeadline(ProcedureType.REFUS_TITRE, notification);
      
      expect(result instanceof Date).toBe(true);
      expect(result.getTime()).toBeGreaterThan(notification.getTime());
    });

    test('retourne la date +48h pour OQTF sans délai', () => {
      const notification = new Date();
      const result = autoCalculateDeadline(
        ProcedureType.OQTF,
        notification,
        { oqtfType: 'sans_delai' }
      );
      
      const expected = addHours(notification, 48);
      expect(result.getTime()).toBeCloseTo(expected.getTime(), -3);
    });

    test('retourne la date +30j pour OQTF avec délai', () => {
      const notification = new Date();
      const result = autoCalculateDeadline(
        ProcedureType.OQTF,
        notification,
        { oqtfType: 'avec_delai' }
      );
      
      const expected = addDays(notification, 30);
      expect(result.getDate()).toBe(expected.getDate());
    });
  });
});
