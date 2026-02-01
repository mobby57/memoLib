/**
 * AuditTimeline Component
 *
 * Affiche la timeline chronologique des événements pour une entité
 * Implémentation UI pour RULE-005 (exhaustivité) et RULE-006 (checksums)
 */

'use client';

import { EventType } from '@prisma/client';
import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Shield,
  User,
  Users,
  XCircle,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface TimelineEvent {
  id: string;
  timestamp: Date | string;
  eventType: EventType;
  entityType: string;
  entityId: string;
  actorType: 'USER' | 'SYSTEM' | 'AI';
  actorId: string | null;
  metadata: any;
  checksum: string;
}

interface AuditTimelineProps {
  entityType: string;
  entityId: string;
  className?: string;
}

// ============================================
// HELPERS
// ============================================

const EVENT_ICONS: Record<string, any> = {
  FLOW_RECEIVED: FileText,
  FLOW_NORMALIZED: CheckCircle,
  FLOW_CLASSIFIED: CheckCircle,
  USER_VALIDATED_SUGGESTION: User,
  USER_REJECTED_SUGGESTION: XCircle,
  USER_ASSIGNED_FLOW: Users,
  DUPLICATE_DETECTED: AlertCircle,
  ACCESS_VIEWED_FLOW: Shield,
  ACCESS_DOWNLOADED_ATTACHMENT: FileText,
  DEFAULT: Clock,
};

const EVENT_COLORS: Record<string, string> = {
  FLOW_RECEIVED: 'text-blue-500 bg-blue-50',
  FLOW_NORMALIZED: 'text-green-500 bg-green-50',
  USER_VALIDATED_SUGGESTION: 'text-purple-500 bg-purple-50',
  USER_REJECTED_SUGGESTION: 'text-red-500 bg-red-50',
  DUPLICATE_DETECTED: 'text-orange-500 bg-orange-50',
  ACCESS_VIEWED_FLOW: 'text-gray-500 bg-gray-50',
  DEFAULT: 'text-gray-400 bg-gray-50',
};

const EVENT_LABELS: Record<string, string> = {
  FLOW_RECEIVED: 'Flux reçu',
  FLOW_NORMALIZED: 'Flux normalisé',
  FLOW_CLASSIFIED: 'Flux classifié',
  USER_VALIDATED_SUGGESTION: 'Suggestion validée',
  USER_REJECTED_SUGGESTION: 'Suggestion rejetée',
  USER_ASSIGNED_FLOW: 'Flux assigné',
  USER_ASSIGNED_DOSSIER: 'Dossier assigné',
  DUPLICATE_DETECTED: 'Doublon détecté',
  DUPLICATE_MERGED: 'Doublons fusionnés',
  DUPLICATE_DISMISSED: 'Doublon ignoré',
  USER_ADDED_COMMENT: 'Commentaire ajouté',
  ACCESS_LOGIN: 'Connexion',
  ACCESS_LOGOUT: 'Déconnexion',
  ACCESS_VIEWED_FLOW: 'Flux consulté',
  ACCESS_DOWNLOADED_ATTACHMENT: 'Pièce jointe téléchargée',
  ACCESS_EXPORTED_AUDIT: 'Audit exporté',
  ACCESS_FORBIDDEN: 'Accès refusé',
  SYSTEM_ERROR: 'Erreur système',
  WORKFLOW_STARTED: 'Workflow démarré',
  WORKFLOW_COMPLETED: 'Workflow terminé',
  WORKFLOW_FAILED: 'Workflow échoué',
};

function formatTimestamp(timestamp: Date | string): string {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date);
}

// ============================================
// COMPONENT
// ============================================

export function AuditTimeline({ entityType, entityId, className = '' }: AuditTimelineProps) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTimeline() {
      try {
        setLoading(true);
        const res = await fetch(`/api/audit/timeline/${entityType}/${entityId}?limit=100`);

        if (!res.ok) {
          throw new Error('Erreur chargement timeline');
        }

        const data = await res.json();
        setTimeline(data.timeline || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTimeline();
  }, [entityType, entityId]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <Clock className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Chargement timeline...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-500 py-4 ${className}`}>
        <AlertCircle className="inline-block w-5 h-5 mr-2" />
        {error}
      </div>
    );
  }

  if (timeline.length === 0) {
    return <div className={`text-gray-500 py-4 ${className}`}>Aucun événement enregistré.</div>;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900">
        Timeline ({timeline.length} événements)
      </h3>

      <div className="relative">
        {/* Ligne verticale */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Événements */}
        <div className="space-y-6">
          {timeline.map((event, index) => {
            const Icon = EVENT_ICONS[event.eventType] || EVENT_ICONS.DEFAULT;
            const colorClass = EVENT_COLORS[event.eventType] || EVENT_COLORS.DEFAULT;
            const label = EVENT_LABELS[event.eventType] || event.eventType;

            return (
              <div key={event.id} className="relative flex items-start">
                {/* Icône */}
                <div
                  className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full ${colorClass}`}
                >
                  <Icon className="w-6 h-6" />
                </div>

                {/* Contenu */}
                <div className="ml-4 flex-1">
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{label}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatTimestamp(event.timestamp)}
                        </p>
                      </div>

                      {/* Actor badge */}
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          event.actorType === 'USER'
                            ? 'bg-blue-100 text-blue-700'
                            : event.actorType === 'AI'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {event.actorType}
                      </span>
                    </div>

                    {/* Métadonnées */}
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="mt-3 text-sm text-gray-600">
                        {Object.entries(event.metadata).map(([key, value]) => (
                          <div key={key} className="flex items-start">
                            <span className="font-medium mr-2">{key}:</span>
                            <span className="text-gray-500">
                              {typeof value === 'object'
                                ? JSON.stringify(value, null, 2)
                                : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Checksum (debug) */}
                    <details className="mt-2">
                      <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                        Checksum (intégrité)
                      </summary>
                      <code className="block mt-1 p-2 bg-gray-50 rounded text-xs font-mono text-gray-600 overflow-x-auto">
                        {event.checksum}
                      </code>
                    </details>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
