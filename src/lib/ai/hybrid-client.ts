/**
 * Hybrid AI Client - Bascule Automatique Ollama ? Cloudflare Workers AI
 *
 * Strategie de fallback avec CONTROLE DES COUTS:
 * 1. Verifier le budget IA du tenant
 * 2. Verifier le cache IA (economie 30-50%)
 * 3. Essayer Ollama local (gratuit, prive) - TOUJOURS PRIORITAIRE
 * 4. Si echec ET budget OK ? Cloudflare Workers AI (payant, cloud)
 * 5. Si echec [Next] Erreur explicite
 *
 * ??? Anti-faillite: Force Ollama si budget depasse
 * ?? Cache IA: Reduit les couts de 30-50%
 */

import { OllamaClient } from '@/lib/ai/ollama-client';
import { cloudflareAI, CloudflareAI } from '../cloudflare/client';
import { cloudAI, CloudAIClient, CLOUD_AI_COSTS, CloudProvider } from './cloud-providers';
import { neonAI, NeonAIGatewayClient } from './neon-ai-gateway';
import { logger } from '../logger';
import {
  checkAICostBudget,
  recordAIUsage,
  estimateCost,
  selectOptimalProvider,
  AI_COSTS,
} from '../billing/cost-guard';
import { getCachedResponse, setCachedResponse, getCacheStats } from './ai-cache';
import { sanitizePromptForAI } from './prompt-sanitizer';

export type AIProvider =
  'ollama' | 'cloudflare' | 'openai' | 'mistral' | 'anthropic' | 'neon-ai-gateway' | 'none';

interface AIResponse {
  response: string;
  provider: AIProvider;
  model: string;
  latency: number;
  estimatedCost?: number;
  tokensUsed?: number;
}

export class HybridAIClient {
  private ollama: OllamaClient;
  private cloudflare: CloudflareAI;
  private cloud: CloudAIClient;
  private neon: NeonAIGatewayClient;
  private preferredProvider: AIProvider;
  private ollamaModel: string;

  constructor() {
    this.ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2:3b';
    this.ollama = new OllamaClient(
      process.env.OLLAMA_BASE_URL || process.env.OLLAMA_URL || 'http://localhost:11434',
      this.ollamaModel
    );
    this.cloudflare = cloudflareAI;
    this.cloud = cloudAI;
    this.neon = neonAI;

    // Preference: env var > Neon AI Gateway > cloud providers > Ollama
    const envProvider = process.env.AI_PREFERRED_PROVIDER as AIProvider | undefined;
    if (envProvider) {
      this.preferredProvider = envProvider;
    } else if (process.env.NEON_AI_GATEWAY_TOKEN) {
      // Neon AI Gateway = 1 token pour tout → priorité maximale
      this.preferredProvider = 'neon-ai-gateway';
    } else if (
      process.env.OPENAI_API_KEY ||
      process.env.MISTRAL_API_KEY ||
      process.env.ANTHROPIC_API_KEY
    ) {
      this.preferredProvider = (this.cloud.getActiveProvider() as AIProvider) || 'ollama';
    } else {
      this.preferredProvider = 'ollama';
    }
  }

