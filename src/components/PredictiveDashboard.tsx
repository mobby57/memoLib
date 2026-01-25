'use client';

import { useQuery } from '@tanstack/react-query';

interface PredictiveKPIs {
  nextMonthRevenue: number;
  caseloadForecast: number;
  clientSatisfactionTrend: number;
  resourceOptimization: number;
}

interface PredictiveDashboardProps {
  tenantId: string;
}

export function PredictiveDashboard({ tenantId }: PredictiveDashboardProps) {
  const { data: predictions, isLoading } = useQuery({
    queryKey: ['predictions', tenantId],
    queryFn: () => fetch(`/api/tenant/${tenantId}/predictions`).then(r => r.json()),
    refetchInterval: 30000
  });

  if (isLoading) {
    return <div className="animate-pulse">Chargement des predictions...</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <PredictiveKPICard 
        title="Revenus Prevus (30j)"
        value={predictions?.nextMonthRevenue || 0}
        trend={predictions?.revenueTrend || 0}
        format="currency"
      />
      <PredictiveKPICard 
        title="Charge de Travail"
        value={predictions?.caseloadForecast || 0}
        trend={predictions?.caseloadTrend || 0}
        format="number"
      />
      <WorkloadForecast 
        forecast={predictions?.caseloadForecast || 0}
        alerts={predictions?.workloadAlerts || []}
      />
      <ResourceOptimization 
        score={predictions?.resourceOptimization || 0}
        suggestions={predictions?.optimizationSuggestions || []}
      />
    </div>
  );
}

function PredictiveKPICard({ title, value, trend, format }: {
  title: string;
  value: number;
  trend: number;
  format: 'currency' | 'number';
}) {
  const formatValue = (val: number) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);
    }
    return val.toString();
  };

  const trendColor = trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600';
  const trendIcon = trend > 0 ? '️' : trend < 0 ? '️' : '️';

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <div className="mt-2 flex items-baseline">
        <p className="text-2xl font-semibold text-gray-900">{formatValue(value)}</p>
        <p className={`ml-2 text-sm ${trendColor}`}>
          {trendIcon} {Math.abs(trend).toFixed(1)}%
        </p>
      </div>
    </div>
  );
}

function WorkloadForecast({ forecast, alerts }: {
  forecast: number;
  alerts: string[];
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-sm font-medium text-gray-500">Prevision de Charge</h3>
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Dossiers prevus</span>
          <span className="text-lg font-semibold">{forecast}</span>
        </div>
        {alerts.length > 0 && (
          <div className="mt-3 space-y-1">
            {alerts.map((alert, index) => (
              <div key={index} className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                ️ {alert}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ResourceOptimization({ score, suggestions }: {
  score: number;
  suggestions: string[];
}) {
  const scoreColor = score > 80 ? 'text-green-600' : score > 60 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-sm font-medium text-gray-500">Optimisation Ressources</h3>
      <div className="mt-2">
        <div className={`text-2xl font-semibold ${scoreColor}`}>{score}%</div>
        <div className="mt-3 space-y-2">
          {suggestions.slice(0, 3).map((suggestion, index) => (
            <div key={index} className="text-sm text-gray-600 flex items-start">
              <span className="text-blue-500 mr-2">[emoji]</span>
              {suggestion}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
