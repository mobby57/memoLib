'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import AdminNavigation from '@/components/AdminNavigation';

interface UsageData {
  period: {
    month: number;
    year: number;
    label: string;
  };
  budget: {
    limit: number;
    used: number;
    remaining: number;
    percentage: number;
    status: 'normal' | 'warning' | 'critical' | 'exceeded';
  };
  usage: {
    totalCost: number;
    totalRequests: number;
    totalTokens: number;
    avgCostPerRequest: number;
  };
  projection: {
    endOfMonth: number;
    willExceed: boolean;
  };
  breakdown: {
    byModel: Record<string, { cost: number; requests: number }>;
    daily: { date: string; cost: number; requests: number }[];
  };
  plan: {
    name: string;
    aiIncluded: string;
  };
  recommendations: string[];
}

export default function AIUsagePage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadUsage();
  }, [selectedMonth, selectedYear]);

  const loadUsage = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/client/ai-usage?month=${selectedMonth}&year=${selectedYear}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (error) {
      console.error('Erreur chargement usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exceeded': return 'bg-red-500';
      case 'critical': return 'bg-orange-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'exceeded': return 'bg-red-50 border-red-200';
      case 'critical': return 'bg-orange-50 border-orange-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-green-50 border-green-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">?? Mon Usage IA</h1>
            <p className="mt-2 text-gray-600">
              Suivez votre consommation IA et optimisez vos coûts
            </p>
          </div>

          {/* Sélecteur de période */}
          <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">Période:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="border rounded px-3 py-2"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  {new Date(2026, m - 1).toLocaleDateString('fr-FR', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border rounded px-3 py-2"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
            <button
              onClick={loadUsage}
              className="ml-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              ?? Actualiser
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : data ? (
            <>
              {/* Carte principale - Budget */}
              <div className={`rounded-lg shadow p-6 mb-6 border ${getStatusBg(data.budget.status)}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Budget IA - {data.period.label}</h2>
                    <p className="text-sm text-gray-600">Plan {data.plan.name} • {data.plan.aiIncluded} inclus</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-white font-medium ${getStatusColor(data.budget.status)}`}>
                    {data.budget.status === 'exceeded' ? '?? Dépassé' :
                     data.budget.status === 'critical' ? '?? Critique' :
                     data.budget.status === 'warning' ? '?? Attention' : '? OK'}
                  </span>
                </div>

                {/* Barre de progression */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{data.budget.used.toFixed(2)}€ utilisés</span>
                    <span>{data.budget.limit}€ limite</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all ${getStatusColor(data.budget.status)}`}
                      style={{ width: `${Math.min(data.budget.percentage, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-center text-sm mt-1 text-gray-600">
                    {data.budget.percentage.toFixed(1)}% du budget utilisé
                  </p>
                </div>

                {/* Stats rapides */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{data.budget.remaining.toFixed(2)}€</div>
                    <div className="text-sm text-gray-600">Restant</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{data.usage.totalRequests}</div>
                    <div className="text-sm text-gray-600">Requêtes</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${data.projection.willExceed ? 'text-red-600' : 'text-gray-900'}`}>
                      {data.projection.endOfMonth.toFixed(2)}€
                    </div>
                    <div className="text-sm text-gray-600">Projection fin de mois</div>
                  </div>
                </div>
              </div>

              {/* Recommandations */}
              {data.recommendations.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-blue-900 mb-2">?? Recommandations</h3>
                  <ul className="space-y-1">
                    {data.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-blue-800">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Détails par modèle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">?? Usage par Modèle</h3>
                  {Object.keys(data.breakdown.byModel).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(data.breakdown.byModel).map(([model, stats]) => (
                        <div key={model} className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{model}</span>
                            <span className="text-sm text-gray-500 ml-2">({stats.requests} req)</span>
                          </div>
                          <span className={`font-semibold ${model.includes('ollama') ? 'text-green-600' : 'text-gray-900'}`}>
                            {stats.cost.toFixed(4)}€
                            {model.includes('ollama') && ' ??'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Aucune donnée ce mois</p>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">?? Statistiques</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Coût total</span>
                      <span className="font-semibold">{data.usage.totalCost.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Requêtes totales</span>
                      <span className="font-semibold">{data.usage.totalRequests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tokens utilisés</span>
                      <span className="font-semibold">{data.usage.totalTokens.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Coût moyen/requête</span>
                      <span className="font-semibold">{data.usage.avgCostPerRequest.toFixed(4)}€</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Graphique quotidien simplifié */}
              {data.breakdown.daily.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">?? Usage Quotidien</h3>
                  <div className="overflow-x-auto">
                    <div className="flex gap-1 min-w-max">
                      {data.breakdown.daily.map((day) => {
                        const maxCost = Math.max(...data.breakdown.daily.map(d => d.cost));
                        const heightPercent = maxCost > 0 ? (day.cost / maxCost) * 100 : 0;
                        return (
                          <div key={day.date} className="flex flex-col items-center">
                            <div className="w-8 h-24 bg-gray-100 rounded relative">
                              <div
                                className="absolute bottom-0 w-full bg-blue-500 rounded-b"
                                style={{ height: `${heightPercent}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500 mt-1">
                              {new Date(day.date).getDate()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Info Ollama */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mt-6">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">??</div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">Réduisez vos coûts à 0€ avec Ollama</h3>
                    <p className="text-green-800 mt-1">
                      Ollama exécute l&apos;IA localement sur votre serveur. C&apos;est gratuit et plus rapide !
                    </p>
                    <a
                      href="https://ollama.ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Installer Ollama ?
                    </a>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-gray-500">
              Aucune donnée disponible
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
