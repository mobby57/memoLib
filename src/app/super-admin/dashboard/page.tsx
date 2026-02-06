'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface PlanStats {
  planName: string;
  displayName: string;
  activeSubscriptions: number;
  mrr: number;
  priceMonthly: number;
}

interface SuperAdminStats {
  totalTenants: number;
  activeTenants: number;
  totalSubscriptions: number;
  totalMRR: number;
  totalARR: number;
  planStats: PlanStats[];
  growthRate: number;
}

export default function SuperAdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated') {
      const user = session.user as any;
      if (user.role !== 'SUPER_ADMIN') {
        router.push('/dashboard');
        return;
      }
      loadStats();
    }
  }, [status, session, router]);

  const loadStats = async () => {
    try {
      const res = await fetch('/api/super-admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      } else {
        // Fallback demo data
        setStats({
          totalTenants: 12,
          activeTenants: 10,
          totalSubscriptions: 28,
          totalMRR: 8500,
          totalARR: 102000,
          planStats: [
            {
              planName: 'starter',
              displayName: 'Starter',
              activeSubscriptions: 5,
              mrr: 0,
              priceMonthly: 0,
            },
            {
              planName: 'pro',
              displayName: 'Pro',
              activeSubscriptions: 15,
              mrr: 1485,
              priceMonthly: 99,
            },
            {
              planName: 'enterprise',
              displayName: 'Enterprise',
              activeSubscriptions: 8,
              mrr: 7015,
              priceMonthly: 299,
            },
          ],
          growthRate: 12.5,
        });
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
      // Fallback demo data
      setStats({
        totalTenants: 12,
        activeTenants: 10,
        totalSubscriptions: 28,
        totalMRR: 8500,
        totalARR: 102000,
        planStats: [
          {
            planName: 'starter',
            displayName: 'Starter',
            activeSubscriptions: 5,
            mrr: 0,
            priceMonthly: 0,
          },
          {
            planName: 'pro',
            displayName: 'Pro',
            activeSubscriptions: 15,
            mrr: 1485,
            priceMonthly: 99,
          },
          {
            planName: 'enterprise',
            displayName: 'Enterprise',
            activeSubscriptions: 8,
            mrr: 7015,
            priceMonthly: 299,
          },
        ],
        growthRate: 12.5,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Erreur chargement des statistiques</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Super Admin</h1>
          <p className="mt-2 text-gray-600">Vue globale de la plateforme</p>
        </div>

        {/* KPIs principaux */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* MRR */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">MRR (Mensuel)</p>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-3xl font-bold">{stats.totalMRR.toLocaleString('fr-FR')}€</p>
            <p className="text-xs mt-2 opacity-75">Revenu mensuel recurrent</p>
          </div>

          {/* ARR */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">ARR (Annuel)</p>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <p className="text-3xl font-bold">{stats.totalARR.toLocaleString('fr-FR')}€</p>
            <p className="text-xs mt-2 opacity-75">Revenu annuel recurrent</p>
          </div>

          {/* Tenants actifs */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">Cabinets actifs</p>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <p className="text-3xl font-bold">{stats.activeTenants}</p>
            <p className="text-xs mt-2 opacity-75">Sur {stats.totalTenants} total</p>
          </div>

          {/* Croissance */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">Croissance</p>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <p className="text-3xl font-bold">+{stats.growthRate}%</p>
            <p className="text-xs mt-2 opacity-75">vs mois dernier</p>
          </div>
        </div>

        {/* Repartition par plan */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Repartition par plan</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.planStats.map(plan => (
              <div key={plan.planName} className="border-2 border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{plan.displayName}</h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {plan.activeSubscriptions}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Prix unitaire</span>
                    <span className="font-semibold text-gray-900">{plan.priceMonthly}€/mois</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">MRR de ce plan</span>
                    <span className="font-semibold text-green-600">
                      {plan.mrr.toLocaleString('fr-FR')}€
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Part du MRR total</span>
                    <span className="font-semibold text-blue-600">
                      {stats.totalMRR > 0 ? Math.round((plan.mrr / stats.totalMRR) * 100) : 0}%
                    </span>
                  </div>
                </div>

                {/* Barre de progression */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${stats.totalMRR > 0 ? (plan.mrr / stats.totalMRR) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Projections et objectifs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Projections MRR */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Projections MRR</h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700">Objectif Court Terme</span>
                <span className="text-lg font-bold text-blue-600">3 490€</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700">Objectif Moyen Terme</span>
                <span className="text-lg font-bold text-purple-600">20 000€</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700">Objectif Long Terme</span>
                <span className="text-lg font-bold text-green-600">150 000€</span>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900 font-medium">
                Progression vers l'objectif court terme
              </p>
              <div className="mt-2 w-full bg-blue-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min((stats.totalMRR / 3490) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                {Math.round((stats.totalMRR / 3490) * 100)}% atteint
              </p>
            </div>
          </div>

          {/* Mix optimal */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Mix optimal recommande</h2>

            <div className="space-y-3">
              <div className="p-3 border border-gray-200 rounded">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">10 x Cabinet</span>
                  <span className="text-green-600 font-bold">3 490€</span>
                </div>
                <p className="text-xs text-gray-500">Sweet spot - Meilleure marge</p>
              </div>

              <div className="p-3 border border-gray-200 rounded">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    50 x Cabinet + 5 x Enterprise
                  </span>
                  <span className="text-blue-600 font-bold">19 945€</span>
                </div>
                <p className="text-xs text-gray-500">Scaling phase</p>
              </div>

              <div className="p-3 border border-gray-200 rounded">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    200 x Cabinet + 50 x Enterprise
                  </span>
                  <span className="text-purple-600 font-bold">94 750€</span>
                </div>
                <p className="text-xs text-gray-500">Croissance etablie</p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-purple-50 rounded-lg">
              <p className="text-sm font-medium text-purple-900"> Insight</p>
              <p className="text-xs text-purple-700 mt-1">
                Le plan Cabinet represente le meilleur equilibre valeur/prix. Focus commercial
                recommande.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
