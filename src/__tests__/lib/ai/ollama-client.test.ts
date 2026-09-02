import { afterEach, describe, expect, it, vi } from 'vitest';
import { OllamaClient } from '@/lib/ai/ollama-client';

describe('OllamaClient', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('redacts PII before sending a generation prompt', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ response: 'réponse' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await new OllamaClient('http://ollama.test').generate('Contactez alice@example.com au 0612345678.');

    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.prompt).toContain('[EMAIL_REDACTED]');
    expect(payload.prompt).toContain('[TEL_REDACTED]');
    expect(payload.prompt).not.toContain('alice@example.com');
    expect(payload.prompt).not.toContain('0612345678');
  });

  it('redacts PII in chat messages before sending them', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ message: { content: 'réponse' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await new OllamaClient('http://ollama.test').chat([
      { role: 'user', content: 'Mon email est alice@example.com.' },
    ]);

    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.messages[0].content).toContain('[EMAIL_REDACTED]');
    expect(payload.messages[0].content).not.toContain('alice@example.com');
  });
});
