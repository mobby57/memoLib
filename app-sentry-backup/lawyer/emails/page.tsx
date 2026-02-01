'use client';

import { useEffect, useState } from 'react';
import { 
  Mail, MailOpen, Star, Archive, Check, X, 
  Filter, Search, RefreshCw, User, Folder,
  AlertCircle, Clock, Tag, ExternalLink
} from 'lucide-react';

interface Email {
  id: string;
  from: string;
  subject: string;
  receivedDate: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  preview: string;
  classification: {
    type: string;
    priority: string;
    confidence: number;
    tags: string[];
    suggestedAction?: string;
  };
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  dossier?: {
    id: string;
    numero: string;
    titre: string;
    statut: string;
  };
}

interface EmailStats {
  total: number;
  unread: number;
  read: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

const TYPE_LABELS: Record<string, string> = {
  nouveau_client: 'Nouveau Client',
  reponse_client: 'Réponse Client',
  laposte_notification: 'La Poste',
  ceseda: 'CESEDA',
  urgent: 'Urgent',
  spam: 'Spam',
  general: 'Général'
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'text-red-600 bg-red-50',
  high: 'text-orange-600 bg-orange-50',
  medium: 'text-blue-600 bg-blue-50',
  low: 'text-gray-600 bg-gray-50'
};

export default function LawyerEmailsPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  
  // Filtres
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [readFilter, setReadFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEmails();
  }, [typeFilter, priorityFilter, readFilter]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (readFilter !== null) params.append('read', readFilter);

      const res = await fetch(`/api/lawyer/emails?${params}`);
      const data = await res.json();
      
      setEmails(data.emails);
      setStats(data.stats);
    } catch (error) {
      console.error('Erreur chargement emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAction = async (emailId: string, action: string, data?: any) => {
    try {
      await fetch('/api/lawyer/emails', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId, action, data })
      });
      
      fetchEmails(); // Refresh
    } catch (error) {
      console.error('Erreur action email:', error);
    }
  };

  const filteredEmails = emails.filter(email => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      email.from.toLowerCase().includes(query) ||
      email.subject.toLowerCase().includes(query) ||
      email.preview?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Mail className="w-8 h-8" />
            Gestion des Emails
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitoring automatique avec classification IA
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
                <Mail className="w-10 h-10 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Non lus</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.unread}</p>
                </div>
                <MailOpen className="w-10 h-10 text-orange-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Critiques</p>
                  <p className="text-2xl font-bold text-red-600">{stats.byPriority.critical || 0}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Nouveaux clients</p>
                  <p className="text-2xl font-bold text-green-600">{stats.byType.nouveau_client || 0}</p>
                </div>
                <User className="w-10 h-10 text-green-500" />
              </div>
            </div>
          </div>
        )}

        {/* Filtres et recherche */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tous les types</option>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="">Toutes priorités</option>
              <option value="critical">Critique</option>
              <option value="high">Haute</option>
              <option value="medium">Moyenne</option>
              <option value="low">Basse</option>
            </select>

            <button
              onClick={fetchEmails}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className="w-5 h-5" />
              Actualiser
            </button>
          </div>
        </div>

        {/* Liste des emails */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Chargement...</p>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="p-12 text-center">
              <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun email trouvé</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEmails.map((email) => (
                <div
                  key={email.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition ${
                    !email.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                  }`}
                  onClick={() => setSelectedEmail(email)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header email */}
                      <div className="flex items-center gap-2 mb-2">
                        {!email.isRead && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                        )}
                        <span className="font-medium text-gray-900 dark:text-white truncate">
                          {email.from}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${PRIORITY_COLORS[email.classification.priority]}`}>
                          {email.classification.priority}
                        </span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {TYPE_LABELS[email.classification.type]}
                        </span>
                      </div>

                      {/* Sujet */}
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {email.subject}
                      </p>

                      {/* Preview */}
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {email.preview}
                      </p>

                      {/* Tags et infos */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {email.classification.tags && JSON.parse(email.classification.tags as any).map((tag: string, i: number) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                        {email.client && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                            <User className="w-3 h-3" />
                            {email.client.firstName} {email.client.lastName}
                          </span>
                        )}
                        {email.dossier && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                            <Folder className="w-3 h-3" />
                            {email.dossier.numero}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(email.receivedDate).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEmailAction(email.id, email.isStarred ? 'unstar' : 'star');
                          }}
                          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                            email.isStarred ? 'text-yellow-500' : 'text-gray-400'
                          }`}
                        >
                          <Star className="w-4 h-4" fill={email.isStarred ? 'currentColor' : 'none'} />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEmailAction(email.id, email.isRead ? 'mark-unread' : 'mark-read');
                          }}
                          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400"
                        >
                          {email.isRead ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4" />}
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEmailAction(email.id, 'archive');
                          }}
                          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Action suggérée */}
                  {email.classification.suggestedAction && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        💡 <strong>Action suggérée:</strong> {email.classification.suggestedAction}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
