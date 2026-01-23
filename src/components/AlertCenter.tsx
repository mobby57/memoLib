/**
 * Composant AlertCenter
 * Centre d'alertes intelligent avec gestion des priorités
 */

'use client';

import { useValidation } from '@/hooks/useValidation';
import { Alert } from '@/types';
import { useState } from 'react';
import { formatDistanceToNow, addHours, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AlertCenterProps {
  tenantId: string;
}

export function AlertCenter({ tenantId }: AlertCenterProps) {
  const {
    alerts,
    unreadAlertsCount,
    loading,
    markAlertAsRead,
    snoozeAlert,
    error
  } = useValidation({ tenantId });

  const [filter, setFilter] = useState<'all' | 'unread'>('unread');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [showSnoozeModal, setShowSnoozeModal] = useState(false);

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 border-red-500 text-red-900';
      case 'ALERT':
        return 'bg-orange-100 border-orange-500 text-orange-900';
      case 'WARNING':
        return 'bg-yellow-100 border-yellow-500 text-yellow-900';
      case 'INFO':
        return 'bg-blue-100 border-blue-500 text-blue-900';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-900';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return '🚨';
      case 'ALERT':
        return '⚠️';
      case 'WARNING':
        return '⚡';
      case 'INFO':
        return 'ℹ️';
      default:
        return '📌';
    }
  };

  const getAlertTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      legal_deadline: 'Délai légal',
      inconsistency: 'Incohérence',
      blocked_case: 'Dossier bloqué',
      missing_document: 'Document manquant'
    };
    return labels[type] || type;
  };

  const filteredAlerts = filter === 'unread' 
    ? alerts.filter(a => !a.read)
    : alerts;

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await markAlertAsRead(alertId);
    } catch (err) {
      console.error('Erreur marquage alerte:', err);
    }
  };

  const handleSnooze = async (alertId: string, hours: number) => {
    try {
      const until = hours === 24 
        ? addDays(new Date(), 1)
        : addHours(new Date(), hours);
      
      await snoozeAlert(alertId, until);
      setShowSnoozeModal(false);
      setSelectedAlert(null);
    } catch (err) {
      console.error('Erreur snooze:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Chargement des alertes...</span>
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

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-900">
            Centre d'Alertes
          </h2>
          {unreadAlertsCount > 0 && (
            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              {unreadAlertsCount}
            </span>
          )}
        </div>

        {/* Filtre */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Non lues ({unreadAlertsCount})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Toutes ({alerts.length})
          </button>
        </div>
      </div>

      {/* Liste des alertes */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">
            {filter === 'unread' 
              ? '✅ Aucune alerte non lue' 
              : '📭 Aucune alerte'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`border-l-4 rounded-lg p-4 ${getSeverityStyle(alert.severity)} ${
                !alert.read ? 'shadow-md' : 'opacity-75'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* En-tête de l'alerte */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{getSeverityIcon(alert.severity)}</span>
                    <span className="font-semibold text-xs uppercase tracking-wide">
                      {getAlertTypeLabel(alert.alertType)}
                    </span>
                    <span className="text-xs opacity-75">
                      {formatDistanceToNow(new Date(alert.createdAt), { 
                        addSuffix: true, 
                        locale: fr 
                      })}
                    </span>
                    {!alert.read && (
                      <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                        NEW
                      </span>
                    )}
                  </div>

                  {/* Message */}
                  <p className="font-medium mb-2">{alert.message}</p>

                  {/* Deadline si présent */}
                  {alert.deadline && (
                    <div className="flex items-center gap-2 text-sm mb-2">
                      <span className="font-medium">⏰ Échéance:</span>
                      <span>
                        {new Date(alert.deadline).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}

                  {/* Action suggérée */}
                  {alert.suggestedAction && (
                    <div className="bg-white bg-opacity-50 rounded p-2 text-sm mt-2">
                      <span className="font-medium">💡 Action suggérée:</span>{' '}
                      {alert.suggestedAction}
                    </div>
                  )}

                  {/* Dossier - TODO: Load dossier data if needed */}
                  {/* {alert.dossierId && (
                    <div className="text-xs mt-2 opacity-75">
                      📁 Dossier ID: {alert.dossierId}
                    </div>
                  )} */}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  {!alert.read && (
                    <button
                      onClick={() => handleMarkAsRead(alert.id)}
                      className="px-3 py-1 bg-white bg-opacity-70 hover:bg-opacity-100 rounded text-sm font-medium transition-colors"
                      title="Marquer comme lue"
                    >
                      ✓ Lu
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setSelectedAlert(alert);
                      setShowSnoozeModal(true);
                    }}
                    className="px-3 py-1 bg-white bg-opacity-70 hover:bg-opacity-100 rounded text-sm font-medium transition-colors"
                    title="Reporter"
                  >
                    ⏰ Snooze
                  </button>

                  {alert.dossierId && (
                    <button
                      onClick={() => window.location.href = `/dossiers/${alert.dossierId}`}
                      className="px-3 py-1 bg-white bg-opacity-70 hover:bg-opacity-100 rounded text-sm font-medium transition-colors"
                      title="Voir le dossier"
                    >
                      👁️ Voir
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Snooze */}
      {showSnoozeModal && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Reporter cette alerte
            </h3>
            
            <p className="text-gray-600 mb-6">
              Pendant combien de temps souhaitez-vous reporter cette alerte ?
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleSnooze(selectedAlert.id, 1)}
                className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-left font-medium transition-colors"
              >
                ⏰ 1 heure
              </button>
              
              <button
                onClick={() => handleSnooze(selectedAlert.id, 3)}
                className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-left font-medium transition-colors"
              >
                ⏰ 3 heures
              </button>
              
              <button
                onClick={() => handleSnooze(selectedAlert.id, 24)}
                className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-left font-medium transition-colors"
              >
                ⏰ Demain (24h)
              </button>

              <button
                onClick={() => {
                  setShowSnoozeModal(false);
                  setSelectedAlert(null);
                }}
                className="w-full px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors"
              >
                ❌ Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