  /**
   * Verifier la disponibilite de chaque provider
   */
  async checkAvailability(): Promise<{
    ollama: boolean;
    cloudflare: boolean;
    cloud: boolean;
    neon: boolean;
    cloudProvider: string | null;
    recommended: AIProvider;
  }> {
    const [ollamaAvailable, cloudflareAvailable, cloudAvailable, neonAvailable] = await Promise.all(
      [
        this.ollama.isAvailable(),
        this.cloudflare.isAvailable(),
        this.cloud.isAvailable(),
        this.neon.isAvailable(),
      ]
    );

    let recommended: AIProvider = 'none';
    if (neonAvailable) {
      recommended = 'neon-ai-gateway';
    } else if (this.preferredProvider === 'ollama' && ollamaAvailable) {
      recommended = 'ollama';
    } else if (
      ['openai', 'mistral', 'anthropic'].includes(this.preferredProvider) &&
      cloudAvailable
    ) {
      recommended = this.preferredProvider;
    } else if (ollamaAvailable) {
      recommended = 'ollama';
    } else if (cloudAvailable) {
      recommended = (this.cloud.getActiveProvider() as AIProvider) || 'openai';
    } else if (cloudflareAvailable) {
      recommended = 'cloudflare';
    }

    return {
      ollama: ollamaAvailable,
      cloudflare: cloudflareAvailable,
      cloud: cloudAvailable,
      neon: neonAvailable,
      cloudProvider: neonAvailable
        ? `neon:${this.neon.getModel()}`
        : this.cloud.getActiveProvider(),
      recommended,
    };
  }

