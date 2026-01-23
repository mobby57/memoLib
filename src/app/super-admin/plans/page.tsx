'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import SuperAdminNavigation from '@/components/SuperAdminNavigation';

interface Plan {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  maxDossiers: number;
  maxClients: number;
  maxStorageGb: number;
  maxUsers: number;
  aiAutonomyLevel: number;
  isActive: boolean;
}

export default function PlansPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role !== 'SUPER_ADMIN') {
      router.push('/auth/login');
      return;
    }
    loadPlans();
  }, [session, router]);

  const loadPlans = async () => {
    try {
      const res = await fetch('/api/super-admin/plans');
      if (res.ok) {
        setPlans(await res.json());
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Plans</h1>
          <p className="text-gray-600 mt-2">Plans tarifaires de la plateforme</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-lg shadow-md p-6 border-2 ${
                plan.name === 'PREMIUM'
                  ? 'border-purple-500 ring-2 ring-purple-200'
                  : 'border-gray-200'
              }`}
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">{plan.displayName}</h3>
                <p className="text-gray-600 text-sm mt-1">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.priceMonthly}€
                  </span>
                  <span className="text-gray-600">/mois</span>
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  {plan.priceYearly}€/an (2 mois offerts)
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Dossiers max</span>
                  <span className="font-medium text-gray-900">{plan.maxDossiers}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Clients max</span>
                  <span className="font-medium text-gray-900">{plan.maxClients}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Users max</span>
                  <span className="font-medium text-gray-900">{plan.maxUsers}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Stockage</span>
                  <span className="font-medium text-gray-900">{plan.maxStorageGb} GB</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">IA Autonomie</span>
                  <span className="font-medium text-gray-900">Niveau {plan.aiAutonomyLevel}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    plan.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {plan.isActive ? 'Actif' : 'Inactif'}
                </span>
                <button className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                  Modifier
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
