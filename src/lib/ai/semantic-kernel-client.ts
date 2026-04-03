type EmailUrgency = 'low' | 'medium' | 'high';

export interface SemanticKernelEmailAnalysis {
  typeDossier: string;
  urgency: EmailUrgency;
  clientName?: string;
  summary: string;
  entities?: {
    dates?: string[];
    documents?: string[];
    references?: string[];
  };
}

interface AnalyzeEmailPayload {
  subject: string;
  body: string;
}

/**
 * Thin adapter for a Semantic Kernel HTTP service.
 *
 * Expected endpoint contract:
 * - GET {baseUrl}/health (200 => available)
 * - POST {baseUrl}/api/email/analyze with { subject, body }
 */
export class SemanticKernelClient {
  private readonly baseUrl: string;

  constructor(baseUrl = process.env.SEMANTIC_KERNEL_API_URL || '') {
    this.baseUrl = baseUrl.trim().replace(/\/$/, '');
  }

  isConfigured(): boolean {
    return this.baseUrl.length > 0;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async analyzeEmail(subject: string, body: string): Promise<SemanticKernelEmailAnalysis> {
    if (!this.isConfigured()) {
      throw new Error('Semantic Kernel is not configured');
    }

    const payload: AnalyzeEmailPayload = { subject, body };

    const response = await fetch(`${this.baseUrl}/api/email/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Semantic Kernel analyze failed with status ${response.status}`);
    }

    const result = (await response.json()) as SemanticKernelEmailAnalysis;

    return {
      typeDossier: result.typeDossier || 'GENERAL',
      urgency: result.urgency || 'medium',
      clientName: result.clientName,
      summary: result.summary || 'Analyse disponible',
      entities: result.entities || {},
    };
  }
}

export const semanticKernelClient = new SemanticKernelClient();
