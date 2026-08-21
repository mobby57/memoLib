'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Clock, Filter, Download, TrendingUp } from 'lucide-react';
import { TimeTracker } from '@/components/dossiers/TimeTracker';

interface TimeEntry {
  id: string;
  description: string;
  duration: number;
  date: string;
  category: string;
  isBillable: boolean;
  isBilled: boolean;
  montant?: number;
  tarifHoraire?: number;
  Dossier?: { numero: string; objet: string };
  Client?: { firstName: string; lastName: string };
  User?: { name: string };
}

interface Stats {
  totalEntries: number;
  totalHours: number;
  totalBillableHours: number;
  totalMontant: number;
  unbilledMontant: number;
}

export default function TimeTrackingPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [stats, setStats] = useState<Stats>({ totalEntries: 0, totalHours: 0, totalBillableHours: 0, totalMontant: 0, unbilledMontant: 0 });
  const [filter, setFilter] = useState<'all' | 'billable' | 'unbilled'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadEntries(); }, [filter, dateFrom, dateTo]);

  const loadEntries = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter === 'billable') params.set('billable', 'true');
    if (filter === 'unbilled') params.set('unbilled', 'true');
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);

    try {
      const res = await fetch(`/api/time-entries?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
        setStats(data.stats || {});
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const exportCSV = () => {
    const headers = ['Date', 'Description', 'Catégorie', 'Durée (min)', 'Tarif €/h', 'Montant €', 'Dossier', 'Client', 'Facturable', 'Facturé'];
    const rows = entries.map(e => [
      new Date(e.date).toLocaleDateString('fr-FR'),
      `"${e.description}"`,
      e.category,
      e.duration,
      e.tarifHoraire || '',
      e.montant?.toFixed(2) || '',
      e.Dossier?.numero || '',
      e.Client ? `${e.Client.firstName} ${e.Client.lastName}` : '',
      e.isBillable ? 'Oui' : 'Non',
      e.isBilled ? 'Oui' : 'Non',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `temps_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h${m > 0 ? m.toString().padStart(2, '0') : ''}` : `${m}min`;
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Suivi du temps
          </h1>
          <p className="text-gray-500 mt-1">Enregistrez et facturez votre temps</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">Total heures</p>
          <p className="text-2xl font-bold">{stats.totalHours}h</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">Heures facturables</p>
          <p className="text-2xl font-bold text-blue-600">{stats.totalBillableHours}h</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">Montant total</p>
          <p className="text-2xl font-bold text-green-600">{stats.totalMontant.toFixed(0)}€</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">Non facturé</p>
          <p className="text-2xl font-bold text-orange-600">{stats.unbilledMontant.toFixed(0)}€</p>
        </div>
      </div>

      {/* Timer rapide (sans dossier spécifique) */}
      <TimeTracker tarifHoraire={150} onEntryCreated={loadEntries} />

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {[
            { value: 'all', label: 'Tout' },
            { value: 'billable', label: 'Facturable' },
            { value: 'unbilled', label: 'Non facturé' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as any)}
              className={`px-3 py-1.5 text-sm rounded-md transition ${filter === f.value ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-sm border rounded-md px-2 py-1.5" placeholder="Depuis" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-sm border rounded-md px-2 py-1.5" placeholder="Jusqu'à" />
      </div>

      {/* Entries table */}
      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Dossier</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Catégorie</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Durée</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Montant</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Statut</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => (
              <tr key={entry.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{new Date(entry.date).toLocaleDateString('fr-FR')}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{entry.description}</td>
                <td className="px-4 py-3 text-gray-500">{entry.Dossier?.numero || '—'}</td>
                <td className="px-4 py-3 text-gray-500 capitalize">{entry.category}</td>
                <td className="px-4 py-3 text-right font-medium">{formatDuration(entry.duration)}</td>
                <td className="px-4 py-3 text-right text-green-600">{entry.montant ? `${entry.montant.toFixed(0)}€` : '—'}</td>
                <td className="px-4 py-3 text-center">
                  {entry.isBilled ? (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Facturé</span>
                  ) : entry.isBillable ? (
                    <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">À facturer</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">NF</span>
                  )}
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Aucune entrée de temps. Utilisez le chronomètre ci-dessus pour commencer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
