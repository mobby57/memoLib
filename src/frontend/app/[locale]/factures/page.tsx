'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Download, Loader } from 'lucide-react';

interface Facture {
  id: string;
  numero: string;
  montantTTC: number;
  statut: string;
  createdAt: string;
}

export default function FacturesPage() {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchFactures();
  }, [filter]);

  async function fetchFactures() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('statut', filter);

      const response = await fetch(`/api/v1/factures?${params}`);
      const data = await response.json();
      setFactures(data.data || []);
    } catch (error) {
      console.error('Failed to fetch factures:', error);
    } finally {
      setLoading(false);
    }
  }

  const statutColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Factures</h1>
          <p className="text-slate-600 mt-1">Gérez vos factures</p>
        </div>
        <Link href="/factures/new">
          <Button>
            <Plus size={20} className="mr-2" />
            Nouvelle Facture
          </Button>
        </Link>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm"
        >
          <option value="all">Tous</option>
          <option value="draft">Brouillon</option>
          <option value="sent">Envoyée</option>
          <option value="paid">Payée</option>
          <option value="overdue">Impayée</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-blue-600" size={32} />
        </div>
      ) : factures.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 py-12 text-center">
          <p className="text-slate-600">Aucune facture trouvée</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Numéro</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Montant TTC</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Statut</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Date</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {factures.map((facture) => (
                <tr key={facture.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {facture.numero}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                    {facture.montantTTC.toFixed(2)} €
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statutColors[facture.statut] || 'bg-slate-100 text-slate-800'}`}>
                      {facture.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(facture.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/factures/${facture.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye size={16} />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm">
                        <Download size={16} />
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
