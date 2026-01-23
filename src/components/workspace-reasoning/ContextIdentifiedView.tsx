/**
 * Composant d'affichage de l'état CONTEXT_IDENTIFIED
 * Présenter des cadres possibles, jamais une vérité
 */

import { WorkspaceReasoning, ContextHypothesis } from '@/types/workspace-reasoning';
import { Loader2 } from 'lucide-react';

interface ContextIdentifiedViewProps {
  workspace: WorkspaceReasoning;
  onConfirmContext: (contextId: string) => void;
  onRejectContext: (contextId: string) => void;
  onContinue: () => void;
  loading?: { mutation?: boolean };
}

export function ContextIdentifiedView({ 
  workspace, 
  onConfirmContext, 
  onRejectContext,
  onContinue,
  loading
}: ContextIdentifiedViewProps) {
  const contexts = workspace.contextHypotheses || [];
  const confirmed = contexts.filter(c => c.certaintyLevel === 'CONFIRMED');
  const probable = contexts.filter(c => c.certaintyLevel === 'PROBABLE');
  const possible = contexts.filter(c => c.certaintyLevel === 'POSSIBLE');
  
  const getTypeIcon = (type: ContextHypothesis['type']) => {
    const icons = {
      LEGAL: '⚖️',
      ADMINISTRATIVE: '🏛️',
      PROCEDURAL: '📋',
      TEMPORAL: '⏰',
      RELATIONAL: '🤝',
    };
    return icons[type];
  };
  
  const getTypeBadge = (type: ContextHypothesis['type']) => {
    const badges = {
      LEGAL: { label: 'Juridique', color: 'bg-blue-100 text-blue-800' },
      ADMINISTRATIVE: { label: 'Administratif', color: 'bg-purple-100 text-purple-800' },
      PROCEDURAL: { label: 'Procédural', color: 'bg-green-100 text-green-800' },
      TEMPORAL: { label: 'Temporel', color: 'bg-orange-100 text-orange-800' },
      RELATIONAL: { label: 'Relationnel', color: 'bg-pink-100 text-pink-800' },
    };
    return badges[type];
  };
  
  const getCertaintyBadge = (level: ContextHypothesis['certaintyLevel']) => {
    const badges = {
      POSSIBLE: { 
        label: 'Possible', 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: '💭'
      },
      PROBABLE: { 
        label: 'Probable', 
        color: 'bg-orange-100 text-orange-800 border-orange-300',
        icon: '🔍'
      },
      CONFIRMED: { 
        label: 'Confirmé', 
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: '✅'
      },
    };
    return badges[level];
  };
  
  const renderContext = (context: ContextHypothesis) => {
    const typeBadge = getTypeBadge(context.type);
    const certaintyBadge = getCertaintyBadge(context.certaintyLevel);
    const typeIcon = getTypeIcon(context.type);
    
    return (
      <div
        key={context.id}
        className={`p-6 border-2 rounded-lg ${certaintyBadge.color}`}
      >
        <div className="flex items-start gap-4">
          <div className="text-4xl">{typeIcon}</div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-3 py-1 text-sm font-semibold rounded border-2 ${certaintyBadge.color}`}>
                {certaintyBadge.icon} {certaintyBadge.label}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded ${typeBadge.color}`}>
                {typeBadge.label}
              </span>
            </div>
            
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              {context.description}
            </h4>
            
            <div className="bg-white border border-gray-300 rounded-lg p-4 mb-4">
              <div className="text-sm">
                <div className="font-semibold text-gray-700 mb-2">
                  💡 Raisonnement qui a conduit à cette hypothèse:
                </div>
                <p className="text-gray-600 whitespace-pre-wrap">{context.reasoning}</p>
              </div>
            </div>
            
            {context.certaintyLevel !== 'CONFIRMED' && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onConfirmContext(context.id)}
                  disabled={!!loading?.mutation}
                  className={`px-4 py-2 text-sm font-medium rounded transition-colors flex items-center gap-2 ${
                    loading?.mutation
                      ? 'bg-green-600/70 cursor-not-allowed text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {loading?.mutation && <Loader2 className="h-4 w-4 animate-spin" />}
                  ✅ Confirmer ce contexte
                </button>
                
                <button
                  onClick={() => onRejectContext(context.id)}
                  disabled={!!loading?.mutation}
                  className={`px-4 py-2 text-sm font-medium rounded transition-colors flex items-center gap-2 ${
                    loading?.mutation
                      ? 'bg-red-600/70 cursor-not-allowed text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {loading?.mutation && <Loader2 className="h-4 w-4 animate-spin" />}
                  ❌ Rejeter ce contexte
                </button>
              </div>
            )}
            
            {context.certaintyLevel === 'CONFIRMED' && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded font-medium">
                ✅ Contexte confirmé
              </div>
            )}
            
            <div className="text-xs text-gray-500 mt-3">
              Identifié par {context.identifiedBy} • {new Date(context.createdAt).toLocaleString('fr-FR')}
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
        <h2 className="text-2xl font-bold text-gray-900">🔍 Contextes identifiés</h2>
        <p className="text-gray-600 mt-1">
          Cadres d'interprétation possibles - Aucune vérité absolue
        </p>
      </div>
      
      {/* Avertissement méthodologique */}
      <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div className="text-sm text-blue-900">
            <div className="font-semibold mb-1">Principe méthodologique:</div>
            <p>
              Ces contextes sont des <strong>hypothèses de travail</strong>, pas des vérités. 
              Un contexte "Confirmé" signifie seulement qu'il est cohérent avec les faits connus, 
              pas qu'il est absolument vrai.
            </p>
          </div>
        </div>
      </div>
      
      {/* Contextes confirmés */}
      {confirmed.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-green-700">
            ✅ Contextes confirmés ({confirmed.length})
          </h3>
          <div className="space-y-4">
            {confirmed.map(renderContext)}
          </div>
        </div>
      )}
      
      {/* Contextes probables */}
      {probable.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-orange-700">
            🔍 Contextes probables ({probable.length})
          </h3>
          <div className="space-y-4">
            {probable.map(renderContext)}
          </div>
        </div>
      )}
      
      {/* Contextes possibles */}
      {possible.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-yellow-700">
            💭 Contextes possibles ({possible.length})
          </h3>
          <div className="space-y-4">
            {possible.map(renderContext)}
          </div>
        </div>
      )}
      
      {/* Aucun contexte */}
      {contexts.length === 0 && (
        <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
          <div className="text-4xl mb-3">🤔</div>
          <div className="text-gray-600">
            Aucun contexte identifié pour le moment
          </div>
        </div>
      )}
      
      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
        <div className="text-sm text-gray-600">
          {contexts.length} contexte{contexts.length > 1 ? 's' : ''} identifié{contexts.length > 1 ? 's' : ''}
          {confirmed.length > 0 && (
            <span className="ml-2 text-green-600 font-medium">
              • {confirmed.length} confirmé{confirmed.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        <button
          onClick={onContinue}
          disabled={confirmed.length === 0 || !!loading?.mutation}
          className={`px-6 py-3 font-medium rounded-lg transition-colors flex items-center gap-2 ${
            confirmed.length === 0 || loading?.mutation
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading?.mutation && <Loader2 className="h-4 w-4 animate-spin" />}
          {confirmed.length === 0 
            ? 'Confirmez au moins un contexte pour continuer'
            : 'Continuer → Déduire les obligations'
          }
        </button>
      </div>
    </div>
  );
}
