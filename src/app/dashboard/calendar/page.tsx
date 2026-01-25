'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  type: string;
  status: string;
  user: { name: string; email: string };
  dossier?: { numero: string };
  client?: { firstName: string; lastName: string };
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const tenantId = 'demo-tenant-001';
  const userId = 'demo-user-001';

  const loadEvents = useCallback(async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const res = await fetch(
        `/api/calendar?tenantId=${tenantId}&startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`
      );
      const data = await res.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Erreur chargement evenements:', error);
    } finally {
      setLoading(false);
    }
  }, [currentDate, tenantId]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      rdv: 'bg-blue-500',
      audience: 'bg-red-500',
      deadline: 'bg-orange-500',
      rappel: 'bg-yellow-500',
      autre: 'bg-gray-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      rdv: '',
      audience: '️',
      deadline: '',
      rappel: '',
      autre: '',
    };
    return icons[type] || '';
  };

  // Generer les jours du mois
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];

    // Jours du mois precedent
    const prevMonth = new Date(year, month, 0);
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i),
        isCurrentMonth: false,
      });
    }

    // Jours du mois courant
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Jours du mois suivant
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startDate);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const monthNames = [
    'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre',
  ];

  const navigateMonth = (delta: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">[emoji] Calendrier</h1>
          <p className="text-gray-600">Gerez vos rendez-vous et echeances</p>
        </div>
        <button
          onClick={() => {
            setSelectedDate(new Date());
            setShowNewEvent(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span></span>
          Nouveau RDV
        </button>
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-lg shadow mb-6 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            ️
          </button>
          <h2 className="text-xl font-semibold min-w-[200px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            ️
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 border rounded-lg hover:bg-gray-50"
          >
            Aujourd'hui
          </button>
          <div className="flex border rounded-lg overflow-hidden">
            {(['month', 'week', 'day'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 ${
                  view === v ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50'
                }`}
              >
                {v === 'month' ? 'Mois' : v === 'week' ? 'Semaine' : 'Jour'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Chargement...</div>
        ) : (
          <>
            {/* Jours de la semaine */}
            <div className="grid grid-cols-7 bg-gray-50 border-b">
              {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day) => (
                <div
                  key={day}
                  className="p-3 text-center text-sm font-medium text-gray-500"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Grille des jours */}
            <div className="grid grid-cols-7">
              {getDaysInMonth().map(({ date, isCurrentMonth }, index) => {
                const dayEvents = getEventsForDay(date);
                return (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedDate(date);
                      if (dayEvents.length === 0) setShowNewEvent(true);
                    }}
                    className={`min-h-[120px] border-b border-r p-2 cursor-pointer hover:bg-gray-50 ${
                      !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                    }`}
                  >
                    <div
                      className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
                        isToday(date) ? 'bg-blue-600 text-white' : ''
                      }`}
                    >
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                          }}
                          className={`${getTypeColor(event.type)} text-white text-xs px-2 py-1 rounded truncate cursor-pointer hover:opacity-80`}
                        >
                          {getTypeIcon(event.type)} {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500 px-2">
                          +{dayEvents.length - 3} autres
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Prochains evenements */}
      <div className="mt-6 bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-3">[emoji] Prochains evenements</h3>
        {events
          .filter((e) => new Date(e.startDate) >= new Date())
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
          .slice(0, 5)
          .map((event) => (
            <div
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
            >
              <div
                className={`w-3 h-3 rounded-full ${getTypeColor(event.type)}`}
              />
              <div className="flex-1">
                <p className="font-medium">{event.title}</p>
                <p className="text-sm text-gray-500">
                  {new Date(event.startDate).toLocaleDateString('fr-FR')} a{' '}
                  {new Date(event.startDate).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <span className="text-2xl">{getTypeIcon(event.type)}</span>
            </div>
          ))}
        {events.filter((e) => new Date(e.startDate) >= new Date()).length === 0 && (
          <p className="text-gray-500 text-center py-4">Aucun evenement a venir</p>
        )}
      </div>

      {/* Modal Nouvel evenement */}
      {showNewEvent && (
        <NewEventModal
          tenantId={tenantId}
          userId={userId}
          defaultDate={selectedDate || new Date()}
          onClose={() => {
            setShowNewEvent(false);
            setSelectedDate(null);
          }}
          onCreated={() => {
            setShowNewEvent(false);
            setSelectedDate(null);
            loadEvents();
          }}
        />
      )}

      {/* Modal Detail evenement */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onUpdate={() => {
            setSelectedEvent(null);
            loadEvents();
          }}
        />
      )}
    </div>
  );
}

// Modal Nouvel evenement
function NewEventModal({
  tenantId,
  userId,
  defaultDate,
  onClose,
  onCreated,
}: {
  tenantId: string;
  userId: string;
  defaultDate: Date;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('rdv');
  const [startDate, setStartDate] = useState(
    defaultDate.toISOString().slice(0, 16)
  );
  const [endDate, setEndDate] = useState(
    new Date(defaultDate.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title) {
      alert('Le titre est requis');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          userId,
          title,
          description,
          location,
          type,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
        }),
      });

      if (res.ok) {
        onCreated();
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur creation evenement');
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold"> Nouvel evenement</h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Reunion client, Audience..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="rdv">[emoji] Rendez-vous</option>
              <option value="audience">️ Audience</option>
              <option value="deadline"> echeance</option>
              <option value="rappel">[emoji] Rappel</option>
              <option value="autre">[emoji] Autre</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Debut</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Cabinet, Tribunal..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              placeholder="Notes sur l'evenement..."
            />
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creation...' : 'Creer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal Detail evenement
function EventDetailModal({
  event,
  onClose,
  onUpdate,
}: {
  event: CalendarEvent;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Supprimer cet evenement ?')) return;

    setLoading(true);
    try {
      await fetch(`/api/calendar?eventId=${event.id}`, { method: 'DELETE' });
      onUpdate();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const typeLabels: Record<string, string> = {
    rdv: '[emoji] Rendez-vous',
    audience: '️ Audience',
    deadline: ' echeance',
    rappel: '[emoji] Rappel',
    autre: '[emoji] Autre',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">{event.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            x
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Type:</span>
            <span>{typeLabels[event.type] || event.type}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500"> Date:</span>
            <span>
              {new Date(event.startDate).toLocaleDateString('fr-FR')} de{' '}
              {new Date(event.startDate).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              a{' '}
              {new Date(event.endDate).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {event.location && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500"> Lieu:</span>
              <span>{event.location}</span>
            </div>
          )}

          {event.description && (
            <div>
              <span className="text-gray-500">[emoji] Description:</span>
              <p className="mt-1">{event.description}</p>
            </div>
          )}

          {event.client && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">[emoji] Client:</span>
              <span>
                {event.client.firstName} {event.client.lastName}
              </span>
            </div>
          )}

          {event.dossier && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">[emoji] Dossier:</span>
              <span>{event.dossier.numero}</span>
            </div>
          )}
        </div>

        <div className="p-6 border-t flex justify-between">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
          >
            [emoji]️ Supprimer
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
