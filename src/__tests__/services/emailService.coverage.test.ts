/**
 * Tests pour src/lib/services/emailService.ts
 */
import { vi, describe, it, expect } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
  generateEcheanceReminderEmail,
  generateFactureOverdueEmail,
  generateWeeklySummaryEmail,
  sendEmail,
  DEFAULT_REMINDER_CONFIG,
} from '@/lib/services/emailService';

describe('emailService.ts — Full Coverage', () => {
  describe('generateEcheanceReminderEmail', () => {
    it('should generate URGENT reminder for 1 day', () => {
      const result = generateEcheanceReminderEmail(
        { titre: 'Audience TA', date: new Date('2026-03-15'), dossier: 'DOS-001', description: 'Audience urgente' },
        1
      );
      expect(result.subject).toContain('URGENT');
      expect(result.subject).toContain('1 jour');
      expect(result.htmlBody).toContain('Audience TA');
      expect(result.htmlBody).toContain('#dc2626');
      expect(result.htmlBody).toContain('Audience urgente');
      expect(result.textBody).toContain('URGENT');
      expect(result.textBody).toContain('DOS-001');
    });

    it('should generate Important reminder for 3 days', () => {
      const result = generateEcheanceReminderEmail(
        { titre: 'Dépôt mémoire', date: new Date('2026-03-20'), dossier: 'DOS-002' },
        3
      );
      expect(result.subject).toContain('Important');
      expect(result.subject).toContain('3 jours');
      expect(result.htmlBody).toContain('#f59e0b');
    });

    it('should generate normal reminder for 7 days', () => {
      const result = generateEcheanceReminderEmail(
        { titre: 'RDV Préfecture', date: new Date('2026-04-01'), dossier: 'DOS-003' },
        7
      );
      expect(result.subject).toContain('À venir');
      expect(result.subject).toContain('7 jours');
      expect(result.htmlBody).toContain('#3b82f6');
    });

    it('should handle missing description', () => {
      const result = generateEcheanceReminderEmail(
        { titre: 'Test', date: new Date(), dossier: 'REF' },
        5
      );
      expect(result.textBody).not.toContain('Description:');
    });
  });

  describe('generateFactureOverdueEmail', () => {
    it('should generate overdue facture email', () => {
      const result = generateFactureOverdueEmail(
        { numero: 'F-2026-001', client: 'M. Dupont', montant: 1500.50, dateEcheance: new Date('2026-01-15') },
        14
      );
      expect(result.subject).toContain('F-2026-001');
      expect(result.subject).toContain('14 jours');
      expect(result.htmlBody).toContain('M. Dupont');
      expect(result.htmlBody).toContain('1500.50');
      expect(result.textBody).toContain('1500.50 €');
    });

    it('should handle singular day', () => {
      const result = generateFactureOverdueEmail(
        { numero: 'F-001', client: 'Test', montant: 100, dateEcheance: new Date() },
        1
      );
      expect(result.subject).toContain('1 jour');
    });
  });

  describe('generateWeeklySummaryEmail', () => {
    it('should generate weekly summary', () => {
      const result = generateWeeklySummaryEmail({
        newDossiers: 5,
        newFactures: 3,
        totalRevenue: 12500,
        upcomingEcheances: 4,
        overdueFactures: 2,
      });
      expect(result.subject).toContain('Résumé hebdomadaire');
      expect(result.htmlBody).toContain('5');
      expect(result.htmlBody).toContain('12500');
      expect(result.htmlBody).toContain('4');
      expect(result.htmlBody).toContain('2');
      expect(result.htmlBody).toContain('Action requise');
      expect(result.textBody).toContain('5 nouveaux dossiers');
    });

    it('should not show action required when no overdue', () => {
      const result = generateWeeklySummaryEmail({
        newDossiers: 1,
        newFactures: 0,
        totalRevenue: 0,
        upcomingEcheances: 0,
        overdueFactures: 0,
      });
      expect(result.htmlBody).not.toContain('Action requise');
    });
  });

  describe('DEFAULT_REMINDER_CONFIG', () => {
    it('should have correct defaults', () => {
      expect(DEFAULT_REMINDER_CONFIG.enabled).toBe(true);
      expect(DEFAULT_REMINDER_CONFIG.triggers.echeances.daysBefore).toEqual([7, 3, 1]);
      expect(DEFAULT_REMINDER_CONFIG.triggers.facturesOverdue.daysAfter).toEqual([7, 14, 30]);
      expect(DEFAULT_REMINDER_CONFIG.triggers.weeklySummary.dayOfWeek).toBe(1);
      expect(DEFAULT_REMINDER_CONFIG.triggers.weeklySummary.hour).toBe(9);
    });
  });

  describe('sendEmail', () => {
    it('should simulate sending and return true', async () => {
      const result = await sendEmail({
        to: [{ email: 'test@test.com', name: 'Test' }],
        template: { subject: 'Test', htmlBody: '<p>Hello</p>', textBody: 'Hello' },
      });
      expect(result).toBe(true);
    });
  });
});
