'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Deadline {
  id: string;
  label: string;
  dueDate: string;
  dossierId: string;
  dossierNumero?: string;
  clientName?: string;
  type: string;
  status: string;
}

export function DeadlineAlerts({ tenantId }: { tenantId?: string }) {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    fetch(`/api/legal-deadlines?tenantId=${tenantId}&upcoming=true&limit=10`)
      .then((r) => r.json())
      .then((data) => setDeadlines(data.deadlines || data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenantId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-40 mb-4" />
        <div className="space-y-3">
          <div className="h-12 bg-gray-100 rounded-xl" />
          <div className="h-12 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (deadlines.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5 text-blue-500" />
          Échéances
        </h3>
        <p className="text-sm text-gray-400">Aucune échéance proche. Tout est sous contrôle ✓</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-orange-500" />
        Échéances proches
        <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
          {deadlines.length}
        </span>
      </h3>

      <div className="space-y-2">
        {deadlines.slice(0, 5).map((dl) => {
          const daysLeft = Math.ceil((new Date(dl.dueDate).getTime() - Date.now()) / 86400000);
          const urgencyClass =
            daysLeft <= 1 ? 'border-l-red-500 bg-red-50' :
            daysLeft <= 3 ? 'border-l-orange-500 bg-orange-50' :
            'border-l-yellow-500 bg-yellow-50';
          const badgeClass =
            daysLeft <= 1 ? 'bg-red-100 text-red-700' :
            daysLeft <= 3 ? 'bg-orange-100 text-orange-700' :
            'bg-yellow-100 text-yellow-700';

          return (
            <Link
              key={dl.id}
              href={`/dossiers/${dl.dossierId}`}
              className={`block border-l-4 rounded-r-xl p-3 hover:shadow-sm transition-shadow ${urgencyClass}`}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{dl.label}</p>
                  <p className="text-xs text-gray-500">
                    {dl.clientName || dl.dossierNumero || 'Dossier'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
                    {daysLeft <= 0 ? 'EXPIRÉ' : daysLeft === 1 ? 'J-1' : `J-${daysLeft}`}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {deadlines.length > 5 && (
        <Link href="/dossiers?filter=deadlines" className="block text-center text-xs text-blue-600 hover:text-blue-800 mt-3 font-medium">
          Voir toutes les échéances ({deadlines.length})
        </Link>
      )}
    </div>
  );
}
