/**
 * Composant d'affichage de l'etat RECEIVED
 * Objectif: Confirmer ce qui est recu, rien de plus
 */

import { WorkspaceReasoning } from '@/types/workspace-reasoning';
import React from 'react';
import { useToast } from '@/components/ui/Toast';
import { classifyError, createErrorFromResponse } from '@/lib/error-handler';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Loader2 } from 'lucide-react';

interface ReceivedStateViewProps {
  workspace: WorkspaceReasoning;
  onStartAnalysis: () => void;
  loading?: { extraction?: boolean; mutation?: boolean };
  onRefresh?: () => void;
}

export function ReceivedStateView({ workspace, onStartAnalysis, loading, onRefresh }: ReceivedStateViewProps) {
  const metadata = workspace.sourceMetadata ? JSON.parse(workspace.sourceMetadata) : {};
  const isLoading = loading?.extraction || loading?.mutation;
  const toast = useToast();
  
  /**
   * Extraction IA automatique
   */
  const handleAIExtraction = async () => {
    try {
      const response = await fetch(`/api/workspace-reasoning/${workspace.id}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoTransition: true }),
      });

      if (!response.ok) {
        const error = await createErrorFromResponse(response);
        throw error;
      }

      const result = await response.json();

      // Success toast with detailed feedback
      const factsCount = result.extractedFactsCount || 0;
      const confidence = Math.round((result.averageConfidence || 0) * 100);
      toast.showToast(
        ` ${factsCount} fait(s) extrait(s) avec ${confidence}% de confiance`,
        'success',
        'Extraction IA reussie'
      );

      // Rafraichir apres extraction sans recharger la page
      if (onRefresh) {
        onRefresh();
      }

    } catch (error) {
      const classified = classifyError(error);
      toast.showToast(classified.userMessage, 'error', 'echec de l\'extraction');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Titre */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900"> Nouveau dossier recu</h2>
        <p className="text-gray-600 mt-1">
          etat initial - Aucune interpretation effectuee
        </p>
      </div>
      
      {/* Source */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Source</h3>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Type:</span>
            <span className="ml-2 font-medium">{workspace.sourceType}</span>
          </div>
          
          {workspace.sourceId && (
            <div>
              <span className="text-gray-500">Reference:</span>
              <span className="ml-2 font-mono text-xs">{workspace.sourceId}</span>
            </div>
          )}
          
          <div>
            <span className="text-gray-500">Recu le:</span>
            <span className="ml-2">{new Date(workspace.createdAt).toLocaleString('fr-FR')}</span>
          </div>
          
          {metadata.from && (
            <div>
              <span className="text-gray-500">De:</span>
              <span className="ml-2">{metadata.from}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Contenu brut */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Contenu brut recu (non modifie)</h3>
        
        <div className="bg-white border border-gray-300 rounded p-4">
          <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
            {workspace.sourceRaw}
          </pre>
        </div>
      </div>
      
      {/* Metadonnees */}
      {Object.keys(metadata).length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Metadonnees</h3>
          
          <div className="space-y-1 text-sm">
            {Object.entries(metadata).map(([key, value]) => (
              <div key={key} className="flex">
                <span className="text-blue-600 font-medium w-32">{key}:</span>
                <span className="text-blue-900">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Progress Bar - Extraction IA */}
      {isLoading && (
        <div className="my-4">
          <ProgressBar 
            indeterminate 
            label="Extraction IA en cours..."
            estimatedSeconds={117}
            variant="bar"
            size="md"
          />
        </div>
      )}
      
      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          ? Aucune modification manuelle autorisee a ce stade
        </div>
        
        <div className="flex gap-3">
          {/* Extraction IA */}
          <button
            onClick={handleAIExtraction}
            disabled={isLoading}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                Extraction IA en cours...
              </>
            ) : (
              <>
                 Extraire avec IA
              </>
            )}
          </button>
          
          {/* Analyse manuelle */}
          <button
            onClick={onStartAnalysis}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
             Analyse manuelle
          </button>
        </div>
      </div>
    </div>
  );
}
