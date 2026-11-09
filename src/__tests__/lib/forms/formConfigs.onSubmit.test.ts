/**
 * Tests pour src/lib/forms/formConfigs.ts — onSubmit functions
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

import { resourceRequestForm, strategicDecisionForm, riskAssessmentForm } from '@/lib/forms/formConfigs';

describe('formConfigs.ts — onSubmit Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true });
  });

  describe('resourceRequestForm.onSubmit', () => {
    it('should POST to /api/forms/resource-request', async () => {
      const data = { resourceType: 'human', justification: 'Need help', urgency: 'high' };
      await resourceRequestForm.onSubmit!(data);
      expect(mockFetch).toHaveBeenCalledWith('/api/forms/resource-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    });

    it('should throw on failed response', async () => {
      mockFetch.mockResolvedValue({ ok: false });
      await expect(resourceRequestForm.onSubmit!({ test: true }))
        .rejects.toThrow('Erreur lors de la soumission');
    });
  });

  describe('strategicDecisionForm.onSubmit', () => {
    it('should POST to /api/forms/strategic-decision', async () => {
      const data = { decisionTitle: 'Open new office' };
      await strategicDecisionForm.onSubmit!(data);
      expect(mockFetch).toHaveBeenCalledWith('/api/forms/strategic-decision', expect.objectContaining({
        method: 'POST',
      }));
    });

    it('should throw on failed response', async () => {
      mockFetch.mockResolvedValue({ ok: false });
      await expect(strategicDecisionForm.onSubmit!({ test: true }))
        .rejects.toThrow('Erreur lors de la soumission');
    });
  });

  describe('riskAssessmentForm.onSubmit', () => {
    it('should POST to /api/forms/risk-assessment', async () => {
      const data = { riskCategory: 'financial', severity: 'major' };
      await riskAssessmentForm.onSubmit!(data);
      expect(mockFetch).toHaveBeenCalledWith('/api/forms/risk-assessment', expect.objectContaining({
        method: 'POST',
      }));
    });

    it('should throw on failed response', async () => {
      mockFetch.mockResolvedValue({ ok: false });
      await expect(riskAssessmentForm.onSubmit!({ test: true }))
        .rejects.toThrow('Erreur lors de la soumission');
    });
  });
});
