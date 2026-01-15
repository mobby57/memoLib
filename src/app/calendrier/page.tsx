'use client';

import { useState } from 'react';
import { Calendar, CalendarEvent, MiniCalendar } from '@/components/Calendar';
import { Breadcrumb, Alert } from '@/components/ui';
import { Modal } from '@/components/forms/Modal';
import { Button, Input } from '@/components/forms';
import { Card } from '@/components/ui/Card';
import { Bell, Calendar as CalendarIcon, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks';

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
  
  // Données d'exemple
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: 'Échéance dépôt conclusions',
      date: new Date(2026, 0, 15, 14, 0),
      startTime: '14:00',
      type: 'echeance',
      description: 'Dépôt des conclusions au greffe',
      dossier: 'DOS-2026-001',
      client: 'Martin Dupont',
    },
    {
      id: '2',
      title: 'Rendez-vous client - Consultation',
      date: new Date(2026, 0, 8, 10, 0),
      startTime: '10:00',
      endTime: '11:00',
      type: 'rendez-vous',
      description: 'Première consultation contentieux commercial',
      client: 'Sophie Bernard',
      location: 'Cabinet - Salle 2',
    },
    {
      id: '3',
      title: 'Audience Tribunal de Commerce',
      date: new Date(2026, 0, 20, 9, 0),
      startTime: '09:00',
      type: 'audience',
      description: 'Affaire n°2025/12345',
      dossier: 'DOS-2025-089',
      client: 'SAS TechCorp',
      location: 'Tribunal de Commerce de Paris - Salle 3',
    },
    {
      id: '4',
      title: 'Signature contrat',
      date: new Date(2026, 0, 5, 15, 30),
      startTime: '15:30',
      type: 'autre',
      client: 'Jean Moreau',
      location: 'Cabinet',
    },
    {
      id: '5',
      title: 'Échéance appel',
      date: new Date(2026, 0, 10),
      type: 'echeance',
      description: 'Dernier jour pour faire appel',
      dossier: 'DOS-2025-156',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      type: 'rendez-vous',
      reminder: 'none',
    }
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
    const newEvent: CalendarEvent = {
      id: `event-${Date.now()}`,
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

    setEvents([...events, newEvent]);
    showToast('Événement ajouté avec succès', 'success');
    setIsModalOpen(false);
    reset();
  };

  const handleDeleteEvent = (eventId: string) => {
    if (confirm('Voulez-vous vraiment supprimer cet événement ?')) {
      setEvents(events.filter(e => e.id !== eventId));
      showToast('Événement supprimé', 'success');
      setIsEventDetailOpen(false);
    }
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
          { label: 'Calendrier', href: '/calendrier' }
        ]}
      />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Calendrier & Échéances
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gérez vos rendez-vous, audiences et échéances juridiques
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
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Événements à venir
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Clock className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {echeances}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Échéances
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {urgentEvents}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Urgents (3j)
              </div>
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
          Vous avez <strong>{urgentEvents}</strong> événement{urgentEvents > 1 ? 's' : ''} urgent{urgentEvents > 1 ? 's' : ''} dans les 3 prochains jours !
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
            placeholder="Ex: Rendez-vous client, Échéance..."
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date *"
              type="date"
              {...register('date')}
              error={errors.date?.message}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type *
              </label>
              <select
                {...register('type')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="rendez-vous">Rendez-vous</option>
                <option value="echeance">Échéance</option>
                <option value="audience">Audience</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Heure de début"
              type="time"
              {...register('startTime')}
            />

            <Input
              label="Heure de fin"
              type="time"
              {...register('endTime')}
            />
          </div>

          <Input
            label="Client"
            {...register('client')}
            placeholder="Nom du client"
          />

          <Input
            label="Dossier"
            {...register('dossier')}
            placeholder="Référence du dossier"
          />

          <Input
            label="Lieu"
            {...register('location')}
            placeholder="Cabinet, Tribunal..."
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Détails supplémentaires..."
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
            <Button type="submit">
              Ajouter l'événement
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal détails événement */}
      {selectedEvent && (
        <Modal
          isOpen={isEventDetailOpen}
          onClose={() => setIsEventDetailOpen(false)}
          title="Détails de l'événement"
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {selectedEvent.title}
              </h3>
              <span className={`inline-block px-3 py-1 text-sm rounded-full ${
                selectedEvent.type === 'echeance' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                selectedEvent.type === 'rendez-vous' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                selectedEvent.type === 'audience' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
              }`}>
                {selectedEvent.type === 'echeance' ? 'Échéance' :
                 selectedEvent.type === 'rendez-vous' ? 'Rendez-vous' :
                 selectedEvent.type === 'audience' ? 'Audience' : 'Autre'}
              </span>
            </div>

            {selectedEvent.description && (
              <p className="text-gray-600 dark:text-gray-400">
                {selectedEvent.description}
              </p>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <span>{selectedEvent.date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
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
              <Button variant="secondary" onClick={() => {
                // TODO: Éditer l'événement
                showToast('Fonctionnalité en développement', 'info');
              }}>
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
