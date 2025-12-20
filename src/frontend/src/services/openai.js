// Service OpenAI dédié avec gestion avancée
// Suit les meilleures pratiques de l'API OpenAI

const OPENAI_API_BASE = 'https://api.openai.com/v1';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const ORGANIZATION_ID = import.meta.env.VITE_OPENAI_ORG_ID;
const PROJECT_ID = import.meta.env.VITE_OPENAI_PROJECT_ID;

// Rate limiting local pour éviter les erreurs 429
const rateLimiter = {
  requests: { count: 0, resetTime: Date.now() + 60000 },
  tokens: { count: 0, resetTime: Date.now() + 60000 },
  
  canMakeRequest: (estimatedTokens = 1000) => {
    const now = Date.now();
    
    // Reset counters si nécessaire
    if (now > rateLimiter.requests.resetTime) {
      rateLimiter.requests = { count: 0, resetTime: now + 60000 };
    }
    if (now > rateLimiter.tokens.resetTime) {
      rateLimiter.tokens = { count: 0, resetTime: now + 60000 };
    }
    
    // Vérifier les limites (valeurs conservatrices)
    return rateLimiter.requests.count < 50 && 
           rateLimiter.tokens.count + estimatedTokens < 40000;
  },
  
  updateLimits: (headers) => {
    const remaining = {
      requests: parseInt(headers.get('x-ratelimit-remaining-requests') || '0'),
      tokens: parseInt(headers.get('x-ratelimit-remaining-tokens') || '0')
    };
    
    rateLimiter.requests.count = Math.max(0, 60 - remaining.requests);
    rateLimiter.tokens.count = Math.max(0, 90000 - remaining.tokens);
  }
};

