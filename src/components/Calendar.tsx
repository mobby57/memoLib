'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Users, FileText } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  type: 'echeance' | 'rendez-vous' | 'audience' | 'autre';
  description?: string;
  client?: string;
  dossier?: string;
  location?: string;
  participants?: string[];
  color?: string;
}

interface CalendarProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onAddEvent?: () => void;
}

export function Calendar({ events, onEventClick, onDateClick, onAddEvent }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const getMonthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    // Jours du mois précédent
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Jours du mois actuel
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  }, [currentDate]);

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    return events.filter(event => 
      event.date.getDate() === date.getDate() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getFullYear() === date.getFullYear()
    );
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'echeance': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-700';
      case 'rendez-vous': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700';
      case 'audience': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300 dark:border-purple-700';
      case 'autre': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300 border-gray-300 dark:border-gray-700';
    }
  };

  const getEventTypeIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'echeance': return Clock;
      case 'rendez-vous': return Users;
      case 'audience': return FileText;
      case 'autre': return MapPin;
    }
  };

  return (
    <div className="space-y-4">
      {/* En-tête du calendrier */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Mois précédent"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Mois suivant"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Boutons de vue et ajout */}
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['month', 'week', 'day'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  view === v
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {v === 'month' ? 'Mois' : v === 'week' ? 'Semaine' : 'Jour'}
              </button>
            ))}
          </div>
          
          {onAddEvent && (
            <button
              onClick={onAddEvent}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          )}
        </div>
      </div>

      {/* Grille du calendrier */}
      {view === 'month' && (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
            {/* En-têtes des jours */}
            {dayNames.map(day => (
              <div
                key={day}
                className="bg-gray-50 dark:bg-gray-800 p-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                {day}
              </div>
            ))}

            {/* Jours du mois */}
            {getMonthDays.map((date, index) => {
              const dayEvents = getEventsForDate(date);
              const today = isToday(date);

              return (
                <div
                  key={index}
                  onClick={() => date && onDateClick?.(date)}
                  className={`min-h-[120px] bg-white dark:bg-gray-900 p-2 ${
                    date ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'
                  } transition-colors`}
                >
                  {date && (
                    <>
                      <div className={`text-sm font-medium mb-1 ${
                        today
                          ? 'inline-flex items-center justify-center w-7 h-7 bg-blue-600 text-white rounded-full'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {date.getDate()}
                      </div>
                      
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map(event => {
                          const Icon = getEventTypeIcon(event.type);
                          return (
                            <div
                              key={event.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onEventClick?.(event);
                              }}
                              className={`text-xs p-1.5 rounded border-l-2 ${getEventTypeColor(event.type)} cursor-pointer hover:shadow-sm transition-shadow`}
                            >
                              <div className="flex items-center gap-1">
                                <Icon className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate font-medium">{event.title}</span>
                              </div>
                              {event.startTime && (
                                <div className="text-xs opacity-75 mt-0.5">
                                  {event.startTime}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 pl-1.5">
                            +{dayEvents.length - 3} autre{dayEvents.length - 3 > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Vue liste pour semaine/jour (simplifié) */}
      {(view === 'week' || view === 'day') && (
        <Card className="p-4">
          <div className="space-y-3">
            {events
              .filter(event => {
                if (view === 'day') {
                  return isToday(event.date);
                }
                // Pour la semaine, afficher les 7 prochains jours
                const weekFromNow = new Date();
                weekFromNow.setDate(weekFromNow.getDate() + 7);
                return event.date >= new Date() && event.date <= weekFromNow;
              })
              .sort((a, b) => a.date.getTime() - b.date.getTime())
              .map(event => {
                const Icon = getEventTypeIcon(event.type);
                return (
                  <div
                    key={event.id}
                    onClick={() => onEventClick?.(event)}
                    className={`p-4 rounded-lg border-l-4 ${getEventTypeColor(event.type)} cursor-pointer hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {event.title}
                          </h3>
                          {event.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {event.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {event.date.toLocaleDateString('fr-FR')}
                              {event.startTime && ` à ${event.startTime}`}
                            </span>
                            {event.client && (
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {event.client}
                              </span>
                            )}
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            {events.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Aucun événement prévu
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

// Mini calendrier pour sidebar/widgets
export function MiniCalendar({ events, onDateClick }: Pick<CalendarProps, 'events' | 'onDateClick'>) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const dayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  
  const monthNames = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
    'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
  ];

  const getMonthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  }, [currentDate]);

  const hasEvents = (date: Date | null) => {
    if (!date) return false;
    return events.some(event => 
      event.date.getDate() === date.getDate() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getFullYear() === date.getFullYear()
    );
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
            {day}
          </div>
        ))}
        {getMonthDays.map((date, idx) => (
          <button
            key={idx}
            onClick={() => date && onDateClick?.(date)}
            disabled={!date}
            className={`aspect-square text-sm rounded-md transition-colors ${
              !date
                ? 'invisible'
                : isToday(date)
                ? 'bg-blue-600 text-white font-semibold'
                : hasEvents(date)
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            {date?.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
}
