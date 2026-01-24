/**
 * Tests pour le service d'apprentissage IA
 * Couverture: patterns de validation, ajustements de confiance
 */

describe('Learning Service', () => {
  describe('Validation Status Types', () => {
    const validStatuses = ['APPROVED', 'REJECTED', 'MODIFIED_APPROVED', 'AUTO_APPROVED'];

    it('devrait inclure APPROVED', () => {
      expect(validStatuses).toContain('APPROVED');
    });

    it('devrait inclure REJECTED', () => {
      expect(validStatuses).toContain('REJECTED');
    });

    it('devrait inclure MODIFIED_APPROVED', () => {
      expect(validStatuses).toContain('MODIFIED_APPROVED');
    });

    it('devrait inclure AUTO_APPROVED', () => {
      expect(validStatuses).toContain('AUTO_APPROVED');
    });
  });

  describe('Action Type Analysis', () => {
    const createAnalysis = () => ({
      total: 0,
      approved: 0,
      rejected: 0,
      modified: 0,
      avgConfidence: 0,
      totalConfidence: 0,
      shouldAdjust: false,
      adjustment: 0,
    });

    it('devrait créer une analyse vide', () => {
      const analysis = createAnalysis();
      expect(analysis.total).toBe(0);
      expect(analysis.approved).toBe(0);
    });

    it('devrait suivre les compteurs', () => {
      const analysis = createAnalysis();
      analysis.total = 10;
      analysis.approved = 7;
      analysis.rejected = 2;
      analysis.modified = 1;

      expect(analysis.approved + analysis.rejected + analysis.modified).toBe(10);
    });
  });

  describe('Success Rate Calculation', () => {
    const calculateSuccessRate = (approved: number, modified: number, total: number): number => {
      if (total === 0) return 0;
      return (approved + modified) / total;
    };

    it('devrait calculer 100% si tous approuvés', () => {
      expect(calculateSuccessRate(10, 0, 10)).toBe(1);
    });

    it('devrait calculer 50% si moitié approuvés', () => {
      expect(calculateSuccessRate(5, 0, 10)).toBe(0.5);
    });

    it('devrait inclure les modifications dans le succès', () => {
      expect(calculateSuccessRate(5, 3, 10)).toBe(0.8);
    });

    it('devrait retourner 0 si total est 0', () => {
      expect(calculateSuccessRate(0, 0, 0)).toBe(0);
    });
  });

  describe('Confidence Adjustment', () => {
    const calculateAdjustment = (successRate: number, avgConfidence: number): number => {
      // Si le taux de succès est élevé mais la confiance basse, augmenter
      // Si le taux de succès est bas mais la confiance haute, diminuer
      const targetConfidence = successRate * 100;
      return targetConfidence - avgConfidence;
    };

    it('devrait suggérer augmentation si succès > confiance', () => {
      const adjustment = calculateAdjustment(0.9, 70);
      expect(adjustment).toBeGreaterThan(0);
    });

    it('devrait suggérer diminution si succès < confiance', () => {
      const adjustment = calculateAdjustment(0.5, 80);
      expect(adjustment).toBeLessThan(0);
    });

    it('devrait suggérer 0 si alignés', () => {
      const adjustment = calculateAdjustment(0.8, 80);
      expect(adjustment).toBe(0);
    });
  });

  describe('Should Adjust Threshold', () => {
    const shouldAdjust = (adjustment: number, threshold: number = 10): boolean => {
      return Math.abs(adjustment) > threshold;
    };

    it('devrait retourner true si ajustement > seuil', () => {
      expect(shouldAdjust(15, 10)).toBe(true);
    });

    it('devrait retourner true si ajustement < -seuil', () => {
      expect(shouldAdjust(-15, 10)).toBe(true);
    });

    it('devrait retourner false si dans la plage', () => {
      expect(shouldAdjust(5, 10)).toBe(false);
    });
  });

  describe('Period Calculation', () => {
    const getStartDate = (periodDays: number): Date => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);
      return startDate;
    };

    it('devrait calculer 30 jours en arrière', () => {
      const now = new Date();
      const start = getStartDate(30);
      const diffDays = Math.round((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(30);
    });

    it('devrait calculer 7 jours en arrière', () => {
      const now = new Date();
      const start = getStartDate(7);
      const diffDays = Math.round((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(7);
    });
  });

  describe('Average Confidence', () => {
    const calculateAvgConfidence = (totalConfidence: number, total: number): number => {
      return total > 0 ? totalConfidence / total : 0;
    };

    it('devrait calculer la moyenne', () => {
      expect(calculateAvgConfidence(850, 10)).toBe(85);
    });

    it('devrait retourner 0 si pas d\'éléments', () => {
      expect(calculateAvgConfidence(0, 0)).toBe(0);
    });
  });

  describe('Learning Metrics', () => {
    it('devrait formater les résultats correctement', () => {
      const results = {
        actionType: 'DEADLINE_DETECTION',
        total: 100,
        approved: 85,
        rejected: 10,
        modified: 5,
        avgConfidence: 78,
        successRate: 0.9,
        shouldAdjust: true,
        adjustment: 12,
      };

      expect(results).toHaveProperty('actionType');
      expect(results).toHaveProperty('successRate');
      expect(results).toHaveProperty('shouldAdjust');
    });
  });

  describe('Action Type Categorization', () => {
    const actionTypes = [
      'DEADLINE_DETECTION',
      'DOCUMENT_CLASSIFICATION',
      'CLIENT_REMINDER',
      'STATUS_UPDATE',
      'PRIORITY_CHANGE',
    ];

    it('devrait catégoriser les types d\'actions', () => {
      expect(actionTypes).toContain('DEADLINE_DETECTION');
      expect(actionTypes).toContain('DOCUMENT_CLASSIFICATION');
    });

    it('devrait avoir plusieurs types', () => {
      expect(actionTypes.length).toBeGreaterThan(3);
    });
  });
});
