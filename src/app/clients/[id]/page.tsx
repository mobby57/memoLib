'use client';

/**
 * Page détail d'un client
 * Affiche toutes les informations du client avec onglets
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  User, ArrowLeft, Building2, Mail, Phone, MapPin,
  FileText, Calendar, Euro, Edit, Download, Plus,
  Briefcase, Clock, AlertCircle, CheckCircle, RefreshCw
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { useToast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';

interface Dossier {
  id: string;
  numero: string;
  titre: string;
  type: string;
  status: string;
  priorite?: string;
  createdAt: string;
}

interface Facture {
  id: string;
  numero: string;
  montantHT: number;
  montantTTC: number;
  statut: string;
  dateEmission: string;
  dateEcheance: string;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  company?: string;
  siret?: string;
  status: string;
  createdAt: string;
  notes?: string;
  dossiers: Dossier[];
  factures: Facture[];
  _count?: {
    dossiers: number;
    factures: number;
    documents: number;
  };
}

const STATUT_LABELS: Record<string, string> = {
  active: 'Actif',
  inactive: 'Inactif',
  prospect: 'Prospect',
  ACTIVE: 'Actif',
  INACTIVE: 'Inactif',
  PROSPECT: 'Prospect',
};

const STATUT_COLORS: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
  active: 'success',
  inactive: 'default',
  prospect: 'info',
  ACTIVE: 'success',
  INACTIVE: 'default',
  PROSPECT: 'info',
};

const DOSSIER_STATUT_COLORS: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
  EN_COURS: 'info',
  en_cours: 'info',
  CLOS: 'success',
  clos: 'success',
  EN_ATTENTE: 'warning',
  en_attente: 'warning',
  ARCHIVE: 'default',
  archive: 'default',
  OUVERT: 'info',
  ouvert: 'info',
};

const FACTURE_STATUT_COLORS: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
  payee: 'success',
  PAYEE: 'success',
  en_attente: 'warning',
  EN_ATTENTE: 'warning',
  retard: 'danger',
  RETARD: 'danger',
  impayee: 'danger',
  IMPAYEE: 'danger',
};

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const { toast } = useToast();
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'dossiers' | 'factures' | 'historique'>('info');

  const clientId = params.id as string;
  const tenantId = (session?.user as { tenantId?: string })?.tenantId;

  useEffect(() => {
    if (clientId && tenantId) {
      fetchClient();
    } else if (clientId && !tenantId && session !== undefined) {
      // Session loaded but no tenantId - use demo mode
      fetchClient();
    }
  }, [clientId, tenantId, session]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      
      // Use tenantId from session or default for demo
      const effectiveTenantId = tenantId || 'demo-tenant';
      const res = await fetch(`/api/clients/${clientId}?tenantId=${effectiveTenantId}&includeDossiers=true&includeFactures=true`);
      
      if (!res.ok) {
        if (res.status === 404) {
          setClient(null);
          return;
        }
        throw new Error('Erreur lors du chargement');
      }
      
      const data = await res.json();
      setClient(data.client);
    } catch (error) {
      console.error('Erreur fetch client:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les données du client'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchClient();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const getFactureStatusIcon = (statut: string) => {
    const s = statut?.toLowerCase();
    switch (s) {
      case 'payee':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'retard':
      case 'impayee':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR');
    } catch {
      return dateStr;
    }
  };

  // Calculate stats
  const stats = client ? {
    totalDossiers: client._count?.dossiers ?? client.dossiers?.length ?? 0,
    dossiersEnCours: client.dossiers?.filter(d => ['EN_COURS', 'en_cours', 'OUVERT', 'ouvert'].includes(d.status)).length ?? 0,
    totalFacture: client.factures?.reduce((sum, f) => sum + (f.montantTTC || f.montantHT || 0), 0) ?? 0,
    facturesImpayees: client.factures?.filter(f => !['payee', 'PAYEE'].includes(f.statut)).reduce((sum, f) => sum + (f.montantTTC || f.montantHT || 0), 0) ?? 0,
  } : { totalDossiers: 0, dossiersEnCours: 0, totalFacture: 0, facturesImpayees: 0 };

  // Get display name
  const clientDisplayName = client ? 
    (client.company || `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Client') : '';
  const isEntreprise = !!client?.company;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Client introuvable
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Ce client n&apos;existe pas ou a été supprimé.
            </p>
            <Link
              href="/clients"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour aux clients
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Clients', href: '/clients' },
          { label: clientDisplayName },
        ]}
      />

      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-4">
          <Link
            href="/clients"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              {isEntreprise ? (
                <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              ) : (
                <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {clientDisplayName}
                </h1>
                <Badge variant={STATUT_COLORS[client.status] || 'default'}>
                  {STATUT_LABELS[client.status] || client.status}
                </Badge>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {isEntreprise ? 'Entreprise' : 'Particulier'} • Client depuis le {formatDate(client.createdAt)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button
            onClick={() => router.push(`/clients/${client.id}/edit`)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Edit className="w-4 h-4" />
            Modifier
          </button>
          <button
            onClick={() => {
              toast({
                variant: 'default',
                title: 'Export en cours',
                description: 'La fiche client sera téléchargée.'
              });
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Exporter
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total dossiers</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalDossiers}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Dossiers en cours</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.dossiersEnCours}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Euro className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total facturé</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalFacture)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Impayés</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.facturesImpayees)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-6">
          {[
            { id: 'info', label: 'Informations', icon: User },
            { id: 'dossiers', label: 'Dossiers', icon: Briefcase, count: client.dossiers?.length || 0 },
            { id: 'factures', label: 'Factures', icon: Euro, count: client.factures?.length || 0 },
            { id: 'historique', label: 'Historique', icon: Calendar },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-1 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Info */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Coordonnées
            </h3>
            <dl className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Email</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">
                    <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline">
                      {client.email}
                    </a>
                  </dd>
                </div>
              </div>
              {client.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Téléphone</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white">
                      <a href={`tel:${client.phone}`} className="text-blue-600 hover:underline">
                        {client.phone}
                      </a>
                    </dd>
                  </div>
                </div>
              )}
              {(client.address || client.city) && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Adresse</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white">
                      {client.address && <>{client.address}<br /></>}
                      {client.postalCode} {client.city}
                    </dd>
                  </div>
                </div>
              )}
            </dl>
          </Card>

          {/* Additional Info */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Informations complémentaires
            </h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Type de client</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {isEntreprise ? 'Entreprise' : 'Particulier'}
                </dd>
              </div>
              {client.company && (
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Société</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">{client.company}</dd>
                </div>
              )}
              {client.siret && (
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">SIRET</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white font-mono">{client.siret}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Date de création</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(client.createdAt)}</dd>
              </div>
            </dl>
            {client.notes && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Notes</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{client.notes}</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'dossiers' && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Dossiers ({client.dossiers?.length || 0})
            </h3>
            <Link
              href={`/dossiers/nouveau?clientId=${client.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <Plus className="w-4 h-4" />
              Nouveau dossier
            </Link>
          </div>
          {!client.dossiers || client.dossiers.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun dossier pour ce client</p>
            </div>
          ) : (
            <div className="space-y-3">
              {client.dossiers.map((dossier) => (
                <Link
                  key={dossier.id}
                  href={`/dossiers/${dossier.id}`}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{dossier.numero}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{dossier.titre}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(dossier.createdAt)}</span>
                    <Badge variant={DOSSIER_STATUT_COLORS[dossier.status] || 'default'}>
                      {(dossier.status || '').replace('_', ' ')}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'factures' && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Factures ({client.factures?.length || 0})
            </h3>
            <Link
              href={`/factures/nouveau?clientId=${client.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <Plus className="w-4 h-4" />
              Nouvelle facture
            </Link>
          </div>
          {!client.factures || client.factures.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Euro className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune facture pour ce client</p>
            </div>
          ) : (
            <div className="space-y-3">
              {client.factures.map((facture) => {
                const s = facture.statut?.toLowerCase();
                return (
                  <div
                    key={facture.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      s === 'retard' || s === 'impayee'
                        ? 'bg-red-50 dark:bg-red-900/20'
                        : s === 'payee'
                        ? 'bg-green-50 dark:bg-green-900/20'
                        : 'bg-yellow-50 dark:bg-yellow-900/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {getFactureStatusIcon(facture.statut)}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{facture.numero}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Émise le {formatDate(facture.dateEmission)} • Échéance {formatDate(facture.dateEcheance)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(facture.montantTTC || facture.montantHT || 0)}
                      </span>
                      <Badge variant={FACTURE_STATUT_COLORS[facture.statut] || 'default'}>
                        {s === 'payee' ? 'Payée' : s === 'retard' || s === 'impayee' ? 'En retard' : 'En attente'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'historique' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Historique des interactions
          </h3>
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Fonctionnalité à venir</p>
            <p className="text-sm mt-2">L&apos;historique des interactions sera bientôt disponible.</p>
          </div>
        </Card>
      )}
    </div>
  );
}
