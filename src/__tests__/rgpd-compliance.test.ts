/**
 * Tests unitaires - Conformité RGPD
 *
 * Valide:
 * - Détection données personnelles sensibles
 * - Anonymisation automatique
 * - Suppression données après délai légal
 * - Audit trail complète
 */

import { describe, expect, it } from '@jest/globals';

// --- Logique RGPD pure (miroir du service réel) ---

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]?\d{2}){4}/;
const IBAN_REGEX = /[A-Z]{2}\d{2}[A-Z0-9]{11,30}/;

function containsPersonalData(text: string): { found: boolean; types: string[] } {
  const types: string[] = [];
  if (EMAIL_REGEX.test(text)) types.push('email');
  if (PHONE_REGEX.test(text)) types.push('phone');
  if (IBAN_REGEX.test(text)) types.push('iban');
  return { found: types.length > 0, types };
}

function anonymize(text: string): string {
  return text
    .replace(EMAIL_REGEX, '[EMAIL_MASQUÉ]')
    .replace(PHONE_REGEX, '[TEL_MASQUÉ]');
}

const RETENTION_YEARS = 3;
function isExpiredForDeletion(createdAt: Date, now: Date = new Date()): boolean {
  const limitDate = new Date(createdAt);
  limitDate.setFullYear(limitDate.getFullYear() + RETENTION_YEARS);
  return now >= limitDate;
}

function buildAuditLog(userId: string, action: string, resource: string) {
  return {
    userId,
    action,
    resource,
    timestamp: new Date().toISOString(),
    type: 'GDPR_ACCESS',
  };
}

describe('RGPD Compliance', () => {
  describe('Personal Data Detection', () => {
    it('détecte un email comme donnée personnelle', () => {
      const text = 'Merci de contacter jean.dupont@cabinet.fr pour toute question';
      const result = containsPersonalData(text);
      expect(result.found).toBe(true);
      expect(result.types).toContain('email');
    });

    it('détecte un numéro de téléphone français comme donnée sensible', () => {
      const text = 'Appelez le +33 6 12 34 56 78 pour rendez-vous';
      const result = containsPersonalData(text);
      expect(result.found).toBe(true);
      expect(result.types).toContain('phone');
    });

    it('retourne found=false pour un texte sans données personnelles', () => {
      const text = 'Le dossier a été clôturé suite à la décision du tribunal.';
      const result = containsPersonalData(text);
      expect(result.found).toBe(false);
    });
  });

  describe('Anonymization', () => {
    it('anonymise un email dans un texte', () => {
      const text = 'Contact: avocat@cabinet-dupont.fr';
      const result = anonymize(text);
      expect(result).not.toContain('@cabinet-dupont.fr');
      expect(result).toContain('[EMAIL_MASQUÉ]');
    });

    it('respecte le délai de rétention RGPD (3 ans)', () => {
      const ancien = new Date('2020-01-01');
      const recent = new Date('2024-06-01');
      const now = new Date('2026-03-20');
      expect(isExpiredForDeletion(ancien, now)).toBe(true);
      expect(isExpiredForDeletion(recent, now)).toBe(false);
    });
  });

  describe('Audit Trail', () => {
    it('crée un audit log avec le bon type GDPR_ACCESS', () => {
      const log = buildAuditLog('user-42', 'READ', 'client:123');
      expect(log.type).toBe('GDPR_ACCESS');
      expect(log.userId).toBe('user-42');
      expect(log.action).toBe('READ');
      expect(log.resource).toBe('client:123');
      expect(log.timestamp).toBeDefined();
    });

    it('horodate le log au moment de sa création', () => {
      const before = Date.now();
      const log = buildAuditLog('user-1', 'EXPORT', 'dossier:99');
      const after = Date.now();
      const logTime = new Date(log.timestamp).getTime();
      expect(logTime).toBeGreaterThanOrEqual(before);
      expect(logTime).toBeLessThanOrEqual(after);
    });
  });
});
