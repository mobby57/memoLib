/**
 * Dashboard Admin/Avocat - Gestion du cabinet
 * Niveau 2 : Gestion clients, dossiers, avec limites plan
 */

'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminNavigation from '@/components/AdminNavigation';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    clients: 0,
    dossiers: 0,
    factures: 0,
    revenueTotal: 0,
    clientsLimit: 0,
    dossiersLimit: 0,
    planName: '',
    aiLevel: 1,
  });
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (session?.user && session.user.role === 'SUPER_ADMIN') {
      router.push('/super-admin');
    } else if (session?.user && session.user.role === 'CLIENT') {
      router.push('/client');
    } else if (session?.user?.role === 'ADMIN') {
      fetchData();
    }
  }, [session, status, router]);

  const fetchData = async () => {
    try {
      const [dossiersRes, clientsRes] = await Promise.all([
        fetch('/api/admin/dossiers'),
        fetch('/api/admin/clients'),
      ]);

      if (dossiersRes.ok) {
        const data = await dossiersRes.json();
        setDossiers(data.dossiers);
      }

      if (clientsRes.ok) {
        const data = await clientsRes.json();
        setClients(data.clients);
      }

      // Calculer les stats
      if (session?.user?.tenantId) {
        setStats({
          clients: 0,
          dossiers: 0,
          factures: 0,
          revenueTotal: 0,
          clientsLimit: 50,
          dossiersLimit: 100,
          planName: session.user.tenantPlan || 'Basic',
          aiLevel: 1,
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  const usageClientPct = stats.clientsLimit > 0 ? (stats.clients / stats.clientsLimit) * 100 : 0;
  const usageDossierPct = stats.dossiersLimit > 0 ? (stats.dossiers / stats.dossiersLimit) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <AdminNavigation />
      
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Dashboard Avocat
              </h1>
              <p className="text-gray-600 mt-1">Gestion de votre cabinet</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Cabinet {session?.user?.tenantName || 'Mon Cabinet'}</p>
                <p className="font-semibold text-gray-900">
                  Plan {stats.planName} - IA Niveau {stats.aiLevel}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                {session?.user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link
            href="/admin/clients"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all cursor-pointer group"
          >
            <div className="text-center">
              <span className="text-5xl mb-3 block group-hover:scale-110 transition-transform">[emoji]</span>
              <p className="font-semibold text-gray-900">Gerer les Clients</p>
              <p className="text-xs text-gray-500 mt-1">{stats.clients} clients</p>
            </div>
          </Link>

          <Link
            href="/admin/dossiers"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all cursor-pointer group"
          >
            <div className="text-center">
              <span className="text-5xl mb-3 block group-hover:scale-110 transition-transform">[emoji]</span>
              <p className="font-semibold text-gray-900">Gerer les Dossiers</p>
              <p className="text-xs text-gray-500 mt-1">{stats.dossiers} dossiers</p>
            </div>
          </Link>

          <Link
            href="/admin/messages"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all cursor-pointer group"
          >
            <div className="text-center">
              <span className="text-5xl mb-3 block group-hover:scale-110 transition-transform">[emoji]</span>
              <p className="font-semibold text-gray-900">Messages</p>
              <p className="text-xs text-gray-500 mt-1">Conversations clients</p>
            </div>
          </Link>

          <Link
            href="/admin/documents"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all cursor-pointer group"
          >
            <div className="text-center">
              <span className="text-5xl mb-3 block group-hover:scale-110 transition-transform">[emoji]</span>
              <p className="font-semibold text-gray-900">Documents</p>
              <p className="text-xs text-gray-500 mt-1">Tous les documents</p>
            </div>
          </Link>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Clients</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.clients}</p>
                <p className="text-xs text-gray-500 mt-1">
                  sur {stats.clientsLimit} max
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <span className="text-3xl">[emoji]</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    usageClientPct >= 90 ? 'bg-red-500' :
                    usageClientPct >= 70 ? 'bg-orange-500' :
                    'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(usageClientPct, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Dossiers</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.dossiers}</p>
                <p className="text-xs text-gray-500 mt-1">
                  sur {stats.dossiersLimit} max
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <span className="text-3xl">[emoji]</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    usageDossierPct >= 90 ? 'bg-red-500' :
                    usageDossierPct >= 70 ? 'bg-orange-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(usageDossierPct, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Factures</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.factures}</p>
                <p className="text-xs text-purple-600 mt-1">Total emises</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <span className="text-3xl">[emoji]</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">IA Autonomie</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">Niveau {stats.aiLevel}</p>
                <p className="text-xs text-indigo-600 mt-1">
                  {stats.aiLevel === 1 ? 'Assistant simple' :
                   stats.aiLevel === 2 ? 'Pre-redaction' :
                   stats.aiLevel === 3 ? 'Analyse juridique' :
                   'Autonomie maximale'}
                </p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-full">
                <span className="text-3xl">[emoji]</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dossiers Urgents */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span>[emoji]</span> Dossiers Urgents
            </h2>
            <button
              onClick={() => router.push('/dossiers')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
            >
              + Nouveau Dossier
            </button>
          </div>

          {dossiers.filter(d => d.statut === 'urgent').length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg"> Aucun dossier urgent</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dossiers
                .filter(d => d.statut === 'urgent')
                .slice(0, 5)
                .map((dossier) => (
                  <div
                    key={dossier.id}
                    className="border border-red-200 bg-red-50 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-red-600 font-bold">{dossier.numero}</span>
                          <h3 className="font-semibold text-gray-900">{dossier.typeDossier}</h3>
                          <span className="px-2 py-1 bg-red-500 text-white rounded text-xs font-semibold">
                            URGENT
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mt-1">{dossier.objet}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Client: {dossier.client?.nom} {dossier.client?.prenom}
                        </p>
                      </div>
                      <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold">
                        Traiter [Next]
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Derniers Clients */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span>[emoji]</span> Derniers Clients
            </h2>
            <button
              onClick={() => router.push('/clients')}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
            >
              + Nouveau Client
            </button>
          </div>

          {clients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Aucun client pour le moment</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Nom</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Telephone</th>
                    <th className="text-center py-3 px-4 text-gray-600 font-semibold">Dossiers</th>
                    <th className="text-center py-3 px-4 text-gray-600 font-semibold">Portail</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.slice(0, 5).map((client) => (
                    <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 font-medium text-gray-900">
                        {client.nom} {client.prenom}
                      </td>
                      <td className="py-4 px-4 text-gray-600">{client.email}</td>
                      <td className="py-4 px-4 text-gray-600">{client.telephone}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                          {client._count?.dossiers || 0}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {client.user ? (
                          <span className="text-green-600 font-semibold">[Check] Actif</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
