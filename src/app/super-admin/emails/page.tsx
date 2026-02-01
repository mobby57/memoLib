'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { 
  Mail, 
  Workflow, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle,
  TrendingUp,
  Building,
  User,
  Paperclip,
  ChevronRight,
  Play,
  Search,
  Filter
} from 'lucide-react';

interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  preview: string;
  category: string;
  urgency: string;
  sentiment: string;
  isRead: boolean;
  isProcessed: boolean;
  receivedAt: string;
  processedAt: string | null;
  tenant: { id: string; name: string; subdomain: string };
  client: { id: string; firstName: string; lastName: string; email: string } | null;
  attachmentCount: number;
  workflow: {
    id: string;
    workflowName: string;
    status: string;
    progress: number;
  } | null;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: string;
  currentStep: string;
  progress: number;
  triggerType: string;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
  tenant: { id: string; name: string };
  email: { id: string; from: string; subject: string; category: string; urgency: string } | null;
  steps: Array<{ name: string; status: string; completedAt: string }>;
}

const URGENCY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="w-4 h-4 text-gray-500" />,
  running: <Play className="w-4 h-4 text-blue-500 animate-pulse" />,
  completed: <CheckCircle className="w-4 h-4 text-green-500" />,
  failed: <XCircle className="w-4 h-4 text-red-500" />,
  cancelled: <XCircle className="w-4 h-4 text-gray-500" />
};

const CATEGORY_LABELS: Record<string, string> = {
  'client-urgent': ' Urgent Client',
  'new-case': ' Nouveau Dossier',
  'deadline-reminder': ' echeance',
  'invoice': ' Facture',
  'legal-question': '️ Question Juridique',
  'court-document': '🏛️ Document Judiciaire',
  'client-complaint': ' Reclamation',
  'document-request': ' Demande Document',
  'appointment-request': ' Rendez-vous',
  'general-inquiry': ' Demande Generale'
};

export default function EmailWorkflowMonitoringPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowExecution[]>([]);
  const [emailStats, setEmailStats] = useState<any>(null);
  const [workflowStats, setWorkflowStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'emails' | 'workflows'>('emails');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowExecution | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [emailsRes, workflowsRes] = await Promise.all([
        fetch('/api/super-admin/emails?limit=20'),
        fetch('/api/super-admin/workflows?limit=20')
      ]);

      if (emailsRes.ok) {
        const data = await emailsRes.json();
        setEmails(data.emails);
        setEmailStats(data.stats);
      }

      if (workflowsRes.ok) {
        const data = await workflowsRes.json();
        setWorkflows(data.workflows);
        setWorkflowStats(data.stats);
      }
    } catch (error) {
      console.error('Erreur chargement donnees:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchData, 5000); // Rafraichir toutes les 5 secondes
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, fetchData]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Workflow className="w-8 h-8 text-blue-600" />
              Monitoring Email & Workflows
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Suivi en temps reel des emails et workflows de la plateforme
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Auto-refresh (5s)
              </span>
            </label>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Emails Total</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {emailStats?.total || 0}
                </p>
              </div>
              <Mail className="w-10 h-10 text-blue-500 opacity-80" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Non traites</p>
                <p className="text-3xl font-bold text-orange-600">
                  {emailStats?.unprocessed || 0}
                </p>
              </div>
              <AlertTriangle className="w-10 h-10 text-orange-500 opacity-80" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Workflows actifs</p>
                <p className="text-3xl font-bold text-blue-600">
                  {workflowStats?.byStatus?.running || 0}
                </p>
              </div>
              <Play className="w-10 h-10 text-blue-500 opacity-80" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Temps moyen</p>
                <p className="text-3xl font-bold text-green-600">
                  {workflowStats?.avgExecutionTimeMs ? `${Math.round(workflowStats.avgExecutionTimeMs / 1000)}s` : '-'}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500 opacity-80" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('emails')}
            className={`pb-4 px-2 font-medium transition ${
              activeTab === 'emails'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <Mail className="w-4 h-4 inline mr-2" />
            Emails ({emailStats?.total || 0})
          </button>
          <button
            onClick={() => setActiveTab('workflows')}
            className={`pb-4 px-2 font-medium transition ${
              activeTab === 'workflows'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <Workflow className="w-4 h-4 inline mr-2" />
            Workflows ({workflowStats?.total || 0})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'emails' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Email List */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {emails.length === 0 ? (
                  <div className="p-12 text-center">
                    <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Aucun email</p>
                  </div>
                ) : (
                  emails.map((email) => (
                    <div
                      key={email.id}
                      onClick={() => setSelectedEmail(email)}
                      className={`p-4 cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        selectedEmail?.id === email.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      } ${!email.isProcessed ? 'border-l-4 border-orange-500' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 dark:text-white truncate">
                              {email.from}
                            </span>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${URGENCY_COLORS[email.urgency]}`}>
                              {email.urgency}
                            </span>
                            {email.attachmentCount > 0 && (
                              <Paperclip className="w-3 h-3 text-gray-400" />
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                            {email.subject}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                            {email.preview}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                              {CATEGORY_LABELS[email.category] || email.category}
                            </span>
                            <span className="text-xs text-gray-400">
                              <Building className="w-3 h-3 inline mr-1" />
                              {email.tenant.name}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{formatDate(email.receivedAt)}</p>
                          {email.workflow && (
                            <div className="mt-2 flex items-center gap-1">
                              {STATUS_ICONS[email.workflow.status]}
                              <span className="text-xs text-gray-500">
                                {email.workflow.progress}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Email Detail */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              {selectedEmail ? (
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">
                    Details Email
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-500">De:</span>
                      <p className="font-medium">{selectedEmail.from}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">a:</span>
                      <p className="font-medium">{selectedEmail.to}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Sujet:</span>
                      <p className="font-medium">{selectedEmail.subject}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Categorie:</span>
                      <p>{CATEGORY_LABELS[selectedEmail.category]}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Cabinet:</span>
                      <p>{selectedEmail.tenant.name}</p>
                    </div>
                    {selectedEmail.client && (
                      <div>
                        <span className="text-gray-500">Client:</span>
                        <p>{selectedEmail.client.firstName} {selectedEmail.client.lastName}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Statut:</span>
                      <p className={selectedEmail.isProcessed ? 'text-green-600' : 'text-orange-600'}>
                        {selectedEmail.isProcessed ? 'Traite' : 'En attente'}
                      </p>
                    </div>
                    {selectedEmail.workflow && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-gray-500">Workflow:</span>
                        <p className="font-medium">{selectedEmail.workflow.workflowName}</p>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${selectedEmail.workflow.progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {selectedEmail.workflow.status} - {selectedEmail.workflow.progress}%
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Selectionnez un email pour voir les details</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Workflows Tab */
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Workflow
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Cabinet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Email Declencheur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Progression
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Demarre
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {workflows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        <Workflow className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        Aucun workflow execute
                      </td>
                    </tr>
                  ) : (
                    workflows.map((wf) => (
                      <tr 
                        key={wf.id} 
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={() => setSelectedWorkflow(wf)}
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {wf.workflowName}
                          </div>
                          <div className="text-xs text-gray-500">{wf.currentStep}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {wf.tenant.name}
                        </td>
                        <td className="px-6 py-4">
                          {wf.email ? (
                            <div className="text-sm">
                              <p className="truncate max-w-[200px]">{wf.email.subject}</p>
                              <p className="text-xs text-gray-500">{wf.email.from}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {STATUS_ICONS[wf.status]}
                            <span className="text-sm capitalize">{wf.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-24">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  wf.status === 'completed' ? 'bg-green-500' :
                                  wf.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${wf.progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{wf.progress}%</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {wf.startedAt ? formatDate(wf.startedAt) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
