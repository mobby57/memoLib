'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Eye, Edit, Trash2, Loader } from 'lucide-react';

interface Dossier {
  id: string;
  numero: string;
  clientId: string;
  statut: string;
  description?: string;
  createdAt: string;
}

export default function DossiersPage() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    fetchDossiers();
  }, [filter]);

  async function fetchDossiers() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('statut', filter);
      if (search) params.append('search', search);

      const response = await fetch(`/api/v1/dossiers?${params}`);
      const data = await response.json();
      setDossiers(data.data || []);
    } catch (error) {
      console.error('Failed to fetch dossiers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce dossier ?')) return;

    try {
      const response = await fetch(`/api/v1/dossiers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDossiers(dossiers.filter(d => d.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete dossier:', error);
    }
  }

  const statutColors: Record<string, string> = {
    open: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    closed: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dossiers</h1>
          <p className="text-slate-600 mt-1">Gérez vos dossiers juridiques</p>
        </div>
        <Link href="/dossiers/new">
          <Button>
            <Plus size={20} className="mr-2" />
            Nouveau Dossier
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <Input
              placeholder="Rechercher par numéro ou client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyUp={(e) => e.key === 'Enter' && fetchDossiers()}
              className="pl-10"
            />
          </div>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm"
        >
          <option value="all">Tous</option>
          <option value="open">Ouvert</option>
          <option value="pending">En attente</option>
          <option value="closed">Closé</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-blue-600" size={32} />
        </div>
      ) : dossiers.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 py-12 text-center">
          <p className="text-slate-600">Aucun dossier trouvé</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Numéro</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Client</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Statut</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Date</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {dossiers.map((dossier) => (
                <tr key={dossier.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {dossier.numero}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{dossier.clientId}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statutColors[dossier.statut] || 'bg-slate-100 text-slate-800'}`}>
                      {dossier.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(dossier.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/dossiers/${dossier.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye size={16} />
                        </Button>
                      </Link>
                      <Link href={`/dossiers/${dossier.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit size={16} />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(dossier.id)}
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
