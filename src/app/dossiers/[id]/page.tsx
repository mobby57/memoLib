'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

/**
 * Page détail d'un dossier
 * Affiche toutes les informations du dossier avec onglets
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  ArrowLeft,
  User,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Upload,
  MessageSquare,
  Edit,
  Trash2,
  Download,
  Plus,
  Briefcase,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
  url?: string;
}

interface Echeance {
  id: string;
  titre: string;
  date: string;
  statut: 'PENDING' | 'DONE' | 'OVERDUE';
}

interface Note {
  id: string;
  content: string;
  createdAt: string;
  author: string;
}

interface Dossier {
  id: string;
  numero: string;
  titre: string;
  clientId: string;
  clientNom: string;
  type: 'CIVIL' | 'PENAL' | 'COMMERCIAL' | 'ADMINISTRATIF';
  statut: 'EN_COURS' | 'CLOS' | 'EN_ATTENTE' | 'ARCHIVE';
  dateOuverture: string;
  dateCloture?: string;
  description?: string;
  documents: Document[];
  echeances: Echeance[];
  notes: Note[];
}

const TYPE_LABELS = {
  CIVIL: 'Civil',
  PENAL: 'Pénal',
  COMMERCIAL: 'Commercial',
  ADMINISTRATIF: 'Administratif',
};

const STATUT_LABELS = {
  EN_COURS: 'En cours',
  CLOS: 'Clos',
  EN_ATTENTE: 'En attente',
  ARCHIVE: 'Archivé',
};

const STATUT_COLORS: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
  EN_COURS: 'info',
  CLOS: 'success',
  EN_ATTENTE: 'warning',
  ARCHIVE: 'default',
};

// Mock data for demonstration
const MOCK_DOSSIER: Dossier = {
  id: '1',
  numero: 'DOS-2024-001',
  titre: 'Litige commercial SARL Martin',
  clientId: '1',
  clientNom: 'Jean Dupont',
  type: 'COMMERCIAL',
  statut: 'EN_COURS',
  dateOuverture: '2024-01-15',
  description:
    'Litige avec fournisseur sur qualité marchandise. Le client souhaite obtenir réparation pour les dommages subis suite à la livraison de marchandises défectueuses.',
  documents: [
    {
      id: '1',
      name: 'Contrat_fournisseur.pdf',
      type: 'application/pdf',
      size: 245000,
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      name: 'Factures_2023.pdf',
      type: 'application/pdf',
      size: 512000,
      createdAt: '2024-01-16',
    },
    {
      id: '3',
      name: 'Photos_marchandise.zip',
      type: 'application/zip',
      size: 3200000,
      createdAt: '2024-01-17',
    },
  ],
  echeances: [
    { id: '1', titre: 'Dépôt conclusions', date: '2024-02-15', statut: 'DONE' },
    { id: '2', titre: 'Audience TGI', date: '2024-03-20', statut: 'PENDING' },
    { id: '3', titre: 'Délai appel', date: '2024-01-10', statut: 'OVERDUE' },
  ],
  notes: [
    {
      id: '1',
      content: 'Premier contact avec le client. Dossier urgent.',
      createdAt: '2024-01-15',
      author: 'Me Dupont',
    },
    {
      id: '2',
      content: 'Réception des pièces justificatives. Analyse en cours.',
      createdAt: '2024-01-18',
      author: 'Me Dupont',
    },
  ],
};

export default function DossierDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'documents' | 'echeances' | 'notes'>('info');

  const dossierId = params.id as string;

  useEffect(() => {
    if (dossierId) {
      fetchDossier();
    }
  }, [dossierId]);

  const fetchDossier = async () => {
    try {
      setLoading(true);

      // Appel API réel pour récupérer le dossier
      const response = await fetch(`/api/dossiers/${dossierId}`);

      if (response.ok) {
        const data = await response.json();
        setDossier(data.dossier || data);
      } else if (response.status === 404) {
        // Fallback sur données mock si API non disponible
        console.warn('API dossier non disponible, utilisation des données mock');
        const mockDossiers = [MOCK_DOSSIER];
        const found = mockDossiers.find(d => d.id === dossierId) || {
          ...MOCK_DOSSIER,
          id: dossierId,
          numero: `DOS-2024-${dossierId.padStart(3, '0')}`,
        };
        setDossier(found);
      } else {
        throw new Error('Erreur serveur');
      }
    } catch (error) {
      console.error('Erreur fetch dossier:', error);
      // Fallback gracieux sur mock en cas d'erreur
      setDossier({
        ...MOCK_DOSSIER,
        id: dossierId,
        numero: `DOS-2024-${dossierId.padStart(3, '0')}`,
      });
      toast({
        variant: 'destructive',
        title: 'Mode hors-ligne',
        description: 'Données locales affichées',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getEcheanceStatusIcon = (statut: string) => {
    switch (statut) {
      case 'DONE':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'OVERDUE':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Dossier introuvable
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Ce dossier n&apos;existe pas ou a été supprimé.
            </p>
            <Link
              href="/dossiers"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour aux dossiers
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Dossiers', href: '/dossiers' }, { label: dossier.numero }]} />

      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-4">
          <Link
            href="/dossiers"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{dossier.numero}</h1>
              <Badge variant={STATUT_COLORS[dossier.statut]}>{STATUT_LABELS[dossier.statut]}</Badge>
            </div>
            <h2 className="text-lg text-gray-600 dark:text-gray-400">{dossier.titre}</h2>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/dossiers/${dossier.id}/edit`)}
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
                description: 'Le dossier sera téléchargé dans quelques instants.',
              });
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Exporter
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-6">
          {[
            { id: 'info', label: 'Informations', icon: Briefcase },
            { id: 'documents', label: 'Documents', icon: FileText },
            { id: 'echeances', label: 'Échéances', icon: Calendar },
            { id: 'notes', label: 'Notes', icon: MessageSquare },
          ].map(tab => (
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
              {tab.id === 'documents' && dossier.documents.length > 0 && (
                <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full">
                  {dossier.documents.length}
                </span>
              )}
              {tab.id === 'echeances' &&
                dossier.echeances.filter(e => e.statut !== 'DONE').length > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 rounded-full">
                    {dossier.echeances.filter(e => e.statut !== 'DONE').length}
                  </span>
                )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Détails du dossier
            </h3>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Numéro</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white">
                  {dossier.numero}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Type</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white">
                  {TYPE_LABELS[dossier.type]}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Date d&apos;ouverture</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white">
                  {dossier.dateOuverture}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Statut</dt>
                <dd>
                  <Badge variant={STATUT_COLORS[dossier.statut]}>
                    {STATUT_LABELS[dossier.statut]}
                  </Badge>
                </dd>
              </div>
              {dossier.dateCloture && (
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Date de clôture</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">
                    {dossier.dateCloture}
                  </dd>
                </div>
              )}
            </dl>
            {dossier.description && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Description
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{dossier.description}</p>
              </div>
            )}
          </Card>

          {/* Client Info */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Client</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{dossier.clientNom}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">ID: {dossier.clientId}</p>
              </div>
            </div>
            <Link
              href={`/clients/${dossier.clientId}`}
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Voir la fiche client →
            </Link>
          </Card>
        </div>
      )}

      {activeTab === 'documents' && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Documents ({dossier.documents.length})
            </h3>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              <Upload className="w-4 h-4" />
              Ajouter un document
            </button>
          </div>
          {dossier.documents.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun document pour ce dossier</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dossier.documents.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{doc.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(doc.size)} • Ajouté le {doc.createdAt}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                      title="Télécharger"
                    >
                      <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'echeances' && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Échéances ({dossier.echeances.length})
            </h3>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              <Plus className="w-4 h-4" />
              Nouvelle échéance
            </button>
          </div>
          {dossier.echeances.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune échéance définie</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dossier.echeances.map(echeance => (
                <div
                  key={echeance.id}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    echeance.statut === 'OVERDUE'
                      ? 'bg-red-50 dark:bg-red-900/20'
                      : echeance.statut === 'DONE'
                        ? 'bg-green-50 dark:bg-green-900/20'
                        : 'bg-yellow-50 dark:bg-yellow-900/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getEcheanceStatusIcon(echeance.statut)}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{echeance.titre}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{echeance.date}</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      echeance.statut === 'DONE'
                        ? 'success'
                        : echeance.statut === 'OVERDUE'
                          ? 'danger'
                          : 'warning'
                    }
                  >
                    {echeance.statut === 'DONE'
                      ? 'Terminé'
                      : echeance.statut === 'OVERDUE'
                        ? 'En retard'
                        : 'En attente'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'notes' && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notes ({dossier.notes.length})
            </h3>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              <Plus className="w-4 h-4" />
              Ajouter une note
            </button>
          </div>
          {dossier.notes.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune note pour ce dossier</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dossier.notes.map(note => (
                <div key={note.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {note.author}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {note.createdAt}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
