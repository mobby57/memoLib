'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Breadcrumb, Alert } from '@/components/ui';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  FileText,
  Target,
  Award,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  predictRevenue,
  analyzeRecoveryRate,
  analyzeDossierProfitability,
  calculateFinancialHealthScore,
  PredictionData
} from '@/lib/services/analyticsService';

export default function AnalyticsPage() {
  // Donnees d'exemple (remplacer par vraies donnees de l'API)
  const historicalRevenue: PredictionData[] = [
    { date: new Date(2025, 6), value: 8500 },
    { date: new Date(2025, 7), value: 9200 },
    { date: new Date(2025, 8), value: 10100 },
    { date: new Date(2025, 9), value: 9800 },
    { date: new Date(2025, 10), value: 11200 },
    { date: new Date(2025, 11), value: 12500 },
  ];

  const factures = [
    { montant: 1500, statut: 'PAYEE', dateEmission: new Date(2025, 10, 1), datePaiement: new Date(2025, 10, 15) },
    { montant: 2200, statut: 'PAYEE', dateEmission: new Date(2025, 10, 5), datePaiement: new Date(2025, 10, 25) },
    { montant: 1800, statut: 'ENVOYEE', dateEmission: new Date(2025, 11, 1) },
    { montant: 3000, statut: 'PAYEE', dateEmission: new Date(2025, 11, 10), datePaiement: new Date(2025, 11, 20) },
    { montant: 1200, statut: 'EN_RETARD', dateEmission: new Date(2025, 9, 15) },
  ];

  const dossiers = [
    { type: 'Droit commercial', montantFacture: 3500, heuresTravaillees: 20, tauxHoraire: 150 },
    { type: 'Droit du travail', montantFacture: 2200, heuresTravaillees: 18, tauxHoraire: 150 },
    { type: 'Droit de la famille', montantFacture: 1800, heuresTravaillees: 15, tauxHoraire: 120 },
    { type: 'Droit commercial', montantFacture: 4200, heuresTravaillees: 25, tauxHoraire: 150 },
    { type: 'Contentieux', montantFacture: 5500, heuresTravaillees: 35, tauxHoraire: 150 },
    { type: 'Droit du travail', montantFacture: 1900, heuresTravaillees: 16, tauxHoraire: 150 },
  ];

  // Calculs des previsions
  const revenueForecast = useMemo(() => predictRevenue(historicalRevenue), []);
  const recoveryAnalysis = useMemo(() => analyzeRecoveryRate(factures), []);
  const profitability = useMemo(() => analyzeDossierProfitability(dossiers), []);
  
  const financialHealth = useMemo(() => calculateFinancialHealthScore({
    revenueGrowth: revenueForecast.nextMonth.trendPercentage,
    recoveryRate: recoveryAnalysis.currentRate,
    profitMargin: profitability.length > 0 ? profitability[0].profitMargin : 0,
    clientRetention: 75, // a calculer depuis les vraies donnees
    cashflow: 8500
  }), [revenueForecast, recoveryAnalysis, profitability]);

  // Preparer les donnees pour les graphiques
  const revenueChartData = [
    ...historicalRevenue.map((d, i) => ({
      mois: `M${i + 1}`,
      reel: d.value,
      prevu: null
    })),
    {
      mois: 'M+1',
      reel: null,
      prevu: revenueForecast.nextMonth.predicted
    },
    {
      mois: 'M+3',
      reel: null,
      prevu: revenueForecast.next3Months.predicted
    },
    {
      mois: 'M+6',
      reel: null,
      prevu: revenueForecast.next6Months.predicted
    }
  ];

  const profitabilityChartData = profitability.map(p => ({
    type: p.type,
    revenu: Math.round(p.averageRevenue),
    cout: Math.round(p.averageCost),
    marge: Math.round(p.profitMargin)
  }));

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'down': return <ArrowDown className="h-4 w-4 text-red-600" />;
      case 'stable': return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'B': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'C': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'D': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'F': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Analytics Predictifs', href: '/analytics' }
        ]}
      />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Analytics Predictifs
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Previsions et analyse de la performance de votre cabinet
        </p>
      </div>

      {/* Score de sante financiere */}
      <Card className="p-6 mb-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-md">
              <Award className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Score de Sante Financiere
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                evaluation globale de la performance
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold text-blue-600 dark:text-blue-400">
              {financialHealth.score}/100
            </div>
            <span className={`inline-block px-4 py-2 rounded-full text-lg font-bold mt-2 ${getGradeColor(financialHealth.grade)}`}>
              Note: {financialHealth.grade}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Points forts
            </h3>
            <ul className="space-y-1">
              {financialHealth.strengths.map((strength, i) => (
                <li key={i} className="text-sm text-green-700 dark:text-green-300">
                  - {strength}
                </li>
              ))}
              {financialHealth.strengths.length === 0 && (
                <li className="text-sm text-gray-500">Aucun point fort identifie</li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Points a ameliorer
            </h3>
            <ul className="space-y-1">
              {financialHealth.weaknesses.map((weakness, i) => (
                <li key={i} className="text-sm text-red-700 dark:text-red-300">
                  - {weakness}
                </li>
              ))}
              {financialHealth.weaknesses.length === 0 && (
                <li className="text-sm text-gray-500">Aucun point faible identifie</li>
              )}
            </ul>
          </div>
        </div>

        {financialHealth.recommendations.length > 0 && (
          <div className="mt-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Recommandations
            </h3>
            <ul className="space-y-1">
              {financialHealth.recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-gray-700 dark:text-gray-300">
                  {i + 1}. {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Prevision des revenus */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-green-600" />
          Prevision des Revenus
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Mois prochain</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {revenueForecast.nextMonth.predicted.toFixed(0)} �
            </div>
            <div className="flex items-center gap-2 mt-1">
              {getTrendIcon(revenueForecast.nextMonth.trend)}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {revenueForecast.nextMonth.trendPercentage.toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500">
                ({revenueForecast.nextMonth.confidence.toFixed(0)}% confiance)
              </span>
            </div>
          </div>

          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Dans 3 mois</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {revenueForecast.next3Months.predicted.toFixed(0)} �
            </div>
            <div className="flex items-center gap-2 mt-1">
              {getTrendIcon(revenueForecast.next3Months.trend)}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {revenueForecast.next3Months.trendPercentage.toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500">
                ({revenueForecast.next3Months.confidence.toFixed(0)}% confiance)
              </span>
            </div>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Dans 6 mois</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {revenueForecast.next6Months.predicted.toFixed(0)} �
            </div>
            <div className="flex items-center gap-2 mt-1">
              {getTrendIcon(revenueForecast.next6Months.trend)}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {revenueForecast.next6Months.trendPercentage.toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500">
                ({revenueForecast.next6Months.confidence.toFixed(0)}% confiance)
              </span>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mois" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="reel" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="prevu" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Analyse du taux de recouvrement */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FileText className="h-6 w-6 text-blue-600" />
          Analyse du Recouvrement
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Taux actuel</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {recoveryAnalysis.currentRate.toFixed(1)}%
            </div>
          </div>

          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Prevision</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {recoveryAnalysis.predictedRate.predicted.toFixed(1)}%
            </div>
            <div className="flex items-center gap-2 mt-1">
              {getTrendIcon(recoveryAnalysis.predictedRate.trend)}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {recoveryAnalysis.predictedRate.trendPercentage.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Delai moyen</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {recoveryAnalysis.averageDelayDays.toFixed(0)} j
            </div>
            <div className="text-xs text-gray-500 mt-1">
              jours de paiement
            </div>
          </div>
        </div>

        {recoveryAnalysis.riskFactors.length > 0 && (
          <Alert variant="warning" className="mt-4">
            <AlertCircle className="h-5 w-5" />
            <div>
              <strong>Facteurs de risque detectes:</strong>
              <ul className="mt-2 space-y-1">
                {recoveryAnalysis.riskFactors.map((risk, i) => (
                  <li key={i} className="text-sm">- {risk}</li>
                ))}
              </ul>
            </div>
          </Alert>
        )}
      </Card>

      {/* Rentabilite par type de dossier */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-purple-600" />
          Rentabilite par Type de Dossier
        </h2>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={profitabilityChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="revenu" fill="#3b82f6" name="Revenu moyen" />
            <Bar dataKey="cout" fill="#ef4444" name="Cout moyen" />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-6 space-y-3">
          {profitability.map((p, i) => (
            <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">{p.type}</h3>
                <div className="flex items-center gap-2">
                  {getTrendIcon(p.trend)}
                  <span className={`font-bold ${
                    p.profitMargin > 30 ? 'text-green-600' :
                    p.profitMargin > 15 ? 'text-blue-600' :
                    'text-red-600'
                  }`}>
                    {p.profitMargin.toFixed(1)}% marge
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{p.recommendation}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
