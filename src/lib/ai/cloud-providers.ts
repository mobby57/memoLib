/**
 * 🌐 Cloud AI Providers - OpenAI, Mistral, Anthropic
 * 
 * Remplace le stub Cloudflare pour offrir une IA cloud fonctionnelle
 * aux avocats qui n'installent pas Ollama localement.
 * 
 * Sécurité: PII déjà anonymisées par le HybridAIClient avant appel ici.
 */

import { logger } from '../logger';

// ============================================
// TYPES
// ============================================

export type CloudProvider = 'openai' | 'mistral' | 'anthropic';

interface CloudAIConfig {
  provider: CloudProvider;
  apiKey: string;
  model: string;
  baseUrl: string;
  maxTokens: number;
}

interface CloudAIResponse {
  text: string;
  tokensUsed: number;
  model: string;
}

// ============================================
// CONFIGURATION DES PROVIDERS
// ============================================

const PROVIDER_CONFIGS: Record<CloudProvider, Omit<CloudAIConfig, 'apiKey'>> = {
  openai: {
    provider: 'openai',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
    maxTokens: 2048,
  },
  mistral: {
    provider: 'mistral',
    model: process.env.MISTRAL_MODEL || 'mistral-small-latest',
    baseUrl: 'https://api.mistral.ai/v1',
    maxTokens: 2048,
  },
  anthropic: {
    provider: 'anthropic',
    model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
    baseUrl: 'https://api.anthropic.com/v1',
    maxTokens: 2048,
  },
};

// Coûts par provider (EUR pour 1000 tokens, input+output moyenné)
export const CLOUD_AI_COSTS: Record<CloudProvider, { costPer1000Tokens: number; costPerEmbedding: number }> = {
  openai: {
    costPer1000Tokens: 0.0003, // gpt-4o-mini: ~$0.15/1M input + $0.60/1M output moyenné
    costPerEmbedding: 0.0001,
  },
  mistral: {
    costPer1000Tokens: 0.0002, // mistral-small: ~€0.2/1M input + €0.6/1M output moyenné
    costPerEmbedding: 0.0001,
  },
  anthropic: {
    costPer1000Tokens: 0.0003, // claude-3-haiku: ~$0.25/1M input + $1.25/1M output moyenné
    costPerEmbedding: 0.0001,
  },
};

// ============================================
// CLIENT CLOUD AI
// ============================================

