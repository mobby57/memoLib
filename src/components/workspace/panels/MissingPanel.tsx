'use client';

/**
 * Panel Manques - CŒUR DU MVP
 * Affiche les éléments manquants bloquants/non-bloquants
 */

import { MissingElement } from '@/types/workspace-reasoning';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

interface MissingPanelProps {
  missingElements: MissingElement[];
  onResolve?: (id: string) => void;
  onAddMissing?: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  INFORMATION: 'Information manquante',
  DOCUMENT: 'Document manquant',
  DECISION: 'Décision à prendre',
  VALIDATION: 'Validation requise',
  HUMAN_EXPERTISE: 'Expertise humaine',
};

const TYPE_ICONS: Record<string, string> = {
  INFORMATION: '❓',
  DOCUMENT: '📄',
  DECISION: '⚖️',
  VALIDATION: '✅',
  HUMAN_EXPERTISE: '👨‍⚖️',
};

export function MissingPanel({ missingElements, onResolve, onAddMissing }: MissingPanelProps) {
  const blockingElements = missingElements.filter(m => m.blocking && !m.resolved);
  const nonBlockingElements = missingElements.filter(m => !m.blocking && !m.resolved);
  const resolvedElements = missingElements.filter(m => m.resolved);
  
  if (missingElements.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Aucun élément manquant !
        </h3>
        <p className="text-gray-600">
          Tous les éléments nécessaires sont présents pour progresser.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header avec stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            Éléments Manquants
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {blockingElements.length} bloquant(s) • {nonBlockingElements.length} non-bloquant(s)
          </p>
        </div>
        
        {onAddMissing && (
          <button
            onClick={onAddMissing}
            className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            + Identifier un manque
          </button>
        )}
      </div>
      
      {/* Alerte critique si éléments bloquants */}
      {blockingElements.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-800 font-semibold">
              {blockingElements.length} élément(s) bloquant(s) empêche(nt) la progression vers READY_FOR_HUMAN
            </p>
          </div>
        </div>
      )}
      
      {/* Éléments BLOQUANTS */}
      {blockingElements.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            BLOQUANTS ({blockingElements.length})
          </h4>
          
          <div className="space-y-3">
            {blockingElements.map((element) => (
              <MissingCard
                key={element.id}
                element={element}
                onResolve={onResolve}
                blocking={true}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Éléments NON-BLOQUANTS */}
      {nonBlockingElements.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-orange-700 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            NON-BLOQUANTS ({nonBlockingElements.length})
          </h4>
          
          <div className="space-y-3">
            {nonBlockingElements.map((element) => (
              <MissingCard
                key={element.id}
                element={element}
                onResolve={onResolve}
                blocking={false}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Éléments RÉSOLUS */}
      {resolvedElements.length > 0 && (
        <details className="border border-gray-200 rounded-lg">
          <summary className="cursor-pointer p-4 hover:bg-gray-50 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm font-semibold text-green-700">
              RÉSOLUS ({resolvedElements.length})
            </span>
          </summary>
          
          <div className="p-4 pt-0 space-y-3">
            {resolvedElements.map((element) => (
              <MissingCard
                key={element.id}
                element={element}
                onResolve={undefined}
                blocking={element.blocking}
                resolved={true}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function MissingCard({
  element,
  onResolve,
  blocking,
  resolved = false,
}: {
  element: MissingElement;
  onResolve?: (id: string) => void;
  blocking: boolean;
  resolved?: boolean;
}) {
  return (
    <div
      className={`
        border rounded-lg p-4 transition-all
        ${blocking && !resolved
          ? 'border-red-300 bg-red-50'
          : resolved
          ? 'border-green-200 bg-green-50 opacity-75'
          : 'border-orange-200 bg-orange-50'
        }
      `}
    >
      {/* En-tête */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{TYPE_ICONS[element.type]}</span>
          <div>
            <h5 className="font-semibold text-gray-900">
              {TYPE_LABELS[element.type]}
            </h5>
            <p className="text-xs text-gray-600 mt-1">
              Identifié par : {element.identifiedBy === 'AI' ? 'IA' : 'Humain'}
            </p>
          </div>
        </div>
        
        {/* Badge */}
        <div
          className={`
            px-2 py-1 rounded text-xs font-medium
            ${blocking && !resolved
              ? 'bg-red-100 text-red-700'
              : resolved
              ? 'bg-green-100 text-green-700'
              : 'bg-orange-100 text-orange-700'
            }
          `}
        >
          {resolved ? 'Résolu' : blocking ? 'BLOQUANT' : 'Non-bloquant'}
        </div>
      </div>
      
      {/* Description */}
      <div className="mb-3">
        <p className="text-sm text-gray-900 font-medium mb-1">
          {element.description}
        </p>
        <p className="text-xs text-gray-600 italic">
          Pourquoi : {element.why}
        </p>
      </div>
      
      {/* Résolution */}
      {resolved && element.resolution && (
        <div className="bg-white rounded p-3 border border-green-200 mb-3">
          <p className="text-xs text-gray-600 mb-1">
            <strong>Résolution :</strong>
          </p>
          <p className="text-sm text-gray-900">{element.resolution}</p>
          <p className="text-xs text-gray-500 mt-2">
            Résolu par {element.resolvedBy} le{' '}
            {element.resolvedAt && new Date(element.resolvedAt).toLocaleDateString('fr-FR')}
          </p>
        </div>
      )}
      
      {/* Actions */}
      {!resolved && onResolve && (
        <div className="flex gap-2">
          <button
            onClick={() => onResolve(element.id)}
            className={`
              flex-1 px-3 py-2 rounded text-sm font-medium transition-colors
              ${blocking
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
              }
            `}
          >
            Marquer comme résolu
          </button>
        </div>
      )}
      
      {/* Métadonnées */}
      <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
        Créé le {new Date(element.createdAt).toLocaleDateString('fr-FR')} à{' '}
        {new Date(element.createdAt).toLocaleTimeString('fr-FR')}
      </div>
    </div>
  );
}
