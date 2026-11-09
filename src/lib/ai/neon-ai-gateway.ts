/**
 * 🌐 Neon AI Gateway Provider
 * 
 * Un seul endpoint + un seul token pour accéder à 42+ modèles IA :
 * OpenAI, Anthropic, Google, Meta, Mistral, etc.
 * 
 * Intégré dans la branche Neon (même infra que la DB).
 * Documentation: https://neon.com/docs/ai-gateway
 * 
 * Avantage pour l'avocat: UNE seule variable à configurer (NEON_AI_GATEWAY_TOKEN)
 */

import { logger } from '../logger';

// ============================================
// CONFIGURATION
// ============================================

const NEON_AI_GATEWAY_BASE_URL = process.env.NEON_AI_GATEWAY_BASE_URL || '';
const NEON_AI_GATEWAY_TOKEN = process.env.NEON_AI_GATEWAY_TOKEN || '';

// Modèle par défaut (peut être changé via env)
const DEFAULT_MODEL = process.env.NEON_AI_MODEL || 'mistral-small-latest';

// Coûts approximatifs par modèle (€ per 1000 tokens)
const MODEL_COSTS: Record<string, number> = {
  'gpt-4o-mini': 0.0003,
  'gpt-4o': 0.005,
  'gpt-5-mini': 0.0004,
  'claude-3-haiku-20240307': 0.0003,
  'claude-3-5-sonnet-20241022': 0.003,
  'mistral-small-latest': 0.0002,
  'mistral-large-latest': 0.002,
  'gemini-2.0-flash': 0.0001,
  'llama-3.1-8b-instruct': 0.0001,
  'kimi-k3': 0.0002,
};

// ============================================
// TYPES
// ============================================

export interface NeonAIResponse {
  text: string;
  tokensUsed: number;
  model: string;
  provider: 'neon-ai-gateway';
}

// ============================================
// CLIENT
// ============================================

export class NeonAIGatewayClient {
  private baseUrl: string;
  private token: string;
  private model: string;

  constructor() {
    this.baseUrl = NEON_AI_GATEWAY_BASE_URL;
    this.token = NEON_AI_GATEWAY_TOKEN;
    this.model = DEFAULT_MODEL;
  }

  /**
   * Vérifie si le gateway est configuré
   */
  async isAvailable(): Promise<boolean> {
    return !!(this.baseUrl && this.token);
  }

  /**
   * Obtenir le modèle actif
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Changer de modèle (1 string suffit)
   */
  setModel(model: string): void {
    this.model = model;
    logger.info(`Neon AI Gateway model changed to: ${model}`);
  }

  /**
   * Obtenir le coût estimé par 1000 tokens
   */
  getCostPer1000Tokens(): number {
    return MODEL_COSTS[this.model] || 0.0003; // Fallback moyen
  }

  /**
   * Générer du texte
   */
  async generate(prompt: string, options?: { systemPrompt?: string; model?: string }): Promise<NeonAIResponse> {
    const model = options?.model || this.model;
    const messages: Array<{ role: string; content: string }> = [];

    if (options?.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    return this.chatCompletion(messages, model);
  }

  /**
   * Chat avec historique de messages
   */
  async chat(messages: Array<{ role: string; content: string }>, model?: string): Promise<NeonAIResponse> {
    return this.chatCompletion(messages, model || this.model);
  }

  /**
   * Générer des embeddings
   */
  async generateEmbeddings(text: string, model?: string): Promise<number[]> {
    const embeddingModel = model || 'text-embedding-3-small';

    const response = await fetch(`${this.baseUrl}/v1/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: embeddingModel,
        input: text,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Neon AI Gateway embeddings error: ${response.status}`);
    }

    const data = await response.json();
    return data.data?.[0]?.embedding || [];
  }

  /**
   * Lister les modèles disponibles
   */
  async listModels(): Promise<string[]> {
    if (!this.baseUrl || !this.token) return [];

    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        headers: { 'Authorization': `Bearer ${this.token}` },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) return [];
      const data = await response.json();
      return (data.data || []).map((m: { id: string }) => m.id);
    } catch {
      return [];
    }
  }

  // ============================================
  // PRIVATE
  // ============================================

  private async chatCompletion(
    messages: Array<{ role: string; content: string }>,
    model: string
  ): Promise<NeonAIResponse> {
    if (!this.baseUrl || !this.token) {
      throw new Error('Neon AI Gateway non configuré. Ajoutez NEON_AI_GATEWAY_BASE_URL et NEON_AI_GATEWAY_TOKEN.');
    }

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 2048,
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const error = await response.text().catch(() => '');
      throw new Error(`Neon AI Gateway error ${response.status}: ${error}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    const tokensUsed = (data.usage?.prompt_tokens || 0) + (data.usage?.completion_tokens || 0);

    return { text, tokensUsed, model, provider: 'neon-ai-gateway' };
  }
}

// Singleton
export const neonAI = new NeonAIGatewayClient();
