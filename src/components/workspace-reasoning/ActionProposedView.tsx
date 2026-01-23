/**
 * Composant d'affichage de l'état ACTION_PROPOSED
 * Proposer UNE SEULE action utile pour réduire l'incertitude
 */

import { WorkspaceReasoning, ProposedAction } from '@/types/workspace-reasoning';
import { Loader2 } from 'lucide-react';

interface ActionProposedViewProps {
  workspace: WorkspaceReasoning;
  onExecute: (actionId: string) => void;
  onMarkExecuted: (actionId: string) => void;
  onContinue: () => void;
  loading?: { mutation?: boolean };
}

export function ActionProposedView({ 
  workspace, 
  onExecute,
  onMarkExecuted,
  onContinue,
  loading 
}: ActionProposedViewProps) {
  const actions = workspace.proposedActions || [];
  
  // Grouper par statut
  const pending = actions.filter(a => !a.executed);
  const executed = actions.filter(a => a.executed);
  
  const getTypeIcon = (type: ProposedAction['type']) => {
    const icons = {
      QUESTION: '❓',
      DOCUMENT_REQUEST: '📄',
      ALERT: '🚨',
      ESCALATION: '⬆️',
      FORM_SEND: '📝',
    };
    return icons[type];
  };
  
  const getTypeBadge = (type: ProposedAction['type']) => {
    const badges = {
      QUESTION: { label: 'Question', color: 'bg-blue-100 text-blue-800' },
      DOCUMENT_REQUEST: { label: 'Demande de document', color: 'bg-green-100 text-green-800' },
      ALERT: { label: 'Alerte', color: 'bg-red-100 text-red-800' },
      ESCALATION: { label: 'Escalade', color: 'bg-purple-100 text-purple-800' },
      FORM_SEND: { label: 'Envoi formulaire', color: 'bg-orange-100 text-orange-800' },
    };
    return badges[type];
  };
  
  const renderAction = (action: ProposedAction, isPending: boolean) => {
    const typeIcon = getTypeIcon(action.type);
    const typeBadge = getTypeBadge(action.type);
    
    return (
      <div
        key={action.id}
        className={`p-6 border-2 rounded-lg ${
          isPending 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-green-400 bg-green-50'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="text-4xl">{typeIcon}</div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-3 py-1 text-sm font-medium rounded ${typeBadge.color}`}>
                {typeBadge.label}
              </span>
              
              {action.executed && (
                <span className="px-3 py-1 text-sm font-bold bg-green-600 text-white rounded">
                  ✅ EXÉCUTÉE
                </span>
              )}
            </div>
            
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              {action.description}
            </h4>
            
            {/* Cible de l'action */}
            {action.target && (
              <div className="mb-3 p-3 bg-white border border-gray-300 rounded">
                <div className="text-sm">
                  <span className="font-semibold text-gray-700">🎯 Destinataire:</span>
                  <span className="text-gray-600 ml-2">{action.target}</span>
                </div>
              </div>
            )}
            
            {/* Raison de l'action */}
            <div className="mb-4 p-4 bg-white border-2 border-blue-300 rounded-lg">
              <div className="text-sm">
                <div className="font-semibold text-blue-700 mb-2">
                  💡 Pourquoi cette action est nécessaire:
                </div>
                <p className="text-gray-600 whitespace-pre-wrap">{action.reasoning}</p>
              </div>
            </div>
            
            {/* Actions disponibles */}
            {isPending && (
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => onExecute(action.id)}
                  disabled={!!loading?.mutation}
                  className={`px-6 py-3 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${
                    loading?.mutation
                      ? 'bg-blue-600/70 text-white cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {loading?.mutation && <Loader2 className="h-4 w-4 animate-spin" />}
                  ▶️ Exécuter cette action
                </button>
                
                <button
                  onClick={() => onMarkExecuted(action.id)}
                  disabled={!!loading?.mutation}
                  className={`px-4 py-2 text-sm font-medium rounded transition-colors flex items-center gap-2 ${
                    loading?.mutation
                      ? 'bg-green-600/70 text-white cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {loading?.mutation && <Loader2 className="h-4 w-4 animate-spin" />}
                  ✅ Marquer comme exécutée
                </button>
              </div>
            )}
            
            {/* Informations d'exécution */}
            {action.executed && action.executedAt && (
              <div className="p-3 bg-green-50 border border-green-300 rounded mb-3">
                <div className="text-sm text-green-800">
                  ✅ Exécutée le {new Date(action.executedAt).toLocaleString('fr-FR')}
                  {action.executedBy && ` par ${action.executedBy}`}
                </div>
              </div>
            )}
            
            <div className="text-xs text-gray-500 mt-3">
              Proposée par {action.proposedBy} • {new Date(action.createdAt).toLocaleString('fr-FR')}
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
        <h2 className="text-2xl font-bold text-gray-900">💡 Actions proposées</h2>
        <p className="text-gray-600 mt-1">
          Actions concrètes pour réduire l'incertitude et progresser
        </p>
      </div>
      
      {/* Principe méthodologique */}
      <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🎯</div>
          <div className="text-sm text-blue-900">
            <div className="font-semibold mb-1">Principe:</div>
            <p>
              Chaque action proposée doit avoir un <strong>objectif clair</strong>: obtenir une information manquante, 
              valider une hypothèse, ou alerter sur un risque. Pas d'action "au cas où".
            </p>
          </div>
        </div>
      </div>
      
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <div className="text-3xl text-blue-600 mb-2">📊</div>
          <div className="text-2xl font-bold text-blue-900">{actions.length}</div>
          <div className="text-sm text-blue-700">Action{actions.length > 1 ? 's' : ''} totale{actions.length > 1 ? 's' : ''}</div>
        </div>
        
        <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
          <div className="text-3xl text-orange-600 mb-2">⏳</div>
          <div className="text-2xl font-bold text-orange-900">{pending.length}</div>
          <div className="text-sm text-orange-700">En attente</div>
        </div>
        
        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
          <div className="text-3xl text-green-600 mb-2">✅</div>
          <div className="text-2xl font-bold text-green-900">{executed.length}</div>
          <div className="text-sm text-green-700">Exécutée{executed.length > 1 ? 's' : ''}</div>
        </div>
      </div>
      
      {/* Actions en attente */}
      {pending.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-blue-700">
            ⏳ Actions en attente ({pending.length})
          </h3>
          <div className="space-y-4">
            {pending.map(action => renderAction(action, true))}
          </div>
        </div>
      )}
      
      {/* Actions exécutées */}
      {executed.length > 0 && (
        <details className="bg-green-50 border border-green-200 rounded-lg p-4">
          <summary className="font-semibold text-green-900 cursor-pointer">
            ✅ Actions exécutées ({executed.length})
          </summary>
          <div className="mt-4 space-y-4">
            {executed.map(action => renderAction(action, false))}
          </div>
        </details>
      )}
      
      {/* Aucune action */}
      {actions.length === 0 && (
        <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
          <div className="text-4xl mb-3">💡</div>
          <div className="text-gray-600">
            Aucune action proposée pour le moment
          </div>
        </div>
      )}
      
      {/* Avertissement */}
      {pending.length > 0 && (
        <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div className="text-sm text-yellow-900">
              <div className="font-semibold mb-1">Attention:</div>
              <p>
                Exécuter une action ne garantit pas sa réussite. 
                Après exécution, réévaluez l'état du workspace pour voir si l'incertitude a diminué.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
        <div className="text-sm text-gray-600">
          {actions.length} action{actions.length > 1 ? 's' : ''} proposée{actions.length > 1 ? 's' : ''}
          {pending.length > 0 && (
            <span className="ml-2 text-orange-600 font-medium">
              • {pending.length} en attente
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
          Continuer → Préparer pour humain
        </button>
      </div>
    </div>
  );
}
