/**
 * Cloudflare AI stub - Module removed during cleanup.
 * The hybrid-client falls back to Ollama which is the primary provider.
 * This stub ensures the import doesn't break while Cloudflare remains unused.
 */

export class CloudflareAI {
  async isAvailable(): Promise<boolean> {
    return false;
  }

  async generate(_prompt: string, _options?: { systemPrompt?: string }): Promise<string> {
    throw new Error('Cloudflare AI not configured');
  }

  async chat(_messages: Array<{ role: string; content: string }>, _options?: any): Promise<string> {
    throw new Error('Cloudflare AI not configured');
  }

  async generateEmbeddings(_text: string, _options?: any): Promise<number[]> {
    throw new Error('Cloudflare AI not configured');
  }

  async translate(_text: string, _targetLang: string): Promise<string> {
    throw new Error('Cloudflare AI not configured');
  }

  async listModels(): Promise<string[]> {
    return [];
  }
}

export const cloudflareAI = new CloudflareAI();

export function isCloudflareAvailable(): boolean {
  return false;
}