  /**
   * ??? Generer une reponse avec controle des couts
   * Nouvelle signature avec tenantId obligatoire pour le tracking
   */
  async generateWithCostControl(
    prompt: string,
    tenantId: string,
    systemPrompt?: string
  ): Promise<AIResponse> {
    const startTime = Date.now();

    // 🔒 ÉTAPE SÉCURITÉ: Anonymiser le prompt AVANT tout envoi au LLM
    const { sanitizedText: safePrompt, redactedCount } = sanitizePromptForAI(prompt);
    const safeSystemPrompt = systemPrompt
      ? sanitizePromptForAI(systemPrompt).sanitizedText
      : undefined;

    if (redactedCount > 0) {
      logger.info('AI Isolation: PII redacted from prompt', { tenantId, redactedCount });
    }

    const estimatedTokens = Math.ceil((safePrompt.length + (safeSystemPrompt?.length || 0)) / 4);
    const fullPrompt = safeSystemPrompt ? `${safeSystemPrompt}\n\n${safePrompt}` : safePrompt;

    // ??? ETAPE 0: Verifier le cache IA
    const cached = await getCachedResponse(fullPrompt, 'auto', tenantId);
    if (cached.hit && cached.response) {
      logger.info('AI Cache HIT - Économie!', {
        tenantId,
        savedCost: `${cached.savedCost?.toFixed(4)}€`,
      });

      return {
        response: cached.response,
        provider: 'ollama', // Cache compte comme gratuit
        model: 'cache',
        latency: Date.now() - startTime,
        estimatedCost: 0,
        tokensUsed: 0,
      };
    }

    // 💰 ETAPE 1: Verifier le budget IA du tenant
    const optimalProvider = await selectOptimalProvider(tenantId, estimatedTokens);

    // 💰 ETAPE 2: Forcer Ollama si budget serré
    if (optimalProvider === 'ollama') {
      logger.info('Cost control: Using Ollama (budget protection)', { tenantId });
    }

    // 🌐 ETAPE 2.5: Neon AI Gateway (si configuré — 1 token pour 42+ modèles)
    if ((await this.neon.isAvailable()) && optimalProvider !== 'ollama') {
      const budget = await checkAICostBudget(tenantId);
      if (budget.allowed) {
        try {
          const neonResponse = await this.neon.generate(safePrompt, {
            systemPrompt: safeSystemPrompt,
          });
          const latency = Date.now() - startTime;
          const cost = (neonResponse.tokensUsed / 1000) * this.neon.getCostPer1000Tokens();

          await setCachedResponse(
            fullPrompt,
            'neon-ai-gateway',
            neonResponse.text,
            neonResponse.tokensUsed,
            tenantId
          );
          await recordAIUsage({
            tenantId,
            provider: 'cloudflare' as any, // Compatible avec le type existant
            tokensUsed: neonResponse.tokensUsed,
            costEur: cost,
            operation: 'generate',
            timestamp: new Date(),
          });

          logger.info('Neon AI Gateway used', {
            tenantId,
            model: neonResponse.model,
            cost: `${cost.toFixed(4)}€`,
          });

          return {
            response: neonResponse.text,
            provider: 'neon-ai-gateway' as AIProvider,
            model: neonResponse.model,
            latency,
            estimatedCost: cost,
            tokensUsed: neonResponse.tokensUsed,
          };
        } catch (error: unknown) {
          logger.warn('Neon AI Gateway failed, falling back', { error, tenantId });
        }
      }
    }

    // Essayer Ollama d'abord (TOUJOURS gratuit)
    if (await this.ollama.isAvailable()) {
      try {
        const response = await this.ollama.generate(safePrompt, safeSystemPrompt);
        const latency = Date.now() - startTime;
        const tokensUsed = Math.ceil(response.length / 4);

        // ?? Mettre en cache la réponse
        await setCachedResponse(fullPrompt, 'ollama', response, tokensUsed, tenantId);

        // Enregistrer l'usage (cout = 0 pour Ollama)
        await recordAIUsage({
          tenantId,
          provider: 'ollama',
          tokensUsed,
          costEur: 0,
          operation: 'generate',
          timestamp: new Date(),
        });

        return {
          response,
          provider: 'ollama',
          model: this.ollamaModel,
          latency,
          estimatedCost: 0,
          tokensUsed,
        };
      } catch (error: unknown) {
        logger.warn('Ollama failed', { error, tenantId });
      }
    }

    // 🌐 ETAPE 3: Utiliser Cloud AI (OpenAI/Mistral/Anthropic) si budget OK
    if (await this.cloud.isAvailable()) {
      const budget = await checkAICostBudget(tenantId);

      if (!budget.allowed) {
        logger.warn('Cloud AI blocked: budget exceeded', { tenantId, budget });
        throw new Error(
          `Budget IA épuisé (${budget.currentCost.toFixed(2)}€/${budget.limit}€). ` +
            `Installez Ollama localement ou passez au plan supérieur.`
        );
      }

      try {
        const cloudResponse = await this.cloud.generate(safePrompt, {
          systemPrompt: safeSystemPrompt,
        });
        const latency = Date.now() - startTime;
        const tokensUsed =
          cloudResponse.tokensUsed || Math.ceil(cloudResponse.text.length / 4) + estimatedTokens;
        const activeProvider = this.cloud.getActiveProvider() || 'openai';
        const providerCosts =
          CLOUD_AI_COSTS[activeProvider as CloudProvider] || CLOUD_AI_COSTS.openai;
        const cost = (tokensUsed / 1000) * providerCosts.costPer1000Tokens;

        // 💾 Mettre en cache la réponse
        await setCachedResponse(
          fullPrompt,
          activeProvider,
          cloudResponse.text,
          tokensUsed,
          tenantId
        );

        // Enregistrer l'usage PAYANT
        await recordAIUsage({
          tenantId,
          provider: activeProvider as 'ollama' | 'cloudflare',
          tokensUsed,
          costEur: cost,
          operation: 'generate',
          timestamp: new Date(),
        });

        logger.info('Cloud AI usage recorded', {
          tenantId,
          provider: activeProvider,
          cost: `${cost.toFixed(4)}€`,
          model: cloudResponse.model,
        });

        return {
          response: cloudResponse.text,
          provider: activeProvider as AIProvider,
          model: cloudResponse.model,
          latency,
          estimatedCost: cost,
          tokensUsed,
        };
      } catch (error: unknown) {
        logger.error('Cloud AI failed', { error, tenantId });
      }
    }

    // 🔄 ETAPE 4: Fallback legacy Cloudflare (si configuré)
    if (await this.cloudflare.isAvailable()) {
      const budget = await checkAICostBudget(tenantId);

      if (!budget.allowed) {
        throw new Error(
          `Budget IA épuisé (${budget.currentCost.toFixed(2)}€/${budget.limit}€). ` +
            `Installez Ollama localement ou passez au plan supérieur.`
        );
      }

      try {
        const response = await this.cloudflare.generate(safePrompt, {
          systemPrompt: safeSystemPrompt,
        });
        const latency = Date.now() - startTime;
        const tokensUsed = Math.ceil(response.length / 4) + estimatedTokens;
        const cost = estimateCost('cloudflare', tokensUsed);

        await setCachedResponse(fullPrompt, 'cloudflare', response, tokensUsed, tenantId);

        await recordAIUsage({
          tenantId,
          provider: 'cloudflare',
          tokensUsed,
          costEur: cost,
          operation: 'generate',
          timestamp: new Date(),
        });

        return {
          response,
          provider: 'cloudflare',
          model: process.env.CLOUDFLARE_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct',
          latency,
          estimatedCost: cost,
          tokensUsed,
        };
      } catch (error: unknown) {
        logger.error('Cloudflare failed', { error, tenantId });
      }
    }

    throw new Error(
      'Aucun provider IA disponible. Configurez une clé API (OPENAI_API_KEY, MISTRAL_API_KEY) ' +
        'ou installez Ollama: https://ollama.ai'
    );
  }

