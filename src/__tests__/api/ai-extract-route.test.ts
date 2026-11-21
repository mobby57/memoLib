import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  checkRateLimit: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({ auth: mocks.auth }));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: mocks.checkRateLimit }));
vi.mock('@/lib/logger', () => ({ logger: { error: mocks.loggerError } }));

import { POST } from '@/app/api/ai/extract/route';

function createRequest(
  file: File,
  type = 'OQTF'
): Request {
  const formData = new FormData();
  formData.set('file', file);
  formData.set('type', type);
  return new Request('http://localhost/api/ai/extract', { method: 'POST', body: formData });
}

function createPdf() {
  return new File([Buffer.from('%PDF-1.7\nsample')], 'document.pdf', {
    type: 'application/pdf',
  });
}

describe('/api/ai/extract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.stubEnv('MISTRAL_API_KEY', '');
    mocks.auth.mockResolvedValue({ userId: 'clerk-user-id' });
    mocks.checkRateLimit.mockResolvedValue({ success: true });
    vi.stubGlobal('fetch', vi.fn());
  });

  it('requires authentication', async () => {
    mocks.auth.mockResolvedValue({ userId: null });

    const response = await POST(createRequest(createPdf()));

    expect(response.status).toBe(401);
    expect(mocks.checkRateLimit).not.toHaveBeenCalled();
  });

  it('rejects unsupported MIME types before extraction', async () => {
    const executable = new File([Buffer.from('not-an-image')], 'file.exe', {
      type: 'application/octet-stream',
    });

    const response = await POST(createRequest(executable));

    expect(response.status).toBe(415);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects files larger than 10 MB before reading their content', async () => {
    const largePdf = new File([Buffer.alloc(10 * 1024 * 1024 + 1)], 'large.pdf', {
      type: 'application/pdf',
    });

    const response = await POST(createRequest(largePdf));

    expect(response.status).toBe(413);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not use mock data in production when the key is missing', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    const response = await POST(createRequest(createPdf()));

    expect(response.status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('uses the AI rate limit and sends PDFs as document content', async () => {
    vi.stubEnv('MISTRAL_API_KEY', 'test-key');
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{
        message: {
          content: JSON.stringify({
            nom: 'Dupont',
            prenom: 'Marie',
            dateNaissance: '',
            nationalite: 'Française',
            numeroDocument: '',
            dateNotification: '',
          }),
        },
      }],
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(createRequest(createPdf()));

    expect(response.status).toBe(200);
    expect(mocks.checkRateLimit).toHaveBeenCalledWith('clerk-user-id', 'ai');
    const requestBody = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    expect(requestBody.messages[1].content[1].type).toBe('document_url');
  });
});
