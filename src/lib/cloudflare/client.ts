/**
 * Cloudflare SDK Client - Configuration Centralisée
 * 
 * Services supportés:
 * - Workers AI (alternative à Ollama)
 * - R2 Storage (alternative à S3)
 * - D1 Database (SQLite serverless)
 * - KV Storage (key-value)
 * - Analytics
 */

import Cloudflare from 'cloudflare';

// Configuration depuis environnement
const CLOUDFLARE_CONFIG = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
  apiToken: process.env.CLOUDFLARE_API_TOKEN || '',
  
  // Workers AI
  workersAI: {
    enabled: process.env.CLOUDFLARE_WORKERS_AI === 'true',
    defaultModel: process.env.CLOUDFLARE_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct',
  },
  
  // R2 Storage
  r2: {
    enabled: process.env.R2_ENABLED === 'true',
    bucketName: process.env.R2_BUCKET_NAME || 'iaposte-documents',
    publicUrl: process.env.R2_PUBLIC_URL || '',
  },
  
  // D1 Database
  d1: {
    enabled: process.env.D1_ENABLED === 'true',
    databaseId: process.env.D1_DATABASE_ID || '',
  },
};

/**
 * Client Cloudflare singleton
 */
export const cloudflareClient = new Cloudflare({
  apiToken: CLOUDFLARE_CONFIG.apiToken,
});

/**
 * Vérifier si Cloudflare est disponible
 */
export async function isCloudflareAvailable(): Promise<boolean> {
  if (!CLOUDFLARE_CONFIG.apiToken || !CLOUDFLARE_CONFIG.accountId) {
    return false;
  }
  
  try {
    // Test simple: vérifier le compte
    await cloudflareClient.accounts.get({ account_id: CLOUDFLARE_CONFIG.accountId });
    return true;
  } catch {
    return false;
  }
}

/**
 * Workers AI - Alternative à Ollama
 */
export class CloudflareAI {
  private accountId: string;
  
  constructor() {
    this.accountId = CLOUDFLARE_CONFIG.accountId;
  }
  
  /**
   * Vérifier si Workers AI est disponible
   */
  async isAvailable(): Promise<boolean> {
    return CLOUDFLARE_CONFIG.workersAI.enabled && await isCloudflareAvailable();
  }
  
