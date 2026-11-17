'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, FileText, Calendar } from 'lucide-react';

export default function DossierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [dossier, setDossier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDossier = async () => {
      try {
        const res = await fetch(`/api/dossiers/${params.id}`);
        if (!res.ok) throw new Error('Dossier introuvable');
        const data = await res.json();
        setDossier(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchDossier();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-md">
          <p className="text-red-700 font-medium mb-4">{error}</p>
          <button onClick={() => router.push('/fr/dossiers')} className="px-4 py-2 bg-slate-900 text-white rounded-lg">
            Retour aux dossiers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/fr/dossiers')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux dossiers
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">
                {dossier?.typeDossier || 'Dossier'}
              </h1>
              <p className="text-slate-500">{dossier?.objet || 'Sans objet'}</p>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              {dossier?.statut || 'En cours'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-50 rounded-xl p-4">
              <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Numéro</span>
              <p className="font-medium text-slate-900">{dossier?.numero || 'N/A'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Créé le</span>
              <p className="font-medium text-slate-900">
                {dossier?.createdAt ? new Date(dossier.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Client</span>
              <p className="font-medium text-slate-900">
                {dossier?.clientNom ? `${dossier.clientNom} ${dossier.clientPrenom || ''}` : 'En attente'}
              </p>
            </div>
          </div>

          {dossier?.recitClient && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
              <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" /> Informations transmises par le client
              </h3>
              <p className="text-sm text-slate-700 italic">"{dossier.recitClient}"</p>
            </div>
          )}

          <div className="border-t border-slate-200 pt-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" /> Documents
            </h2>
            <p className="text-sm text-slate-500">Aucun document pour le moment.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
