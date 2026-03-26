'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Clock3, FolderOpen, Layers3, Users } from 'lucide-react';
import { listClients, listDossiers, type DossierListItem } from '@/lib/services/dossiers-api';
import {
  getEmailIngestionMonitoring,
  type EmailIngestionHealthStatus,
} from '@/lib/services/monitoring-api';
import { listTasks, type TaskApiItem } from '@/lib/services/tasks-api';

type DashboardData = {
  dossiers: DossierListItem[];
  clientsCount: number;
  tasks: TaskApiItem[];
  emailIngestionHealth: {
    status: EmailIngestionHealthStatus;
    errorRate: string;
    successRate: string;
    reasons: string[];
    primaryReason: string;
  } | null;
};

function toSeverity(value: string | null | undefined): 'critique' | 'haute' | 'normale' {
  const normalized = (value || '').toLowerCase();
  if (normalized === 'critical' || normalized === 'critique') return 'critique';
  if (normalized === 'high' || normalized === 'haute') return 'haute';
  return 'normale';
}

function toSla(value: string | null | undefined): string {
  if (!value) return 'Sans echeance';
  const due = new Date(value);
  if (isNaN(due.getTime())) return 'Sans echeance';

  const diffMs = due.getTime() - Date.now();
  if (diffMs <= 0) return 'Echu';
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) return `Echeance dans ${diffHours}h`;
  return `Echeance dans ${Math.round(diffHours / 24)}j`;
}

const severityClass: Record<string, string> = {
  critique: 'bg-rose-100 text-rose-700',
  haute: 'bg-orange-100 text-orange-700',
  normale: 'bg-slate-100 text-slate-700',
};

const healthClass: Record<EmailIngestionHealthStatus, string> = {
  healthy: 'bg-emerald-100 text-emerald-700',
  degraded: 'bg-amber-100 text-amber-700',
  critical: 'bg-rose-100 text-rose-700',
};

type DashboardPageProps = {
  params: {
    locale: string;
  };
};