  /**
   * Générer du texte avec Workers AI
   */
  async generate(
    prompt: string,
    options?: {
      systemPrompt?: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<string> {
    if (!await this.isAvailable()) {
      throw new Error('Cloudflare Workers AI not available');
    }
    
    const model = options?.model || CLOUDFLARE_CONFIG.workersAI.defaultModel;
    
    try {
      const response = await cloudflareClient.workers.ai.run(
        model,
        {
          account_id: this.accountId,
          messages: [
            ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
            { role: 'user', content: prompt },
          ],
          stream: false,
          temperature: options?.temperature,
          max_tokens: options?.maxTokens,
        }
      );
      
      return response.result?.response || '';
    } catch (error) {
      console.error('Cloudflare Workers AI error:', error);
      throw error;
    }
  }
  
  /**
   * Chat avec contexte
   */
  async chat(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>): Promise<string> {
    if (!await this.isAvailable()) {
      throw new Error('Cloudflare Workers AI not available');
    }
    
    try {
      const response = await cloudflareClient.workers.ai.run(
        CLOUDFLARE_CONFIG.workersAI.defaultModel,
        {
          account_id: this.accountId,
          messages,
          stream: false,
        }
      );
      
      return response.result?.response || '';
    } catch (error) {
      console.error('Cloudflare Workers AI chat error:', error);
      throw error;
    }
  }
  
  /**
   * Générer des embeddings (pour recherche sémantique)
   */
  async generateEmbeddings(text: string): Promise<number[]> {
    if (!await this.isAvailable()) {
      throw new Error('Cloudflare Workers AI not available');
    }
    
    try {
      const response = await cloudflareClient.workers.ai.run(
        '@cf/baai/bge-base-en-v1.5', // Modèle embeddings
        {
          account_id: this.accountId,
          text,
        }
      );
      
      return response.result?.data?.[0] || [];
    } catch (error) {
      console.error('Cloudflare Workers AI embeddings error:', error);
      throw error;
    }
  }
  
  /**
   * Traduire du texte
   */
  async translate(text: string, targetLanguage: string = 'fr'): Promise<string> {
    if (!await this.isAvailable()) {
      throw new Error('Cloudflare Workers AI not available');
    }
    
    try {
      const response = await cloudflareClient.workers.ai.run(
        '@cf/meta/m2m100-1.2b', // Modèle traduction
        {
          account_id: this.accountId,
          text,
          target_lang: targetLanguage,
        }
      );
      
      return response.result?.translated_text || text;
    } catch (error) {
      console.error('Cloudflare Workers AI translation error:', error);
      throw error;
    }
  }
  
  /**
   * Lister les modèles disponibles
   */
  async listModels(): Promise<string[]> {
    try {
      const models = await cloudflareClient.workers.ai.models.list({
        account_id: this.accountId,
      });
      
      return models.result?.map((m: any) => m.name) || [];
    } catch {
      return [];
    }
  }
}

/**
 * R2 Storage - Alternative à S3
 */
export class CloudflareR2 {
  private accountId: string;
  private bucketName: string;
  
  constructor() {
    this.accountId = CLOUDFLARE_CONFIG.accountId;
    this.bucketName = CLOUDFLARE_CONFIG.r2.bucketName;
  }
  
  /**
   * Uploader un fichier
   */
  async uploadFile(
    key: string,
    file: Buffer | Blob,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      await cloudflareClient.r2.buckets.objects.put(
        key,
        {
          account_id: this.accountId,
          bucket_name: this.bucketName,
          body: file,
          metadata,
        }
      );
      
      return `${CLOUDFLARE_CONFIG.r2.publicUrl}/${key}`;
    } catch (error) {
      console.error('R2 upload error:', error);
      throw error;
    }
  }
  
  /**
   * Télécharger un fichier
   */
  async downloadFile(key: string): Promise<Buffer> {
    try {
      const response = await cloudflareClient.r2.buckets.objects.get(
        key,
        {
          account_id: this.accountId,
          bucket_name: this.bucketName,
        }
      );
      
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      console.error('R2 download error:', error);
      throw error;
    }
  }
  
  /**
   * Supprimer un fichier
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await cloudflareClient.r2.buckets.objects.delete(
        key,
        {
          account_id: this.accountId,
          bucket_name: this.bucketName,
        }
      );
    } catch (error) {
      console.error('R2 delete error:', error);
      throw error;
    }
  }
  
  /**
   * Lister les fichiers
   */
  async listFiles(prefix?: string): Promise<string[]> {
    try {
      const response = await cloudflareClient.r2.buckets.objects.list({
        account_id: this.accountId,
        bucket_name: this.bucketName,
        prefix,
      });
      
      return response.result?.objects?.map((obj: any) => obj.key) || [];
    } catch (error) {
      console.error('R2 list error:', error);
      return [];
    }
  }
}

/**
 * KV Storage - Key-Value Store
 */
export class CloudflareKV {
  private accountId: string;
  private namespaceId: string;
  
  constructor(namespaceId: string) {
    this.accountId = CLOUDFLARE_CONFIG.accountId;
    this.namespaceId = namespaceId;
  }
  
  /**
   * Écrire une clé
   */
  async set(key: string, value: string, expirationTtl?: number): Promise<void> {
    try {
      await cloudflareClient.kv.namespaces.values.update(
        key,
        {
          account_id: this.accountId,
          namespace_id: this.namespaceId,
          value,
          expiration_ttl: expirationTtl,
        }
      );
    } catch (error) {
      console.error('KV set error:', error);
      throw error;
    }
  }
  
  /**
   * Lire une clé
   */
  async get(key: string): Promise<string | null> {
    try {
      const response = await cloudflareClient.kv.namespaces.values.get(
        key,
        {
          account_id: this.accountId,
          namespace_id: this.namespaceId,
        }
      );
      
      return response || null;
    } catch {
      return null;
    }
  }
  
  /**
   * Supprimer une clé
   */
  async delete(key: string): Promise<void> {
    try {
      await cloudflareClient.kv.namespaces.values.delete(
        key,
        {
          account_id: this.accountId,
          namespace_id: this.namespaceId,
        }
      );
    } catch (error) {
      console.error('KV delete error:', error);
      throw error;
    }
  }
  
  /**
   * Lister les clés
   */
  async listKeys(prefix?: string): Promise<string[]> {
    try {
      const response = await cloudflareClient.kv.namespaces.keys.list({
        account_id: this.accountId,
        namespace_id: this.namespaceId,
        prefix,
      });
      
      return response.result?.map((k: any) => k.name) || [];
    } catch {
      return [];
    }
  }
}

// Export instances singletons
export const cloudflareAI = new CloudflareAI();
export const cloudflareR2 = new CloudflareR2();

export default {
  client: cloudflareClient,
  ai: cloudflareAI,
  r2: cloudflareR2,
  KV: CloudflareKV,
  isAvailable: isCloudflareAvailable,
  config: CLOUDFLARE_CONFIG,
};
