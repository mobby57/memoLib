/**
 * Orchestrateur principal du Workspace Reasoning
 * Route vers le bon composant d'etat + Timeline de progression
 */

import { useState } from 'react';
import { WorkspaceReasoning, WorkspaceState, WORKSPACE_STATES } from '@/types/workspace-reasoning';
import { ReceivedStateView } from './ReceivedStateView';
import { FactsExtractedView } from './FactsExtractedView';
import { ContextIdentifiedView } from './ContextIdentifiedView';
import { ObligationsDeducedView } from './ObligationsDeducedView';
import { MissingIdentifiedView } from './MissingIdentifiedView';
import { RiskEvaluatedView } from './RiskEvaluatedView';
import { ActionProposedView } from './ActionProposedView';
import { ReadyForHumanView } from './ReadyForHumanView';

interface WorkspaceReasoningOrchestratorProps {
  workspace: WorkspaceReasoning;
  onStateChange: (newState: WorkspaceState) => void;
  onUpdate: (updates: Partial<WorkspaceReasoning>) => void;
  loading?: { workspace?: boolean; mutation?: boolean; extraction?: boolean };
  onRefresh?: () => void;
}

export function WorkspaceReasoningOrchestrator({
  workspace,
  onStateChange,
  onUpdate,
  loading,
  onRefresh,
}: WorkspaceReasoningOrchestratorProps) {
  const [showHistory, setShowHistory] = useState(false);
  
  const currentStateIndex = Object.keys(WORKSPACE_STATES).indexOf(workspace.currentState);
  const transitions = workspace.transitions || [];
  
  // Timeline des etats
  const renderTimeline = () => {
    const states = Object.entries(WORKSPACE_STATES);
    
    return (
      <div className="relative">
        <div className="flex items-center justify-between mb-8">
          {states.map(([stateKey, stateInfo], index) => {
            const isCompleted = index < currentStateIndex;
            const isCurrent = index === currentStateIndex;
            const isPending = index > currentStateIndex;
            
            return (
              <div key={stateKey} className="flex flex-col items-center flex-1">
                {/* Ligne de connexion */}
                {index < states.length - 1 && (
                  <div className={`absolute top-6 h-1 ${
                    index < currentStateIndex 
                      ? 'bg-green-500' 
                      : index === currentStateIndex 
                      ? 'bg-blue-500' 
                      : 'bg-gray-300'
                  }`} 
                  style={{ 
                    left: `${(index / (states.length - 1)) * 100}%`,
                    width: `${100 / (states.length - 1)}%`,
                    marginLeft: index === 0 ? '50%' : '0',
                    marginRight: index === states.length - 2 ? '50%' : '0'
                  }} />
                )}
                
                {/* Badge etat */}
                <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-4 ${
                  isCompleted 
                    ? 'bg-green-500 border-green-600 text-white' 
                    : isCurrent 
                    ? 'bg-blue-500 border-blue-600 text-white animate-pulse' 
                    : 'bg-gray-200 border-gray-300 text-gray-500'
                }`}>
                  {isCompleted ? '[Check]' : stateInfo.icon}
                </div>
                
                {/* Label */}
                <div className={`mt-2 text-xs font-medium text-center ${
                  isCurrent ? 'text-blue-700 font-bold' : 'text-gray-600'
                }`}>
                  {stateInfo.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Statistiques du workspace
  const renderStats = () => {
    const facts = workspace.facts?.length || 0;
    const contexts = workspace.contextHypotheses?.filter(c => c.certaintyLevel === 'CONFIRMED').length || 0;
    const obligations = workspace.obligations?.length || 0;
    const blocking = workspace.missingElements?.filter(m => m.blocking && !m.resolved).length || 0;
    const risks = workspace.risks?.length || 0;
    const actions = workspace.proposedActions?.filter(a => !a.executed).length || 0;
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-center">
          <div className="text-2xl font-bold text-blue-700">{facts}</div>
          <div className="text-xs text-blue-600">Faits</div>
        </div>
        <div className="p-3 bg-purple-50 border border-purple-200 rounded text-center">
          <div className="text-2xl font-bold text-purple-700">{contexts}</div>
          <div className="text-xs text-purple-600">Contextes</div>
        </div>
        <div className="p-3 bg-orange-50 border border-orange-200 rounded text-center">
          <div className="text-2xl font-bold text-orange-700">{obligations}</div>
          <div className="text-xs text-orange-600">Obligations</div>
        </div>
        <div className="p-3 bg-red-50 border border-red-200 rounded text-center">
          <div className="text-2xl font-bold text-red-700">{blocking}</div>
          <div className="text-xs text-red-600">Bloquants</div>
        </div>
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-center">
          <div className="text-2xl font-bold text-yellow-700">{risks}</div>
          <div className="text-xs text-yellow-600">Risques</div>
        </div>
        <div className="p-3 bg-green-50 border border-green-200 rounded text-center">
          <div className="text-2xl font-bold text-green-700">{actions}</div>
          <div className="text-xs text-green-600">Actions</div>
        </div>
      </div>
    );
  };
  
  // Metriques
  const renderMetrics = () => {
    const uncertainty = workspace.uncertaintyLevel;
    const quality = workspace.reasoningQuality;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Incertitude</span>
            <span className={`px-3 py-1 text-sm font-bold rounded ${
              uncertainty >= 0.8 ? 'bg-red-600 text-white' :
              uncertainty >= 0.5 ? 'bg-orange-500 text-white' :
              uncertainty >= 0.3 ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'
            }`}>
              {(uncertainty * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                uncertainty >= 0.8 ? 'bg-red-600' :
                uncertainty >= 0.5 ? 'bg-orange-500' :
                uncertainty >= 0.3 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${uncertainty * 100}%` }}
            />
          </div>
        </div>
        
        <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Qualite raisonnement</span>
            <span className={`px-3 py-1 text-sm font-bold rounded ${
              quality >= 0.8 ? 'bg-green-600 text-white' :
              quality >= 0.5 ? 'bg-orange-500 text-white' : 'bg-red-600 text-white'
            }`}>
              {(quality * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                quality >= 0.8 ? 'bg-green-600' :
                quality >= 0.5 ? 'bg-orange-500' : 'bg-red-600'
              }`}
              style={{ width: `${quality * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  };
  
  // Router vers le bon composant selon l'etat
  const renderCurrentStateView = () => {
    const commonProps = {
      workspace,
      loading,
    } as const;
    
    switch (workspace.currentState) {
      case 'RECEIVED':
        return (
          <ReceivedStateView
            {...commonProps}
            onStartAnalysis={() => onStateChange('FACTS_EXTRACTED')}
            onRefresh={onRefresh}
          />
        );
        
      case 'FACTS_EXTRACTED':
        return (
          <FactsExtractedView
            {...commonProps}
            onContinue={() => onStateChange('CONTEXT_IDENTIFIED')}
            onAddFact={(fact) => {
              const newFacts = [...(workspace.facts || []), fact];
              onUpdate({ facts: newFacts });
            }}
          />
        );
        
      case 'CONTEXT_IDENTIFIED':
        return (
          <ContextIdentifiedView
            {...commonProps}
            onConfirmContext={(contextId) => {
              const updatedContexts = workspace.contextHypotheses?.map(c =>
                c.id === contextId ? { ...c, certaintyLevel: 'CONFIRMED' as const } : c
              );
              onUpdate({ contextHypotheses: updatedContexts });
            }}
            onRejectContext={(contextId) => {
              const updatedContexts = workspace.contextHypotheses?.filter(c => c.id !== contextId);
              onUpdate({ contextHypotheses: updatedContexts });
            }}
            onContinue={() => onStateChange('OBLIGATIONS_DEDUCED')}
          />
        );
        
      case 'OBLIGATIONS_DEDUCED':
        return (
          <ObligationsDeducedView
            {...commonProps}
            onMarkCritical={(obligationId) => {
              const updatedObligations = workspace.obligations?.map(o =>
                o.id === obligationId ? { ...o, critical: true } : o
              );
              onUpdate({ obligations: updatedObligations });
            }}
            onContinue={() => onStateChange('MISSING_IDENTIFIED')}
          />
        );
        
      case 'MISSING_IDENTIFIED':
        return (
          <MissingIdentifiedView
            {...commonProps}
            onGenerateAction={(missingId) => {
              // Generation automatique d'action pour resoudre le manque
              console.log('Generate action for missing:', missingId);
            }}
            onResolve={(missingId, resolution) => {
              const updatedMissing = workspace.missingElements?.map(m =>
                m.id === missingId 
                  ? { ...m, resolved: true, resolution, resolvedAt: new Date(), resolvedBy: 'USER' }
                  : m
              );
              onUpdate({ missingElements: updatedMissing });
            }}
          />
        );
        
      case 'RISK_EVALUATED':
        return (
          <RiskEvaluatedView
            {...commonProps}
            onContinue={() => onStateChange('ACTION_PROPOSED')}
          />
        );
        
      case 'ACTION_PROPOSED':
        return (
          <ActionProposedView
            {...commonProps}
            onExecute={(actionId) => {
              console.log('Execute action:', actionId);
            }}
            onMarkExecuted={(actionId) => {
              const updatedActions = workspace.proposedActions?.map(a =>
                a.id === actionId 
                  ? { ...a, executed: true, executedAt: new Date(), executedBy: 'USER' }
                  : a
              );
              onUpdate({ proposedActions: updatedActions });
            }}
            onContinue={() => onStateChange('READY_FOR_HUMAN')}
          />
        );
        
      case 'READY_FOR_HUMAN':
        return (
          <ReadyForHumanView
            {...commonProps}
            onTakeDecision={() => {
              onUpdate({ locked: true });
              console.log('Decision taken by human');
            }}
            onReject={(reason) => {
              console.log('Reasoning rejected:', reason);
            }}
          />
        );
        
      default:
        return (
          <div className="p-8 bg-gray-50 border-2 border-gray-300 rounded-lg text-center">
            <div className="text-4xl mb-3"></div>
            <div className="text-gray-700 font-semibold">
              etat inconnu: {workspace.currentState}
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* En-tete */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
             Workspace Reasoning Engine
          </h1>
          <p className="text-gray-600 mt-1">
            Raisonnement structure - etat actuel: <strong>{WORKSPACE_STATES[workspace.currentState].label}</strong>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2 text-sm font-medium bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
          >
            [emoji] {showHistory ? 'Masquer' : 'Voir'} historique
          </button>
          
          {workspace.locked && (
            <span className="px-4 py-2 text-sm font-bold bg-purple-600 text-white rounded">
               Verrouille
            </span>
          )}
        </div>
      </div>
      
      {/* Timeline */}
      <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
        {renderTimeline()}
      </div>
      
      {/* Metriques */}
      {renderMetrics()}
      
      {/* Statistiques */}
      {renderStats()}
      
      {/* Historique des transitions */}
      {showHistory && transitions.length > 0 && (
        <details open className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
          <summary className="font-semibold text-gray-900 cursor-pointer mb-3">
             Historique des transitions ({transitions.length})
          </summary>
          <div className="space-y-2">
            {transitions.map((t, index) => (
              <div key={index} className="p-3 bg-white border border-gray-200 rounded">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium">{t.fromState}</span>
                    <span className="mx-2">[Next]</span>
                    <span className="font-medium text-blue-600">{t.toState}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(t.triggeredAt).toLocaleString('fr-FR')}
                  </div>
                </div>
                {t.reason && (
                  <div className="text-xs text-gray-600 mt-1">
                    Raison: {t.reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </details>
      )}
      
      {/* Vue d'etat actuelle */}
      <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
        {renderCurrentStateView()}
      </div>
    </div>
  );
}
