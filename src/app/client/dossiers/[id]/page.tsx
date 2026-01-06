'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Document {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  description?: string;
}

interface Echeance {
  id: string;
  titre: string;
  dateEcheance: string;
  priorite: string;
  statut: string;
  description?: string;
}

interface Dossier {
  id: string;
  numero: string;
  typeDossier: string;
  objet?: string;
  description?: string;
  statut: string;
  priorite: string;
  dateCreation: string;
  dateEcheance?: string;
  articleCeseda?: string;
  notes?: string;
  documents?: Document[];
  echeances?: Echeance[];
  client?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function DossierDetailsClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const dossierId = params.id as string;

  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'infos' | 'documents' | 'echeances' | 'timeline'>('infos');
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (session?.user && session.user.role !== 'CLIENT') {
      router.push('/dashboard');
    } else if (session?.user?.role === 'CLIENT') {
      fetchDossier();
    }
  }, [session, status, router, dossierId]);

  const fetchDossier = async () => {
    try {
      const res = await fetch(`/api/client/dossiers/${dossierId}`);
      
      if (!res.ok) {
        if (res.status === 403) {
          setError('Vous n\'avez pas accès à ce dossier');
        } else if (res.status === 404) {
          setError('Dossier non trouvé');
        } else {
          setError('Erreur lors du chargement du dossier');
        }
        setLoading(false);
        return;
      }

      const data = await res.json();
      setDossier(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dossier:', err);
      setError('Erreur de connexion');
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dossierId', dossierId);
    formData.append('description', 'Document téléversé par le client');

    try {
      const res = await fetch('/api/client/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        await fetchDossier(); // Refresh
        alert('Document téléversé avec succès !');
      } else {
        alert('Erreur lors du téléversement');
      }
    } catch (err) {
      alert('Erreur de connexion');
    } finally {
      setUploadingDoc(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'en_cours': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'termine': return 'bg-green-100 text-green-800 border-green-300';
      case 'archive': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPrioriteColor = (priorite: string) => {
    switch (priorite) {
      case 'critique': return 'bg-red-500 text-white';
      case 'haute': return 'bg-orange-500 text-white';
      case 'normale': return 'bg-blue-500 text-white';
      case 'basse': return 'bg-gray-400 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du dossier...</p>
        </div>
      </div>
    );
  }

  if (error || !dossier) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/client"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/client"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl">←</span>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {dossier.typeDossier}
                </h1>
                <p className="text-gray-600 mt-1">Dossier {dossier.numero}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatutColor(dossier.statut)}`}>
                {dossier.statut.replace('_', ' ').toUpperCase()}
              </span>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getPrioriteColor(dossier.priorite)}`}>
                Priorité: {dossier.priorite}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('infos')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'infos'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              📋 Informations
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'documents'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              📄 Documents ({dossier.documents?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('echeances')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'echeances'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              ⏰ Échéances ({dossier.echeances?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'timeline'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              📅 Timeline
            </button>
          </div>

          <div className="p-8">
            {/* Tab: Informations */}
            {activeTab === 'infos' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase">Type de Dossier</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{dossier.typeDossier}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase">Numéro</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{dossier.numero}</p>
                  </div>
                  {dossier.articleCeseda && (
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase">Article CESEDA</label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{dossier.articleCeseda}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase">Date de Création</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {new Date(dossier.dateCreation).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  {dossier.dateEcheance && (
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase">Date d'Échéance</label>
                      <p className="text-lg font-semibold text-red-600 mt-1">
                        {new Date(dossier.dateEcheance).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  )}
                </div>

                {dossier.objet && (
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase">Objet</label>
                    <p className="text-gray-900 mt-2">{dossier.objet}</p>
                  </div>
                )}

                {dossier.description && (
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase">Description</label>
                    <p className="text-gray-700 mt-2 leading-relaxed">{dossier.description}</p>
                  </div>
                )}

                {dossier.notes && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                    <label className="text-sm font-semibold text-yellow-800 uppercase">Notes</label>
                    <p className="text-yellow-900 mt-2">{dossier.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Documents */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Documents du dossier</h3>
                  <div>
                    <label className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors">
                      <span>📤</span>
                      {uploadingDoc ? 'Téléversement...' : 'Ajouter un document'}
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploadingDoc}
                      />
                    </label>
                  </div>
                </div>

                {!dossier.documents || dossier.documents.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <span className="text-6xl mb-4 block">📄</span>
                    <p className="text-gray-500 text-lg">Aucun document pour ce dossier</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dossier.documents.map((doc) => (
                      <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="bg-blue-100 p-3 rounded-lg">
                              <span className="text-2xl">📄</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{doc.originalName}</h4>
                              {doc.description && (
                                <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <span>{formatBytes(doc.sizeBytes)}</span>
                                <span>•</span>
                                <span>{new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}</span>
                              </div>
                            </div>
                          </div>
                          <a
                            href={`/api/client/documents/${doc.id}/download`}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold transition-colors"
                            download
                          >
                            Télécharger
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Échéances */}
            {activeTab === 'echeances' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Échéances et délais</h3>

                {!dossier.echeances || dossier.echeances.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <span className="text-6xl mb-4 block">⏰</span>
                    <p className="text-gray-500 text-lg">Aucune échéance enregistrée</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dossier.echeances.map((echeance) => (
                      <div key={echeance.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-gray-900">{echeance.titre}</h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPrioriteColor(echeance.priorite)}`}>
                                {echeance.priorite}
                              </span>
                            </div>
                            {echeance.description && (
                              <p className="text-gray-600 mb-3">{echeance.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-gray-500">
                                📅 {new Date(echeance.dateEcheance).toLocaleDateString('fr-FR')}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                echeance.statut === 'respectee' ? 'bg-green-100 text-green-800' :
                                echeance.statut === 'en_attente' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {echeance.statut}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Timeline */}
            {activeTab === 'timeline' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Historique du dossier</h3>
                
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  
                  <div className="space-y-6">
                    <div className="relative pl-12">
                      <div className="absolute left-0 top-1 bg-blue-500 rounded-full p-2">
                        <span className="text-white text-sm">📁</span>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">Dossier créé</h4>
                          <span className="text-sm text-gray-500">
                            {new Date(dossier.dateCreation).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-gray-600">Le dossier {dossier.numero} a été ouvert</p>
                      </div>
                    </div>

                    {dossier.documents && dossier.documents.map((doc) => (
                      <div key={doc.id} className="relative pl-12">
                        <div className="absolute left-0 top-1 bg-green-500 rounded-full p-2">
                          <span className="text-white text-sm">📄</span>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">Document ajouté</h4>
                            <span className="text-sm text-gray-500">
                              {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <p className="text-gray-600">{doc.originalName}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <span className="text-2xl">💬</span>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Contacter mon avocat</div>
                <div className="text-sm text-gray-500">Envoyer un message</div>
              </div>
            </button>
            <button className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <span className="text-2xl">📤</span>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Ajouter des documents</div>
                <div className="text-sm text-gray-500">Téléverser des fichiers</div>
              </div>
            </button>
            <button className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <span className="text-2xl">🔔</span>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Notifications</div>
                <div className="text-sm text-gray-500">Gérer les alertes</div>
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
