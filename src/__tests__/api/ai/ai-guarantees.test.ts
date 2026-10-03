/**
 * Garanties IA — chaîne Email -> IA (P2).
 *
 * Importe les routes de production réelles (summarize-email, draft-reply) et
 * vérifie 3 invariants métier tirés du code :
 *
 *  - AI-FALLBACK      : si le client IA échoue (Ollama/tous providers down), la
 *                       route bascule sur un fallback regex et renvoie _fallback:true.
 *  - AI-HUMAN-REVIEW  : toute réponse (IA réussie OU fallback) porte
 *                       requiresHumanReview:true.
 *  - AI-NO-AUTO-SEND  : draft-reply produit un brouillon marqué pour revue humaine
 *                       et n'envoie jamais d'email (aucun appel d'envoi).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { session, generateWithCostControl, checkFeatureAccess } = vi.hoisted(() => ({
  session: { current: null as { user?: Record<string, unknown> } | null },
  generateWithCostControl: vi.fn(),
  checkFeatureAccess: vi.fn(),
}));

vi.mock('@/lib/clerk-auth', () => ({
  auth: vi.fn(() => ({ user: session.current?.user ?? null })),
}));
vi.mock('@/lib/middleware/rate-limit', () => ({
  withAIRateLimit: (handler: unknown) => handler,
}));
vi.mock('@/lib/ai/hybrid-client', () => ({
  hybridAI: { generateWithCostControl },
}));
vi.mock('@/lib/billing/features', () => ({ checkFeatureAccess }));

import { POST as summarize } from '@/app/api/ai/summarize-email/route';
import { POST as draftReply } from '@/app/api/ai/draft-reply/route';

function request(url: string, body: Record<string, unknown>) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const VALID_AI_SUMMARY = JSON.stringify({
  objet: 'Recours OQTF à préparer',
  urgence: 'critique',
  actionRequise: 'Préparer le recours',
  deadlineDetectee: '15/01/2026',
  typeDossier: 'OQTF',
  resumeCourt: 'Client sous OQTF. Recours urgent à déposer.',
});

const VALID_AI_DRAFT = JSON.stringify({
  subject: 'Re: votre dossier',
  body: 'Madame, Monsieur, nous accusons réception...',
  tone: 'formel',
  suggestedActions: ['Examiner la demande'],
});

describe('[P2] Garanties IA — summarize-email & draft-reply', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    session.current = { user: { id: 'user-1', tenantId: 'tenant-1', role: 'LAWYER', groups: [] } };
    checkFeatureAccess.mockResolvedValue({ allowed: true });
  });

  describe('AI-HUMAN-REVIEW — requiresHumanReview toujours vrai', () => {
    it('summarize: réponse IA valide -> requiresHumanReview:true', async () => {
      generateWithCostControl.mockResolvedValue({ response: VALID_AI_SUMMARY });
      const res = await summarize(request('http://localhost/api/ai/summarize-email', { body: 'OQTF reçue, recours urgent' }));
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.requiresHumanReview).toBe(true);
      expect(json._fallback).toBeUndefined();
    });

    it('draft: réponse IA valide -> requiresHumanReview:true', async () => {
      generateWithCostControl.mockResolvedValue({ response: VALID_AI_DRAFT });
      const res = await draftReply(request('http://localhost/api/ai/draft-reply', { body: 'Bonjour, pouvez-vous répondre ?' }));
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.requiresHumanReview).toBe(true);
    });
  });

  describe('AI-FALLBACK — bascule regex quand le client IA échoue', () => {
    it('summarize: IA down -> _fallback:true + requiresHumanReview:true', async () => {
      generateWithCostControl.mockRejectedValue(new Error('Ollama indisponible'));
      const res = await summarize(request('http://localhost/api/ai/summarize-email', { subject: 'OQTF', body: 'OQTF sans délai, référé 48h' }));
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json._fallback).toBe(true);
      expect(json.requiresHumanReview).toBe(true);
      // Le fallback regex classe bien l'urgence critique + type OQTF
      expect(json.urgence).toBe('critique');
      expect(json.typeDossier).toBe('OQTF');
    });

    it('summarize: réponse IA non structurée -> fallback', async () => {
      generateWithCostControl.mockResolvedValue({ response: 'texte non JSON' });
      const res = await summarize(request('http://localhost/api/ai/summarize-email', { body: 'demande de titre de séjour' }));
      const json = await res.json();
      expect(json._fallback).toBe(true);
      expect(json.requiresHumanReview).toBe(true);
    });

    it('draft: IA down -> _fallback:true + requiresHumanReview:true', async () => {
      generateWithCostControl.mockRejectedValue(new Error('Ollama indisponible'));
      const res = await draftReply(request('http://localhost/api/ai/draft-reply', { subject: 'OQTF', body: 'urgent oqtf' }));
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json._fallback).toBe(true);
      expect(json.requiresHumanReview).toBe(true);
      expect(json.body).toContain('accusons réception');
    });
  });

  describe('AI-NO-AUTO-SEND — draft ne fait que produire un brouillon', () => {
    it('draft: renvoie un brouillon à valider, ne contient aucun statut d’envoi', async () => {
      generateWithCostControl.mockResolvedValue({ response: VALID_AI_DRAFT });
      const res = await draftReply(request('http://localhost/api/ai/draft-reply', { body: 'Bonjour' }));
      const json = await res.json();
      // Un brouillon, pas un envoi : présence du corps + marqueur de revue, absence de tout indicateur d'envoi
      expect(json.body).toBeTruthy();
      expect(json.requiresHumanReview).toBe(true);
      expect(json.sent).toBeUndefined();
      expect(json.messageId).toBeUndefined();
      expect(json.status).not.toBe('sent');
    });
  });
});
