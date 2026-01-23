'use client';

/**
 * Panel READY FOR HUMAN - État final actionnable
 */

import { WorkspaceReasoning } from '@/types/workspace-reasoning';
import { CheckCircle, Lock, Download, Send } from 'lucide-react';

interface ReadyPanelProps {
  workspace: WorkspaceReasoning;
  summary: {
    factsCount: number;
    contextsCount: number;
    obligationsCount: number;
    missingResolved: number;
    risksEvaluated: number;
    actionsProposed: number;
  };
  onLock?: () => void;
  onExport?: () => void;
  onExecute?: () => void;
}

export function ReadyPanel({ workspace, summary, onLock, onExport, onExecute }: ReadyPanelProps) {
  const uncertaintyPercent = Math.round(workspace.uncertaintyLevel * 100);
  
  return (
    <div className="space-y-6">
      {/* Bannière de succès */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="text-6xl">✅</div>
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Workspace Prêt pour Validation Humaine
            </h2>
            <p className="text-green-100">
              Tous les éléments bloquants ont été résolus. Le workspace est actionnable.
            </p>
          </div>
        </div>
      </div>
      
      {/* Niveau d'incertitude */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            📊 Niveau d'Incertitude
          </h3>
          <span className={`
            px-3 py-1 rounded-full text-sm font-medium
            ${uncertaintyPercent >= 80 ? 'bg-red-100 text-red-700' :
              uncertaintyPercent >= 50 ? 'bg-orange-100 text-orange-700' :
              uncertaintyPercent >= 20 ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'}
          `}>
            {uncertaintyPercent}% d'incertitude
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`
              h-4 rounded-full transition-all
              ${uncertaintyPercent >= 80 ? 'bg-red-500' :
                uncertaintyPercent >= 50 ? 'bg-orange-500' :
                uncertaintyPercent >= 20 ? 'bg-yellow-500' :
                'bg-green-500'}
            `}
            style={{ width: `${100 - uncertaintyPercent}%` }}
          />
        </div>
        
        <p className="text-sm text-gray-600 mt-2">
          {uncertaintyPercent < 20 ? '✅ Très faible incertitude - Actionnable' :
           uncertaintyPercent < 50 ? '⚠️ Incertitude modérée - Validation recommandée' :
           uncertaintyPercent < 80 ? '🟠 Incertitude élevée - Validation requise' :
           '🔴 Incertitude critique - Investigation approfondie nécessaire'}
        </p>
      </div>
      
      {/* Résumé du raisonnement */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📋 Résumé du Raisonnement
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <SummaryCard
            icon="📋"
            label="Faits Extraits"
            value={summary.factsCount}
            color="blue"
          />
          <SummaryCard
            icon="🧭"
            label="Contextes Identifiés"
            value={summary.contextsCount}
            color="purple"
          />
          <SummaryCard
            icon="📜"
            label="Obligations Déduites"
            value={summary.obligationsCount}
            color="orange"
          />
          <SummaryCard
            icon="✅"
            label="Manques Résolus"
            value={summary.missingResolved}
            color="green"
          />
          <SummaryCard
            icon="⚠️"
            label="Risques Évalués"
            value={summary.risksEvaluated}
            color="red"
          />
          <SummaryCard
            icon="👉"
            label="Actions Proposées"
            value={summary.actionsProposed}
            color="indigo"
          />
        </div>
      </div>
      
      {/* Métadonnées workspace */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📌 Informations Workspace
        </h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">ID Workspace :</span>
            <span className="font-mono text-gray-900">{workspace.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Type de source :</span>
            <span className="font-semibold text-gray-900">{workspace.sourceType}</span>
          </div>
          {workspace.procedureType && (
            <div className="flex justify-between">
              <span className="text-gray-600">Procédure CESEDA :</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                {workspace.procedureType}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Créé le :</span>
            <span className="text-gray-900">
              {new Date(workspace.createdAt).toLocaleString('fr-FR')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Dernière mise à jour :</span>
            <span className="text-gray-900">
              {new Date(workspace.updatedAt).toLocaleString('fr-FR')}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Statut :</span>
            <span className={`
              px-2 py-1 rounded text-xs font-medium
              ${workspace.locked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}
            `}>
              {workspace.locked ? '🔒 Verrouillé' : '🔓 En cours'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Actions finales */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🎯 Actions Disponibles
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {!workspace.locked && onLock && (
            <button
              onClick={onLock}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              <Lock className="w-5 h-5" />
              Verrouiller le Workspace
            </button>
          )}
          
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Download className="w-5 h-5" />
              Exporter le Raisonnement
            </button>
          )}
          
          {onExecute && (
            <button
              onClick={onExecute}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <Send className="w-5 h-5" />
              Exécuter les Actions
            </button>
          )}
        </div>
      </div>
      
      {/* Note explicative finale */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
        <p className="text-green-800">
          <strong>✅ Règle #5 validée :</strong> Aucun élément bloquant non résolu. 
          Le workspace a atteint l'état READY_FOR_HUMAN conformément aux règles structurelles du moteur de raisonnement.
        </p>
        <p className="text-green-700 mt-2">
          Vous pouvez maintenant valider humainement le raisonnement complet et exécuter les actions proposées.
        </p>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`
      border rounded-lg p-4 bg-${color}-50 border-${color}-200
    `}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className={`text-2xl font-bold text-${color}-700`}>{value}</div>
      <div className="text-xs text-gray-600 mt-1">{label}</div>
    </div>
  );
}
