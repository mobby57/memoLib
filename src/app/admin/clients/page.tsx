'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  nationality?: string;
  status: string;
  createdAt: string;
  _count?: {
    dossiers: number;
  };
}

export default function ClientsAdmin() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (session?.user && session.user.role !== 'ADMIN') {
      router.push('/dashboard');
    } else if (session?.user?.role === 'ADMIN') {
      fetchClients();
    }
  }, [session, status, router]);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/admin/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="text-2xl">←</span>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Gestion des Clients
                </h1>
                <p className="text-gray-600 mt-1">{clients.length} client(s) au total</p>
              </div>
            </div>
            <Link
              href="/admin/clients/nouveau"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors flex items-center gap-2"
            >
              <span className="text-xl">➕</span>
              Nouveau Client
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Filtres et Recherche */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Rechercher un client (nom, email)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tous ({clients.length})
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  filterStatus === 'active'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Actifs
              </button>
              <button
                onClick={() => setFilterStatus('inactive')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  filterStatus === 'inactive'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Inactifs
              </button>
            </div>
          </div>
        </div>

        {/* Liste des clients */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">👥</span>
              <p className="text-gray-500 text-lg">
                {searchTerm || filterStatus !== 'all'
                  ? 'Aucun client ne correspond à votre recherche'
                  : 'Aucun client pour le moment'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 text-gray-600 font-semibold">Client</th>
                    <th className="text-left py-4 px-6 text-gray-600 font-semibold">Contact</th>
                    <th className="text-left py-4 px-6 text-gray-600 font-semibold">Nationalité</th>
                    <th className="text-center py-4 px-6 text-gray-600 font-semibold">Dossiers</th>
                    <th className="text-center py-4 px-6 text-gray-600 font-semibold">Statut</th>
                    <th className="text-center py-4 px-6 text-gray-600 font-semibold">Inscription</th>
                    <th className="text-right py-4 px-6 text-gray-600 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                            {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {client.firstName} {client.lastName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm">
                          <p className="text-gray-900">{client.email}</p>
                          {client.phone && (
                            <p className="text-gray-500">{client.phone}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-gray-700">{client.nationality || '-'}</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold">
                          {client._count?.dossiers || 0}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          client.status === 'active' ? 'bg-green-100 text-green-800' :
                          client.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-500">
                        {new Date(client.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/clients/${client.id}`}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-sm font-semibold hover:bg-blue-600 transition-colors"
                          >
                            Voir
                          </Link>
                          <Link
                            href={`/admin/clients/${client.id}/edit`}
                            className="px-3 py-1 bg-gray-500 text-white rounded text-sm font-semibold hover:bg-gray-600 transition-colors"
                          >
                            Modifier
                          </Link>
                        </div>
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
