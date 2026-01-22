'use client';

/**
 * Panel Risques - Matrice Probabilité × Sévérité
 */

import { Risk } from '@/types/workspace-reasoning';
import { AlertTriangle, TrendingUp } from 'lucide-react';

interface RisksPanelProps {
  risks: Risk[];
  onAddRisk?: () => void;
}

const LEVEL_CONFIG = {
  LOW: { label: 'Faible', color: 'green' },
  MEDIUM: { label: 'Moyen', color: 'yellow' },
  HIGH: { label: 'Élevé', color: 'red' },
};

export function RisksPanel({ risks, onAddRisk }: RisksPanelProps) {
  if (risks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Aucun risque identifié
        </h3>
        <p className="text-gray-600 mb-4">
          L'IA n'a pas encore évalué les risques d'action prématurée.
        </p>
        {onAddRisk && (
          <button
            onClick={onAddRisk}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Ajouter un risque
          </button>
        )}
      </div>
    );
  }
  
  // Tri par score décroissant
  const sortedRisks = [...risks].sort((a, b) => b.riskScore - a.riskScore);
  
  // Catégories
  const criticalRisks = sortedRisks.filter(r => r.riskScore >= 7);
  const highRisks = sortedRisks.filter(r => r.riskScore >= 4 && r.riskScore < 7);
  const lowRisks = sortedRisks.filter(r => r.riskScore < 4);
  
  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Risques Évalués ({risks.length})
          </h3>
          <div className="flex gap-4 mt-2 text-sm">
            <span className="text-red-600">
              <strong>{criticalRisks.length}</strong> critique(s)
            </span>
            <span className="text-orange-600">
              <strong>{highRisks.length}</strong> élevé(s)
            </span>
            <span className="text-green-600">
              <strong>{lowRisks.length}</strong> faible(s)
            </span>
          </div>
        </div>
        
        {onAddRisk && (
          <button
            onClick={onAddRisk}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            + Ajouter
          </button>
        )}
      </div>
      
      {/* Alerte critique */}
      {criticalRisks.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900">
                ⚠️ {criticalRisks.length} risque(s) critique(s) détecté(s)
              </h4>
              <p className="text-sm text-red-700 mt-1">
                Ces risques nécessitent une attention immédiate avant toute action.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Matrice de risques */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Matrice Probabilité × Impact
        </h4>
        
        <div className="grid grid-cols-3 gap-2 mb-6">
          {['HIGH', 'MEDIUM', 'LOW'].map((prob) => (
            <div key={`prob-${prob}`} className="text-center">
              <div className="text-xs font-medium text-gray-600 mb-2">
                {prob === 'HIGH' ? '↑ Haute' : prob === 'MEDIUM' ? '→ Moyenne' : '↓ Faible'} prob.
              </div>
              {['HIGH', 'MEDIUM', 'LOW'].map((impact) => {
                const cellRisks = risks.filter(
                  r => r.probability === prob && r.impact === impact
                );
                const score = (prob === 'HIGH' ? 3 : prob === 'MEDIUM' ? 2 : 1) *
                              (impact === 'HIGH' ? 3 : impact === 'MEDIUM' ? 2 : 1);
                
                return (
                  <div
                    key={`${prob}-${impact}`}
                    className={`
                      p-2 rounded border text-center text-xs
                      ${score >= 7 ? 'bg-red-100 border-red-300' :
                        score >= 4 ? 'bg-orange-100 border-orange-300' :
                        'bg-green-100 border-green-300'}
                    `}
                  >
                    <div className="font-bold">{score}</div>
                    <div className="text-gray-600">{cellRisks.length} risque(s)</div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        
        <div className="text-xs text-gray-500 text-center">
          Impact : <strong>←</strong> Faible | Moyen | Élevé <strong>→</strong>
        </div>
      </div>
      
      {/* Liste des risques */}
      <div className="space-y-3">
        {sortedRisks.map((risk) => (
          <RiskCard key={risk.id} risk={risk} />
        ))}
      </div>
    </div>
  );
}

function RiskCard({ risk }: { risk: Risk }) {
  const impactConfig = LEVEL_CONFIG[risk.impact];
  const probConfig = LEVEL_CONFIG[risk.probability];
  
  const severityColor = 
    risk.riskScore >= 7 ? 'red' :
    risk.riskScore >= 4 ? 'orange' : 'green';
  
  return (
    <div className={`
      border rounded-lg p-4
      ${severityColor === 'red' ? 'border-red-300 bg-red-50' :
        severityColor === 'orange' ? 'border-orange-300 bg-orange-50' :
        'border-green-300 bg-green-50'}
    `}>
      {/* En-tête */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">
            {risk.irreversible ? '🚫' : severityColor === 'red' ? '🔴' : severityColor === 'orange' ? '🟠' : '🟢'}
          </span>
          <div>
            <h5 className="font-semibold text-gray-900">
              {risk.irreversible && '⚠️ IRRÉVERSIBLE - '}
              Score: {risk.riskScore}/9
            </h5>
            <p className="text-xs text-gray-600 mt-1">
              Impact {impactConfig.label} × Probabilité {probConfig.label}
            </p>
          </div>
        </div>
        
        {/* Badge score */}
        <div className={`
          px-3 py-1 rounded-full text-sm font-bold
          ${severityColor === 'red' ? 'bg-red-200 text-red-900' :
            severityColor === 'orange' ? 'bg-orange-200 text-orange-900' :
            'bg-green-200 text-green-900'}
        `}>
          {risk.riskScore}
        </div>
      </div>
      
      {/* Description */}
      <div className="ml-8">
        <p className="text-sm text-gray-900">{risk.description}</p>
        
        {risk.irreversible && (
          <div className="mt-3 bg-red-100 border border-red-300 rounded p-3">
            <p className="text-xs text-red-900">
              <strong>🚫 ATTENTION :</strong> Ce risque est irréversible. 
              Aucun retour en arrière possible une fois l'action entreprise.
            </p>
          </div>
        )}
      </div>
      
      {/* Métadonnées */}
      <div className="ml-8 mt-3 pt-3 border-t border-gray-300 text-xs text-gray-600">
        Évalué par {risk.evaluatedBy === 'AI' ? 'IA' : 'Humain'} le{' '}
        {new Date(risk.createdAt).toLocaleDateString('fr-FR')}
      </div>
    </div>
  );
}
