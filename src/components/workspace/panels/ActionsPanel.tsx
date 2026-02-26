'use client';

/**
 * Panel Actions Proposees - Reduction d'incertitude
 */

import { ProposedAction } from '@/types/workspace-reasoning';
import { ArrowRight, CheckCircle, Clock } from 'lucide-react';

interface ActionsPanelProps {
  actions: ProposedAction[];
  onExecute?: (id: string) => void;
}

const TYPE_LABELS: Record<string, string> = {
  QUESTION: 'Question au client',
  DOCUMENT_REQUEST: 'Demande de document',
  ALERT: 'Alerte',
  ESCALATION: 'Escalade',
  FORM_SEND: 'Envoi de formulaire',
};

const TYPE_ICONS: Record<string, string> = {
  QUESTION: '',
  DOCUMENT_REQUEST: '',
  ALERT: '',
  ESCALATION: '?',
  FORM_SEND: '',
};

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  LOW: { color: 'bg-gray-100 text-gray-700', label: 'Basse' },
  NORMAL: { color: 'bg-blue-100 text-blue-700', label: 'Normale' },
  HIGH: { color: 'bg-orange-100 text-orange-700', label: 'Haute' },
  CRITICAL: { color: 'bg-red-100 text-red-700', label: 'Critique' },
};

export function ActionsPanel({ actions, onExecute }: ActionsPanelProps) {
  const pendingActions = actions.filter(a => !a.executed);
  const executedActions = actions.filter(a => a.executed);
  
  if (actions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Aucune action proposee
        </h3>
        <p className="text-gray-600">
          L'IA n'a pas encore genere d'actions pour reduire l'incertitude.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-indigo-500" />
            Actions Proposees
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {pendingActions.length} en attente - {executedActions.length} executee(s)
          </p>
        </div>
      </div>
      
      {/* Actions en attente */}
      {pendingActions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-indigo-700 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            EN ATTENTE ({pendingActions.length})
          </h4>
          
          <div className="space-y-3">
            {pendingActions.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                onExecute={onExecute}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Actions executees */}
      {executedActions.length > 0 && (
        <details className="border border-gray-200 rounded-lg">
          <summary className="cursor-pointer p-4 hover:bg-gray-50 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm font-semibold text-green-700">
              EXeCUTeES ({executedActions.length})
            </span>
          </summary>
          
          <div className="p-4 pt-0 space-y-3">
            {executedActions.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                executed={true}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function ActionCard({
  action,
  onExecute,
  executed = false,
}: {
  action: ProposedAction;
  onExecute?: (id: string) => void;
  executed?: boolean;
}) {
  const priorityConfig = PRIORITY_CONFIG[action.priority];
  
  return (
    <div
      className={`
        border rounded-lg p-4 transition-all
        ${executed ? 'border-green-200 bg-green-50' : 'border-indigo-200 bg-indigo-50'}
      `}
    >
      {/* En-tete */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{TYPE_ICONS[action.type]}</span>
          <div>
            <h5 className="font-semibold text-gray-900">
              {TYPE_LABELS[action.type]}
            </h5>
            <p className="text-xs text-gray-600 mt-1">
              Cible : {action.target === 'CLIENT' ? 'Client' : action.target === 'INTERNAL_USER' ? 'Interne' : 'Systeme'}
            </p>
          </div>
        </div>
        
        {/* Badge priorite */}
        <div className={`px-2 py-1 rounded text-xs font-medium ${priorityConfig.color}`}>
          {priorityConfig.label}
        </div>
      </div>
      
      {/* Contenu */}
      <div className="ml-8 mb-3">
        <p className="text-sm text-gray-900 mb-2">
          <strong>Contenu :</strong>
        </p>
        <div className="bg-white rounded p-3 border border-gray-200">
          <p className="text-sm text-gray-700">{action.content}</p>
        </div>
        
        {/* Raisonnement */}
        <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded p-3">
          <p className="text-xs text-indigo-800">
            <strong>Pourquoi :</strong> {action.reasoning}
          </p>
        </div>
      </div>
      
      {/* Resultat si execute */}
      {executed && action.result && (
        <div className="ml-8 mb-3 bg-green-50 border border-green-200 rounded p-3">
          <p className="text-xs text-green-800">
            <strong>Resultat :</strong> {action.result}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Execute par {action.executedBy} le{' '}
            {action.executedAt && new Date(action.executedAt).toLocaleDateString('fr-FR')}
          </p>
        </div>
      )}
      
      {/* Actions */}
      {!executed && onExecute && (
        <div className="ml-8 flex gap-2">
          <button
            onClick={() => onExecute(action.id)}
            className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium transition-colors"
          >
            Executer l'action
          </button>
        </div>
      )}
      
      {/* Metadonnees */}
      <div className="ml-8 mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
        Propose par {action.proposedBy === 'AI' ? 'IA' : 'Humain'} le{' '}
        {new Date(action.createdAt).toLocaleDateString('fr-FR')}
      </div>
    </div>
  );
}
