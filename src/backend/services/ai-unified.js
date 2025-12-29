
import OpenAI from 'openai';
import { Ollama } from 'ollama';

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.ollama = new Ollama({
      host: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434'
    });
  }
  
  async generateEmail(context, tone = 'professional') {
    try {
      return await this.openaiGenerate(context, tone);
    } catch (error) {
      console.warn('OpenAI failed, using Ollama fallback');
      return await this.ollamaGenerate(context, tone);
    }
  }
  
  async openaiGenerate(context, tone) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Generate a ${tone} email in French based on the context.`
        },
        {
          role: 'user', 
          content: context
        }
      ],
      max_tokens: 500
    });
    
    const content = response.choices[0].message.content;
    const [subject, ...bodyParts] = content.split('\n');
    
    return {
      subject: subject.replace('Sujet:', '').trim(),
      body: bodyParts.join('\n').trim(),
      source: 'openai'
    };
  }
  
  async ollamaGenerate(context, tone) {
    const response = await this.ollama.chat({
      model: 'llama3.1:8b',
      messages: [
        {
          role: 'system',
          content: `Generate a ${tone} email in French based on the context.`
        },
        {
          role: 'user',
          content: context
        }
      ]
    });
    
    const content = response.message.content;
    const [subject, ...bodyParts] = content.split('\n');
    
    return {
      subject: subject.replace('Sujet:', '').trim(),
      body: bodyParts.join('\n').trim(),
      source: 'ollama'
    };
  }
}

export default new AIService();
