import { describe, it, expect } from 'vitest';
import { extractionPipeline } from '@/lib/services/extractionPipeline';

describe('ExtractionPipeline - Intégration', () => {
  it('devrait valider et corriger des dates incohérentes', () => {
    const raw = {
      decisionDate: '2026-08-10',
      notificationDate: '2026-08-05', // incohérent
    };
    const result = extractionPipeline.process(raw, { source: 'email' });
    expect(result.humanReviewRequired).toBe(true);
    expect(result.correctionsApplied).toContain('NOTIFICATION_SHIFTED_TO_DECISION');
    expect(result.validated.notificationDate).toBe('2026-08-10');
  });

  it('devrait proposer une deadline par défaut si manquante', () => {
    const raw = {
      notificationDate: '2026-08-01',
    };
    const result = extractionPipeline.process(raw);
    expect(result.validated.deadlineDate).toBe('2026-08-31'); // 30 jours plus tard
    expect(result.correctionsApplied).toContain('DEADLINE_DEFAULT_30_DAYS');
  });

  it('devrait ne pas corriger si les dates sont cohérentes', () => {
    const raw = {
      decisionDate: '2026-08-01',
      notificationDate: '2026-08-05',
      deadlineDate: '2026-09-04',
    };
    const result = extractionPipeline.process(raw);
    expect(result.correctionsApplied).toHaveLength(0);
    expect(result.humanReviewRequired).toBe(false);
    expect(result.finalConfidence).toBeGreaterThan(0.8);
  });
});
