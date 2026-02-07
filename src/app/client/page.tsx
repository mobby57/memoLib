/**
 * Dashboard Client - Vue personnelle
 * Niveau 3 : Acces uniquement aux propres dossiers du client
 */

'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ClientDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [factures, setFactures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handlePayment = async (factureId: string) => {
    try {
      // Cr�er une session de paiement Stripe
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factureId }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la cr�ation de la session de paiement');
      }

      const { url, sessionId } = await response.json();

      if (url) {
        // Rediriger vers Stripe Checkout
        window.location.href = url;
      } else {
        alert('Session de paiement cr��e. ID: ' + sessionId);
      }
    } catch (error) {
      console.error('Erreur de paiement:', error);
      alert("Erreur lors de l'initialisation du paiement. Veuillez r�essayer.");
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (session?.user && session.user.role !== 'CLIENT') {
      router.push('/dashboard');
    } else if (session?.user?.role === 'CLIENT') {
      fetchData();
    }
  }, [session, status, router]);

  const fetchData = async () => {
    try {
      const [dossiersRes, facturesRes] = await Promise.all([
        fetch('/api/client/my-dossiers'),
        fetch('/api/client/my-factures'),
      ]);

      if (dossiersRes.ok) {
        const data = await dossiersRes.json();
        setDossiers(data.dossiers);
      }

      if (facturesRes.ok) {
        const data = await facturesRes.json();
        setFactures(data.factures);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  const dossierEnCours = dossiers.filter(d => d.statut === 'en_cours' || d.statut === 'urgent');
  const facturesEnAttente = factures.filter(f => f.statut === 'en_attente');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Mon Espace Client
              </h1>
              <p className="text-gray-600 mt-1">Suivi de vos dossiers et documents</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Bienvenue</p>
                <p className="font-semibold text-gray-900">{session?.user?.name}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                {session?.user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Boutons d'actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link
            href="/client/nouveau-dossier"
            className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all"
          >
            <span className="text-2xl"></span>
            <span>Nouveau Dossier</span>
          </Link>
          <Link
            href="/client/documents"
            className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all"
          >
            <span className="text-2xl"></span>
            <span>Mes Documents</span>
          </Link>
          <Link
            href="/client/messages"
            className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-teal-600 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all"
          >
            <span className="text-2xl"></span>
            <span>Messagerie</span>
          </Link>
          <Link
            href="/client/profil"
            className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all"
          >
            <span className="text-2xl"></span>
            <span>Mon Profil</span>
          </Link>
        </div>

        {/* Stats Rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Mes Dossiers</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{dossiers.length}</p>
                <p className="text-xs text-blue-600 mt-1">{dossierEnCours.length} en cours</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <span className="text-3xl"></span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Factures</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{factures.length}</p>
                <p className="text-xs text-orange-600 mt-1">
                  {facturesEnAttente.length} en attente
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <span className="text-3xl"></span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Documents</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {dossiers.reduce((sum, d) => sum + (d._count?.documents || 0), 0)}
                </p>
                <p className="text-xs text-purple-600 mt-1">Total</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <span className="text-3xl"></span>
              </div>
            </div>
          </div>
        </div>

        {/* Mes Dossiers */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span></span> Mes Dossiers
          </h2>

          {dossiers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Aucun dossier pour le moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dossiers.map(dossier => (
                <div
                  key={dossier.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {dossier.typeDossier}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            dossier.statut === 'urgent'
                              ? 'bg-red-100 text-red-800'
                              : dossier.statut === 'en_cours'
                                ? 'bg-blue-100 text-blue-800'
                                : dossier.statut === 'termine'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {dossier.statut}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{dossier.objet}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span> Numero: {dossier.numero}</span>
                        {dossier.dateEcheance && (
                          <span>
                            {' '}
                            echeance: {new Date(dossier.dateEcheance).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                        <span> {dossier._count?.documents || 0} documents</span>
                      </div>
                    </div>
                    <Link
                      href={`/client/dossiers/${dossier.id}`}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
                    >
                      Voir details [Next]
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mes Factures */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span></span> Mes Factures
          </h2>

          {factures.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Aucune facture pour le moment</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Numero</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Dossier</th>
                    <th className="text-right py-3 px-4 text-gray-600 font-semibold">Montant</th>
                    <th className="text-center py-3 px-4 text-gray-600 font-semibold">echeance</th>
                    <th className="text-center py-3 px-4 text-gray-600 font-semibold">Statut</th>
                    <th className="text-right py-3 px-4 text-gray-600 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {factures.map(facture => (
                    <tr key={facture.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 font-medium text-gray-900">{facture.numero}</td>
                      <td className="py-4 px-4 text-gray-600">{facture.dossier?.typeDossier}</td>
                      <td className="py-4 px-4 text-right font-semibold text-gray-900">
                        {facture.montant.toFixed(2)} {facture.devise}
                      </td>
                      <td className="py-4 px-4 text-center text-gray-600">
                        {new Date(facture.dateEcheance).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            facture.statut === 'payee'
                              ? 'bg-green-100 text-green-800'
                              : facture.statut === 'en_attente'
                                ? 'bg-orange-100 text-orange-800'
                                : facture.statut === 'en_retard'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {facture.statut}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {facture.statut === 'en_attente' && (
                          <button
                            onClick={() => handlePayment(facture.id)}
                            className="px-3 py-1 bg-green-500 text-white rounded text-sm font-semibold hover:bg-green-600"
                          >
                            Payer
                          </button>
                        )}
                        {facture.statut === 'payee' && (
                          <Link
                            href={`/api/client/factures/${facture.id}/download`}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-sm font-semibold hover:bg-blue-600 inline-block"
                          >
                            Telecharger
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
