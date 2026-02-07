/**
 * Composant d'affichage de l'etat FACTS_EXTRACTED
 * Objectif: Lister uniquement des faits certains
 */

import { WorkspaceReasoning, Fact } from '@/types/workspace-reasoning';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface FactsExtractedViewProps {
  workspace: WorkspaceReasoning;
  onContinue: () => void;
  onAddFact?: (fact: Omit<Fact, 'id' | 'workspaceId' | 'createdAt'>) => void;
  loading?: { mutation?: boolean };
}

export function FactsExtractedView({
  workspace,
  onContinue,
  onAddFact,
  loading,
}: FactsExtractedViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const facts = workspace.facts || [];

  const getSourceBadge = (source: Fact['source']) => {
    const badges = {
      EXPLICIT_MESSAGE: { label: 'Message', color: 'bg-blue-100 text-blue-800' },
      METADATA: { label: 'Metadonnees', color: 'bg-gray-100 text-gray-800' },
      DOCUMENT: { label: 'Document', color: 'bg-green-100 text-green-800' },
      USER_PROVIDED: { label: 'Utilisateur', color: 'bg-purple-100 text-purple-800' },
    };
    return badges[source];
  };

  return (
    <div className="space-y-6">
      {/* Titre */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900"> Faits extraits</h2>
        <p className="text-gray-600 mt-1">Uniquement des faits certains et sources</p>
      </div>

      {/* Liste des faits */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">
            {facts.length} fait{facts.length > 1 ? 's' : ''} extrait{facts.length > 1 ? 's' : ''}
          </h3>
        </div>

        {facts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucun fait extrait automatiquement</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {facts.map(fact => {
              const sourceBadge = getSourceBadge(fact.source);

              return (
                <div key={fact.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-gray-900">{fact.label}</span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${sourceBadge.color}`}
                        >
                          {sourceBadge.label}
                        </span>
                      </div>

                      <div className="text-lg text-blue-600 font-semibold mb-2">{fact.value}</div>

                      {fact.sourceRef && (
                        <div className="text-sm text-gray-500">Source: {fact.sourceRef}</div>
                      )}

                      <div className="text-xs text-gray-400 mt-2">
                        Extrait par {fact.extractedBy} -{' '}
                        {new Date(fact.createdAt).toLocaleString('fr-FR')}
                      </div>
                    </div>

                    <div className="ml-4">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-2xl">[Check]</span>
                      </div>
                      <div className="text-xs text-center text-gray-500 mt-1">
                        {(fact.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ajouter un fait manuel */}
      {onAddFact && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-purple-900">Ajouter un fait manuel</h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              disabled={!!loading?.mutation}
              className={`text-sm ${loading?.mutation ? 'text-purple-400 cursor-not-allowed' : 'text-purple-600 hover:text-purple-800'}`}
            >
              {loading?.mutation && <Loader2 className="inline h-3 w-3 mr-1 animate-spin" />}
              {showAddForm ? 'Annuler' : ' Ajouter'}
            </button>
          </div>

          {showAddForm && (
            <div className="space-y-3 mt-4">
              <div className="bg-white p-4 rounded border border-purple-200">
                <p className="text-sm text-purple-700">
                  ? Toute modification manuelle sera tracee et necessitera une justification
                </p>
              </div>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const newFact = {
                    id: `manual-${Date.now()}`,
                    label: formData.get('label') as string,
                    value: formData.get('value') as string,
                    source: 'Manuel',
                    confidence: 1.0,
                    verified: false,
                  };
                  onFactUpdate?.(newFact.id, newFact);
                  setShowAddForm(false);
                  e.currentTarget.reset();
                }}
                className="space-y-3"
              >
                <div>
                  <label
                    htmlFor="fact-label"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Type de fait
                  </label>
                  <input
                    id="fact-label"
                    name="label"
                    type="text"
                    required
                    placeholder="Ex: Date de naissance, Nationalit�..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label
                    htmlFor="fact-value"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Valeur
                  </label>
                  <input
                    id="fact-value"
                    name="value"
                    type="text"
                    required
                    placeholder="Entrez la valeur du fait"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label
                    htmlFor="fact-justification"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Justification
                  </label>
                  <textarea
                    id="fact-justification"
                    name="justification"
                    required
                    rows={2}
                    placeholder="Expliquez pourquoi vous ajoutez ce fait manuellement"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Ajouter le fait
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          {facts.length > 0
            ? ' Faits extraits et verifies'
            : '? Aucun fait extrait - Verifiez la source'}
        </div>

        <button
          onClick={onContinue}
          disabled={facts.length === 0 || !!loading?.mutation}
          className={`px-6 py-3 font-medium rounded-lg transition-colors flex items-center gap-2 ${
            facts.length === 0 || loading?.mutation
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading?.mutation && <Loader2 className="h-4 w-4 animate-spin" />}
          Continuer [Next] Identifier le contexte
        </button>
      </div>
    </div>
  );
}
