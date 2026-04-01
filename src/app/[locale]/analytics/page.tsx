'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Breadcrumb, Alert } from '@/components/ui';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks';
import { runUiAsyncAction } from '@/lib/ui-async-action';
import { RefreshCw, TrendingUp, Mail, Bot, Activity } from 'lucide-react';

type ApiState<T> = {
  loading: boolean;
  error: string | null;
  data: T | null;
};

type RevenueSummary = {
  monthlyRevenue?: number;
  annualRevenue?: number;
  growthRate?: number;
};

type EmailSummary = {
  totalEmails?: number;
  processedEmails?: number;
  pendingEmails?: number;
  automationRate?: number;
};

type AiSummary = {
  totalRequests?: number;
  totalTokens?: number;
  estimatedCost?: number;
  averageResponseTimeMs?: number;
};

type MetricsSummary = {
  summary?: {
    totalRequests?: number;
    avgResponseTime?: number;
    operationsTracked?: number;
  };
  health?: {
    status?: string;
  };
};

function NumberStat({ label, value, suffix = '' }: { label: string; value: number | string; suffix?: string }) {
  return (
    <div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
        {value}
        {suffix}
      </p>
    </div>
  );
}

function getNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export default function AnalyticsPage() {
  const { status } = useSession();
  const { showToast } = useToast();
  const [revenue, setRevenue] = useState<ApiState<RevenueSummary>>({ loading: true, error: null, data: null });
  const [emails, setEmails] = useState<ApiState<EmailSummary>>({ loading: true, error: null, data: null });
  const [ai, setAi] = useState<ApiState<AiSummary>>({ loading: true, error: null, data: null });
  const [metrics, setMetrics] = useState<ApiState<MetricsSummary>>({ loading: true, error: null, data: null });

  const loadRevenue = async () => {
    setRevenue((prev) => ({ ...prev, loading: true, error: null }));
    const payload = await runUiAsyncAction({
      action: async () => {
        const response = await fetch('/api/analytics/revenue?type=current', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Impossible de recuperer les donnees revenus');
        }
        return response.json();
      },
      showToast,
      fallbackErrorMessage: 'Revenus indisponibles',
      context: { feature: 'analytics', action: 'load-revenue' },
    });

    if (payload) {
      setRevenue({ loading: false, error: null, data: payload?.data ?? payload ?? null });
    } else {
      setRevenue({ loading: false, error: 'Revenus indisponibles', data: null });
    }
  };

  const loadEmails = async () => {
    setEmails((prev) => ({ ...prev, loading: true, error: null }));
    const payload = await runUiAsyncAction({
      action: async () => {
        const response = await fetch('/api/analytics/emails?type=current', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Impossible de recuperer les donnees emails');
        }
        return response.json();
      },
      showToast,
      fallbackErrorMessage: 'Emails indisponibles',
      context: { feature: 'analytics', action: 'load-emails' },
    });

    if (payload) {
      setEmails({ loading: false, error: null, data: payload?.data ?? payload ?? null });
    } else {
      setEmails({ loading: false, error: 'Emails indisponibles', data: null });
    }
  };

  const loadAi = async () => {
    setAi((prev) => ({ ...prev, loading: true, error: null }));
    const payload = await runUiAsyncAction({
      action: async () => {
        const response = await fetch('/api/analytics/ai?type=current', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Impossible de recuperer les donnees IA');
        }
        return response.json();
      },
      showToast,
      fallbackErrorMessage: 'IA indisponible',
      context: { feature: 'analytics', action: 'load-ai' },
    });

    if (payload) {
      setAi({ loading: false, error: null, data: payload?.data ?? payload ?? null });
    } else {
      setAi({ loading: false, error: 'IA indisponible', data: null });
    }
  };

  const loadMetrics = async () => {
    setMetrics((prev) => ({ ...prev, loading: true, error: null }));
    const payload = await runUiAsyncAction({
      action: async () => {
        const response = await fetch('/api/analytics/metrics', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Impossible de recuperer les metriques');
        }
        return response.json();
      },
      showToast,
      fallbackErrorMessage: 'Metriques indisponibles',
      context: { feature: 'analytics', action: 'load-metrics' },
    });

    if (payload) {
      setMetrics({ loading: false, error: null, data: payload ?? null });
    } else {
      setMetrics({ loading: false, error: 'Metriques indisponibles', data: null });
    }
  };

  const refreshAll = async () => {
    await Promise.all([loadRevenue(), loadEmails(), loadAi(), loadMetrics()]);
  };

  useEffect(() => {
    if (status === 'authenticated') {
      refreshAll();
    }
  }, [status]);

  const loading = revenue.loading || emails.loading || ai.loading || metrics.loading;

  const healthStatus = useMemo(() => {
    const raw = metrics.data?.health?.status;
    if (raw === 'good') return 'Bon';
    if (raw === 'degraded') return 'Degrade';
    if (raw === 'critical') return 'Critique';
    return 'Inconnu';
  }, [metrics.data]);

  if (status === 'loading') {
    return (
      <div className="p-6">
        <p className="text-gray-600">Chargement de la session...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="p-6">
        <Alert variant="warning">Vous devez etre connecte pour consulter les analytics.</Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Analytics', href: '/analytics' },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Vue operationnelle revenus, emails, IA et performance API.
          </p>
        </div>
        <button
          type="button"
          onClick={refreshAll}
          disabled={loading}
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {(revenue.error || emails.error || ai.error || metrics.error) && (
        <Alert variant="warning">
          Certaines donnees ne sont pas disponibles actuellement. Les cartes affichent une valeur de repli.
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 text-blue-600">
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm font-semibold">Revenus</span>
          </div>
          <NumberStat
            label="Mensuel"
            value={getNumber(revenue.data?.monthlyRevenue).toLocaleString('fr-FR')}
            suffix=" EUR"
          />
          <p className="mt-2 text-xs text-gray-500">
            Croissance: {getNumber(revenue.data?.growthRate).toFixed(1)}%
          </p>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 text-emerald-600">
            <Mail className="h-5 w-5" />
            <span className="text-sm font-semibold">Emails</span>
          </div>
          <NumberStat
            label="Traites"
            value={getNumber(emails.data?.processedEmails).toLocaleString('fr-FR')}
          />
          <p className="mt-2 text-xs text-gray-500">
            En attente: {getNumber(emails.data?.pendingEmails).toLocaleString('fr-FR')}
          </p>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 text-purple-600">
            <Bot className="h-5 w-5" />
            <span className="text-sm font-semibold">IA</span>
          </div>
          <NumberStat label="Requetes" value={getNumber(ai.data?.totalRequests).toLocaleString('fr-FR')} />
          <p className="mt-2 text-xs text-gray-500">
            Tokens: {getNumber(ai.data?.totalTokens).toLocaleString('fr-FR')}
          </p>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 text-amber-600">
            <Activity className="h-5 w-5" />
            <span className="text-sm font-semibold">API</span>
          </div>
          <NumberStat
            label="Req. totales"
            value={getNumber(metrics.data?.summary?.totalRequests).toLocaleString('fr-FR')}
          />
          <p className="mt-2 text-xs text-gray-500">Sante: {healthStatus}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Résumé technique</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-gray-500">Temps de reponse moyen API</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {getNumber(metrics.data?.summary?.avgResponseTime).toFixed(1)} ms
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Operations suivies</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {getNumber(metrics.data?.summary?.operationsTracked).toLocaleString('fr-FR')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Cout IA estime</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {getNumber(ai.data?.estimatedCost).toFixed(2)} EUR
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
