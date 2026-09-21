import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Tests de résilience IA — vérification du fallback regex
 * quand Ollama est indisponible (timeout, crash, réponse malformée).
 */

// Mock global fetch pour simuler Ollama
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

// Mock billing feature check
vi.mock('@/lib/billing/features', () => ({
  checkFeatureAccess: vi.fn().mockResolvedValue({ allowed: true }),
}));

// Mock hybrid AI client
vi.mock('@/lib/ai/hybrid-client', () => ({
  hybridAI: {
    generateWithCostControl: vi.fn(),
  },
}));

import { hybridAI } from '@/lib/ai/hybrid-client';

describe('AI Resilience — Summarize Email Fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Fallback regex — détection urgence', () => {
    it('détecte urgence critique (OQTF, 48h, immédiat)', () => {
      const result = summarizeWithRegex(
        'URGENT - OQTF notifiée',
        'Mon client a reçu une OQTF. Délai 48h pour le recours.',
        'avocat@cabinet.fr'
      );
      expect(result.urgence).toBe('critique');
      expect(result.typeDossier).toBe('OQTF');
    });

    it('détecte urgence haute (délai, échéance)', () => {
      const result = summarizeWithRegex(
        'Échéance titre de séjour',
        'Le délai pour le renouvellement arrive rapidement.',
        'client@mail.com'
      );
      expect(result.urgence).toBe('haute');
    });

    it('détecte urgence moyenne (demande classique)', () => {
      const result = summarizeWithRegex(
        'Demande de rendez-vous',
        'Merci de bien vouloir me confirmer un rendez-vous.',
        'client@mail.com'
      );
      expect(result.urgence).toBe('moyenne');
    });

    it('urgence basse par défaut', () => {
      const result = summarizeWithRegex(
        'Information',
        'Bonjour, je vous transmets les documents.',
        'info@mail.com'
      );
      expect(result.urgence).toBe('basse');
    });
  });

  describe('Fallback regex — détection type dossier', () => {
    it('détecte OQTF', () => {
      const result = summarizeWithRegex('', 'Obligation de quitter le territoire français notifiée', '');
      expect(result.typeDossier).toBe('OQTF');
    });

    it('détecte ASILE (OFPRA)', () => {
      const result = summarizeWithRegex('', 'Convocation OFPRA pour audition', '');
      expect(result.typeDossier).toBe('ASILE');
    });

    it('détecte ASILE (CNDA)', () => {
      const result = summarizeWithRegex('', 'Recours devant la CNDA', '');
      expect(result.typeDossier).toBe('ASILE');
    });

    it('détecte NATURALISATION', () => {
      const result = summarizeWithRegex('', 'Demande de nationalité française par décret', '');
      expect(result.typeDossier).toBe('NATURALISATION');
    });

    it('détecte TITRE_SEJOUR', () => {
      const result = summarizeWithRegex('', 'Renouvellement carte de séjour pluriannuelle', '');
      expect(result.typeDossier).toBe('TITRE_SEJOUR');
    });

    it('détecte REGROUPEMENT_FAMILIAL', () => {
      const result = summarizeWithRegex('', 'Procédure de regroupement familial en cours', '');
      expect(result.typeDossier).toBe('REGROUPEMENT_FAMILIAL');
    });

    it('retourne GENERAL par défaut', () => {
      const result = summarizeWithRegex('', 'Question sur une succession', '');
      expect(result.typeDossier).toBe('GENERAL');
    });
  });

  describe('Fallback regex — extraction metadata', () => {
    it('extrait le nom du client depuis "from"', () => {
      const result = summarizeWithRegex('Test', 'Corps', 'Jean Dupont <jean@mail.com>');
      expect(result.client).toBe('Jean Dupont');
    });

    it('client null si from vide', () => {
      const result = summarizeWithRegex('Test', 'Corps', '');
      expect(result.client).toBeNull();
    });

    it('détecte une date au format JJ/MM/AAAA', () => {
      const result = summarizeWithRegex('', 'Audience prévue le 15/03/2026', '');
      expect(result.deadlineDetectee).toBe('15/03/2026');
    });

    it('détecte une date au format textuel', () => {
      const result = summarizeWithRegex('', 'Délai expire le 3 janvier 2026', '');
      expect(result.deadlineDetectee).toBe('3 janvier 2026');
    });

    it('deadline null si aucune date trouvée', () => {
      const result = summarizeWithRegex('', 'Pas de date ici', '');
      expect(result.deadlineDetectee).toBeNull();
    });
  });

  describe('Comportement IA → fallback', () => {
    it('utilise le fallback quand hybridAI échoue (timeout)', async () => {
      (hybridAI.generateWithCostControl as any).mockRejectedValue(
        new Error('ECONNREFUSED: Ollama not available')
      );

      const response = await simulateSummarizeEndpoint({
        subject: 'URGENT OQTF',
        body: 'Notification OQTF reçue. Délai de recours 48h.',
        from: 'Marie Martin <marie@mail.com>',
      });

      expect(response._fallback).toBe(true);
      expect(response.urgence).toBe('critique');
      expect(response.typeDossier).toBe('OQTF');
      expect(response.client).toBe('Marie Martin');
      expect(response.confidence.client).toBe(0.5); // Confiance réduite en mode fallback
    });

    it('utilise le fallback quand hybridAI retourne un JSON malformé', async () => {
      (hybridAI.generateWithCostControl as any).mockResolvedValue({
        response: 'Désolé, je ne peux pas analyser cet email.',
        provider: 'ollama',
        model: 'llama3.2:3b',
        latency: 200,
      });

      const response = await simulateSummarizeEndpoint({
        subject: 'Titre de séjour',
        body: 'Renouvellement récépissé carte de séjour',
        from: 'Pierre <pierre@mail.com>',
      });

      expect(response._fallback).toBe(true);
      expect(response.typeDossier).toBe('TITRE_SEJOUR');
    });

    it('retourne les données IA quand Ollama fonctionne', async () => {
      const aiResponse = {
        client: 'Ahmed Ben Salah',
        objet: 'Demande OQTF urgente',
        urgence: 'critique',
        actionRequise: 'Déposer recours sous 48h',
        deadlineDetectee: '15/08/2026',
        typeDossier: 'OQTF',
        resumeCourt: 'Client notifié OQTF. Recours à déposer avant le 15/08.',
      };

      (hybridAI.generateWithCostControl as any).mockResolvedValue({
        response: JSON.stringify(aiResponse),
        provider: 'ollama',
        model: 'llama3.2:3b',
        latency: 1500,
      });

      const response = await simulateSummarizeEndpoint({
        subject: 'OQTF',
        body: 'Mon client Ahmed Ben Salah a reçu une OQTF',
        from: 'avocat@cabinet.fr',
      });

      expect(response._fallback).toBeUndefined();
      expect(response.client).toBe('Ahmed Ben Salah');
      expect(response.urgence).toBe('critique');
      expect(response.confidence.client).toBe(0.85); // Confiance IA pleine
    });
  });
});

