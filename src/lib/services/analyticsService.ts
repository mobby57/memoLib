/**
 * Service d'analytics predictifs
 * Utilise la regression lineaire pour prevoir les tendances
 */

import regression from 'regression';

export interface PredictionData {
  date: Date;
  value: number;
}

export interface PredictionResult {
  predicted: number;
  confidence: number; // 0-100%
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface RevenueForecast {
  currentMonth: number;
  nextMonth: PredictionResult;
  next3Months: PredictionResult;
  next6Months: PredictionResult;
}

export interface RecoveryRateAnalysis {
  currentRate: number;
  predictedRate: PredictionResult;
  averageDelayDays: number;
  riskFactors: string[];
}

export interface DossierProfitability {
  type: string;
  averageRevenue: number;
  averageCost: number;
  profitMargin: number;
  trend: 'up' | 'down' | 'stable';
  recommendation: string;
}

/**
 * Prevision des revenus basee sur l'historique
 */
export function predictRevenue(historicalData: PredictionData[]): RevenueForecast {
  if (historicalData.length < 3) {
    return {
      currentMonth: historicalData[historicalData.length - 1]?.value || 0,
      nextMonth: { predicted: 0, confidence: 0, trend: 'stable', trendPercentage: 0 },
      next3Months: { predicted: 0, confidence: 0, trend: 'stable', trendPercentage: 0 },
      next6Months: { predicted: 0, confidence: 0, trend: 'stable', trendPercentage: 0 },
    };
  }

  // Preparer les donnees pour la regression (x = mois, y = revenu)
  const data: [number, number][] = historicalData.map((point, index) => [index, point.value]);
  
  // Regression lineaire
  const result = regression.linear(data);
  
  const currentMonth = historicalData[historicalData.length - 1].value;
  const nextIndex = historicalData.length;
  
  // Predictions
  const nextMonth = result.predict(nextIndex)[1];
  const next3Months = result.predict(nextIndex + 2)[1];
  const next6Months = result.predict(nextIndex + 5)[1];
  
  // Calculer la confiance basee sur le R²
  const confidence = Math.min(100, Math.max(0, result.r2 * 100));
  
  // Detecter la tendance
  const getTrend = (current: number, predicted: number): { trend: 'up' | 'down' | 'stable', percentage: number } => {
    const diff = ((predicted - current) / current) * 100;
    if (Math.abs(diff) < 5) return { trend: 'stable', percentage: diff };
    return { trend: diff > 0 ? 'up' : 'down', percentage: diff };
  };
  
  const trendNextMonth = getTrend(currentMonth, nextMonth);
  const trend3Months = getTrend(currentMonth, next3Months);
  const trend6Months = getTrend(currentMonth, next6Months);
  
  return {
    currentMonth,
    nextMonth: {
      predicted: Math.max(0, nextMonth),
      confidence,
      trend: trendNextMonth.trend,
      trendPercentage: trendNextMonth.percentage
    },
    next3Months: {
      predicted: Math.max(0, next3Months),
      confidence: confidence * 0.8, // Moins confiant pour +3 mois
      trend: trend3Months.trend,
      trendPercentage: trend3Months.percentage
    },
    next6Months: {
      predicted: Math.max(0, next6Months),
      confidence: confidence * 0.6, // Encore moins confiant pour +6 mois
      trend: trend6Months.trend,
      trendPercentage: trend6Months.percentage
    }
  };
}

/**
 * Analyse du taux de recouvrement
 */
export function analyzeRecoveryRate(
  factures: Array<{
    montant: number;
    statut: string;
    dateEmission: Date;
    datePaiement?: Date;
  }>
): RecoveryRateAnalysis {
  const paidFactures = factures.filter(f => f.statut === 'PAYEE' && f.datePaiement);
  const totalFactures = factures.filter(f => f.statut !== 'BROUILLON');
  
  const currentRate = calculateCurrentRate(paidFactures, totalFactures);
  const averageDelayDays = calculateAverageDelay(paidFactures);
  const predictedRate = calculatePredictedRate(factures, currentRate);
  const riskFactors = identifyRiskFactors(currentRate, averageDelayDays, predictedRate, factures);
  
  return {
    currentRate,
    predictedRate,
    averageDelayDays,
    riskFactors
  };
}

function calculateCurrentRate(paidFactures: any[], totalFactures: any[]): number {
  return totalFactures.length > 0 
    ? (paidFactures.length / totalFactures.length) * 100 
    : 0;
}

function calculateAverageDelay(paidFactures: any[]): number {
  const delays = paidFactures
    .filter(f => f.datePaiement)
    .map(f => {
      const emission = new Date(f.dateEmission);
      const paiement = new Date(f.datePaiement!);
      return (paiement.getTime() - emission.getTime()) / (1000 * 60 * 60 * 24);
    });
  
  return delays.length > 0
    ? delays.reduce((a, b) => a + b, 0) / delays.length
    : 0;
}

function calculatePredictedRate(factures: any[], currentRate: number): PredictionResult {
  const monthlyRates = getMonthlyRates(factures);
  
  if (monthlyRates.length >= 3) {
    const result = regression.linear(monthlyRates);
    const nextRate = result.predict(6)[1];
    const trend = getTrendDirection(nextRate, currentRate);
    
    return {
      predicted: Math.min(100, Math.max(0, nextRate)),
      confidence: result.r2 * 100,
      trend,
      trendPercentage: ((nextRate - currentRate) / currentRate) * 100
    };
  }
  
  return {
    predicted: currentRate,
    confidence: 50,
    trend: 'stable',
    trendPercentage: 0
  };
}

function getMonthlyRates(factures: any[]): [number, number][] {
  const monthlyRates: [number, number][] = [];
  const now = new Date();
  const totalFactures = factures.filter(f => f.statut !== 'BROUILLON');
  
  for (let i = 0; i < 6; i++) {
    const monthAgo = new Date(now);
    monthAgo.setMonth(now.getMonth() - i);
    
    const monthFactures = totalFactures.filter(f => {
      const date = new Date(f.dateEmission);
      return date.getMonth() === monthAgo.getMonth() && 
             date.getFullYear() === monthAgo.getFullYear();
    });
    
    const monthPaid = monthFactures.filter(f => f.statut === 'PAYEE');
    const rate = monthFactures.length > 0 ? (monthPaid.length / monthFactures.length) * 100 : 0;
    
    monthlyRates.unshift([5 - i, rate]);
  }
  
  return monthlyRates;
}

function getTrendDirection(nextRate: number, currentRate: number): 'up' | 'down' | 'stable' {
  return nextRate > currentRate ? 'up' : nextRate < currentRate ? 'down' : 'stable';
}

function identifyRiskFactors(
  currentRate: number, 
  averageDelayDays: number, 
  predictedRate: PredictionResult, 
  factures: any[]
): string[] {
  const riskFactors: string[] = [];
  
  if (currentRate < 70) riskFactors.push('Taux de recouvrement faible');
  if (averageDelayDays > 45) riskFactors.push('Delais de paiement trop longs');
  if (predictedRate.trend === 'down') riskFactors.push('Tendance a la baisse');
  
  const overdueCount = getOverdueFacturesCount(factures);
  if (overdueCount > 0) {
    riskFactors.push(`${overdueCount} facture(s) en retard`);
  }
  
  return riskFactors;
}

function getOverdueFacturesCount(factures: any[]): number {
  return factures.filter(f => {
    if (f.statut === 'PAYEE' || f.statut === 'BROUILLON') return false;
    const daysSince = (Date.now() - new Date(f.dateEmission).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince > 30;
  }).length;

}

/**
 * Analyse de rentabilite par type de dossier
 */
export function analyzeDossierProfitability(
  dossiers: Array<{
    type: string;
    montantFacture?: number;
    heuresTravaillees?: number;
    tauxHoraire?: number;
  }>
): DossierProfitability[] {
  const byType = groupDossiersByType(dossiers);
  
  return Object.entries(byType)
    .map(([type, typeDossiers]) => calculateProfitability(type, typeDossiers))
    .sort((a, b) => b.profitMargin - a.profitMargin);
}

function groupDossiersByType(dossiers: any[]): Record<string, any[]> {
  return dossiers.reduce((acc, dossier) => {
    if (!acc[dossier.type]) {
      acc[dossier.type] = [];
    }
    acc[dossier.type].push(dossier);
    return acc;
  }, {} as Record<string, any[]>);
}

function calculateProfitability(type: string, typeDossiers: any[]): DossierProfitability {
  const defaultHourlyRate = 150;
  
  const averageRevenue = calculateAverageRevenue(typeDossiers);
  const averageCost = calculateAverageCost(typeDossiers, defaultHourlyRate);
  const profitMargin = calculateProfitMargin(averageRevenue, averageCost);
  const trend = determineTrend(profitMargin);
  const recommendation = generateRecommendation(profitMargin);
  
  return {
    type,
    averageRevenue,
    averageCost,
    profitMargin,
    trend,
    recommendation
  };
}

function calculateAverageRevenue(dossiers: any[]): number {
  const revenues = dossiers
    .filter(d => d.montantFacture)
    .map(d => d.montantFacture!);
  
  return revenues.length > 0
    ? revenues.reduce((a, b) => a + b, 0) / revenues.length
    : 0;
}

function calculateAverageCost(dossiers: any[], defaultRate: number): number {
  const costs = dossiers.map(d => {
    const hours = d.heuresTravaillees || 0;
    const rate = d.tauxHoraire || defaultRate;
    return hours * rate;
  });
  
  return costs.length > 0
    ? costs.reduce((a, b) => a + b, 0) / costs.length
    : 0;
}

function calculateProfitMargin(revenue: number, cost: number): number {
  return revenue > 0
    ? ((revenue - cost) / revenue) * 100
    : 0;
}

function determineTrend(profitMargin: number): 'up' | 'down' | 'stable' {
  if (profitMargin > 30) return 'up';
  if (profitMargin < 15) return 'down';
  return 'stable';
}

function generateRecommendation(profitMargin: number): string {
  if (profitMargin > 40) {
    return 'Type de dossier tres rentable. Augmentez votre volume.';
  }
  if (profitMargin > 20) {
    return 'Rentabilite satisfaisante. Optimisez les processus.';
  }
  if (profitMargin > 0) {
    return 'Marge faible. Revisez vos tarifs ou reduisez les couts.';
  }
  return 'Non rentable. Augmentez significativement vos tarifs.';
}

/**
 * Prediction du nombre de nouveaux clients
 */
export function predictNewClients(
  historicalClients: Array<{ date: Date; count: number }>
): PredictionResult {
  if (historicalClients.length < 3) {
    return createDefaultPrediction();
  }
  
  const data: [number, number][] = historicalClients.map((point, index) => [index, point.count]);
  const result = regression.linear(data);
  const nextIndex = historicalClients.length;
  const predicted = result.predict(nextIndex)[1];
  const current = historicalClients[historicalClients.length - 1].count;
  
  return {
    predicted: Math.max(0, Math.round(predicted)),
    confidence: Math.min(100, Math.max(0, result.r2 * 100)),
    trend: getTrendDirection(predicted, current),
    trendPercentage: calculateTrendPercentage(predicted, current)
  };
}

function createDefaultPrediction(): PredictionResult {
  return {
    predicted: 0,
    confidence: 0,
    trend: 'stable',
    trendPercentage: 0
  };
}

function calculateTrendPercentage(predicted: number, current: number): number {
  return current > 0 ? ((predicted - current) / current) * 100 : 0;
}

/**
 * Score de sante financiere global
 */
export function calculateFinancialHealthScore(metrics: {
  revenueGrowth: number;      // % croissance revenus
  recoveryRate: number;        // % taux de recouvrement
  profitMargin: number;        // % marge beneficiaire moyenne
  clientRetention: number;     // % clients recurrents
  cashflow: number;           // Tresorerie actuelle
}): {
  score: number;              // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
} {
  let score = 0;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  // evaluation croissance revenus (25 points)
  if (metrics.revenueGrowth > 20) {
    score += 25;
    strengths.push('Forte croissance des revenus');
  } else if (metrics.revenueGrowth > 10) {
    score += 20;
  } else if (metrics.revenueGrowth > 0) {
    score += 15;
  } else {
    weaknesses.push('Croissance des revenus insuffisante');
    recommendations.push('Developper de nouveaux services ou augmenter les tarifs');
  }

  // evaluation taux de recouvrement (25 points)
  if (metrics.recoveryRate > 90) {
    score += 25;
    strengths.push('Excellent taux de recouvrement');
  } else if (metrics.recoveryRate > 80) {
    score += 20;
  } else if (metrics.recoveryRate > 70) {
    score += 15;
  } else {
    weaknesses.push('Taux de recouvrement faible');
    recommendations.push('Ameliorer le processus de facturation et de relance');
  }

  // evaluation marge beneficiaire (20 points)
  if (metrics.profitMargin > 30) {
    score += 20;
    strengths.push('Marge beneficiaire elevee');
  } else if (metrics.profitMargin > 20) {
    score += 15;
  } else if (metrics.profitMargin > 10) {
    score += 10;
  } else {
    weaknesses.push('Marge beneficiaire insuffisante');
    recommendations.push('Optimiser les couts ou revoir la tarification');
  }

  // evaluation retention clients (15 points)
  if (metrics.clientRetention > 80) {
    score += 15;
    strengths.push('Excellente fidelisation client');
  } else if (metrics.clientRetention > 60) {
    score += 12;
  } else if (metrics.clientRetention > 40) {
    score += 8;
  } else {
    weaknesses.push('Faible retention client');
    recommendations.push('Ameliorer la qualite de service et la relation client');
  }

  // evaluation tresorerie (15 points)
  if (metrics.cashflow > 50000) {
    score += 15;
    strengths.push('Tresorerie solide');
  } else if (metrics.cashflow > 20000) {
    score += 12;
  } else if (metrics.cashflow > 0) {
    score += 8;
  } else {
    weaknesses.push('Probleme de tresorerie');
    recommendations.push('Ameliorer la gestion de tresorerie et accelerer les encaissements');
  }

  // Determination du grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';

  return {
    score,
    grade,
    strengths,
    weaknesses,
    recommendations
  };
}
