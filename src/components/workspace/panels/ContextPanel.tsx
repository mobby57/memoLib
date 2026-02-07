'use client';

/**
 * Panel Contextes - Hypotheses de cadrage
 */

import { ContextHypothesis } from '@/types/workspace-reasoning';
import { Compass, HelpCircle } from 'lucide-react';

interface ContextPanelProps {
  contexts: ContextHypothesis[];
  onAddContext?: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  LEGAL: 'Cadre juridique',
  ADMINISTRATIVE: 'Cadre administratif',
  CONTRACTUAL: 'Cadre contractuel',
  TEMPORAL: 'Cadre temporel',
  ORGANIZATIONAL: 'Cadre organisationnel',
};

const CERTAINTY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  POSSIBLE: { label: 'Possible', color: 'text-yellow-600', icon: '' },
  PROBABLE: { label: 'Probable', color: 'text-orange-600', icon: '?' },
  CONFIRMED: { label: 'Confirme', color: 'text-green-600', icon: '[Check]' },
};

export function ContextPanel({ contexts, onAddContext }: ContextPanelProps) {
  if (contexts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Aucun contexte identifie
        </h3>
        <p className="text-gray-600 mb-4">
          L'IA n'a pas encore identifie de cadre contextuel pour ce workspace.
        </p>
        {onAddContext && (
          <button
            onClick={onAddContext}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Ajouter un contexte
          </button>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Compass className="w-5 h-5 text-purple-500" />
          Contextes Identifies ({contexts.length})
        </h3>
        
        {onAddContext && (
          <button
            onClick={onAddContext}
            className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            + Ajouter
          </button>
        )}
      </div>
      
      {/* Liste des contextes */}
      <div className="space-y-3">
        {contexts.map((context) => {
          const certaintyConfig = CERTAINTY_CONFIG[context.certaintyLevel];
          
          return (
            <div
              key={context.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* En-tete */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl"></span>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {TYPE_LABELS[context.type]}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Identifie par : {context.identifiedBy === 'AI' ? 'IA' : 'Humain'}
                    </p>
                  </div>
                </div>
                
                {/* Badge de certitude */}
                <div className={`flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs font-medium ${certaintyConfig.color}`}>
                  <span>{certaintyConfig.icon}</span>
                  {certaintyConfig.label}
                </div>
              </div>
              
              {/* Description */}
              <div className="ml-8">
                <p className="text-sm text-gray-700 mb-3">{context.description}</p>
                
                {context.reasoning && (
                  <div className="bg-purple-50 border border-purple-100 rounded p-3">
                    <p className="text-xs text-purple-800">
                      <strong>Raisonnement :</strong> {context.reasoning}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Metadonnees */}
              <div className="ml-8 mt-3 text-xs text-gray-500">
                {new Date(context.createdAt).toLocaleDateString('fr-FR')} a{' '}
                {new Date(context.createdAt).toLocaleTimeString('fr-FR')}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Note explicative */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm">
        <p className="text-purple-800">
          <strong> Note :</strong> Les contextes sont des hypotheses de cadrage. Plusieurs contextes peuvent coexister jusqu'a confirmation.
        </p>
      </div>
    </div>
  );
}
