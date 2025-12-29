import React from 'react';
import WorkspaceLayout from '../components/WorkspaceLayout';
import { 
  EnvelopeIcon, 
  DocumentTextIcon, 
  ChartBarIcon,
  ClockIcon,
  SparklesIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

const ModernDashboard = () => {
  const stats = [
    {
      title: 'Emails générés',
      value: '2,847',
      change: '+12%',
      trend: 'up',
      icon: EnvelopeIcon,
      color: 'primary'
    },
    {
      title: 'Templates actifs',
      value: '24',
      change: '+3',
      trend: 'up',
      icon: DocumentTextIcon,
      color: 'success'
    },
    {
      title: 'Taux de succès',
      value: '94.2%',
      change: '+2.1%',
      trend: 'up',
      icon: ChartBarIcon,
      color: 'warning'
    },
    {
      title: 'Temps moyen',
      value: '1.2s',
      change: '-0.3s',
      trend: 'down',
      icon: ClockIcon,
      color: 'info'
    }
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'email_generated',
      title: 'Email commercial généré',
      description: 'Template "Prospection B2B" utilisé',
      time: 'Il y a 2 minutes',
      status: 'success'
    },
    {
      id: 2,
      type: 'template_created',
      title: 'Nouveau template créé',
      description: 'Template "Relance client" ajouté',
      time: 'Il y a 15 minutes',
      status: 'info'
    },
    {
      id: 3,
      type: 'ai_optimization',
      title: 'IA optimisée',
      description: 'Modèle GPT-4 mis à jour',
      time: 'Il y a 1 heure',
      status: 'warning'
    }
  ];

  const quickActions = [
    {
      title: 'Générer un email',
      description: 'Créer un nouvel email avec l\'IA',
      icon: SparklesIcon,
      action: 'generate',
      color: 'primary'
    },
    {
      title: 'Nouveau template',
      description: 'Créer un template personnalisé',
      icon: DocumentTextIcon,
      action: 'template',
      color: 'success'
    },
    {
      title: 'Voir les stats',
      description: 'Analyser les performances',
      icon: ChartBarIcon,
      action: 'analytics',
      color: 'warning'
    }
  ];

  return (
    <WorkspaceLayout currentPage="dashboard">
      <div className="page-header">
        <h1 className="page-title">Tableau de bord</h1>
        <p className="page-subtitle">
          Bienvenue dans votre espace de gestion d'emails IA
        </p>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="workspace-card animate-fade-scale">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              <div className={`flex items-center gap-1 text-sm font-semibold ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.trend === 'up' ? (
                  <ArrowUpIcon className="w-4 h-4" />
                ) : (
                  <ArrowDownIcon className="w-4 h-4" />
                )}
                {stat.change}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">
                {stat.title}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Actions rapides */}
        <div className="lg:col-span-1">
          <div className="workspace-card">
            <div className="card-header">
              <h3 className="card-title">Actions rapides</h3>
            </div>
            <div className="space-y-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  className="w-full p-4 text-left border-2 border-gray-100 rounded-lg hover:border-primary-200 hover:bg-primary-50 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-${action.color}-100`}>
                      <action.icon className={`w-5 h-5 text-${action.color}-600`} />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">
                        {action.title}
                      </div>
                      <div className="text-sm text-gray-600">
                        {action.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Activité récente */}
        <div className="lg:col-span-2">
          <div className="workspace-card">
            <div className="card-header">
              <h3 className="card-title">Activité récente</h3>
              <button className="card-action">Voir tout</button>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.status === 'success' ? 'bg-green-500' :
                    activity.status === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">
                      {activity.title}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {activity.description}
                    </div>
                    <div className="text-xs text-gray-500">
                      {activity.time}
                    </div>
                  </div>
                  <div className={`badge badge-${activity.status}`}>
                    {activity.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Graphiques et métriques */}
      <div className="mt-8">
        <div className="workspace-card">
          <div className="card-header">
            <h3 className="card-title">Performance cette semaine</h3>
            <div className="flex gap-2">
              <button className="card-action">7 jours</button>
              <button className="card-action">30 jours</button>
            </div>
          </div>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <ChartBarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Graphique des performances</p>
              <p className="text-sm">Intégration avec Recharts à venir</p>
            </div>
          </div>
        </div>
      </div>

    </WorkspaceLayout>
  );
};

export default ModernDashboard;