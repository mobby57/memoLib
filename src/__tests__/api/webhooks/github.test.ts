/**
 * Tests pour le webhook GitHub
 * Verifie signature HMAC, gestion des evenements, securite
 * 
 * Note: Ces tests necessitent un environnement avec NextRequest disponible
 * Ils sont skipped par defaut car NextRequest n'est pas correctement polyfille dans jsdom
 */

import { createHmac } from 'node:crypto';

// Mock du logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Skip tous les tests - NextRequest necessite un environnement Next.js complet
describe.skip('GitHub Webhook API (requires Next.js environment)', () => {
  // Import dynamique pour eviter erreur si Request non defini
  let NextRequest: any;
  let POST: any;
  let GET: any;

  beforeAll(async () => {
    const serverModule = await import('next/server');
    NextRequest = serverModule.NextRequest;
    const routeModule = await import('@/app/api/webhooks/github/route');
    POST = routeModule.POST;
    GET = routeModule.GET;
  });

  const WEBHOOK_SECRET = 'test-webhook-secret-123';
  
  beforeEach(() => {
    process.env.GITHUB_WEBHOOK_SECRET = WEBHOOK_SECRET;
    jest.clearAllMocks();
  });

  describe('GET /api/webhooks/github', () => {
    test('Retourne status active avec evenements supportes', async () => {
      const response = await GET();
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual({
        status: 'active',
        supported_events: ['push', 'pull_request', 'issues', 'ping']
      });
    });
  });

  describe('POST /api/webhooks/github - Securite', () => {
    function createSignature(payload: string, secret: string): string {
      return 'sha256=' + createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
    }

    function createMockRequest(
      body: any,
      event: string,
      signature?: string,
      deliveryId?: string
    ): NextRequest {
      const bodyString = JSON.stringify(body);
      const headers = new Headers();
      
      headers.set('x-github-event', event);
      headers.set('content-type', 'application/json');
      
      if (signature) {
        headers.set('x-hub-signature-256', signature);
      }
      
      if (deliveryId) {
        headers.set('x-github-delivery', deliveryId);
      }

      return new NextRequest('http://localhost:3000/api/webhooks/github', {
        method: 'POST',
        headers,
        body: bodyString,
      });
    }

    test('Rejette requete sans signature', async () => {
      const payload = { action: 'opened' };
      const request = createMockRequest(payload, 'pull_request');

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Missing signature');
    });

    test('Rejette signature invalide', async () => {
      const payload = { action: 'opened' };
      const wrongSignature = 'sha256=wrongsignature123';
      const request = createMockRequest(payload, 'pull_request', wrongSignature);

      const response = await POST(request);
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Invalid signature');
    });

    test('Accepte signature valide', async () => {
      const payload = { 
        action: 'opened',
        repository: { full_name: 'test/repo' }
      };
      const bodyString = JSON.stringify(payload);
      const validSignature = createSignature(bodyString, WEBHOOK_SECRET);
      
      const request = createMockRequest(
        payload,
        'pull_request',
        validSignature,
        'delivery-123'
      );

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toContain('received');
    });

    test('Rejette si secret non configure', async () => {
      delete process.env.GITHUB_WEBHOOK_SECRET;
      
      const payload = { action: 'ping' };
      const bodyString = JSON.stringify(payload);
      const signature = createSignature(bodyString, 'any-secret');
      
      const request = createMockRequest(payload, 'ping', signature);

      const response = await POST(request);
      
      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/webhooks/github - evenements', () => {
    function createValidRequest(payload: any, event: string): NextRequest {
      const bodyString = JSON.stringify(payload);
      const signature = 'sha256=' + createHmac('sha256', WEBHOOK_SECRET)
        .update(bodyString)
        .digest('hex');
      
      const headers = new Headers();
      headers.set('x-github-event', event);
      headers.set('x-hub-signature-256', signature);
      headers.set('x-github-delivery', `delivery-${Date.now()}`);
      headers.set('content-type', 'application/json');

      return new NextRequest('http://localhost:3000/api/webhooks/github', {
        method: 'POST',
        headers,
        body: bodyString,
      });
    }

    test('Gere evenement ping', async () => {
      const payload = {
        zen: 'Design for failure.',
        hook_id: 12345,
      };
      
      const request = createValidRequest(payload, 'ping');
      const response = await POST(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toContain('ping');
    });

    test('Gere evenement push', async () => {
      const payload = {
        ref: 'refs/heads/main',
        commits: [
          { id: 'abc123', message: 'Test commit' }
        ],
        repository: {
          full_name: 'owner/repo',
          name: 'repo'
        },
        pusher: {
          name: 'test-user'
        }
      };
      
      const request = createValidRequest(payload, 'push');
      const response = await POST(request);
      
      expect(response.status).toBe(200);
      
      const { logger } = require('@/lib/logger');
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Push GitHub'),
        expect.objectContaining({
          repository: 'owner/repo',
          branch: 'refs/heads/main'
        })
      );
    });

    test('Gere evenement pull_request', async () => {
      const payload = {
        action: 'opened',
        pull_request: {
          number: 42,
          title: 'Test PR',
          state: 'open',
          html_url: 'https://github.com/test/repo/pull/42'
        },
        repository: {
          full_name: 'owner/repo'
        },
        sender: {
          login: 'test-user'
        }
      };
      
      const request = createValidRequest(payload, 'pull_request');
      const response = await POST(request);
      
      expect(response.status).toBe(200);
      
      const { logger } = require('@/lib/logger');
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Pull Request'),
        expect.objectContaining({
          action: 'opened',
          pr_number: 42,
          repository: 'owner/repo'
        })
      );
    });

    test('Gere evenement issues', async () => {
      const payload = {
        action: 'opened',
        issue: {
          number: 10,
          title: 'Bug report',
          state: 'open'
        },
        repository: {
          full_name: 'owner/repo'
        },
        sender: {
          login: 'reporter'
        }
      };
      
      const request = createValidRequest(payload, 'issues');
      const response = await POST(request);
      
      expect(response.status).toBe(200);
      
      const { logger } = require('@/lib/logger');
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Issue'),
        expect.objectContaining({
          action: 'opened',
          issue_number: 10,
          repository: 'owner/repo'
        })
      );
    });

    test('Log evenement non gere comme debug', async () => {
      const payload = {
        action: 'starred',
        repository: {
          full_name: 'owner/repo'
        }
      };
      
      const request = createValidRequest(payload, 'star');
      const response = await POST(request);
      
      expect(response.status).toBe(200);
      
      const { logger } = require('@/lib/logger');
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('evenement non gere'),
        expect.objectContaining({
          event: 'star'
        })
      );
    });
  });

  describe('POST /api/webhooks/github - Headers requis', () => {
    test('Rejette si x-github-event manquant', async () => {
      const payload = { test: 'data' };
      const bodyString = JSON.stringify(payload);
      const signature = 'sha256=' + createHmac('sha256', WEBHOOK_SECRET)
        .update(bodyString)
        .digest('hex');
      
      const headers = new Headers();
      headers.set('x-hub-signature-256', signature);
      headers.set('content-type', 'application/json');

      const request = new NextRequest('http://localhost:3000/api/webhooks/github', {
        method: 'POST',
        headers,
        body: bodyString,
      });

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Missing event type');
    });
  });

  describe('Timing-safe comparison', () => {
    test('Utilise timingSafeEqual pour prevenir timing attacks', async () => {
      const payload = { test: 'timing' };
      const bodyString = JSON.stringify(payload);
      
      // Deux signatures differentes mais de meme longueur
      const validSignature = 'sha256=' + createHmac('sha256', WEBHOOK_SECRET)
        .update(bodyString)
        .digest('hex');
      
      const invalidSignature = 'sha256=' + 'a'.repeat(64); // Meme longueur
      
      const headers1 = new Headers();
      headers1.set('x-github-event', 'ping');
      headers1.set('x-hub-signature-256', validSignature);
      headers1.set('content-type', 'application/json');

      const request1 = new NextRequest('http://localhost:3000/api/webhooks/github', {
        method: 'POST',
        headers: headers1,
        body: bodyString,
      });

      const headers2 = new Headers();
      headers2.set('x-github-event', 'ping');
      headers2.set('x-hub-signature-256', invalidSignature);
      headers2.set('content-type', 'application/json');

      const request2 = new NextRequest('http://localhost:3000/api/webhooks/github', {
        method: 'POST',
        headers: headers2,
        body: bodyString,
      });

      const start1 = Date.now();
      const response1 = await POST(request1);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      const response2 = await POST(request2);
      const time2 = Date.now() - start2;

      expect(response1.status).toBe(200); // Valid
      expect(response2.status).toBe(401); // Invalid
      
      // Les temps doivent etre similaires (timing-safe)
      // Tolerance de 50ms pour variations systeme
      expect(Math.abs(time1 - time2)).toBeLessThan(50);
    });
  });
});
