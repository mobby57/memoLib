// 🦙 SERVICE OLLAMA - IAPosteManager v3.0
import { Ollama } from 'ollama';

class OllamaService {
  constructor() {
    this.ollama = new Ollama({ host: 'http://127.0.0.1:11434' });
    this.model = process.env.OLLAMA_MODEL || 'llama3.2:3b';
  }

  async generateText(prompt, options = {}) {
    try {
      const response = await this.ollama.generate({
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          top_p: options.top_p || 0.9,
          num_predict: options.max_tokens || 200,  // Ultra-rapide: emails courts
          num_ctx: 1024,  // Contexte minimal
          num_thread: 8,  // 8 threads CPU
          repeat_penalty: 1.1  // Évite répétitions
        }
      });
      
      return {
        success: true,
        content: response.response,
        source: 'ollama-llama3.1'
      };
    } catch (error) {
      console.error('Erreur Ollama:', error);
      return {
        success: false,
        error: error.message,
        source: 'ollama'
      };
    }
  }

  async improveText(text, tone = 'professional') {
    const prompt = `Améliore ce texte en français avec un ton ${tone}:\n\n"${text}"\n\nTexte amélioré:`;
    return await this.generateText(prompt);
  }

  async generateEmail(context, tone = 'professionnel') {
    const prompt = `Email ${tone}: ${context}
Sujet:
Corps:`;
    
    const result = await this.generateText(prompt, { max_tokens: 150 });
    
    if (result.success) {
      const lines = result.content.split('\n');
      const subject = lines[0].replace(/^(Sujet:|Subject:)/i, '').trim();
      const body = lines.slice(1).join('\n').trim();
      
      return {
        success: true,
        subject,
        body,
        source: 'ollama-llama3.1'
      };
    }
    
    return result;
  }

  async analyzeDocument(documentText, audioText = '', userText = '') {
    const prompt = `Analyse ces informations et génère 3 versions de réponse:

Document: ${documentText}
Audio: ${audioText}
Contexte: ${userText}

Génère:
1. COURTE: Une réponse brève
2. STANDARD: Une réponse complète
3. DÉTAILLÉE: Une réponse très détaillée

Réponses:`;

    const result = await this.generateText(prompt, { max_tokens: 1500 });
    
    if (result.success) {
      return {
        success: true,
        responses: {
          short: "Réponse courte générée par Llama 3.1",
          standard: "Réponse standard générée par Llama 3.1", 
          detailed: result.content
        },
        source: 'ollama-llama3.1'
      };
    }
    
    return result;
  }

  async checkHealth() {
    try {
      const response = await this.ollama.list();
      const hasModel = response.models.some(m => m.name.includes('llama3.1'));
      
      return {
        status: 'OK',
        model: this.model,
        available: hasModel,
        models: response.models.map(m => m.name)
      };
    } catch (error) {
      return {
        status: 'ERROR',
        error: error.message
      };
    }
  }
}

export default new OllamaService();