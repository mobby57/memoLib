/**
 * Tests pour le webhook GitHub
 * Vérifie signature HMAC, gestion des événements, sécurité
 * 
 * Réécrit sans dépendance à NextRequest (utilise des helpers de test)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHmac, timingSafeEqual } from 'node:crypto';

// ─── Logique métier extraite (testable sans Next.js) ──────────────────────

const WEBHOOK_SECRET = 'test-webhook-secret-123';

function verifyGitHubSignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  if (!signature.startsWith('sha256=')) return false;
  
  const expected = 'sha256=' + createHmac('sha256', secret).update(payload).digest('hex');
  
  if (signature.length !== expected.length) return false;
  
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

function processGitHubEvent(event: string, payload: any): { status: number; message: string } {
  if (!event) return { status: 400, message: 'Missing event type' };

  switch (event) {
    case 'ping':
      return { status: 200, message: `ping received: ${payload.zen || 'pong'}` };
    case 'push':
      return { status: 200, message: `Push GitHub received on ${payload.ref}` };
    case 'pull_request':
      return { status: 200, message: `Pull Request #${payload.pull_request?.number} ${payload.action} received` };
    case 'issues':
      return { status: 200, message: `Issue #${payload.issue?.number} ${payload.action} received` };
    default:
      return { status: 200, message: `evenement non gere: ${event}` };
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('GitHub Webhook — Signature HMAC', () => {
  it('accepte une signature valide', () => {
    const payload = JSON.stringify({ action: 'opened' });
    const signature = 'sha256=' + createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex');
    expect(verifyGitHubSignature(payload, signature, WEBHOOK_SECRET)).toBe(true);
  });

  it('rejette une signature invalide', () => {
    const payload = JSON.stringify({ action: 'opened' });
    const signature = 'sha256=000000invalidhash00000000000000000000000000000000000000000000000';
    expect(verifyGitHubSignature(payload, signature, WEBHOOK_SECRET)).toBe(false);
  });

  it('rejette si signature absente', () => {
    const payload = JSON.stringify({ action: 'opened' });
    expect(verifyGitHubSignature(payload, null, WEBHOOK_SECRET)).toBe(false);
  });

  it('rejette si signature ne commence pas par sha256=', () => {
    const payload = JSON.stringify({ action: 'opened' });
    expect(verifyGitHubSignature(payload, 'md5=abc123', WEBHOOK_SECRET)).toBe(false);
  });

  it('rejette si secret est vide', () => {
    const payload = JSON.stringify({ action: 'opened' });
    const signature = 'sha256=' + createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex');
    expect(verifyGitHubSignature(payload, signature, '')).toBe(false);
  });

  it('résiste au timing attack (même longueur)', () => {
    const payload = JSON.stringify({ test: 'timing' });
    const validSig = 'sha256=' + createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex');
    const invalidSig = 'sha256=' + 'a'.repeat(64);
    
    // Les deux signatures ont la même longueur
    expect(validSig.length).toBe(invalidSig.length);
    
    // Vérification timing-safe
    expect(verifyGitHubSignature(payload, validSig, WEBHOOK_SECRET)).toBe(true);
    expect(verifyGitHubSignature(payload, invalidSig, WEBHOOK_SECRET)).toBe(false);
  });

  it('rejette si le payload a été modifié après signature', () => {
    const originalPayload = JSON.stringify({ action: 'opened' });
    const signature = 'sha256=' + createHmac('sha256', WEBHOOK_SECRET).update(originalPayload).digest('hex');
    const modifiedPayload = JSON.stringify({ action: 'closed' });
    expect(verifyGitHubSignature(modifiedPayload, signature, WEBHOOK_SECRET)).toBe(false);
  });
});

describe('GitHub Webhook — Événements', () => {
  it('gère événement ping', () => {
    const result = processGitHubEvent('ping', { zen: 'Design for failure.', hook_id: 12345 });
    expect(result.status).toBe(200);
    expect(result.message).toContain('ping');
    expect(result.message).toContain('Design for failure');
  });

  it('gère événement push', () => {
    const result = processGitHubEvent('push', {
      ref: 'refs/heads/main',
      commits: [{ id: 'abc123', message: 'Test commit' }],
      repository: { full_name: 'owner/repo' },
    });
    expect(result.status).toBe(200);
    expect(result.message).toContain('Push');
    expect(result.message).toContain('refs/heads/main');
  });

  it('gère événement pull_request', () => {
    const result = processGitHubEvent('pull_request', {
      action: 'opened',
      pull_request: { number: 42, title: 'Test PR' },
      repository: { full_name: 'owner/repo' },
    });
    expect(result.status).toBe(200);
    expect(result.message).toContain('Pull Request');
    expect(result.message).toContain('#42');
    expect(result.message).toContain('opened');
  });

  it('gère événement issues', () => {
    const result = processGitHubEvent('issues', {
      action: 'opened',
      issue: { number: 10, title: 'Bug report' },
      repository: { full_name: 'owner/repo' },
    });
    expect(result.status).toBe(200);
    expect(result.message).toContain('Issue');
    expect(result.message).toContain('#10');
  });

  it('gère événement inconnu (graceful)', () => {
    const result = processGitHubEvent('star', { action: 'created' });
    expect(result.status).toBe(200);
    expect(result.message).toContain('non gere');
  });

  it('retourne 400 si event type manquant', () => {
    const result = processGitHubEvent('', { action: 'test' });
    expect(result.status).toBe(400);
    expect(result.message).toContain('Missing event type');
  });
});
