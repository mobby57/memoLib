/**
 * Composant d'affichage de l'état RISK_EVALUATED
 * Évaluer les risques de se tromper - Impact × Probabilité
 */

import { WorkspaceReasoning, Risk } from '@/types/workspace-reasoning';
import { Loader2 } from 'lucide-react';

interface RiskEvaluatedViewProps {
  workspace: WorkspaceReasoning;
  onContinue: () => void;
  loading?: { mutation?: boolean };
}

export function RiskEvaluatedView({ workspace, onContinue, loading }: RiskEvaluatedViewProps) {
  const risks = workspace.risks || [];
  
  // Tri par score de risque décroissant
  const sortedRisks = [...risks].sort((a, b) => b.riskScore - a.riskScore);
  
  const criticalRisks = risks.filter(r => r.riskScore >= 6); // HIGH × HIGH ou HIGH × MEDIUM
  const moderateRisks = risks.filter(r => r.riskScore >= 3 && r.riskScore < 6);
  const lowRisks = risks.filter(r => r.riskScore < 3);
  const irreversibleRisks = risks.filter(r => r.irreversible);
  
  const getImpactBadge = (impact: Risk['impact']) => {
    const badges = {
      LOW: { label: 'Impact faible', color: 'bg-green-100 text-green-800' },
      MEDIUM: { label: 'Impact moyen', color: 'bg-orange-100 text-orange-800' },
      HIGH: { label: 'Impact élevé', color: 'bg-red-100 text-red-800' },
    };
    return badges[impact];
  };
  
  const getProbabilityBadge = (probability: Risk['probability']) => {
    const badges = {
      LOW: { label: 'Peu probable', color: 'bg-green-100 text-green-800' },
      MEDIUM: { label: 'Probable', color: 'bg-orange-100 text-orange-800' },
      HIGH: { label: 'Très probable', color: 'bg-red-100 text-red-800' },
    };
    return badges[probability];
  };
  
  const getRiskScoreColor = (score: number) => {
    if (score >= 6) return 'bg-red-600 text-white';
    if (score >= 3) return 'bg-orange-500 text-white';
    return 'bg-green-500 text-white';
  };
  
  const getRiskScoreLabel = (score: number) => {
    if (score >= 6) return 'CRITIQUE';
    if (score >= 3) return 'MODÉRÉ';
    return 'FAIBLE';
  };
  
  const renderRisk = (risk: Risk) => {
    const impactBadge = getImpactBadge(risk.impact);
    const probabilityBadge = getProbabilityBadge(risk.probability);
    const scoreColor = getRiskScoreColor(risk.riskScore);
    const scoreLabel = getRiskScoreLabel(risk.riskScore);
    
    return (
      <div
        key={risk.id}
        className={`p-6 border-2 rounded-lg ${
          risk.riskScore >= 6 
            ? 'border-red-400 bg-red-50'
            : risk.riskScore >= 3
            ? 'border-orange-400 bg-orange-50'
            : 'border-yellow-400 bg-yellow-50'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="text-4xl">
            {risk.riskScore >= 6 ? '🔴' : risk.riskScore >= 3 ? '🟠' : '🟡'}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-3 py-1 text-sm font-bold rounded ${scoreColor}`}>
                Score: {risk.riskScore}/9 • {scoreLabel}
              </span>
              
              {risk.irreversible && (
                <span className="px-3 py-1 text-sm font-bold bg-purple-600 text-white rounded">
                  ⚠️ IRRÉVERSIBLE
                </span>
              )}
            </div>
            
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              {risk.description}
            </h4>
            
            {/* Détails du risque */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-white border border-gray-300 rounded">
                <div className="text-sm">
                  <span className="font-semibold text-gray-700">💥 Impact:</span>
                  <div className="mt-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${impactBadge.color}`}>
                      {impactBadge.label}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-white border border-gray-300 rounded">
                <div className="text-sm">
                  <span className="font-semibold text-gray-700">🎲 Probabilité:</span>
                  <div className="mt-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${probabilityBadge.color}`}>
                      {probabilityBadge.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Conséquences détaillées */}
            <div className="mb-4 p-4 bg-white border-2 border-gray-300 rounded-lg">
              <div className="text-sm">
                <div className="font-semibold text-gray-700 mb-2">
                  ⚡ Conséquences si ce risque se réalise:
                </div>
                <p className="text-gray-600 whitespace-pre-wrap">{risk.consequence}</p>
              </div>
            </div>
            
            {/* Avertissement irréversibilité */}
            {risk.irreversible && (
              <div className="p-3 bg-purple-50 border-2 border-purple-300 rounded-lg mb-4">
                <div className="flex items-start gap-2">
                  <div className="text-xl">⚠️</div>
                  <div className="text-sm text-purple-900">
                    <div className="font-bold mb-1">Risque IRRÉVERSIBLE</div>
                    <p>Une fois matérialisé, ce risque ne peut pas être annulé. Exige une validation humaine renforcée.</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-xs text-gray-500 mt-3">
              Évalué par {risk.evaluatedBy} • {new Date(risk.createdAt).toLocaleString('fr-FR')}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const maxRiskScore = Math.max(...risks.map(r => r.riskScore), 0);
  const avgRiskScore = risks.length > 0 
    ? (risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length).toFixed(1)
    : 0;
  
  return (
    <div className="space-y-6">
      {/* Titre */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">⚠️ Risques évalués</h2>
        <p className="text-gray-600 mt-1">
          Conséquences possibles d'une action prématurée ou basée sur une hypothèse erronée
        </p>
      </div>
      
      {/* Tableau de bord des risques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <div className="text-3xl text-blue-600 mb-2">📊</div>
          <div className="text-2xl font-bold text-blue-900">{risks.length}</div>
          <div className="text-sm text-blue-700">Risque{risks.length > 1 ? 's' : ''} identifié{risks.length > 1 ? 's' : ''}</div>
        </div>
        
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
          <div className="text-3xl text-red-600 mb-2">🔴</div>
          <div className="text-2xl font-bold text-red-900">{criticalRisks.length}</div>
          <div className="text-sm text-red-700">Critique{criticalRisks.length > 1 ? 's' : ''}</div>
        </div>
        
        <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
          <div className="text-3xl text-purple-600 mb-2">⚠️</div>
          <div className="text-2xl font-bold text-purple-900">{irreversibleRisks.length}</div>
          <div className="text-sm text-purple-700">Irréversible{irreversibleRisks.length > 1 ? 's' : ''}</div>
        </div>
        
        <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
          <div className="text-3xl text-orange-600 mb-2">📈</div>
          <div className="text-2xl font-bold text-orange-900">
            {maxRiskScore > 0 ? `${maxRiskScore}/9` : 'N/A'}
          </div>
          <div className="text-sm text-orange-700">Score max • Moy: {avgRiskScore}</div>
        </div>
      </div>
      
      {/* Risques critiques */}
      {criticalRisks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-red-700">
            🔴 Risques critiques ({criticalRisks.length})
          </h3>
          <div className="space-y-4">
            {sortedRisks.filter(r => r.riskScore >= 6).map(renderRisk)}
          </div>
        </div>
      )}
      
      {/* Risques modérés */}
      {moderateRisks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-orange-700">
            🟠 Risques modérés ({moderateRisks.length})
          </h3>
          <div className="space-y-4">
            {sortedRisks.filter(r => r.riskScore >= 3 && r.riskScore < 6).map(renderRisk)}
          </div>
        </div>
      )}
      
      {/* Risques faibles */}
      {lowRisks.length > 0 && (
        <details className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <summary className="font-semibold text-yellow-900 cursor-pointer">
            🟡 Risques faibles ({lowRisks.length})
          </summary>
          <div className="mt-4 space-y-4">
            {sortedRisks.filter(r => r.riskScore < 3).map(renderRisk)}
          </div>
        </details>
      )}
      
      {/* Aucun risque */}
      {risks.length === 0 && (
        <div className="p-8 bg-green-50 border-2 border-green-300 rounded-lg text-center">
          <div className="text-4xl mb-3">✅</div>
          <div className="text-green-700 font-semibold">
            Aucun risque identifié
          </div>
        </div>
      )}
      
      {/* Principe méthodologique */}
      <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div className="text-sm text-blue-900">
            <div className="font-semibold mb-1">Calcul du score de risque:</div>
            <p>
              Score = Impact × Probabilité (échelle 1-9) <br />
              • Impact/Probabilité FAIBLE = 1 <br />
              • Impact/Probabilité MOYEN = 2 <br />
              • Impact/Probabilité ÉLEVÉ = 3 <br />
              <br />
              Score ≥ 6 = CRITIQUE • Score 3-5 = MODÉRÉ • Score &lt; 3 = FAIBLE
            </p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
        <div className="text-sm text-gray-600">
          {risks.length} risque{risks.length > 1 ? 's' : ''} évalué{risks.length > 1 ? 's' : ''}
          {criticalRisks.length > 0 && (
            <span className="ml-2 text-red-600 font-medium">
              • {criticalRisks.length} critique{criticalRisks.length > 1 ? 's' : ''}
            </span>
          )}
          {irreversibleRisks.length > 0 && (
            <span className="ml-2 text-purple-600 font-medium">
              • {irreversibleRisks.length} irréversible{irreversibleRisks.length > 1 ? 's' : ''}
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
          Continuer → Proposer une action
        </button>
      </div>
    </div>
  );
}
