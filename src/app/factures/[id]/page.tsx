'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

/**
 * Page détail d'une facture
 * Affiche toutes les informations avec actions de gestion
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  FileText, ArrowLeft, User, Calendar, Euro,
  Edit, Download, Send, Printer, CheckCircle,
  Clock, AlertCircle, RefreshCw, CreditCard, Building2
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { useToast } from '@/hooks/use-toast';

interface LigneFacture {
  id: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  montantHT: number;
}

interface Facture {
  id: string;
  numero: string;
  client: {
    id: string;
    nom: string;
    email: string;
    adresse: string;
  };
  dossier?: {
    id: string;
    numero: string;
    titre: string;
  };
  lignes: LigneFacture[];
  montantHT: number;
  tauxTVA: number;
  montantTVA: number;
  montantTTC: number;
  statut: 'brouillon' | 'envoyee' | 'payee' | 'en_retard' | 'annulee';
  dateEmission: string;
  dateEcheance: string;
  datePaiement?: string;
  modePaiement?: string;
  notes?: string;
  conditions?: string;
}

const STATUT_LABELS = {
  brouillon: 'Brouillon',
  envoyee: 'Envoyée',
  payee: 'Payée',
  en_retard: 'En retard',
  annulee: 'Annulée',
};

const STATUT_COLORS: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
  brouillon: 'default',
  envoyee: 'info',
  payee: 'success',
  en_retard: 'danger',
  annulee: 'warning',
};

// Mock data
const MOCK_FACTURE: Facture = {
  id: '1',
  numero: 'FACT-2024-001',
  client: {
    id: '1',
    nom: 'SARL Martin',
    email: 'contact@sarl-martin.fr',
    adresse: '12 Rue de la Paix, 75001 Paris',
  },
  dossier: {
    id: '1',
    numero: 'DOS-2024-001',
    titre: 'Litige commercial fournisseur',
  },
  lignes: [
    { id: '1', description: 'Consultation initiale', quantite: 1, prixUnitaire: 300, montantHT: 300 },
    { id: '2', description: 'Rédaction conclusions', quantite: 4, prixUnitaire: 200, montantHT: 800 },
    { id: '3', description: 'Représentation audience', quantite: 1, prixUnitaire: 400, montantHT: 400 },
  ],
  montantHT: 1500,
  tauxTVA: 20,
  montantTVA: 300,
  montantTTC: 1800,
  statut: 'envoyee',
  dateEmission: '2024-01-05',
  dateEcheance: '2024-02-05',
  notes: 'Facture pour prestations juridiques - Dossier commercial.',
  conditions: 'Paiement sous 30 jours. Pénalités de retard : 3 fois le taux légal.',
};

export default function FactureDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const [facture, setFacture] = useState<Facture | null>(null);
  const [loading, setLoading] = useState(true);

  const factureId = params.id as string;

  useEffect(() => {
    if (factureId) {
      fetchFacture();
    }
  }, [factureId]);

  const fetchFacture = async () => {
    try {
      setLoading(true);
      // TODO: Remplacer par un appel API réel
      await new Promise(resolve => setTimeout(resolve, 500));
      setFacture({ ...MOCK_FACTURE, id: factureId });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger la facture'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const getStatusIcon = () => {
    if (!facture) return null;
    switch (facture.statut) {
      case 'payee':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'en_retard':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'envoyee':
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleSend = () => {
    if (facture && facture.statut === 'brouillon') {
      setFacture({ ...facture, statut: 'envoyee' });
      toast({
        variant: 'default',
        title: 'Facture envoyée',
        description: `La facture ${facture.numero} a été envoyée au client.`
      });
    }
  };

  const handleMarkAsPaid = () => {
    if (facture && (facture.statut === 'envoyee' || facture.statut === 'en_retard')) {
      setFacture({ 
        ...facture, 
        statut: 'payee',
        datePaiement: new Date().toISOString().split('T')[0]
      });
      toast({
        variant: 'default',
        title: 'Paiement enregistré',
        description: `La facture ${facture.numero} a été marquée comme payée.`
      });
    }
  };

  const handleSendReminder = () => {
    toast({
      variant: 'default',
      title: 'Relance envoyée',
      description: `Une relance a été envoyée pour la facture ${facture?.numero}.`
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    toast({
      variant: 'default',
      title: 'Téléchargement',
      description: 'Le PDF sera téléchargé dans quelques instants.'
    });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!facture) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Facture introuvable
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Cette facture n&apos;existe pas ou a été supprimée.
            </p>
            <Link
              href="/factures"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour aux factures
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
          { label: 'Factures', href: '/factures' },
          { label: facture.numero },
        ]}
      />

      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-4">
          <Link
            href="/factures"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {facture.numero}
              </h1>
              <Badge variant={STATUT_COLORS[facture.statut]}>
                {STATUT_LABELS[facture.statut]}
              </Badge>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Émise le {facture.dateEmission} • Échéance le {facture.dateEcheance}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {facture.statut === 'brouillon' && (
            <button
              onClick={handleSend}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Send className="w-4 h-4" />
              Envoyer
            </button>
          )}
          {(facture.statut === 'envoyee' || facture.statut === 'en_retard') && (
            <button
              onClick={handleMarkAsPaid}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              <CreditCard className="w-4 h-4" />
              Marquer payée
            </button>
          )}
          {facture.statut === 'en_retard' && (
            <button
              onClick={handleSendReminder}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <RefreshCw className="w-4 h-4" />
              Relancer
            </button>
          )}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Printer className="w-4 h-4" />
            Imprimer
          </button>
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Facture Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client & Dossier */}
          <Card>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Client</h3>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{facture.client.nom}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{facture.client.email}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{facture.client.adresse}</p>
                    <Link
                      href={`/clients/${facture.client.id}`}
                      className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                    >
                      Voir la fiche client →
                    </Link>
                  </div>
                </div>
              </div>
              {facture.dossier && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Dossier associé</h3>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{facture.dossier.numero}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{facture.dossier.titre}</p>
                      <Link
                        href={`/dossiers/${facture.dossier.id}`}
                        className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                      >
                        Voir le dossier →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Lignes de facture */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Détail des prestations
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Description</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Qté</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Prix unitaire</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Montant HT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {facture.lignes.map((ligne) => (
                    <tr key={ligne.id}>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{ligne.description}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">{ligne.quantite}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">{formatCurrency(ligne.prixUnitaire)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white text-right">{formatCurrency(ligne.montantHT)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 text-right">Total HT</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white text-right">{formatCurrency(facture.montantHT)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 text-right">TVA ({facture.tauxTVA}%)</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white text-right">{formatCurrency(facture.montantTVA)}</td>
                  </tr>
                  <tr className="bg-blue-50 dark:bg-blue-900/20">
                    <td colSpan={3} className="px-4 py-3 text-base font-bold text-gray-900 dark:text-white text-right">Total TTC</td>
                    <td className="px-4 py-3 text-lg font-bold text-blue-600 dark:text-blue-400 text-right">{formatCurrency(facture.montantTTC)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {/* Notes & Conditions */}
          {(facture.notes || facture.conditions) && (
            <Card>
              {facture.notes && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Notes</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{facture.notes}</p>
                </div>
              )}
              {facture.conditions && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Conditions de paiement</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{facture.conditions}</p>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Statut
            </h3>
            <div className="flex items-center gap-3 mb-4">
              {getStatusIcon()}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {STATUT_LABELS[facture.statut]}
                </p>
                {facture.statut === 'payee' && facture.datePaiement && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Payée le {facture.datePaiement}
                  </p>
                )}
                {facture.statut === 'en_retard' && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Échéance dépassée depuis le {facture.dateEcheance}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Montants */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Montants
            </h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">Total HT</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(facture.montantHT)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">TVA ({facture.tauxTVA}%)</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(facture.montantTVA)}</dd>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <dt className="text-base font-bold text-gray-900 dark:text-white">Total TTC</dt>
                <dd className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(facture.montantTTC)}</dd>
              </div>
            </dl>
          </Card>

          {/* Dates */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Dates
            </h3>
            <dl className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">Émission</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">{facture.dateEmission}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">Échéance</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">{facture.dateEcheance}</dd>
                </div>
              </div>
              {facture.datePaiement && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400">Paiement</dt>
                    <dd className="text-sm font-medium text-green-600 dark:text-green-400">{facture.datePaiement}</dd>
                  </div>
                </div>
              )}
            </dl>
          </Card>

          {/* Actions */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => router.push(`/factures/${facture.id}/edit`)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Edit className="w-4 h-4" />
                Modifier
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Êtes-vous sûr de vouloir dupliquer cette facture ?')) {
                    toast({
                      variant: 'default',
                      title: 'Facture dupliquée',
                      description: 'Une nouvelle facture a été créée.'
                    });
                  }
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <FileText className="w-4 h-4" />
                Dupliquer
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
