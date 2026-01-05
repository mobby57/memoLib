/**
 * Composant ValidationQueue
 * Affiche et gère les actions IA en attente de validation
 */

'use client';

import { useValidation } from '@/hooks/useValidation';
import { AIAction, AutonomyLevel, ValidationLevel } from '@/types';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { logger } from '@/lib/logger';

interface ValidationQueueProps {
  tenantId: string;
}

export function ValidationQueue({ tenantId }: ValidationQueueProps) {
  const {
    pendingActions,
    loading,
    validating,
    approveAction,
    rejectAction,
    modifyAction,
    error
  } = useValidation({ tenantId });

  const [selectedAction, setSelectedAction] = useState<AIAction | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [modifyContent, setModifyContent] = useState<any>(null);

  const getAutonomyColor = (level: AutonomyLevel) => {
    switch (level) {
      case AutonomyLevel.GREEN:
        return 'bg-green-100 text-green-800 border-green-300';
      case AutonomyLevel.ORANGE:
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case AutonomyLevel.RED:
        return 'bg-red-100 text-red-800 border-red-300';
    }
  };

  const getValidationLevelBadge = (level: ValidationLevel) => {
    const badges = {
      [ValidationLevel.NONE]: 'Aucune',
      [ValidationLevel.QUICK]: 'Rapide ⚡',
      [ValidationLevel.STANDARD]: 'Standard 📋',
      [ValidationLevel.REINFORCED]: 'Renforcée 🔒'
    };
    return badges[level] || level;
  };

  const handleApprove = async (actionId: string) => {
    try {
      await approveAction(actionId);
      setSelectedAction(null);
      setShowModal(false);
    } catch (err) {
      logger.error('Erreur approbation action IA', { error: err, actionId });
    }
  };

  const handleReject = async (actionId: string) => {
    if (!rejectComment.trim()) {
      alert('Un commentaire est requis pour rejeter une action');
      return;
    }
    
    try {
      await rejectAction(actionId, rejectComment);
      setSelectedAction(null);
      setShowModal(false);
      setRejectComment('');
    } catch (err) {
      logger.error('Erreur rejet action IA', { error: err, actionId, reason: rejectComment });
    }
  };

  const handleModify = async (actionId: string) => {
    if (!modifyContent) {
      alert('Veuillez modifier le contenu avant de valider');
      return;
    }
    
    try {
      await modifyAction(actionId, modifyContent, rejectComment);
      setSelectedAction(null);
      setShowModal(false);
      setModifyContent(null);
      setRejectComment('');
    } catch (err) {
      logger.error('Erreur modification action IA', { error: err, actionId, modifiedContent: modifyContent, comment: rejectComment });
    }
  };

  const openActionModal = (action: AIAction) => {
    setSelectedAction(action);
    setModifyContent(action.content);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Chargement...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">❌ {error}</p>
      </div>
    );
  }

  if (pendingActions.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">✅ Aucune action en attente de validation</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Actions en attente de validation
        </h2>
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
          {pendingActions.length} {pendingActions.length > 1 ? 'actions' : 'action'}
        </span>
      </div>

      {/* Liste des actions */}
      <div className="space-y-3">
        {pendingActions.map((action) => (
          <div
            key={action.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => openActionModal(action)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getAutonomyColor(action.autonomyLevel)}`}>
                    {action.autonomyLevel}
                  </span>
                  <span className="text-xs text-gray-500">
                    {getValidationLevelBadge(action.validationLevel)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(action.createdAt), { 
                      addSuffix: true, 
                      locale: fr 
                    })}
                  </span>
                </div>

                <h3 className="font-medium text-gray-900 mb-1">
                  {action.actionType.replace(/_/g, ' ')}
                </h3>

                <p className="text-sm text-gray-600 mb-2">
                  {action.rationale}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Confiance: {(action.confidence * 100).toFixed(0)}%</span>
                  {action.dossierId && (
                    <span>Dossier: {action.dossierId}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 ml-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApprove(action.id);
                  }}
                  disabled={validating}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
                >
                  ✓ Approuver
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openActionModal(action);
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                >
                  👁️ Détails
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de détails */}
      {showModal && selectedAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Validation de l'action
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedAction.actionType.replace(/_/g, ' ')}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedAction(null);
                    setRejectComment('');
                    setModifyContent(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Métadonnées */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Niveau:</span>{' '}
                    <span className={`px-2 py-1 rounded text-xs ${getAutonomyColor(selectedAction.autonomyLevel)}`}>
                      {selectedAction.autonomyLevel}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Validation:</span>{' '}
                    {getValidationLevelBadge(selectedAction.validationLevel)}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Confiance:</span>{' '}
                    {(selectedAction.confidence * 100).toFixed(0)}%
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Créé:</span>{' '}
                    {formatDistanceToNow(new Date(selectedAction.createdAt), { 
                      addSuffix: true, 
                      locale: fr 
                    })}
                  </div>
                </div>
              </div>

              {/* Justification */}
              <div className="mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Justification</h3>
                <p className="text-gray-700 bg-blue-50 p-3 rounded">
                  {selectedAction.rationale}
                </p>
              </div>

              {/* Contenu */}
              <div className="mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Contenu généré</h3>
                <div className="bg-gray-50 p-4 rounded border border-gray-200 max-h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">
                    {JSON.stringify(modifyContent || selectedAction.content, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Zone de commentaire */}
              <div className="mb-6">
                <label htmlFor="validation-comment" className="block font-medium text-gray-900 mb-2">
                  Commentaire {selectedAction.validationLevel === ValidationLevel.REINFORCED && '(obligatoire)'}
                </label>
                <textarea
                  id="validation-comment"
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                  rows={3}
                  placeholder="Ajoutez un commentaire pour justifier votre décision..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => handleReject(selectedAction.id)}
                  disabled={validating}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  ❌ Rejeter
                </button>
                <button
                  onClick={() => handleModify(selectedAction.id)}
                  disabled={validating}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  ✏️ Modifier et approuver
                </button>
                <button
                  onClick={() => handleApprove(selectedAction.id)}
                  disabled={validating}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  ✓ Approuver tel quel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
