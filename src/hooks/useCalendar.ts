'use client';

import type { CalendarEvent, CalendarProvider } from '@/lib/calendar/calendar-service';
import { useCallback, useEffect, useState } from 'react';

type UseCalendarOptions = {
  tenantId: string;
  autoFetch?: boolean;
};

export function useCalendar({ tenantId, autoFetch = true }: UseCalendarOptions) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/calendar/sync?tenantId=${encodeURIComponent(tenantId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setEvents(data.events || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const sync = useCallback(
    async (provider: CalendarProvider = 'ical', token?: string) => {
      if (!tenantId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/calendar/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantId, provider, token }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Sync error');
        setEvents(data.events || []);
        return data;
      } catch (e: any) {
        setError(e.message);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [tenantId]
  );

  const getIcsUrl = useCallback(() => {
    if (!tenantId) return '';
    return `/api/calendar/ics?tenantId=${encodeURIComponent(tenantId)}`;
  }, [tenantId]);

  useEffect(() => {
    if (autoFetch) fetchEvents();
  }, [autoFetch, fetchEvents]);

  return { events, loading, error, fetchEvents, sync, getIcsUrl };
}
