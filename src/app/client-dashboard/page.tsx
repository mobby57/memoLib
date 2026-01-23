'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, StatCard, Badge, Breadcrumb, Alert } from '@/components/ui';
import { FileText, Clock, CheckCircle, AlertTriangle, LogOut, Bell, User, Calendar, Euro, Download, MessageSquare, Shield } from 'lucide-react';

interface ClientDashboardData {
  monDossier: {
    id: string;
    numero: string;
    typeDossier: string;
    statut: string;
    priorite: string;
    dateCreation: string;
    dateEcheance?: string;
    description?: string;
  } | null;
  mesFactures: {
    total: number;
    payees: number;
    enAttente: number;
    enRetard: number;
    prochaine?: {
      id: string;
      montant: number;
      dateEcheance: string;
    };
  };
  prochainRendezVous?: {
    id: string;
    titre: string;
    dateDebut: string;
    lieu?: string;
  };
  dernieresActivites: Array<{
    id: string;
    type: string;
    titre: string;
    date: string;
  }>;
}

export default function ClientDashboardPage() {
  const { user, isLoading, isAuthenticated, isClient } = useAuth();
  const [data, setData] = useState<ClientDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && !isClient) {
      window.location.href = '/dashboard';
      return;
    }
  }, [isAuthenticated, isClient]);

  useEffect(() => {
    if (isAuthenticated && isClient && user?.clientId) {
      loadClientData();
    }
  }, [isAuthenticated, isClient, user?.clientId]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/client/${user?.clientId}/dashboard`);
      if (response.ok) {
        const clientData = await response.json();
        setData(clientData);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Accès non autorisé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <Breadcrumb items={[{ label: 'Mon Espace Client' }]} />
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Mon Espace Personnel
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Bienvenue, {user?.name}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="info">Client</Badge>
              <Badge variant="default">{user?.tenantName}</Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5" />
            {(data?.mesFactures?.enRetard || 0) > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>

          <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Client</p>
            </div>
            <button
              onClick={() => window.location.href = '/api/auth/signout'}
              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {(data?.mesFactures?.enRetard || 0) > 0 && (
        <Alert variant="error" title="Factures en retard">
          Vous avez {data?.mesFactures?.enRetard || 0} facture(s) en retard de paiement.
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Mon Dossier"
          value={data?.monDossier ? "Actif" : "Aucun"}
          icon={FileText}
        />
        <StatCard
          title="Factures Payées"
          value={data?.mesFactures.payees || 0}
          icon={CheckCircle}
        />
        <StatCard
          title="En Attente"
          value={data?.mesFactures.enAttente || 0}
          icon={Clock}
        />
        <StatCard
          title="En Retard"
          value={data?.mesFactures.enRetard || 0}
          icon={AlertTriangle}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Mon Dossier
            </h3>
            
            {data?.monDossier ? (
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {data.monDossier.numero}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {data.monDossier.typeDossier}
                    </p>
                  </div>
                  <Badge variant="info">{data.monDossier.statut}</Badge>
                </div>
                
                {data.monDossier.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {data.monDossier.description}
                  </p>
                )}
                
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Créé le {new Date(data.monDossier.dateCreation).toLocaleDateString('fr-FR')}</span>
                  {data.monDossier.dateEcheance && (
                    <span>Échéance: {new Date(data.monDossier.dateEcheance).toLocaleDateString('fr-FR')}</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Aucun dossier en cours</p>
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Actions Rapides
            </h3>
            <div className="space-y-3">
              <Link
                href="/mes-factures"
                className="block p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Euro className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Mes Factures</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Paiements</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/contact"
                className="block p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-500 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Contacter</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Votre avocat</p>
                  </div>
                </div>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
