'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import AdminNavigation from '@/components/AdminNavigation';

interface TenantCost {
  id: string;
  name: string;
  subdomain: string;
  plan: {
    name: string;
    displayName: string;
    priceMonthly: number;
  };
  subscription: {
    status: string;
    billingCycle: string;
  } | null;
  usage: {
    users: number;
    dossiers: number;
    clients: number;
  };
  aiCosts: {
    current: number;
    limit: number;
    overage: number;
    percentage: number;
    tokens: number;
    status: 'normal' | 'warning' | 'exceeded';
  };
  billableOverage: {
    amount: number;
    description: string;
  } | null;
}

interface Summary {
  totalTenants: number;
  totalAICost: number;
  totalOverage: number;
  tenantsOverBudget: number;
  potentialBilling: number;
}

export default function AdminCostsPage() {
  const [tenants, setTenants] = useState<TenantCost[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadCosts();
  }, [selectedMonth, selectedYear]);

  const loadCosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/costs?month=${selectedMonth}&year=${selectedYear}`);
      if (res.ok) {
        const data = await res.json();
        setTenants(data.tenants || []);
        setSummary(data.summary || null);
      }
    } catch (error) {
      console.error('Erreur chargement coûts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, tenantId: string, data?: object) => {
    setActionLoading(tenantId);
    try {
      const res = await fetch('/api/admin/costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, tenantId, data }),
      });
      
      if (res.ok) {
        const result = await res.json();
        alert(result.message || 'Action effectuée');
        loadCosts();
      } else {
        alert('Erreur lors de l\'action');
      }
    } catch (error) {
      console.error('Erreur action:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const createOverageInvoice = async (tenant: TenantCost) => {
    if (!tenant.billableOverage) return;
    
    if (!confirm(`Créer une facture de ${tenant.billableOverage.amount}€ TTC pour ${tenant.name}?`)) {
      return;
    }

    await handleAction('create_overage_invoice', tenant.id, {
      amount: tenant.billableOverage.amount,
      description: tenant.billableOverage.description,
      period: { month: selectedMonth, year: selectedYear },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'exceeded':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Dépassé</span>;
      case 'warning':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Attention</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">OK</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">?? Gestion des Coûts IA</h1>
          <p className="mt-2 text-gray-600">
            Surveillez les coûts par tenant et facturez les dépassements
          </p>
        </div>

        {/* Filtres période */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-4 items-center">
          <label className="text-sm font-medium text-gray-700">Période:</label>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="border rounded px-3 py-2"
          >
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
              <option key={m} value={m}>
                {new Date(2026, m - 1).toLocaleDateString('fr-FR', { month: 'long' })}
              </option>
            ))}
          </select>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="border rounded px-3 py-2"
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
          <button 
            onClick={loadCosts}
            className="ml-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            ?? Actualiser
          </button>
        </div>

        {/* Résumé global */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total Tenants</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalTenants}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Coût IA Total</p>
              <p className="text-2xl font-bold text-blue-600">{summary.totalAICost.toFixed(2)}€</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Surcoûts</p>
              <p className="text-2xl font-bold text-orange-600">{summary.totalOverage.toFixed(2)}€</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Tenants en dépassement</p>
              <p className="text-2xl font-bold text-red-600">{summary.tenantsOverBudget}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-2 border-green-500">
              <p className="text-sm text-gray-600">?? Facturable</p>
              <p className="text-2xl font-bold text-green-600">{summary.potentialBilling.toFixed(2)}€</p>
              <p className="text-xs text-gray-500">Surcoûts + 50%</p>
            </div>
          </div>
        )}

        {/* Tableau des tenants */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coût IA</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Chargement...
                  </td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Aucun tenant trouvé
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr key={tenant.id} className={tenant.aiCosts.status === 'exceeded' ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{tenant.name}</p>
                        <p className="text-sm text-gray-500">{tenant.subdomain}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {tenant.plan.displayName}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {tenant.plan.priceMonthly}€/mois
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className={`font-bold ${tenant.aiCosts.overage > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                          {tenant.aiCosts.current.toFixed(2)}€
                        </p>
                        <p className="text-xs text-gray-500">{tenant.aiCosts.tokens} tokens</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                        <div 
                          className={`h-2 rounded-full ${
                            tenant.aiCosts.percentage >= 100 ? 'bg-red-600' :
                            tenant.aiCosts.percentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(tenant.aiCosts.percentage, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        {tenant.aiCosts.current.toFixed(2)}€ / {tenant.aiCosts.limit}€
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(tenant.aiCosts.status)}
                      {tenant.aiCosts.overage > 0 && (
                        <p className="text-xs text-red-600 mt-1">
                          +{tenant.aiCosts.overage.toFixed(2)}€
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {tenant.billableOverage && (
                          <button
                            onClick={() => createOverageInvoice(tenant)}
                            disabled={actionLoading === tenant.id}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            ?? Facturer {tenant.billableOverage.amount.toFixed(2)}€
                          </button>
                        )}
                        <button
                          onClick={() => handleAction(
                            tenant.aiCosts.status === 'exceeded' ? 'block_ai' : 'unblock_ai',
                            tenant.id
                          )}
                          disabled={actionLoading === tenant.id}
                          className={`px-3 py-1 text-xs rounded ${
                            tenant.aiCosts.status === 'exceeded'
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          } disabled:opacity-50`}
                        >
                          {tenant.aiCosts.status === 'exceeded' ? '?? Bloquer IA' : '? IA OK'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Légende */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">?? Comment ça marche</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Budget IA</strong>: Limite mensuelle de coûts cloud (Ollama = gratuit)</li>
            <li>• <strong>Surcoût</strong>: Dépassement du budget inclus dans le plan</li>
            <li>• <strong>Facturation</strong>: Surcoût × 1.5 (majoration 50%)</li>
            <li>• <strong>Bloquer IA</strong>: Désactive l&apos;accès à l&apos;IA cloud pour ce tenant</li>
          </ul>
        </div>
      </div>
      </div>
    </div>
  );
}
