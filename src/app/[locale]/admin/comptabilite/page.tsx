'use client';

import { useAuth } from '@/hooks/useAuth';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
interface DashboardCompta {
  caMois: number;
  caAnnuel: number;
  facturesImpayees: { montant: number; nombre: number };
  ecrituresAValider: number;
  carpa: { soldeGlobal: number };
  rapprochement: {
    total: number;
    rapproches: number;
    nonRapproches: number;
    tauxRapprochement: number;
  };
}

interface Ecriture {
  id: string;
  numero: string;
  date: string;
  libelle: string;
  statut: string;
  source: string;
  Journal: { code: string; libelle: string };
  Lignes: Array<{
    debit: number;
    credit: number;
    Compte: { numero: string; libelle: string };
  }>;
}

export default function ComptabilitePage() {
  const { data: session, user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardCompta | null>(null);
  const [ecritures, setEcritures] = useState<Ecriture[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ecritures' | 'rapprochement' | 'carpa'>('dashboard');

  useEffect(() => {
    if (session) {
      loadDashboard();
      loadEcritures();
    }
  }, [session]);

  async function loadDashboard() {
    try {
      const res = await fetch('/api/comptabilite/dashboard');
      if (res.ok) {
        setDashboard(await res.json());
      }
    } catch {
      // Module pas encore initialisé
    } finally {
      setLoading(false);
    }
  }

  async function loadEcritures() {
    try {
      const res = await fetch('/api/comptabilite/ecritures?limit=20');
      if (res.ok) {
        const data = await res.json();
        setEcritures(data.ecritures || []);
      }
    } catch {
      // Silencieux
    }
  }

  async function initModule() {
    setLoading(true);
    try {
      await fetch('/api/comptabilite/plan-comptable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'init' }),
      });
      await loadDashboard();
    } catch {
      // Erreur
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-white rounded-2xl shadow-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
        <div className="max-w-2xl mx-auto text-center mt-20">
          <div className="bg-white rounded-2xl shadow-xl p-12">
            <div className="text-6xl mb-4">📊</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Module Comptabilité</h1>
            <p className="text-gray-600 mb-8">
              Initialisez le module comptabilité pour accéder au plan comptable avocat,
              aux écritures automatiques, au rapprochement bancaire et à la gestion CARPA.
            </p>
            <button
              onClick={initModule}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
            >
              Initialiser le module comptabilité
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Comptabilité</h1>
        <p className="text-gray-500 mt-1">Tableau de bord financier du cabinet</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard
          title="CA du mois"
          value={formatMontant(dashboard.caMois)}
          icon="💰"
          color="green"
        />
        <KPICard
          title="CA annuel"
          value={formatMontant(dashboard.caAnnuel)}
          icon="📈"
          color="blue"
        />
        <KPICard
          title="Impayés"
          value={formatMontant(dashboard.facturesImpayees.montant)}
          subtitle={`${dashboard.facturesImpayees.nombre} facture${dashboard.facturesImpayees.nombre > 1 ? 's' : ''}`}
          icon="⚠️"
          color="orange"
        />
        <KPICard
          title="CARPA"
          value={formatMontant(dashboard.carpa.soldeGlobal)}
          subtitle="Fonds clients"
          icon="🏦"
          color="purple"
        />
      </div>

      {/* Stats secondaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Écritures à valider</span>
            <span className="text-2xl font-bold text-amber-600">{dashboard.ecrituresAValider}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full">
            <div
              className="h-2 bg-amber-500 rounded-full"
              style={{ width: `${Math.min(dashboard.ecrituresAValider * 5, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Rapprochement bancaire</span>
            <span className="text-2xl font-bold text-blue-600">
              {dashboard.rapprochement.tauxRapprochement}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full">
            <div
              className="h-2 bg-blue-500 rounded-full"
              style={{ width: `${dashboard.rapprochement.tauxRapprochement}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {dashboard.rapprochement.nonRapproches} mouvement{dashboard.rapprochement.nonRapproches > 1 ? 's' : ''} à rapprocher
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Export FEC</span>
            <a
              href={`/api/exports/fec?year=${new Date().getFullYear()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              Télécharger
            </a>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Fichier des Écritures Comptables — Art. L47 A-1 LPF
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-xl">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-1 p-2">
            {[
              { id: 'dashboard' as const, label: 'Dernières écritures', icon: '📝' },
              { id: 'ecritures' as const, label: 'Journal', icon: '📒' },
              { id: 'rapprochement' as const, label: 'Rapprochement', icon: '🏦' },
              { id: 'carpa' as const, label: 'CARPA', icon: '⚖️' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'dashboard' && <EcrituresRecentes ecritures={ecritures} />}
          {activeTab === 'ecritures' && <EcrituresRecentes ecritures={ecritures} />}
          {activeTab === 'rapprochement' && <RapprochementPanel />}
          {activeTab === 'carpa' && <CARPAPanel />}
        </div>
      </div>
    </div>
  );
}

// === Composants internes ===

function KPICard({ title, value, subtitle, icon, color }: {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  color: 'green' | 'blue' | 'orange' | 'purple';
}) {
  const colorClasses = {
    green: 'from-green-50 to-emerald-50 border-green-200',
    blue: 'from-blue-50 to-indigo-50 border-blue-200',
    orange: 'from-orange-50 to-amber-50 border-orange-200',
    purple: 'from-purple-50 to-violet-50 border-purple-200',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-2xl p-6 shadow-lg`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function EcrituresRecentes({ ecritures }: { ecritures: Ecriture[] }) {
  if (ecritures.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-4xl mb-2">📒</p>
        <p>Aucune écriture comptable pour le moment.</p>
        <p className="text-sm mt-1">Les écritures seront générées automatiquement à chaque facture envoyée ou paiement reçu.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="pb-3 font-medium">Date</th>
            <th className="pb-3 font-medium">N°</th>
            <th className="pb-3 font-medium">Journal</th>
            <th className="pb-3 font-medium">Libellé</th>
            <th className="pb-3 font-medium text-right">Débit</th>
            <th className="pb-3 font-medium text-right">Crédit</th>
            <th className="pb-3 font-medium">Statut</th>
          </tr>
        </thead>
        <tbody>
          {ecritures.map(e => {
            const totalDebit = e.Lignes.reduce((s, l) => s + l.debit, 0);
            const totalCredit = e.Lignes.reduce((s, l) => s + l.credit, 0);
            return (
              <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 text-gray-600">
                  {new Date(e.date).toLocaleDateString('fr-FR')}
                </td>
                <td className="py-3 font-mono text-xs text-gray-500">{e.numero}</td>
                <td className="py-3">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                    {e.Journal.code}
                  </span>
                </td>
                <td className="py-3 text-gray-900 max-w-xs truncate">{e.libelle}</td>
                <td className="py-3 text-right font-mono">
                  {totalDebit > 0 ? formatMontant(totalDebit) : ''}
                </td>
                <td className="py-3 text-right font-mono">
                  {totalCredit > 0 ? formatMontant(totalCredit) : ''}
                </td>
                <td className="py-3">
                  <StatutBadge statut={e.statut} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RapprochementPanel() {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/comptabilite/banque')
      .then(r => r.json())
      .then(data => {
        setSuggestions(data.suggestions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8 text-gray-400">Chargement...</div>;

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-4xl mb-2">🏦</p>
        <p>Aucun mouvement bancaire à rapprocher.</p>
        <p className="text-sm mt-2">Importez un relevé bancaire (CSV) pour commencer le rapprochement.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {suggestions.slice(0, 10).map((s: any) => (
        <div key={s.mouvementId} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="font-medium text-gray-900">{s.mouvementLibelle}</p>
            <p className="text-sm text-gray-500">{formatMontant(Math.abs(s.mouvementMontant))}</p>
          </div>
          {s.suggestion ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-green-700">→ {s.suggestion.factureNumero}</p>
                <p className="text-xs text-gray-500">{s.suggestion.clientNom}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                s.confidence > 0.8 ? 'bg-green-100 text-green-700' :
                s.confidence > 0.5 ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {Math.round(s.confidence * 100)}%
              </span>
            </div>
          ) : (
            <span className="text-xs text-gray-400">À identifier</span>
          )}
        </div>
      ))}
    </div>
  );
}

function CARPAPanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/comptabilite/carpa')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8 text-gray-400">Chargement...</div>;

  if (!data || data.soldeGlobal === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-4xl mb-2">⚖️</p>
        <p>Aucun fonds CARPA enregistré.</p>
        <p className="text-sm mt-2">Les mouvements CARPA apparaîtront ici lors des provisions et restitutions.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
        <p className="text-sm text-purple-600 font-medium">Solde global CARPA</p>
        <p className="text-3xl font-bold text-purple-900">{formatMontant(data.soldeGlobal)}</p>
      </div>

      {data.alertes?.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-orange-700 mb-2">⚠️ Provisions dormantes</h3>
          {data.alertes.map((a: any) => (
            <div key={a.dossierId} className="p-3 bg-orange-50 rounded-lg mb-2 border border-orange-200">
              <div className="flex justify-between">
                <span className="text-sm">{formatMontant(a.solde)} — inactif depuis {a.joursInactif}j</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {data.resume?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Fonds par dossier</h3>
          <div className="space-y-2">
            {data.resume.map((r: any, i: number) => (
              <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Dossier {r.dossierId.slice(0, 8)}...</span>
                <span className="font-mono font-medium">{formatMontant(r.solde)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatutBadge({ statut }: { statut: string }) {
  const styles: Record<string, string> = {
    BROUILLON: 'bg-gray-100 text-gray-600',
    VALIDEE: 'bg-green-100 text-green-700',
    LETTREE: 'bg-blue-100 text-blue-700',
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full font-medium ${styles[statut] || 'bg-gray-100 text-gray-600'}`}>
      {statut.toLowerCase()}
    </span>
  );
}

function formatMontant(montant: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(montant);
}
