'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { Calendar, CalendarEvent } from '@/components/Calendar';
import { Button, Input } from '@/components/forms';
import { Modal } from '@/components/forms/Modal';
import { Alert, Breadcrumb } from '@/components/ui';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Calendar as CalendarIcon, Clock, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const eventSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  date: z.string().min(1, 'La date est requise'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  type: z.enum(['echeance', 'rendez-vous', 'audience', 'autre']),
  description: z.string().optional(),
  client: z.string().optional(),
  dossier: z.string().optional(),
  location: z.string().optional(),
  reminder: z.enum(['none', '15min', '1hour', '1day', '1week']).optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

export default function CalendrierPage() {
  const { showToast } = useToast();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les événements depuis l'API
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/calendar');
      if (res.ok) {
        const data = await res.json();
        const mapped = (data.events || data || []).map((e: any) => ({
          id: e.id,
          title: e.title || e.titre || '',
          date: new Date(e.startDate || e.date || e.start),
          startTime: e.startTime || (e.startDate ? new Date(e.startDate).toTimeString().slice(0, 5) : undefined),
          endTime: e.endTime || (e.endDate ? new Date(e.endDate).toTimeString().slice(0, 5) : undefined),
          type: e.type || e.eventType || 'autre',
          description: e.description || '',
          dossier: e.dossier?.numero || e.dossierId || '',
          client: e.client?.nom || e.clientId || '',
          location: e.location || e.lieu || '',
        }));
        setEvents(mapped);
      } else {
        setEvents([]);
      }
    } catch {
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      type: 'rendez-vous',
      reminder: 'none',
    },
  });

  const handleAddEvent = () => {
    reset();
    setIsModalOpen(true);
  };

  const handleDateClick = (date: Date) => {
    reset({ date: date.toISOString().split('T')[0] });
    setIsModalOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventDetailOpen(true);
  };

  const onSubmit = (data: EventFormData) => {
    const eventData: CalendarEvent = {
      id: isEditing && editingEventId ? editingEventId : `event-${Date.now()}`,
      title: data.title,
      date: new Date(data.date + (data.startTime ? `T${data.startTime}` : '')),
      startTime: data.startTime,
      endTime: data.endTime,
      type: data.type,
      description: data.description,
      client: data.client,
      dossier: data.dossier,
      location: data.location,
    };

    try {
      if (isEditing && editingEventId) {
        const res = await fetch(`/api/calendar?eventId=${editingEventId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: data.title,
            startDate: eventData.date.toISOString(),
            endDate: data.endTime ? new Date(data.date + `T${data.endTime}`).toISOString() : undefined,
            type: data.type,
            description: data.description,
            location: data.location,
          }),
        });
        if (!res.ok) throw new Error('Erreur modification');
        showToast('Événement modifié avec succès', 'success');
      } else {
        const res = await fetch('/api/calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: data.title,
            startDate: eventData.date.toISOString(),
            endDate: data.endTime ? new Date(data.date + `T${data.endTime}`).toISOString() : undefined,
            type: data.type,
            description: data.description,
            location: data.location,
            clientId: data.client || undefined,
            dossierId: data.dossier || undefined,
          }),
        });
        if (!res.ok) throw new Error('Erreur création');
        showToast('Événement ajouté avec succès', 'success');
      }
      await fetchEvents();
    } catch {
      showToast('Erreur lors de la sauvegarde', 'error');
    }

    setIsModalOpen(false);
    setIsEditing(false);
    setEditingEventId(null);
    reset();
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setIsEditing(true);
    setEditingEventId(event.id);
    reset({
      title: event.title,
      date: event.date.toISOString().split('T')[0],
      startTime: event.startTime,
      endTime: event.endTime,
      type: event.type,
      description: event.description,
      client: event.client,
      dossier: event.dossier,
      location: event.location,
    });
    setIsEventDetailOpen(false);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cet événement ?')) return;
    try {
      const res = await fetch(`/api/calendar?eventId=${eventId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur suppression');
      showToast('Événement supprimé', 'success');
      await fetchEvents();
    } catch {
      showToast('Erreur lors de la suppression', 'error');
    }
    setIsEventDetailOpen(false);
  };

  // Statistiques
  const upcomingEvents = events.filter(e => e.date >= new Date()).length;
  const echeances = events.filter(e => e.type === 'echeance' && e.date >= new Date()).length;
  const urgentEvents = events.filter(e => {
    const diff = e.date.getTime() - new Date().getTime();
    const daysUntil = diff / (1000 * 60 * 60 * 24);
    return daysUntil <= 3 && daysUntil >= 0;
  }).length;

  const nextEvent = events
    .filter(e => e.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Calendrier', href: '/calendrier' },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Calendrier & echeances
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gérez vos rendez-vous, audiences et echeances juridiques
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {upcomingEvents}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">événements a venir</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Clock className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{echeances}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">echeances</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{urgentEvents}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Urgents (3j)</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                Prochain événement
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {nextEvent ? (
                  <>
                    {nextEvent.title}
                    <br />
                    {nextEvent.date.toLocaleDateString('fr-FR')}
                  </>
                ) : (
                  'Aucun événement'
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {urgentEvents > 0 && (
        <Alert variant="warning" className="mb-6">
          <AlertTriangle className="h-5 w-5" />
          Vous avez <strong>{urgentEvents}</strong> événement{urgentEvents > 1 ? 's' : ''} urgent
          {urgentEvents > 1 ? 's' : ''} dans les 3 prochains jours !
        </Alert>
      )}

      {/* Calendrier principal */}
      <Calendar
        events={events}
        onEventClick={handleEventClick}
        onDateClick={handleDateClick}
        onAddEvent={handleAddEvent}
      />

      {/* Modal d'ajout d'événement */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Ajouter un événement"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Titre *"
            {...register('title')}
            error={errors.title?.message}
            placeholder="Ex: Rendez-vous client, echeance..."
          />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Date *" type="date" {...register('date')} error={errors.date?.message} />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type *
              </label>
              <select
                {...register('type')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="rendez-vous">Rendez-vous</option>
                <option value="echeance">echeance</option>
                <option value="audience">Audience</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Heure de debut" type="time" {...register('startTime')} />

            <Input label="Heure de fin" type="time" {...register('endTime')} />
          </div>

          <Input label="Client" {...register('client')} placeholder="Nom du client" />

          <Input label="Dossier" {...register('dossier')} placeholder="Reference du dossier" />

          <Input label="Lieu" {...register('location')} placeholder="Cabinet, Tribunal..." />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Details supplémentaires..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rappel
            </label>
            <select
              {...register('reminder')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="none">Aucun rappel</option>
              <option value="15min">15 minutes avant</option>
              <option value="1hour">1 heure avant</option>
              <option value="1day">1 jour avant</option>
              <option value="1week">1 semaine avant</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">Ajouter l'événement</Button>
          </div>
        </form>
      </Modal>

      {/* Modal details événement */}
      {selectedEvent && (
        <Modal
          isOpen={isEventDetailOpen}
          onClose={() => setIsEventDetailOpen(false)}
          title="Details de l'événement"
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {selectedEvent.title}
              </h3>
              <span
                className={`inline-block px-3 py-1 text-sm rounded-full ${
                  selectedEvent.type === 'echeance'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    : selectedEvent.type === 'rendez-vous'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : selectedEvent.type === 'audience'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                }`}
              >
                {selectedEvent.type === 'echeance'
                  ? 'echeance'
                  : selectedEvent.type === 'rendez-vous'
                    ? 'Rendez-vous'
                    : selectedEvent.type === 'audience'
                      ? 'Audience'
                      : 'Autre'}
              </span>
            </div>

            {selectedEvent.description && (
              <p className="text-gray-600 dark:text-gray-400">{selectedEvent.description}</p>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <span>
                  {selectedEvent.date.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>

              {selectedEvent.startTime && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>
                    {selectedEvent.startTime}
                    {selectedEvent.endTime && ` - ${selectedEvent.endTime}`}
                  </span>
                </div>
              )}

              {selectedEvent.client && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Client:</span>
                  <span className="font-medium">{selectedEvent.client}</span>
                </div>
              )}

              {selectedEvent.dossier && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Dossier:</span>
                  <span className="font-medium">{selectedEvent.dossier}</span>
                </div>
              )}

              {selectedEvent.location && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Lieu:</span>
                  <span>{selectedEvent.location}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="secondary" onClick={() => setIsEventDetailOpen(false)}>
                Fermer
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  if (selectedEvent) handleEditEvent(selectedEvent);
                }}
              >
                Modifier
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleDeleteEvent(selectedEvent.id)}
                className="!bg-red-600 !hover:bg-red-700 !text-white"
              >
                Supprimer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
