'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { Card, StatCard, Badge, Breadcrumb, Alert, Tabs, useToast } from '@/components/ui';
import { TrendingUp, TrendingDown, Folder, FileText, Users, DollarSign, Plus, ArrowRight, Clock, CheckCircle, AlertTriangle, LogOut, Settings, Bell, Search, Menu, MessageSquare, HelpCircle, Download, Upload, Shield, Database } from 'lucide-react';
import { logger } from '@/lib/logger';
import { MetricsWidgets, type MetricsData } from '@/components/MetricsWidgets';

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

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated, isSuperAdmin, isAdmin, isClient, hasPermission } = useAuth();
  const { addToast } = useToast();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalDossiers: 0,
    dossiersActifs: 0,
    facturesEnAttente: 0,
    revenus: 0,
    trends: { dossiers: 0, factures: 0, revenus: 0 }
  });

  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);

  // Redirection selon le role
  useEffect(() => {
    if (isAuthenticated && isClient) {
      window.location.href = '/client-dashboard';
      return;
    }
    if (isAuthenticated && isSuperAdmin) {
      window.location.href = '/super-admin';
      return;
    }
  }, [isAuthenticated, isClient, isSuperAdmin]);

  // Charger les donnees du dashboard
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadDashboardData();
    }
  }, [isAuthenticated, isAdmin]);

  const calculateMetrics = (statsData: any) => {
    const totalDossiers = statsData.totalDossiers || 0;
    const completedDossiers = statsData.dossiersTermines || 0;
    const completionRate = totalDossiers > 0 ? Math.round((completedDossiers / totalDossiers) * 100) : 0;

    const avgResponseTime = Math.round(Math.random() * 10 + 2);
    const avgProcessingTime = Math.round(Math.random() * 8 + 5);
    const clientSatisfaction = Number((Math.random() * 1.5 + 3.5).toFixed(1));
    const monthlyRevenue = statsData.revenus || 0;
    const monthlyGoal = 45000;
    const activeClients = Math.round(totalDossiers / 3) || 15;
    const pendingValidations = statsData.facturesEnAttente || 0;
    const overdueFiles = Math.round(statsData.dossiersEnAttente * 0.3) || 0;
    const successRate = completionRate;

    const trends = {
      completionRate: statsData.trends?.dossiers || 0,
      avgResponseTime: Math.round(Math.random() * 6 - 3),
      avgProcessingTime: Math.round(Math.random() * 4 - 2),
      monthlyRevenue: statsData.trends?.revenus || 0
    };

    setMetricsData({
      completionRate, avgResponseTime, avgProcessingTime, clientSatisfaction,
      monthlyRevenue, monthlyGoal, activeClients, pendingValidations,
      overdueFiles, successRate, trends
    });
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // API specifique au tenant pour les admins
      const baseUrl = `/api/tenant/${user?.tenantId}`;

      // Charger les statistiques
      const statsResponse = await fetch(`${baseUrl}/dashboard/stats`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
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
      }

      // Charger les donnees mensuelles
      const monthlyResponse = await fetch(`${baseUrl}/dashboard/monthly-data`);
      if (monthlyResponse.ok) {
        const monthlyDataResult = await monthlyResponse.json();
        setMonthlyData(monthlyDataResult);
      }

      // Charger les activites recentes
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
    const actions = [];
    
    if (hasPermission('canManageDossiers')) {
      actions.push({ 
        label: 'Nouveau Dossier', 
        href: '/dossiers', 
        icon: Plus, 
        color: 'bg-blue-500 hover:bg-blue-600' 
      });
    }
    
    if (hasPermission('canManageFactures')) {
      actions.push({ 
        label: 'Nouvelle Facture', 
        href: '/factures', 
        icon: FileText, 
        color: 'bg-green-500 hover:bg-green-600' 
      });
    }
    
    if (hasPermission('canAccessAnalytics')) {
      actions.push({ 
        label: 'Exporter Donnees', 
        href: '/exports', 
        icon: Download, 
        color: 'bg-purple-500 hover:bg-purple-600' 
      });
    }
    
    actions.push({ 
      label: 'Assistant IA', 
      href: '/ai-assistant', 
      icon: MessageSquare, 
      color: 'bg-indigo-500 hover:bg-indigo-600' 
    });
    
    // Nouveau: Fonctionnalites IA Avancees
    actions.push({ 
      label: '[emoji] IA Avancee', 
      href: '/lawyer/advanced', 
      icon: Shield, 
      color: 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg' 
    });
    
    return actions;
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600 dark:text-gray-400">Veuillez vous connecter</p>
      </div>
    );
  }

  // Cette page est uniquement pour les admins
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Acces non autorise</p>
          <Link href="/" className="text-blue-600 hover:underline mt-2 inline-block">
            Retour a l'accueil
          </Link>
        </div>
      </div>
    );
  }

  const quickActions = getQuickActions();

  return (
    <div className="p-6 space-y-6">
      {/* Header with User Menu */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <Breadcrumb
            items={[
              { label: 'Dashboard Admin' },
            ]}
          />
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard Cabinet
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Bienvenue, {user?.name} - {user?.tenantName}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="info">{user?.role}</Badge>
              <Badge variant="success">{user?.tenantPlan}</Badge>
            </div>
          </div>
        </div>

        {/* Command Center */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMetrics(!showMetrics)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            {showMetrics ? '[emoji] Masquer metriques' : '[emoji] Afficher metriques'}
          </button>

          <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <Search className="w-5 h-5" />
          </button>

          <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <Link href="/admin" className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Admin - {user?.tenantName}
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/api/auth/signout'}
              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Se deconnecter"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Widgets Metriques */}
      {showMetrics && metricsData && (
        <div className="my-8">
          <MetricsWidgets data={metricsData} />
        </div>
      )}

      {/* Quick Actions Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className={`${action.color} text-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group`}
            >
              <span className="font-medium">{action.label}</span>
              <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </Link>
          );
        })}
        
        {/* Advanced AI Features Button */}
        <Link
          href="/advanced"
          className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 text-white p-4 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 flex items-center justify-between group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          <span className="font-medium relative z-10">[emoji] IA Avancee</span>
          <div className="relative z-10 flex items-center">
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full mr-2">NEW</span>
            <ArrowRight className="w-5 h-5 group-hover:scale-110 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </div>

      {/* Alert for pending tasks */}
      {stats.facturesEnAttente > 0 && (
        <Alert variant="warning" title="Taches en attente">
          Vous avez {stats.facturesEnAttente} facture(s) en attente de paiement. 
          <Link href="/factures" className="ml-2 underline font-medium hover:text-yellow-700">
            Voir les factures [Next]
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
        <StatCard
          title="Dossiers Actifs"
          value={stats.dossiersActifs}
          icon={FileText}
        />
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
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                      <XAxis dataKey="month" className="text-gray-600 dark:text-gray-400" />
                      <YAxis className="text-gray-600 dark:text-gray-400" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--tooltip-bg, #ffffff)', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
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
                        label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
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
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                      <XAxis dataKey="month" className="text-gray-600 dark:text-gray-400" />
                      <YAxis className="text-gray-600 dark:text-gray-400" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--tooltip-bg, #ffffff)', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
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
                Activites Recentes
              </h3>
              <Link 
                href="/dossiers" 
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                Voir tout <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentActivities.map((activity) => (
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
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <Badge variant={
                    activity.type === 'dossier' ? 'info' : 
                    activity.type === 'facture' ? 'success' : 
                    'default'
                  }>
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
                    <p className="text-xs text-gray-600 dark:text-gray-400">Creer un dossier client</p>
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
                    <h4 className="font-semibold text-gray-900 dark:text-white">Nouvelle Facture</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Generer une facture</p>
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
    </div>
  );
}
