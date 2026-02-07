'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

/**
 * ?? Nouveau Workspace - Creation d'un espace de raisonnement
 * Formulaire intelligent pour initialiser un workspace depuis differentes sources
 */

import { AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type SourceType = 'EMAIL' | 'FORM' | 'PHONE' | 'COURRIER' | 'MANUAL';

const SOURCE_TYPE_CONFIG = {
  EMAIL: {
    icon: '',
    label: 'Email',
    description: 'Creer depuis un email recu',
  },
  FORM: {
    icon: '',
    label: 'Formulaire',
    description: 'Creer depuis une soumission de formulaire',
  },
  PHONE: {
    icon: '',
    label: 'Telephone',
    description: 'Creer depuis un appel telephonique',
  },
  COURRIER: {
    icon: '?',
    label: 'Courrier',
    description: 'Creer depuis un courrier postal',
  },
  MANUAL: {
    icon: '?',
    label: 'Manuel',
    description: 'Creer manuellement un workspace',
  },
};

const PROCEDURE_TYPES = [
  { value: 'OQTF', label: 'OQTF - Obligation de Quitter le Territoire' },
  { value: 'REFUS_TITRE', label: 'Refus de Titre de Sejour' },
  { value: 'RETRAIT_TITRE', label: 'Retrait de Titre de Sejour' },
  { value: 'NATURALISATION', label: 'Naturalisation' },
  { value: 'REGROUPEMENT_FAMILIAL', label: 'Regroupement Familial' },
  { value: 'ASILE', label: "Demande d'Asile" },
  { value: 'AUTRE', label: 'Autre procedure CESEDA' },
];

export default function NewWorkspacePage() {
  const router = useRouter();
  const [sourceType, setSourceType] = useState<SourceType>('EMAIL');
  const [sourceRaw, setSourceRaw] = useState('');
  const [procedureType, setProcedureType] = useState('OQTF');
  const [sourceMetadata, setSourceMetadata] = useState({
    from: '',
    subject: '',
    receivedDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!sourceRaw.trim()) {
      setError('Le contenu source est requis');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/lawyer/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reasoning',
          sourceType,
          sourceRaw,
          sourceMetadata: JSON.stringify(sourceMetadata),
          procedureType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur de creation');
      }

      // Rediriger vers le workspace cree
      router.push(`/lawyer/workspace/${data.workspace.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de creation');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </button>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <span className="text-4xl"></span>
            Nouveau Workspace de Raisonnement
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Creez un espace de raisonnement pour analyser intelligemment une situation juridique
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800">Erreur</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Source Type */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Type de Source
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(SOURCE_TYPE_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSourceType(key as SourceType)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    sourceType === key
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{config.icon}</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{config.label}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {config.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Source Metadata (si EMAIL) */}
          {sourceType === 'EMAIL' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Metadonnees Email
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    De (expediteur)
                  </label>
                  <input
                    type="email"
                    value={sourceMetadata.from}
                    onChange={e => setSourceMetadata({ ...sourceMetadata, from: e.target.value })}
                    placeholder="client@example.com"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Objet
                  </label>
                  <input
                    type="text"
                    value={sourceMetadata.subject}
                    onChange={e =>
                      setSourceMetadata({ ...sourceMetadata, subject: e.target.value })
                    }
                    placeholder="Demande d'assistance juridique..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Source Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Contenu Source *
            </label>
            <textarea
              value={sourceRaw}
              onChange={e => setSourceRaw(e.target.value)}
              placeholder={`Collez ici le contenu du ${SOURCE_TYPE_CONFIG[sourceType].label.toLowerCase()}...\n\nExemple:\nBonjour Maitre,\n\nJe vous contacte car j'ai recu une OQTF il y a 3 jours. Je suis en France depuis 5 ans avec ma famille...`}
              rows={12}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Le moteur d'IA analysera ce texte pour extraire les faits, identifier le contexte et
              deduire les obligations juridiques.
            </p>
          </div>

          {/* Procedure Type */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Type de Procedure CESEDA (optionnel)
            </label>
            <select
              value={procedureType}
              onChange={e => setProcedureType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">-- Non specifie --</option>
              {PROCEDURE_TYPES.map(proc => (
                <option key={proc.value} value={proc.value}>
                  {proc.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Le syst�me peut d�tecter automatiquement le type de proc�dure, mais vous pouvez le
              sp�cifier.
            </p>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={loading || !sourceRaw.trim()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Creation en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Creer le Workspace
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
