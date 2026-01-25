/**
 * Composant Dashboard Analytique Avance
 * Visualisation des metriques IA et tendances
 * 
 * Innovation: Analytics en temps reel avec graphiques interactifs
 */

'use client';

import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import { useSession } from 'next-auth/react';

interface AnalyticsData {
  period: string;
  globalSuccessRate: number;
  totalActions: number;
  improvements: Array<{
    actionType: string;
    currentSuccessRate: number;
    improvement: number;
    status: 'improving' | 'stable' | 'declining';
  }>;
  actionsByType: Array<{
    type: string;
    count: number;
    avgConfidence: number;
  }>;
  validationTrends: Array<{
    date: string;
    approved: number;
    rejected: number;
    modified: number;
  }>;
}

export function AnalyticsDashboard({ tenantId }: { tenantId: string }) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [tenantId, timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/tenant/${tenantId}/analytics?range=${timeRange}`
      );
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      logger.error('Erreur chargement analytics', { error, tenantId, timeRange });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800">Pas de donnees analytiques disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec selection de periode */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">[emoji] Analytics IA</h2>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === '7d' ? '7 jours' : range === '30d' ? '30 jours' : '90 jours'}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="text-sm font-medium opacity-90">Taux de Succes Global</div>
          <div className="text-4xl font-bold mt-2">
            {(analytics.globalSuccessRate * 100).toFixed(1)}%
          </div>
          <div className="text-sm mt-2 opacity-80">
            {analytics.totalActions} actions analysees
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="text-sm font-medium opacity-90">Actions Ameliorees</div>
          <div className="text-4xl font-bold mt-2">
            {analytics.improvements.filter(i => i.status === 'improving').length}
          </div>
          <div className="text-sm mt-2 opacity-80">
            sur {analytics.improvements.length} types d'actions
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="text-sm font-medium opacity-90">Confiance Moyenne</div>
          <div className="text-4xl font-bold mt-2">
            {analytics.actionsByType.length > 0
              ? (
                  (analytics.actionsByType.reduce((sum, a) => sum + a.avgConfidence, 0) /
                    analytics.actionsByType.length) *
                  100
                ).toFixed(0)
              : 0}%
          </div>
          <div className="text-sm mt-2 opacity-80">
            Toutes actions confondues
          </div>
        </div>
      </div>

      {/* Tendances par type d'action */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          [emoji] Performance par Type d'Action
        </h3>
        <div className="space-y-4">
          {analytics.improvements.map((improvement, index) => {
            const statusConfig = {
              improving: { color: 'bg-green-500', icon: '', text: 'En amelioration' },
              stable: { color: 'bg-blue-500', icon: '️', text: 'Stable' },
              declining: { color: 'bg-red-500', icon: '', text: 'En baisse' }
            };
            
            const config = statusConfig[improvement.status];
            const successPercent = improvement.currentSuccessRate * 100;

            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{config.icon}</span>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {improvement.actionType}
                      </div>
                      <div className="text-sm text-gray-600">{config.text}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {successPercent.toFixed(0)}%
                    </div>
                    <div className={`text-sm font-medium ${
                      improvement.improvement > 0 ? 'text-green-600' : 
                      improvement.improvement < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {improvement.improvement > 0 ? '+' : ''}
                      {(improvement.improvement * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Barre de progression */}
                <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
                  <div
                    className={`${config.color} h-3 rounded-full transition-all duration-500`}
                    style={{ width: `${successPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Repartition des actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          🎯 Repartition des Actions IA
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analytics.actionsByType.map((action, index) => {
            const colors = [
              'bg-blue-500',
              'bg-green-500',
              'bg-purple-500',
              'bg-orange-500',
              'bg-pink-500',
              'bg-indigo-500'
            ];
            const color = colors[index % colors.length];

            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900">{action.type}</div>
                  <div className="text-2xl font-bold text-gray-900">{action.count}</div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Confiance moyenne</span>
                  <span className="font-semibold text-gray-900">
                    {(action.avgConfidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${color} h-2 rounded-full`}
                    style={{ width: `${action.avgConfidence * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline de validations (graphique simple) */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          [emoji] Tendance des Validations
        </h3>
        {analytics.validationTrends && analytics.validationTrends.length > 0 ? (
          <div className="space-y-3">
            {analytics.validationTrends.slice(-7).map((trend, index) => {
              const total = trend.approved + trend.rejected + trend.modified;
              const approvedPercent = total > 0 ? (trend.approved / total) * 100 : 0;
              const rejectedPercent = total > 0 ? (trend.rejected / total) * 100 : 0;
              const modifiedPercent = total > 0 ? (trend.modified / total) * 100 : 0;

              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {new Date(trend.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                    <span className="text-sm text-gray-600">{total} actions</span>
                  </div>
                  <div className="flex h-6 rounded-lg overflow-hidden">
                    <div
                      className="bg-green-500"
                      style={{ width: `${approvedPercent}%` }}
                      title={`${trend.approved} approuvees`}
                    />
                    <div
                      className="bg-orange-500"
                      style={{ width: `${modifiedPercent}%` }}
                      title={`${trend.modified} modifiees`}
                    />
                    <div
                      className="bg-red-500"
                      style={{ width: `${rejectedPercent}%` }}
                      title={`${trend.rejected} rejetees`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">Pas de donnees de tendance disponibles</p>
        )}

        {/* Legende */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-700">Approuvees</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-sm text-gray-700">Modifiees</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-700">Rejetees</span>
          </div>
        </div>
      </div>

      {/* Recommandations */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3">
          [emoji] Recommandations d'Amelioration
        </h3>
        <div className="space-y-2">
          {analytics.improvements
            .filter(i => i.status === 'declining')
            .map((improvement, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <span className="text-red-600">️</span>
                <span className="text-gray-700">
                  <strong>{improvement.actionType}</strong>: Performance en baisse de{' '}
                  {Math.abs(improvement.improvement * 100).toFixed(1)}%. Reviser les prompts systeme.
                </span>
              </div>
            ))}
          {analytics.improvements
            .filter(i => i.status === 'improving' && i.currentSuccessRate > 0.9)
            .map((improvement, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <span className="text-green-600"></span>
                <span className="text-gray-700">
                  <strong>{improvement.actionType}</strong>: Excellente performance (
                  {(improvement.currentSuccessRate * 100).toFixed(0)}%). Considerer l'auto-approbation.
                </span>
              </div>
            ))}
          {analytics.globalSuccessRate > 0.85 && (
            <div className="flex items-start gap-2 text-sm">
              <span className="text-blue-600">🎉</span>
              <span className="text-gray-700">
                Excellent taux de succes global ({(analytics.globalSuccessRate * 100).toFixed(0)}
                %). Le systeme fonctionne de maniere optimale.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
