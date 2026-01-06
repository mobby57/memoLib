'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { TrendingUp, Search, AlertCircle, BarChart3 } from 'lucide-react';

interface SearchAnalyticsProps {
  className?: string;
}

export default function SearchAnalytics({ className = '' }: SearchAnalyticsProps) {
  const [stats, setStats] = useState({
    totalSearches: 0,
    avgExecutionTime: 0,
    topSearches: [] as Array<{ query: string; count: number }>,
  });
  const [emptySearches, setEmptySearches] = useState<Array<{ query: string; count: number }>>([]);
  const [trends, setTrends] = useState<Array<{ date: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [statsRes, emptyRes, trendsRes] = await Promise.all([
        fetch('/api/search/analytics?type=stats'),
        fetch('/api/search/analytics?type=empty&limit=5'),
        fetch('/api/search/analytics?type=trends&days=7'),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      if (emptyRes.ok) {
        const data = await emptyRes.json();
        setEmptySearches(data.searches || []);
      }

      if (trendsRes.ok) {
        const data = await trendsRes.json();
        setTrends(data.trends || []);
      }
    } catch (error) {
      console.error('Erreur chargement analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recherches</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSearches}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps Moyen</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(stats.avgExecutionTime)}ms
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recherches Vides</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {emptySearches.reduce((sum, s) => sum + s.count, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherches populaires */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Recherches les Plus Populaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topSearches.length > 0 ? (
            <div className="space-y-2">
              {stats.topSearches.map((search, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {search.query}
                  </span>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                    {search.count} fois
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Aucune recherche enregistrée</p>
          )}
        </CardContent>
      </Card>

      {/* Recherches sans résultats */}
      {emptySearches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Recherches Sans Résultats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {emptySearches.map((search, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {search.query}
                  </span>
                  <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 rounded-full">
                    {search.count} fois
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              💡 Ces termes n'ont donné aucun résultat. Envisagez d'améliorer l'indexation.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tendances */}
      {trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              Tendances (7 derniers jours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {trends.map((trend, idx) => {
                const maxCount = Math.max(...trends.map((t) => t.count));
                const width = maxCount > 0 ? (trend.count / maxCount) * 100 : 0;

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>
                        {new Date(trend.date).toLocaleDateString('fr-FR', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span>{trend.count} recherches</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
