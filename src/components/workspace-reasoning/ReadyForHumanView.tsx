/**
 * Composant d'affichage de l'etat READY_FOR_HUMAN
 * Synthese executive + Handoff a l'humain
 */

import { WorkspaceReasoning } from '@/types/workspace-reasoning';
import { Loader2 } from 'lucide-react';

interface ReadyForHumanViewProps {
  workspace: WorkspaceReasoning;
  onTakeDecision: () => void;
  onReject: (reason: string) => void;
  loading?: { mutation?: boolean };
}

export function ReadyForHumanView({ 
  workspace, 
  onTakeDecision,
  onReject,
  loading 
}: ReadyForHumanViewProps) {
  const facts = workspace.facts || [];
  const contexts = workspace.contextHypotheses?.filter(c => c.certaintyLevel === 'CONFIRMED') || [];
  const obligations = workspace.obligations || [];
  const criticalObligations = obligations.filter(o => o.critical);
  const missingElements = workspace.missingElements || [];
  const blockingMissing = missingElements.filter(m => m.blocking && !m.resolved);
  const risks = workspace.risks || [];
  const criticalRisks = risks.filter(r => r.riskScore >= 6);
  const actions = workspace.proposedActions || [];
  const pendingActions = actions.filter(a => !a.executed);
  
  const uncertaintyLevel = workspace.uncertaintyLevel;
  const reasoningQuality = workspace.reasoningQuality;
  
  const getUncertaintyColor = (level: number) => {
    if (level >= 0.8) return 'bg-red-600 text-white';
    if (level >= 0.5) return 'bg-orange-500 text-white';
    if (level >= 0.3) return 'bg-yellow-500 text-white';
    return 'bg-green-500 text-white';
  };
  
  const getQualityColor = (quality: number) => {
    if (quality >= 0.8) return 'bg-green-600 text-white';
    if (quality >= 0.5) return 'bg-orange-500 text-white';
    return 'bg-red-600 text-white';
  };
  
  const getRecommendation = () => {
    if (blockingMissing.length > 0) {
      return {
        icon: '[emoji]',
        title: 'ACTION IMPOSSIBLE',
        message: `${blockingMissing.length} element${blockingMissing.length > 1 ? 's' : ''} bloquant${blockingMissing.length > 1 ? 's' : ''} non resolu${blockingMissing.length > 1 ? 's' : ''}. Toute action serait prematuree et dangereuse.`,
        color: 'border-red-500 bg-red-50',
        canAct: false
      };
    }
    
    if (uncertaintyLevel >= 0.8) {
      return {
        icon: '[emoji]',
        title: 'ACTION DeCONSEILLeE',
        message: `Niveau d'incertitude tres eleve (${(uncertaintyLevel * 100).toFixed(0)}%). Risques majeurs non maitrises.`,
        color: 'border-red-500 bg-red-50',
        canAct: false
      };
    }
    
    if (uncertaintyLevel >= 0.5) {
      return {
        icon: '[emoji]',
        title: 'ACTION RISQUeE',
        message: `Niveau d'incertitude modere (${(uncertaintyLevel * 100).toFixed(0)}%). Validation humaine renforcee requise.`,
        color: 'border-orange-500 bg-orange-50',
        canAct: true
      };
    }
    
    return {
      icon: '[emoji]',
      title: 'ACTION POSSIBLE',
      message: `Niveau d'incertitude acceptable (${(uncertaintyLevel * 100).toFixed(0)}%). Situation suffisamment claire pour agir.`,
      color: 'border-green-500 bg-green-50',
      canAct: true
    };
  };
  
  const recommendation = getRecommendation();
  
  return (
    <div className="space-y-6">
      {/* Titre */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">🎯 Pret pour decision humaine</h2>
        <p className="text-gray-600 mt-1">
          Synthese du raisonnement et recommandation
        </p>
      </div>
      
      {/* Metriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 border-2 border-gray-300 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">Niveau d'incertitude</span>
            <span className={`px-3 py-1 text-sm font-bold rounded ${getUncertaintyColor(uncertaintyLevel)}`}>
              {(uncertaintyLevel * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all ${
                uncertaintyLevel >= 0.8 ? 'bg-red-600' : 
                uncertaintyLevel >= 0.5 ? 'bg-orange-500' :
                uncertaintyLevel >= 0.3 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${uncertaintyLevel * 100}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Plus bas = meilleur
          </div>
        </div>
        
        <div className="p-6 border-2 border-gray-300 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">Qualite du raisonnement</span>
            <span className={`px-3 py-1 text-sm font-bold rounded ${getQualityColor(reasoningQuality)}`}>
              {(reasoningQuality * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all ${
                reasoningQuality >= 0.8 ? 'bg-green-600' : 
                reasoningQuality >= 0.5 ? 'bg-orange-500' : 'bg-red-600'
              }`}
              style={{ width: `${reasoningQuality * 100}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Plus haut = meilleur
          </div>
        </div>
      </div>
      
      {/* Recommandation principale */}
      <div className={`p-6 border-4 rounded-lg ${recommendation.color}`}>
        <div className="flex items-start gap-4">
          <div className="text-5xl">{recommendation.icon}</div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {recommendation.title}
            </h3>
            <p className="text-lg text-gray-700">
              {recommendation.message}
            </p>
          </div>
        </div>
      </div>
      
      {/* Resume executif */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg text-center">
          <div className="text-3xl mb-2"></div>
          <div className="text-2xl font-bold text-blue-900">{facts.length}</div>
          <div className="text-sm text-blue-700">Fait{facts.length > 1 ? 's' : ''} certain{facts.length > 1 ? 's' : ''}</div>
        </div>
        
        <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg text-center">
          <div className="text-3xl mb-2">[emoji]</div>
          <div className="text-2xl font-bold text-purple-900">{contexts.length}</div>
          <div className="text-sm text-purple-700">Contexte{contexts.length > 1 ? 's' : ''} confirme{contexts.length > 1 ? 's' : ''}</div>
        </div>
        
        <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg text-center">
          <div className="text-3xl mb-2">[emoji]</div>
          <div className="text-2xl font-bold text-orange-900">{obligations.length}</div>
          <div className="text-sm text-orange-700">Obligation{obligations.length > 1 ? 's' : ''}</div>
        </div>
        
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg text-center">
          <div className="text-3xl mb-2">️</div>
          <div className="text-2xl font-bold text-red-900">{risks.length}</div>
          <div className="text-sm text-red-700">Risque{risks.length > 1 ? 's' : ''}</div>
        </div>
      </div>
      
      {/* Points d'alerte */}
      {(blockingMissing.length > 0 || criticalRisks.length > 0 || criticalObligations.length > 0) && (
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-red-700">[emoji] Points d'alerte critiques</h3>
          
          {blockingMissing.length > 0 && (
            <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
              <div className="font-semibold text-red-900 mb-2">
                 {blockingMissing.length} element{blockingMissing.length > 1 ? 's' : ''} bloquant{blockingMissing.length > 1 ? 's' : ''}:
              </div>
              <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                {blockingMissing.map(m => (
                  <li key={m.id}>{m.description}</li>
                ))}
              </ul>
            </div>
          )}
          
          {criticalRisks.length > 0 && (
            <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
              <div className="font-semibold text-red-900 mb-2">
                [emoji] {criticalRisks.length} risque{criticalRisks.length > 1 ? 's' : ''} critique{criticalRisks.length > 1 ? 's' : ''}:
              </div>
              <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                {criticalRisks.map(r => (
                  <li key={r.id}>{r.description} (Score: {r.riskScore}/9)</li>
                ))}
              </ul>
            </div>
          )}
          
          {criticalObligations.length > 0 && (
            <div className="p-4 bg-orange-50 border-2 border-orange-300 rounded-lg">
              <div className="font-semibold text-orange-900 mb-2">
                ️ {criticalObligations.length} obligation{criticalObligations.length > 1 ? 's' : ''} critique{criticalObligations.length > 1 ? 's' : ''}:
              </div>
              <ul className="list-disc list-inside text-sm text-orange-800 space-y-1">
                {criticalObligations.map(o => (
                  <li key={o.id}>
                    {o.description}
                    {o.deadline && ` (echeance: ${new Date(o.deadline).toLocaleDateString('fr-FR')})`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {/* Actions recommandees */}
      {pendingActions.length > 0 && (
        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <div className="font-semibold text-blue-900 mb-2">
            [emoji] {pendingActions.length} action{pendingActions.length > 1 ? 's' : ''} recommandee{pendingActions.length > 1 ? 's' : ''}:
          </div>
          <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
            {pendingActions.map(a => (
              <li key={a.id}>{a.description}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Avertissement methodologique */}
      <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="text-2xl">️</div>
          <div className="text-sm text-purple-900">
            <div className="font-semibold mb-1">Rappel important:</div>
            <p>
              Cette synthese est une <strong>aide a la decision</strong>, pas une decision. 
              L'IA a structure le raisonnement, identifie les incertitudes et les risques. 
              <strong> C'est a l'humain de decider</strong> en fonction de son expertise juridique et du contexte complet.
            </p>
          </div>
        </div>
      </div>
      
      {/* Actions humaines */}
      <div className="flex items-center gap-4 pt-4 border-t-2 border-gray-200">
        <button
          onClick={() => {
            const reason = prompt('Pourquoi rejetez-vous ce raisonnement ?');
            if (reason) {
              onReject(reason);
            }
          }}
          disabled={!!loading?.mutation}
          className={`px-6 py-3 font-medium rounded-lg transition-colors flex items-center gap-2 ${
            loading?.mutation
              ? 'bg-red-600/70 text-white cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {loading?.mutation && <Loader2 className="h-4 w-4 animate-spin" />}
           Rejeter le raisonnement
        </button>
        
        <button
          onClick={onTakeDecision}
          disabled={!recommendation.canAct || !!loading?.mutation}
          className={`px-8 py-3 font-bold rounded-lg transition-colors flex items-center gap-2 ${
            !recommendation.canAct || loading?.mutation
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {loading?.mutation && <Loader2 className="h-4 w-4 animate-spin" />}
          {recommendation.canAct 
            ? ' Valider et prendre decision'
            : '[emoji] Action bloquee - Resoudre les alertes'
          }
        </button>
        
        <div className="ml-auto text-xs text-gray-500">
          Workspace: {workspace.id}
        </div>
      </div>
    </div>
  );
}
