'use client';

import { useEffect, useState } from 'react';
import { Mail, MailOpen, FileText, Clock, AlertTriangle, FolderPlus, Loader2 } from 'lucide-react';

interface TimelineEvent {
  date: string;
  type: 'email_recu' | 'email_envoye' | 'document' | 'deadline' | 'action' | 'creation';
  title: string;
  description: string;
  importance: 'haute' | 'moyenne' | 'basse';
}

const ICONS = {
  email_recu: Mail,
  email_envoye: MailOpen,
  document: FileText,
  deadline: AlertTriangle,
  action: Clock,
  creation: FolderPlus,
};

const COLORS = {
  email_recu: 'bg-blue-100 text-blue-600',
  email_envoye: 'bg-indigo-100 text-indigo-600',
  document: 'bg-emerald-100 text-emerald-600',
  deadline: 'bg-red-100 text-red-600',
  action: 'bg-yellow-100 text-yellow-600',
  creation: 'bg-purple-100 text-purple-600',
};

export function DossierTimeline({ dossierId }: { dossierId: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dossiers/timeline?dossierId=${dossierId}`)
      .then((r) => r.json())
      .then((data) => setEvents(data.timeline || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dossierId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (events.length === 0) {
    return <p className="text-sm text-gray-400 py-4">Aucun événement dans ce dossier.</p>;
  }

  return (
    <div className="relative">
      {/* Ligne verticale */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />

      <div className="space-y-4">
        {events.map((event, i) => {
          const Icon = ICONS[event.type] || Clock;
          const color = COLORS[event.type] || 'bg-gray-100 text-gray-600';

          return (
            <div key={i} className="relative flex gap-4 pl-2">
              <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className={`text-sm font-medium truncate ${event.importance === 'haute' ? 'text-gray-900' : 'text-gray-700'}`}>
                    {event.title}
                  </p>
                  <time className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </time>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
