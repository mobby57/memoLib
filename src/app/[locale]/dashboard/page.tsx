'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { MetricsWidgets, type MetricsData } from '@/components/MetricsWidgets';
import { Alert, Badge, Card, StatCard, Tabs, useToast } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { DeadlineAlerts } from '@/components/dashboard/DeadlineAlerts';
import { TodayFocus } from '@/components/dashboard/TodayFocus';
import MorningBrief from '@/components/dashboard/MorningBrief';
import { MyDay } from '@/components/dashboard/MyDay';
import { AIDisclaimer } from '@/components/legal/AIDisclaimer';
import { LegalFooter } from '@/components/legal/LegalFooter';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  FileText,
  Folder,
  Mail,
  MessageSquare,
  Plus,
  Shield,
  TrendingUp,
  Users,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConnectEmailPanel } from '@/components/emails/ConnectEmailButton';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface DashboardStats {
  totalDossiers: number;
  dossiersActifs: number;
  facturesEnAttente: number;
  revenus: number;
  trends: {
    dossiers: number;
    factures: number;
    revenus: number;
  };
}

interface MonthlyData {
  month: string;
  dossiers: number;
  factures: number;
  revenus: number;
}

interface StatusData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

interface RecentActivity {
  id: string;
  type: 'dossier' | 'facture' | 'client';
  title: string;
  date: string;
  status: 'success' | 'warning' | 'info';
}

interface QuickAction {
  label: string;
  href: string;
  icon: LucideIcon;
  color: string;
}

