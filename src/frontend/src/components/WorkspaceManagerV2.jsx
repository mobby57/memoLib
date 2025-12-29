import { useState, useEffect } from 'react';
import { 
  Plus, Mail, Clock, CheckCircle, AlertTriangle, 
  Trash2, Edit2, MessageSquare, TrendingUp 
} from 'lucide-react';
import workspaceApi from '../services/workspaceApi';

export default function WorkspaceManagerV2() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ status: '', priority: '' });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadWorkspaces();
    loadStats();
  }, [filter]);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await workspaceApi.listWorkspaces(filter);
      setWorkspaces(response.workspaces || []);
    } catch (err) {
      setError(err.message);
      console.error('Error loading workspaces:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await workspaceApi.getUserStats();
      setStats(response.stats);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const createWorkspace = async (title, options = {}) => {
    setCreating(true);
    try {
      const workspaceData = {
        title,
        source: options.source || 'manual',
        priority: options.priority || 'MEDIUM',
        status: options.status || 'IN_PROGRESS'
      };
      
      const response = await workspaceApi.createWorkspace(workspaceData);
      setWorkspaces(prev => [response.workspace, ...prev]);
      loadStats(); // Refresh stats
      return response.workspace;
    } catch (err) {
      setError(err.message);
      console.error('Error creating workspace:', err);
    } finally {
      setCreating(false);
    }
  };

  const updateWorkspace = async (workspaceId, updates) => {
    try {
      const response = await workspaceApi.updateWorkspace(workspaceId, updates);
      setWorkspaces(prev => 
        prev.map(ws => ws.id === workspaceId ? response.workspace : ws)
      );
      loadStats(); // Refresh stats
    } catch (err) {
      setError(err.message);
      console.error('Error updating workspace:', err);
    }
  };

  const deleteWorkspace = async (workspaceId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce workspace ?')) return;
    
    try {
      await workspaceApi.deleteWorkspace(workspaceId);
      setWorkspaces(prev => prev.filter(ws => ws.id !== workspaceId));
      loadStats(); // Refresh stats
    } catch (err) {
      setError(err.message);
      console.error('Error deleting workspace:', err);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'COMPLETED': 'text-green-400 bg-green-500/20',
      'IN_PROGRESS': 'text-blue-400 bg-blue-500/20',
      'PENDING': 'text-yellow-400 bg-yellow-500/20',
      'BLOCKED': 'text-red-400 bg-red-500/20',
      'CANCELLED': 'text-gray-400 bg-gray-500/20'
    };
    return colors[status] || 'text-gray-400 bg-gray-500/20';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'HIGH': 'text-red-400 bg-red-500/20',
      'MEDIUM': 'text-yellow-400 bg-yellow-500/20',
      'LOW': 'text-blue-400 bg-blue-500/20'
    };
    return colors[priority] || 'text-gray-400 bg-gray-500/20';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'COMPLETED': <CheckCircle className="w-4 h-4" />,
      'IN_PROGRESS': <Clock className="w-4 h-4" />,
      'PENDING': <AlertTriangle className="w-4 h-4" />,
      'BLOCKED': <AlertTriangle className="w-4 h-4" />
    };
    return icons[status] || <Mail className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-400">Chargement des workspaces...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header with Stats */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestionnaire de Workspaces</h2>
          <p className="text-gray-400 mt-1">PostgreSQL Backend - API v2</p>
        </div>
        
        {stats && (
          <div className="flex gap-4">
            <div className="bg-gray-800 rounded-lg px-4 py-2">
              <p className="text-xs text-gray-400">Total</p>
              <p className="text-xl font-bold text-white">{stats.total_workspaces}</p>
            </div>
            <div className="bg-blue-500/20 rounded-lg px-4 py-2">
              <p className="text-xs text-blue-400">En cours</p>
              <p className="text-xl font-bold text-blue-400">{stats.in_progress || 0}</p>
            </div>
            <div className="bg-green-500/20 rounded-lg px-4 py-2">
              <p className="text-xs text-green-400">Complétés</p>
              <p className="text-xl font-bold text-green-400">{stats.completed || 0}</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-xs text-red-300 underline mt-2"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={filter.status}
          onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
          className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2"
        >
          <option value="">Tous les statuts</option>
          <option value="PENDING">En attente</option>
          <option value="IN_PROGRESS">En cours</option>
          <option value="COMPLETED">Complété</option>
          <option value="BLOCKED">Bloqué</option>
          <option value="CANCELLED">Annulé</option>
        </select>

        <select
          value={filter.priority}
          onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value }))}
          className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2"
        >
          <option value="">Toutes les priorités</option>
          <option value="HIGH">Haute</option>
          <option value="MEDIUM">Moyenne</option>
          <option value="LOW">Basse</option>
        </select>

        <button
          onClick={() => {
            const title = prompt('Titre du workspace:');
            if (title) createWorkspace(title);
          }}
          disabled={creating}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {creating ? 'Création...' : 'Nouveau Workspace'}
        </button>
      </div>

      {/* Workspaces List */}
      <div className="grid gap-4">
        {workspaces.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <Mail className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Aucun workspace trouvé</p>
            <button
              onClick={() => {
                const title = prompt('Titre du workspace:');
                if (title) createWorkspace(title);
              }}
              className="mt-4 text-blue-400 hover:text-blue-300 underline"
            >
              Créer le premier workspace
            </button>
          </div>
        ) : (
          workspaces.map((workspace) => (
            <WorkspaceCard
              key={workspace.id}
              workspace={workspace}
              onUpdate={updateWorkspace}
              onDelete={deleteWorkspace}
              getStatusColor={getStatusColor}
              getPriorityColor={getPriorityColor}
              getStatusIcon={getStatusIcon}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Workspace Card Component
function WorkspaceCard({ 
  workspace, 
  onUpdate, 
  onDelete, 
  getStatusColor, 
  getPriorityColor, 
  getStatusIcon 
}) {
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const loadMessages = async () => {
    if (messages.length > 0) {
      setExpanded(!expanded);
      return;
    }

    try {
      setLoadingMessages(true);
      const response = await workspaceApi.listMessages(workspace.id);
      setMessages(response.messages || []);
      setExpanded(true);
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const addMessage = async () => {
    const content = prompt('Contenu du message:');
    if (!content) return;

    try {
      const response = await workspaceApi.addMessage(workspace.id, {
        role: 'user',
        content
      });
      setMessages(prev => [...prev, response.data]);
    } catch (err) {
      console.error('Error adding message:', err);
    }
  };

  const updateStatus = async (newStatus) => {
    await onUpdate(workspace.id, { status: newStatus });
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-gray-600 transition-colors">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">{workspace.title}</h3>
            <div className="flex gap-2 flex-wrap">
              <span className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${getStatusColor(workspace.status)}`}>
                {getStatusIcon(workspace.status)}
                {workspace.status}
              </span>
              <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(workspace.priority)}`}>
                {workspace.priority}
              </span>
              {workspace.source && (
                <span className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-300">
                  {workspace.source}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={loadMessages}
              disabled={loadingMessages}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Messages"
            >
              <MessageSquare className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => {
                const newTitle = prompt('Nouveau titre:', workspace.title);
                if (newTitle && newTitle !== workspace.title) {
                  onUpdate(workspace.id, { title: newTitle });
                }
              }}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Modifier"
            >
              <Edit2 className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => onDelete(workspace.id)}
              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progression</span>
            <span>{workspace.progress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${workspace.progress}%` }}
            />
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
          <div>
            <span className="text-gray-500">Créé:</span> {new Date(workspace.created_at).toLocaleDateString()}
          </div>
          <div>
            <span className="text-gray-500">Modifié:</span> {new Date(workspace.updated_at).toLocaleDateString()}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => updateStatus('IN_PROGRESS')}
            className="text-xs px-3 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
          >
            En cours
          </button>
          <button
            onClick={() => updateStatus('COMPLETED')}
            className="text-xs px-3 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
          >
            Compléter
          </button>
          <button
            onClick={addMessage}
            className="text-xs px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
          >
            + Message
          </button>
        </div>
      </div>

      {/* Messages Section */}
      {expanded && (
        <div className="border-t border-gray-700 bg-gray-900/50 p-4">
          <h4 className="text-sm font-semibold text-white mb-3">Messages ({messages.length})</h4>
          {messages.length === 0 ? (
            <p className="text-xs text-gray-500">Aucun message</p>
          ) : (
            <div className="space-y-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg text-sm ${
                    msg.role === 'USER' 
                      ? 'bg-blue-500/10 border border-blue-500/30' 
                      : 'bg-gray-800 border border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-semibold text-gray-400">{msg.role}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-300">{msg.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
