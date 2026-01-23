/**
 * Composant Suggestions Intelligentes
 * Affiche les suggestions proactives de l'IA
 * 
 * Innovation: L'IA devient proactive et suggère des actions
 */

'use client';

import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

interface SmartSuggestion {
  id: string;
  title: string;
  description: string;
  actionType: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasoning: string;
  confidence: number;
  estimatedTimeMinutes: number;
  suggestedAction: {
    type: string;
    data: any;
  };
}

export function SmartSuggestions({ tenantId }: { tenantId: string }) {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [dismissing, setDismissing] = useState<string | null>(null);

  useEffect(() => {
    loadSuggestions();
  }, [tenantId]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tenant/${tenantId}/suggestions`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      logger.error('Erreur chargement suggestions IA', { error, tenantId });
    } finally {
      setLoading(false);
    }
  };

  const acceptSuggestion = async (suggestionId: string) => {
    setAccepting(suggestionId);
    try {
      const response = await fetch(`/api/tenant/${tenantId}/suggestions/${suggestionId}/accept`, {
        method: 'POST'
      });
      if (response.ok) {
        // Retirer la suggestion acceptée
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      }
    } catch (error) {
      logger.error('Erreur acceptation suggestion IA', { error, suggestionId, tenantId });
    } finally {
      setAccepting(null);
    }
  };

  const dismissSuggestion = async (suggestionId: string) => {
    setDismissing(suggestionId);
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    setDismissing(null);
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-50',
          border: 'border-red-300',
          text: 'text-red-800',
          badge: 'bg-red-600',
          icon: '🚨'
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-300',
          text: 'text-orange-800',
          badge: 'bg-orange-600',
          icon: '⚠️'
        };
      case 'MEDIUM':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-300',
          text: 'text-yellow-800',
          badge: 'bg-yellow-600',
          icon: '📌'
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-300',
          text: 'text-blue-800',
          badge: 'bg-blue-600',
          icon: 'ℹ️'
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-4xl mb-2">✨</div>
        <div className="font-medium text-green-900">Tout est à jour !</div>
        <div className="text-sm text-green-700 mt-1">
          Aucune suggestion pour le moment
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">
          💡 Suggestions Intelligentes ({suggestions.length})
        </h3>
        <button
          onClick={loadSuggestions}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          🔄 Actualiser
        </button>
      </div>

      {suggestions.map((suggestion) => {
        const config = getPriorityConfig(suggestion.priority);

        return (
          <div
            key={suggestion.id}
            className={`${config.bg} border ${config.border} rounded-lg p-4 transition-all hover:shadow-md`}
          >
            <div className="flex items-start gap-4">
              {/* Icône de priorité */}
              <div className="text-3xl flex-shrink-0">{config.icon}</div>

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-semibold text-gray-900">{suggestion.title}</h4>
                  <span className={`${config.badge} text-white text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap`}>
                    {suggestion.priority}
                  </span>
                </div>

                <p className="text-sm text-gray-700 mb-3">{suggestion.description}</p>

                {/* Détails */}
                <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <span>🎯</span>
                    <span>Confiance: {(suggestion.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>⏱️</span>
                    <span>~{suggestion.estimatedTimeMinutes} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>🤖</span>
                    <span>{suggestion.actionType}</span>
                  </div>
                </div>

                {/* Raisonnement */}
                <div className="bg-white bg-opacity-60 rounded p-2 mb-3">
                  <div className="text-xs font-medium text-gray-700 mb-1">
                    💭 Raisonnement:
                  </div>
                  <div className="text-xs text-gray-600">{suggestion.reasoning}</div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => acceptSuggestion(suggestion.id)}
                    disabled={accepting === suggestion.id}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {accepting === suggestion.id ? (
                      <>
                        <span className="inline-block animate-spin mr-2">⏳</span>
                        Traitement...
                      </>
                    ) : (
                      <>✓ Accepter</>
                    )}
                  </button>

                  <button
                    onClick={() => dismissSuggestion(suggestion.id)}
                    disabled={dismissing === suggestion.id}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
                  >
                    ✕ Ignorer
                  </button>

                  <button
                    className="ml-auto text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Détails →
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
