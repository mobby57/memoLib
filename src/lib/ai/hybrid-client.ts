/**
 * Hybrid AI Client - Bascule Automatique Ollama ↔ Cloudflare Workers AI
 * 
 * Strategie de fallback avec CONTROLE DES COUTS:
 * 1. Verifier le budget IA du tenant
 * 2. Verifier le cache IA (economie 30-50%)
 * 3. Essayer Ollama local (gratuit, prive) - TOUJOURS PRIORITAIRE
 * 4. Si echec ET budget OK → Cloudflare Workers AI (payant, cloud)
 * 5. Si echec [Next] Erreur explicite
 * 
 * 🛡️ Anti-faillite: Force Ollama si budget depasse
 * 💰 Cache IA: Reduit les couts de 30-50%
 */

import { OllamaClient } from '../../../lib/ai/ollama-client';
import { cloudflareAI, CloudflareAI } from '../cloudflare/client';
import { logger } from '../logger';
import { 
  checkAICostBudget, 
  recordAIUsage, 
  estimateCost,
  selectOptimalProvider,
  AI_COSTS
} from '../billing/cost-guard';
import { getCachedResponse, setCachedResponse, getCacheStats } from './ai-cache';

export type AIProvider = 'ollama' | 'cloudflare' | 'none';

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
  private preferredProvider: AIProvider;
  
  constructor() {
    this.ollama = new OllamaClient(
      process.env.OLLAMA_BASE_URL || process.env.OLLAMA_URL || 'http://localhost:11434',
      process.env.OLLAMA_MODEL || 'llama3.2:3b'
    );
    this.cloudflare = cloudflareAI;
    
    // Preference: Ollama (local) > Cloudflare (cloud)
    this.preferredProvider = process.env.AI_PREFERRED_PROVIDER as AIProvider || 'ollama';
  }
  
  /**
   * Verifier la disponibilite de chaque provider
   */
  async checkAvailability(): Promise<{
    ollama: boolean;
    cloudflare: boolean;
    recommended: AIProvider;
  }> {
    const [ollamaAvailable, cloudflareAvailable] = await Promise.all([
      this.ollama.isAvailable(),
      this.cloudflare.isAvailable(),
    ]);
    
    let recommended: AIProvider = 'none';
    if (this.preferredProvider === 'ollama' && ollamaAvailable) {
      recommended = 'ollama';
    } else if (this.preferredProvider === 'cloudflare' && cloudflareAvailable) {
      recommended = 'cloudflare';
    } else if (ollamaAvailable) {
      recommended = 'ollama';
    } else if (cloudflareAvailable) {
      recommended = 'cloudflare';
    }
    
    return { ollama: ollamaAvailable, cloudflare: cloudflareAvailable, recommended };
  }
  
  /**
   * 🛡️ Generer une reponse avec controle des couts
   * Nouvelle signature avec tenantId obligatoire pour le tracking
   */
  async generateWithCostControl(
    prompt: string, 
    tenantId: string,
    systemPrompt?: string
  ): Promise<AIResponse> {
    const startTime = Date.now();
    const estimatedTokens = Math.ceil((prompt.length + (systemPrompt?.length || 0)) / 4);
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
    
    // 🛡️ ETAPE 0: Verifier le cache IA
    const cached = await getCachedResponse(fullPrompt, 'auto');
    if (cached.hit && cached.response) {
      logger.info('AI Cache HIT - Économie!', { 
        tenantId, 
        savedCost: `${cached.savedCost?.toFixed(4)}€` 
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
    
    // 🛡️ ETAPE 1: Verifier le budget IA du tenant
    const optimalProvider = await selectOptimalProvider(tenantId, estimatedTokens);
    
    // 🛡️ ETAPE 2: Forcer Ollama si budget serre
    if (optimalProvider === 'ollama') {
      logger.info('Cost control: Using Ollama (budget protection)', { tenantId });
    }
    
    // Essayer Ollama d'abord (TOUJOURS gratuit)
    if (await this.ollama.isAvailable()) {
      try {
        const response = await this.ollama.generate(prompt, systemPrompt);
        const latency = Date.now() - startTime;
        const tokensUsed = Math.ceil(response.length / 4);
        
        // 💾 Mettre en cache la réponse
        await setCachedResponse(fullPrompt, 'ollama', response, tokensUsed);
        
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
          model: this.ollama['model'] || 'llama3.2:3b',
          latency,
          estimatedCost: 0,
          tokensUsed,
        };
      } catch (error) {
        logger.warn('Ollama failed', { error, tenantId });
      }
    }
    
    // 🛡️ ETAPE 3: Utiliser Cloudflare SEULEMENT si budget OK
    if (optimalProvider === 'cloudflare' && await this.cloudflare.isAvailable()) {
      const budget = await checkAICostBudget(tenantId);
      
      if (!budget.allowed) {
        logger.warn('Cloudflare blocked: budget exceeded', { tenantId, budget });
        throw new Error(
          `Budget IA épuisé (${budget.currentCost.toFixed(2)}€/${budget.limit}€). ` +
          `Installez Ollama localement ou passez au plan supérieur.`
        );
      }
      
      try {
        const response = await this.cloudflare.generate(prompt, { systemPrompt });
        const latency = Date.now() - startTime;
        const tokensUsed = Math.ceil(response.length / 4) + estimatedTokens;
        const cost = estimateCost('cloudflare', tokensUsed);
        
        // 💾 Mettre en cache la réponse (important pour Cloudflare payant!)
        await setCachedResponse(fullPrompt, 'cloudflare', response, tokensUsed);
        
        // Enregistrer l'usage PAYANT
        await recordAIUsage({
          tenantId,
          provider: 'cloudflare',
          tokensUsed,
          costEur: cost,
          operation: 'generate',
          timestamp: new Date(),
        });
        
        logger.info('Cloudflare usage recorded', { tenantId, cost: `${cost.toFixed(4)}€` });
        
        return {
          response,
          provider: 'cloudflare',
          model: process.env.CLOUDFLARE_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct',
          latency,
          estimatedCost: cost,
          tokensUsed,
        };
      } catch (error) {
        logger.error('Cloudflare failed', { error, tenantId });
      }
    }
    
    throw new Error('Aucun provider IA disponible. Installez Ollama: https://ollama.ai');
  }
  
  /**
   * Generer une reponse avec fallback automatique (legacy - sans tracking couts)
   */
  async generate(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    const startTime = Date.now();
    
    // Strategie 1: Provider prefere
    if (this.preferredProvider === 'ollama') {
      try {
        const response = await this.ollama.generate(prompt, systemPrompt);
        const latency = Date.now() - startTime;
        
        logger.info('AI request succeeded with Ollama', { latency, model: this.ollama['model'] });
        
        return {
          response,
          provider: 'ollama',
          model: this.ollama['model'] || 'llama3.2:3b',
          latency,
        };
      } catch (error) {
        logger.warn('Ollama failed, falling back to Cloudflare', { error });
      }
    }
    
    if (this.preferredProvider === 'cloudflare') {
      try {
        const response = await this.cloudflare.generate(prompt, { systemPrompt });
        const latency = Date.now() - startTime;
        
        logger.info('AI request succeeded with Cloudflare', { latency });
        
        return {
          response,
          provider: 'cloudflare',
          model: process.env.CLOUDFLARE_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct',
          latency,
        };
      } catch (error) {
        logger.warn('Cloudflare failed, falling back to Ollama', { error });
      }
    }
    
    // Strategie 2: Fallback sur l'autre provider
    const fallbackProvider = this.preferredProvider === 'ollama' ? 'cloudflare' : 'ollama';
    
    if (fallbackProvider === 'ollama') {
      try {
        const response = await this.ollama.generate(prompt, systemPrompt);
        const latency = Date.now() - startTime;
        
        logger.info('AI request succeeded with Ollama (fallback)', { latency });
        
        return {
          response,
          provider: 'ollama',
          model: this.ollama['model'] || 'llama3.2:3b',
          latency,
        };
      } catch (error) {
        logger.error('Both AI providers failed', error);
      }
    } else {
      try {
        const response = await this.cloudflare.generate(prompt, { systemPrompt });
        const latency = Date.now() - startTime;
        
        logger.info('AI request succeeded with Cloudflare (fallback)', { latency });
        
        return {
          response,
          provider: 'cloudflare',
          model: process.env.CLOUDFLARE_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct',
          latency,
        };
      } catch (error) {
        logger.error('Both AI providers failed', error);
      }
    }
    
    // Aucun provider disponible
    throw new Error('No AI provider available. Please check Ollama or Cloudflare configuration.');
  }
  
  /**
   * Chat avec contexte
   */
  async chat(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>): Promise<AIResponse> {
    const startTime = Date.now();
    
    // Essayer Ollama d'abord
    if (await this.ollama.isAvailable()) {
      try {
        const response = await this.ollama.chat(messages);
        const latency = Date.now() - startTime;
        
        return {
          response,
          provider: 'ollama',
          model: this.ollama['model'] || 'llama3.2:3b',
          latency,
        };
      } catch (error) {
        logger.warn('Ollama chat failed, trying Cloudflare', { error });
      }
    }
    
    // Fallback Cloudflare
    if (await this.cloudflare.isAvailable()) {
      try {
        const response = await this.cloudflare.chat(messages);
        const latency = Date.now() - startTime;
        
        return {
          response,
          provider: 'cloudflare',
          model: process.env.CLOUDFLARE_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct',
          latency,
        };
      } catch (error) {
        logger.error('Cloudflare chat failed', error);
      }
    }
    
    throw new Error('No AI provider available for chat');
  }
  
  /**
   * Generer des embeddings (pour recherche semantique)
   */
  async generateEmbeddings(text: string): Promise<number[]> {
    // Cloudflare Workers AI a un meilleur modele d'embeddings
    if (await this.cloudflare.isAvailable()) {
      try {
        return await this.cloudflare.generateEmbeddings(text);
      } catch (error) {
        logger.warn('Cloudflare embeddings failed, trying Ollama', { error });
      }
    }
    
    // Fallback Ollama avec nomic-embed-text
    if (await this.ollama.isAvailable()) {
      try {
        // Utiliser modele embeddings d'Ollama
        const ollamaEmbeddings = new OllamaClient(
          process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
          'nomic-embed-text'
        );
        
        const response = await ollamaEmbeddings.generate(text);
        // Convertir reponse en embeddings (simplification - Ollama retourne du texte)
        // En production, utiliser un vrai modele d'embeddings
        return [];
      } catch (error) {
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
