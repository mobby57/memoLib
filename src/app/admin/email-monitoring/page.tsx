'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminNavigation from '@/components/AdminNavigation';
import { 
  Mail, 
  AlertTriangle, 
  Trash2, 
  Filter, 
  RefreshCw,
  TrendingUp,
  Users,
  Shield,
  Clock,
  FolderPlus,
  CheckCircle
} from 'lucide-react';

interface Email {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  type: string;
  priority: string;
  confidence: number;
  tags: string[];
  action: string;
  read?: boolean;
}

interface Stats {
  total: number;
  nouveauClient: number;
  urgent: number;
  spam: number;
  nonLus: number;
  today: number;
}

export default function EmailMonitoringPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [emails, setEmails] = useState<Email[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', priority: '' });
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [creatingDossier, setCreatingDossier] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (session?.user?.role !== 'ADMIN') {
      router.push('/client');
    }
  }, [status, session, router]);

  useEffect(() => {
    fetchEmails();
  }, [filter]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.type) params.append('type', filter.type);
      if (filter.priority) params.append('priority', filter.priority);
      
      const response = await fetch(`/api/admin/email-monitor?${params}`);
      const data = await response.json();
      
      setEmails(data.emails || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (emailId: string, read: boolean) => {
    try {
      await fetch('/api/admin/email-monitor', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId, read }),
      });
      fetchEmails();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const createDossier = async (emailId: string) => {
    try {
      setCreatingDossier(emailId);
      const response = await fetch('/api/admin/create-dossier-from-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`[OK] Dossier cree avec succes!\n\nClient: ${data.client.nom} ${data.client.prenom}\nType: ${data.clientInfo.typeDemande}\nDossier ID: ${data.dossier.id}`);
        fetchEmails();
      } else {
        alert('[ERROR] Erreur lors de la creation du dossier');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('[ERROR] Erreur serveur');
    } finally {
      setCreatingDossier(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'nouveau_client': return 'text-blue-600 bg-blue-50';
      case 'spam': return 'text-red-600 bg-red-50';
      case 'laposte': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AdminNavigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Mail className="h-8 w-8 text-blue-600" />
            Monitoring Email
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Surveillance en temps reel de votre boite mail professionnelle
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Emails</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {stats.total}
                  </p>
                </div>
                <Mail className="h-12 w-12 text-blue-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Nouveaux Clients</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">
                    {stats.nouveauClient}
                  </p>
                </div>
                <Users className="h-12 w-12 text-green-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Urgents</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">
                    {stats.urgent}
                  </p>
                </div>
                <AlertTriangle className="h-12 w-12 text-red-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Aujourd'hui</p>
                  <p className="text-3xl font-bold text-purple-600 mt-1">
                    {stats.today}
                  </p>
                </div>
                <Clock className="h-12 w-12 text-purple-500 opacity-20" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <Filter className="h-5 w-5 text-gray-400" />
            
            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Tous les types</option>
              <option value="nouveau_client">Nouveau Client</option>
              <option value="urgent">Urgent</option>
              <option value="spam">Spam</option>
              <option value="general">General</option>
            </select>

            <select
              value={filter.priority}
              onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Toutes les priorites</option>
              <option value="urgent">Urgent</option>
              <option value="high">Haute</option>
              <option value="medium">Moyenne</option>
              <option value="low">Basse</option>
            </select>

            <button
              onClick={fetchEmails}
              className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </button>
          </div>
        </div>

        {/* Emails List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {emails.length === 0 ? (
              <div className="p-12 text-center">
                <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Aucun email trouve
                </p>
              </div>
            ) : (
              emails.map((email) => (
                <div
                  key={email.id}
                  className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition ${
                    !email.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => setSelectedEmail(email)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {email.from}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(email.type)}`}>
                          {email.type}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(email.priority)}`}>
                          {email.priority}
                        </span>
                      </div>
                      
                      <p className="text-gray-900 dark:text-white font-medium mb-1">
                        {email.subject}
                      </p>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {email.snippet}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                        <span>{new Date(email.date).toLocaleString('fr-FR')}</span>
                        <span>Confiance: {email.confidence}%</span>
                        {email.tags?.length > 0 && (
                          <span>Tags: {email.tags.join(', ')}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          createDossier(email.id);
                        }}
                        disabled={creatingDossier === email.id}
                        className="p-2 hover:bg-green-100 dark:hover:bg-green-900 rounded-lg disabled:opacity-50"
                        title="Creer un dossier"
                      >
                        {creatingDossier === email.id ? (
                          <div className="animate-spin h-5 w-5 border-2 border-green-600 border-t-transparent rounded-full"></div>
                        ) : (
                          <FolderPlus className="h-5 w-5 text-green-600" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(email.id, !email.read);
                        }}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                        title={email.read ? 'Marquer non lu' : 'Marquer lu'}
                      >
                        <Shield className={`h-5 w-5 ${email.read ? 'text-gray-400' : 'text-blue-600'}`} />
                      </button>
                    </div>
                  </div>

                  {email.action && (
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        [emoji] <strong>Action suggeree:</strong> {email.action}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
