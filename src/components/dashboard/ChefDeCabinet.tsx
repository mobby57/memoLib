'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Mail,
  Play,
  Users,
  ArrowRight,
  Brain,
  Loader2,
} from 'lucide-react';

interface DailyAction {
  id: string;
  type: 'deadline' | 'missing_doc' | 'relance' | 'new_email' | 'incomplete';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  subtitle: string;
  href: string;
  dossierId?: string;
}

interface ChefData {
  greeting: string;
  date: string;
  counts: { critical: number; incomplete: number; relance: number; emails: number };
  actions: DailyAction[];
}

export function ChefDeCabinet({ tenantId, userName }: { tenantId?: string; userName?: string }) {
  const [data, setData] = useState<ChefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    if (!tenantId) { setLoading(false); return; }
    fetch('/api/ai/copilot/daily-actions')
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [tenantId]);

  if (loading) return (
    <div className="animate-pulse bg-gradient-to-r from-indigo-100 to-blue-100 rounded-2xl h-48" />
  );

  if (!data) return null;

  const { counts, actions } = data;
  const totalUrgent = counts.critical + counts.incomplete + counts.relance + counts.emails;

  if (totalUrgent === 0 && !showActions) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-8 h-8 text-green-600" />
          <div>
            <h2 className="text-lg font-bold text-green-900">
              Bonjour Maître{userName ? ` ${userName}` : ''} 👋
            </h2>
            <p className="text-green-700 text-sm">Aucune urgence aujourd&apos;hui. Votre journée est libre.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white">
        <h2 className="text-xl font-bold">
          Bonjour Maître{userName ? ` ${userName}` : ''} 👋
        </h2>
        <p className="text-indigo-100 text-sm mt-1">
          {data.date} — Voici vos priorités du jour
        </p>

        {/* Compteurs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {counts.critical > 0 && (
            <CountBadge icon={AlertTriangle} count={counts.critical} label="Critiques" color="bg-red-500/20" />
          )}
          {counts.incomplete > 0 && (
            <CountBadge icon={FileText} count={counts.incomplete} label="Incomplets" color="bg-orange-500/20" />
          )}
          {counts.relance > 0 && (
            <CountBadge icon={Users} count={counts.relance} label="Relances" color="bg-yellow-500/20" />
          )}
          {counts.emails > 0 && (
            <CountBadge icon={Mail} count={counts.emails} label="Nouveaux emails" color="bg-white/10" />
          )}
        </div>
      </div>

      {/* Bouton principal ou liste d'actions */}
      {!showActions ? (
        <div className="p-6 text-center">
          <button
            onClick={() => setShowActions(true)}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all text-lg"
          >
            <Play className="w-6 h-6" />
            COMMENCER MA JOURNÉE
          </button>
          <p className="text-xs text-gray-500 mt-3">
            {totalUrgent} action{totalUrgent > 1 ? 's' : ''} à traiter
          </p>
        </div>
      ) : (
        <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
          {actions.map((action) => (
            <ActionItem key={action.id} action={action} />
          ))}
        </div>
      )}
    </div>
  );
}

function CountBadge({ icon: Icon, count, label, color }: { icon: any; count: number; label: string; color: string }) {
  return (
    <div className={`${color} rounded-xl p-3`}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span className="text-xl font-bold">{count}</span>
      </div>
      <p className="text-xs text-white/80 mt-1">{label}</p>
    </div>
  );
}

function ActionItem({ action }: { action: DailyAction }) {
  const priorityStyles = {
    critical: 'border-l-4 border-l-red-500 bg-red-50',
    high: 'border-l-4 border-l-orange-500 bg-orange-50',
    medium: 'border-l-4 border-l-yellow-500 bg-yellow-50',
    low: 'border-l-4 border-l-gray-300 bg-gray-50',
  };

  const typeIcons = {
    deadline: Clock,
    missing_doc: FileText,
    relance: Users,
    new_email: Mail,
    incomplete: AlertTriangle,
  };

  const Icon = typeIcons[action.type];

  return (
    <Link
      href={action.href}
      className={`flex items-center gap-3 p-3 rounded-xl ${priorityStyles[action.priority]} hover:opacity-80 transition-opacity`}
    >
      <Icon className="w-5 h-5 text-gray-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{action.title}</p>
        <p className="text-xs text-gray-600">{action.subtitle}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
    </Link>
  );
}
