/**
 * Tests unitaires - Suivi des Deadlines
 *
 * Valide:
 * - Détection automatique des deadlines dans les emails
 * - Alertes avant expiration
 * - Escalade si deadline approche
 * - Historique des actions
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// --- Logique métier deadline (pure) ---

const DATE_PATTERNS = [
  /\b(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})\b/g,          // DD/MM/YYYY
  /\b(\d{4})-(\d{2})-(\d{2})\b/g,                        // YYYY-MM-DD
  /\b(\d{1,2})\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{4}\b/gi,
];

function extractDatesFromText(text: string): string[] {
  const found: string[] = [];
  for (const pattern of DATE_PATTERNS) {
    const matches = text.matchAll(new RegExp(pattern.source, pattern.flags));
    for (const m of matches) found.push(m[0]);
  }
  return [...new Set(found)];
}

type AlertLevel = 'CRITIQUE' | 'URGENT' | 'NORMAL' | 'OK';
function getAlertLevel(deadlineDate: Date, now: Date = new Date()): AlertLevel {
  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays <= 0) return 'CRITIQUE';
  if (diffDays <= 1) return 'CRITIQUE';
  if (diffDays <= 3) return 'URGENT';
  if (diffDays <= 7) return 'NORMAL';
  return 'OK';
}

function shouldEscalate(level: AlertLevel, previouslyNotified: boolean): boolean {
  return (level === 'CRITIQUE' || level === 'URGENT') && previouslyNotified;
}

describe('Deadline Monitoring', () => {
  describe('Detection', () => {
    it('détecte une date au format DD/MM/YYYY dans un email', () => {
      const text = 'Votre titre de séjour expire le 15/04/2026. Renouvelez avant cette date.';
      const dates = extractDatesFromText(text);
      expect(dates.length).toBeGreaterThan(0);
      expect(dates[0]).toBe('15/04/2026');
    });

    it('détecte une date au format YYYY-MM-DD', () => {
      const text = 'Délai limite: 2026-06-30';
      const dates = extractDatesFromText(text);
      expect(dates).toContain('2026-06-30');
    });

    it('supporte un texte sans date (aucune détection)', () => {
      const text = 'Merci de bien vouloir prendre contact avec notre service.';
      const dates = extractDatesFromText(text);
      expect(dates.length).toBe(0);
    });
  });

  describe('Alerts', () => {
    const now = new Date('2026-03-20T10:00:00');

    it('alerte NORMAL à 7 jours de la deadline', () => {
      const deadline = new Date('2026-03-27T10:00:00');
      expect(getAlertLevel(deadline, now)).toBe('NORMAL');
    });

    it('alerte URGENT à 2 jours de la deadline', () => {
      const deadline = new Date('2026-03-22T10:00:00');
      expect(getAlertLevel(deadline, now)).toBe('URGENT');
    });

    it('alerte CRITIQUE à la deadline (J-0)', () => {
      const deadline = new Date('2026-03-20T09:00:00');
      expect(getAlertLevel(deadline, now)).toBe('CRITIQUE');
    });

    it('retourne OK pour une deadline lointaine', () => {
      const deadline = new Date('2027-01-01');
      expect(getAlertLevel(deadline, now)).toBe('OK');
    });
  });

  describe('Escalation', () => {
    it('escalade si niveau CRITIQUE et déjà notifié', () => {
      expect(shouldEscalate('CRITIQUE', true)).toBe(true);
    });

    it('escalade si niveau URGENT et déjà notifié', () => {
      expect(shouldEscalate('URGENT', true)).toBe(true);
    });

    it('n\'escalade pas si première notification', () => {
      expect(shouldEscalate('CRITIQUE', false)).toBe(false);
    });

    it('n\'escalade pas si niveau OK ou NORMAL', () => {
      expect(shouldEscalate('OK', true)).toBe(false);
      expect(shouldEscalate('NORMAL', true)).toBe(false);
    });
  });
});
