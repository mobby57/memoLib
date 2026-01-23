/**
 * Composant d'affichage de l'état OBLIGATIONS_DEDUCED
 * Obligations conditionnelles : "SI contexte X ALORS obligation Y"
 */

import { WorkspaceReasoning, Obligation } from '@/types/workspace-reasoning';
import { Loader2 } from 'lucide-react';

interface ObligationsDeducedViewProps {
  workspace: WorkspaceReasoning;
  onMarkCritical: (obligationId: string) => void;
  onContinue: () => void;
  loading?: { mutation?: boolean };
}

export function ObligationsDeducedView({ 
  workspace, 
  onMarkCritical,
  onContinue,
  loading 
}: ObligationsDeducedViewProps) {
  const obligations = workspace.obligations || [];
  const contexts = workspace.contextHypotheses || [];
  
  // Grouper par contexte
  const obligationsByContext = obligations.reduce((acc, obligation) => {
    const contextId = obligation.contextId;
    if (!acc[contextId]) {
      acc[contextId] = [];
    }
    acc[contextId].push(obligation);
    return acc;
  }, {} as Record<string, Obligation[]>);
  
  const critical = obligations.filter(o => o.critical);
  const withDeadline = obligations.filter(o => o.deadline);
  
  const getDaysUntilDeadline = (deadline: Date) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  const getDeadlineColor = (deadline: Date) => {
    const days = getDaysUntilDeadline(deadline);
    if (days < 0) return 'text-red-700 bg-red-100';
    if (days <= 7) return 'text-red-600 bg-red-50';
    if (days <= 30) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };
  
  const renderObligation = (obligation: Obligation) => {
    const context = contexts.find(c => c.id === obligation.contextId);
    const daysUntilDeadline = obligation.deadline ? getDaysUntilDeadline(obligation.deadline) : null;
    
    return (
      <div
        key={obligation.id}
        className={`p-5 border-2 rounded-lg ${
          obligation.critical 
            ? 'border-red-400 bg-red-50' 
            : 'border-blue-300 bg-blue-50'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="text-3xl">
            {obligation.critical ? '⚠️' : '📋'}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {obligation.critical && (
                <span className="px-2 py-1 text-xs font-bold bg-red-600 text-white rounded">
                  CRITIQUE
                </span>
              )}
              {obligation.deadline && (
                <span className={`px-2 py-1 text-xs font-semibold rounded ${getDeadlineColor(obligation.deadline)}`}>
                  ⏰ {daysUntilDeadline !== null && (
                    daysUntilDeadline < 0 
                      ? `DÉPASSÉ de ${Math.abs(daysUntilDeadline)} jour${Math.abs(daysUntilDeadline) > 1 ? 's' : ''}`
                      : `${daysUntilDeadline} jour${daysUntilDeadline > 1 ? 's' : ''} restant${daysUntilDeadline > 1 ? 's' : ''}`
                  )}
                </span>
              )}
            </div>
            
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              {obligation.description}
            </h4>
            
            {/* Lien avec le contexte */}
            <div className="mb-3 p-3 bg-white border border-blue-200 rounded">
              <div className="text-sm">
                <span className="font-semibold text-blue-700">SI:</span>
                <span className="text-gray-700 ml-2">
                  {context?.description || 'Contexte inconnu'}
                </span>
              </div>
            </div>
            
            {/* Référence légale */}
            {obligation.legalRef && (
              <div className="mb-3 p-3 bg-gray-50 border border-gray-300 rounded">
                <div className="text-sm">
                  <span className="font-semibold text-gray-700">📚 Base légale:</span>
                  <span className="text-gray-600 ml-2">{obligation.legalRef}</span>
                </div>
              </div>
            )}
            
            {/* Échéance détaillée */}
            {obligation.deadline && (
              <div className="mb-3 p-3 bg-yellow-50 border border-yellow-300 rounded">
                <div className="text-sm">
                  <span className="font-semibold text-yellow-800">⏰ Échéance:</span>
                  <span className="text-yellow-700 ml-2">
                    {new Date(obligation.deadline).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex items-center gap-3 mt-4">
              {!obligation.critical && (
                <button
                  onClick={() => onMarkCritical(obligation.id)}
                  disabled={!!loading?.mutation}
                  className={`px-4 py-2 text-sm font-medium rounded transition-colors flex items-center gap-2 ${
                    loading?.mutation
                      ? 'bg-red-600/70 cursor-not-allowed text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {loading?.mutation && <Loader2 className="h-4 w-4 animate-spin" />}
                  ⚠️ Marquer comme critique
                </button>
              )}
            </div>
            
            <div className="text-xs text-gray-500 mt-3">
              Déduit par {obligation.deducedBy} • {new Date(obligation.createdAt).toLocaleString('fr-FR')}
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
        <h2 className="text-2xl font-bold text-gray-900">📋 Obligations déduites</h2>
        <p className="text-gray-600 mt-1">
          Obligations conditionnelles selon les contextes identifiés
        </p>
      </div>
      
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <div className="text-3xl text-blue-600 mb-2">📊</div>
          <div className="text-2xl font-bold text-blue-900">{obligations.length}</div>
          <div className="text-sm text-blue-700">Obligation{obligations.length > 1 ? 's' : ''} totale{obligations.length > 1 ? 's' : ''}</div>
        </div>
        
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
          <div className="text-3xl text-red-600 mb-2">⚠️</div>
          <div className="text-2xl font-bold text-red-900">{critical.length}</div>
          <div className="text-sm text-red-700">Critique{critical.length > 1 ? 's' : ''}</div>
        </div>
        
        <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
          <div className="text-3xl text-orange-600 mb-2">⏰</div>
          <div className="text-2xl font-bold text-orange-900">{withDeadline.length}</div>
          <div className="text-sm text-orange-700">Avec échéance</div>
        </div>
      </div>
      
      {/* Obligations critiques */}
      {critical.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-red-700">
            ⚠️ Obligations critiques ({critical.length})
          </h3>
          <div className="space-y-4">
            {critical.map(renderObligation)}
          </div>
        </div>
      )}
      
      {/* Autres obligations par contexte */}
      {Object.entries(obligationsByContext).map(([contextId, contextObligations]) => {
        const context = contexts.find(c => c.id === contextId);
        const nonCritical = contextObligations.filter(o => !o.critical);
        
        if (nonCritical.length === 0) return null;
        
        return (
          <div key={contextId} className="space-y-4">
            <h3 className="text-xl font-bold text-blue-700">
              📋 SI: {context?.description || 'Contexte inconnu'}
            </h3>
            <div className="space-y-4">
              {nonCritical.map(renderObligation)}
            </div>
          </div>
        );
      })}
      
      {/* Aucune obligation */}
      {obligations.length === 0 && (
        <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
          <div className="text-4xl mb-3">📋</div>
          <div className="text-gray-600">
            Aucune obligation déduite pour le moment
          </div>
        </div>
      )}
      
      {/* Avertissement méthodologique */}
      <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="text-2xl">⚠️</div>
          <div className="text-sm text-yellow-900">
            <div className="font-semibold mb-1">Attention:</div>
            <p>
              Ces obligations sont <strong>conditionnelles</strong> aux contextes identifiés. 
              Si un contexte s'avère incorrect, les obligations associées ne s'appliquent pas.
            </p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
        <div className="text-sm text-gray-600">
          {obligations.length} obligation{obligations.length > 1 ? 's' : ''} déduite{obligations.length > 1 ? 's' : ''}
          {critical.length > 0 && (
            <span className="ml-2 text-red-600 font-medium">
              • {critical.length} critique{critical.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        <button
          onClick={onContinue}
          disabled={!!loading?.mutation}
          className={`px-6 py-3 font-medium rounded-lg transition-colors flex items-center gap-2 ${
            loading?.mutation
              ? 'bg-blue-600/70 text-white cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading?.mutation && <Loader2 className="h-4 w-4 animate-spin" />}
          Continuer → Identifier les manques
        </button>
      </div>
    </div>
  );
}
