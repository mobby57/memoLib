'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import SuperAdminNavigation from '@/components/SuperAdminNavigation';

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user?.role !== 'SUPER_ADMIN') {
      router.push('/auth/login');
    }
  }, [session, router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <SuperAdminNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Parametres Plateforme</h1>
          <p className="text-gray-600 mt-2">Configuration globale</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12 text-gray-500">
            Page de configuration a venir
          </div>
        </div>
      </div>
    </div>
  );
}
