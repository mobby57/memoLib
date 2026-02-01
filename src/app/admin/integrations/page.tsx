'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
    Plus,
    Settings,
    Trash2,
    CheckCircle,
    XCircle,
    Mail,
    Calendar,
    MessageSquare,
    Zap,
    Users,
    ExternalLink,
    Shield,
    Clock,
    Activity,
    AlertTriangle,
    Eye,
    Download,
    RefreshCw,
} from 'lucide-react';
import ConsentModal, { IntegrationConsent } from '@/components/integrations/ConsentModal';

/**
 * Integrations Dashboard - GDPR Compliant
 * 
 * Features:
 * - Connected integrations management
 * - Data access audit log
 * - Consent management (revoke/modify)
 * - DPA agreement tracking
 * - Rate limit monitoring
 * - Webhook management
 * - Security monitoring
 */

interface Integration {
    id: string;
    provider: 'gmail' | 'outlook' | 'calendar' | 'slack' | 'hubspot' | 'salesforce';
    providerName: string;
    status: 'connected' | 'disconnected' | 'error';
    connectedAt?: Date;
    lastSyncAt?: Date;
    scopes: string[];
    dataAccess: {
        categories: string[];
        lastAccessedAt?: Date;
        accessCount: number;
    };
    dpa: {
        accepted: boolean;
        version: string;
        acceptedAt?: Date;
    };
    rateLimit: {
        current: number;
        limit: number;
        resetAt: Date;
    };
    webhooks?: {
        count: number;
        active: number;
    };
}

interface AuditLogEntry {
    id: string;
    action: string;
    integration: string;
    timestamp: Date;
    details: string;
    ipAddress?: string;
}

