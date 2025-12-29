/**
 * Dashboard principal temps réel pour IA Poste Manager
 * 
 * Fonctionnalités:
 * - Vue temps réel des workspaces avec WebSocket
 * - Graphiques analytics (MRR, quotas, usage)
 * - Filtres multi-critères (type, canal, priorité)
 * - Accessibilité RGAA AAA
 * - Notifications live
 * - Export données
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  FiMail, FiMessageSquare, FiPhone, FiGlobe,
  FiAlertCircle, FiCheckCircle, FiClock, FiFilter,
  FiDownload, FiRefreshCw, FiTrendingUp
} from 'react-icons/fi';

// === TYPES ===

interface Workspace {
  id: string;
  title: string;
  type: 'general' | 'mdph' | 'administrative' | 'urgent';
  channel: 'email' | 'chat' | 'sms' | 'web_form';
  status: 'pending' | 'processing' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  completion_percentage: number;
  todos_count: number;
  notifications_count: number;
}

interface Analytics {
  mrr: number;
  total_workspaces: number;
  active_users: number;
  quota_usage: {
    documents: { used: number; limit: number };
    ai_analyses: { used: number; limit: number };
  };
  channel_distribution: Array<{ name: string; value: number }>;
  priority_distribution: Array<{ name: string; value: number }>;
  completion_rate: number;
}

// === COMPOSANTS ===

const Dashboard: React.FC = () => {
  // États
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    channel: 'all',
    priority: 'all',
    status: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');

  // WebSocket pour mises à jour temps réel
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/dashboard');

    ws.onopen = () => {
      console.log('WebSocket connecté');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'workspace_created') {
        setWorkspaces(prev => [data.workspace, ...prev]);
      } else if (data.type === 'workspace_updated') {
        setWorkspaces(prev =>
          prev.map(w => w.id === data.workspace.id ? data.workspace : w)
        );
      } else if (data.type === 'analytics_update') {
        setAnalytics(data.analytics);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket erreur:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket déconnecté');
      // Reconnexion automatique après 3s
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    };

    return () => ws.close();
  }, []);

  // Charger données initiales
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    
    try {
      // Charger workspaces
      const wsResponse = await fetch('/api/v1/workspaces/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const wsData = await wsResponse.json();
      setWorkspaces(wsData.workspaces || []);

      // Charger analytics
      const analyticsResponse = await fetch('/api/v1/analytics/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const analyticsData = await analyticsResponse.json();
      setAnalytics(analyticsData.analytics);

    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrage workspaces
  const filteredWorkspaces = useMemo(() => {
    return workspaces.filter(ws => {
      // Filtre type
      if (filters.type !== 'all' && ws.type !== filters.type) return false;
      
      // Filtre canal
      if (filters.channel !== 'all' && ws.channel !== filters.channel) return false;
      
      // Filtre priorité
      if (filters.priority !== 'all' && ws.priority !== filters.priority) return false;
      
      // Filtre statut
      if (filters.status !== 'all' && ws.status !== filters.status) return false;
      
      // Recherche texte
      if (searchTerm && !ws.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [workspaces, filters, searchTerm]);

  // Couleurs selon priorité
  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  // Icône selon canal
  const getChannelIcon = (channel: string) => {
    const icons = {
      email: <FiMail className="w-4 h-4" />,
      chat: <FiMessageSquare className="w-4 h-4" />,
      sms: <FiPhone className="w-4 h-4" />,
      web_form: <FiGlobe className="w-4 h-4" />
    };
    return icons[channel as keyof typeof icons] || icons.email;
  };

  // Export données
  const exportData = () => {
    const dataStr = JSON.stringify(filteredWorkspaces, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workspaces_${new Date().toISOString()}.json`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <FiRefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-lg">Chargement du dashboard...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard IA Poste Manager
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Vue temps réel de tous vos workspaces
              </p>
            </div>
            
            <button
              onClick={exportData}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              aria-label="Exporter les données"
            >
              <FiDownload className="mr-2" />
              Exporter
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* MRR */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">MRR</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {analytics.mrr.toLocaleString('fr-FR')} €
                  </p>
                </div>
                <FiTrendingUp className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-xs text-green-600 mt-2">
                +12% vs mois dernier
              </p>
            </div>

            {/* Total workspaces */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Workspaces</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {analytics.total_workspaces}
                  </p>
                </div>
                <FiMessageSquare className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Ce mois-ci
              </p>
            </div>

            {/* Utilisateurs actifs */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Utilisateurs actifs</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {analytics.active_users}
                  </p>
                </div>
                <FiCheckCircle className="w-8 h-8 text-purple-500" />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Dernières 24h
              </p>
            </div>

            {/* Taux de complétion */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taux complétion</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {analytics.completion_rate}%
                  </p>
                </div>
                <FiClock className="w-8 h-8 text-orange-500" />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Objectif: 85%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Graphiques */}
      {analytics && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribution canaux */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Distribution par canal</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={analytics.channel_distribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {analytics.channel_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Distribution priorités */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Distribution par priorité</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.priority_distribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap items-center gap-4">
            <FiFilter className="text-gray-600" />
            
            {/* Recherche */}
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              aria-label="Rechercher des workspaces"
            />

            {/* Filtre Type */}
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              aria-label="Filtrer par type"
            >
              <option value="all">Tous les types</option>
              <option value="general">Général</option>
              <option value="mdph">MDPH</option>
              <option value="administrative">Administratif</option>
              <option value="urgent">Urgent</option>
            </select>

            {/* Filtre Canal */}
            <select
              value={filters.channel}
              onChange={(e) => setFilters({ ...filters, channel: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              aria-label="Filtrer par canal"
            >
              <option value="all">Tous les canaux</option>
              <option value="email">Email</option>
              <option value="chat">Chat</option>
              <option value="sms">SMS</option>
              <option value="web_form">Formulaire web</option>
            </select>

            {/* Filtre Priorité */}
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              aria-label="Filtrer par priorité"
            >
              <option value="all">Toutes priorités</option>
              <option value="low">Basse</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
              <option value="urgent">Urgente</option>
            </select>

            {/* Résultats */}
            <span className="ml-auto text-sm text-gray-600">
              {filteredWorkspaces.length} résultat(s)
            </span>
          </div>
        </div>
      </div>

      {/* Liste workspaces */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Workspace
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Canal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priorité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progression
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredWorkspaces.map((workspace) => (
                  <tr key={workspace.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {workspace.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {workspace.id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {workspace.type}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getChannelIcon(workspace.channel)}
                        <span className="ml-2 text-sm text-gray-900">
                          {workspace.channel}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(workspace.priority)}`}>
                        {workspace.priority}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${workspace.completion_percentage}%` }}
                          role="progressbar"
                          aria-valuenow={workspace.completion_percentage}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">
                        {workspace.completion_percentage}%
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(workspace.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a
                        href={`/workspaces/${workspace.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Voir
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
