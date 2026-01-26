'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import SuperAdminNavigation from '@/components/SuperAdminNavigation';
import Link from 'next/link';

interface Stats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalRevenue: number;
  totalDossiers: number;
}

interface RecentTenant {
  id: string;
  name: string;
  planName: string;
  status: string;
  userCount: number;
  createdAt: string;
}

export default function SuperAdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentTenants, setRecentTenants] = useState<RecentTenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attendre que la session soit chargée avant de vérifier le rôle
    if (status === 'loading') return;
    
    if (status === 'unauthenticated' || session?.user?.role !== 'SUPER_ADMIN') {
      router.push('/auth/login');
      return;
    }
    loadData();
  }, [session, status, router]);

  const loadData = async () => {
    try {
      const [statsRes, tenantsRes] = await Promise.all([
        fetch('/api/super-admin/stats'),
        fetch('/api/super-admin/tenants?limit=5'),
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (tenantsRes.ok) {
        const data = await tenantsRes.json();
        setRecentTenants(data.tenants || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SuperAdminNavigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SuperAdminNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Vue d'ensemble de la plateforme</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tenants</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats?.totalTenants || 0}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {stats?.activeTenants || 0} actifs
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <span className="text-2xl">🏢</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats?.totalUsers || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Tous les tenants</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <span className="text-2xl"></span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue Total</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats?.totalRevenue?.toFixed(0) || 0}€
                </p>
                <p className="text-xs text-green-600 mt-1">+12% ce mois</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <span className="text-2xl"></span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Dossiers</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats?.totalDossiers || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Tous les cabinets</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <span className="text-2xl"></span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/super-admin/tenants"
            className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 text-white group"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">🏢</span>
              <span className="text-white/80 group-hover:translate-x-1 transition-transform">[Next]</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Gerer les Tenants</h3>
            <p className="text-white/80 text-sm">Voir, creer, modifier les cabinets</p>
          </Link>

          <Link
            href="/super-admin/plans"
            className="bg-gradient-to-br from-blue-500 to-cyan-600 p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 text-white group"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl"></span>
              <span className="text-white/80 group-hover:translate-x-1 transition-transform">[Next]</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Gerer les Plans</h3>
            <p className="text-white/80 text-sm">Basic, Premium, Enterprise</p>
          </Link>

          <Link
            href="/super-admin/support"
            className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 text-white group"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">🎫</span>
              <span className="text-white/80 group-hover:translate-x-1 transition-transform">[Next]</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Support</h3>
            <p className="text-white/80 text-sm">Tickets et assistance</p>
          </Link>
        </div>

        {/* Recent Tenants */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Tenants Recents</h2>
            <Link
              href="/super-admin/tenants"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Voir tous [Next]
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cree le
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentTenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Aucun tenant
                    </td>
                  </tr>
                ) : (
                  recentTenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{tenant.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          {tenant.planName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            tenant.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : tenant.status === 'suspended'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {tenant.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900">{tenant.userCount}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {new Date(tenant.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/super-admin/tenants/${tenant.id}`}
                          className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                        >
                          Voir
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
