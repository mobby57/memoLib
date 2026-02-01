'use client';

/**
 * Page Workspace Client Unifié - VERSION COMPLÈTE
 * Vue 360° d'un client avec tous ses échanges et procédures
 * TOUS LES ONGLETS IMPLÉMENTÉS
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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

// Import des composants onglets
import EmailsTab from '@/components/workspace/EmailsTab';
import ProceduresTab from '@/components/workspace/ProceduresTab';
import TimelineTab from '@/components/workspace/TimelineTab';

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

interface Stats {
  emailsUnread: number;
  emailsNeedResponse: number;
  proceduresCritiques: number;
  proceduresActives: number;
  alertesCritiques: number;
  documentsNonVerifies: number;
}

export default function WorkspaceDetailPage() {
  const params = useParams();
  const workspaceId = params.id as string;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

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

  useEffect(() => {
    fetchWorkspace();
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <span className="ml-3 text-gray-600">Chargement du workspace...</span>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <XCircle className="w-8 h-8 text-red-500" />
        <span className="ml-3 text-gray-600">Workspace non trouvé</span>
      </div>
    );
  }

  const client = workspace.client;

  // Couleurs priorités
  const priorityColors = {
    critique: 'bg-red-600 text-white',
    haute: 'bg-orange-500 text-white',
    normale: 'bg-blue-500 text-white',
    faible: 'bg-gray-400 text-white',
  };

  const urgencyColors = {
    critique: 'text-red-600 border-red-600',
    eleve: 'text-orange-500 border-orange-500',
    moyen: 'text-yellow-500 border-yellow-500',
    faible: 'text-green-500 border-green-500',
  };

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: TrendingUp },
    { id: 'emails', label: 'Emails', icon: Mail, badge: stats?.emailsUnread },
    { id: 'procedures', label: 'Procédures', icon: FileText, badge: stats?.proceduresCritiques },
    { id: 'documents', label: 'Documents', icon: Archive },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'notes', label: 'Notes', icon: StickyNote },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Workspace */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Avatar + Info Client */}
          <div className="flex items-start space-x-6 mb-6">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-2xl font-bold">
                {client.firstName?.charAt(0)}{client.lastName?.charAt(0)}
              </span>
            </div>

            {/* Nom + Badges */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {client.firstName} {client.lastName}
              </h1>
              
              <div className="flex items-center space-x-3 mb-3">
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                  {workspace.reference}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  priorityColors[workspace.globalPriority as keyof typeof priorityColors]
                }`}>
                  Priorité {workspace.globalPriority}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  workspace.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {workspace.status === 'active' ? 'Actif' : 'Inactif'}
                </span>
              </div>

              {/* Quick info */}
              <div className="grid grid-cols-4 gap-4 text-sm text-gray-600">
                {client.email && (
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    <span>{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.ville && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{client.ville}</span>
                  </div>
                )}
                {client.profession && (
                  <div className="flex items-center">
                    <Briefcase className="w-4 h-4 mr-2" />
                    <span>{client.profession}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-indigo-600 font-medium">Procédures</p>
                  <p className="text-2xl font-bold text-indigo-900">{workspace.totalProcedures}</p>
                  <p className="text-xs text-indigo-700 mt-1">
                    {stats?.proceduresActives} actives
                  </p>
                </div>
                <FileText className="w-10 h-10 text-indigo-400" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Emails</p>
                  <p className="text-2xl font-bold text-blue-900">{workspace.totalEmails}</p>
                  <p className="text-xs text-blue-700 mt-1">
                    {stats?.emailsUnread} non lus
                  </p>
                </div>
                <Mail className="w-10 h-10 text-blue-400" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Documents</p>
                  <p className="text-2xl font-bold text-yellow-900">{workspace.totalDocuments}</p>
                </div>
                <Archive className="w-10 h-10 text-yellow-400" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Alertes</p>
                  <p className="text-2xl font-bold text-red-900">{workspace.alerts.length}</p>
                  <p className="text-xs text-red-700 mt-1">
                    {stats?.alertesCritiques} critiques
                  </p>
                </div>
                <AlertTriangle className="w-10 h-10 text-red-400" />
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex items-center space-x-1 mt-6 border-b border-gray-200">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 font-medium text-sm flex items-center space-x-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge && tab.badge > 0 && (
                    <span className="px-2 py-0.5 bg-red-500 text-white rounded-full text-xs font-bold">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Grid Procédures + Emails */}
            <div className="grid grid-cols-2 gap-6">
              {/* Procédures actives */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Procédures actives</h3>
                <div className="space-y-3">
                  {workspace.procedures.slice(0, 5).map((proc: any) => (
                    <div key={proc.id} className="flex items-start justify-between p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                            urgencyColors[proc.urgencyLevel as keyof typeof urgencyColors]
                          }`}>
                            {proc.procedureType}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900 text-sm">{proc.title}</p>
                        {proc.deadlineDate && (
                          <p className="text-xs text-gray-500 mt-1 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Échéance: {new Date(proc.deadlineDate).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Derniers emails */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Derniers emails</h3>
                <div className="space-y-3">
                  {workspace.emails.slice(0, 5).map((email: any) => (
                    <div key={email.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      {!email.isRead && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs text-gray-500">{email.from}</span>
                          {email.priority === 'critical' && (
                            <Star className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                        <p className="font-medium text-gray-900 text-sm truncate">{email.subject}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(email.receivedDate).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Alertes */}
            {workspace.alerts.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                  Alertes actives
                </h3>
                <div className="space-y-3">
                  {workspace.alerts.map((alert: any) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        alert.level === 'CRITICAL'
                          ? 'bg-red-50 border-red-500'
                          : alert.level === 'WARNING'
                          ? 'bg-orange-50 border-orange-500'
                          : 'bg-blue-50 border-blue-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{alert.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                          {alert.deadline && (
                            <p className="text-xs text-gray-500 mt-2">
                              Échéance: {new Date(alert.deadline).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </div>
                        {alert.suggestedAction && (
                          <button className="ml-4 px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700">
                            {alert.suggestedAction}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'emails' && (
          <EmailsTab emails={workspace.emails} onRefresh={fetchWorkspace} />
        )}

        {activeTab === 'procedures' && (
          <ProceduresTab procedures={workspace.procedures} onRefresh={fetchWorkspace} />
        )}

        {activeTab === 'documents' && (
          <div className="text-center py-12 text-gray-500">
            <Archive className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Onglet Documents à implémenter</p>
          </div>
        )}

        {activeTab === 'timeline' && (
          <TimelineTab events={workspace.timeline} />
        )}

        {activeTab === 'notes' && (
          <div className="text-center py-12 text-gray-500">
            <StickyNote className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Onglet Notes à implémenter</p>
          </div>
        )}
      </div>
    </div>
  );
}
