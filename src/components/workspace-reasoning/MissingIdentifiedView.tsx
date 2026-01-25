/**
 * Composant d'affichage de l'etat MISSING_IDENTIFIED
 * CoeUR DU MVP - Montrer pourquoi on NE PEUT PAS agir
 */

import { WorkspaceReasoning, MissingElement } from '@/types/workspace-reasoning';
import { Loader2 } from 'lucide-react';

interface MissingIdentifiedViewProps {
  workspace: WorkspaceReasoning;
  onGenerateAction: (missingId: string) => void;
  onResolve: (missingId: string, resolution: string) => void;
  loading?: { mutation?: boolean };
}

export function MissingIdentifiedView({ workspace, onGenerateAction, onResolve, loading }: MissingIdentifiedViewProps) {
  const missingElements = workspace.missingElements || [];
  const blocking = missingElements.filter(m => m.blocking && !m.resolved);
  const nonBlocking = missingElements.filter(m => !m.blocking && !m.resolved);
  const resolved = missingElements.filter(m => m.resolved);
  
  const getTypeIcon = (type: MissingElement['type']) => {
    const icons = {
      INFORMATION: '',
      DOCUMENT: '',
      DECISION: '',
      VALIDATION: '',
      HUMAN_EXPERTISE: '',
    };
    return icons[type];
  };
  
  const getTypeBadge = (type: MissingElement['type']) => {
    const badges = {
      INFORMATION: { label: 'Information', color: 'bg-blue-100 text-blue-800' },
      DOCUMENT: { label: 'Document', color: 'bg-green-100 text-green-800' },
      DECISION: { label: 'Decision', color: 'bg-purple-100 text-purple-800' },
      VALIDATION: { label: 'Validation', color: 'bg-orange-100 text-orange-800' },
      HUMAN_EXPERTISE: { label: 'Expertise humaine', color: 'bg-red-100 text-red-800' },
    };
    return badges[type];
  };
  
  const renderMissingElement = (missing: MissingElement, isBlocking: boolean) => {
    const typeBadge = getTypeBadge(missing.type);
    const typeIcon = getTypeIcon(missing.type);
    
    return (
      <div
        key={missing.id}
        className={`p-6 border rounded-lg ${
          isBlocking 
            ? 'border-red-300 bg-red-50' 
            : 'border-yellow-300 bg-yellow-50'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="text-4xl">{typeIcon}</div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {isBlocking && (
                <span className="px-2 py-1 text-xs font-bold bg-red-600 text-white rounded">
                  [emoji] BLOQUANT
                </span>
              )}
              <span className={`px-2 py-1 text-xs font-medium rounded ${typeBadge.color}`}>
                {typeBadge.label}
              </span>
            </div>
            
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              {missing.description}
            </h4>
            
            <div className="bg-white border border-gray-300 rounded p-3 mb-3">
              <div className="text-sm text-gray-600">
                <span className="font-semibold">Pourquoi c'est manquant:</span>
                <p className="mt-1">{missing.why}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => onGenerateAction(missing.id)}
                disabled={!!loading?.mutation}
                className={`px-4 py-2 text-sm font-medium rounded transition-colors flex items-center gap-2 ${
                  loading?.mutation
                    ? `${isBlocking ? 'bg-red-600/70' : 'bg-yellow-600/70'} cursor-not-allowed text-white`
                    : `${isBlocking ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white`
                }`}
              >
                {loading?.mutation && <Loader2 className="h-4 w-4 animate-spin" />}
                [emoji] Generer action de resolution
              </button>
              
              <button
                onClick={() => {
                  const resolution = prompt('Comment avez-vous resolu ce manque ?');
                  if (resolution) {
                    onResolve(missing.id, resolution);
                  }
                }}
                disabled={!!loading?.mutation}
                className={`px-4 py-2 text-sm font-medium rounded transition-colors flex items-center gap-2 ${
                  loading?.mutation
                    ? 'bg-green-600/70 cursor-not-allowed text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {loading?.mutation && <Loader2 className="h-4 w-4 animate-spin" />}
                 Marquer comme resolu
              </button>
            </div>
            
            <div className="text-xs text-gray-500 mt-3">
              Identifie par {missing.identifiedBy} - {new Date(missing.createdAt).toLocaleString('fr-FR')}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Titre */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900"> elements manquants identifies</h2>
        <p className="text-gray-600 mt-1">
          Raisons pour lesquelles nous ne pouvons pas agir
        </p>
      </div>
      
      {/* Indicateur d'incertitude */}
      <div className={`p-4 rounded-lg border-2 ${
        workspace.uncertaintyLevel >= 0.8 
          ? 'border-red-500 bg-red-50'
          : workspace.uncertaintyLevel >= 0.5
          ? 'border-orange-500 bg-orange-50'
          : 'border-yellow-500 bg-yellow-50'
      }`}>
        <div className="flex items-center gap-3">
          <div className="text-3xl">
            {workspace.uncertaintyLevel >= 0.8 ? '' : workspace.uncertaintyLevel >= 0.5 ? '' : ''}
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              Niveau d'incertitude: {(workspace.uncertaintyLevel * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">
              {workspace.uncertaintyLevel >= 0.8 
                ? 'Action impossible - Trop de manques critiques'
                : workspace.uncertaintyLevel >= 0.5
                ? 'Action risquee - Manques significatifs'
                : 'Action possible sous conditions'
              }
            </div>
          </div>
        </div>
      </div>
      
      {/* Manques bloquants */}
      {blocking.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-red-700">
              [emoji] Manques bloquants ({blocking.length})
            </h3>
            <span className="text-sm text-gray-600">
              [Next] Empechent le passage a l'action
            </span>
          </div>
          
          <div className="space-y-4">
            {blocking.map(missing => renderMissingElement(missing, true))}
          </div>
        </div>
      )}
      
      {/* Manques non bloquants */}
      {nonBlocking.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-yellow-700">
              [emoji] Manques non bloquants ({nonBlocking.length})
            </h3>
            <span className="text-sm text-gray-600">
              [Next] Recommandes de resoudre
            </span>
          </div>
          
          <div className="space-y-4">
            {nonBlocking.map(missing => renderMissingElement(missing, false))}
          </div>
        </div>
      )}
      
      {/* Manques resolus */}
      {resolved.length > 0 && (
        <details className="bg-green-50 border border-green-200 rounded-lg p-4">
          <summary className="font-semibold text-green-900 cursor-pointer">
             Manques resolus ({resolved.length})
          </summary>
          
          <div className="mt-4 space-y-2">
            {resolved.map(missing => (
              <div key={missing.id} className="p-3 bg-white border border-green-200 rounded">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{missing.description}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Resolution: {missing.resolution}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {missing.resolvedAt && new Date(missing.resolvedAt).toLocaleString('fr-FR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
      
      {/* etat global */}
      <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
        <div>
          {blocking.length > 0 ? (
            <div className="text-red-600 font-semibold">
               Impossible de continuer - {blocking.length} manque{blocking.length > 1 ? 's' : ''} bloquant{blocking.length > 1 ? 's' : ''}
            </div>
          ) : (
            <div className="text-green-600 font-semibold">
               Tous les manques bloquants resolus - Progression possible
            </div>
          )}
        </div>
        
        <button
          disabled={blocking.length > 0}
          className={`px-6 py-3 font-medium rounded-lg transition-colors ${
            blocking.length > 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {blocking.length > 0 ? 'Resoudre les manques bloquants' : 'Continuer [Next] evaluer les risques'}
        </button>
      </div>
    </div>
  );
}
