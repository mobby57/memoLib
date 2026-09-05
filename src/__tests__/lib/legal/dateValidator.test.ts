import { describe, it, expect, vi } from 'vitest';
import { DateValidatorService, type ExtractedDates } from '@/lib/legal/dateValidator';

const validator = new DateValidatorService();

describe('DateValidatorService', () => {
  it('devrait valider des dates cohérentes', () => {
    // Fixe "maintenant" avant la deadline pour que la règle DEADLINE_NOT_PAST
    // (deadlineDate >= now) ne déclenche pas de warning et ne pénalise pas la confiance.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-06T00:00:00Z'));
    try {
      const dates: ExtractedDates = {
        decisionDate: '2026-08-01',
        notificationDate: '2026-08-05',
        deadlineDate: '2026-09-04',
      };
      const result = validator.validate(dates);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.confidence).toBeCloseTo(0.95, 1);
      expect(result.humanReviewRequired).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('devrait détecter une notification avant la décision', () => {
    const dates: ExtractedDates = {
      decisionDate: '2026-08-10',
      notificationDate: '2026-08-05',
    };
    const result = validator.validate(dates);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].field).toBe('notificationDate');
    expect(result.humanReviewRequired).toBe(true);
  });

  it('devrait détecter une date limite dans le passé', () => {
    const dates: ExtractedDates = {
      notificationDate: '2026-01-01',
      deadlineDate: '2026-01-15',
    };
    const now = new Date('2026-08-31');
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const result = validator.validate(dates);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0].ruleId).toBe('DEADLINE_NOT_PAST');
    vi.useRealTimers();
  });

  it('devrait générer une revue humaine si confiance basse', () => {
    const dates: ExtractedDates = {
      decisionDate: '2026-08-10',
      notificationDate: '2026-08-05',
      deadlineDate: '2026-07-01',
      hearingDate: '2026-01-01',
    };
    const result = validator.validate(dates);
    expect(result.humanReviewRequired).toBe(true);
    expect(result.confidence).toBeLessThan(0.7);
  });

  it('devrait gérer des dates null/undefined', () => {
    const dates: ExtractedDates = {};
    const result = validator.validate(dates);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('devrait ignorer les dates invalides (string non parseable)', () => {
    const dates: ExtractedDates = {
      decisionDate: 'not-a-date',
      notificationDate: '2026-08-05',
    };
    const result = validator.validate(dates);
    expect(result.errors).toHaveLength(0);
    expect(result.valid).toBe(true);
  });

  it('devrait détecter une audience avant la notification', () => {
    const dates: ExtractedDates = {
      notificationDate: '2026-08-10',
      hearingDate: '2026-08-05',
    };
    const result = validator.validate(dates);
    expect(result.valid).toBe(false);
    expect(result.errors[0].ruleId).toBe('HEARING_AFTER_NOTIFICATION');
  });

  it('devrait détecter un délai trop long (> 2 ans)', () => {
    const dates: ExtractedDates = {
      notificationDate: '2026-01-01',
      deadlineDate: '2028-06-01',
    };
    const result = validator.validate(dates);
    expect(result.warnings.some(w => w.ruleId === 'DEADLINE_REASONABLE')).toBe(true);
  });
});
