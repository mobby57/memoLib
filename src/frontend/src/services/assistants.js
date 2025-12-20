/**
 * OpenAI Assistants API Service
 * Creates and manages AI assistants for email tasks
 */

class AssistantsService {
  constructor() {
    this.apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1/assistants';
    this.betaHeader = 'assistants=v2';
  }

  /**
   * Create assistant
   */
  async create(config) {
    try {
      const {
        model = 'gpt-4o',
        name,
        description,
        instructions,
        tools = [],
        tool_resources = {},
        metadata = {},
        temperature = 0.7,
        top_p = 1,
        response_format = 'auto',
        reasoning_effort = 'medium'
      } = config;

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'OpenAI-Beta': this.betaHeader
        },
        body: JSON.stringify({
          model,
          name,
          description,
          instructions,
          tools,
          tool_resources,
          metadata,
          temperature,
          top_p,
          response_format,
          reasoning_effort
        })
      });

      if (!response.ok) {
        throw new Error(`Create assistant failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Create assistant error:', error);
      throw error;
    }
  }

  /**
   * List assistants
   */
  async list(options = {}) {
    try {
      const {
        after = null,
        before = null,
        limit = 20,
        order = 'desc'
      } = options;

      const params = new URLSearchParams();
      if (after) params.append('after', after);
      if (before) params.append('before', before);
      params.append('limit', limit.toString());
      params.append('order', order);

      const response = await fetch(`${this.baseURL}?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'OpenAI-Beta': this.betaHeader
        }
      });

      if (!response.ok) {
        throw new Error(`List assistants failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('List assistants error:', error);
      throw error;
    }
  }

  /**
   * Get assistant
   */
  async get(assistantId) {
    try {
      const response = await fetch(`${this.baseURL}/${assistantId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'OpenAI-Beta': this.betaHeader
        }
      });

      if (!response.ok) {
        throw new Error(`Get assistant failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get assistant error:', error);
      throw error;
    }
  }

  /**
   * Update assistant
   */
  async update(assistantId, updates) {
    try {
      const response = await fetch(`${this.baseURL}/${assistantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'OpenAI-Beta': this.betaHeader
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Update assistant failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Update assistant error:', error);
      throw error;
    }
  }

  /**
   * Delete assistant
   */
  async delete(assistantId) {
    try {
      const response = await fetch(`${this.baseURL}/${assistantId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'OpenAI-Beta': this.betaHeader
        }
      });

      if (!response.ok) {
        throw new Error(`Delete assistant failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Delete assistant error:', error);
      throw error;
    }
  }

  // Email-specific assistant helpers

  /**
   * Create email assistant
   */
  async createEmailAssistant(name = 'Email Assistant', options = {}) {
    const {
      language = 'fr',
      tone = 'professional',
      vectorStoreIds = [],
      fileIds = []
    } = options;

    const instructions = {
      fr: `Vous êtes un assistant email professionnel spécialisé dans la rédaction d'emails ${tone} en français. 
           Aidez les utilisateurs à créer des emails efficaces, bien structurés et adaptés au contexte.`,
      en: `You are a professional email assistant specialized in writing ${tone} emails in English. 
           Help users create effective, well-structured emails adapted to the context.`
    };

    const tools = [
      { type: 'code_interpreter' },
      { type: 'file_search' }
    ];

    const tool_resources = {
      code_interpreter: { file_ids: fileIds },
      file_search: { vector_store_ids: vectorStoreIds }
    };

    return this.create({
      name,
      description: `Assistant spécialisé dans la génération d'emails ${tone}`,
      instructions: instructions[language] || instructions.fr,
      tools,
      tool_resources,
      metadata: {
        purpose: 'email_generation',
        language,
        tone,
        created_by: 'iapostemanager'
      }
    });
  }

  /**
   * Create marketing assistant
   */
  async createMarketingAssistant(vectorStoreIds = []) {
    return this.create({
      name: 'Marketing Email Assistant',
      description: 'Assistant spécialisé dans les emails marketing et promotionnels',
      instructions: 'Vous êtes un expert en marketing par email. Créez des emails engageants qui convertissent.',
      tools: [
        { type: 'file_search' },
        { type: 'code_interpreter' }
      ],
      tool_resources: {
        file_search: { vector_store_ids: vectorStoreIds }
      },
      metadata: {
        purpose: 'marketing_emails',
        created_by: 'iapostemanager'
      }
    });
  }

  /**
   * Create customer support assistant
   */
  async createSupportAssistant(vectorStoreIds = []) {
    return this.create({
      name: 'Support Email Assistant',
      description: 'Assistant pour les emails de support client',
      instructions: 'Vous aidez à rédiger des réponses de support client empathiques et utiles.',
      tools: [
        { type: 'file_search' }
      ],
      tool_resources: {
        file_search: { vector_store_ids: vectorStoreIds }
      },
      metadata: {
        purpose: 'customer_support',
        created_by: 'iapostemanager'
      }
    });
  }

  /**
   * Get assistants by purpose
   */
  async getByPurpose(purpose) {
    const assistants = await this.list({ limit: 100 });
    return assistants.data.filter(assistant => 
      assistant.metadata?.purpose === purpose
    );
  }

  /**
   * Update assistant tools
   */
  async updateTools(assistantId, tools, toolResources = {}) {
    return this.update(assistantId, {
      tools,
      tool_resources: toolResources
    });
  }

  /**
   * Clone assistant
   */
  async clone(assistantId, newName) {
    const original = await this.get(assistantId);
    
    return this.create({
      name: newName,
      description: original.description,
      instructions: original.instructions,
      model: original.model,
      tools: original.tools,
      tool_resources: original.tool_resources,
      temperature: original.temperature,
      top_p: original.top_p,
      metadata: {
        ...original.metadata,
        cloned_from: assistantId,
        created_at: new Date().toISOString()
      }
    });
  }
}

export default new AssistantsService();