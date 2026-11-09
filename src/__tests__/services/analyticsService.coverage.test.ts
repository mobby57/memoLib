/**
 * Tests pour src/lib/services/analyticsService.ts
 */
import { describe, it, expect } from 'vitest';
import {
  predictRevenue,
  analyzeRecoveryRate,
  analyzeDossierProfitability,
  predictNewClients,
  calculateFinancialHealthScore,
} from '@/lib/services/analyticsService';

describe('analyticsService.ts — Full Coverage', () => {
  describe('predictRevenue', () => {
    it('should return zeros for insufficient data', () => {
      const result = predictRevenue([{ date: new Date(), value: 1000 }]);
      expect(result.currentMonth).toBe(1000);
      expect(result.nextMonth.confidence).toBe(0);
    });

    it('should return zeros for empty data', () => {
      const result = predictRevenue([]);
      expect(result.currentMonth).toBe(0);
    });

    it('should predict upward trend', () => {
      const data = [
        { date: new Date('2025-01-01'), value: 1000 },
        { date: new Date('2025-02-01'), value: 1200 },
        { date: new Date('2025-03-01'), value: 1400 },
        { date: new Date('2025-04-01'), value: 1600 },
        { date: new Date('2025-05-01'), value: 1800 },
      ];
      const result = predictRevenue(data);
      expect(result.currentMonth).toBe(1800);
      expect(result.nextMonth.predicted).toBeGreaterThan(1800);
      expect(result.nextMonth.trend).toBe('up');
      expect(result.nextMonth.confidence).toBeGreaterThan(0);
      expect(result.next3Months.confidence).toBeLessThan(result.nextMonth.confidence);
      expect(result.next6Months.confidence).toBeLessThan(result.next3Months.confidence);
    });

    it('should predict downward trend', () => {
      const data = [
        { date: new Date('2025-01-01'), value: 5000 },
        { date: new Date('2025-02-01'), value: 4000 },
        { date: new Date('2025-03-01'), value: 3000 },
        { date: new Date('2025-04-01'), value: 2000 },
      ];
      const result = predictRevenue(data);
      expect(result.nextMonth.trend).toBe('down');
    });

    it('should predict stable trend', () => {
      const data = [
        { date: new Date('2025-01-01'), value: 1000 },
        { date: new Date('2025-02-01'), value: 1010 },
        { date: new Date('2025-03-01'), value: 1005 },
        { date: new Date('2025-04-01'), value: 1015 },
      ];
      const result = predictRevenue(data);
      expect(result.nextMonth.trend).toBe('stable');
    });

    it('should not predict negative values', () => {
      const data = [
        { date: new Date('2025-01-01'), value: 100 },
        { date: new Date('2025-02-01'), value: 50 },
        { date: new Date('2025-03-01'), value: 10 },
      ];
      const result = predictRevenue(data);
      expect(result.next6Months.predicted).toBeGreaterThanOrEqual(0);
    });
  });

  describe('analyzeRecoveryRate', () => {
    it('should calculate rate for paid factures', () => {
      const factures = [
        { montant: 1000, statut: 'PAYEE', dateEmission: new Date('2025-01-01'), datePaiement: new Date('2025-01-15') },
        { montant: 2000, statut: 'PAYEE', dateEmission: new Date('2025-02-01'), datePaiement: new Date('2025-02-20') },
        { montant: 1500, statut: 'EN_ATTENTE', dateEmission: new Date('2025-03-01') },
      ];
      const result = analyzeRecoveryRate(factures);
      expect(result.currentRate).toBeCloseTo(66.67, 0);
      expect(result.averageDelayDays).toBeGreaterThan(0);
    });

    it('should handle empty factures', () => {
      const result = analyzeRecoveryRate([]);
      expect(result.currentRate).toBe(0);
      expect(result.averageDelayDays).toBe(0);
    });

    it('should identify risk factors for low rate', () => {
      const factures = [
        { montant: 1000, statut: 'EN_ATTENTE', dateEmission: new Date('2024-01-01') },
        { montant: 2000, statut: 'EN_ATTENTE', dateEmission: new Date('2024-02-01') },
        { montant: 500, statut: 'PAYEE', dateEmission: new Date('2024-03-01'), datePaiement: new Date('2024-05-01') },
      ];
      const result = analyzeRecoveryRate(factures);
      expect(result.riskFactors).toContain('Taux de recouvrement faible');
      expect(result.riskFactors.some(r => r.includes('facture(s) en retard'))).toBe(true);
    });

    it('should identify long payment delay risk', () => {
      const factures = [
        { montant: 1000, statut: 'PAYEE', dateEmission: new Date('2025-01-01'), datePaiement: new Date('2025-03-01') }, // ~60 days
        { montant: 1000, statut: 'PAYEE', dateEmission: new Date('2025-02-01'), datePaiement: new Date('2025-04-01') },
      ];
      const result = analyzeRecoveryRate(factures);
      expect(result.averageDelayDays).toBeGreaterThan(45);
      expect(result.riskFactors).toContain('Delais de paiement trop longs');
    });

    it('should exclude BROUILLON from total', () => {
      const factures = [
        { montant: 1000, statut: 'BROUILLON', dateEmission: new Date() },
        { montant: 2000, statut: 'PAYEE', dateEmission: new Date('2025-01-01'), datePaiement: new Date('2025-01-10') },
      ];
      const result = analyzeRecoveryRate(factures);
      expect(result.currentRate).toBe(100);
    });
  });

  describe('analyzeDossierProfitability', () => {
    it('should analyze profitability by type', () => {
      const dossiers = [
        { type: 'OQTF', montantFacture: 3000, heuresTravaillees: 10, tauxHoraire: 150 },
        { type: 'OQTF', montantFacture: 2500, heuresTravaillees: 8, tauxHoraire: 150 },
        { type: 'TITRE_SEJOUR', montantFacture: 1000, heuresTravaillees: 5, tauxHoraire: 150 },
      ];
      const result = analyzeDossierProfitability(dossiers);
      expect(result).toHaveLength(2);
      expect(result[0].type).toBeDefined();
      expect(result[0].profitMargin).toBeGreaterThan(0);
      expect(result[0].recommendation).toBeDefined();
    });

    it('should handle dossiers without montantFacture', () => {
      const dossiers = [
        { type: 'OQTF', heuresTravaillees: 10 },
      ];
      const result = analyzeDossierProfitability(dossiers);
      expect(result[0].averageRevenue).toBe(0);
      expect(result[0].profitMargin).toBe(0);
    });

    it('should sort by profitability descending', () => {
      const dossiers = [
        { type: 'LOW', montantFacture: 100, heuresTravaillees: 10, tauxHoraire: 100 },
        { type: 'HIGH', montantFacture: 10000, heuresTravaillees: 2, tauxHoraire: 100 },
      ];
      const result = analyzeDossierProfitability(dossiers);
      expect(result[0].type).toBe('HIGH');
    });

    it('should generate appropriate recommendations', () => {
      const dossiers = [
        { type: 'VERY_PROFITABLE', montantFacture: 10000, heuresTravaillees: 1, tauxHoraire: 100 },
        { type: 'AVERAGE', montantFacture: 2000, heuresTravaillees: 5, tauxHoraire: 150 },
        { type: 'LOW_MARGIN', montantFacture: 500, heuresTravaillees: 3, tauxHoraire: 150 },
        { type: 'LOSS', montantFacture: 100, heuresTravaillees: 10, tauxHoraire: 200 },
      ];
      const result = analyzeDossierProfitability(dossiers);
      expect(result.find(r => r.type === 'VERY_PROFITABLE')?.recommendation).toContain('rentable');
      expect(result.find(r => r.type === 'LOSS')?.recommendation).toContain('Augmentez');
    });

    it('should use default hourly rate when not provided', () => {
      const dossiers = [
        { type: 'TEST', montantFacture: 5000, heuresTravaillees: 10 },
      ];
      const result = analyzeDossierProfitability(dossiers);
      expect(result[0].averageCost).toBe(1500); // 10 * 150 default
    });
  });

  describe('predictNewClients', () => {
    it('should return default for insufficient data', () => {
      const result = predictNewClients([{ date: new Date(), count: 5 }]);
      expect(result.predicted).toBe(0);
      expect(result.confidence).toBe(0);
      expect(result.trend).toBe('stable');
    });

    it('should predict growing clients', () => {
      const data = [
        { date: new Date('2025-01-01'), count: 3 },
        { date: new Date('2025-02-01'), count: 5 },
        { date: new Date('2025-03-01'), count: 7 },
        { date: new Date('2025-04-01'), count: 9 },
      ];
      const result = predictNewClients(data);
      expect(result.predicted).toBeGreaterThan(9);
      expect(result.trend).toBe('up');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle decreasing trend', () => {
      const data = [
        { date: new Date('2025-01-01'), count: 10 },
        { date: new Date('2025-02-01'), count: 8 },
        { date: new Date('2025-03-01'), count: 6 },
        { date: new Date('2025-04-01'), count: 4 },
      ];
      const result = predictNewClients(data);
      expect(result.trend).toBe('down');
    });
  });

  describe('calculateFinancialHealthScore', () => {
    it('should return grade A for excellent metrics', () => {
      const result = calculateFinancialHealthScore({
        revenueGrowth: 25,
        recoveryRate: 95,
        profitMargin: 35,
        clientRetention: 85,
        cashflow: 60000,
      });
      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.grade).toBe('A');
      expect(result.strengths.length).toBeGreaterThan(0);
      expect(result.weaknesses).toHaveLength(0);
    });

    it('should return grade F for poor metrics', () => {
      const result = calculateFinancialHealthScore({
        revenueGrowth: -5,
        recoveryRate: 50,
        profitMargin: 5,
        clientRetention: 30,
        cashflow: -1000,
      });
      expect(result.grade).toBe('F');
      expect(result.weaknesses.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should return grade B', () => {
      const result = calculateFinancialHealthScore({
        revenueGrowth: 15,
        recoveryRate: 85,
        profitMargin: 25,
        clientRetention: 70,
        cashflow: 30000,
      });
      expect(result.score).toBeGreaterThan(0);
      expect(['A', 'B', 'C', 'D', 'F']).toContain(result.grade);
    });

    it('should return grade C', () => {
      const result = calculateFinancialHealthScore({
        revenueGrowth: 5,
        recoveryRate: 75,
        profitMargin: 15,
        clientRetention: 50,
        cashflow: 10000,
      });
      expect(result.score).toBeGreaterThan(0);
      expect(['A', 'B', 'C', 'D', 'F']).toContain(result.grade);
    });

    it('should identify specific strengths and weaknesses', () => {
      const result = calculateFinancialHealthScore({
        revenueGrowth: 25,
        recoveryRate: 50,
        profitMargin: 35,
        clientRetention: 85,
        cashflow: -500,
      });
      expect(result.strengths).toContain('Forte croissance des revenus');
      expect(result.strengths).toContain('Marge beneficiaire elevee');
      expect(result.weaknesses).toContain('Taux de recouvrement faible');
      expect(result.weaknesses).toContain('Probleme de tresorerie');
    });

    it('should handle moderate metrics (grade D)', () => {
      const result = calculateFinancialHealthScore({
        revenueGrowth: -2,
        recoveryRate: 65,
        profitMargin: 8,
        clientRetention: 35,
        cashflow: 2000,
      });
      expect(['D', 'F']).toContain(result.grade);
      expect(result.score).toBeLessThan(70);
    });
  });
});
