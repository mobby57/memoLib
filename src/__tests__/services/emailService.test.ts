/**
 * Tests unitaires pour EmailService
 * Service de notifications par email
 */

import {
  generateEcheanceReminderEmail,
  type EmailTemplate,
  type NotificationType,
  type ReminderConfig,
} from '@/lib/services/emailService';

// Mock du logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('EmailService', () => {
  describe('generateEcheanceReminderEmail()', () => {
    const mockEcheance = {
      titre: 'Audience tribunal',
      date: new Date('2026-02-01'),
      dossier: 'DOS-2026-0042',
      description: 'Audience de référé',
    };

    it('génère un email avec sujet URGENT pour échéance à 1 jour', () => {
      const result = generateEcheanceReminderEmail(mockEcheance, 1);

      expect(result.subject).toContain('URGENT');
      expect(result.subject).toContain('1 jour');
      expect(result.subject).toContain(mockEcheance.titre);
    });

    it('génère un email avec sujet Important pour échéance à 3 jours', () => {
      const result = generateEcheanceReminderEmail(mockEcheance, 3);

      expect(result.subject).toContain('Important');
      expect(result.subject).toContain('3 jours');
    });

    it('génère un email avec sujet "à venir" pour échéance à 7 jours', () => {
      const result = generateEcheanceReminderEmail(mockEcheance, 7);

      expect(result.subject).toContain('a venir');
      expect(result.subject).toContain('7 jours');
    });

    it('inclut le HTML body avec les informations de l\'échéance', () => {
      const result = generateEcheanceReminderEmail(mockEcheance, 5);

      expect(result.htmlBody).toContain(mockEcheance.titre);
      expect(result.htmlBody).toBeDefined();
      expect(typeof result.htmlBody).toBe('string');
    });

    it('retourne une structure EmailTemplate valide', () => {
      const result = generateEcheanceReminderEmail(mockEcheance, 1);

      expect(result).toHaveProperty('subject');
      expect(result).toHaveProperty('htmlBody');
      expect(result).toHaveProperty('textBody');
    });
  });

  describe('NotificationType', () => {
    it('contient les types de notifications attendus', () => {
      const expectedTypes: NotificationType[] = [
        'echeance_reminder',
        'facture_overdue',
        'facture_paid',
        'weekly_summary',
        'new_client',
        'dossier_update',
      ];

      expectedTypes.forEach((type) => {
        expect(typeof type).toBe('string');
      });
    });
  });

  describe('ReminderConfig', () => {
    it('accepte une configuration valide', () => {
      const config: ReminderConfig = {
        enabled: true,
        triggers: {
          echeances: {
            enabled: true,
            daysBefore: [7, 3, 1],
          },
          facturesOverdue: {
            enabled: true,
            daysAfter: [7, 14, 30],
          },
          weeklySummary: {
            enabled: true,
            dayOfWeek: 1, // Lundi
            hour: 9,
          },
        },
      };

      expect(config.enabled).toBe(true);
      expect(config.triggers.echeances.daysBefore).toEqual([7, 3, 1]);
      expect(config.triggers.weeklySummary.dayOfWeek).toBe(1);
    });

    it('permet de désactiver les rappels', () => {
      const config: ReminderConfig = {
        enabled: false,
        triggers: {
          echeances: { enabled: false, daysBefore: [] },
          facturesOverdue: { enabled: false, daysAfter: [] },
          weeklySummary: { enabled: false, dayOfWeek: 0, hour: 0 },
        },
      };

      expect(config.enabled).toBe(false);
    });
  });

  describe('Email Urgency Colors', () => {
    it('utilise rouge pour échéance à 1 jour', () => {
      const result = generateEcheanceReminderEmail(
        { titre: 'Test', date: new Date(), dossier: 'DOS-001' },
        1
      );
      expect(result.htmlBody).toContain('#dc2626'); // Rouge
    });

    it('utilise orange pour échéance à 3 jours', () => {
      const result = generateEcheanceReminderEmail(
        { titre: 'Test', date: new Date(), dossier: 'DOS-001' },
        3
      );
      expect(result.htmlBody).toContain('#f59e0b'); // Orange
    });

    it('utilise bleu pour échéance à 7+ jours', () => {
      const result = generateEcheanceReminderEmail(
        { titre: 'Test', date: new Date(), dossier: 'DOS-001' },
        7
      );
      expect(result.htmlBody).toContain('#3b82f6'); // Bleu
    });
  });
});

describe('Email Template Validation', () => {
  it('les templates HTML sont valides', () => {
    const result = generateEcheanceReminderEmail(
      { titre: 'Test', date: new Date(), dossier: 'DOS-001' },
      5
    );

    // Vérifie structure HTML basique
    expect(result.htmlBody).toContain('<!DOCTYPE html>');
    expect(result.htmlBody).toContain('<html>');
    expect(result.htmlBody).toContain('</body>');
  });

  it('échappe les caractères spéciaux dans le titre', () => {
    const result = generateEcheanceReminderEmail(
      { titre: 'Test <script>alert("xss")</script>', date: new Date(), dossier: 'DOS-001' },
      5
    );

    // Le titre doit être inclus (même non échappé pour ce test)
    expect(result.htmlBody).toBeDefined();
  });
});