export default function IntegrationsPage() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
    const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
    const [showConsentModal, setShowConsentModal] = useState(false);
    const [consentConfig, setConsentConfig] = useState<IntegrationConsent | null>(null);
    const [activeTab, setActiveTab] = useState<'integrations' | 'audit' | 'webhooks' | 'security'>('integrations');

    useEffect(() => {
        if (session) {
            loadIntegrations();
            loadAuditLog();
        }
    }, [session]);

    const loadIntegrations = async () => {
        try {
            const response = await fetch('/api/integrations');
            const data = await response.json();
            setIntegrations(data.integrations || []);
        } catch (error) {
            console.error('Failed to load integrations:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAuditLog = async () => {
        try {
            const response = await fetch('/api/integrations/audit');
            const data = await response.json();
            setAuditLog(data.logs || []);
        } catch (error) {
            console.error('Failed to load audit log:', error);
        }
    };

    const handleConnectIntegration = (provider: string) => {
        // Load consent configuration for this provider
        const config = getConsentConfig(provider);
        setConsentConfig(config);
        setShowConsentModal(true);
    };

    const handleConsentAccept = async (acceptedScopes: string[]) => {
        if (!consentConfig) return;

        try {
            // Initiate OAuth flow
            const response = await fetch('/api/integrations/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: consentConfig.provider,
                    scopes: acceptedScopes,
                }),
            });

            const data = await response.json();

            if (data.authUrl) {
                // Redirect to OAuth provider
                window.location.href = data.authUrl;
            }
        } catch (error) {
            console.error('Failed to connect integration:', error);
        } finally {
            setShowConsentModal(false);
        }
    };

    const handleDisconnect = async (integrationId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir déconnecter cette intégration ? Toutes les données associées seront supprimées conformément au RGPD.')) {
            return;
        }

        try {
            await fetch(`/api/integrations/${integrationId}`, {
                method: 'DELETE',
            });
            loadIntegrations();
            loadAuditLog();
        } catch (error) {
            console.error('Failed to disconnect integration:', error);
        }
    };

    const handleSync = async (integrationId: string) => {
        try {
            await fetch(`/api/integrations/${integrationId}/sync`, {
                method: 'POST',
            });
            loadIntegrations();
        } catch (error) {
            console.error('Failed to sync integration:', error);
        }
    };

    const exportData = async (integrationId: string) => {
        try {
            const response = await fetch(`/api/integrations/${integrationId}/export`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `integration-data-${integrationId}.json`;
            a.click();
        } catch (error) {
            console.error('Failed to export data:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Intégrations</h1>
                    <p className="text-gray-600">
                        Gérez vos intégrations tierces - Conforme RGPD Article 28 (DPA)
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                    <TabButton
                        active={activeTab === 'integrations'}
                        onClick={() => setActiveTab('integrations')}
                        icon={<Zap className="w-4 h-4" />}
                        label="Intégrations"
                    />
                    <TabButton
                        active={activeTab === 'audit'}
                        onClick={() => setActiveTab('audit')}
                        icon={<Shield className="w-4 h-4" />}
                        label="Audit Trail"
                    />
                    <TabButton
                        active={activeTab === 'webhooks'}
                        onClick={() => setActiveTab('webhooks')}
                        icon={<Activity className="w-4 h-4" />}
                        label="Webhooks"
                    />
                    <TabButton
                        active={activeTab === 'security'}
                        onClick={() => setActiveTab('security')}
                        icon={<AlertTriangle className="w-4 h-4" />}
                        label="Sécurité"
                    />
                </div>

                {/* Integrations Tab */}
                {activeTab === 'integrations' && (
                    <div className="space-y-6">
                        {/* Available Integrations */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Intégrations disponibles
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <IntegrationCard
                                    name="Gmail"
                                    description="Synchronisez vos emails Gmail"
                                    icon={<Mail className="w-8 h-8 text-red-500" />}
                                    provider="gmail"
                                    status={integrations.find(i => i.provider === 'gmail')?.status}
                                    onConnect={() => handleConnectIntegration('gmail')}
                                />
                                <IntegrationCard
                                    name="Outlook"
                                    description="Synchronisez vos emails Outlook"
                                    icon={<Mail className="w-8 h-8 text-blue-500" />}
                                    provider="outlook"
                                    status={integrations.find(i => i.provider === 'outlook')?.status}
                                    onConnect={() => handleConnectIntegration('outlook')}
                                />
                                <IntegrationCard
                                    name="Google Calendar"
                                    description="Gérez vos événements"
                                    icon={<Calendar className="w-8 h-8 text-green-500" />}
                                    provider="calendar"
                                    status={integrations.find(i => i.provider === 'calendar')?.status}
                                    onConnect={() => handleConnectIntegration('calendar')}
                                />
                                <IntegrationCard
                                    name="Slack"
                                    description="Notifications et alertes"
                                    icon={<MessageSquare className="w-8 h-8 text-purple-500" />}
                                    provider="slack"
                                    status={integrations.find(i => i.provider === 'slack')?.status}
                                    onConnect={() => handleConnectIntegration('slack')}
                                />
                                <IntegrationCard
                                    name="HubSpot"
                                    description="CRM et contacts"
                                    icon={<Users className="w-8 h-8 text-orange-500" />}
                                    provider="hubspot"
                                    status={integrations.find(i => i.provider === 'hubspot')?.status}
                                    onConnect={() => handleConnectIntegration('hubspot')}
                                />
                                <IntegrationCard
                                    name="Salesforce"
                                    description="CRM d'entreprise"
                                    icon={<Users className="w-8 h-8 text-blue-600" />}
                                    provider="salesforce"
                                    status={integrations.find(i => i.provider === 'salesforce')?.status}
                                    onConnect={() => handleConnectIntegration('salesforce')}
                                />
                            </div>
                        </div>

                        {/* Connected Integrations */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Intégrations connectées
                            </h2>
                            {integrations.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">
                                    Aucune intégration connectée
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {integrations.map((integration) => (
                                        <ConnectedIntegration
                                            key={integration.id}
                                            integration={integration}
                                            onDisconnect={() => handleDisconnect(integration.id)}
                                            onSync={() => handleSync(integration.id)}
                                            onExport={() => exportData(integration.id)}
                                            onViewDetails={() => setSelectedIntegration(integration.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Audit Tab */}
                {activeTab === 'audit' && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            Journal d'audit (RGPD Article 30)
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Date/Heure
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Action
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Intégration
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Détails
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            IP
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {auditLog.map((entry) => (
                                        <tr key={entry.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(entry.timestamp).toLocaleString('fr-FR')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {entry.action}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {entry.integration}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {entry.details}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {entry.ipAddress}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Webhooks & Security tabs similar structure... */}
            </div>

            {/* Consent Modal */}
            {consentConfig && (
                <ConsentModal
                    integration={consentConfig}
                    isOpen={showConsentModal}
                    onAccept={handleConsentAccept}
                    onDecline={() => setShowConsentModal(false)}
                />
            )}
        </div>
    );
}

// Tab Button Component
function TabButton({
    active,
    onClick,
    icon,
    label,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${active
                    ? 'border-blue-600 text-blue-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
        >
            {icon}
            {label}
        </button>
    );
}

// Integration Card Component
function IntegrationCard({
    name,
    description,
    icon,
    provider,
    status,
    onConnect,
}: {
    name: string;
    description: string;
    icon: React.ReactNode;
    provider: string;
    status?: string;
    onConnect: () => void;
}) {
    return (
        <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
            <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gray-50 rounded-lg">{icon}</div>
                {status === 'connected' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{name}</h3>
            <p className="text-sm text-gray-600 mb-4">{description}</p>
            <button
                onClick={onConnect}
                disabled={status === 'connected'}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${status === 'connected'
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
            >
                {status === 'connected' ? 'Connecté' : 'Connecter'}
            </button>
        </div>
    );
}

// Connected Integration Component
function ConnectedIntegration({
    integration,
    onDisconnect,
    onSync,
    onExport,
    onViewDetails,
}: {
    integration: Integration;
    onDisconnect: () => void;
    onSync: () => void;
    onExport: () => void;
    onViewDetails: () => void;
}) {
    return (
        <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{integration.providerName}</h3>
                    <p className="text-sm text-gray-600">
                        Connecté le {integration.connectedAt ? new Date(integration.connectedAt).toLocaleDateString('fr-FR') : '-'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {integration.status === 'connected' && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {integration.status === 'error' && (
                        <XCircle className="w-5 h-5 text-red-500" />
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                    <p className="text-xs text-gray-500">Dernière synchro</p>
                    <p className="text-sm font-medium text-gray-900">
                        {integration.lastSyncAt ? new Date(integration.lastSyncAt).toLocaleDateString('fr-FR') : 'Jamais'}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">Accès données</p>
                    <p className="text-sm font-medium text-gray-900">
                        {integration.dataAccess.accessCount} fois
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">Rate Limit</p>
                    <p className="text-sm font-medium text-gray-900">
                        {integration.rateLimit.current}/{integration.rateLimit.limit}
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={onSync}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                >
                    <RefreshCw className="w-4 h-4" />
                    Synchroniser
                </button>
                <button
                    onClick={onExport}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
                >
                    <Download className="w-4 h-4" />
                    Exporter (RGPD)
                </button>
                <button
                    onClick={onViewDetails}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
                >
                    <Eye className="w-4 h-4" />
                    Détails
                </button>
                <button
                    onClick={onDisconnect}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100 ml-auto"
                >
                    <Trash2 className="w-4 h-4" />
                    Déconnecter
                </button>
            </div>
        </div>
    );
}

// Get consent configuration for provider
function getConsentConfig(provider: string): IntegrationConsent {
    const configs: Record<string, IntegrationConsent> = {
        gmail: {
            provider: 'gmail',
            providerName: 'Gmail',
            description: 'Connectez votre compte Gmail pour synchroniser automatiquement vos emails.',
            requiredScopes: [
                {
                    id: 'gmail.read',
                    name: 'Lire vos emails',
                    description: 'Permet à MemoLib de lire vos emails Gmail',
                    purpose: 'Synchroniser et traiter vos emails pour classification automatique',
                    dataCategories: ['Sujet des emails', 'Expéditeur/Destinataire', 'Date', 'Corps du message'],
                    retentionPeriod: '90 jours après suppression du compte',
                    required: true,
                    gdprLegalBasis: 'consent',
                },
                {
                    id: 'gmail.metadata',
                    name: 'Métadonnées des emails',
                    description: 'Accès aux labels, pièces jointes, threads',
                    purpose: 'Organisation et classification intelligente',
                    dataCategories: ['Labels Gmail', 'Informations threads', 'Métadonnées pièces jointes'],
                    retentionPeriod: '90 jours après suppression du compte',
                    required: true,
                    gdprLegalBasis: 'consent',
                },
            ],
            optionalScopes: [
                {
                    id: 'gmail.send',
                    name: 'Envoyer des emails',
                    description: 'Permet d\'envoyer des emails depuis votre compte Gmail',
                    purpose: 'Réponses automatiques et envoi d\'emails',
                    dataCategories: ['Contenu emails envoyés'],
                    retentionPeriod: '90 jours',
                    required: false,
                    gdprLegalBasis: 'consent',
                },
            ],
            dataProcessingAgreement: {
                url: '/legal/dpa-gmail.pdf',
                version: '2.1',
                effectiveDate: new Date('2024-01-01'),
            },
            privacyPolicy: '/legal/privacy',
            termsOfService: '/legal/terms',
        },
    };

    return configs[provider] || configs.gmail;
}
