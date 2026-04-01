/**
 * Tests unitaires - Filtrage des Emails
 *
 * Valide:
 * - Classification des emails (urgent, normal, spam)
 * - Filtrage par expéditeur/sujet/contenu
 * - Règles personnalisées utilisateur
 * - Application automatique des règles
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// --- Logique filtrage email pure ---

type EmailCategory = 'URGENT' | 'NORMAL' | 'SPAM';

const SPAM_SIGNALS = ['gagner', 'gratuit', 'cadeau', 'cliquez ici', 'promotion exclusive', 'offre limitée'];
const URGENT_SIGNALS = ['urgent', 'convocation', 'expiration', 'réponse requise', 'immédiatement'];

interface EmailFilter {
  field: 'subject' | 'from' | 'body';
  operator: 'contains' | 'equals' | 'startsWith';
  value: string;
  action: 'MOVE' | 'LABEL' | 'ARCHIVE';
  label?: string;
}

function classifyEmail(subject: string, body: string, from: string): EmailCategory {
  const fullText = `${subject} ${body}`.toLowerCase();
  if (SPAM_SIGNALS.some((s) => fullText.includes(s))) return 'SPAM';
  if (URGENT_SIGNALS.some((s) => fullText.includes(s))) return 'URGENT';
  return 'NORMAL';
}

function matchesFilter(email: { subject: string; from: string; body: string }, filter: EmailFilter): boolean {
  const target = email[filter.field].toLowerCase();
  const val = filter.value.toLowerCase();
  if (filter.operator === 'contains') return target.includes(val);
  if (filter.operator === 'equals') return target === val;
  if (filter.operator === 'startsWith') return target.startsWith(val);
  return false;
}

function applyFilters(
  email: { subject: string; from: string; body: string },
  filters: EmailFilter[]
): EmailFilter[] {
  return filters.filter((f) => matchesFilter(email, f));
}

describe('Email Filtering', () => {
  describe('Classification', () => {
    it('classifit un email avec "urgent" comme URGENT', () => {
      const cat = classifyEmail('URGENT: Votre convocation', 'Vous êtes convoqué pour le 25/03', 'tribunal@pref.fr');
      expect(cat).toBe('URGENT');
    });

    it('classifie un email normal sans signaux fort', () => {
      const cat = classifyEmail('Mise à jour dossier', 'Votre dossier a été mis à jour.', 'greffe@justice.fr');
      expect(cat).toBe('NORMAL');
    });

    it('détecte un spam avec mots-clés promotionnels', () => {
      const cat = classifyEmail('Offre limitée!', 'Cliquez ici pour gagner un cadeau gratuit', 'promo@spam.biz');
      expect(cat).toBe('SPAM');
    });
  });

  describe('Custom Rules', () => {
    it('applique une règle "subject contains" correctement', () => {
      const email = { subject: 'Facture janvier 2026', from: 'comptable@cabinet.fr', body: '' };
      const filter: EmailFilter = { field: 'subject', operator: 'contains', value: 'Facture', action: 'LABEL', label: 'Finance' };
      expect(matchesFilter(email, filter)).toBe(true);
    });

    it('n\'applique pas la règle quand la condition ne correspond pas', () => {
      const email = { subject: 'Rendez-vous confirmé', from: 'accueil@cabinet.fr', body: '' };
      const filter: EmailFilter = { field: 'subject', operator: 'contains', value: 'Facture', action: 'LABEL' };
      expect(matchesFilter(email, filter)).toBe(false);
    });

    it('combine plusieurs règles et retourne uniquement les règles correspondantes', () => {
      const email = { subject: 'URGENT: Facture', from: 'client@example.com', body: '' };
      const filters: EmailFilter[] = [
        { field: 'subject', operator: 'contains', value: 'URGENT', action: 'LABEL', label: 'Urgent' },
        { field: 'subject', operator: 'contains', value: 'Facture', action: 'LABEL', label: 'Finance' },
        { field: 'from', operator: 'contains', value: '@tribunal', action: 'LABEL', label: 'Juridique' },
      ];
      const matched = applyFilters(email, filters);
      expect(matched.length).toBe(2);
      expect(matched.map((f) => f.label)).toEqual(expect.arrayContaining(['Urgent', 'Finance']));
    });
  });

  describe('Automatic Application', () => {
    it('applique automatiquement les filtres à la réception (0 filtre = 0 action)', () => {
      const email = { subject: 'Bonjour', from: 'client@example.com', body: '' };
      const matched = applyFilters(email, []);
      expect(matched.length).toBe(0);
    });

    it('applique automatiquement les filtres à la réception (filtre match)', () => {
      const email = { subject: 'Convocation Préfecture', from: 'noreply@prefecture.fr', body: '' };
      const filters: EmailFilter[] = [
        { field: 'from', operator: 'contains', value: 'prefecture.fr', action: 'LABEL', label: 'Préfecture' },
      ];
      const matched = applyFilters(email, filters);
      expect(matched.length).toBe(1);
    });
  });
});