export default function DashboardPage({ params }: DashboardPageProps) {
  const [data, setData] = useState<DashboardData>({
    dossiers: [],
    clientsCount: 0,
    tasks: [],
    emailIngestionHealth: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queueSort, setQueueSort] = useState<'priority' | 'dueDate'>('priority');

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const [dossiersRes, clientsRes, tasksRes] = await Promise.all([
          listDossiers({ limit: 100 }),
          listClients({ limit: 1 }),
          listTasks(),
        ]);
        const monitoringRes = await getEmailIngestionMonitoring().catch(() => null);

        if (!active) return;

        setData({
          dossiers: dossiersRes.data,
          clientsCount: clientsRes.pagination.total,
          tasks: tasksRes.data,
          emailIngestionHealth: monitoringRes
            ? {
                status: monitoringRes.status,
                errorRate: monitoringRes.data.rates.errorRate,
                successRate: monitoringRes.data.rates.successRate,
                reasons: monitoringRes.data.health.reasons,
                primaryReason: monitoringRes.data.health.reasons[0] || 'Aucune alerte',
              }
            : null,
        });
      } catch (fetchError) {
        if (!active) return;
        const message = fetchError instanceof Error ? fetchError.message : 'Erreur de chargement dashboard';
        setError(message);
      } finally {
        if (active) setLoading(false);
      }
    };

    run();

    return () => {
      active = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const tasksUrgentes = data.tasks.filter((task) => toSeverity(task.priority) === 'critique' || toSeverity(task.priority) === 'haute').length;
    const dossiersActifs = data.dossiers.filter((dossier) => (dossier.statut || '').toLowerCase() !== 'archive').length;

    return [
      {
        label: 'Dossiers actifs',
        value: String(dossiersActifs),
        delta: `${data.dossiers.length} dossier(s) charges`,
        icon: FolderOpen,
        tone: 'bg-blue-50 text-blue-700',
      },
      {
        label: 'Clients suivis',
        value: String(data.clientsCount),
        delta: 'Source API clients',
        icon: Users,
        tone: 'bg-cyan-50 text-cyan-700',
      },
      {
        label: 'Actions urgentes',
        value: String(tasksUrgentes),
        delta: 'Priorite haute/critique',
        icon: AlertTriangle,
        tone: 'bg-amber-50 text-amber-700',
      },
      {
        label: 'Flux en attente',
        value: String(data.tasks.length),
        delta: 'Taches assignees',
        icon: Layers3,
        tone: 'bg-emerald-50 text-emerald-700',
      },
    ];
  }, [data]);

  const PRIORITY_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

  const priorityQueue = useMemo(() => {
    const sorted = [...data.tasks].sort((a, b) => {
      if (queueSort === 'priority') {
        const pa = PRIORITY_ORDER[(a.priority || '').toUpperCase()] ?? 4;
        const pb = PRIORITY_ORDER[(b.priority || '').toUpperCase()] ?? 4;
        if (pa !== pb) return pa - pb;
      }
      const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return da - db;
    });
    return sorted.slice(0, 5).map((task) => ({
      id: task.case?.numero || task.id,
      title: task.title,
      sla: toSla(task.dueDate),
      owner: task.assignedTo?.name || 'Equipe',
      severity: toSeverity(task.priority),
    }));
  }, [data.tasks, queueSort]);

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">Chargement dashboard...</div>;
  }

  if (error) {
    return <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article key={metric.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{metric.label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{metric.value}</p>
                </div>
                <span className={`rounded-lg p-2 ${metric.tone}`}>
                  <Icon size={18} />
                </span>
              </div>
              <p className="mt-3 text-xs font-medium text-slate-600">{metric.delta}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <article className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">File prioritaire</h2>
            <div className="flex items-center gap-3">
              <div className="flex rounded-lg border border-slate-200 text-xs">
                <button
                  onClick={() => setQueueSort('priority')}
                  className={`px-2 py-1 rounded-l-lg transition-colors ${
                    queueSort === 'priority'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Priorite
                </button>
                <button
                  onClick={() => setQueueSort('dueDate')}
                  className={`px-2 py-1 rounded-r-lg transition-colors ${
                    queueSort === 'dueDate'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Echeance
                </button>
              </div>
              <Link
                href={`/${params.locale}/tasks`}
                className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
              >
                Ouvrir toutes les taches
              </Link>
            </div>
          </header>

          <div className="divide-y divide-slate-100">
            {priorityQueue.length === 0 ? (
              <div className="px-6 py-6 text-sm text-slate-500">Aucune tache prioritaire.</div>
            ) : priorityQueue.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 px-6 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.id} - {item.owner}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${severityClass[item.severity]}`}>
                    {item.severity}
                  </span>
                  <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500">
                    <Clock3 size={12} />
                    {item.sla}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Rythme journalier</h2>
          <p className="mt-1 text-sm text-slate-500">Capacite et niveau de charge de l equipe</p>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Sante ingestion email</p>
              {data.emailIngestionHealth ? (
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${healthClass[data.emailIngestionHealth.status]}`}>
                  {data.emailIngestionHealth.status}
                </span>
              ) : (
                <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-600">indisponible</span>
              )}
            </div>
            {data.emailIngestionHealth ? (
              <>
                <p className="mt-2 text-xs text-slate-600">
                  succes {data.emailIngestionHealth.successRate}% - erreurs {data.emailIngestionHealth.errorRate}%
                </p>
                <p className="mt-1 text-xs text-slate-500">{data.emailIngestionHealth.primaryReason}</p>
              </>
            ) : (
              <p className="mt-2 text-xs text-slate-500">Accessible pour les roles admin uniquement.</p>
            )}
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Traitement cible</span>
                <span>82%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div className="h-2 w-[82%] rounded-full bg-emerald-500" />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Retards critiques</span>
                <span>34%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div className="h-2 w-[34%] rounded-full bg-rose-500" />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Relecture juridique</span>
                <span>67%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div className="h-2 w-[67%] rounded-full bg-blue-500" />
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