export class CloudAIClient {
  private configs: Map<CloudProvider, CloudAIConfig> = new Map();
  private preferredProvider: CloudProvider | null = null;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // OpenAI
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      this.configs.set('openai', { ...PROVIDER_CONFIGS.openai, apiKey: openaiKey });
    }

    // Mistral
    const mistralKey = process.env.MISTRAL_API_KEY;
    if (mistralKey) {
      this.configs.set('mistral', { ...PROVIDER_CONFIGS.mistral, apiKey: mistralKey });
    }

    // Anthropic
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      this.configs.set('anthropic', { ...PROVIDER_CONFIGS.anthropic, apiKey: anthropicKey });
    }

    // Déterminer le provider préféré
    const envPreferred = process.env.CLOUD_AI_PROVIDER as CloudProvider | undefined;
    if (envPreferred && this.configs.has(envPreferred)) {
      this.preferredProvider = envPreferred;
    } else if (this.configs.size > 0) {
      // Priorité: Mistral (FR, RGPD-friendly) > OpenAI > Anthropic
      if (this.configs.has('mistral')) this.preferredProvider = 'mistral';
      else if (this.configs.has('openai')) this.preferredProvider = 'openai';
      else if (this.configs.has('anthropic')) this.preferredProvider = 'anthropic';
    }
  }

  /**
   * Vérifier si au moins un provider cloud est disponible
   */
  async isAvailable(): Promise<boolean> {
    return this.configs.size > 0 && this.preferredProvider !== null;
  }

  /**
   * Obtenir le provider actif
   */
  getActiveProvider(): CloudProvider | null {
    return this.preferredProvider;
  }

  /**
   * Obtenir les providers configurés
   */
  getConfiguredProviders(): CloudProvider[] {
    return Array.from(this.configs.keys());
  }

  /**
   * Générer une réponse texte
   */
  async generate(prompt: string, options?: { systemPrompt?: string }): Promise<CloudAIResponse> {
    if (!this.preferredProvider) {
      throw new Error('Aucun provider IA cloud configuré. Ajoutez OPENAI_API_KEY, MISTRAL_API_KEY ou ANTHROPIC_API_KEY.');
    }

    const providers = this.getProviderFallbackChain();

    for (const provider of providers) {
      try {
        return await this.callProvider(provider, prompt, options?.systemPrompt);
      } catch (error) {
        logger.warn(`Cloud AI provider ${provider} failed, trying next`, { error });
      }
    }

    throw new Error('Tous les providers IA cloud ont échoué.');
  }

  /**
   * Chat avec messages
   */
  async chat(messages: Array<{ role: string; content: string }>): Promise<CloudAIResponse> {
    if (!this.preferredProvider) {
      throw new Error('Aucun provider IA cloud configuré.');
    }

    const providers = this.getProviderFallbackChain();

    for (const provider of providers) {
      try {
        return await this.callProviderChat(provider, messages);
      } catch (error) {
        logger.warn(`Cloud AI chat provider ${provider} failed`, { error });
      }
    }

    throw new Error('Tous les providers IA cloud ont échoué.');
  }

  /**
   * Générer des embeddings
   */
  async generateEmbeddings(text: string): Promise<number[]> {
    // Priorité aux embeddings OpenAI (meilleur rapport qualité/prix)
    const openaiConfig = this.configs.get('openai');
    if (openaiConfig) {
      try {
        return await this.callOpenAIEmbeddings(openaiConfig, text);
      } catch (error) {
        logger.warn('OpenAI embeddings failed', { error });
      }
    }

    const mistralConfig = this.configs.get('mistral');
    if (mistralConfig) {
      try {
        return await this.callMistralEmbeddings(mistralConfig, text);
      } catch (error) {
        logger.warn('Mistral embeddings failed', { error });
      }
    }

    throw new Error('Aucun provider d\'embeddings disponible.');
  }

  // ============================================
  // APPELS API PAR PROVIDER
  // ============================================

  private async callProvider(provider: CloudProvider, prompt: string, systemPrompt?: string): Promise<CloudAIResponse> {
    const config = this.configs.get(provider)!;

    if (provider === 'anthropic') {
      return this.callAnthropic(config, prompt, systemPrompt);
    }

    // OpenAI et Mistral utilisent le même format (OpenAI-compatible)
    return this.callOpenAICompatible(config, prompt, systemPrompt);
  }

  private async callProviderChat(provider: CloudProvider, messages: Array<{ role: string; content: string }>): Promise<CloudAIResponse> {
    const config = this.configs.get(provider)!;

    if (provider === 'anthropic') {
      return this.callAnthropicChat(config, messages);
    }

    return this.callOpenAICompatibleChat(config, messages);
  }

  private async callOpenAICompatible(config: CloudAIConfig, prompt: string, systemPrompt?: string): Promise<CloudAIResponse> {
    const messages: Array<{ role: string; content: string }> = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    return this.callOpenAICompatibleChat(config, messages);
  }

  private async callOpenAICompatibleChat(config: CloudAIConfig, messages: Array<{ role: string; content: string }>): Promise<CloudAIResponse> {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        max_tokens: config.maxTokens,
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const error = await response.text().catch(() => 'Unknown error');
      throw new Error(`${config.provider} API error ${response.status}: ${error}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    const tokensUsed = (data.usage?.prompt_tokens || 0) + (data.usage?.completion_tokens || 0);

    return { text, tokensUsed, model: config.model };
  }

  private async callAnthropic(config: CloudAIConfig, prompt: string, systemPrompt?: string): Promise<CloudAIResponse> {
    const messages: Array<{ role: string; content: string }> = [
      { role: 'user', content: prompt },
    ];
    return this.callAnthropicChat(config, messages, systemPrompt);
  }

  private async callAnthropicChat(config: CloudAIConfig, messages: Array<{ role: string; content: string }>, systemPrompt?: string): Promise<CloudAIResponse> {
    const system = systemPrompt || messages.find(m => m.role === 'system')?.content;
    const userMessages = messages.filter(m => m.role !== 'system');

    const body: Record<string, unknown> = {
      model: config.model,
      max_tokens: config.maxTokens,
      messages: userMessages,
      temperature: 0.1,
    };
    if (system) {
      body.system = system;
    }

    const response = await fetch(`${config.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const error = await response.text().catch(() => 'Unknown error');
      throw new Error(`Anthropic API error ${response.status}: ${error}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

    return { text, tokensUsed, model: config.model };
  }

  private async callOpenAIEmbeddings(config: CloudAIConfig, text: string): Promise<number[]> {
    const response = await fetch(`${config.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`OpenAI embeddings error ${response.status}`);
    }

    const data = await response.json();
    return data.data?.[0]?.embedding || [];
  }

  private async callMistralEmbeddings(config: CloudAIConfig, text: string): Promise<number[]> {
    const response = await fetch(`${config.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-embed',
        input: [text],
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Mistral embeddings error ${response.status}`);
    }

    const data = await response.json();
    return data.data?.[0]?.embedding || [];
  }

  // ============================================
  // HELPERS
  // ============================================

  private getProviderFallbackChain(): CloudProvider[] {
    const chain: CloudProvider[] = [];
    if (this.preferredProvider) {
      chain.push(this.preferredProvider);
    }
    // Ajouter les autres providers comme fallback
    const allProviders = this.getConfiguredProviders();
    for (const provider of allProviders) {
      if (!chain.includes(provider)) {
        chain.push(provider);
      }
    }
    return chain;
  }
}

// Singleton exporté
export const cloudAI = new CloudAIClient();
