/**
 * Database Diagnostic Dashboard Component (Optionnel)
 * À intégrer dans une page admin de monitoring
 * 
 * Affiche:
 * - Current status + health score
 * - 30-day stats et trends
 * - Distribution de santé
 * - Historique des diagnostics
 * - Row counts
 */

'use client';

import React, { useEffect, useState } from 'react';

interface DiagnosticData {
  id: string;
  timestamp: Date;
  status: {
    overall: string;
    score: number;
  };
  performance: {
    responseTimeMs: number;
  };
  rowCounts: {
    accessGrant: number;
    invitation: number;
    dossier: number;
    user: number;
  };
  issues: string[];
  warnings: string[];
}

interface DashboardStats {
  latest: DiagnosticData;
  stats: {
    averageHealthScore: number;
    totalIssuesLast30Days: number;
  };
  healthDistribution: {
    HEALTHY: number;
    DEGRADED: number;
  };
}

export default function DatabaseDiagnosticDashboard() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [history, setHistory] = useState<DiagnosticData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashRes = await fetch('/api/monitoring/diagnostics?endpoint=dashboard');
        if (dashRes.ok) {
          const dashData = await dashRes.json();
          setData(dashData.data);
        }

        const histRes = await fetch('/api/monitoring/diagnostics?endpoint=history&limit=20');
        if (histRes.ok) {
          const histData = await histRes.json();
          setHistory(histData.data);
        }

        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-4">⏳ Loading...</div>;
  if (error) return <div className="p-4 text-red-600">❌ {error}</div>;
  if (!data) return <div className="p-4">No data</div>;

  const { latest, stats } = data;
  const healthColor = latest.status.score >= 80 ? 'green' : latest.status.score >= 50 ? 'yellow' : 'red';

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold">📊 Database Diagnostics</h1>

      {/* Status Card */}
      <div className={`p-6 rounded bg-${healthColor}-100 border border-${healthColor}-300`}>
        <p className="text-sm opacity-75">Current Status</p>
        <div className="flex justify-between items-center mt-2">
          <p className="text-2xl font-bold">{latest.status.overall}</p>
          <p className="text-4xl font-bold">{latest.status.score}%</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded border">
          <p className="text-sm opacity-75">Avg Health (30d)</p>
          <p className="text-2xl font-bold">{stats.averageHealthScore.toFixed(0)}</p>
        </div>
        <div className="p-4 bg-green-50 rounded border">
          <p className="text-sm opacity-75">Healthy Days</p>
          <p className="text-2xl font-bold">{data.healthDistribution.HEALTHY}</p>
        </div>
        <div className="p-4 bg-orange-50 rounded border">
          <p className="text-sm opacity-75">Issues (30d)</p>
          <p className="text-2xl font-bold">{stats.totalIssuesLast30Days}</p>
        </div>
      </div>

      {/* Recent History */}
      <div>
        <h3 className="font-bold mb-2">Recent Checks</h3>
        <div className="space-y-2">
          {history.slice(0, 5).map((h, i) => (
            <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm">{new Date(h.timestamp).toLocaleTimeString()}</span>
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                h.status.overall === 'HEALTHY' ? 'bg-green-200' : 'bg-yellow-200'
              }`}>{h.status.overall}</span>
              <span className="font-bold">{h.status.score}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
