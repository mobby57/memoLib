'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, StatCard, Badge, Breadcrumb, Alert, Tabs } from '@/components/ui';
import { Building, Users, DollarSign, TrendingUp, Settings, LogOut, Bell, Shield, Database, Activity, Plus, Eye } from 'lucide-react';

interface SuperAdminStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalRevenue: number;
  monthlyGrowth: number;
}

interface TenantInfo {
  id: string;
  name: string;
  plan: string;
  status: string;
  userCount: number;
  dossierCount: number;
  revenue: number;
  createdAt: string;
}

export default function SuperAdminPage() {
  const { user, isLoading, isAuthenticated, isSuperAdmin } = useAuth();
  const [stats, setStats] = useState<SuperAdminStats>({
    totalTenants: 0,
    activeTenants: 0,
    totalUsers: 0,
    totalRevenue: 0,
    monthlyGrowth: 0
  });
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && !isSuperAdmin) {
      window.location.href = '/dashboard';
      return;
    }
  }, [isAuthenticated, isSuperAdmin]);

  useEffect(() => {
    if (isAuthenticated && isSuperAdmin) {
      loadSuperAdminData();
    }
  }, [isAuthenticated, isSuperAdmin]);

  const loadSuperAdminData = async () => {
    try {
      setLoading(true);
      
      // Charger les statistiques globales
      const statsResponse = await fetch('/api/super-admin/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Charger la liste des tenants
      const tenantsResponse = await fetch('/api/super-admin/tenants');
      if (tenantsResponse.ok) {
        const tenantsData = await tenantsResponse.json();
        setTenants(tenantsData);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'BASIC': return 'bg-gray-100 text-gray-800';
      case 'PREMIUM': return 'bg-blue-100 text-blue-800';
      case 'ENTERPRISE': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Accès Super Admin requis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <Breadcrumb items={[{ label: 'Super Admin' }]} />
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Administration Plateforme
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gestion globale - {user?.name}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="danger">SUPER ADMIN</Badge>
              <Badge variant="info">Accès Global</Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
          </button>

          <Link href="/super-admin/settings" className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-3 px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.name}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">Super Admin</p>
            </div>
            <button
              onClick={() => window.location.href = '/api/auth/signout'}
              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800/20 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/super-admin/tenants/new"
          className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group"
        >
          <span className="font-medium">Nouveau Cabinet</span>
          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </Link>
        
        <Link
          href="/super-admin/analytics"
          className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group"
        >
          <span className="font-medium">Analytics</span>
          <Activity className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </Link>
        
        <Link
          href="/super-admin/billing"
          className="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group"
        >
          <span className="font-medium">Facturation</span>
          <DollarSign className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </Link>
        
        <Link
          href="/super-admin/system"
          className="bg-gray-500 hover:bg-gray-600 text-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group"
        >
          <span className="font-medium">Système</span>
          <Database className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Cabinets"
          value={stats.totalTenants}
          icon={Building}
          trend={{ value: stats.monthlyGrowth, isPositive: stats.monthlyGrowth > 0 }}
        />
        <StatCard
          title="Cabinets Actifs"
          value={stats.activeTenants}
          icon={Activity}
        />
        <StatCard
          title="Utilisateurs"
          value={stats.totalUsers}
          icon={Users}
        />
        <StatCard
          title="Revenus (€)"
          value={`${(stats.totalRevenue / 1000).toFixed(0)}K`}
          icon={DollarSign}
          trend={{ value: 12, isPositive: true }}
        />
      </div>

      {/* Liste des Tenants */}
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Cabinets d'Avocats
          </h3>
          <Link
            href="/super-admin/tenants/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouveau Cabinet
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Cabinet</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Plan</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Statut</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Utilisateurs</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Dossiers</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Revenus</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{tenant.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Créé le {new Date(tenant.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(tenant.plan)}`}>
                      {tenant.plan}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tenant.status)}`}>
                      {tenant.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">{tenant.userCount}</td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">{tenant.dossierCount}</td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">{tenant.revenue}€</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/super-admin/tenants/${tenant.id}`}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/super-admin/tenants/${tenant.id}/edit`}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Modifier"
                      >
                        <Settings className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {tenants.length === 0 && (
          <div className="text-center py-8">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Aucun cabinet enregistré</p>
            <Link
              href="/super-admin/tenants/new"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Créer le premier cabinet
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}