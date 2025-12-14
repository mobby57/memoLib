import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Inbox as InboxIcon, 
  Search, 
  Filter,
  Clock,
  AlertCircle,
  CheckCircle,
  Tag,
  Calendar,
  User,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronRight,
  Paperclip,
  Star,
  Trash2,
  Eye,
  MessageSquare,
  BarChart3
} from 'lucide-react';

export default function Inbox() {
  const [emails, setEmails] = useState([]);
  const [filteredEmails, setFilteredEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [threads, setThreads] = useState({});
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [expandedThreads, setExpandedThreads] = useState(new Set());
  
  // Filtres
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    domain: '',
    type: '',
    isImportant: null,
    isReplied: null,
    deadlinePassed: false,
    hasAttachments: null,
    showUnreadOnly: false
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' ou 'threads'

  useEffect(() => {
    loadInbox();
    loadStatistics();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [emails, filters]);

  const loadInbox = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/inbox', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setEmails(data.emails || []);
        setThreads(data.threads || {});
      }
    } catch (error) {
      console.error('Erreur chargement inbox:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await fetch('/api/inbox/statistics', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    }
  };

  const syncInbox = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/inbox/sync', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days_back: 30 })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadInbox();
        await loadStatistics();
        alert(`${data.fetched_count} nouveaux emails synchronisés`);
      }
    } catch (error) {
      console.error('Erreur synchronisation:', error);
      alert('Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...emails];

    // Recherche texte
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(e => 
        e.subject.toLowerCase().includes(search) ||
        e.from.toLowerCase().includes(search) ||
        e.body.toLowerCase().includes(search)
      );
    }

    // Date from
    if (filters.dateFrom) {
      const dateFrom = new Date(filters.dateFrom);
      filtered = filtered.filter(e => new Date(e.date) >= dateFrom);
    }

    // Date to
    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo);
      filtered = filtered.filter(e => new Date(e.date) <= dateTo);
    }

    // Domaine
    if (filters.domain) {
      filtered = filtered.filter(e => 
        e.domain.toLowerCase().includes(filters.domain.toLowerCase())
      );
    }

    // Type
    if (filters.type) {
      filtered = filtered.filter(e => e.type === filters.type);
    }

    // Important
    if (filters.isImportant !== null) {
      filtered = filtered.filter(e => e.is_important === filters.isImportant);
    }

    // Répondu
    if (filters.isReplied !== null) {
      filtered = filtered.filter(e => e.is_replied === filters.isReplied);
    }

    // Deadline passée
    if (filters.deadlinePassed) {
      const now = new Date();
      filtered = filtered.filter(e => 
        new Date(e.response_deadline) < now && !e.is_replied
      );
    }

    // Pièces jointes
    if (filters.hasAttachments !== null) {
      filtered = filtered.filter(e => e.has_attachments === filters.hasAttachments);
    }

    // Non lus seulement
    if (filters.showUnreadOnly) {
      filtered = filtered.filter(e => !e.is_read);
    }

    setFilteredEmails(filtered);
  };

  const markAsRead = async (messageId) => {
    try {
      await fetch(`http://127.0.0.1:5000/api/inbox/${messageId}/read`, {
        method: 'POST',
        credentials: 'include'
      });
      
      setEmails(prev => prev.map(e => 
        e.message_id === messageId ? { ...e, is_read: true } : e
      ));
    } catch (error) {
      console.error('Erreur marquer comme lu:', error);
    }
  };

  const markAsReplied = async (messageId) => {
    try {
      await fetch(`http://127.0.0.1:5000/api/inbox/${messageId}/replied`, {
        method: 'POST',
        credentials: 'include'
      });
      
      setEmails(prev => prev.map(e => 
        e.message_id === messageId ? { ...e, is_replied: true } : e
      ));
    } catch (error) {
      console.error('Erreur marquer comme répondu:', error);
    }
  };

  const addTag = async (messageId, tag) => {
    try {
      await fetch(`http://127.0.0.1:5000/api/inbox/${messageId}/tag`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag })
      });
      
      await loadInbox();
    } catch (error) {
      console.error('Erreur ajout tag:', error);
    }
  };

  const toggleThread = (threadId) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
      }
      return newSet;
    });
  };

  const getTypeColor = (type) => {
    const colors = {
      urgent: 'bg-red-100 text-red-700',
      facture: 'bg-blue-100 text-blue-700',
      reponse: 'bg-green-100 text-green-700',
      administratif: 'bg-purple-100 text-purple-700',
      newsletter: 'bg-gray-100 text-gray-700',
      confirmation: 'bg-teal-100 text-teal-700',
      general: 'bg-slate-100 text-slate-700'
    };
    return colors[type] || colors.general;
  };

  const isOverdue = (deadline) => {
    return new Date(deadline) < new Date();
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'À l\'instant';
    if (hours < 24) return `Il y a ${hours}h`;
    if (hours < 48) return 'Hier';
    
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const EmailCard = ({ email, isInThread = false }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg border ${
        !email.is_read ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200'
      } p-4 hover:shadow-md transition-all cursor-pointer ${
        isInThread ? 'ml-8' : ''
      }`}
      onClick={() => {
        setSelectedEmail(email);
        if (!email.is_read) markAsRead(email.message_id);
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className={`text-sm ${!email.is_read ? 'font-semibold' : 'font-medium'} truncate`}>
              {email.from}
            </span>
            <span className="text-xs text-gray-400 flex-shrink-0">
              {email.domain}
            </span>
          </div>

          {/* Subject */}
          <h3 className={`text-base mb-2 truncate ${
            !email.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'
          }`}>
            {email.subject}
          </h3>

          {/* Preview */}
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {email.body}
          </p>

          {/* Tags et badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(email.type)}`}>
              {email.type}
            </span>
            
            {email.is_important && (
              <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                <Star className="w-3 h-3" />
                Important
              </span>
            )}
            
            {email.has_attachments && (
              <span className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                <Paperclip className="w-3 h-3" />
                PJ
              </span>
            )}
            
            {email.is_replied && (
              <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                <CheckCircle className="w-3 h-3" />
                Répondu
              </span>
            )}
            
            {isOverdue(email.response_deadline) && !email.is_replied && (
              <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                <AlertCircle className="w-3 h-3" />
                En retard
              </span>
            )}

            {email.tags && email.tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Date et actions */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className="text-xs text-gray-500">
            {formatDate(email.date)}
          </span>
          
          <div className="flex gap-1">
            {!email.is_read && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  markAsRead(email.message_id);
                }}
                className="p-1 hover:bg-blue-100 rounded"
                title="Marquer comme lu"
              >
                <Eye className="w-4 h-4 text-blue-600" />
              </button>
            )}
            
            {!email.is_replied && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  markAsReplied(email.message_id);
                }}
                className="p-1 hover:bg-green-100 rounded"
                title="Marquer comme répondu"
              >
                <CheckCircle className="w-4 h-4 text-green-600" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <InboxIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Boîte de réception</h1>
            <p className="text-gray-600">Gérez tous vos emails reçus</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={syncInbox}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Synchronisation...' : 'Synchroniser'}
          </button>
        </div>
      </div>

      {/* Statistiques */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-gray-600">Total</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{statistics.total_emails}</p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-blue-300 bg-blue-50/30">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-gray-600">Non lus</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{statistics.unread}</p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-gray-600" />
              <span className="text-xs text-gray-600">Sans réponse</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{statistics.unreplied}</p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-orange-300 bg-orange-50/30">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-orange-600" />
              <span className="text-xs text-gray-600">Importants</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{statistics.important}</p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-red-300 bg-red-50/30">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-xs text-gray-600">En retard</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{statistics.overdue}</p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-gray-600" />
              <span className="text-xs text-gray-600">Discussions</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{statistics.total_threads}</p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="text-xs text-gray-600">Temps moy.</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {Math.round(statistics.avg_response_time)}h
            </p>
          </div>
        </div>
      )}

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher dans les emails..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
              showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtres
          </button>

          <div className="flex gap-2 border-l pl-3">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded ${
                viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Liste
            </button>
            <button
              onClick={() => setViewMode('threads')}
              className={`px-3 py-2 rounded ${
                viewMode === 'threads' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Discussions
            </button>
          </div>
        </div>

        {/* Filtres avancés */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Domaine</label>
                <input
                  type="text"
                  placeholder="exemple.com"
                  value={filters.domain}
                  onChange={(e) => setFilters(prev => ({ ...prev, domain: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Tous</option>
                  <option value="urgent">Urgent</option>
                  <option value="facture">Facture</option>
                  <option value="reponse">Réponse</option>
                  <option value="administratif">Administratif</option>
                  <option value="newsletter">Newsletter</option>
                  <option value="confirmation">Confirmation</option>
                  <option value="general">Général</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="important"
                  checked={filters.isImportant === true}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    isImportant: e.target.checked ? true : null 
                  }))}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="important" className="text-sm text-gray-700">Importants uniquement</label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="unreplied"
                  checked={filters.isReplied === false}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    isReplied: e.target.checked ? false : null 
                  }))}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="unreplied" className="text-sm text-gray-700">Sans réponse</label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="overdue"
                  checked={filters.deadlinePassed}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    deadlinePassed: e.target.checked 
                  }))}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="overdue" className="text-sm text-gray-700">Deadline passée</label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="unread"
                  checked={filters.showUnreadOnly}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    showUnreadOnly: e.target.checked 
                  }))}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="unread" className="text-sm text-gray-700">Non lus uniquement</label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Liste des emails */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Chargement des emails...</p>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun email trouvé</p>
          </div>
        ) : (
          filteredEmails.map(email => (
            <EmailCard key={email.message_id} email={email} />
          ))
        )}
      </div>

      {/* Modal détails email */}
      <AnimatePresence>
        {selectedEmail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedEmail(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedEmail.subject}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>De: {selectedEmail.from}</span>
                      <span>•</span>
                      <span>{new Date(selectedEmail.date).toLocaleString('fr-FR')}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedEmail(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {/* Body */}
                <div className="prose max-w-none mb-6">
                  <div className="whitespace-pre-wrap text-gray-700">
                    {selectedEmail.body}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-6 border-t">
                  <button
                    onClick={() => {
                      window.location.href = `/send?reply_to=${selectedEmail.message_id}`;
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Répondre
                  </button>
                  
                  {!selectedEmail.is_replied && (
                    <button
                      onClick={() => markAsReplied(selectedEmail.message_id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Marquer comme répondu
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
