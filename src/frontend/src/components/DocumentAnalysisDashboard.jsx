import React, { useState, useEffect } from 'react';
import { 
  FileText, AlertCircle, CheckCircle, Clock, 
  Bell, ListTodo, TrendingUp, Calendar,
  AlertTriangle, XCircle, Filter, Download
} from 'lucide-react';
import axios from 'axios';
import logger from '../utils/logger';

const API_BASE_URL = 'http://localhost:5000';

// Helper pour les requêtes API
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


const DocumentAnalysisDashboard = () => {
  const [stats, setStats] = useState(null);
  const [todos, setTodos] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les données au montage
  useEffect(() => {
    loadDashboardData();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Paralléliser les appels
      const [statsRes, todosRes, notifsRes, docsRes, deadlinesRes] = await Promise.all([
        apiClient.get('/api/dashboard/stats'),
        apiClient.get('/api/todos?include_completed=false'),
        apiClient.get('/api/notifications?unread_only=true'),
        apiClient.get('/api/documents?limit=10'),
        apiClient.get('/api/documents/deadlines?days_ahead=30')
      ]);

      setStats(statsRes.data.stats);
      setTodos(todosRes.data.todos);
      setNotifications(notifsRes.data.notifications);
      setDocuments(docsRes.data.documents);
      setUpcomingDeadlines(deadlinesRes.data.documents);

    } catch (err) {
      logger.error('Erreur chargement dashboard', err, { component: 'DocumentAnalysisDashboard' });
      setError(err.response?.data?.detail || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const markTodoCompleted = async (todoId) => {
    try {
      await apiClient.patch(`/api/todos/${todoId}`, { status: 'completed' });
      loadDashboardData(); // Recharger
    } catch (err) {
      logger.error('Erreur mise à jour TODO', err, { todoId, action: 'markTodoCompleted' });
    }
  };

  const markNotificationRead = async (notifId) => {
    try {
      await apiClient.patch(`/api/notifications/${notifId}/read`);
      loadDashboardData();
    } catch (err) {
      logger.error('Erreur notification', err, { notifId, action: 'markNotificationRead' });
    }
  };

  const dismissNotification = async (notifId) => {
    try {
      await apiClient.patch(`/api/notifications/${notifId}/dismiss`);
      loadDashboardData();
    } catch (err) {
      logger.error('Erreur dismiss', err, { notifId, action: 'dismissNotification' });
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 to-purple-900">
        <div className="text-white text-xl">⏳ Chargement du dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-900 to-pink-900">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-red-400/30">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <div className="text-white text-xl font-bold mb-2">Erreur</div>
          <div className="text-red-200">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            📋 Dashboard Intelligent
          </h1>
          <p className="text-blue-200">
            Analyse de documents • TODOs • Notifications • Délais
          </p>
          {stats?.user && (
            <div className="mt-2 text-sm text-white/70">
              👤 {stats.user.username} • 🎯 {stats.user.role}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* TODOs Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <ListTodo className="w-8 h-8 text-blue-400" />
              <span className="text-3xl font-bold text-white">
                {stats?.pending_todos || 0}
              </span>
            </div>
            <div className="text-blue-200 text-sm">TODOs en attente</div>
            <div className="mt-2 text-xs text-white/60">
              {stats?.completed_todos || 0} complétés
            </div>
          </div>

          {/* Notifications Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-yellow-400/30">
            <div className="flex items-center justify-between mb-4">
              <Bell className="w-8 h-8 text-yellow-400" />
              <span className="text-3xl font-bold text-white">
                {stats?.unread_notifications || 0}
              </span>
            </div>
            <div className="text-yellow-200 text-sm">Notifications non lues</div>
          </div>

          {/* Documents Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-green-400/30">
            <div className="flex items-center justify-between mb-4">
              <FileText className="w-8 h-8 text-green-400" />
              <span className="text-3xl font-bold text-white">
                {stats?.total_documents || 0}
              </span>
            </div>
            <div className="text-green-200 text-sm">Documents analysés</div>
            <div className="mt-2 text-xs text-white/60">
              {stats?.high_risk_documents || 0} à risque élevé
            </div>
          </div>

          {/* Délais Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-red-400/30">
            <div className="flex items-center justify-between mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <span className="text-3xl font-bold text-white">
                {upcomingDeadlines?.length || 0}
              </span>
            </div>
            <div className="text-red-200 text-sm">Délais approchants</div>
            <div className="mt-2 text-xs text-white/60">Prochains 30 jours</div>
          </div>

        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-4 mb-6 overflow-x-auto">
          {['overview', 'todos', 'notifications', 'documents', 'deadlines'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-white text-purple-900 shadow-lg'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {tab === 'overview' && '📊 Vue d\'ensemble'}
              {tab === 'todos' && '✅ TODOs'}
              {tab === 'notifications' && '🔔 Notifications'}
              {tab === 'documents' && '📄 Documents'}
              {tab === 'deadlines' && '⏰ Délais'}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
          
          {/* Vue d'ensemble */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4">📊 Vue d'ensemble</h2>
              
              {/* Notifications urgentes */}
              {notifications.length > 0 && (
                <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-red-300 mb-3 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Alertes urgentes
                  </h3>
                  <div className="space-y-2">
                    {notifications.slice(0, 3).map(notif => (
                      <div key={notif.id} className="flex items-start justify-between bg-black/20 rounded p-3">
                        <div className="flex-1">
                          <div className="text-white font-medium">{notif.message}</div>
                          <div className="text-xs text-white/60 mt-1">
                            {new Date(notif.alert_date).toLocaleString('fr-FR')}
                          </div>
                        </div>
                        <button
                          onClick={() => dismissNotification(notif.id)}
                          className="ml-4 text-red-300 hover:text-white"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TODOs urgents */}
              {todos.filter(t => t.priority === 'critical' || t.priority === 'high').length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-yellow-300 mb-3 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    TODOs prioritaires
                  </h3>
                  <div className="space-y-2">
                    {todos.filter(t => t.priority === 'critical' || t.priority === 'high').slice(0, 3).map(todo => (
                      <div key={todo.id} className="flex items-start justify-between bg-black/20 rounded p-3">
                        <div className="flex-1">
                          <div className="text-white font-medium">{todo.task}</div>
                          <div className="text-xs text-white/60 mt-1">
                            📅 {todo.deadline || 'Pas de deadline'}
                          </div>
                        </div>
                        <button
                          onClick={() => markTodoCompleted(todo.id)}
                          className="ml-4 text-green-300 hover:text-white"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deadlines approchantes */}
              {upcomingDeadlines.length > 0 && (
                <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-blue-300 mb-3 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Prochaines deadlines
                  </h3>
                  <div className="space-y-2">
                    {upcomingDeadlines.slice(0, 5).map(doc => {
                      const analysis = JSON.parse(doc.analysis_result || '{}');
                      return (
                        <div key={doc.id} className="bg-black/20 rounded p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-white font-medium">{analysis.objet || 'Document'}</div>
                              <div className="text-sm text-blue-200 mt-1">
                                📍 {doc.emetteur || 'Émetteur inconnu'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-white font-bold">
                                {doc.delai_jours}j
                              </div>
                              <div className="text-xs text-white/60">
                                {doc.date_limite}
                              </div>
                            </div>
                          </div>
                          {doc.montant && (
                            <div className="mt-2 text-sm text-yellow-300">
                              💰 {doc.montant}€
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab TODOs */}
          {activeTab === 'todos' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">✅ Mes TODOs</h2>
              {todos.length === 0 ? (
                <div className="text-center text-white/60 py-12">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Aucun TODO en attente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todos.map(todo => (
                    <div 
                      key={todo.id}
                      className={`bg-white/5 border rounded-lg p-4 ${
                        todo.priority === 'critical' ? 'border-red-400/50' :
                        todo.priority === 'high' ? 'border-yellow-400/50' :
                        'border-white/20'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-white font-medium mb-2">{todo.task}</div>
                          {todo.description && (
                            <div className="text-sm text-white/60 mb-2">{todo.description}</div>
                          )}
                          <div className="flex gap-4 text-xs text-white/60">
                            <span>📅 {todo.deadline || 'Pas de deadline'}</span>
                            <span className={`px-2 py-1 rounded ${
                              todo.priority === 'critical' ? 'bg-red-500/20 text-red-300' :
                              todo.priority === 'high' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-blue-500/20 text-blue-300'
                            }`}>
                              {todo.priority}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => markTodoCompleted(todo.id)}
                          className="ml-4 p-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30"
                        >
                          <CheckCircle className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab Notifications */}
          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">🔔 Notifications</h2>
              {notifications.length === 0 ? (
                <div className="text-center text-white/60 py-12">
                  <Bell className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Aucune notification</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map(notif => (
                    <div 
                      key={notif.id}
                      className="bg-white/5 border border-white/20 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-white font-medium mb-2">{notif.message}</div>
                          <div className="text-xs text-white/60">
                            {new Date(notif.alert_date).toLocaleString('fr-FR')}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => markNotificationRead(notif.id)}
                            className="p-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => dismissNotification(notif.id)}
                            className="p-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab Documents */}
          {activeTab === 'documents' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">📄 Documents Analysés</h2>
              {documents.length === 0 ? (
                <div className="text-center text-white/60 py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Aucun document</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map(doc => {
                    const analysis = JSON.parse(doc.analysis_result || '{}');
                    return (
                      <div 
                        key={doc.id}
                        className="bg-white/5 border border-white/20 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="text-white font-bold text-lg">
                              {analysis.objet || 'Document'}
                            </div>
                            <div className="text-sm text-white/70 mt-1">
                              📍 {doc.emetteur} • 📋 {doc.reference}
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                            doc.risk_score > 70 ? 'bg-red-500/20 text-red-300' :
                            doc.risk_score > 40 ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-green-500/20 text-green-300'
                          }`}>
                            Risque: {doc.risk_score}%
                          </div>
                        </div>
                        
                        {doc.montant && (
                          <div className="text-yellow-300 mb-2">💰 {doc.montant}€</div>
                        )}
                        
                        {doc.date_limite && (
                          <div className="text-white/80 mb-2">
                            ⏰ Deadline: {doc.date_limite} ({doc.delai_jours}j restants)
                          </div>
                        )}
                        
                        <div className="text-sm text-white/60">
                          📅 Analysé le {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab Deadlines */}
          {activeTab === 'deadlines' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">⏰ Délais Approchants</h2>
              {upcomingDeadlines.length === 0 ? (
                <div className="text-center text-white/60 py-12">
                  <Clock className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Aucun délai approchant</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingDeadlines.map(doc => {
                    const analysis = JSON.parse(doc.analysis_result || '{}');
                    const isUrgent = doc.delai_jours <= 7;
                    const isCritical = doc.delai_jours <= 3;
                    
                    return (
                      <div 
                        key={doc.id}
                        className={`border rounded-lg p-4 ${
                          isCritical ? 'bg-red-500/10 border-red-400/50' :
                          isUrgent ? 'bg-yellow-500/10 border-yellow-400/50' :
                          'bg-white/5 border-white/20'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-white font-bold text-lg mb-2">
                              {analysis.objet || 'Document'}
                            </div>
                            <div className="text-sm text-white/70 mb-2">
                              📍 {doc.emetteur} • 📋 {doc.reference}
                            </div>
                            <div className="text-white/80">
                              🎯 {analysis.action_requise || 'Action non définie'}
                            </div>
                            {doc.montant && (
                              <div className="text-yellow-300 mt-2">💰 {doc.montant}€</div>
                            )}
                          </div>
                          
                          <div className="text-right ml-4">
                            <div className={`text-3xl font-bold ${
                              isCritical ? 'text-red-300' :
                              isUrgent ? 'text-yellow-300' :
                              'text-blue-300'
                            }`}>
                              {doc.delai_jours}j
                            </div>
                            <div className="text-sm text-white/60 mt-1">
                              {doc.date_limite}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default DocumentAnalysisDashboard;