export default function DashboardPage() {
  const {
    user,
    isLoading,
    isAuthenticated,
    isSuperAdmin,
    isAdmin,
    isClient,
    hasRole,
    hasPermission,
  } = useAuth();
  const { addToast } = useToast();
  const searchParams = useSearchParams();

  const [showConnectEmail, setShowConnectEmail] = useState(false);

  const [stats, setStats] = useState<DashboardStats>({
    totalDossiers: 0,
    dossiersActifs: 0,
    facturesEnAttente: 0,
    revenus: 0,
    trends: { dossiers: 0, factures: 0, revenus: 0 },
  });

  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);
  const [onboardingSteps, setOnboardingSteps] = useState<{
    accountCreated: boolean;
    firstClient: boolean;
    firstEmail: boolean;
    firstDossier: boolean;
  } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState<'loading' | 'ready' | 'unavailable'>(
    'loading'
  );

  // Charger le statut d'onboarding
  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    let cancelled = false;
    setOnboardingStatus('loading');
    fetch('/api/onboarding/status')
      .then(response => {
        if (!response.ok) {
          throw new Error('Unable to load onboarding status');
        }
        return response.json();
      })
      .then(data => {
        if (cancelled) return;
        if (data.needsOnboarding) {
          setOnboardingSteps(data.steps);
        } else {
          setShowOnboarding(false);
        }
        setOnboardingStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setOnboardingStatus('unavailable');
        setShowOnboarding(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading]);

  // Détecter connect-email=true (venant d'une démo)
  useEffect(() => {
    if (searchParams?.get('connect-email') === 'true') {
      setShowConnectEmail(true);
    }
  }, [searchParams]);

  // Redirection selon le role
  useEffect(() => {
    // Attendre que la session soit COMPLÈTEMENT chargée
    if (isLoading) return;
    // Ne pas rediriger immédiatement — laisser 2s pour que la session se charge
    if (!isAuthenticated) {
      const timeout = setTimeout(() => {
        window.location.href = '/fr/auth/login';
      }, 2000);
      return () => clearTimeout(timeout);
    }
    if (isClient) {
      window.location.href = '/fr/client-dashboard';
      return;
    }
    if (isSuperAdmin) {
      window.location.href = '/fr/super-admin';
      return;
    }
    // Redirection par rôle spécifique
    const role = (user as any)?.role;
    if (role === 'SECRETAIRE') {
      window.location.href = '/fr/secretaire';
      return;
    }
    if (role === 'COMPTABLE') {
      window.location.href = '/fr/comptable';
      return;
    }
    // Arrêter le loading pour les avocats/admins
    setLoading(false);
  }, [isLoading, isAuthenticated, isClient, isSuperAdmin, user]);

  // Charger les donnees du dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      loadDashboardData().catch(() => setLoading(false));
    }
  }, [isLoading, isAuthenticated]);

  const calculateMetrics = (statsData: any) => {
    const totalDossiers = statsData.totalDossiers || 0;
    const completedDossiers = statsData.dossiersTermines || 0;
    const completionRate =
      totalDossiers > 0 ? Math.round((completedDossiers / totalDossiers) * 100) : 0;

    const monthlyRevenue = statsData.revenus || 0;
    const monthlyGoal = 45000;
    const activeClients = Math.round(totalDossiers / 3) || 0;
    const pendingValidations = statsData.facturesEnAttente || 0;
    const overdueFiles = Math.round((statsData.dossiersEnAttente || 0) * 0.3);
    const successRate = completionRate;

    const trends = {
      completionRate: statsData.trends?.dossiers || 0,
      avgResponseTime: 0,
      avgProcessingTime: 0,
      monthlyRevenue: statsData.trends?.revenus || 0,
    };

    setMetricsData({
      completionRate,
      avgResponseTime: 0,
      avgProcessingTime: 0,
      clientSatisfaction: 0,
      monthlyRevenue,
      monthlyGoal,
      activeClients,
      pendingValidations,
      overdueFiles,
      successRate,
      trends,
    });
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const baseUrl = `/api/tenant/${user?.tenantId}`;

      // DÉMO MODE: uniquement pour les vrais comptes de démo
      const isDemoMode = !user?.tenantId || user.tenantId === 'demo-tenant-1';

      let statsData;
      if (isDemoMode) {
        // Données de démo uniquement pour le compte démo explicite
        statsData = {
          totalDossiers: 24,
          dossiersActifs: 18,
          dossiersEnAttente: 4,
          dossiersTermines: 2,
          facturesEnAttente: 5,
          revenus: 12500,
          trends: { dossiers: 8, factures: 12, revenus: 15 },
        };
      } else {
        // API réelle pour tous les vrais tenants
        const statsResponse = await fetch(`${baseUrl}/dashboard/stats`);
        if (statsResponse.ok) {
          statsData = await statsResponse.json();
        } else {
          // Pas de fallback fake — montrer des zéros
          statsData = {
            totalDossiers: 0,
            dossiersActifs: 0,
            dossiersEnAttente: 0,
            dossiersTermines: 0,
            facturesEnAttente: 0,
            revenus: 0,
            trends: { dossiers: 0, factures: 0, revenus: 0 },
          };
        }
      }

      setStats({
        totalDossiers: statsData.totalDossiers,
        dossiersActifs: statsData.dossiersActifs,
        facturesEnAttente: statsData.facturesEnAttente,
        revenus: statsData.revenus,
        trends: statsData.trends,
      });

      setStatusData([
        { name: 'En cours', value: statsData.dossiersActifs, color: '#3b82f6' },
        { name: 'En attente', value: statsData.dossiersEnAttente, color: '#f59e0b' },
        { name: 'Termines', value: statsData.dossiersTermines, color: '#10b981' },
        { name: 'Archives', value: statsData.dossiersArchives, color: '#6b7280' },
      ]);

      // Calculer les metriques
      calculateMetrics(statsData);

      // Charger les donnees mensuelles
      const monthlyResponse = await fetch(`${baseUrl}/dashboard/monthly-data`);
      if (monthlyResponse.ok) {
        const monthlyDataResult = await monthlyResponse.json();
        setMonthlyData(monthlyDataResult);
      }

      // Charger les activités recentes
      const activitiesResponse = await fetch(`${baseUrl}/dashboard/recent-activities`);
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        setRecentActivities(activitiesData);
      }

      setLoading(false);
    } catch (error) {
      logger.error('Erreur chargement dashboard', { error });
      addToast?.({
        title: 'Erreur',
        message: 'Erreur lors du chargement des donnees',
        variant: 'error',
      });
      setLoading(false);
    }
  };

  // Actions rapides selon les permissions
  const getQuickActions = () => {
    const actions: QuickAction[] = [];

    if (hasPermission('canManageDossiers')) {
      actions.push({
        label: 'Nouveau Dossier',
        href: '/fr/dossiers/rapide',
        icon: Plus,
        color: 'bg-blue-500 hover:bg-blue-600',
      });
    }

    if (hasPermission('canManageFactures')) {
      actions.push({
        label: 'Nouvelle Facture',
        href: '/factures',
        icon: FileText,
        color: 'bg-green-500 hover:bg-green-600',
      });
    }

    if (hasPermission('canAccessAnalytics')) {
      actions.push({
        label: 'Exporter Donnees',
        href: '/exports',
        icon: Download,
        color: 'bg-purple-500 hover:bg-purple-600',
      });
    }

    actions.push({
      label: 'Assistant IA',
      href: '/ai-assistant',
      icon: MessageSquare,
      color: 'bg-indigo-500 hover:bg-indigo-600',
    });

    // Nouveau: Fonctionnalités IA Avancees
    actions.push({
      label: ' IA Avancee',
      href: '/lawyer/advanced',
      icon: Shield,
      color:
        'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg',
    });

    return actions;
  };

  if (isLoading || loading) {
    return (
      <main
        aria-busy="true"
        aria-live="polite"
        className="flex min-h-screen flex-col items-center justify-center gap-3"
        role="status"
      >
        <div
          aria-hidden="true"
          className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"
        />
        <p className="text-gray-600 dark:text-gray-400">Chargement de votre tableau de bord…</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p aria-live="polite" className="text-gray-600 dark:text-gray-400">
          Redirection vers la connexion sécurisée…
        </p>
      </div>
    );
  }

  // Cette page est pour tous les membres du cabinet (pas les clients ni super admin)
  const hasAccess =
    isAdmin ||
    hasRole('AVOCAT' as any) ||
    hasRole('ASSOCIE' as any) ||
    hasRole('COLLABORATEUR' as any) ||
    hasRole('STAGIAIRE' as any) ||
    hasRole('SECRETAIRE' as any) ||
    hasRole('COMPTABLE' as any);
  if (!hasAccess) {
    // Client ou super admin → redirection en cours via useEffect, afficher un spinner
    if (isClient || isSuperAdmin) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Accès non autorise</p>
          <Link href="/" className="text-blue-600 hover:underline mt-2 inline-block">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  const quickActions = getQuickActions();

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Modal connexion email (après inscription depuis démo) */}
      {showConnectEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 relative animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setShowConnectEmail(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Connectez votre boîte mail</h2>
              <p className="text-sm text-gray-500 mt-2">
                L&apos;IA analysera automatiquement vos emails entrants et détectera les urgences,
                deadlines et types de dossiers.
              </p>
            </div>
            <ConnectEmailPanel />
            <button
              onClick={() => setShowConnectEmail(false)}
              className="w-full mt-4 text-sm text-gray-400 hover:text-gray-600 py-2"
            >
              Je ferai ça plus tard
            </button>
          </div>
        </div>
      )}

      {/* AI Disclaimer Banner */}
      <AIDisclaimer variant="banner" />

      {/* === SECTION 1: ONBOARDING (si pas terminé) === */}
      {onboardingStatus === 'unavailable' && (
        <section
          aria-live="polite"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900"
          role="status"
        >
          <p className="font-medium">Le parcours de démarrage est momentanément indisponible.</p>
          <p className="mt-1 text-sm">
            Vous pouvez continuer à utiliser le tableau de bord. Si le problème persiste, contactez
            le support pilote.
          </p>
        </section>
      )}

      {onboardingStatus === 'ready' && showOnboarding && onboardingSteps && (
        <OnboardingFlow
          steps={onboardingSteps}
          userName={user?.name?.split(' ')[0]}
          onComplete={() => setShowOnboarding(false)}
          onDismiss={() => setShowOnboarding(false)}
        />
      )}

      {/* === SECTION 2: MY DAY — vue zero inbox === */}
      {!showOnboarding && (
        <>
          <MyDay tenantId={user?.tenantId} userName={user?.name?.split(' ')[0]} />
        </>
      )}

      {/* === SECTION 3: QUICK ACTIONS — gros boutons visibles === */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {quickActions.map(action => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className={`${action.color} text-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-3 group`}
            >
              <Icon className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <span className="font-medium text-sm">{action.label}</span>
            </Link>
          );
        })}
      </div>

      {/* === SECTION 4: DEADLINES CRITIQUES === */}
      <DeadlineAlerts tenantId={user?.tenantId} />

      {/* === SECTION 5: WELCOME COMPACT + STATS === */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm text-gray-500">
              {getGreeting()},{' '}
              <span className="font-semibold text-gray-900">{user?.name?.split(' ')[0]}</span> —{' '}
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>
          <Badge variant="info">{user?.role}</Badge>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMetrics(!showMetrics)}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-xs font-medium transition-colors"
          >
            {showMetrics ? 'Masquer métriques' : '📊 Métriques'}
          </button>
          <Link
            href="/ai-assistant"
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-medium transition-colors flex items-center gap-1"
          >
            <Zap className="w-3 h-3" /> Assistant IA
          </Link>
        </div>
      </div>
      {/* Widgets Metriques (toggle) */}
      {showMetrics && metricsData && (
        <div className="mt-2">
          <MetricsWidgets data={metricsData} />
        </div>
      )}

      {/* Alert for pending tasks */}
      {stats.facturesEnAttente > 0 && (
        <Alert variant="warning" title="Tâches en attente">
          Vous avez {stats.facturesEnAttente} facture(s) en attente de paiement.
          <Link href="/factures" className="ml-2 underline font-medium hover:text-yellow-700">
            Voir les factures →
          </Link>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Dossiers"
          value={stats.totalDossiers}
          icon={Folder}
          trend={{ value: stats.trends.dossiers, isPositive: stats.trends.dossiers > 0 }}
        />
        <StatCard title="Dossiers Actifs" value={stats.dossiersActifs} icon={FileText} />
        <StatCard
          title="Factures en Attente"
          value={stats.facturesEnAttente}
          icon={Clock}
          trend={{ value: Math.abs(stats.trends.factures), isPositive: false }}
        />
        <StatCard
          title="Revenus (€)"
          value={`${(stats.revenus / 1000).toFixed(0)}K`}
          icon={DollarSign}
          trend={{ value: stats.trends.revenus, isPositive: true }}
        />
      </div>

      {/* Charts with Tabs */}
      <Card>
        <Tabs
          variant="underline"
          defaultTab="evolution"
          tabs={[
            {
              id: 'evolution',
              label: 'evolution Mensuelle',
              icon: <TrendingUp className="w-4 h-4" />,
              content: (
                <div className="pt-4">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-gray-200 dark:stroke-gray-700"
                      />
                      <XAxis dataKey="month" className="text-gray-600 dark:text-gray-400" />
                      <YAxis className="text-gray-600 dark:text-gray-400" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--tooltip-bg, #ffffff)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="dossiers" fill="#3b82f6" name="Dossiers" />
                      <Bar dataKey="factures" fill="#10b981" name="Factures" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ),
            },
            {
              id: 'repartition',
              label: 'Repartition des Dossiers',
              icon: <FileText className="w-4 h-4" />,
              badge: statusData.reduce((sum, s) => sum + s.value, 0),
              content: (
                <div className="pt-4">
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                        }
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ),
            },
            {
              id: 'revenus',
              label: 'Courbe des Revenus',
              icon: <DollarSign className="w-4 h-4" />,
              content: (
                <div className="pt-4">
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-gray-200 dark:stroke-gray-700"
                      />
                      <XAxis dataKey="month" className="text-gray-600 dark:text-gray-400" />
                      <YAxis className="text-gray-600 dark:text-gray-400" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--tooltip-bg, #ffffff)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenus"
                        stroke="#10b981"
                        strokeWidth={3}
                        name="Revenus (€)"
                        dot={{ fill: '#10b981', r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Recent Activities & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Activités Recentes
              </h3>
              <Link
                href="/dossiers"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                Voir tout <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentActivities.map(activity => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    {activity.status === 'success' && (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    )}
                    {activity.status === 'warning' && (
                      <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    )}
                    {activity.status === 'info' && (
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(activity.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <Badge
                    variant={
                      activity.type === 'dossier'
                        ? 'info'
                        : activity.type === 'facture'
                          ? 'success'
                          : 'default'
                    }
                  >
                    {activity.type}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Actions Rapides
            </h3>
            <div className="space-y-3">
              <Link
                href="/dossiers"
                className="block p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg group-hover:scale-110 transition-transform">
                    <Folder className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Nouveau Dossier</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Créer un dossier client
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                href="/factures"
                className="block p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg group-hover:scale-110 transition-transform">
                    <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Nouvelle Facture
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Générer une facture</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/clients"
                className="block p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg group-hover:scale-110 transition-transform">
                    <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Nouveau Client</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Ajouter un client</p>
                  </div>
                </div>
              </Link>
            </div>
          </Card>
        </div>
      </div>
      {/* Legal Footer */}
      <LegalFooter />
    </div>
  );
}
