'use client';

/**
 * Panel Faits - Affichage des faits certains
 */

import { Fact } from '@/types/workspace-reasoning';
import { CheckCircle, FileText, Mail, User } from 'lucide-react';

interface FactsPanelProps {
  facts: Fact[];
  onAddFact?: () => void;
}

const SOURCE_ICONS: Record<string, any> = {
  EXPLICIT_MESSAGE: Mail,
  METADATA: FileText,
  DOCUMENT: FileText,
  USER_PROVIDED: User,
};

const SOURCE_LABELS: Record<string, string> = {
  EXPLICIT_MESSAGE: 'Message explicite',
  METADATA: 'Métadonnées',
  DOCUMENT: 'Document',
  USER_PROVIDED: 'Fourni manuellement',
};

export function FactsPanel({ facts, onAddFact }: FactsPanelProps) {
  if (facts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Aucun fait extrait
        </h3>
        <p className="text-gray-600 mb-4">
          L'IA n'a pas encore extrait de faits certains du message source.
        </p>
        {onAddFact && (
          <button
            onClick={onAddFact}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Ajouter un fait manuellement
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
          <CheckCircle className="w-5 h-5 text-green-500" />
          Faits Certains ({facts.length})
        </h3>
        
        {onAddFact && (
          <button
            onClick={onAddFact}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + Ajouter
          </button>
        )}
      </div>
      
      {/* Liste des faits */}
      <div className="space-y-3">
        {facts.map((fact) => {
          const SourceIcon = SOURCE_ICONS[fact.source] || FileText;
          
          return (
            <div
              key={fact.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* En-tête */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">✓</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">{fact.label}</h4>
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <SourceIcon className="w-3 h-3" />
                      {SOURCE_LABELS[fact.source]}
                    </p>
                  </div>
                </div>
                
                {/* Badge de confiance */}
                <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                  <CheckCircle className="w-3 h-3" />
                  100%
                </div>
              </div>
              
              {/* Valeur */}
              <div className="ml-8 mt-2">
                <div className="bg-gray-50 rounded p-3 border border-gray-100">
                  <p className="text-gray-900 font-mono text-sm">{fact.value}</p>
                </div>
              </div>
              
              {/* Métadonnées */}
              <div className="ml-8 mt-3 flex items-center gap-4 text-xs text-gray-500">
                <span>
                  Extrait par : <span className="font-medium">{fact.extractedBy === 'AI' ? 'IA' : 'Humain'}</span>
                </span>
                {fact.sourceRef && (
                  <span>
                    Réf : <span className="font-medium">{fact.sourceRef}</span>
                  </span>
                )}
                <span>
                  {new Date(fact.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Note explicative */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <p className="text-blue-800">
          <strong>💡 Note :</strong> Les faits ont toujours une confiance de 100% car ils sont extraits directement du message source, sans inférence.
        </p>
      </div>
    </div>
  );
}
