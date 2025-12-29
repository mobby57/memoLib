import React, { useEffect, useMemo } from 'react';
import { 
  EnvelopeIcon, 
  SparklesIcon, 
  ClockIcon, 
  UserGroupIcon,
  ArrowUpIcon,
  PencilIcon,
  MicrophoneIcon
} from '@heroicons/react/24/outline';
import useAppStore from '../store/useAppStore';

export default function Dashboard() {
  const { 
    stats, 
    loading, 
    loadDashboard,
    getRecentEmails 
  } = useAppStore();
  
  const recentEmails = getRecentEmails();

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const statCards = useMemo(() => [
    {
      name: 'Emails envoyés',
      value: stats.emailsSent,
      icon: EnvelopeIcon,
      change: '+12%',
      changeType: 'increase'
    },
    {
      name: 'Générés par IA',
      value: stats.aiGenerated,
      icon: SparklesIcon,
      change: '+8%',
      changeType: 'increase'
    },
    {
      name: 'Modèles actifs',
      value: stats.templates,
      icon: ClockIcon,
      change: '+2',
      changeType: 'increase'
    },
    {
      name: 'Contacts',
      value: stats.contacts,
      icon: UserGroupIcon,
      change: '+5',
      changeType: 'increase'
    }
  ], [stats]);

  if (loading) {
    return (
      <div className="animate-pulse" data-testid="loading-skeleton">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg h-24"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="mt-1 text-sm text-gray-500">
          Vue d'ensemble de votre activité email
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <item.icon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {item.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {item.value}
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4" />
                        {item.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Actions rapides
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <button className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <PencilIcon className="mx-auto h-8 w-8 text-gray-400" />
              <span className="mt-2 block text-sm font-medium text-gray-900">
                Composer un email
              </span>
            </button>
            
            <button className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <SparklesIcon className="mx-auto h-8 w-8 text-gray-400" />
              <span className="mt-2 block text-sm font-medium text-gray-900">
                Générer avec IA
              </span>
            </button>
            
            <button className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <MicrophoneIcon className="mx-auto h-8 w-8 text-gray-400" />
              <span className="mt-2 block text-sm font-medium text-gray-900">
                Assistant vocal
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}