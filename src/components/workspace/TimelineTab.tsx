'use client';

import { Clock, User, Mail, FileText, AlertTriangle, CheckCircle2, MessageSquare, Calendar, Star } from 'lucide-react';

interface TimelineEvent {
  id: string;
  eventType: string;
  title: string;
  description?: string;
  actorType: 'user' | 'ai' | 'system';
  actorId?: string;
  metadata?: string;
  createdAt: string;
}

interface TimelineTabProps {
  events: TimelineEvent[];
}

export default function TimelineTab({ events }: TimelineTabProps) {
  const eventIcons: Record<string, any> = {
    created: Star,
    email_received: Mail,
    email_sent: Mail,
    procedure_created: FileText,
    procedure_updated: FileText,
    document_added: FileText,
    meeting_scheduled: Calendar,
    deadline_updated: Clock,
    alert_created: AlertTriangle,
    ai_suggestion: MessageSquare,
    status_changed: CheckCircle2,
    default: Clock,
  };

  const eventColors: Record<string, string> = {
    created: 'bg-purple-100 text-purple-600',
    email_received: 'bg-blue-100 text-blue-600',
    email_sent: 'bg-green-100 text-green-600',
    procedure_created: 'bg-indigo-100 text-indigo-600',
    procedure_updated: 'bg-indigo-100 text-indigo-600',
    document_added: 'bg-yellow-100 text-yellow-600',
    meeting_scheduled: 'bg-orange-100 text-orange-600',
    deadline_updated: 'bg-red-100 text-red-600',
    alert_created: 'bg-red-100 text-red-600',
    ai_suggestion: 'bg-purple-100 text-purple-600',
    status_changed: 'bg-green-100 text-green-600',
    default: 'bg-gray-100 text-gray-600',
  };

  const actorLabels: Record<string, string> = {
    user: 'Utilisateur',
    ai: 'IA Poste Manager',
    system: 'Système',
  };

  const actorIcons: Record<string, any> = {
    user: User,
    ai: MessageSquare,
    system: Clock,
  };

  const groupEventsByDate = (events: TimelineEvent[]) => {
    const groups: Record<string, TimelineEvent[]> = {};
    
    events.forEach(event => {
      const date = new Date(event.createdAt).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(event);
    });

    return groups;
  };

  const groupedEvents = groupEventsByDate(events);
  const dates = Object.keys(groupedEvents).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Timeline Complète</h3>
          <p className="text-sm text-gray-600 mt-1">{events.length} événement(s) au total</p>
        </div>

        {/* Filtres */}
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm font-medium">
            Tous
          </button>
          <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
            Emails
          </button>
          <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
            Procédures
          </button>
          <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
            Documents
          </button>
          <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
            IA
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {dates.map((date, dateIndex) => (
          <div key={date} className="mb-8">
            {/* Date Header */}
            <div className="sticky top-0 z-10 bg-gray-50 py-2 mb-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-32">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                    {date}
                  </span>
                </div>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>
            </div>

            {/* Events du jour */}
            <div className="space-y-4">
              {groupedEvents[date].map((event, eventIndex) => {
                const Icon = eventIcons[event.eventType] || eventIcons.default;
                const ActorIcon = actorIcons[event.actorType];
                const colorClass = eventColors[event.eventType] || eventColors.default;

                return (
                  <div key={event.id} className="relative pl-32">
                    {/* Ligne verticale */}
                    {eventIndex !== groupedEvents[date].length - 1 && (
                      <div className="absolute left-14 top-12 bottom-0 w-0.5 bg-gray-200"></div>
                    )}

                    {/* Heure */}
                    <div className="absolute left-0 top-0 w-28 text-right">
                      <span className="text-sm text-gray-500">
                        {new Date(event.createdAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Icône événement */}
                    <div className="absolute left-11 top-0">
                      <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Contenu événement */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{event.title}</h4>
                          {event.description && (
                            <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                          )}
                        </div>

                        {/* Badge acteur */}
                        <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                          <ActorIcon className="w-3 h-3" />
                          <span>{actorLabels[event.actorType]}</span>
                        </div>
                      </div>

                      {/* Métadonnées */}
                      {event.metadata && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <details className="text-xs text-gray-600">
                            <summary className="cursor-pointer hover:text-gray-900">
                              Voir détails
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-50 rounded overflow-x-auto">
                              {JSON.stringify(JSON.parse(event.metadata), null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}

                      {/* Type d'événement */}
                      <div className="mt-2">
                        <span className="text-xs text-gray-500">
                          Type: <span className="font-medium">{event.eventType}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Aucun événement</p>
            <p className="text-sm mt-2">La timeline sera alimentée au fil des actions</p>
          </div>
        )}
      </div>

      {/* Footer stats */}
      {events.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-indigo-600">
                {events.filter(e => e.eventType.includes('email')).length}
              </p>
              <p className="text-xs text-gray-600 mt-1">Emails</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {events.filter(e => e.eventType.includes('procedure')).length}
              </p>
              <p className="text-xs text-gray-600 mt-1">Procédures</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">
                {events.filter(e => e.eventType.includes('document')).length}
              </p>
              <p className="text-xs text-gray-600 mt-1">Documents</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {events.filter(e => e.actorType === 'ai').length}
              </p>
              <p className="text-xs text-gray-600 mt-1">Actions IA</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