// ─── Helpers ───────────────────────────────────────────────────────────────────

interface EmailSummary {
  client: string | null;
  objet: string;
  urgence: 'basse' | 'moyenne' | 'haute' | 'critique';
  actionRequise: string;
  deadlineDetectee: string | null;
  typeDossier: string;
  resumeCourt: string;
}

/**
 * Reproduction exacte de la logique fallback de src/app/api/ai/summarize-email/route.ts
 * Permet de tester sans démarrer un vrai serveur Next.js.
 */
function summarizeWithRegex(subject: string, body: string, from: string): EmailSummary {
  const text = `${subject} ${body}`.toLowerCase();

  let urgence: EmailSummary['urgence'] = 'basse';
  if (text.match(/urgent|imm[eé]diat|48h|24h|oqtf sans d[eé]lai/)) urgence = 'critique';
  else if (text.match(/d[eé]lai|[eé]ch[eé]ance|rapidement|au plus vite/)) urgence = 'haute';
  else if (text.match(/merci de|pourriez-vous|demande/)) urgence = 'moyenne';

  let typeDossier = 'GENERAL';
  if (text.match(/oqtf|obligation de quitter/)) typeDossier = 'OQTF';
  else if (text.match(/asile|r[eé]fugi[eé]|ofpra|cnda/)) typeDossier = 'ASILE';
  else if (text.match(/regroupement familial/)) typeDossier = 'REGROUPEMENT_FAMILIAL';
  else if (text.match(/naturalisation|nationalit[eé]/)) typeDossier = 'NATURALISATION';
  else if (text.match(/titre de s[eé]jour|carte de s[eé]jour|r[eé]c[eé]piss[eé]/)) typeDossier = 'TITRE_SEJOUR';

  const client = from.match(/^([^<@]+)/)?.[1]?.trim() || null;

  const deadlineMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\d{1,2}\s+(?:janvier|f[eé]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[eé]cembre)\s+\d{4})/);
  const deadlineDetectee = deadlineMatch?.[0] || null;

  return {
    client,
    objet: subject || 'Sans objet',
    urgence,
    actionRequise: urgence === 'critique' ? 'Traiter immédiatement' : 'À analyser et répondre',
    deadlineDetectee,
    typeDossier,
    resumeCourt: `Email de ${client || 'expéditeur inconnu'} concernant ${typeDossier.toLowerCase().replace('_', ' ')}. ${urgence === 'critique' ? 'Action urgente requise.' : 'À traiter.'}`,
  };
}

/**
 * Simule l'appel à l'endpoint POST /api/ai/summarize-email
 * sans serveur — teste la logique IA + fallback.
 */
async function simulateSummarizeEndpoint(input: { subject: string; body: string; from: string }) {
  try {
    const aiResult = await (hybridAI.generateWithCostControl as any)(
      expect.any(String),
      'tenant-1'
    );
    const jsonMatch = aiResult.response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in AI response');
    const parsed = JSON.parse(jsonMatch[0]);
    return { ...parsed, confidence: { client: 0.85, urgence: 0.8, typeDossier: 0.8, deadline: 0.7 } };
  } catch {
    const summary = summarizeWithRegex(input.subject, input.body, input.from);
    return { ...summary, _fallback: true, confidence: { client: 0.5, urgence: 0.6, typeDossier: 0.6, deadline: 0.4 } };
  }
}
