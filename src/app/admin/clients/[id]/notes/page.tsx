'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Plan {
  id: string;
  name: string;
  displayName: string;
  priceMonthly: number;
  priceYearly: number;
  maxWorkspaces: number;
  maxDossiers: number;
  maxClients: number;
  maxUsers: number;
  isActive: boolean;
}

interface Subscription {
  id: string;
  status: string;
  billingCycle: string;
  pricePerMonth: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  plan: {
    name: string;
    displayName: string;
  };
}

interface QuotaStatus {
  current: number;
  limit: number;
  percentage: number;
  type: string;
}

export default function BillingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [quotas, setQuotas] = useState<QuotaStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated') {
      loadBillingData();
    }
  }, [status, router]);

  const loadBillingData = async () => {
    try {
      // Charger les plans actifs
      const plansRes = await fetch('/api/billing/plans');
      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(plansData.plans || []);
      }

      // Charger la subscription du tenant
      const subRes = await fetch('/api/billing/subscription');
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData.subscription || null);
      }

      // Charger les quotas
      const quotaRes = await fetch('/api/billing/quotas');
      if (quotaRes.ok) {
        const quotaData = await quotaRes.json();
        setQuotas(quotaData.quotas || []);
      }
    } catch (error) {
      console.error('Erreur chargement billing:', error);
    } finally {
      setLoading(false);
    }
  };

  const getQuotaColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600 bg-red-50 border-red-200';
    if (percentage >= 80) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getQuotaBarColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-orange-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      active: { label: 'Actif', color: 'bg-green-100 text-green-800' },
      trialing: { label: 'Essai', color: 'bg-blue-100 text-blue-800' },
      past_due: { label: 'Impaye', color: 'bg-red-100 text-red-800' },
      canceled: { label: 'Annule', color: 'bg-gray-100 text-gray-800' },
    };
    const badge = badges[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
        {badge.label}
      </span>
    );
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Facturation & Abonnement</h1>
          <p className="mt-2 text-gray-600">Gerez votre abonnement, quotas et factures</p>
        </div>

        {/* Subscription actuelle */}
        {subscription && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Abonnement actuel</h2>
              {getStatusBadge(subscription.status)}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Plan</p>
                <p className="text-lg font-semibold text-gray-900">{subscription.plan.displayName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tarif</p>
                <p className="text-lg font-semibold text-gray-900">
                  {subscription.pricePerMonth}�/mois
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Periode actuelle</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(subscription.currentPeriodStart).toLocaleDateString('fr-FR')} - {' '}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quotas d'utilisation */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Utilisation des quotas</h2>
          
          {quotas.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucun quota configure</p>
          ) : (
            <div className="space-y-4">
              {quotas.map((quota) => (
                <div key={quota.type} className={`border rounded-lg p-4 ${getQuotaColor(quota.percentage)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold capitalize">{quota.type}</p>
                      <p className="text-sm">
                        {quota.current} / {quota.limit === -1 ? '8' : quota.limit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{Math.round(quota.percentage)}%</p>
                    </div>
                  </div>
                  
                  {/* Barre de progression */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getQuotaBarColor(quota.percentage)}`}
                      style={{ width: `${Math.min(quota.percentage, 100)}%` }}
                    ></div>
                  </div>
                  
                  {quota.percentage >= 80 && (
                    <p className="text-xs mt-2">
                      {quota.percentage >= 100 
                        ? '? Quota depasse - Veuillez mettre a niveau votre plan'
                        : '? Approche de la limite - Envisagez une mise a niveau'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Plans disponibles */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Plans disponibles</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className={`border-2 rounded-lg p-6 ${
                  subscription?.plan.name === plan.name
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{plan.displayName}</h3>
                  {subscription?.plan.name === plan.name && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      Plan actuel
                    </span>
                  )}
                </div>
                
                <div className="text-center mb-6">
                  <p className="text-4xl font-bold text-gray-900">{plan.priceMonthly}�</p>
                  <p className="text-sm text-gray-600">par mois</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {plan.priceYearly}�/an (economie de {Math.round((1 - plan.priceYearly / (plan.priceMonthly * 12)) * 100)}%)
                  </p>
                </div>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Workspaces</span>
                    <span className="font-semibold">{plan.maxWorkspaces === -1 ? '8' : plan.maxWorkspaces}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Dossiers/mois</span>
                    <span className="font-semibold">{plan.maxDossiers === -1 ? '8' : plan.maxDossiers}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Clients</span>
                    <span className="font-semibold">{plan.maxClients === -1 ? '8' : plan.maxClients}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Utilisateurs</span>
                    <span className="font-semibold">{plan.maxUsers === -1 ? '8' : plan.maxUsers}</span>
                  </div>
                </div>
                
                <button
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    subscription?.plan.name === plan.name
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  disabled={subscription?.plan.name === plan.name}
                >
                  {subscription?.plan.name === plan.name ? 'Plan actuel' : 'Choisir ce plan'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
