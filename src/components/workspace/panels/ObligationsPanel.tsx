'use client';

/**
 * Panel Obligations - Ce qui est requis
 */

import { Obligation } from '@/types/workspace-reasoning';
import { FileText, AlertTriangle, Clock } from 'lucide-react';

interface ObligationsPanelProps {
  obligations: Obligation[];
  contexts?: { id: string; type: string; description: string }[];
  onAddObligation?: () => void;
}

export function ObligationsPanel({ obligations, contexts = [], onAddObligation }: ObligationsPanelProps) {
  const mandatoryObligations = obligations.filter(o => o.mandatory);
  const optionalObligations = obligations.filter(o => !o.mandatory);
  const withDeadline = obligations.filter(o => o.deadline);
  
  if (obligations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">[emoji]</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Aucune obligation identifiee
        </h3>
        <p className="text-gray-600 mb-4">
          L'IA n'a pas encore deduit d'obligations legales ou administratives.
        </p>
        {onAddObligation && (
          <button
            onClick={onAddObligation}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Ajouter une obligation
          </button>
        )}
      </div>
    );
  }
  
  // Grouper par contexte
  const groupedByContext = obligations.reduce((acc, obligation) => {
    const contextId = obligation.contextId;
    if (!acc[contextId]) {
      acc[contextId] = [];
    }
    acc[contextId].push(obligation);
    return acc;
  }, {} as Record<string, Obligation[]>);
  
  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-500" />
            Obligations Identifiees ({obligations.length})
          </h3>
          <div className="flex gap-4 mt-2 text-sm text-gray-600">
            <span>
              <strong className="text-orange-600">{mandatoryObligations.length}</strong> obligatoire(s)
            </span>
            <span>
              <strong className="text-blue-600">{optionalObligations.length}</strong> optionnelle(s)
            </span>
            <span>
              <strong className="text-red-600">{withDeadline.length}</strong> avec delai
            </span>
          </div>
        </div>
        
        {onAddObligation && (
          <button
            onClick={onAddObligation}
            className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            + Ajouter
          </button>
        )}
      </div>
      
      {/* Obligations groupees par contexte */}
      <div className="space-y-4">
        {Object.entries(groupedByContext).map(([contextId, contextObligations]) => {
          const context = contexts.find(c => c.id === contextId);
          
          return (
            <div key={contextId} className="border border-orange-200 rounded-lg overflow-hidden">
              {/* En-tete contexte */}
              {context && (
                <div className="bg-orange-50 px-4 py-3 border-b border-orange-200">
                  <h4 className="font-semibold text-orange-900">
                    [emoji] Contexte : {context.type}
                  </h4>
                  <p className="text-xs text-orange-700 mt-1">{context.description}</p>
                </div>
              )}
              
              {/* Liste des obligations */}
              <div className="p-4 space-y-3 bg-white">
                {contextObligations.map((obligation) => (
                  <ObligationCard key={obligation.id} obligation={obligation} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Note explicative */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm">
        <p className="text-orange-800">
          <strong>️ Regle #3 :</strong> Chaque obligation est liee a un contexte specifique. 
          Les obligations decoulent du cadre identifie.
        </p>
      </div>
    </div>
  );
}

function ObligationCard({ obligation }: { obligation: Obligation }) {
  const isUrgent = obligation.deadline && new Date(obligation.deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  return (
    <div className={`
      border rounded-lg p-4
      ${obligation.mandatory ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-gray-50'}
    `}>
      {/* En-tete */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{obligation.mandatory ? '' : ''}</span>
          <div>
            <h5 className="font-semibold text-gray-900">
              {obligation.mandatory ? 'OBLIGATOIRE' : 'Optionnel'}
            </h5>
            {obligation.critical && (
              <span className="text-xs text-red-600 font-medium">
                [emoji] DeLAI CRITIQUE
              </span>
            )}
          </div>
        </div>
        
        {obligation.deadline && (
          <div className={`
            flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
            ${isUrgent ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}
          `}>
            <Clock className="w-3 h-3" />
            {new Date(obligation.deadline).toLocaleDateString('fr-FR')}
          </div>
        )}
      </div>
      
      {/* Description */}
      <div className="ml-7">
        <p className="text-sm text-gray-900 mb-2">{obligation.description}</p>
        
        {/* Reference legale */}
        {obligation.legalRef && (
          <div className="bg-white border border-orange-200 rounded p-2 mb-2">
            <p className="text-xs text-orange-800">
              <strong> Base legale :</strong> {obligation.legalRef}
            </p>
          </div>
        )}
      </div>
      
      {/* Metadonnees */}
      <div className="ml-7 mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
        Deduit par {obligation.deducedBy === 'AI' ? 'IA' : 'Humain'} le{' '}
        {new Date(obligation.createdAt).toLocaleDateString('fr-FR')}
      </div>
    </div>
  );
}
