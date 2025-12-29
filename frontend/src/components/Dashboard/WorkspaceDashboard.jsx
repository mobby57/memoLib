import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Activity, 
  Mail, 
  Clock, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Filter,
  Search,
  Download,
  RefreshCw,
  Bell,
  Settings
} from 'lucide-react';

// Hook WebSocket personnalisé
const useWebSocket = (url) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    
    ws.onopen = () => {
      setIsConnected(true);
      setSocket(ws);
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLastMessage(data);
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      setSocket(null);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };
    
    return () => {
      ws.close();
    };
  }, [url]);

  const sendMessage = useCallback((message) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(message));
    }
  }, [socket, isConnected]);

  return { socket, isConnected, lastMessage, sendMessage };
};

// Hook pour l'accessibilité
const useAccessibility = () => {
  const [announcements, setAnnouncements] = useState([]);

  const announceToScreenReader = useCallback((message) => {
    setAnnouncements(prev => [...prev, { id: Date.now(), message }]);
    
    // Nettoyage automatique après 3 secondes
    setTimeout(() => {
      setAnnouncements(prev => prev.slice(1));
    }, 3000);
  }, []);

  const keyboardNavigation = useCallback((event) => {
    // Navigation clavier personnalisée
    if (event.key === 'Tab' && event.shiftKey) {
      // Navigation inverse
    } else if (event.key === 'Tab') {
      // Navigation normale
    } else if (event.key === 'Enter' || event.key === ' ') {
      // Activation d'élément
      event.preventDefault();
      event.target.click();
    }
  }, []);

  return { announceToScreenReader, keyboardNavigation, announcements };
};

// Composant MetricsCard
const MetricsCard = ({ title, value, change, icon: Icon, color = 'blue', trend }) => {
  const getTrendColor = (trend) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 border-${color}-500`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${getTrendColor(trend)}`}>
              {change} depuis hier
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );
};

