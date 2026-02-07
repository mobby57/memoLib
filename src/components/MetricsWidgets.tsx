'use client';

import { TrendingUp, TrendingDown, Clock, Target, DollarSign, Users, FileCheck, AlertTriangle, Calendar, Percent } from 'lucide-react';

export interface MetricsData {
  completionRate: number; // % de dossiers traites
  avgResponseTime: number; // heures
  avgProcessingTime: number; // jours
  clientSatisfaction: number; // score sur 5
  monthlyRevenue: number; // euros
  monthlyGoal: number; // euros
  activeClients: number;
  pendingValidations: number;
  overdueFiles: number; // dossiers en retard
  successRate: number; // % de dossiers gagnes
  trends: {
    completionRate: number; // variation en %
    avgResponseTime: number;
    avgProcessingTime: number;
    monthlyRevenue: number;
  };
}

interface MetricWidgetProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'yellow';
  subtitle?: string;
  badge?: string;
  progress?: number; // 0-100 for progress bar
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    ring: 'ring-blue-500',
    progressBg: 'bg-blue-600'
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/20',
    text: 'text-green-600 dark:text-green-400',
    ring: 'ring-green-500',
    progressBg: 'bg-green-600'
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/20',
    text: 'text-orange-600 dark:text-orange-400',
    ring: 'ring-orange-500',
    progressBg: 'bg-orange-600'
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-400',
    ring: 'ring-purple-500',
    progressBg: 'bg-purple-600'
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    ring: 'ring-red-500',
    progressBg: 'bg-red-600'
  },
  yellow: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/20',
    text: 'text-yellow-600 dark:text-yellow-400',
    ring: 'ring-yellow-500',
    progressBg: 'bg-yellow-600'
  }
};

