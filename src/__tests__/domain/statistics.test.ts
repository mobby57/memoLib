/**
 * Tests pour les statistiques et analytics
 * Couverture: métriques, agrégations, rapports, KPIs
 */

describe('Statistics', () => {
  describe('Basic Metrics', () => {
    const calculateSum = (values: number[]): number => {
      return values.reduce((sum, val) => sum + val, 0);
    };

    const calculateAverage = (values: number[]): number => {
      if (values.length === 0) return 0;
      return calculateSum(values) / values.length;
    };

    const calculateMedian = (values: number[]): number => {
      if (values.length === 0) return 0;
      const sorted = [...values].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    };

    const calculateMin = (values: number[]): number => {
      if (values.length === 0) return 0;
      return Math.min(...values);
    };

    const calculateMax = (values: number[]): number => {
      if (values.length === 0) return 0;
      return Math.max(...values);
    };

    it('devrait calculer la somme', () => {
      expect(calculateSum([1, 2, 3, 4, 5])).toBe(15);
    });

    it('devrait calculer la moyenne', () => {
      expect(calculateAverage([2, 4, 6])).toBe(4);
    });

    it('devrait calculer la médiane impaire', () => {
      expect(calculateMedian([1, 2, 3, 4, 5])).toBe(3);
    });

    it('devrait calculer la médiane paire', () => {
      expect(calculateMedian([1, 2, 3, 4])).toBe(2.5);
    });

    it('devrait calculer le min', () => {
      expect(calculateMin([5, 2, 8, 1])).toBe(1);
    });

    it('devrait calculer le max', () => {
      expect(calculateMax([5, 2, 8, 1])).toBe(8);
    });
  });

  describe('Time Series', () => {
    interface DataPoint {
      timestamp: Date;
      value: number;
    }

    const aggregateByDay = (data: DataPoint[]): Map<string, number> => {
      const result = new Map<string, number>();
      
      for (const point of data) {
        const day = point.timestamp.toISOString().split('T')[0];
        result.set(day, (result.get(day) || 0) + point.value);
      }
      
      return result;
    };

    it('devrait agréger par jour', () => {
      const data: DataPoint[] = [
        { timestamp: new Date('2024-01-01T10:00'), value: 5 },
        { timestamp: new Date('2024-01-01T14:00'), value: 3 },
        { timestamp: new Date('2024-01-02T10:00'), value: 7 },
      ];
      const result = aggregateByDay(data);
      expect(result.get('2024-01-01')).toBe(8);
      expect(result.get('2024-01-02')).toBe(7);
    });
  });

  describe('Growth Rate', () => {
    const calculateGrowthRate = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    it('devrait calculer une croissance positive', () => {
      expect(calculateGrowthRate(150, 100)).toBe(50);
    });

    it('devrait calculer une croissance négative', () => {
      expect(calculateGrowthRate(80, 100)).toBe(-20);
    });

    it('devrait gérer une valeur précédente de 0', () => {
      expect(calculateGrowthRate(100, 0)).toBe(100);
    });
  });

  describe('Percentages', () => {
    const calculatePercentage = (value: number, total: number): number => {
      if (total === 0) return 0;
      return (value / total) * 100;
    };

    const formatPercentage = (value: number, decimals: number = 1): string => {
      return `${value.toFixed(decimals)}%`;
    };

    it('devrait calculer le pourcentage', () => {
      expect(calculatePercentage(25, 100)).toBe(25);
      expect(calculatePercentage(1, 4)).toBe(25);
    });

    it('devrait formater le pourcentage', () => {
      expect(formatPercentage(25.567, 1)).toBe('25.6%');
    });
  });

  describe('Distribution', () => {
    const calculateDistribution = <T>(
      items: T[],
      getKey: (item: T) => string
    ): Map<string, number> => {
      const distribution = new Map<string, number>();
      
      for (const item of items) {
        const key = getKey(item);
        distribution.set(key, (distribution.get(key) || 0) + 1);
      }
      
      return distribution;
    };

    it('devrait calculer la distribution', () => {
      const items = [
        { status: 'active' },
        { status: 'active' },
        { status: 'pending' },
        { status: 'completed' },
      ];
      const dist = calculateDistribution(items, i => i.status);
      expect(dist.get('active')).toBe(2);
      expect(dist.get('pending')).toBe(1);
    });
  });
});

