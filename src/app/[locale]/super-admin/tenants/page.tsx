'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import SuperAdminNavigation from '@/components/SuperAdminNavigation';
import Link from 'next/link';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  planId: string;
  planName: string;
  status: string;
  createdAt: string;
  currentUsers: number;
  currentDossiers: number;
  currentClients: number;
}

export default function TenantsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated' || session?.user?.role !== 'SUPER_ADMIN') {
      router.push('/auth/login');
      return;
    }
    loadTenants();
  }, [session, status, router]);

  const loadTenants = async () => {
    try {
      const res = await fetch('/api/super-admin/tenants');
      if (res.ok) {
        setTenants(await res.json());
      }
    } catch (error) {
      console.error('Error loading tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendTenant = async (id: string) => {
    if (!confirm('Suspendre ce tenant ?')) return;
    
    try {
      const res = await fetch(`/api/super-admin/tenants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'suspended' }),
      });
      if (res.ok) {
        loadTenants();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleActivateTenant = async (id: string) => {
    try {
      const res = await fetch(`/api/super-admin/tenants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      });
      if (res.ok) {
        loadTenants();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subdomain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Tenants</h1>
            <p className="text-gray-600 mt-2">Tous les cabinets d'avocats</p>
          </div>
          <Link
            href="/super-admin/tenants/nouveau"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-md transition-all duration-200"
          >
            + Nouveau Tenant
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rechercher
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nom ou subdomain..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">Tous</option>
                <option value="active">Actif</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspendu</option>
                <option value="cancelled">Annule</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tenants List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cabinet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Utilisateurs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Clients
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Dossiers
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
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      Aucun tenant trouve
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{tenant.name}</div>
                          <div className="text-sm text-gray-500">{tenant.subdomain}.app</div>
                        </div>
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
                              : tenant.status === 'trial'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {tenant.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900">{tenant.currentUsers}</td>
                      <td className="px-6 py-4 text-gray-900">{tenant.currentClients}</td>
                      <td className="px-6 py-4 text-gray-900">{tenant.currentDossiers}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {new Date(tenant.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/super-admin/tenants/${tenant.id}`}
                            className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                          >
                            Voir
                          </Link>
                          {tenant.status === 'active' ? (
                            <button
                              onClick={() => handleSuspendTenant(tenant.id)}
                              className="text-red-600 hover:text-red-700 font-medium text-sm"
                            >
                              Suspendre
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivateTenant(tenant.id)}
                              className="text-green-600 hover:text-green-700 font-medium text-sm"
                            >
                              Activer
                            </button>
                          )}
                        </div>
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
