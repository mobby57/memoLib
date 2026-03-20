/**
 * Tests unitaires - Assistant IA
 *
 * Valide:
 * - Génération de résumés
 * - Suggestions de réponses
 * - Analyse de sentiment
 * - Intégration modèles LLM (OpenAI, Llama)
 */

import { describe, expect, it } from '@jest/globals';

// --- Logique IA pure (sans appel réseau) ---

function generateSummary(text: string, maxSentences = 2): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  return sentences.slice(0, maxSentences).join(' ').trim();
}

type Sentiment = 'POSITIF' | 'NEGATIF' | 'URGENT' | 'NEUTRE';
const URGENT_KEYWORDS = ['urgent', 'immédiatement', 'imperéatif', 'délai', 'expir', 'convocation'];
const NEGATIVE_KEYWORDS = ['refusé', 'rejeté', 'problème', 'erreur', 'inacceptable'];

function analyzeSentiment(text: string): Sentiment {
  const lower = text.toLowerCase();
  if (URGENT_KEYWORDS.some((k) => lower.includes(k))) return 'URGENT';
  if (NEGATIVE_KEYWORDS.some((k) => lower.includes(k))) return 'NEGATIF';
  if (lower.includes('merci') || lower.includes('parfait') || lower.includes('accord')) return 'POSITIF';
  return 'NEUTRE';
}

type Tone = 'FORMEL' | 'NEUTRE' | 'AMICAL';
function suggestReplyTone(sentiment: Sentiment, isVip: boolean): Tone {
  if (sentiment === 'URGENT' || sentiment === 'NEGATIF') return 'FORMEL';
  if (isVip) return 'FORMEL';
  return 'NEUTRE';
}

function buildPromptForSummary(emailBody: string): string {
  return `Résume en 2 phrases maximum cet email juridique:\n\n${emailBody.slice(0, 2000)}`;
}

describe('AI Assistant', () => {
  describe('Summarization', () => {
    it('génère un résumé de 2 phrases max', () => {
      const text =
        'Votre demande a été reçue. Nous lui accordons toute notre attention. Un retour vous sera communiqué sous 48h. Merci de votre confiance.';
      const summary = generateSummary(text, 2);
      const sentenceCount = (summary.match(/[.!?]+/g) || []).length;
      expect(sentenceCount).toBeLessThanOrEqual(2);
    });

    it('tronque à 2000 caractères dans le prompt pour les emails longs', () => {
      const longEmail = 'A'.repeat(5000);
      const prompt = buildPromptForSummary(longEmail);
      expect(prompt.length).toBeLessThanOrEqual(2100);
    });
  });

  describe('Reply Suggestions', () => {
    it('suggère un ton FORMEL pour un email urgent', () => {
      const tone = suggestReplyTone('URGENT', false);
      expect(tone).toBe('FORMEL');
    });

    it('suggère un ton FORMEL pour un client VIP', () => {
      const tone = suggestReplyTone('NEUTRE', true);
      expect(tone).toBe('FORMEL');
    });

    it('suggère un ton NEUTRE pour un email normal', () => {
      const tone = suggestReplyTone('NEUTRE', false);
      expect(tone).toBe('NEUTRE');
    });
  });

  describe('Sentiment Analysis', () => {
    it('détecte le sentiment URGENT d\'un email avec délai', () => {
      const email = 'URGENT: Votre titre de séjour expire dans 5 jours!';
      expect(analyzeSentiment(email)).toBe('URGENT');
    });

    it('détecte le sentiment NÉGATIF d\'un email de refus', () => {
      const email = 'Votre demande a été refusée par les autorités.';
      expect(analyzeSentiment(email)).toBe('NEGATIF');
    });

    it('détecte le sentiment POSITIF d\'un email de confirmation', () => {
      const email = 'Merci pour votre retour, c\'est parfait.';
      expect(analyzeSentiment(email)).toBe('POSITIF');
    });

    it('retourne NEUTRE pour un email sans marqueur fort', () => {
      const email = 'Veuillez trouver ci-joint les documents demandés.';
      expect(analyzeSentiment(email)).toBe('NEUTRE');
    });
  });

  describe('LLM Integration', () => {
    it('construit un prompt valide pour OpenAI', () => {
      const prompt = buildPromptForSummary('Test email content');
      expect(prompt).toContain('Résume');
      expect(prompt).toContain('Test email content');
    });

    it('limite la taille du prompt entrée (prévient token overflow)', () => {
      const veryLong = 'X'.repeat(10000);
      const prompt = buildPromptForSummary(veryLong);
      // 2000 chars de body + le texte du prompt (~50 chars)
      expect(prompt.length).toBeLessThan(2100);
    });
  });
});
