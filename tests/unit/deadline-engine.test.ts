import { describe, it, expect } from 'vitest';
import { calculateDeadline, calculateUrgencyLevel, addHours, addDays } from '../../src/lib/cesda/deadlineEngine';
import { ProcedureType, UrgencyLevel } from '../../src/types/cesda';

describe('DeadlineEngine', () => {
  const now = new Date();

  describe('calculateDeadline', () => {
    it('OQTF sans délai = 48h', () => {
      const notif = new Date();
      const result = calculateDeadline(ProcedureType.OQTF, notif, { oqtfType: 'sans_delai' });

      const expected = addHours(notif, 48);
      expect(result.deadlineDate.getTime()).toBeCloseTo(expected.getTime(), -3);
      expect(result.procedureType).toBe(ProcedureType.OQTF);
      expect(result.isExpired).toBe(false);
    });

    it('OQTF avec délai = 30 jours', () => {
      const notif = new Date();
      const result = calculateDeadline(ProcedureType.OQTF, notif);

      const expected = addDays(notif, 30);
      expect(result.deadlineDate.getTime()).toBeCloseTo(expected.getTime(), -3);
      expect(result.daysRemaining).toBeGreaterThanOrEqual(29);
    });

    it('Refus titre = 2 mois', () => {
      const notif = new Date();
      const result = calculateDeadline(ProcedureType.REFUS_TITRE, notif);

      expect(result.daysRemaining).toBeGreaterThanOrEqual(55);
      expect(result.daysRemaining).toBeLessThanOrEqual(62);
    });

    it('Asile CNDA = 30 jours', () => {
      const notif = new Date();
      const result = calculateDeadline(ProcedureType.ASILE, notif, { stade: 'CNDA' });

      const expected = addDays(notif, 30);
      expect(result.deadlineDate.getTime()).toBeCloseTo(expected.getTime(), -3);
    });

    it('Naturalisation = 18 mois', () => {
      const notif = new Date();
      const result = calculateDeadline(ProcedureType.NATURALISATION, notif);

      expect(result.daysRemaining).toBeGreaterThanOrEqual(500);
    });

    it('détecte un délai expiré', () => {
      const pastDate = new Date('2020-01-01');
      const result = calculateDeadline(ProcedureType.OQTF, pastDate, { oqtfType: 'sans_delai' });

      expect(result.isExpired).toBe(true);
      expect(result.daysRemaining).toBe(0);
      expect(result.hoursRemaining).toBe(0);
    });
  });

  describe('calculateUrgencyLevel', () => {
    it('OQTF < 12h = CRITIQUE', () => {
      expect(calculateUrgencyLevel(10, ProcedureType.OQTF)).toBe(UrgencyLevel.CRITIQUE);
    });

    it('OQTF 12-24h = ELEVE', () => {
      expect(calculateUrgencyLevel(18, ProcedureType.OQTF)).toBe(UrgencyLevel.ELEVE);
    });

    it('OQTF 24-36h = MOYEN', () => {
      expect(calculateUrgencyLevel(30, ProcedureType.OQTF)).toBe(UrgencyLevel.MOYEN);
    });

    it('OQTF > 36h = FAIBLE', () => {
      expect(calculateUrgencyLevel(40, ProcedureType.OQTF)).toBe(UrgencyLevel.FAIBLE);
    });

    it('Autre procédure < 48h = CRITIQUE', () => {
      expect(calculateUrgencyLevel(24, ProcedureType.REFUS_TITRE)).toBe(UrgencyLevel.CRITIQUE);
    });

    it('Autre procédure < 7j = ELEVE', () => {
      expect(calculateUrgencyLevel(100, ProcedureType.REFUS_TITRE)).toBe(UrgencyLevel.ELEVE);
    });

    it('Autre procédure < 30j = MOYEN', () => {
      expect(calculateUrgencyLevel(500, ProcedureType.REFUS_TITRE)).toBe(UrgencyLevel.MOYEN);
    });

    it('Autre procédure > 30j = FAIBLE', () => {
      expect(calculateUrgencyLevel(1000, ProcedureType.REFUS_TITRE)).toBe(UrgencyLevel.FAIBLE);
    });
  });
});