  /**
   * Generer une reponse avec fallback automatique (legacy - sans tracking couts)
   */
  async generate(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    const startTime = Date.now();

    // 🔒 SÉCURITÉ: Anonymiser avant envoi au LLM
    const { sanitizedText: safePrompt, redactedCount } = sanitizePromptForAI(prompt);
    const safeSystemPrompt = systemPrompt
      ? sanitizePromptForAI(systemPrompt).sanitizedText
      : undefined;

    if (redactedCount > 0) {
      logger.info('AI Isolation: PII redacted from prompt (legacy)', { redactedCount });
    }

    // Strategie 1: Provider prefere
    if (this.preferredProvider === 'ollama') {
      try {
        const response = await this.ollama.generate(safePrompt, safeSystemPrompt);
        const latency = Date.now() - startTime;

        logger.info('AI request succeeded with Ollama', { latency, model: this.ollama['model'] });

        return {
          response,
          provider: 'ollama',
          model: this.ollamaModel,
          latency,
        };
      } catch (error: unknown) {
        logger.warn('Ollama failed, falling back to Cloudflare', { error });
      }
    }

    if (this.preferredProvider === 'cloudflare') {
      try {
        const response = await this.cloudflare.generate(safePrompt, {
          systemPrompt: safeSystemPrompt,
        });
        const latency = Date.now() - startTime;

        logger.info('AI request succeeded with Cloudflare', { latency });

        return {
          response,
          provider: 'cloudflare',
          model: process.env.CLOUDFLARE_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct',
          latency,
        };
      } catch (error: unknown) {
        logger.warn('Cloudflare failed, falling back to Ollama', { error });
      }
    }

    // Strategie 2: Fallback sur l'autre provider
    const fallbackProvider = this.preferredProvider === 'ollama' ? 'cloudflare' : 'ollama';

    if (fallbackProvider === 'ollama') {
      try {
        const response = await this.ollama.generate(safePrompt, safeSystemPrompt);
        const latency = Date.now() - startTime;

        logger.info('AI request succeeded with Ollama (fallback)', { latency });

        return {
          response,
          provider: 'ollama',
          model: this.ollamaModel,
          latency,
        };
      } catch (error: unknown) {
        logger.error('Both AI providers failed', error);
      }
    } else {
      try {
        const response = await this.cloudflare.generate(safePrompt, {
          systemPrompt: safeSystemPrompt,
        });
        const latency = Date.now() - startTime;

        logger.info('AI request succeeded with Cloudflare (fallback)', { latency });

        return {
          response,
          provider: 'cloudflare',
          model: process.env.CLOUDFLARE_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct',
          latency,
        };
      } catch (error: unknown) {
        logger.error('Both AI providers failed', error);
      }
    }

    // Aucun provider disponible
    throw new Error('No AI provider available. Please check Ollama or Cloudflare configuration.');
  }

