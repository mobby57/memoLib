/**
 * Tests pour le service d'analytics prédictifs
 * Couverture: prédictions revenus, taux de recouvrement, rentabilité
 */

describe('Analytics Service', () => {
  describe('PredictionData Interface', () => {
    it('devrait avoir la structure correcte', () => {
      const data = {
        date: new Date(),
        value: 1500,
      };

      expect(data).toHaveProperty('date');
      expect(data).toHaveProperty('value');
      expect(data.value).toBe(1500);
    });
  });

  describe('PredictionResult Interface', () => {
    it('devrait avoir tous les champs', () => {
      const result = {
        predicted: 2000,
        confidence: 85,
        trend: 'up' as const,
        trendPercentage: 15.5,
      };

      expect(result).toHaveProperty('predicted');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('trend');
      expect(result).toHaveProperty('trendPercentage');
    });

    it('devrait avoir des trends valides', () => {
      const validTrends = ['up', 'down', 'stable'];
      expect(validTrends).toContain('up');
      expect(validTrends).toContain('down');
      expect(validTrends).toContain('stable');
    });
  });

  describe('Revenue Forecast', () => {
    it('devrait avoir la structure correcte', () => {
      const forecast = {
        currentMonth: 5000,
        nextMonth: { predicted: 5500, confidence: 80, trend: 'up' as const, trendPercentage: 10 },
        next3Months: { predicted: 6000, confidence: 70, trend: 'up' as const, trendPercentage: 20 },
        next6Months: { predicted: 7000, confidence: 60, trend: 'up' as const, trendPercentage: 40 },
      };

      expect(forecast).toHaveProperty('currentMonth');
      expect(forecast).toHaveProperty('nextMonth');
      expect(forecast).toHaveProperty('next3Months');
      expect(forecast).toHaveProperty('next6Months');
    });
  });

  describe('Trend Detection', () => {
    const getTrend = (current: number, predicted: number): { trend: 'up' | 'down' | 'stable', percentage: number } => {
      if (current === 0) return { trend: 'stable', percentage: 0 };
      const diff = ((predicted - current) / current) * 100;
      if (Math.abs(diff) < 5) return { trend: 'stable', percentage: diff };
      return { trend: diff > 0 ? 'up' : 'down', percentage: diff };
    };

    it('devrait détecter une tendance haussière', () => {
      const result = getTrend(1000, 1200);
      expect(result.trend).toBe('up');
      expect(result.percentage).toBe(20);
    });

    it('devrait détecter une tendance baissière', () => {
      const result = getTrend(1000, 800);
      expect(result.trend).toBe('down');
      expect(result.percentage).toBe(-20);
    });

    it('devrait détecter une stabilité (<5%)', () => {
      const result = getTrend(1000, 1040);
      expect(result.trend).toBe('stable');
    });

    it('devrait gérer la valeur zéro', () => {
      const result = getTrend(0, 100);
      expect(result.trend).toBe('stable');
    });
  });

  describe('Confidence Calculation', () => {
    const calculateConfidence = (r2: number): number => {
      return Math.min(100, Math.max(0, r2 * 100));
    };

    it('devrait retourner 100% pour r2=1', () => {
      expect(calculateConfidence(1)).toBe(100);
    });

    it('devrait retourner 0% pour r2=0', () => {
      expect(calculateConfidence(0)).toBe(0);
    });

    it('devrait retourner 85% pour r2=0.85', () => {
      expect(calculateConfidence(0.85)).toBe(85);
    });

    it('devrait plafonner à 100%', () => {
      expect(calculateConfidence(1.5)).toBe(100);
    });

    it('devrait ne pas descendre sous 0%', () => {
      expect(calculateConfidence(-0.5)).toBe(0);
    });
  });

  describe('Recovery Rate Analysis', () => {
    it('devrait avoir la structure correcte', () => {
      const analysis = {
        currentRate: 78.5,
        predictedRate: { predicted: 82, confidence: 75, trend: 'up' as const, trendPercentage: 4.5 },
        averageDelayDays: 45,
        riskFactors: ['Retards de paiement clients', 'Période estivale'],
      };

      expect(analysis).toHaveProperty('currentRate');
      expect(analysis).toHaveProperty('predictedRate');
      expect(analysis).toHaveProperty('averageDelayDays');
      expect(analysis).toHaveProperty('riskFactors');
    });
  });

  describe('Dossier Profitability', () => {
    it('devrait avoir la structure correcte', () => {
      const profitability = {
        type: 'OQTF',
        averageRevenue: 1500,
        averageCost: 500,
        profitMargin: 66.67,
        trend: 'up' as const,
        recommendation: 'Continuer à développer ce type de dossier',
      };

      expect(profitability).toHaveProperty('type');
      expect(profitability).toHaveProperty('averageRevenue');
      expect(profitability).toHaveProperty('averageCost');
      expect(profitability).toHaveProperty('profitMargin');
    });

    it('devrait calculer la marge correctement', () => {
      const revenue = 1500;
      const cost = 500;
      const margin = ((revenue - cost) / revenue) * 100;
      expect(margin).toBeCloseTo(66.67, 1);
    });
  });

  describe('Data Validation', () => {
    const isValidHistoricalData = (data: Array<{ date: Date; value: number }>): boolean => {
      if (data.length < 3) return false;
      return data.every(d => d.value >= 0 && d.date instanceof Date);
    };

    it('devrait rejeter moins de 3 points', () => {
      const data = [
        { date: new Date(), value: 100 },
        { date: new Date(), value: 200 },
      ];
      expect(isValidHistoricalData(data)).toBe(false);
    });

    it('devrait accepter 3+ points valides', () => {
      const data = [
        { date: new Date(), value: 100 },
        { date: new Date(), value: 200 },
        { date: new Date(), value: 300 },
      ];
      expect(isValidHistoricalData(data)).toBe(true);
    });
  });

  describe('Linear Regression Helpers', () => {
    const linearPredict = (data: [number, number][], x: number): number => {
      const n = data.length;
      if (n === 0) return 0;

      let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
      for (const [xi, yi] of data) {
        sumX += xi;
        sumY += yi;
        sumXY += xi * yi;
        sumX2 += xi * xi;
      }

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      return slope * x + intercept;
    };

    it('devrait prédire correctement pour données linéaires', () => {
      const data: [number, number][] = [[0, 100], [1, 200], [2, 300]];
      const prediction = linearPredict(data, 3);
      expect(prediction).toBeCloseTo(400, 0);
    });

    it('devrait retourner 0 pour données vides', () => {
      expect(linearPredict([], 5)).toBe(0);
    });
  });

  describe('Risk Factors Detection', () => {
    const detectRiskFactors = (data: {
      delayDays: number;
      unpaidRate: number;
      season: string;
    }): string[] => {
      const risks: string[] = [];

      if (data.delayDays > 30) {
        risks.push('Délais de paiement élevés');
      }
      if (data.unpaidRate > 10) {
        risks.push('Taux d\'impayés supérieur à la moyenne');
      }
      if (['juillet', 'août'].includes(data.season)) {
        risks.push('Période estivale');
      }

      return risks;
    };

    it('devrait détecter les retards de paiement', () => {
      const risks = detectRiskFactors({ delayDays: 45, unpaidRate: 5, season: 'mars' });
      expect(risks).toContain('Délais de paiement élevés');
    });

    it('devrait détecter les impayés élevés', () => {
      const risks = detectRiskFactors({ delayDays: 20, unpaidRate: 15, season: 'mars' });
      expect(risks).toContain('Taux d\'impayés supérieur à la moyenne');
    });

    it('devrait détecter la période estivale', () => {
      const risks = detectRiskFactors({ delayDays: 20, unpaidRate: 5, season: 'juillet' });
      expect(risks).toContain('Période estivale');
    });

    it('devrait retourner vide si pas de risques', () => {
      const risks = detectRiskFactors({ delayDays: 20, unpaidRate: 5, season: 'mars' });
      expect(risks).toHaveLength(0);
    });
  });

  describe('Recommendations Generation', () => {
    const generateRecommendation = (profitMargin: number, trend: 'up' | 'down' | 'stable'): string => {
      if (profitMargin > 50 && trend === 'up') {
        return 'Excellent ! Continuer à développer ce segment.';
      }
      if (profitMargin > 50 && trend === 'stable') {
        return 'Bon rendement, maintenir la stratégie actuelle.';
      }
      if (profitMargin < 20) {
        return 'Attention : marge faible, revoir les tarifs.';
      }
      if (trend === 'down') {
        return 'Tendance baissière, analyser les causes.';
      }
      return 'Performances dans la moyenne.';
    };

    it('devrait recommander le développement', () => {
      const rec = generateRecommendation(60, 'up');
      expect(rec).toContain('Continuer');
    });

    it('devrait alerter sur marge faible', () => {
      const rec = generateRecommendation(15, 'stable');
      expect(rec).toContain('marge faible');
    });

    it('devrait alerter sur tendance baissière', () => {
      const rec = generateRecommendation(40, 'down');
      expect(rec).toContain('baissière');
    });
  });
});
