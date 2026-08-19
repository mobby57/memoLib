'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, ArrowRight, Calendar, CheckCircle, Clock, FileText,
  Flame, Mail, PenTool, Phone, Plus, Send, Sparkles, User, Zap,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface UrgentAction {
  id: string;
  type: 'deadline' | 'email' | 'signature' | 'document' | 'audience';
  priority: 'critical' | 'high' | 'medium';
  title: string;
  subtitle?: string;
  href: string;
  dueIn?: string; // "2h", "aujourd'hui", "demain"
  dossierId?: string;
  clientName?: string;
}

interface DayStats {
  actionsUrgentes: number;
  emailsNonLus: number;
  echeancesAujourdhui: number;
  signaturesEnAttente: number;
  dossiersModifies: number;
}

interface CompletedYesterday {
  count: number;
  items: string[];
}

interface Props {
  tenantId?: string;
  userName?: string;
}

// ─── Composant principal ────────────────────────────────────────────────────────

export function MyDay({ tenantId, userName }: Props) {
  const [actions, setActions] = useState<UrgentAction[]>([]);
  const [stats, setStats] = useState<DayStats | null>(null);
  const [completed, setCompleted] = useState<CompletedYesterday | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!tenantId) { setLoading(false); return; }
    loadMyDay();
  }, [tenantId]);

  const loadMyDay = async () => {
    try {
      const [deadlinesRes, emailsRes] = await Promise.allSettled([
        fetch(`/api/legal-deadlines?tenantId=${tenantId}&upcoming=true&limit=10`).then(r => r.ok ? r.json() : null),
        fetch(`/api/emails?tenantId=${tenantId}&filter=unread&limit=5`).then(r => r.ok ? r.json() : null),
      ]);

      const urgentActions: UrgentAction[] = [];

      // Deadlines critiques
      if (deadlinesRes.status === 'fulfilled' && deadlinesRes.value) {
        const deadlines = deadlinesRes.value.deadlines || deadlinesRes.value || [];
        for (const dl of deadlines.slice(0, 5)) {
          const dueDate = new Date(dl.dueDate);
          const now = new Date();
          const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / 86400000);
          
          if (daysLeft <= 3) {
            urgentActions.push({
              id: `dl-${dl.id}`,
              type: 'deadline',
              priority: daysLeft <= 1 ? 'critical' : 'high',
              title: dl.label || dl.title || 'Échéance',
              subtitle: dl.clientName || dl.dossierNumero,
              href: `/dossiers/${dl.dossierId}`,
              dueIn: daysLeft <= 0 ? 'EXPIRÉ' : daysLeft === 1 ? "Aujourd'hui" : `J-${daysLeft}`,
              dossierId: dl.dossierId,
              clientName: dl.clientName,
            });
          }
        }
      }

      // Emails non traités
      if (emailsRes.status === 'fulfilled' && emailsRes.value) {
        const emails = emailsRes.value.emails || emailsRes.value || [];
        for (const email of emails.slice(0, 3)) {
          urgentActions.push({
            id: `email-${email.id}`,
            type: 'email',
            priority: email.urgence === 'critique' ? 'critical' : 'medium',
            title: email.subject || '(sans objet)',
            subtitle: email.from,
            href: `/emails/${email.id}`,
            dueIn: email.urgence === 'critique' ? 'Urgent' : undefined,
          });
        }
      }

      // Trier par priorité
      const priorityOrder = { critical: 0, high: 1, medium: 2 };
      urgentActions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      setActions(urgentActions);
      setStats({
        actionsUrgentes: urgentActions.filter(a => a.priority === 'critical').length,
        emailsNonLus: urgentActions.filter(a => a.type === 'email').length,
        echeancesAujourdhui: urgentActions.filter(a => a.type === 'deadline' && a.dueIn === "Aujourd'hui").length,
        signaturesEnAttente: 0,
        dossiersModifies: 0,
      });
    } catch {}
    setLoading(false);
  };

  const dismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };

  const visibleActions = actions.filter(a => !dismissedIds.has(a.id));
  const greeting = getGreeting();

  // ─── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
        <div className="space-y-3">
          <div className="h-14 bg-gray-100 rounded-xl" />
          <div className="h-14 bg-gray-100 rounded-xl" />
          <div className="h-14 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  // ─── Rien à faire ───────────────────────────────────────────────────────────

  if (visibleActions.length === 0) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-green-800">{greeting}, {userName || 'Maître'} !</h2>
            <p className="text-sm text-green-600">Rien d&apos;urgent. Votre journée est libre — profitez-en pour avancer sur vos dossiers.</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Link href="/dossiers" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700">
            <FileText className="w-3.5 h-3.5" /> Mes dossiers
          </Link>
          <Link href="/documents" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-green-700 border border-green-300 text-xs font-medium rounded-lg hover:bg-green-50">
            <Plus className="w-3.5 h-3.5" /> Nouveau document
          </Link>
        </div>
      </div>
    );
  }

  // ─── Vue principale ─────────────────────────────────────────────────────────

  const criticalCount = visibleActions.filter(a => a.priority === 'critical').length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {greeting}, {userName || 'Maître'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {criticalCount > 0 ? (
                <span className="text-red-600 font-medium">
                  <Flame className="w-3.5 h-3.5 inline mr-1" />
                  {criticalCount} action{criticalCount > 1 ? 's' : ''} critique{criticalCount > 1 ? 's' : ''} — à traiter maintenant
                </span>
              ) : (
                <>{visibleActions.length} action{visibleActions.length > 1 ? 's' : ''} à traiter aujourd&apos;hui</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
        </div>
      </div>

      {/* Actions urgentes */}
      <div className="divide-y divide-gray-50">
        {visibleActions.map((action) => (
          <ActionItem key={action.id} action={action} onDismiss={() => dismiss(action.id)} />
        ))}
      </div>

      {/* Quick actions en bas */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
        <span className="text-xs text-gray-400 mr-2">Actions rapides :</span>
        <Link href="/emails" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
          <Mail className="w-3 h-3" /> Emails
        </Link>
        <Link href="/dossiers" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
          <FileText className="w-3 h-3" /> Dossiers
        </Link>
        <Link href="/documents" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
          <Sparkles className="w-3 h-3" /> Générer DOCX
        </Link>
      </div>
    </div>
  );
}

// ─── Sous-composant : une action urgente ────────────────────────────────────────

function ActionItem({ action, onDismiss }: { action: UrgentAction; onDismiss: () => void }) {
  const config = ACTION_CONFIG[action.type];
  const priorityStyles = {
    critical: 'border-l-4 border-l-red-500 bg-red-50/30',
    high: 'border-l-4 border-l-orange-400 bg-orange-50/20',
    medium: 'border-l-4 border-l-blue-300 bg-blue-50/10',
  };

  return (
    <div className={`px-6 py-3 flex items-center gap-4 transition-colors hover:bg-gray-50/80 ${priorityStyles[action.priority]}`}>
      {/* Icône */}
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${config.iconBg}`}>
        <config.icon className={`w-4.5 h-4.5 ${config.iconColor}`} />
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{action.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {action.clientName && (
            <span className="text-xs text-gray-500 flex items-center gap-0.5">
              <User className="w-3 h-3" /> {action.clientName}
            </span>
          )}
          {action.subtitle && !action.clientName && (
            <span className="text-xs text-gray-400 truncate">{action.subtitle}</span>
          )}
        </div>
      </div>

      {/* Badge délai */}
      {action.dueIn && (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
          action.priority === 'critical' ? 'bg-red-100 text-red-700 animate-pulse' :
          action.priority === 'high' ? 'bg-orange-100 text-orange-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {action.dueIn}
        </span>
      )}

      {/* Action */}
      <Link
        href={action.href}
        className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 text-white text-xs font-medium rounded-lg hover:bg-gray-900 flex-shrink-0"
      >
        Traiter <ArrowRight className="w-3 h-3" />
      </Link>

      {/* Dismiss */}
      <button
        onClick={onDismiss}
        className="p-1 text-gray-300 hover:text-gray-500 flex-shrink-0"
        title="Masquer"
      >
        <CheckCircle className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Config ─────────────────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<string, { icon: any; iconBg: string; iconColor: string }> = {
  deadline: { icon: AlertTriangle, iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
  email: { icon: Mail, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  signature: { icon: PenTool, iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
  document: { icon: FileText, iconBg: 'bg-green-100', iconColor: 'text-green-600' },
  audience: { icon: Calendar, iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}
