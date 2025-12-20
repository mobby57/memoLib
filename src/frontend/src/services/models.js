/**
 * OpenAI Models API Service
 * Handles model listing, retrieval, and fine-tuned model management
 */

class ModelsService {
  constructor() {
    this.apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1/models';
  }

  /**
   * List all available models
   */
  async listModels() {
    try {
      const response = await fetch(this.baseURL, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`List models failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('List models error:', error);
      throw error;
    }
  }

  /**
   * Get specific model information
   */
  async getModel(modelId) {
    try {
      const response = await fetch(`${this.baseURL}/${modelId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Get model failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get model error:', error);
      throw error;
    }
  }

  /**
   * Delete fine-tuned model
   */
  async deleteModel(modelId) {
    try {
      const response = await fetch(`${this.baseURL}/${modelId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Delete model failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Delete model error:', error);
      throw error;
    }
  }

  // Helper methods for specific use cases

  /**
   * Get models by owner
   */
  async getModelsByOwner(owner = 'openai') {
    const models = await this.listModels();
    return models.data.filter(model => model.owned_by === owner);
  }

  /**
   * Get fine-tuned models
   */
  async getFineTunedModels() {
    const models = await this.listModels();
    return models.data.filter(model => model.id.startsWith('ft:'));
  }

  /**
   * Get chat models
   */
  async getChatModels() {
    const models = await this.listModels();
    return models.data.filter(model => 
      model.id.includes('gpt') || 
      model.id.includes('chat')
    );
  }

  /**
   * Get embedding models
   */
  async getEmbeddingModels() {
    const models = await this.listModels();
    return models.data.filter(model => 
      model.id.includes('embedding') || 
      model.id.includes('ada')
    );
  }

  /**
   * Get image models
   */
  async getImageModels() {
    const models = await this.listModels();
    return models.data.filter(model => 
      model.id.includes('dall-e') || 
      model.id.includes('image')
    );
  }

  /**
   * Get audio models
   */
  async getAudioModels() {
    const models = await this.listModels();
    return models.data.filter(model => 
      model.id.includes('whisper') || 
      model.id.includes('tts')
    );
  }

  /**
   * Check if model exists and is available
   */
  async isModelAvailable(modelId) {
    try {
      await this.getModel(modelId);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get recommended models for email generation
   */
  async getEmailModels() {
    const models = await this.getChatModels();
    return models.filter(model => 
      model.id.includes('gpt-4') || 
      model.id.includes('gpt-3.5-turbo')
    );
  }

  /**
   * Clean up old fine-tuned models
   */
  async cleanupOldModels(daysOld = 30) {
    try {
      const fineTunedModels = await this.getFineTunedModels();
      const cutoffTime = Date.now() / 1000 - (daysOld * 24 * 60 * 60);
      
      const oldModels = fineTunedModels.filter(model => 
        model.created < cutoffTime
      );

      const deletePromises = oldModels.map(model => this.deleteModel(model.id));
      await Promise.all(deletePromises);

      return { deleted: oldModels.length };
    } catch (error) {
      console.error('Cleanup error:', error);
      throw error;
    }
  }

  /**
   * Get model capabilities summary
   */
  getModelCapabilities(modelId) {
    const capabilities = {
      'gpt-4': { chat: true, functions: true, vision: false, maxTokens: 8192 },
      'gpt-4-turbo': { chat: true, functions: true, vision: true, maxTokens: 128000 },
      'gpt-4o': { chat: true, functions: true, vision: true, maxTokens: 128000 },
      'gpt-3.5-turbo': { chat: true, functions: true, vision: false, maxTokens: 4096 },
      'dall-e-3': { image: true, maxSize: '1024x1024' },
      'dall-e-2': { image: true, maxSize: '1024x1024' },
      'whisper-1': { audio: true, transcription: true },
      'tts-1': { audio: true, synthesis: true },
      'text-embedding-3-large': { embedding: true, dimensions: 3072 },
      'text-embedding-3-small': { embedding: true, dimensions: 1536 }
    };

    return capabilities[modelId] || { unknown: true };
  }
}

export default new ModelsService();