function MetricWidget({ title, value, icon, trend, trendLabel, color, subtitle, badge, progress }: MetricWidgetProps) {
  const colors = colorClasses[color];
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${colors.bg}`}>
          <div className={colors.text}>
            {icon}
          </div>
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1">
            {trend >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
            )}
            <span className={`text-sm font-semibold ${
              trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {Math.abs(trend)}%
            </span>
          </div>
        )}
        {badge && (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
            {badge}
          </span>
        )}
      </div>

      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
        {title}
      </h3>

      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
        {subtitle && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {subtitle}
          </span>
        )}
      </div>

      {trendLabel && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {trendLabel}
        </p>
      )}

      {progress !== undefined && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Progression
            </span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${colors.progressBg}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function MetricsWidgets({ data }: { data: MetricsData }) {
  const revenueProgress = Math.min(Math.round((data.monthlyRevenue / data.monthlyGoal) * 100), 100);
  
  return (
    <div className="space-y-6">
      {/* Titre section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
             Tableau de bord metriques
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Suivi en temps reel de vos indicateurs cles de performance
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          Rapport detaille [Next]
        </button>
      </div>

      {/* Metriques principales - 4 colonnes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricWidget
          title="Taux de traitement"
          value={`${data.completionRate}%`}
          icon={<FileCheck className="w-6 h-6" />}
          color={data.completionRate >= 80 ? 'green' : data.completionRate >= 60 ? 'orange' : 'red'}
          trend={data.trends.completionRate}
          trendLabel={`${Math.abs(data.trends.completionRate)}% vs mois dernier`}
          badge={data.completionRate >= 90 ? 'Excellent' : data.completionRate >= 70 ? 'Bon' : 'a ameliorer'}
        />

        <MetricWidget
          title="Temps de reponse moyen"
          value={data.avgResponseTime}
          subtitle="heures"
          icon={<Clock className="w-6 h-6" />}
          color={data.avgResponseTime <= 4 ? 'green' : data.avgResponseTime <= 8 ? 'orange' : 'red'}
          trend={data.trends.avgResponseTime}
          trendLabel={`Objectif: < 4h`}
        />

        <MetricWidget
          title="Delai de traitement moyen"
          value={data.avgProcessingTime}
          subtitle="jours"
          icon={<Calendar className="w-6 h-6" />}
          color={data.avgProcessingTime <= 7 ? 'green' : data.avgProcessingTime <= 14 ? 'orange' : 'red'}
          trend={data.trends.avgProcessingTime}
          trendLabel={`${data.trends.avgProcessingTime >= 0 ? '+' : ''}${data.trends.avgProcessingTime} jours vs mois dernier`}
        />

        <MetricWidget
          title="Taux de succes"
          value={`${data.successRate}%`}
          icon={<Target className="w-6 h-6" />}
          color={data.successRate >= 85 ? 'green' : data.successRate >= 70 ? 'orange' : 'red'}
          badge={`${data.successRate}% gagnes`}
          trendLabel="Dossiers finalises favorablement"
        />
      </div>

      {/* Metriques secondaires - 3 colonnes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <MetricWidget
          title="Chiffre d'affaires mensuel"
          value={`${(data.monthlyRevenue / 1000).toFixed(1)}k€`}
          icon={<DollarSign className="w-6 h-6" />}
          color="purple"
          trend={data.trends.monthlyRevenue}
          trendLabel={`Objectif: ${(data.monthlyGoal / 1000)}k€`}
          progress={revenueProgress}
        />

        <MetricWidget
          title="Clients actifs"
          value={data.activeClients}
          icon={<Users className="w-6 h-6" />}
          color="blue"
          subtitle="clients"
          trendLabel="Avec dossiers en cours"
        />

        <MetricWidget
          title="Validations en attente"
          value={data.pendingValidations}
          icon={<AlertTriangle className="w-6 h-6" />}
          color={data.pendingValidations === 0 ? 'green' : data.pendingValidations <= 5 ? 'orange' : 'red'}
          badge={data.pendingValidations === 0 ? ' a jour' : '? Action requise'}
          trendLabel={data.pendingValidations === 0 ? 'Tous les dossiers a jour' : `${data.pendingValidations} dossiers necessitent une validation`}
        />
      </div>

      {/* Alertes et objectifs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dossiers en retard */}
        {data.overdueFiles > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-l-4 border-red-500 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-red-900 dark:text-red-200 mb-2">
                   {data.overdueFiles} Dossier{data.overdueFiles > 1 ? 's' : ''} en retard
                </h3>
                <p className="text-sm text-red-800 dark:text-red-300 mb-3">
                  Ces dossiers depassent le delai de traitement standard (14 jours)
                </p>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
                  Voir les dossiers en retard [Next]
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Objectif mensuel */}
        <div className={`border-l-4 rounded-lg p-6 ${
          revenueProgress >= 100 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-500'
            : 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-500'
        }`}>
          <div className="flex items-start gap-4">
            <Target className={`w-8 h-8 flex-shrink-0 ${
              revenueProgress >= 100 ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
            }`} />
            <div className="flex-1">
              <h3 className={`text-lg font-bold mb-2 ${
                revenueProgress >= 100 
                  ? 'text-green-900 dark:text-green-200' 
                  : 'text-blue-900 dark:text-blue-200'
              }`}>
                {revenueProgress >= 100 ? '?? Objectif mensuel atteint !' : '?? Objectif mensuel'}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className={revenueProgress >= 100 ? 'text-green-800 dark:text-green-300' : 'text-blue-800 dark:text-blue-300'}>
                    {data.monthlyRevenue.toLocaleString()}€ / {data.monthlyGoal.toLocaleString()}€
                  </span>
                  <span className={`font-bold ${
                    revenueProgress >= 100 ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    {revenueProgress}%
                  </span>
                </div>
                <div className="w-full bg-white dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      revenueProgress >= 100 ? 'bg-green-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${revenueProgress}%` }}
                  />
                </div>
                {revenueProgress < 100 && (
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                    Encore {(data.monthlyGoal - data.monthlyRevenue).toLocaleString()}€ pour atteindre l'objectif
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mini graphiques de tendance (placeholder pour future implementation) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
           Tendances sur 30 jours
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Dossiers traites</p>
            <p className={`text-2xl font-bold ${
              data.trends.completionRate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {data.trends.completionRate >= 0 ? '+' : ''}{data.trends.completionRate}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">vs periode precedente</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Temps de reponse</p>
            <p className={`text-2xl font-bold ${
              data.trends.avgResponseTime <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {data.trends.avgResponseTime >= 0 ? '+' : ''}{data.trends.avgResponseTime}h
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">vs periode precedente</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Revenus</p>
            <p className={`text-2xl font-bold ${
              data.trends.monthlyRevenue >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {data.trends.monthlyRevenue >= 0 ? '+' : ''}{data.trends.monthlyRevenue}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">vs periode precedente</p>
          </div>
        </div>
      </div>
    </div>
  );
}
