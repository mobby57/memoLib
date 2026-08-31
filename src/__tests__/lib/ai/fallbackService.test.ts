import { describe, it, expect } from 'vitest';
import { FallbackService } from '@/lib/ai/fallbackService';

const service = new FallbackService();

describe('FallbackService', () => {
  describe('voteDate', () => {
    it('devrait retourner une date si toutes les sources concordent', () => {
      const result = service.voteDate(
        '2026-09-01',
        '2026-09-01',
        '2026-09-01'
      );
      expect(result.value).toBe('2026-09-01');
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.humanReviewRequired).toBe(false);
      expect(result.selectedSource).toBe('ia');
    });

    it('devrait détecter un désaccord et demander une revue humaine', () => {
      const result = service.voteDate(
        '2026-09-01',
        '2026-09-02',
        '2026-09-01'
      );
      expect(result.value).toBe('2026-09-01'); // IA a la plus haute confiance
      expect(result.humanReviewRequired).toBe(true);
      expect(result.selectedSource).toBe('ia');
    });

    it('devrait retourner null si aucune source', () => {
      const result = service.voteDate(null, null, null);
      expect(result.value).toBeNull();
      expect(result.humanReviewRequired).toBe(true);
      expect(result.selectedSource).toBe('fallback');
    });

    it('devrait utiliser la règle si IA et regex échouent', () => {
      const result = service.voteDate(null, null, '2026-09-01');
      expect(result.value).toBe('2026-09-01');
      expect(result.confidence).toBe(0.7);
      expect(result.selectedSource).toBe('rule');
    });
  });

  describe('voteType', () => {
    it('devrait retourner le type si accord', () => {
      const result = service.voteType('OQTF', 'OQTF');
      expect(result.value).toBe('OQTF');
      expect(result.confidence).toBe(0.9);
      expect(result.humanReviewRequired).toBe(false);
    });

    it('devrait demander une revue si désaccord', () => {
      const result = service.voteType('OQTF', 'ASILE');
      expect(result.value).toBe('OQTF');
      expect(result.humanReviewRequired).toBe(true);
    });
  });
});