// Composant WorkspaceCard
const WorkspaceCard = ({ workspace, onAction, onSelect }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onSelect(workspace)}
      role="button"
      tabIndex={0}
      aria-label={`Workspace ${workspace.id} - ${workspace.subject}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {workspace.subject || 'Sans objet'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            De: {workspace.from || 'Expéditeur inconnu'}
          </p>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(workspace.priority)}`}>
            {workspace.priority}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(workspace.status)}`}>
            {workspace.status}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
        <span className="flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          {new Date(workspace.created_at).toLocaleString('fr-FR')}
        </span>
        <span className="flex items-center">
          <Users className="h-4 w-4 mr-1" />
          {workspace.client_id}
        </span>
      </div>

      {workspace.analysis && (
        <div className="mb-3">
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-600">Sentiment:</span>
            <div className={`w-16 h-2 rounded-full ${
              workspace.analysis.sentiment > 0.3 ? 'bg-green-400' :
              workspace.analysis.sentiment < -0.3 ? 'bg-red-400' : 'bg-yellow-400'
            }`}></div>
            <span className="text-gray-600">Urgence: {workspace.analysis.urgency}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction('view', workspace);
            }}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            aria-label={`Voir le workspace ${workspace.id}`}
          >
            Voir
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction('respond', workspace);
            }}
            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
            aria-label={`Répondre au workspace ${workspace.id}`}
          >
            Répondre
          </button>
        </div>
        
        {workspace.requires_attention && (
          <AlertTriangle className="h-4 w-4 text-orange-500" aria-label="Attention requise" />
        )}
      </div>
    </div>
  );
};

// Composant FilterPanel
const FilterPanel = ({ filters, onFilterChange, clients = [] }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Filter className="h-5 w-5 mr-2" />
        Filtres
      </h3>
      
      <div className="space-y-4">
        {/* Filtre par statut */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Statut
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous</option>
            <option value="pending">En attente</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminé</option>
            <option value="error">Erreur</option>
          </select>
        </div>

        {/* Filtre par priorité */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priorité
          </label>
          <select
            value={filters.priority}
            onChange={(e) => onFilterChange({ ...filters, priority: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Toutes</option>
            <option value="critical">Critique</option>
            <option value="high">Élevée</option>
            <option value="normal">Normale</option>
            <option value="low">Faible</option>
          </select>
        </div>

        {/* Filtre par client */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Client
          </label>
          <select
            value={filters.client}
            onChange={(e) => onFilterChange({ ...filters, client: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtre par période */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Période
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => onFilterChange({ ...filters, dateRange: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
          </select>
        </div>

        {/* Recherche */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recherche
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={filters.search || ''}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant NotificationCenter
const NotificationCenter = ({ notifications = [], onMarkAsRead, onClearAll }) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
        aria-label={`Notifications (${unreadCount} non lues)`}
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Notifications</h3>
              {notifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Tout effacer
                </button>
              )}
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Aucune notification
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => onMarkAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-1 rounded-full ${
                      notification.type === 'error' ? 'bg-red-100' :
                      notification.type === 'warning' ? 'bg-yellow-100' :
                      notification.type === 'success' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {notification.type === 'error' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                      {notification.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {notification.type === 'info' && <Activity className="h-4 w-4 text-blue-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.timestamp).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Composant principal WorkspaceDashboard
const WorkspaceDashboard = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [filteredWorkspaces, setFilteredWorkspaces] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    client: 'all',
    dateRange: 'today',
    search: ''
  });
  const [metrics, setMetrics] = useState({
    totalWorkspaces: 0,
    pendingWorkspaces: 0,
    completedToday: 0,
    averageResponseTime: 0,
    clientSatisfaction: 0
  });
  const [notifications, setNotifications] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState([]);

  // WebSocket pour les mises à jour temps réel
  const { socket, isConnected, lastMessage } = useWebSocket('ws://localhost:5000/api/ws/dashboard');
  
  // Accessibilité
  const { announceToScreenReader, keyboardNavigation, announcements } = useAccessibility();

  // Chargement initial des données
  useEffect(() => {
    loadInitialData();
  }, []);

  // Gestion des messages WebSocket
  useEffect(() => {
    if (lastMessage) {
      handleWebSocketMessage(lastMessage);
    }
  }, [lastMessage]);

  // Filtrage des workspaces
  useEffect(() => {
    filterWorkspaces();
  }, [workspaces, filters]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Chargement parallèle des données
      const [workspacesRes, metricsRes, clientsRes] = await Promise.all([
        fetch('/api/v1/workspaces'),
        fetch('/api/v1/analytics/dashboard'),
        fetch('/api/v1/clients')
      ]);

      const workspacesData = await workspacesRes.json();
      const metricsData = await metricsRes.json();
      const clientsData = await clientsRes.json();

      setWorkspaces(workspacesData.workspaces || []);
      setMetrics(metricsData.metrics || {});
      setClients(clientsData.clients || []);

      announceToScreenReader(`Dashboard chargé. ${workspacesData.workspaces?.length || 0} workspaces trouvés.`);
      
    } catch (error) {
      console.error('Erreur chargement données:', error);
      announceToScreenReader('Erreur lors du chargement du dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWebSocketMessage = (message) => {
    switch (message.type) {
      case 'workspace_update':
        updateWorkspace(message.data);
        announceToScreenReader(`Workspace ${message.data.id} mis à jour`);
        break;
      
      case 'new_workspace':
        addWorkspace(message.data);
        announceToScreenReader(`Nouveau workspace reçu de ${message.data.from}`);
        break;
      
      case 'metrics_update':
        setMetrics(prev => ({ ...prev, ...message.data }));
        break;
      
      case 'notification':
        addNotification(message.data);
        announceToScreenReader(`Nouvelle notification: ${message.data.title}`);
        break;
      
      default:
        console.log('Message WebSocket non géré:', message);
    }
  };

  const updateWorkspace = (updatedWorkspace) => {
    setWorkspaces(prev => 
      prev.map(ws => ws.id === updatedWorkspace.id ? { ...ws, ...updatedWorkspace } : ws)
    );
  };

  const addWorkspace = (newWorkspace) => {
    setWorkspaces(prev => [newWorkspace, ...prev]);
  };

  const addNotification = (notification) => {
    setNotifications(prev => [
      { ...notification, id: Date.now(), read: false },
      ...prev.slice(0, 49) // Limite à 50 notifications
    ]);
  };

  const filterWorkspaces = () => {
    let filtered = [...workspaces];

    // Filtre par statut
    if (filters.status !== 'all') {
      filtered = filtered.filter(ws => ws.status === filters.status);
    }

    // Filtre par priorité
    if (filters.priority !== 'all') {
      filtered = filtered.filter(ws => ws.priority === filters.priority);
    }

    // Filtre par client
    if (filters.client !== 'all') {
      filtered = filtered.filter(ws => ws.client_id === filters.client);
    }

    // Filtre par période
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filters.dateRange) {
      case 'today':
        filtered = filtered.filter(ws => new Date(ws.created_at) >= today);
        break;
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(ws => new Date(ws.created_at) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        filtered = filtered.filter(ws => new Date(ws.created_at) >= monthAgo);
        break;
    }

    // Filtre par recherche
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(ws => 
        ws.subject?.toLowerCase().includes(searchTerm) ||
        ws.from?.toLowerCase().includes(searchTerm) ||
        ws.client_id?.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredWorkspaces(filtered);
  };

  const handleWorkspaceAction = async (action, workspace) => {
    try {
      switch (action) {
        case 'view':
          setSelectedWorkspace(workspace);
          break;
        
        case 'respond':
          // Redirection vers l'interface de réponse
          window.location.href = `/workspace/${workspace.id}/respond`;
          break;
        
        case 'archive':
          await fetch(`/api/v1/workspace/${workspace.id}/archive`, { method: 'POST' });
          updateWorkspace({ ...workspace, status: 'archived' });
          announceToScreenReader(`Workspace ${workspace.id} archivé`);
          break;
        
        default:
          console.log('Action non gérée:', action);
      }
    } catch (error) {
      console.error('Erreur action workspace:', error);
      announceToScreenReader('Erreur lors de l\'action sur le workspace');
    }
  };

  const handleRefresh = () => {
    loadInitialData();
    announceToScreenReader('Dashboard actualisé');
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/v1/workspaces/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters })
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workspaces_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      
      announceToScreenReader('Export des données lancé');
    } catch (error) {
      console.error('Erreur export:', error);
      announceToScreenReader('Erreur lors de l\'export');
    }
  };

  const metricsData = useMemo(() => [
    {
      title: 'Workspaces Total',
      value: metrics.totalWorkspaces || 0,
      change: '+12%',
      trend: 12,
      icon: Mail,
      color: 'blue'
    },
    {
      title: 'En Attente',
      value: metrics.pendingWorkspaces || 0,
      change: '-5%',
      trend: -5,
      icon: Clock,
      color: 'orange'
    },
    {
      title: 'Terminés Aujourd\'hui',
      value: metrics.completedToday || 0,
      change: '+8%',
      trend: 8,
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: 'Temps de Réponse Moyen',
      value: `${metrics.averageResponseTime || 0}h`,
      change: '-15min',
      trend: -1,
      icon: TrendingUp,
      color: 'purple'
    }
  ], [metrics]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">Chargement du dashboard...</span>
      </div>
    );
  }

  return (
    <div className="dashboard-container min-h-screen bg-gray-50" onKeyDown={keyboardNavigation}>
      {/* Région aria-live pour les annonces */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcements.map(announcement => (
          <div key={announcement.id}>{announcement.message}</div>
        ))}
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Tableau de Bord IA Poste Manager
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {isConnected ? (
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Connecté en temps réel
                </span>
              ) : (
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                  Connexion interrompue
                </span>
              )}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
              aria-label="Actualiser le dashboard"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            
            <button
              onClick={handleExport}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
              aria-label="Exporter les données"
            >
              <Download className="h-5 w-5" />
            </button>
            
            <NotificationCenter
              notifications={notifications}
              onMarkAsRead={(id) => {
                setNotifications(prev => 
                  prev.map(n => n.id === id ? { ...n, read: true } : n)
                );
              }}
              onClearAll={() => setNotifications([])}
            />
            
            <button className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-full">
        {/* Sidebar avec filtres */}
        <aside className="w-80 bg-white shadow-sm border-r border-gray-200 p-6" aria-label="Filtres et navigation">
          <FilterPanel
            filters={filters}
            onFilterChange={setFilters}
            clients={clients}
          />
        </aside>

        {/* Contenu principal */}
        <main className="flex-1 p-6">
          {/* Métriques */}
          <section className="mb-8" aria-label="Métriques principales">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vue d'ensemble</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {metricsData.map((metric, index) => (
                <MetricsCard key={index} {...metric} />
              ))}
            </div>
          </section>

          {/* Liste des workspaces */}
          <section aria-label="Liste des workspaces">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Workspaces Actifs ({filteredWorkspaces.length})
              </h2>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Activity className="h-4 w-4" />
                <span>Mis à jour en temps réel</span>
              </div>
            </div>

            {filteredWorkspaces.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun workspace trouvé
                </h3>
                <p className="text-gray-600">
                  Aucun workspace ne correspond aux filtres sélectionnés.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredWorkspaces.map(workspace => (
                  <WorkspaceCard
                    key={workspace.id}
                    workspace={workspace}
                    onAction={handleWorkspaceAction}
                    onSelect={setSelectedWorkspace}
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Modal de détail workspace */}
      {selectedWorkspace && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Détails du Workspace</h3>
                <button
                  onClick={() => setSelectedWorkspace(null)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Fermer"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Objet</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedWorkspace.subject}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expéditeur</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedWorkspace.from}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contenu</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-900">{selectedWorkspace.content}</p>
                  </div>
                </div>
                
                {selectedWorkspace.analysis && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Analyse IA</label>
                    <div className="mt-1 p-3 bg-blue-50 rounded-md">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Sentiment:</span> {selectedWorkspace.analysis.sentiment}
                        </div>
                        <div>
                          <span className="font-medium">Urgence:</span> {selectedWorkspace.analysis.urgency}
                        </div>
                        <div>
                          <span className="font-medium">Catégorie:</span> {selectedWorkspace.analysis.category}
                        </div>
                        <div>
                          <span className="font-medium">Complexité:</span> {selectedWorkspace.analysis.complexity}/5
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedWorkspace(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Fermer
                </button>
                <button
                  onClick={() => handleWorkspaceAction('respond', selectedWorkspace)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Répondre
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceDashboard;