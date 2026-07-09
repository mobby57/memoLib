'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FileText, User, Calendar, CheckCircle, ArrowRight } from 'lucide-react';

/**
 * Formulaire rapide de création de dossier — 3 champs seulement
 * Pour l'avocat qui veut créer un dossier en 30 secondes
 */
export default function NouveauDossierRapide() {
  const pathname = usePathname() ?? '';
  const locale = pathname.split('/')[1] || 'fr';
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    clientNom: '',
    typeDossier: '',
    dateEcheance: '',
  });

  const types = [
    { value: 'TITRE_SEJOUR', label: 'Titre de séjour' },
    { value: 'OQTF', label: 'OQTF' },
    { value: 'ASILE', label: 'Asile' },
    { value: 'NATURALISATION', label: 'Naturalisation' },
    { value: 'REGROUPEMENT_FAMILIAL', label: 'Regroupement familial' },
    { value: 'CONTENTIEUX', label: 'Contentieux' },
    { value: 'DROIT_TRAVAIL', label: 'Droit du travail' },
    { value: 'DROIT_FAMILLE', label: 'Droit de la famille' },
    { value: 'COMMERCIAL', label: 'Commercial' },
    { value: 'AUTRE', label: 'Autre' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientNom || !form.typeDossier) {
      setError('Nom du client et type de dossier requis');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/dossiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: form.clientNom,
          typeDossier: form.typeDossier,
          dateEcheance: form.dateEcheance || undefined,
          objet: `${form.typeDossier} - ${form.clientNom}`,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur création dossier');
      }

      setSuccess(true);
      setTimeout(() => router.push(`/${locale}/dossiers`), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Dossier créé !</h2>
          <p className="text-gray-500">Redirection vers vos dossiers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau dossier</h1>
          <p className="text-gray-500 mt-1">3 champs, 30 secondes</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Client */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
              <User className="w-4 h-4 inline mr-1.5" />
              Nom du client *
            </label>
            <input
              type="text"
              value={form.clientNom}
              onChange={(e) => setForm({ ...form, clientNom: e.target.value })}
              placeholder="M. Dupont, Mme Traoré..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              autoFocus
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
              <FileText className="w-4 h-4 inline mr-1.5" />
              Type de dossier *
            </label>
            <select
              value={form.typeDossier}
              onChange={(e) => setForm({ ...form, typeDossier: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="">Sélectionner...</option>
              {types.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Échéance */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
              <Calendar className="w-4 h-4 inline mr-1.5" />
              Date d&apos;échéance (optionnel)
            </label>
            <input
              type="date"
              value={form.dateEcheance}
              onChange={(e) => setForm({ ...form, dateEcheance: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer le dossier'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Vous pourrez compléter les détails plus tard
        </p>
      </div>
    </div>
  );
}
