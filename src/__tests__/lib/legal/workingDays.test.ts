import { describe, it, expect, beforeAll } from 'vitest';
import {
  isWorkingDay,
  isFrenchHoliday,
  addWorkingDays,
  getWorkingDaysBetween,
} from '@/lib/legal/workingDays';

describe('workingDays – Service jours ouvrés et fériés', () => {
  // ─── Tests de détection ──────────────────────────────
  describe('isWorkingDay / isFrenchHoliday', () => {
    it('devrait identifier un week-end', () => {
      const samedi = new Date('2026-08-29T00:00:00Z');
      const dimanche = new Date('2026-08-30T00:00:00Z');
      expect(isWorkingDay(samedi)).toBe(false);
      expect(isWorkingDay(dimanche)).toBe(false);
    });

    it('devrait identifier un jour ouvré normal', () => {
      const lundi = new Date('2026-08-31T00:00:00Z');
      expect(isWorkingDay(lundi)).toBe(true);
    });

    it('devrait identifier un jour férié français', () => {
      expect(isFrenchHoliday(new Date('2026-01-01T00:00:00Z'))).toBe(true);
      expect(isFrenchHoliday(new Date('2026-05-01T00:00:00Z'))).toBe(true);
      expect(isFrenchHoliday(new Date('2026-12-25T00:00:00Z'))).toBe(true);
    });

    it('ne devrait PAS identifier un jour normal comme férié', () => {
      expect(isFrenchHoliday(new Date('2026-08-31T00:00:00Z'))).toBe(false);
    });

    it('ne devrait PAS identifier un week-end comme férié', () => {
      const samedi = new Date('2026-08-29T00:00:00Z');
      expect(isFrenchHoliday(samedi)).toBe(false);
    });
  });

  // ─── Ajout de jours ouvrés ─────────────────────────────
  describe('addWorkingDays', () => {
    it('devrait ajouter des jours ouvrés en sautant le week-end', () => {
      const vendredi = new Date('2026-08-28T00:00:00Z');
      const result = addWorkingDays(vendredi, 3);
      // vendredi + 3 jours ouvrés = mercredi 2 septembre (saut week-end)
      expect(result.toISOString().split('T')[0]).toBe('2026-09-02');
    });

    it('devrait ajouter des jours ouvrés en évitant un jour férié', () => {
      const premierMai = new Date('2026-05-01T00:00:00Z'); // férié
      const result = addWorkingDays(premierMai, 3);
      // 1er mai (férié) + 3 jours ouvrés = 6 mai
      expect(result.toISOString().split('T')[0]).toBe('2026-05-06');
    });

    it('devrait gérer une période avec plusieurs jours fériés', () => {
      const date = new Date('2026-05-08T00:00:00Z'); // vendredi férié
      const result = addWorkingDays(date, 3);
      // 8 mai (férié) + week-end + 11 mai (lundi) = 12 mai (mardi)
      expect(result.toISOString().split('T')[0]).toBe('2026-05-13');
    });

    it('devrait retourner la même date si days = 0', () => {
      const date = new Date('2026-08-31T00:00:00Z');
      const result = addWorkingDays(date, 0);
      expect(result.toISOString().split('T')[0]).toBe('2026-08-31');
    });
  });

  // ─── Comptage entre deux dates ──────────────────────────
  describe('getWorkingDaysBetween', () => {
    it('devrait compter les jours ouvrés entre deux dates', () => {
      const start = new Date('2026-08-28T00:00:00Z');
      const end = new Date('2026-09-02T00:00:00Z');
      expect(getWorkingDaysBetween(start, end)).toBe(3);
    });

    it('devrait retourner 0 si les dates sont identiques', () => {
      const date = new Date('2026-08-31T00:00:00Z');
      expect(getWorkingDaysBetween(date, date)).toBe(0);
    });

    it('devrait compter correctement avec un jour férié dans la période', () => {
      const start = new Date('2026-04-30T00:00:00Z');
      const end = new Date('2026-05-06T00:00:00Z');
      // 1er mai férié, week-end 2-3 mai → jours ouvrés = 4, 5, 6
      expect(getWorkingDaysBetween(start, end)).toBe(3);
    });

    it('devrait compter correctement avec week-end et férié', () => {
      const start = new Date('2026-05-07T00:00:00Z');
      const end = new Date('2026-05-13T00:00:00Z');
      // 8 mai férié, 9-10 week-end → jours ouvrés = 11, 12
      expect(getWorkingDaysBetween(start, end)).toBe(3);
    });
  });

  // ─── Scénarios d’intégration ────────────────────────────
  describe('Scénarios réels', () => {
    it('OQTF avec délai de 30 jours ouvrés (exemple) – calcul approximatif', () => {
      const notification = new Date('2026-08-28T00:00:00Z'); // vendredi
      const deadline = addWorkingDays(notification, 30);
      // Devrait tomber vers le 9 octobre 2026 environ
      expect(deadline.toISOString().split('T')[0]).toBe('2026-10-09');
    });

    it('OQTF sans délai – 48h (reste en heures, pas de jours ouvrés)', () => {
      const notification = new Date('2026-08-28T14:00:00Z');
      // On ajoute 48h directement (fonction d'heures séparée)
      // Ici on teste juste que le service ne casse pas
      expect(isWorkingDay(notification)).toBe(true);
    });
  });

  // ─── Tests de performance (optionnel) ──────────────────
  describe('Performance', () => {
    it('devrait ajouter 100 jours ouvrés rapidement', () => {
      const start = new Date('2026-01-01T00:00:00Z');
      const startTime = performance.now();
      const result = addWorkingDays(start, 100);
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // moins de 100ms
      expect(result).toBeInstanceOf(Date);
    });

    it('devrait compter 1000 jours ouvrés rapidement', () => {
      const start = new Date('2020-01-01T00:00:00Z');
      const end = new Date('2025-01-01T00:00:00Z');
      const startTime = performance.now();
      const count = getWorkingDaysBetween(start, end);
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(200); // moins de 200ms
      expect(count).toBeGreaterThan(1000);
    });
  });
});
