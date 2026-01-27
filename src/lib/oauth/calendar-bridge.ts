import type { CalendarEvent } from '@/lib/calendar/calendar-service';
import { IntegrationConnectorFactory } from '@/lib/oauth/integrations';

/**
 * Bridge between external calendar APIs and IaPosteManager CalendarService
 * Handles syncing events from Google/Microsoft calendars
 */
export class ExternalCalendarBridge {
  /**
   * Sync events from Google Calendar to IaPosteManager
   */
  static async syncGoogleCalendar(
    accessToken: string,
    tenantId: string,
    options?: { since?: string; until?: string }
  ): Promise<CalendarEvent[]> {
    const connector = IntegrationConnectorFactory.getGoogleCalendar();
    const events = await connector.listEvents(accessToken, {
      timeMin: options?.since,
      timeMax: options?.until,
    });

    return events.map((event: any) => ({
      id: event.id,
      tenantId,
      title: event.summary,
      description: event.description,
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      location: event.location,
      sourceProvider: 'google' as const,
      sourceId: event.id,
      updatedAt: event.updated,
      attendees: event.attendees?.map((a: any) => ({
        email: a.email,
        name: a.displayName,
        responseStatus: a.responseStatus,
      })),
    }));
  }

  /**
   * Sync events from Microsoft Calendar to IaPosteManager
   */
  static async syncMicrosoftCalendar(
    accessToken: string,
    tenantId: string,
    options?: { since?: string; until?: string }
  ): Promise<CalendarEvent[]> {
    const connector = IntegrationConnectorFactory.getMicrosoftCalendar();
    const events = await connector.listEvents(accessToken, {
      startDateTime: options?.since,
      endDateTime: options?.until,
    });

    return events.map((event: any) => ({
      id: event.id,
      tenantId,
      title: event.subject,
      description: event.bodyPreview,
      start: event.start.dateTime,
      end: event.end.dateTime,
      location: event.locations?.[0]?.displayName,
      sourceProvider: 'microsoft' as const,
      sourceId: event.id,
      updatedAt: event.lastModifiedDateTime,
      attendees: event.attendees?.map((a: any) => ({
        email: a.emailAddress.address,
        name: a.emailAddress.name,
        responseStatus: a.status.response,
      })),
    }));
  }

  /**
   * Sync contacts from Google to dossier clients
   */
  static async syncGoogleContacts(accessToken: string) {
    const connector = IntegrationConnectorFactory.getGoogleContacts();
    const contacts = await connector.listContacts(accessToken);

    return contacts.map((contact: any) => ({
      id: contact.resourceName,
      name: contact.names?.[0]?.displayName,
      email: contact.emailAddresses?.[0]?.value,
      phone: contact.phoneNumbers?.[0]?.value,
      sourceProvider: 'google' as const,
    }));
  }

  /**
   * Sync contacts from Microsoft to dossier clients
   */
  static async syncMicrosoftContacts(accessToken: string) {
    const connector = IntegrationConnectorFactory.getMicrosoftContacts();
    const contacts = await connector.listContacts(accessToken);

    return contacts.map((contact: any) => ({
      id: contact.id,
      name: contact.displayName,
      email: contact.emailAddresses?.[0]?.address,
      phone: contact.mobilePhone || contact.businessPhones?.[0],
      sourceProvider: 'microsoft' as const,
    }));
  }
}
