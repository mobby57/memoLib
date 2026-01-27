export type CalendarProvider = 'google' | 'microsoft' | 'ical';

export type Attendee = {
  email: string;
  name?: string;
  responseStatus?: 'accepted' | 'declined' | 'tentative' | 'needsAction';
};

export type CalendarEvent = {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  start: string; // ISO string
  end: string;   // ISO string
  location?: string;
  attendees?: Attendee[];
  status?: 'confirmed' | 'cancelled' | 'tentative';
  sourceProvider?: CalendarProvider;
  sourceId?: string;
  updatedAt: string; // ISO string
};

type ListOptions = {
  since?: string; // ISO string filter
  until?: string; // ISO string filter
};

class MemoryCalendarStore {
  private store = new Map<string, CalendarEvent[]>(); // key: tenantId

  list(tenantId: string, opts?: ListOptions): CalendarEvent[] {
    const events = this.store.get(tenantId) || [];
    if (!opts) return events;
    const { since, until } = opts;
    return events.filter((e) => {
      const s = Date.parse(e.start);
      const u = Date.parse(e.end);
      const okSince = since ? s >= Date.parse(since) : true;
      const okUntil = until ? u <= Date.parse(until) : true;
      return okSince && okUntil;
    });
  }

  upsert(tenantId: string, event: CalendarEvent) {
    const list = this.store.get(tenantId) || [];
    const idx = list.findIndex((e) => e.id === event.id);
    if (idx >= 0) list[idx] = event; else list.push(event);
    this.store.set(tenantId, list);
  }

  delete(tenantId: string, eventId: string) {
    const list = this.store.get(tenantId) || [];
    this.store.set(tenantId, list.filter((e) => e.id !== eventId));
  }
}

// Provider connectors (stubs, to be implemented with OAuth tokens)
class GoogleCalendarConnector {
  async listEvents(_token: string, _opts?: ListOptions): Promise<CalendarEvent[]> {
    return [];
  }
}

class MicrosoftCalendarConnector {
  async listEvents(_token: string, _opts?: ListOptions): Promise<CalendarEvent[]> {
    return [];
  }
}

export class CalendarService {
  private store = new MemoryCalendarStore();

  listEvents(tenantId: string, opts?: ListOptions) {
    return this.store.list(tenantId, opts);
  }

  upsertEvent(event: CalendarEvent) {
    this.store.upsert(event.tenantId, event);
  }

  deleteEvent(tenantId: string, eventId: string) {
    this.store.delete(tenantId, eventId);
  }

  async sync(tenantId: string, provider: CalendarProvider, token?: string) {
    let externalEvents: CalendarEvent[] = [];
    const opts: ListOptions | undefined = undefined;

    if (provider === 'google' && token) {
      const google = new GoogleCalendarConnector();
      externalEvents = await google.listEvents(token, opts);
    } else if (provider === 'microsoft' && token) {
      const ms = new MicrosoftCalendarConnector();
      externalEvents = await ms.listEvents(token, opts);
    } else if (provider === 'ical') {
      externalEvents = [];
    }

    const nowIso = new Date().toISOString();
    for (const ev of externalEvents) {
      this.store.upsert(tenantId, { ...ev, tenantId, updatedAt: nowIso });
    }

    return {
      provider,
      synced: externalEvents.length,
      events: this.store.list(tenantId),
    };
  }

  generateICS(tenantId: string, events?: CalendarEvent[]): string {
    const list = events ?? this.store.list(tenantId);
    const lines: string[] = [];
    lines.push('BEGIN:VCALENDAR');
    lines.push('VERSION:2.0');
    lines.push('PRODID:-//IaPosteManager//Calendar//FR');

    for (const ev of list) {
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${ev.id}@iapostemanager`);
      lines.push(`DTSTAMP:${this.toIcsDate(ev.updatedAt)}`);
      lines.push(`DTSTART:${this.toIcsDate(ev.start)}`);
      lines.push(`DTEND:${this.toIcsDate(ev.end)}`);
      lines.push(`SUMMARY:${this.escape(ev.title)}`);
      if (ev.description) lines.push(`DESCRIPTION:${this.escape(ev.description)}`);
      if (ev.location) lines.push(`LOCATION:${this.escape(ev.location)}`);
      if (ev.attendees?.length) {
        for (const a of ev.attendees) {
          const cn = a.name ? `;CN=${this.escape(a.name)}` : '';
          lines.push(`ATTENDEE;ROLE=REQ-PARTICIPANT${cn}:MAILTO:${a.email}`);
        }
      }
      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  private toIcsDate(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      d.getUTCFullYear().toString() +
      pad(d.getUTCMonth() + 1) +
      pad(d.getUTCDate()) + 'T' +
      pad(d.getUTCHours()) +
      pad(d.getUTCMinutes()) +
      pad(d.getUTCSeconds()) + 'Z'
    );
  }

  private escape(text: string): string {
    return text.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (m) => '\\' + m);
  }
}

export const calendarService = new CalendarService();