describe('KPIs', () => {
  describe('Dossier KPIs', () => {
    interface DossierStats {
      total: number;
      enCours: number;
      termines: number;
      enRetard: number;
    }

    const calculateDossierKPIs = (stats: DossierStats) => {
      return {
        tauxCompletion: stats.total > 0 ? (stats.termines / stats.total) * 100 : 0,
        tauxRetard: stats.total > 0 ? (stats.enRetard / stats.total) * 100 : 0,
        enCoursRatio: stats.total > 0 ? (stats.enCours / stats.total) * 100 : 0,
      };
    };

    it('devrait calculer le taux de complétion', () => {
      const kpis = calculateDossierKPIs({ total: 100, enCours: 30, termines: 60, enRetard: 10 });
      expect(kpis.tauxCompletion).toBe(60);
    });

    it('devrait calculer le taux de retard', () => {
      const kpis = calculateDossierKPIs({ total: 100, enCours: 30, termines: 60, enRetard: 10 });
      expect(kpis.tauxRetard).toBe(10);
    });

    it('devrait gérer zéro dossiers', () => {
      const kpis = calculateDossierKPIs({ total: 0, enCours: 0, termines: 0, enRetard: 0 });
      expect(kpis.tauxCompletion).toBe(0);
    });
  });

  describe('Financial KPIs', () => {
    interface FinancialStats {
      totalFacture: number;
      totalPaye: number;
      totalImpaye: number;
      nombreFactures: number;
    }

    const calculateFinancialKPIs = (stats: FinancialStats) => {
      return {
        tauxRecouvrement: stats.totalFacture > 0 
          ? (stats.totalPaye / stats.totalFacture) * 100 
          : 0,
        moyenneFacture: stats.nombreFactures > 0 
          ? stats.totalFacture / stats.nombreFactures 
          : 0,
        tauxImpaye: stats.totalFacture > 0 
          ? (stats.totalImpaye / stats.totalFacture) * 100 
          : 0,
      };
    };

    it('devrait calculer le taux de recouvrement', () => {
      const kpis = calculateFinancialKPIs({
        totalFacture: 10000,
        totalPaye: 8000,
        totalImpaye: 2000,
        nombreFactures: 50,
      });
      expect(kpis.tauxRecouvrement).toBe(80);
    });

    it('devrait calculer la moyenne des factures', () => {
      const kpis = calculateFinancialKPIs({
        totalFacture: 10000,
        totalPaye: 8000,
        totalImpaye: 2000,
        nombreFactures: 50,
      });
      expect(kpis.moyenneFacture).toBe(200);
    });
  });

  describe('Performance KPIs', () => {
    const calculateAverageProcessingTime = (durations: number[]): number => {
      if (durations.length === 0) return 0;
      return durations.reduce((sum, d) => sum + d, 0) / durations.length;
    };

    const calculateThroughput = (count: number, days: number): number => {
      if (days === 0) return 0;
      return count / days;
    };

    it('devrait calculer le temps moyen de traitement', () => {
      const durations = [5, 10, 15, 20]; // jours
      expect(calculateAverageProcessingTime(durations)).toBe(12.5);
    });

    it('devrait calculer le débit', () => {
      expect(calculateThroughput(100, 30)).toBeCloseTo(3.33, 1);
    });
  });
});

describe('Reports', () => {
  describe('Report Generation', () => {
    interface ReportConfig {
      type: 'daily' | 'weekly' | 'monthly' | 'yearly';
      startDate: Date;
      endDate: Date;
      metrics: string[];
    }

    const generateDateRange = (start: Date, end: Date): Date[] => {
      const dates: Date[] = [];
      const current = new Date(start);
      
      while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      
      return dates;
    };

    it('devrait générer une plage de dates', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-05');
      const range = generateDateRange(start, end);
      expect(range).toHaveLength(5);
    });
  });

  describe('Report Formatting', () => {
    const formatNumber = (value: number, locale: string = 'fr-FR'): string => {
      return new Intl.NumberFormat(locale).format(value);
    };

    const formatCurrency = (value: number, currency: string = 'EUR'): string => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency,
      }).format(value);
    };

    it('devrait formater un nombre en français', () => {
      const formatted = formatNumber(1234567.89);
      expect(formatted).toContain('1');
    });

    it('devrait formater une devise', () => {
      const formatted = formatCurrency(1234.56);
      expect(formatted).toContain('€');
    });
  });
});

describe('Trends', () => {
  describe('Trend Detection', () => {
    type Trend = 'up' | 'down' | 'stable';

    const detectTrend = (values: number[], threshold: number = 0.05): Trend => {
      if (values.length < 2) return 'stable';
      
      const first = values[0];
      const last = values[values.length - 1];
      const change = (last - first) / first;
      
      if (change > threshold) return 'up';
      if (change < -threshold) return 'down';
      return 'stable';
    };

    it('devrait détecter une tendance à la hausse', () => {
      expect(detectTrend([100, 110, 120, 130])).toBe('up');
    });

    it('devrait détecter une tendance à la baisse', () => {
      expect(detectTrend([100, 90, 80, 70])).toBe('down');
    });

    it('devrait détecter une tendance stable', () => {
      expect(detectTrend([100, 101, 99, 100])).toBe('stable');
    });
  });

  describe('Moving Average', () => {
    const calculateMovingAverage = (values: number[], window: number): number[] => {
      if (values.length < window) return [];
      
      const result: number[] = [];
      for (let i = window - 1; i < values.length; i++) {
        const windowValues = values.slice(i - window + 1, i + 1);
        const avg = windowValues.reduce((sum, v) => sum + v, 0) / window;
        result.push(avg);
      }
      
      return result;
    };

    it('devrait calculer la moyenne mobile', () => {
      const values = [1, 2, 3, 4, 5];
      const ma = calculateMovingAverage(values, 3);
      expect(ma).toHaveLength(3);
      expect(ma[0]).toBe(2); // (1+2+3)/3
      expect(ma[1]).toBe(3); // (2+3+4)/3
      expect(ma[2]).toBe(4); // (3+4+5)/3
    });
  });
});

describe('Comparisons', () => {
  describe('Period Comparison', () => {
    interface PeriodData {
      current: number;
      previous: number;
    }

    const comparePeriods = (data: PeriodData) => {
      const difference = data.current - data.previous;
      const percentageChange = data.previous !== 0 
        ? (difference / data.previous) * 100 
        : 0;
      
      return {
        difference,
        percentageChange,
        trend: percentageChange > 0 ? 'up' : percentageChange < 0 ? 'down' : 'stable',
      };
    };

    it('devrait comparer les périodes avec augmentation', () => {
      const result = comparePeriods({ current: 150, previous: 100 });
      expect(result.difference).toBe(50);
      expect(result.percentageChange).toBe(50);
      expect(result.trend).toBe('up');
    });

    it('devrait comparer les périodes avec diminution', () => {
      const result = comparePeriods({ current: 80, previous: 100 });
      expect(result.difference).toBe(-20);
      expect(result.percentageChange).toBe(-20);
      expect(result.trend).toBe('down');
    });
  });
});
