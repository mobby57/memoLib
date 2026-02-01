/**
 * AI Service Client
 *
 * Client TypeScript pour communiquer avec le service AI Python (FastAPI)
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export interface AnalysisRequest {
  text: string;
  analyze_entities?: boolean;
  analyze_urgency?: boolean;
  analyze_sentiment?: boolean;
  language?: string;
}

export interface Entity {
  text: string;
  type: string;
  start: number;
  end: number;
  confidence: number;
}

export interface AnalysisResponse {
  id: string;
  summary: string;
  category: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  entities: Entity[];
  key_dates: Array<{ date: string; context: string }>;
  key_amounts: Array<{ amount: number; currency: string; context: string }>;
  suggested_actions: string[];
  processing_time_ms: number;
}

export interface GenerateRequest {
  document_type:
    | 'email_response'
    | 'legal_brief'
    | 'contract_clause'
    | 'memo'
    | 'letter'
    | 'summary';
  context: string;
  tone?: 'formal' | 'professional' | 'friendly' | 'assertive' | 'conciliatory';
  language?: string;
  max_length?: number;
  client_name?: string;
  case_reference?: string;
}

export interface GenerateResponse {
  id: string;
  document_type: string;
  content: string;
  word_count: number;
  suggestions: string[];
  created_at: string;
}

export interface EmailDraftRequest {
  original_email: string;
  intent: string;
  tone?: 'formal' | 'professional' | 'friendly' | 'assertive' | 'conciliatory';
  include_greeting?: boolean;
  include_signature?: boolean;
  signer_name?: string;
  signer_title?: string;
}

export interface EmailDraftResponse {
  subject: string;
  body: string;
  alternatives: string[];
  detected_language: string;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  timestamp: string;
  version: string;
}

class AIServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

async function fetchAI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${AI_SERVICE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new AIServiceError(
        error.detail || `AI Service error: ${response.status}`,
        response.status,
        error
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof AIServiceError) throw error;
    throw new AIServiceError(`Failed to connect to AI Service: ${(error as Error).message}`, 503);
  }
}

/**
 * AI Service Client
 */
export const aiService = {
  /**
   * Check AI service health
   */
  async health(): Promise<HealthStatus> {
    return fetchAI<HealthStatus>('/health');
  },

  /**
   * Analyze text for entities, urgency, and classification
   */
  async analyze(request: AnalysisRequest): Promise<AnalysisResponse> {
    return fetchAI<AnalysisResponse>('/api/analysis/analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Summarize text content
   */
  async summarize(
    text: string,
    maxLength: number = 500,
    style: 'professional' | 'simple' | 'bullet' = 'professional'
  ): Promise<{ summary: string; key_points: string[] }> {
    return fetchAI('/api/analysis/summarize', {
      method: 'POST',
      body: JSON.stringify({ text, max_length: maxLength, style }),
    });
  },

  /**
   * Generate a document based on context
   */
  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    return fetchAI<GenerateResponse>('/api/generation/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Generate an email response
   */
  async generateEmail(request: EmailDraftRequest): Promise<EmailDraftResponse> {
    return fetchAI<EmailDraftResponse>('/api/generation/email', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Upload and process a document
   */
  async uploadDocument(file: File): Promise<{ id: string; status: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${AI_SERVICE_URL}/api/documents/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new AIServiceError(error.detail || 'Upload failed', response.status, error);
    }

    return response.json();
  },

  /**
   * Perform OCR on a document
   */
  async ocr(
    documentId: string,
    language: string = 'fra'
  ): Promise<{ text_content: string; confidence: number }> {
    return fetchAI('/api/documents/ocr', {
      method: 'POST',
      body: JSON.stringify({ document_id: documentId, language }),
    });
  },
};

export default aiService;
