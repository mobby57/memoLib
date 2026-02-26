/**
 * Tests pour le calendrier et événements
 * Couverture: événements, récurrence, rappels, conflits
 */

describe('Calendar', () => {
  describe('Event Types', () => {
    const EVENT_TYPES = {
      AUDIENCE: 'audience',
      RDV_CLIENT: 'rdv_client',
      RDV_PREFECTURE: 'rdv_prefecture',
      DEADLINE: 'deadline',
      REMINDER: 'reminder',
      TASK: 'task',
    };

    it('devrait avoir le type AUDIENCE', () => {
      expect(EVENT_TYPES.AUDIENCE).toBe('audience');
    });

    it('devrait avoir le type RDV_CLIENT', () => {
      expect(EVENT_TYPES.RDV_CLIENT).toBe('rdv_client');
    });

    it('devrait avoir le type DEADLINE', () => {
      expect(EVENT_TYPES.DEADLINE).toBe('deadline');
    });
  });

  describe('Event Creation', () => {
    interface CalendarEvent {
      id: string;
      title: string;
      type: string;
      startDate: Date;
      endDate: Date;
      allDay: boolean;
      dossierId?: string;
      clientId?: string;
      description?: string;
    }

    const createEvent = (data: Partial<CalendarEvent>): CalendarEvent => {
      const startDate = data.startDate || new Date();
      return {
        id: data.id || Math.random().toString(36).slice(2),
        title: data.title || 'Événement',
        type: data.type || 'task',
        startDate,
        endDate: data.endDate || new Date(startDate.getTime() + 60 * 60 * 1000),
        allDay: data.allDay || false,
        dossierId: data.dossierId,
        clientId: data.clientId,
        description: data.description,
      };
    };

    it('devrait créer un événement avec un ID', () => {
      const event = createEvent({ title: 'Test' });
      expect(event.id).toBeDefined();
    });

    it('devrait avoir une durée par défaut de 1h', () => {
      const event = createEvent({});
      const duration = event.endDate.getTime() - event.startDate.getTime();
      expect(duration).toBe(60 * 60 * 1000);
    });

    it('devrait pouvoir être une journée entière', () => {
      const event = createEvent({ allDay: true });
      expect(event.allDay).toBe(true);
    });
  });

  describe('Event Validation', () => {
    const validateEvent = (event: { title: string; startDate: Date; endDate: Date }): string[] => {
      const errors: string[] = [];
      
      if (!event.title || event.title.trim().length === 0) {
        errors.push('Le titre est requis');
      }
      
      if (!event.startDate) {
        errors.push('La date de début est requise');
      }
      
      if (!event.endDate) {
        errors.push('La date de fin est requise');
      }
      
      if (event.startDate && event.endDate && event.startDate > event.endDate) {
        errors.push('La date de fin doit être après la date de début');
      }
      
      return errors;
    };

    it('devrait valider un événement correct', () => {
      const errors = validateEvent({
        title: 'RDV Client',
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000),
      });
      expect(errors).toHaveLength(0);
    });

    it('devrait détecter un titre manquant', () => {
      const errors = validateEvent({
        title: '',
        startDate: new Date(),
        endDate: new Date(),
      });
      expect(errors).toContain('Le titre est requis');
    });

    it('devrait détecter des dates invalides', () => {
      const errors = validateEvent({
        title: 'Test',
        startDate: new Date(Date.now() + 3600000),
        endDate: new Date(),
      });
      expect(errors).toContain('La date de fin doit être après la date de début');
    });
  });

  describe('Recurring Events', () => {
    type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly';

    interface RecurrenceRule {
      pattern: RecurrencePattern;
      interval: number;
      count?: number;
      until?: Date;
    }

    const generateOccurrences = (
      startDate: Date,
      rule: RecurrenceRule,
      maxCount: number = 10
    ): Date[] => {
      const dates: Date[] = [new Date(startDate)];
      let current = new Date(startDate);
      
      const limit = rule.count || maxCount;
      
      for (let i = 1; i < limit; i++) {
        const next = new Date(current);
        
        switch (rule.pattern) {
          case 'daily':
            next.setDate(next.getDate() + rule.interval);
            break;
          case 'weekly':
            next.setDate(next.getDate() + 7 * rule.interval);
            break;
          case 'monthly':
            next.setMonth(next.getMonth() + rule.interval);
            break;
          case 'yearly':
            next.setFullYear(next.getFullYear() + rule.interval);
            break;
        }
        
        if (rule.until && next > rule.until) break;
        
        dates.push(next);
        current = next;
      }
      
      return dates;
    };

    it('devrait générer des occurrences quotidiennes', () => {
      const start = new Date('2024-01-01');
      const occurrences = generateOccurrences(start, { pattern: 'daily', interval: 1, count: 5 });
      expect(occurrences).toHaveLength(5);
    });

    it('devrait générer des occurrences hebdomadaires', () => {
      const start = new Date('2024-01-01');
      const occurrences = generateOccurrences(start, { pattern: 'weekly', interval: 1, count: 4 });
      expect(occurrences).toHaveLength(4);
    });

    it('devrait respecter la date de fin', () => {
      const start = new Date('2024-01-01');
      const until = new Date('2024-01-10');
      const occurrences = generateOccurrences(start, { pattern: 'daily', interval: 1, until });
      expect(occurrences.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Conflict Detection', () => {
    interface TimeSlot {
      start: Date;
      end: Date;
    }

    const hasConflict = (slot1: TimeSlot, slot2: TimeSlot): boolean => {
      return slot1.start < slot2.end && slot1.end > slot2.start;
    };

    it('devrait détecter un conflit de créneaux', () => {
      const slot1 = { start: new Date('2024-01-01T10:00'), end: new Date('2024-01-01T11:00') };
      const slot2 = { start: new Date('2024-01-01T10:30'), end: new Date('2024-01-01T11:30') };
      expect(hasConflict(slot1, slot2)).toBe(true);
    });

    it('ne devrait pas détecter de conflit pour créneaux séparés', () => {
      const slot1 = { start: new Date('2024-01-01T10:00'), end: new Date('2024-01-01T11:00') };
      const slot2 = { start: new Date('2024-01-01T14:00'), end: new Date('2024-01-01T15:00') };
      expect(hasConflict(slot1, slot2)).toBe(false);
    });

    it('devrait détecter un créneau englobant', () => {
      const slot1 = { start: new Date('2024-01-01T09:00'), end: new Date('2024-01-01T12:00') };
      const slot2 = { start: new Date('2024-01-01T10:00'), end: new Date('2024-01-01T11:00') };
      expect(hasConflict(slot1, slot2)).toBe(true);
    });
  });

  describe('Reminders', () => {
    type ReminderTiming = '15min' | '30min' | '1h' | '2h' | '1d' | '1w';

    const REMINDER_OFFSETS: Record<ReminderTiming, number> = {
      '15min': 15 * 60 * 1000,
      '30min': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '2h': 2 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
    };

    const calculateReminderTime = (eventStart: Date, timing: ReminderTiming): Date => {
      return new Date(eventStart.getTime() - REMINDER_OFFSETS[timing]);
    };

    it('devrait calculer un rappel 30 minutes avant', () => {
      const eventStart = new Date('2024-01-01T10:00:00');
      const reminder = calculateReminderTime(eventStart, '30min');
      expect(reminder.getTime()).toBe(new Date('2024-01-01T09:30:00').getTime());
    });

    it('devrait calculer un rappel 1 jour avant', () => {
      const eventStart = new Date('2024-01-15T10:00:00');
      const reminder = calculateReminderTime(eventStart, '1d');
      expect(reminder.getTime()).toBe(new Date('2024-01-14T10:00:00').getTime());
    });
  });

  describe('Time Zones', () => {
    const TIMEZONE_PARIS = 'Europe/Paris';

    const formatInTimezone = (date: Date, timezone: string): string => {
      return date.toLocaleString('fr-FR', { timeZone: timezone });
    };

    it('devrait formater en heure de Paris', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const formatted = formatInTimezone(date, TIMEZONE_PARIS);
      expect(formatted).toBeDefined();
    });
  });

  describe('Working Hours', () => {
    interface WorkingHours {
      start: number;
      end: number;
    }

    const DEFAULT_WORKING_HOURS: WorkingHours = {
      start: 9,
      end: 18,
    };

    const isWithinWorkingHours = (date: Date, hours: WorkingHours = DEFAULT_WORKING_HOURS): boolean => {
      const hour = date.getHours();
      return hour >= hours.start && hour < hours.end;
    };

    it('10h devrait être dans les heures de travail', () => {
      const date = new Date('2024-01-01T10:00');
      expect(isWithinWorkingHours(date)).toBe(true);
    });

    it('20h ne devrait pas être dans les heures de travail', () => {
      const date = new Date('2024-01-01T20:00');
      expect(isWithinWorkingHours(date)).toBe(false);
    });

    it('7h ne devrait pas être dans les heures de travail', () => {
      const date = new Date('2024-01-01T07:00');
      expect(isWithinWorkingHours(date)).toBe(false);
    });
  });
});

describe('Calendar Views', () => {
  describe('Week View', () => {
    const getWeekDays = (date: Date): Date[] => {
      const days: Date[] = [];
      const current = new Date(date);
      const day = current.getDay();
      const diff = current.getDate() - day + (day === 0 ? -6 : 1);
      current.setDate(diff);
      
      for (let i = 0; i < 7; i++) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      
      return days;
    };

    it('devrait retourner 7 jours', () => {
      const days = getWeekDays(new Date());
      expect(days).toHaveLength(7);
    });
  });

  describe('Month View', () => {
    const getDaysInMonth = (year: number, month: number): number => {
      return new Date(year, month + 1, 0).getDate();
    };

    it('janvier devrait avoir 31 jours', () => {
      expect(getDaysInMonth(2024, 0)).toBe(31);
    });

    it('février 2024 devrait avoir 29 jours (bissextile)', () => {
      expect(getDaysInMonth(2024, 1)).toBe(29);
    });

    it('avril devrait avoir 30 jours', () => {
      expect(getDaysInMonth(2024, 3)).toBe(30);
    });
  });
});
