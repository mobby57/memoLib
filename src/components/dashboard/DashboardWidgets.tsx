'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, AlertTriangle, FileText, Mail, ArrowRight } from 'lucide-react';

// ============================================
// DEADLINE WIDGET
// ============================================

interface DeadlineItem {
  id: string;
  label: string;
  dueDate: string;
  status: string;
  dossier: { id: string; numero: string };
}

export function DeadlineWidget() {
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/legal-deadlines?status=PENDING,APPROACHING,URGENT,CRITICAL&limit=5')
      .then(r => r.ok ? r.json() : { deadlines: [] })
      .then(d => setDeadlines(d.deadlines || []))
      .catch(() => setDeadlines([]))
      .finally(() => setLoading(false));
  }, []);

  const statusColor: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-700 border-red-300',
    OVERDUE: 'bg-red-200 text-red-800 border-red-400',
    URGENT: 'bg-orange-100 text-orange-700 border-orange-300',
    APPROACHING: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    PENDING: 'bg-blue-100 text-blue-700 border-blue-300',
  };

  if (loading) return <WidgetSkeleton title="Échéances proches" />;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Clock size={20} className="text-orange-500" />
          Échéances proches
        </h3>
        {deadlines.length > 0 && (
          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
            {deadlines.length}
          </span>
        )}
      </div>

      {deadlines.length === 0 ? (
        <p className="text-gray-400 text-sm py-4 text-center">Aucune échéance proche</p>
      ) : (
        <div className="space-y-3">
          {deadlines.map(dl => {
            const daysLeft = Math.ceil((new Date(dl.dueDate).getTime() - Date.now()) / 86400000);
            return (
              <Link
                key={dl.id}
                href={`/dossiers/${dl.dossier.id}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <AlertTriangle size={16} className={daysLeft <= 1 ? 'text-red-500' : 'text-orange-400'} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{dl.label}</p>
                    <p className="text-xs text-gray-400">{dl.dossier.numero}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${statusColor[dl.status] || statusColor.PENDING}`}>
                    {daysLeft <= 0 ? 'DÉPASSÉ' : `J-${daysLeft}`}
                  </span>
                  <ArrowRight size={14} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================
// DRAFT WIDGET
// ============================================

interface DraftSummary {
  id: string;
  extractedData: { subject?: string; caseType?: string; urgency?: string; clientName?: string };
  createdAt: string;
}

export function DraftWidget() {
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/drafts?status=PENDING')
      .then(r => r.ok ? r.json() : { drafts: [] })
      .then(d => setDrafts((d.drafts || []).slice(0, 5)))
      .catch(() => setDrafts([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <WidgetSkeleton title="Emails à traiter" />;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Mail size={20} className="text-blue-500" />
          Emails à traiter
        </h3>
        {drafts.length > 0 && (
          <Link href="/drafts" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            Voir tout <ArrowRight size={12} />
          </Link>
        )}
      </div>

      {drafts.length === 0 ? (
        <p className="text-gray-400 text-sm py-4 text-center">Aucun email en attente</p>
      ) : (
        <div className="space-y-3">
          {drafts.map(draft => {
            const d = draft.extractedData;
            const urgencyColor: Record<string, string> = {
              critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-blue-500', low: 'bg-gray-400',
            };
            return (
              <Link
                key={draft.id}
                href={`/drafts/${draft.id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group"
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${urgencyColor[d.urgency || 'medium']}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{d.subject || 'Sans sujet'}</p>
                  <p className="text-xs text-gray-400">{d.clientName || 'Client inconnu'} · {d.caseType || '?'}</p>
                </div>
                <ArrowRight size={14} className="text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================
// SKELETON
// ============================================

function WidgetSkeleton({ title }: { title: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-300 mb-4">{title}</h3>
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
