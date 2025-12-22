import React, { useState, useEffect } from 'react';
import { 
  EnvelopeIcon, 
  SparklesIcon, 
  ClockIcon, 
  UserGroupIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    emailsSent: 0,
    aiGenerated: 0,
    templates: 0,
    contacts: 0
  });
  const [recentEmails, setRecentEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Charger les statistiques
        const [statsRes, historyRes] = await Promise.all([
          apiService.dashboard?.getStats?.() || fetch('/api/dashboard/stats').then(r => r.json()),
          apiService.email?.getHistory?.(5) || fetch('/api/email-history?limit=5').then(r => r.json())
        ]);

        setStats(statsRes || stats);
        setRecentEmails(historyRes?.emails || historyRes || []);
      } catch (error) {
        console.warn('Erreur chargement dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const statCards = [
    {
      name: 'Emails envoyés',
      value: stats.emailsSent || 0,
      icon: EnvelopeIcon,
      change: '+12%',
      changeType: 'increase'
    },
    {
      name: 'Générés par IA',
      value: stats.aiGenerated || 0,
      icon: SparklesIcon,
      change: '+8%',
      changeType: 'increase'
    },
    {
      name: 'Modèles actifs',
      value: stats.templates || 0,
      icon: ClockIcon,
      change: '+2',
      changeType: 'increase'
    },
    {
      name: 'Contacts',
      value: stats.contacts || 0,
      icon: UserGroupIcon,
      change: '+5',
      changeType: 'increase'
    }
  ];

  if (loading) {
    return (
      <div className="animate-pulse">
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="mt-1 text-sm text-gray-500">
          Vue d'ensemble de votre activité email
        </p>
      </div>

      {/* Stats */}
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
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        item.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.changeType === 'increase' ? (
                          <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4" />
                        ) : (
                          <ArrowDownIcon className="self-center flex-shrink-0 h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {item.changeType === 'increase' ? 'Increased' : 'Decreased'} by
                        </span>
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

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Activité récente
          </h3>
          
          {recentEmails.length > 0 ? (
            <div className="flow-root">
              <ul className="-mb-8">
                {recentEmails.slice(0, 5).map((email, idx) => (
                  <li key={email.id || idx}>
                    <div className="relative pb-8">
                      {idx !== recentEmails.length - 1 && (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                            <EnvelopeIcon className="h-4 w-4 text-white" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              Email envoyé à <span className="font-medium text-gray-900">
                                {email.recipient || email.to || 'Destinataire'}
                              </span>
                            </p>
                            <p className="text-sm text-gray-900 font-medium">
                              {email.subject || 'Sans sujet'}
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            {email.timestamp ? new Date(email.timestamp).toLocaleDateString() : 'Aujourd\'hui'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center py-6">
              <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun email récent</h3>
              <p className="mt-1 text-sm text-gray-500">
                Commencez par composer votre premier email.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
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