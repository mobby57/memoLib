import { oauthService, OAuthServiceError } from '@/lib/oauth/oauth-service';

/**
 * Google Calendar API connector
 * Requires scopes: https://www.googleapis.com/auth/calendar
 */
export class GoogleCalendarConnector {
  async listEvents(accessToken: string, options?: { timeMin?: string; timeMax?: string }) {
    try {
      const params = new URLSearchParams();
      if (options?.timeMin) params.append('timeMin', options.timeMin);
      if (options?.timeMax) params.append('timeMax', options.timeMax);
      params.append('singleEvents', 'true');
      params.append('orderBy', 'startTime');

      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      return data.items || [];
    } catch (e: any) {
      throw new OAuthServiceError('google', `Calendar listEvents failed: ${e.message}`);
    }
  }

  async createEvent(
    accessToken: string,
    event: {
      summary: string;
      description?: string;
      start: { dateTime: string; timeZone: string };
      end: { dateTime: string; timeZone: string };
      attendees?: { email: string; displayName?: string }[];
    }
  ) {
    try {
      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: any) {
      throw new OAuthServiceError('google', `Calendar createEvent failed: ${e.message}`);
    }
  }
}

/**
 * Google Contacts API connector
 * Requires scopes: https://www.googleapis.com/auth/contacts
 */
export class GoogleContactsConnector {
  async listContacts(accessToken: string) {
    try {
      const res = await fetch(
        'https://www.googleapis.com/people/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      return data.connections || [];
    } catch (e: any) {
      throw new OAuthServiceError('google', `Contacts listContacts failed: ${e.message}`);
    }
  }
}

/**
 * Microsoft Graph Calendar connector
 * Requires scopes: Calendars.Read, Calendars.ReadWrite
 */
export class MicrosoftCalendarConnector {
  async listEvents(
    accessToken: string,
    options?: { startDateTime?: string; endDateTime?: string }
  ) {
    try {
      const params = new URLSearchParams();
      if (options?.startDateTime) params.append('startDateTime', options.startDateTime);
      if (options?.endDateTime) params.append('endDateTime', options.endDateTime);

      const res = await fetch(
        `https://graph.microsoft.com/v1.0/me/calendar/events?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      return data.value || [];
    } catch (e: any) {
      throw new OAuthServiceError('microsoft', `Calendar listEvents failed: ${e.message}`);
    }
  }

  async createEvent(
    accessToken: string,
    event: {
      subject: string;
      bodyPreview?: string;
      start: { dateTime: string; timeZone: string };
      end: { dateTime: string; timeZone: string };
      attendees?: { emailAddress: { address: string; name: string }; type: string }[];
    }
  ) {
    try {
      const res = await fetch('https://graph.microsoft.com/v1.0/me/calendar/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: any) {
      throw new OAuthServiceError('microsoft', `Calendar createEvent failed: ${e.message}`);
    }
  }
}

/**
 * Microsoft Graph Contacts connector
 * Requires scopes: Contacts.Read
 */
export class MicrosoftContactsConnector {
  async listContacts(accessToken: string) {
    try {
      const res = await fetch('https://graph.microsoft.com/v1.0/me/contacts?$top=999', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      return data.value || [];
    } catch (e: any) {
      throw new OAuthServiceError('microsoft', `Contacts listContacts failed: ${e.message}`);
    }
  }
}

/**
 * Factory for creating service connectors
 */
export class IntegrationConnectorFactory {
  static getGoogleCalendar() {
    return new GoogleCalendarConnector();
  }

  static getGoogleContacts() {
    return new GoogleContactsConnector();
  }

  static getMicrosoftCalendar() {
    return new MicrosoftCalendarConnector();
  }

  static getMicrosoftContacts() {
    return new MicrosoftContactsConnector();
  }
}
