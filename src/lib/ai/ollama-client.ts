// @ts-nocheck
import { sanitizePromptForAI } from './prompt-sanitizer';

interface OllamaResponse {
  response: string;
  done: boolean;
}

interface EmailAnalysis {
  typeDossier: string;
  urgency: 'low' | 'medium' | 'high';
  clientName?: string;
  summary: string;
  entities: {
    dates?: string[];
    documents?: string[];
    references?: string[];
  };
}

export class OllamaClient {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl = 'http://localhost:11434', model = 'llama3.2:latest') {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async analyzeEmail(subject: string, body: string): Promise<EmailAnalysis> {
    const prompt = `Analyse cet email juridique et retourne UNIQUEMENT un JSON valide :

Objet: ${subject}
Corps: ${body}

Format attendu:
{
  "typeDossier": "TITRE_SEJOUR|NATURALISATION|REGROUPEMENT_FAMILIAL|CONTENTIEUX_OQTF|GENERAL",
  "urgency": "low|medium|high",
  "clientName": "nom du client si mentionné",
  "summary": "résumé en 1 phrase",
  "entities": {
    "dates": ["dates trouvées"],
    "documents": ["documents mentionnés"],
    "references": ["numéros de dossier"]
  }
}`;

    try {
      return await this.generateJSON<EmailAnalysis>(prompt);
    } catch (error) {
      console.error('Ollama request failed');
      return {
        typeDossier: 'GENERAL',
        urgency: 'medium',
        summary: 'Classification automatique échouée',
        entities: {},
      };
    }
  }

  async generate(prompt: string, systemPrompt?: string): Promise<string> {
    const safePrompt = sanitizePromptForAI(prompt).sanitizedText;
    const safeSystemPrompt = systemPrompt
      ? sanitizePromptForAI(systemPrompt).sanitizedText
      : undefined;
    const fullPrompt = safeSystemPrompt ? `${safeSystemPrompt}\n\n${safePrompt}` : safePrompt;
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt: fullPrompt,
        stream: false,
        options: { temperature: 0.1 },
      }),
    });

    if (!response.ok) {
      throw new Error('Ollama unavailable');
    }

    const data: OllamaResponse = await response.json();
    return data.response;
  }

  async generateJSON<T = any>(prompt: string): Promise<T> {
    const text = await this.generate(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response');
    }
    return JSON.parse(jsonMatch[0]) as T;
  }

  async chat(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  ): Promise<string> {
    const safeMessages = messages.map(message => ({
      ...message,
      content: sanitizePromptForAI(message.content).sanitizedText,
    }));
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: safeMessages,
        stream: false,
        options: { temperature: 0.1 },
      }),
    });

    if (!response.ok) {
      throw new Error('Ollama unavailable');
    }

    const data = (await response.json()) as { message?: { content?: string } };
    return data.message?.content || '';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const ollama = new OllamaClient();


