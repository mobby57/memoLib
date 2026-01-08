/**
 * Ollama Client - IA Locale
 * Client pour interagir avec Ollama (LLM local)
 */

interface OllamaResponse {
  response: string;
  done: boolean;
}

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class OllamaClient {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl = 'http://localhost:11434', model = 'llama3.2:3b') {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  /**
   * Vérifier si Ollama est disponible
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Générer une réponse avec Ollama
   */
  async generate(prompt: string, system?: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          system,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.statusText}`);
      }

      const data: OllamaResponse = await response.json();
      return data.response;
    } catch (error) {
      console.error('Erreur Ollama:', error);
      throw error;
    }
  }

  /**
   * Chat avec contexte (plusieurs messages)
   */
  async chat(messages: OllamaMessage[]): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.message.content;
    } catch (error) {
      console.error('Erreur Ollama:', error);
      throw error;
    }
  }

  /**
   * Extraire du JSON structuré depuis une réponse
   */
  async generateJSON<T>(prompt: string, system?: string): Promise<T> {
    const response = await this.generate(prompt, system);
    
    // Extraire le JSON de la réponse (supporte plusieurs formats)
    let jsonStr = response.trim();
    
    // Format 1: ```json ... ```
    const jsonMatch1 = jsonStr.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch1) {
      jsonStr = jsonMatch1[1].trim();
    } else {
      // Format 2: ``` ... ```
      const jsonMatch2 = jsonStr.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch2) {
        jsonStr = jsonMatch2[1].trim();
      }
    }
    
    try {
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Erreur parsing JSON:', error);
      console.error('Réponse brute:', response);
      console.error('JSON extrait:', jsonStr);
      throw new Error('Impossible de parser la réponse JSON');
    }
  }

  /**
   * Lister les modèles disponibles
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      const data = await response.json();
      return data.models.map((m: any) => m.name);
    } catch {
      return [];
    }
  }
}

// Instance singleton
export const ollama = new OllamaClient(
  process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  process.env.OLLAMA_MODEL || 'llama3.2:3b'
);
