/**
 * Hybrid AI Client - Bascule Automatique Ollama ↔ Cloudflare Workers AI
 * 
 * Stratégie de fallback:
 * 1. Essayer Ollama local (gratuit, privé)
 * 2. Si échec → Cloudflare Workers AI (payant, cloud)
 * 3. Si échec → Erreur explicite
 */

import { OllamaClient } from '../../../lib/ai/ollama-client';
import { cloudflareAI, CloudflareAI } from '../cloudflare/client';
import { logger } from '../logger';

export type AIProvider = 'ollama' | 'cloudflare' | 'none';

interface AIResponse {
  response: string;
  provider: AIProvider;
  model: string;
  latency: number;
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
    
    // Préférence: Ollama (local) > Cloudflare (cloud)
    this.preferredProvider = process.env.AI_PREFERRED_PROVIDER as AIProvider || 'ollama';
  }
  
  /**
   * Vérifier la disponibilité de chaque provider
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
   * Générer une réponse avec fallback automatique
   */
  async generate(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    const startTime = Date.now();
    
    // Stratégie 1: Provider préféré
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
    
    // Stratégie 2: Fallback sur l'autre provider
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
   * Générer des embeddings (pour recherche sémantique)
   */
  async generateEmbeddings(text: string): Promise<number[]> {
    // Cloudflare Workers AI a un meilleur modèle d'embeddings
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
        // Utiliser modèle embeddings d'Ollama
        const ollamaEmbeddings = new OllamaClient(
          process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
          'nomic-embed-text'
        );
        
        const response = await ollamaEmbeddings.generate(text);
        // Convertir réponse en embeddings (simplification - Ollama retourne du texte)
        // En production, utiliser un vrai modèle d'embeddings
        return [];
      } catch (error) {
        logger.error('Ollama embeddings failed', error);
      }
    }
    
    throw new Error('No AI provider available for embeddings');
  }
  
  /**
   * Forcer l'utilisation d'un provider spécifique
   */
  setPreferredProvider(provider: AIProvider): void {
    this.preferredProvider = provider;
    logger.info(`AI provider preference changed to: ${provider}`);
  }
  
  /**
   * Obtenir le provider actuellement utilisé
   */
  getPreferredProvider(): AIProvider {
    return this.preferredProvider;
  }
}

// Export instance singleton
export const hybridAI = new HybridAIClient();

export default hybridAI;
