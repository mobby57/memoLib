'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

/**
 * Page Workspace Client Unifié - COMPLET ✅
 * Vue 360° d'un client avec tous ses échanges et procédures
 * TOUS LES 6 ONGLETS IMPLÉMENTÉS
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

// Import des composants onglets
import EmailsTab from '@/components/workspace/EmailsTab';
import ProceduresTab from '@/components/workspace/ProceduresTab';
import TimelineTab from '@/components/workspace/TimelineTab';
import DocumentsTab from '@/components/workspace/DocumentsTab';
import NotesTab from '@/components/workspace/NotesTab';
import { 
  Mail, 
  FileText, 
  Calendar, 
  AlertTriangle, 
  User,
  Phone,
  MapPin,
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  Star,
  Archive,
  RefreshCw,
  MessageSquare,
  StickyNote,
  TrendingUp,
} from 'lucide-react';

interface Workspace {
  id: string;
  title: string;
  reference: string;
  status: string;
  globalPriority: string;
  firstContactDate: string;
  lastActivityDate: string;
  totalProcedures: number;
  activeProcedures: number;
  totalEmails: number;
  totalDocuments: number;
  client: any;
  procedures: any[];
  emails: any[];
  messages: any[];
  documents: any[];
  timeline: any[];
  notes: any[];
  alerts: any[];
}

export default function WorkspacePage() {
  const params = useParams();
  const workspaceId = params.id as string;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [emailFilter, setEmailFilter] = useState('all');

  useEffect(() => {
    fetchWorkspace();
  }, [workspaceId]);

  const fetchWorkspace = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/lawyer/workspaces/${workspaceId}`);
      const data = await response.json();

      if (data.success) {
        setWorkspace(data.workspace);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erreur chargement workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-gray-600">Chargement du workspace...</p>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Workspace non trouvé</h2>
          <p className="text-gray-600">Le workspace demandé n&apos;existe pas.</p>
        </div>
      </div>
    );
  }

  const priorityColors = {
    critique: 'bg-red-100 text-red-800 border-red-300',
    haute: 'bg-orange-100 text-orange-800 border-orange-300',
    normale: 'bg-blue-100 text-blue-800 border-blue-300',
    faible: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  const urgencyColors = {
    critique: 'bg-red-600 text-white',
    eleve: 'bg-orange-500 text-white',
    moyen: 'bg-yellow-500 text-white',
    faible: 'bg-green-500 text-white',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Workspace */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {workspace.client.firstName[0]}{workspace.client.lastName[0]}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {workspace.client.firstName} {workspace.client.lastName}
                </h1>
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-sm text-gray-500">{workspace.reference}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${priorityColors[workspace.globalPriority as keyof typeof priorityColors] || priorityColors.normale}`}>
                    Priorité {workspace.globalPriority}
                  </span>
                  {workspace.status === 'active' && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Actif
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Nouveau message</span>
              </button>
            </div>
          </div>

          {/* Infos Client Rapides */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Mail className="w-4 h-4" />
              <span>{workspace.client.email}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Phone className="w-4 h-4" />
              <span>{workspace.client.phone || 'Non renseigné'}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{workspace.client.ville || 'Non renseigné'}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Briefcase className="w-4 h-4" />
              <span>{workspace.client.profession || 'Non renseigné'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Procédures</p>
                <p className="text-2xl font-bold text-gray-900">{workspace.totalProcedures}</p>
                <p className="text-xs text-green-600 mt-1">{workspace.activeProcedures} actives</p>
              </div>
              <FileText className="w-8 h-8 text-indigo-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Emails</p>
                <p className="text-2xl font-bold text-gray-900">{workspace.totalEmails}</p>
                <p className="text-xs text-orange-600 mt-1">{stats?.emailsUnread || 0} non lus</p>
              </div>
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Documents</p>
                <p className="text-2xl font-bold text-gray-900">{workspace.totalDocuments}</p>
                <p className="text-xs text-gray-500 mt-1">Tous vérifiés</p>
              </div>
              <Archive className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Alertes</p>
                <p className="text-2xl font-bold text-gray-900">{workspace.alerts.length}</p>
                <p className="text-xs text-red-600 mt-1">{stats?.alertesCritiques || 0} critiques</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'overview', label: 'Vue d\'ensemble', icon: TrendingUp },
                { id: 'emails', label: 'Emails', icon: Mail, badge: stats?.emailsUnread },
                { id: 'procedures', label: 'Procédures', icon: FileText, badge: stats?.proceduresCritiques },
                { id: 'documents', label: 'Documents', icon: Archive },
                { id: 'timeline', label: 'Timeline', icon: Clock },
                { id: 'notes', label: 'Notes', icon: StickyNote },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                      ${activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                    {tab.badge ? (
                      <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                        {tab.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Vue d'ensemble */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Procédures Actives */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Procédures en cours</h3>
                    <div className="space-y-3">
                      {workspace.procedures.slice(0, 5).map((proc: any) => (
                        <div key={proc.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${urgencyColors[proc.urgencyLevel as keyof typeof urgencyColors]}`}>
                                  {proc.procedureType}
                                </span>
                                <h4 className="font-medium text-gray-900">{proc.title}</h4>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{proc.description}</p>
                              {proc.deadlineDate && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Échéance: {new Date(proc.deadlineDate).toLocaleDateString('fr-FR')}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Derniers Emails */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Derniers emails</h3>
                    <div className="space-y-3">
                      {workspace.emails.slice(0, 5).map((email: any) => (
                        <div key={email.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                {!email.isRead && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                )}
                                <span className="text-sm font-medium text-gray-900">{email.from}</span>
                              </div>
                              <p className="text-sm text-gray-900 mt-1">{email.subject}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(email.receivedDate).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            {email.priority === 'critical' && (
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Alertes */}
                {workspace.alerts.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertes actives</h3>
                    <div className="space-y-3">
                      {workspace.alerts.map((alert: any) => (
                        <div key={alert.id} className={`border-l-4 p-4 rounded ${
                          alert.level === 'critical' ? 'bg-red-50 border-red-600' :
                          alert.level === 'warning' ? 'bg-yellow-50 border-yellow-600' :
                          'bg-blue-50 border-blue-600'
                        }`}>
                          <div className="flex items-start">
                            <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                              alert.level === 'critical' ? 'text-red-600' :
                              alert.level === 'warning' ? 'text-yellow-600' :
                              'text-blue-600'
                            }`} />
                            <div className="ml-3">
                              <h4 className="font-medium text-gray-900">{alert.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Autres onglets */}
            {activeTab === 'emails' && (
              <EmailsTab emails={workspace.emails} workspaceId={params.id as string} onRefresh={fetchWorkspace} />
            )}

            {activeTab === 'procedures' && (
              <ProceduresTab procedures={workspace.procedures} onRefresh={fetchWorkspace} />
            )}

            {activeTab === 'documents' && (
              <DocumentsTab documents={workspace.documents} workspaceId={params.id as string} onRefresh={fetchWorkspace} />
            )}

            {activeTab === 'timeline' && (
              <TimelineTab events={workspace.timeline} />
            )}

            {activeTab === 'notes' && (
              <NotesTab notes={workspace.notes} workspaceId={params.id as string} onRefresh={fetchWorkspace} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