// Générateur d'ID unique pour traçabilité
const generateRequestId = () => {
  return `iaposte_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Requête OpenAI avec toutes les bonnes pratiques
const openaiRequest = async (endpoint, options = {}) => {
  if (!OPENAI_API_KEY) {
    throw new Error('Clé API OpenAI manquante - Configurez VITE_OPENAI_API_KEY');
  }
  
  const estimatedTokens = options.estimatedTokens || 1000;
  
  if (!rateLimiter.canMakeRequest(estimatedTokens)) {
    throw new Error('Rate limit atteint - Veuillez patienter');
  }
  
  const requestId = generateRequestId();
  const url = `${OPENAI_API_BASE}${endpoint}`;
  
  const headers = {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
    'X-Client-Request-Id': requestId,
    'User-Agent': 'IAPosteManager/2.2'
  };
  
  // Ajouter headers d'organisation si configurés
  if (ORGANIZATION_ID) {
    headers['OpenAI-Organization'] = ORGANIZATION_ID;
  }
  if (PROJECT_ID) {
    headers['OpenAI-Project'] = PROJECT_ID;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
    
    const response = await fetch(url, {
      method: options.method || 'POST',
      headers: { ...headers, ...options.headers },
      body: options.body,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Mettre à jour les limites de rate limiting
    rateLimiter.updateLimits(response.headers);
    
    // Logger les informations de debug
    const debugInfo = {
      requestId,
      'x-request-id': response.headers.get('x-request-id'),
      'openai-processing-ms': response.headers.get('openai-processing-ms'),
      'openai-version': response.headers.get('openai-version'),
      'x-ratelimit-remaining-requests': response.headers.get('x-ratelimit-remaining-requests'),
      'x-ratelimit-remaining-tokens': response.headers.get('x-ratelimit-remaining-tokens')
    };
    
    console.debug('OpenAI API Request:', debugInfo);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error?.message || `HTTP ${response.status}`);
      error.status = response.status;
      error.code = errorData.error?.code;
      error.requestId = requestId;
      throw error;
    }
    
    return await response.json();
    
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Requête OpenAI expirée - Veuillez réessayer');
    }
    
    console.error('OpenAI API Error:', {
      requestId,
      error: error.message,
      status: error.status,
      code: error.code
    });
    
    throw error;
  }
};

// Service OpenAI complet
export const openaiService = {
  // Chat Completions - Génération de texte
  chat: {
    create: async (messages, options = {}) => {
      const {
        model = 'gpt-4o',
        temperature = 0.7,
        max_tokens = 1000,
        stream = false,
        presence_penalty = 0,
        frequency_penalty = 0
      } = options;
      
      return openaiRequest('/chat/completions', {
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens,
          stream,
          presence_penalty,
          frequency_penalty
        }),
        estimatedTokens: max_tokens
      });
    },
    
    // Génération streaming
    createStream: async (messages, options = {}) => {
      const {
        model = 'gpt-4o',
        temperature = 0.7,
        max_tokens = 1000
      } = options;
      
      return openaiRequest('/chat/completions', {
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens,
          stream: true
        }),
        estimatedTokens: max_tokens
      });
    }
  },
  
  // Embeddings - Recherche sémantique
  embeddings: {
    create: async (input, model = 'text-embedding-3-small') => {
      return openaiRequest('/embeddings', {
        body: JSON.stringify({
          model,
          input,
          encoding_format: 'float'
        }),
        estimatedTokens: Array.isArray(input) ? input.length * 100 : 100
      });
    }
  },
  
  // Moderation - Filtrage de contenu
  moderations: {
    create: async (input) => {
      return openaiRequest('/moderations', {
        body: JSON.stringify({
          input,
          model: 'text-moderation-latest'
        }),
        estimatedTokens: 10
      });
    }
  },
  
  // Audio - Transcription et TTS
  audio: {
    transcribe: async (audioFile, options = {}) => {
      const {
        model = 'whisper-1',
        language = 'fr',
        response_format = 'json'
      } = options;
      
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', model);
      formData.append('language', language);
      formData.append('response_format', response_format);
      
      return openaiRequest('/audio/transcriptions', {
        body: formData,
        headers: {}, // Laisser le navigateur définir Content-Type pour FormData
        estimatedTokens: 100
      });
    },
    
    speech: async (text, options = {}) => {
      const {
        model = 'tts-1',
        voice = 'alloy',
        response_format = 'mp3',
        speed = 1.0
      } = options;
      
      return openaiRequest('/audio/speech', {
        body: JSON.stringify({
          model,
          input: text,
          voice,
          response_format,
          speed
        }),
        estimatedTokens: Math.ceil(text.length / 4)
      });
    }
  },
  
  // Conversations - Gestion d'état persistant
  conversations: {
    create: async (items = [], metadata = {}) => {
      return openaiRequest('/conversations', {
        body: JSON.stringify({ items, metadata })
      });
    },
    
    get: async (conversationId) => {
      return openaiRequest(`/conversations/${conversationId}`, {
        method: 'GET'
      });
    },
    
    update: async (conversationId, metadata) => {
      return openaiRequest(`/conversations/${conversationId}`, {
        body: JSON.stringify({ metadata })
      });
    },
    
    delete: async (conversationId) => {
      return openaiRequest(`/conversations/${conversationId}`, {
        method: 'DELETE'
      });
    },
    
    // Items management
    listItems: async (conversationId, options = {}) => {
      const { after, limit = 20, order = 'desc', include = [] } = options;
      const params = new URLSearchParams();
      if (after) params.append('after', after);
      params.append('limit', limit.toString());
      params.append('order', order);
      include.forEach(inc => params.append('include', inc));
      
      return openaiRequest(`/conversations/${conversationId}/items?${params}`, {
        method: 'GET'
      });
    },
    
    addItems: async (conversationId, items, include = []) => {
      const params = include.length > 0 ? `?${include.map(inc => `include=${inc}`).join('&')}` : '';
      return openaiRequest(`/conversations/${conversationId}/items${params}`, {
        body: JSON.stringify({ items })
      });
    },
    
    getItem: async (conversationId, itemId, include = []) => {
      const params = include.length > 0 ? `?${include.map(inc => `include=${inc}`).join('&')}` : '';
      return openaiRequest(`/conversations/${conversationId}/items/${itemId}${params}`, {
        method: 'GET'
      });
    },
    
    deleteItem: async (conversationId, itemId) => {
      return openaiRequest(`/conversations/${conversationId}/items/${itemId}`, {
        method: 'DELETE'
      });
    }
  },
  
  // Images - Génération d'images avancée
  images: {
    // Génération d'images avec nouveaux modèles
    generate: async (prompt, options = {}) => {
      const {
        model = 'gpt-image-1.5',
        n = 1,
        size = 'auto',
        quality = 'auto',
        style = 'vivid',
        background = 'auto',
        output_format = 'png',
        output_compression = 100,
        moderation = 'auto',
        stream = false,
        partial_images = 0
      } = options;
      
      return openaiRequest('/images/generations', {
        body: JSON.stringify({
          model,
          prompt,
          n,
          size,
          quality,
          style,
          background,
          output_format,
          output_compression,
          moderation,
          stream,
          partial_images
        }),
        estimatedTokens: Math.ceil(prompt.length / 4)
      });
    },
    
    // Édition d'images
    edit: async (images, prompt, options = {}) => {
      const {
        model = 'gpt-image-1',
        mask = null,
        background = 'auto',
        input_fidelity = 'low',
        n = 1,
        size = 'auto',
        quality = 'auto',
        output_format = 'png',
        stream = false
      } = options;
      
      const formData = new FormData();
      formData.append('model', model);
      formData.append('prompt', prompt);
      
      // Support multiple images for GPT models
      if (Array.isArray(images)) {
        images.forEach(image => formData.append('image[]', image));
      } else {
        formData.append('image', images);
      }
      
      if (mask) formData.append('mask', mask);
      formData.append('background', background);
      formData.append('input_fidelity', input_fidelity);
      formData.append('n', n.toString());
      formData.append('size', size);
      formData.append('quality', quality);
      formData.append('output_format', output_format);
      formData.append('stream', stream.toString());
      
      return openaiRequest('/images/edits', {
        body: formData,
        headers: {},
        estimatedTokens: Math.ceil(prompt.length / 4)
      });
    },
    
    // Variations d'images (DALL-E 2 uniquement)
    createVariation: async (image, options = {}) => {
      const {
        model = 'dall-e-2',
        n = 1,
        size = '1024x1024',
        response_format = 'url'
      } = options;
      
      const formData = new FormData();
      formData.append('image', image);
      formData.append('model', model);
      formData.append('n', n.toString());
      formData.append('size', size);
      formData.append('response_format', response_format);
      
      return openaiRequest('/images/variations', {
        body: formData,
        headers: {},
        estimatedTokens: 50
      });
    },
    
    // Streaming image generation
    generateStream: async (prompt, options = {}, callbacks = {}) => {
      const {
        onStart = () => {},
        onPartialImage = () => {},
        onComplete = () => {},
        onError = () => {}
      } = callbacks;
      
      try {
        const response = await openaiService.images.generate(prompt, {
          ...options,
          stream: true,
          partial_images: options.partial_images || 2
        });
        
        if (!response.body) {
          throw new Error('Streaming not supported');
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        onStart();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (!line.trim() || !line.startsWith('data: ')) continue;
            
            const data = line.slice(6);
            if (data === '[DONE]') {
              onComplete();
              return;
            }
            
            try {
              const event = JSON.parse(data);
              
              if (event.type === 'image.partial') {
                onPartialImage(event.data);
              } else if (event.type === 'image.complete') {
                onComplete(event.data);
              }
            } catch (parseError) {
              console.warn('Failed to parse image SSE event:', data);
            }
          }
        }
      } catch (error) {
        onError(error);
        throw error;
      }
    }
  },
};

// Helpers avancés pour l'intégration avec l'app
export const openaiHelpers = {
  // Générer un email avec conversation persistante
  generateEmailWithContext: async (context, tone = 'professional', conversationId = null) => {
    try {
      if (conversationId) {
        // Utiliser conversation existante
        const response = await openaiService.conversations.addItems(conversationId, [{
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text: `Génère un email ${tone}: ${context}` }]
        }]);
        
        // Générer la réponse avec le contexte de la conversation
        const items = await openaiService.conversations.listItems(conversationId, { limit: 5 });
        const messages = items.data
          .filter(item => item.type === 'message')
          .map(item => ({
            role: item.role,
            content: item.content?.[0]?.text || ''
          }));
        
        const chatResponse = await openaiService.chat.create(messages, {
          max_tokens: 500,
          temperature: 0.7
        });
        
        const emailContent = chatResponse.choices[0].message.content;
        
        // Ajouter la réponse à la conversation
        await openaiService.conversations.addItems(conversationId, [{
          type: 'message',
          role: 'assistant',
          content: [{ type: 'output_text', text: emailContent }]
        }]);
        
        return emailContent;
      } else {
        // Génération simple sans conversation
        return openaiHelpers.generateEmail(context, tone);
      }
    } catch (error) {
      console.error('Email generation with context failed:', error);
      return openaiHelpers.generateEmail(context, tone);
    }
  },
  
  // Créer une nouvelle conversation pour un projet d'email
  createEmailProject: async (projectName, description = '') => {
    const metadata = {
      project_name: projectName,
      description,
      purpose: 'email_generation',
      created_by: 'iapostemanager',
      created_at: new Date().toISOString()
    };
    
    const initialItems = [{
      type: 'message',
      role: 'system',
      content: [{ 
        type: 'input_text', 
        text: `Projet email: ${projectName}. ${description}` 
      }]
    }];
    
    return openaiService.conversations.create(initialItems, metadata);
  },
  
  // Générer un email avec amélioration itérative
  generateEmailIterative: async (context, conversationId, iterations = 1) => {
    let currentEmail = await openaiHelpers.generateEmailWithContext(context, 'professional', conversationId);
    
    for (let i = 0; i < iterations; i++) {
      const improvementPrompt = `Améliore cet email en le rendant plus professionnel et engageant: ${currentEmail}`;
      currentEmail = await openaiHelpers.generateEmailWithContext(improvementPrompt, 'professional', conversationId);
    }
    
    return currentEmail;
  },
  // Générer un email avec OpenAI
  generateEmail: async (context, tone = 'professional') => {
    const messages = [
      {
        role: 'system',
        content: `Tu es un assistant qui génère des emails professionnels en français. 
                 Ton: ${tone}. Sois concis et pertinent.`
      },
      {
        role: 'user',
        content: `Génère un email basé sur ce contexte: ${context}`
      }
    ];
    
    const response = await openaiService.chat.create(messages, {
      max_tokens: 500,
      temperature: 0.7
    });
    
    return response.choices[0].message.content;
  },
  
  // Améliorer un texte dicté
  improveText: async (text, context = 'email') => {
    const messages = [
      {
        role: 'system',
        content: `Améliore ce texte pour un ${context}. Corrige la grammaire, 
                 améliore la clarté et maintiens le sens original.`
      },
      {
        role: 'user',
        content: text
      }
    ];
    
    const response = await openaiService.chat.create(messages, {
      max_tokens: Math.min(1000, text.length * 2),
      temperature: 0.3
    });
    
    return response.choices[0].message.content;
  },
  
  // Analyser l'historique d'une conversation
  analyzeConversationHistory: async (conversationId) => {
    try {
      const items = await openaiService.conversations.listItems(conversationId, { 
        limit: 50,
        include: ['message.output_text.logprobs']
      });
      
      const messages = items.data.filter(item => item.type === 'message');
      const userMessages = messages.filter(msg => msg.role === 'user').length;
      const assistantMessages = messages.filter(msg => msg.role === 'assistant').length;
      
      // Analyser les thèmes principaux
      const allText = messages.map(msg => msg.content?.[0]?.text || '').join(' ');
      const wordCount = allText.split(' ').length;
      
      return {
        total_messages: messages.length,
        user_messages: userMessages,
        assistant_messages: assistantMessages,
        word_count: wordCount,
        conversation_length: items.data.length,
        has_more: items.has_more,
        themes: await openaiHelpers.extractThemes(allText)
      };
    } catch (error) {
      console.error('Conversation analysis failed:', error);
      return null;
    }
  },
  
  // Extraire les thèmes principaux d'un texte
  extractThemes: async (text) => {
    if (text.length < 100) return [];
    
    try {
      const response = await openaiService.chat.create([
        {
          role: 'system',
          content: 'Extrais 3-5 thèmes principaux de ce texte. Réponds avec une liste de mots-clés séparés par des virgules.'
        },
        {
          role: 'user',
          content: text.substring(0, 2000) // Limiter la taille
        }
      ], {
        max_tokens: 100,
        temperature: 0.3
      });
      
      const themes = response.choices[0].message.content
        .split(',')
        .map(theme => theme.trim())
        .filter(theme => theme.length > 0);
      
      return themes;
    } catch (error) {
      console.error('Theme extraction failed:', error);
      return [];
    }
  }

export default openaiService;