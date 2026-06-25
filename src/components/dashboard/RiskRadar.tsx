'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, AlertTriangle, Loader2 } from 'lucide-react';

interface DossierRisk {
  id: string;
  numero: string;
  typeDossier: string;
  clientName: string;
  score: number;
  level: 'critical' | 'high' | 'medium' | 'low';
  factors: string[];
}

export function RiskRadar({ tenantId }: { tenantId?: string }) {
  const [dossiers, setDossiers] = useState<DossierRisk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) { setLoading(false); return; }
    fetch('/api/ai/risk-radar')
      .then(r => r.ok ? r.json() : { dossiers: [] })
      .then(data => setDossiers(data.dossiers || []))
      .catch(() => setDossiers([]))
      .finally(() => setLoading(false));
  }, [tenantId]);

  if (loading) return (
    <div className="animate-pulse bg-gray-100 rounded-2xl h-40" />
  );

  const atRisk = dossiers.filter(d => d.level === 'critical' || d.level === 'high');
  if (atRisk.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-red-600" />
        <h2 className="font-bold text-gray-900">Radar des risques</h2>
        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full ml-auto">
          {atRisk.length} dossier{atRisk.length > 1 ? 's' : ''} à surveiller
        </span>
      </div>

      <div className="space-y-2">
        {atRisk.slice(0, 5).map((d) => (
          <Link
            key={d.id}
            href={`/dossiers/${d.id}`}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <ScoreBadge score={d.score} level={d.level} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {d.numero} — {d.clientName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {d.factors.slice(0, 2).join(' · ')}
              </p>
            </div>
            <span className="text-xs text-gray-400">{d.typeDossier}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ScoreBadge({ score, level }: { score: number; level: string }) {
  const colors = {
    critical: 'bg-red-100 text-red-700 border-red-300',
    high: 'bg-orange-100 text-orange-700 border-orange-300',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    low: 'bg-green-100 text-green-700 border-green-300',
  };

  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border ${colors[level as keyof typeof colors] || colors.low}`}>
      {score}
    </div>
  );
}