  /**
   * Chat avec contexte
   */
  async chat(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  ): Promise<AIResponse> {
    const startTime = Date.now();

    // 🔒 SÉCURITÉ: Anonymiser chaque message avant envoi au LLM cloud
    const sanitizedMessages = messages.map(msg => ({
      ...msg,
      content: sanitizePromptForAI(msg.content).sanitizedText,
    }));

    // Essayer Ollama d'abord (local = pas de fuite)
    if (await this.ollama.isAvailable()) {
      try {
        // Ollama est local → on peut envoyer les messages originaux
        const response = await this.ollama.chat(messages);
        const latency = Date.now() - startTime;

        return {
          response,
          provider: 'ollama',
          model: this.ollamaModel,
          latency,
        };
      } catch (error: unknown) {
        logger.warn('Ollama chat failed, trying cloud providers', { error });
      }
    }

    // Cloud AI (avec messages anonymisés)
    if (await this.cloud.isAvailable()) {
      try {
        const cloudResponse = await this.cloud.chat(sanitizedMessages);
        const latency = Date.now() - startTime;

        return {
          response: cloudResponse.text,
          provider: (this.cloud.getActiveProvider() || 'openai') as AIProvider,
          model: cloudResponse.model,
          latency,
        };
      } catch (error: unknown) {
        logger.warn('Cloud AI chat failed', { error });
      }
    }

    // Fallback Cloudflare (avec messages anonymisés)
    if (await this.cloudflare.isAvailable()) {
      try {
        const response = await this.cloudflare.chat(sanitizedMessages);
        const latency = Date.now() - startTime;

        return {
          response,
          provider: 'cloudflare',
          model: process.env.CLOUDFLARE_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct',
          latency,
        };
      } catch (error: unknown) {
        logger.error('Cloudflare chat failed', error);
      }
    }

    throw new Error('No AI provider available for chat');
  }

  /**
   * Generer des embeddings (pour recherche semantique)
   * ⚠️ Les embeddings encodent le sens du texte — anonymiser avant envoi cloud
   */
  async generateEmbeddings(text: string): Promise<number[]> {
    // 🔒 Anonymiser le texte avant envoi à tout provider cloud
    const { sanitizedText: safeText } = sanitizePromptForAI(text);

    // Cloud AI embeddings (OpenAI text-embedding-3-small ou Mistral-embed)
    if (await this.cloud.isAvailable()) {
      try {
        return await this.cloud.generateEmbeddings(safeText);
      } catch (error: unknown) {
        logger.warn('Cloud AI embeddings failed, trying Cloudflare', { error });
      }
    }

    // Cloudflare Workers AI embeddings
    if (await this.cloudflare.isAvailable()) {
      try {
        return await this.cloudflare.generateEmbeddings(safeText);
      } catch (error: unknown) {
        logger.warn('Cloudflare embeddings failed, trying Ollama', { error });
      }
    }

    // Fallback Ollama (local — pas de risque de fuite)
    if (await this.ollama.isAvailable()) {
      try {
        const ollamaEmbeddings = new OllamaClient(
          process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
          'nomic-embed-text'
        );

        await ollamaEmbeddings.generate(text); // Local = on peut envoyer le texte brut
        return [];
      } catch (error: unknown) {
        logger.error('Ollama embeddings failed', error);
      }
    }

    throw new Error('No AI provider available for embeddings');
  }

  /**
   * Forcer l'utilisation d'un provider specifique
   */
  setPreferredProvider(provider: AIProvider): void {
    this.preferredProvider = provider;
    logger.info(`AI provider preference changed to: ${provider}`);
  }

  /**
   * Obtenir le provider actuellement utilise
   */
  getPreferredProvider(): AIProvider {
    return this.preferredProvider;
  }
}

// Export instance singleton
export const hybridAI = new HybridAIClient();

export default hybridAI;

// render-deploy-trigger
