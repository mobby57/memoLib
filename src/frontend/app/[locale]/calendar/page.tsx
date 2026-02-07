'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader, Plus } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  async function fetchEvents() {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/events');
      const data = await response.json();
      setEvents(data.data || []);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Agenda</h1>
          <p className="text-slate-600 mt-1">Gérez votre calendrier</p>
        </div>
        <Button>
          <Plus size={20} className="mr-2" />
          Nouvel Événement
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-blue-600" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="col-span-2 bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold capitalize">{monthName}</h2>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
                  }
                  className="px-3 py-1 hover:bg-slate-100 rounded"
                >
                  ←
                </button>
                <button
                  onClick={() =>
                    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
                  }
                  className="px-3 py-1 hover:bg-slate-100 rounded"
                >
                  →
                </button>
              </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                <div key={day} className="text-center text-sm font-semibold text-slate-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-2">
              {emptyDays.map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {days.map(day => (
                <button
                  key={day}
                  className="aspect-square p-2 rounded-lg border border-slate-200 hover:bg-blue-50 text-sm font-medium text-slate-900"
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Events List */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Événements</h3>
            <div className="space-y-3">
              {events.slice(0, 5).map(event => (
                <div key={event.id} className="p-3 bg-blue-50 rounded-lg text-sm">
                  <p className="font-medium text-slate-900 truncate">{event.title}</p>
                  <p className="text-xs text-slate-600">
                    {new Date(event.startDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
