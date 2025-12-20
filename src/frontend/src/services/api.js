// Services API pour communiquer avec le backend unifié

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const OPENAI_API_BASE = 'https://api.openai.com/v1';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Validation de la clé API
if (!OPENAI_API_KEY && typeof window !== 'undefined') {
  console.warn('VITE_OPENAI_API_KEY manquante - certaines fonctionnalités seront limitées');
}

// Cache sécurisé avec TTL
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;

// Rate limiting
const rateLimiter = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100;

// Générateur d'ID unique pour les requêtes
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Utilitaire pour les requêtes avec gestion d'erreurs et optimisations
const apiRequest = async (url, options = {}) => {
  // Rate limiting check
  const now = Date.now();
  const requestCount = rateLimiter.get(url) || { count: 0, timestamp: now };
  
  if (now - requestCount.timestamp < RATE_LIMIT_WINDOW) {
    if (requestCount.count >= MAX_REQUESTS_PER_WINDOW) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    requestCount.count++;
  } else {
    requestCount.count = 1;
    requestCount.timestamp = now;
  }
  rateLimiter.set(url, requestCount);
  
  // Cache management
  const cacheKey = `${url}_${JSON.stringify(options)}`;
  const cached = cache.get(cacheKey);
  
  // Vérifier le cache pour les requêtes GET
  if (!options.method || options.method === 'GET') {
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }
  
  // Limit cache size
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  
  // Polyfill pour AbortController si non disponible
  let controller = null;
  let timeoutId = null;
  
  if (typeof window !== 'undefined' && typeof AbortController !== 'undefined') {
    controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout pour IA
  }
  
  try {
    const requestId = generateRequestId();
    const fetchOptions = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Request-Id': requestId,
        ...options.headers
      }
    };
    
    // Ajouter signal seulement si AbortController est disponible
    if (controller) {
      fetchOptions.signal = controller.signal;
    }
    
    const response = await fetch(url, fetchOptions);
    
    // Log des headers de debug OpenAI
    if (url.includes('openai') || url.includes('/ai/')) {
      const debugHeaders = {
        'x-request-id': response.headers.get('x-request-id'),
        'openai-processing-ms': response.headers.get('openai-processing-ms'),
        'x-ratelimit-remaining-requests': response.headers.get('x-ratelimit-remaining-requests'),
        'x-ratelimit-remaining-tokens': response.headers.get('x-ratelimit-remaining-tokens')
      };
      console.debug('OpenAI API Debug:', { requestId, debugHeaders });
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || response.statusText;
      throw new Error(`HTTP ${response.status}: ${errorMessage}`);
    }
    
    const data = await response.json();
    
    // Mettre en cache les requêtes GET réussies
    if (!options.method || options.method === 'GET') {
      cache.set(cacheKey, { data, timestamp: Date.now() });
    }
    
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Requête expirée - Vérifiez votre connexion');
    }
    console.error('API Request failed:', { url, error: error.message });
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

// Requête OpenAI directe avec authentification sécurisée
const openaiRequest = async (endpoint, options = {}) => {
  if (!OPENAI_API_KEY) {
    throw new Error('Clé API OpenAI manquante - Configurez VITE_OPENAI_API_KEY');
  }
  
  // Validation de l'endpoint
  if (!endpoint || typeof endpoint !== 'string') {
    throw new Error('Endpoint invalide');
  }
  
  const url = `${OPENAI_API_BASE}${endpoint}`;
  const requestId = generateRequestId();
  
  const fetchOptions = {
    ...options,
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Client-Request-Id': requestId,
      ...options.headers
    }
  };
  
  return apiRequest(url, fetchOptions);
};

// Service Email avec optimisations
export const emailAPI = {
  send: async (emailData) => {
    return apiRequest(`${API_BASE}/send-email`, {
      method: 'POST',
      body: JSON.stringify(emailData)
    });
  },
  
  getHistory: async (limit = 50) => {
    return apiRequest(`${API_BASE}/email-history?limit=${limit}`);
  },
  
  // Envoi en lot pour de meilleures performances
  sendBatch: async (emails) => {
    return apiRequest(`${API_BASE}/email/send-batch`, {
      method: 'POST',
      body: JSON.stringify({ emails })
    });
  },
  
  // Alias pour generateContent (utilise aiAPI en interne)
  generateContent: async (prompt, options = {}) => {
    return aiAPI.generateContent(prompt, options);
  }
};

// Service IA avec cache intelligent et nouvelle API Responses OpenAI
export const aiAPI = {
  // Génération via backend (recommandé pour la sécurité)
  generate: async (prompt, tone = 'professional') => {
    return apiRequest(`${API_BASE}/ai/generate`, {
      method: 'POST',
      body: JSON.stringify({ prompt, tone })
    });
  },
  
  // Nouvelle API Responses OpenAI (recommandée)
  createResponse: async (input, options = {}) => {
    const {
      model = 'gpt-4o',
      temperature = 0.7,
      max_output_tokens = 1000,
      stream = false,
      conversation = null,
      previous_response_id = null,
      instructions = null,
      tools = []
    } = options;
    
    return openaiRequest('/responses', {
      method: 'POST',
      body: JSON.stringify({
        model,
        input,
        temperature,
        max_output_tokens,
        stream,
        conversation,
        previous_response_id,
        instructions,
        tools
      })
    });
  },
  
  // Génération directe OpenAI (legacy - pour compatibilité)
  generateDirect: async (messages, options = {}) => {
    const {
      model = 'gpt-4o',
      temperature = 0.7,
      max_tokens = 1000,
      stream = false
    } = options;
    
    return openaiRequest('/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens,
        stream
      })
    });
  },
  
  // Gestion des conversations avec état
  conversation: {
    create: async (input, options = {}) => {
      return aiAPI.createResponse(input, { ...options, conversation: null });
    },
    
    continue: async (input, previousResponseId, options = {}) => {
      return aiAPI.createResponse(input, { ...options, previous_response_id: previousResponseId });
    },
    
    compact: async (model, input, options = {}) => {
      return openaiRequest('/responses/compact', {
        method: 'POST',
        body: JSON.stringify({
          model,
          input,
          ...options
        })
      });
    }
  },
  
  // Récupération de réponse par ID
  getResponse: async (responseId, options = {}) => {
    const { stream = false, include = [] } = options;
    const params = new URLSearchParams();
    if (stream) params.append('stream', 'true');
    if (include.length) params.append('include', include.join(','));
    
    return openaiRequest(`/responses/${responseId}?${params}`);
  },
  
  // Streaming avec Server-Sent Events optimisé
  streamResponse: async (input, options = {}, callbacks = {}) => {
    const {
      onStart = () => {},
      onProgress = () => {},
      onComplete = () => {},
      onError = () => {},
      onToolCall = () => {},
      onReasoning = () => {}
    } = callbacks;
    
    const response = await openaiRequest('/responses', {
      method: 'POST',
      body: JSON.stringify({
        ...options,
        input,
        stream: true
      })
    });
    
    if (!response.body) {
      throw new Error('Streaming not supported');
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    let responseData = null;
    
    try {
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
            onComplete({ text: fullText, response: responseData });
            return { text: fullText, response: responseData };
          }
          
          try {
            const event = JSON.parse(data);
            
            switch (event.type) {
              case 'response.created':
                responseData = event.response;
                onStart(event);
                break;
                
              case 'response.output_text.delta':
                fullText += event.delta;
                onProgress({ delta: event.delta, fullText, event });
                break;
                
              case 'response.output_text.done':
                fullText = event.text;
                break;
                
              case 'response.web_search_call.in_progress':
              case 'response.file_search_call.in_progress':
              case 'response.code_interpreter_call.in_progress':
                onToolCall({ type: 'started', tool: event.type.split('.')[1], event });
                break;
                
              case 'response.web_search_call.completed':
              case 'response.file_search_call.completed':
              case 'response.code_interpreter_call.completed':
                onToolCall({ type: 'completed', tool: event.type.split('.')[1], event });
                break;
                
              case 'response.reasoning_text.delta':
                onReasoning({ type: 'delta', delta: event.delta, event });
                break;
                
              case 'response.reasoning_summary_text.done':
                onReasoning({ type: 'summary', text: event.text, event });
                break;
                
              case 'response.failed':
                const error = new Error(event.response.error?.message || 'Response failed');
                onError(error, event);
                throw error;
                
              case 'response.incomplete':
                onComplete({ 
                  text: fullText, 
                  response: responseData, 
                  incomplete: true,
                  reason: event.response.incomplete_details?.reason 
                });
                break;
            }
          } catch (parseError) {
            console.warn('Failed to parse SSE event:', data, parseError);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
    
    return { text: fullText, response: responseData };
  },
  
  // Génération rapide avec cache
  quickGenerate: async (template, variables = {}) => {
    return apiRequest(`${API_BASE}/ai/quick-generate`, {
      method: 'POST',
      body: JSON.stringify({ template, variables })
    });
  },
  
  // Amélioration de texte dicté
  improveText: async (text, options = {}) => {
    const { 
      tone = 'professional',
      context = 'email',
      language = 'fr'
    } = options;
    
    return apiRequest(`${API_BASE}/ai/improve-text`, {
      method: 'POST',
      body: JSON.stringify({ text, tone, context, language })
    });
  },
  
  // Génération avec conversation persistante
  generateWithConversation: async (conversationId, userMessage, options = {}) => {
    const {
      tone = 'professional',
      context = 'email',
      includeHistory = true
    } = options;
    
    try {
      // Ajouter le message utilisateur à la conversation
      await aiAPI.conversations.addItems(conversationId, [{
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text: userMessage }]
      }]);
      
      // Récupérer l'historique si demandé
      let messages = [];
      if (includeHistory) {
        const items = await aiAPI.conversations.listItems(conversationId, { limit: 10 });
        messages = items.data.filter(item => item.type === 'message').map(item => ({
          role: item.role,
          content: item.content[0]?.text || ''
        }));
      }
      
      // Générer la réponse
      const systemPrompt = `Tu es un assistant expert en rédaction d'emails ${tone} en français pour le contexte: ${context}.`;
      const response = await aiAPI.generateDirect([
        { role: 'system', content: systemPrompt },
        ...messages,
        { role: 'user', content: userMessage }
      ], options);
      
      // Ajouter la réponse à la conversation
      if (response.choices?.[0]?.message?.content) {
        await aiAPI.conversations.addItems(conversationId, [{
          type: 'message',
          role: 'assistant',
          content: [{ type: 'output_text', text: response.choices[0].message.content }]
        }]);
      }
      
      return response;
      
    } catch (error) {
      console.error('Conversation generation error:', error);
      // Fallback vers génération simple
      return aiAPI.generateContent(userMessage, options);
    }
  },
  
  // Embeddings pour recherche sémantique
  createEmbedding: async (text, model = 'text-embedding-3-small') => {
    return openaiRequest('/embeddings', {
      method: 'POST',
      body: JSON.stringify({
        model,
        input: text
      })
    });
  },
  
  // Conversations API - Nouvelle fonctionnalité OpenAI
  conversations: {
    create: async (items = [], metadata = {}) => {
      return openaiRequest('/conversations', {
        method: 'POST',
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
        method: 'POST',
        body: JSON.stringify({ metadata })
      });
    },
    
    delete: async (conversationId) => {
      return openaiRequest(`/conversations/${conversationId}`, {
        method: 'DELETE'
      });
    },
    
    // Gestion des items
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
        method: 'POST',
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
  
  // Outils intégrés pour la nouvelle API
  tools: {
    webSearch: { type: 'web_search' },
    fileSearch: { type: 'file_search' },
    codeInterpreter: { type: 'code_interpreter' }
  },
  
  // Génération avec outils intégrés
  generateWithTools: async (input, tools = [], options = {}) => {
    return aiAPI.createResponse(input, {
      ...options,
      tools,
      tool_choice: 'auto'
    });
  },
  
  // Optimisation: génération rapide avec cache sémantique
  quickResponseCached: async (input, options = {}) => {
    const cacheKey = `ai_response_${JSON.stringify({ input, ...options })}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    
    const response = await aiAPI.createResponse(input, options);
    cache.set(cacheKey, { data: response, timestamp: Date.now() });
    
    return response;
  },
  
  // ===== CHAT COMPLETIONS (Backend) =====
  chatCompletions: {
    create: async (messages, options = {}) => {
      return apiRequest(`${API_BASE}/ai/chat/completions`, {
        method: 'POST',
        body: JSON.stringify({
          messages,
          ...options
        })
      });
    },
    
    get: async (completionId) => {
      return apiRequest(`${API_BASE}/ai/chat/completions/${completionId}`);
    },
    
    list: async (options = {}) => {
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit);
      if (options.order) params.append('order', options.order);
      if (options.after) params.append('after', options.after);
      if (options.model) params.append('model', options.model);
      
      return apiRequest(`${API_BASE}/ai/chat/completions?${params}`);
    },
    
    update: async (completionId, metadata) => {
      return apiRequest(`${API_BASE}/ai/chat/completions/${completionId}`, {
        method: 'POST',
        body: JSON.stringify({ metadata })
      });
    },
    
    delete: async (completionId) => {
      return apiRequest(`${API_BASE}/ai/chat/completions/${completionId}`, {
        method: 'DELETE'
      });
    },
    
    getMessages: async (completionId, options = {}) => {
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit);
      if (options.order) params.append('order', options.order);
      if (options.after) params.append('after', options.after);
      
      return apiRequest(`${API_BASE}/ai/chat/completions/${completionId}/messages?${params}`);
    }
  },
  
  // ===== EMBEDDINGS (Backend) =====
  embeddings: {
    create: async (text, model = 'text-embedding-3-small') => {
      return apiRequest(`${API_BASE}/ai/embeddings`, {
        method: 'POST',
        body: JSON.stringify({ text, model })
      });
    },
    
    batch: async (texts, model = 'text-embedding-3-small') => {
      return apiRequest(`${API_BASE}/ai/embeddings`, {
        method: 'POST',
        body: JSON.stringify({ texts, model })
      });
    },
    
    similarity: async (text1, text2, model = 'text-embedding-3-small') => {
      return apiRequest(`${API_BASE}/ai/similarity`, {
        method: 'POST',
        body: JSON.stringify({ text1, text2, model })
      });
    }
  },
  
  // ===== VECTOR STORES FILES (Backend) =====
  vectorStores: {
    createFile: async (vectorStoreId, fileId) => {
      return apiRequest(`${API_BASE}/ai/vector-stores/${vectorStoreId}/files`, {
        method: 'POST',
        body: JSON.stringify({ file_id: fileId })
      });
    },
    
    listFiles: async (vectorStoreId, options = {}) => {
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit);
      if (options.order) params.append('order', options.order);
      if (options.after) params.append('after', options.after);
      if (options.filter) params.append('filter', options.filter);
      
      return apiRequest(`${API_BASE}/ai/vector-stores/${vectorStoreId}/files?${params}`);
    },
    
    getFile: async (vectorStoreId, fileId) => {
      return apiRequest(`${API_BASE}/ai/vector-stores/${vectorStoreId}/files/${fileId}`);
    },
    
    deleteFile: async (vectorStoreId, fileId) => {
      return apiRequest(`${API_BASE}/ai/vector-stores/${vectorStoreId}/files/${fileId}`, {
        method: 'DELETE'
      });
    }
  },
  
  // ===== FILES API (Backend) =====
  files: {
    upload: async (file, purpose = 'assistants') => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', purpose);
      
      return apiRequest(`${API_BASE}/ai/files`, {
        method: 'POST',
        body: formData,
        headers: {} // Let browser set Content-Type with boundary
      });
    },
    
    list: async (purpose = null) => {
      const params = purpose ? `?purpose=${purpose}` : '';
      return apiRequest(`${API_BASE}/ai/files${params}`);
    },
    
    get: async (fileId) => {
      return apiRequest(`${API_BASE}/ai/files/${fileId}`);
    },
    
    delete: async (fileId) => {
      return apiRequest(`${API_BASE}/ai/files/${fileId}`, {
        method: 'DELETE'
      });
    },
    
    downloadContent: async (fileId) => {
      const response = await fetch(`${API_BASE}/ai/files/${fileId}/content`);
      if (!response.ok) throw new Error('Download failed');
      return response.blob();
    }
  },
  
  // ===== MODERATION API (Backend) =====
  moderation: {
    check: async (text) => {
      return apiRequest(`${API_BASE}/ai/moderate`, {
        method: 'POST',
        body: JSON.stringify({ text })
      });
    },
    
    batch: async (texts) => {
      return apiRequest(`${API_BASE}/ai/moderate`, {
        method: 'POST',
        body: JSON.stringify({ texts })
      });
    },
    
    // Helper: vérifier si contenu est safe
    isSafe: async (text) => {
      const result = await aiAPI.moderation.check(text);
      return result.success && !result.flagged;
    }
  },
  
  // ===== RUN STEPS API (Assistants Beta) =====
  runSteps: {
    list: async (threadId, runId, options = {}) => {
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit);
      if (options.order) params.append('order', options.order);
      if (options.after) params.append('after', options.after);
      if (options.before) params.append('before', options.before);
      if (options.include) {
        options.include.forEach(inc => params.append('include', inc));
      }
      
      return apiRequest(`${API_BASE}/ai/threads/${threadId}/runs/${runId}/steps?${params}`);
    },
    
    get: async (threadId, runId, stepId, options = {}) => {
      const params = new URLSearchParams();
      if (options.include) {
        options.include.forEach(inc => params.append('include', inc));
      }
      
      return apiRequest(`${API_BASE}/ai/threads/${threadId}/runs/${runId}/steps/${stepId}?${params}`);
    },
    
    // Helper: récupérer tous les steps avec détails complets
    listWithDetails: async (threadId, runId, options = {}) => {
      return aiAPI.runSteps.list(threadId, runId, {
        ...options,
        include: ['step_details.tool_calls[*].file_search.results[*].content']
      });
    },
    
    // Helper: surveiller le statut des steps
    watchSteps: async (threadId, runId, onUpdate, interval = 1000) => {
      let lastStepId = null;
      
      const checkSteps = async () => {
        const result = await aiAPI.runSteps.list(threadId, runId, {
          order: 'desc',
          limit: 10
        });
        
        if (result.success && result.data.length > 0) {
          const latestStep = result.data[0];
          
          if (latestStep.id !== lastStepId) {
            lastStepId = latestStep.id;
            onUpdate(latestStep, result.data);
          }
          
          // Continuer si le dernier step est en cours
          if (latestStep.status === 'in_progress') {
            setTimeout(checkSteps, interval);
          }
        }
      };
      
      checkSteps();
    }
  }
};

// Service Vocal optimisé avec nouvelles API Audio OpenAI
export const voiceAPI = {
  // Text-to-Speech avec nouvelles voix
  createSpeech: async (text, options = {}) => {
    const {
      model = 'gpt-4o-mini-tts',
      voice = 'alloy',
      response_format = 'mp3',
      speed = 1.0,
      instructions = null,
      stream_format = 'audio'
    } = options;
    
    return openaiRequest('/audio/speech', {
      method: 'POST',
      body: JSON.stringify({
        model,
        input: text,
        voice,
        response_format,
        speed,
        instructions,
        stream_format
      })
    });
  },
  
  // Streaming TTS avec SSE
  streamSpeech: async (text, options = {}, onChunk) => {
    const response = await voiceAPI.createSpeech(text, {
      ...options,
      stream_format: 'sse'
    });
    
    if (!response.body) return;
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            
            try {
              const event = JSON.parse(data);
              if (event.type === 'speech.audio.delta') {
                onChunk(event.audio);
              } else if (event.type === 'speech.audio.done') {
                console.log('Speech completed:', event.usage);
              }
            } catch (e) {
              console.warn('Failed to parse TTS event:', data);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },
  
  // Transcription avec nouveaux modèles
  transcribe: async (audioFile, options = {}) => {
    const {
      model = 'gpt-4o-transcribe',
      language = 'fr',
      response_format = 'json',
      temperature = 0,
      prompt = null,
      stream = false,
      include = [],
      chunking_strategy = 'auto'
    } = options;
    
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', model);
    formData.append('language', language);
    formData.append('response_format', response_format);
    formData.append('temperature', temperature.toString());
    formData.append('stream', stream.toString());
    formData.append('chunking_strategy', chunking_strategy);
    
    if (prompt) formData.append('prompt', prompt);
    if (include.length) formData.append('include', include.join(','));
    
    return openaiRequest('/audio/transcriptions', {
      method: 'POST',
      body: formData,
      headers: {} // Laisser le navigateur définir Content-Type pour FormData
    });
  },
  
  // Transcription avec diarisation (identification des locuteurs)
  transcribeWithDiarization: async (audioFile, options = {}) => {
    const {
      known_speaker_names = [],
      known_speaker_references = [],
      response_format = 'diarized_json'
    } = options;
    
    return voiceAPI.transcribe(audioFile, {
      model: 'gpt-4o-transcribe-diarize',
      response_format,
      known_speaker_names,
      known_speaker_references,
      ...options
    });
  },
  
  // Streaming transcription
  streamTranscribe: async (audioFile, options = {}, callbacks = {}) => {
    const {
      onDelta = () => {},
      onSegment = () => {},
      onComplete = () => {},
      onError = () => {}
    } = callbacks;
    
    const response = await voiceAPI.transcribe(audioFile, {
      ...options,
      stream: true
    });
    
    if (!response.body) return;
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onComplete({ text: fullText });
              return;
            }
            
            try {
              const event = JSON.parse(data);
              
              switch (event.type) {
                case 'transcript.text.delta':
                  fullText += event.delta;
                  onDelta({ delta: event.delta, fullText, event });
                  break;
                  
                case 'transcript.text.segment':
                  onSegment(event);
                  break;
                  
                case 'transcript.text.done':
                  fullText = event.text;
                  onComplete({ text: event.text, usage: event.usage });
                  break;
              }
            } catch (e) {
              console.warn('Failed to parse transcription event:', data);
            }
          }
        }
      }
    } catch (error) {
      onError(error);
    } finally {
      reader.releaseLock();
    }
  },
  
  // Traduction audio vers anglais
  translate: async (audioFile, options = {}) => {
    const {
      model = 'whisper-1',
      response_format = 'json',
      temperature = 0,
      prompt = null
    } = options;
    
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', model);
    formData.append('response_format', response_format);
    formData.append('temperature', temperature.toString());
    
    if (prompt) formData.append('prompt', prompt);
    
    return openaiRequest('/audio/translations', {
      method: 'POST',
      body: formData,
      headers: {}
    });
  },
  
  // Gestion des voix personnalisées
  voices: {
    // Créer un consentement vocal
    createConsent: async (name, language, recordingFile) => {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('language', language);
      formData.append('recording', recordingFile);
      
      return openaiRequest('/audio/voice_consents', {
        method: 'POST',
        body: formData,
        headers: {}
      });
    },
    
    // Lister les consentements
    listConsents: async (options = {}) => {
      const { after, limit = 20 } = options;
      const params = new URLSearchParams();
      if (after) params.append('after', after);
      params.append('limit', limit.toString());
      
      return openaiRequest(`/audio/voice_consents?${params}`);
    },
    
    // Créer une voix personnalisée
    create: async (name, consentId, audioSample) => {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('consent', consentId);
      formData.append('audio_sample', audioSample);
      
      return openaiRequest('/audio/voices', {
        method: 'POST',
        body: formData,
        headers: {}
      });
    }
  },
  
  // Utilitaires pour IAPosteManager
  utils: {
    // Convertir base64 en Blob audio
    base64ToBlob: (base64, mimeType = 'audio/mp3') => {
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: mimeType });
    },
    
    // Jouer l'audio depuis base64
    playBase64Audio: (base64Audio) => {
      const blob = voiceAPI.utils.base64ToBlob(base64Audio);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
      return audio;
    },
    
    // Enregistrer depuis le microphone
    recordAudio: async (duration = 10000) => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];
      
      return new Promise((resolve, reject) => {
        mediaRecorder.ondataavailable = (event) => {
          chunks.push(event.data);
        };
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/wav' });
          resolve(blob);
        };
        
        mediaRecorder.onerror = reject;
        
        mediaRecorder.start();
        setTimeout(() => {
          mediaRecorder.stop();
          stream.getTracks().forEach(track => track.stop());
        }, duration);
      });
    }
  },
  
  // Compatibilité avec l'ancien API
  speak: async (text, options = {}) => {
    const response = await voiceAPI.createSpeech(text, options);
    if (response instanceof ArrayBuffer) {
      const blob = new Blob([response], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
      return audio;
    }
    return response;
  },
  
  // Endpoints REST pour compatibilité
  startRecording: async () => {
    return apiRequest(`${API_BASE}/voice/start-recording`, {
      method: 'POST'
    });
  },
  
  stopRecording: async () => {
    return apiRequest(`${API_BASE}/voice/stop-recording`, {
      method: 'POST'
    });
  },
  
  transcribeChunk: async (audioBase64) => {
    return apiRequest(`${API_BASE}/voice/transcribe-chunk`, {
      method: 'POST',
      body: JSON.stringify({ audio: audioBase64 })
    });
  }
};

// Service Accessibilité optimisé
export const accessibilityAPI = {
  getSettings: async () => {
    return apiRequest(`${API_BASE}/accessibility/settings`);
  },
  
  updateSettings: async (settings) => {
    return apiRequest(`${API_BASE}/accessibility/settings`, {
      method: 'POST',
      body: JSON.stringify(settings)
    });
  },
  
  getShortcuts: async () => {
    return apiRequest(`${API_BASE}/accessibility/shortcuts`);
  },
  
  // Alias pour compatibilité
  getUserStats: async () => {
    return accessibilityAPI.getSettings();
  },
  
  getPreferences: async () => {
    return accessibilityAPI.getSettings();
  }
};

// Service Auth
export const authAPI = {
  login: async (credentials) => {
    return apiRequest(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },
  
  logout: async () => {
    return apiRequest(`${API_BASE}/auth/logout`, {
      method: 'POST'
    });
  }
};

// Service Configuration
export const configAPI = {
  getSettings: async () => {
    return apiRequest(`${API_BASE}/config/settings`);
  },
  
  updateSettings: async (settings) => {
    return apiRequest(`${API_BASE}/config/settings`, {
      method: 'POST',
      body: JSON.stringify(settings)
    });
  }
};

// Service Templates
export const templateAPI = {
  getAll: async () => {
    return apiRequest(`${API_BASE}/templates`);
  },
  
  create: async (template) => {
    return apiRequest(`${API_BASE}/templates`, {
      method: 'POST',
      body: JSON.stringify(template)
    });
  }
};

// Service Dashboard
export const dashboardAPI = {
  getStats: async () => {
    return apiRequest(`${API_BASE}/dashboard/stats`);
  }
};

// Service de streaming avancé pour IAPosteManager
export const streamingAPI = {
  // Streaming d'email avec feedback en temps réel
  generateEmailStream: async (prompt, options = {}) => {
    const emailCallbacks = {
      onStart: (event) => {
        console.log('Email generation started:', event.response?.id);
      },
      onProgress: ({ delta, fullText }) => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('email-generation-progress', {
            detail: { delta, fullText, progress: fullText.length }
          }));
        }
      },
      onToolCall: ({ type, tool, event }) => {
        if (tool === 'web_search') {
          console.log(`Web search ${type}:`, event);
        }
      },
      onComplete: ({ text, response }) => {
        console.log('Email generation completed:', { length: text.length, id: response?.id });
      },
      onError: (error) => {
        console.error('Email generation failed:', error);
      }
    };
    
    return streamingChatAPI.streamEmailGeneration(prompt, {
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 2000,
      ...options
    }, emailCallbacks);
  },
  
  // Streaming simplifié pour l'interface utilisateur
  streamText: async (input, options = {}) => {
    let fullText = '';
    
    await streamingChatAPI.streamChatCompletion([
      { role: 'user', content: input }
    ], options, {
      onChunk: ({ delta }) => {
        fullText += delta;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ai-text-delta', {
            detail: { delta, fullText }
          }));
        }
      }
    });
    
    return fullText;
  }
};

// Service Vidéo avec API Sora OpenAI
export const videoAPI = {
  // Créer une vidéo
  create: async (prompt, options = {}) => {
    const {
      model = 'sora-2',
      seconds = '4',
      size = '720x1280',
      input_reference = null
    } = options;
    
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('model', model);
    formData.append('seconds', seconds);
    formData.append('size', size);
    
    if (input_reference) {
      formData.append('input_reference', input_reference);
    }
    
    return openaiRequest('/videos', {
      method: 'POST',
      body: formData,
      headers: {}
    });
  },
  
  // Remixer une vidéo existante
  remix: async (videoId, newPrompt) => {
    return openaiRequest(`/videos/${videoId}/remix`, {
      method: 'POST',
      body: JSON.stringify({ prompt: newPrompt })
    });
  },
  
  // Lister les vidéos
  list: async (options = {}) => {
    const { after, limit = 20, order = 'desc' } = options;
    const params = new URLSearchParams();
    if (after) params.append('after', after);
    params.append('limit', limit.toString());
    params.append('order', order);
    
    return openaiRequest(`/videos?${params}`);
  },
  
  // Récupérer une vidéo
  get: async (videoId) => {
    return openaiRequest(`/videos/${videoId}`);
  },
  
  // Supprimer une vidéo
  delete: async (videoId) => {
    return openaiRequest(`/videos/${videoId}`, {
      method: 'DELETE'
    });
  },
  
  // Télécharger le contenu vidéo
  downloadContent: async (videoId, variant = null) => {
    const params = variant ? `?variant=${variant}` : '';
    return openaiRequest(`/videos/${videoId}/content${params}`);
  },
  
  // Attendre la complétion d'une vidéo
  waitForCompletion: async (videoId, options = {}) => {
    const { maxWaitTime = 300000, pollInterval = 5000 } = options; // 5 min max, poll toutes les 5s
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const video = await videoAPI.get(videoId);
      
      if (video.status === 'completed') {
        return video;
      } else if (video.status === 'failed') {
        throw new Error(`Video generation failed: ${video.error?.message || 'Unknown error'}`);
      }
      
      // Attendre avant le prochain poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    throw new Error('Video generation timeout');
  },
  
  // Créer et attendre une vidéo
  createAndWait: async (prompt, options = {}) => {
    const video = await videoAPI.create(prompt, options);
    return videoAPI.waitForCompletion(video.id, options);
  },
  
  // Utilitaires pour IAPosteManager
  utils: {
    // Formats supportés
    sizes: {
      portrait: '720x1280',
      landscape: '1280x720',
      vertical: '1024x1792',
      horizontal: '1792x1024'
    },
    
    durations: ['4', '8', '12'],
    
    models: ['sora-2', 'sora-2-pro'],
    
    // Créer une URL de prévisualisation
    createPreviewUrl: (videoId) => {
      return `${OPENAI_API_BASE}/videos/${videoId}/content?variant=preview`;
    },
    
    // Estimer le coût (approximatif)
    estimateCost: (seconds, model = 'sora-2') => {
      const baseCost = model === 'sora-2-pro' ? 0.08 : 0.05; // USD par seconde
      return parseFloat(seconds) * baseCost;
    }
  }
};

// Service de génération vidéo pour emails marketing
export const emailVideoAPI = {
  // Générer une vidéo pour un email marketing
  generateEmailVideo: async (emailContent, options = {}) => {
    const {
      style = 'professional',
      duration = '8',
      format = 'landscape'
    } = options;
    
    const prompt = `Create a ${style} marketing video based on this email content: "${emailContent.substring(0, 500)}". Make it engaging and visually appealing for email marketing.`;
    
    return videoAPI.create(prompt, {
      seconds: duration,
      size: videoAPI.utils.sizes[format],
      model: 'sora-2'
    });
  },
  
  // Créer une vidéo de présentation produit
  generateProductVideo: async (productDescription, options = {}) => {
    const prompt = `Create a professional product showcase video for: "${productDescription}". Show the product in an elegant, modern setting with smooth camera movements.`;
    
    return videoAPI.create(prompt, {
      seconds: options.duration || '12',
      size: options.size || videoAPI.utils.sizes.landscape,
      model: 'sora-2-pro'
    });
  },
  
  // Générer une vidéo explicative
  generateExplainerVideo: async (concept, options = {}) => {
    const prompt = `Create an animated explainer video about: "${concept}". Use clear visuals, smooth transitions, and professional presentation style.`;
    
    return videoAPI.create(prompt, {
      seconds: options.duration || '12',
      size: videoAPI.utils.sizes.horizontal,
      model: 'sora-2'
    });
  }
};

// Service de streaming d'images avec événements SSE
export const imageStreamingAPI = {
  // Génération d'image avec streaming
  generateStream: async (prompt, options = {}, callbacks = {}) => {
    const {
      onPartialImage = () => {},
      onComplete = () => {},
      onError = () => {}
    } = callbacks;
    
    const {
      model = 'dall-e-3',
      size = '1024x1024',
      quality = 'high',
      background = 'transparent',
      output_format = 'png',
      stream = true
    } = options;
    
    const response = await openaiRequest('/images/generations', {
      method: 'POST',
      body: JSON.stringify({
        model,
        prompt,
        size,
        quality,
        background,
        output_format,
        stream
      })
    });
    
    if (!response.body) {
      throw new Error('Streaming not supported');
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let partialImages = [];
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;
          
          const data = line.slice(6);
          if (data === '[DONE]') return;
          
          try {
            const event = JSON.parse(data);
            
            switch (event.type) {
              case 'image_generation.partial_image':
                partialImages.push(event.b64_json);
                onPartialImage({
                  image: event.b64_json,
                  index: event.partial_image_index,
                  size: event.size,
                  quality: event.quality,
                  event
                });
                break;
                
              case 'image_generation.completed':
                onComplete({
                  image: event.b64_json,
                  size: event.size,
                  quality: event.quality,
                  usage: event.usage,
                  partialImages,
                  event
                });
                return event.b64_json;
            }
          } catch (parseError) {
            console.warn('Failed to parse image event:', data, parseError);
          }
        }
      }
    } catch (error) {
      onError(error);
      throw error;
    } finally {
      reader.releaseLock();
    }
  },
  
  // Édition d'image avec streaming
  editStream: async (imageFile, prompt, options = {}, callbacks = {}) => {
    const {
      onPartialImage = () => {},
      onComplete = () => {},
      onError = () => {}
    } = callbacks;
    
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('prompt', prompt);
    formData.append('stream', 'true');
    
    if (options.mask) formData.append('mask', options.mask);
    if (options.size) formData.append('size', options.size);
    if (options.quality) formData.append('quality', options.quality);
    
    const response = await openaiRequest('/images/edits', {
      method: 'POST',
      body: formData,
      headers: {}
    });
    
    if (!response.body) {
      throw new Error('Streaming not supported');
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let partialImages = [];
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;
          
          const data = line.slice(6);
          if (data === '[DONE]') return;
          
          try {
            const event = JSON.parse(data);
            
            switch (event.type) {
              case 'image_edit.partial_image':
                partialImages.push(event.b64_json);
                onPartialImage({
                  image: event.b64_json,
                  index: event.partial_image_index,
                  event
                });
                break;
                
              case 'image_edit.completed':
                onComplete({
                  image: event.b64_json,
                  usage: event.usage,
                  partialImages,
                  event
                });
                return event.b64_json;
            }
          } catch (parseError) {
            console.warn('Failed to parse edit event:', data, parseError);
          }
        }
      }
    } catch (error) {
      onError(error);
      throw error;
    } finally {
      reader.releaseLock();
    }
  },
  
  // Utilitaires
  utils: {
    // Convertir base64 en image
    base64ToImage: (base64) => {
      return `data:image/png;base64,${base64}`;
    },
    
    // Afficher l'image progressive
    displayProgressiveImage: (base64, elementId) => {
      const img = document.getElementById(elementId);
      if (img) {
        img.src = imageStreamingAPI.utils.base64ToImage(base64);
      }
    }
  }
};
// Service Webhook pour les événements OpenAI en arrière-plan
export const webhookAPI = {
  // Gestionnaire d'événements webhook
  handleWebhookEvent: (event) => {
    const { type, data, created_at } = event;
    
    switch (type) {
      case 'response.completed':
        webhookAPI.onResponseCompleted(data, created_at);
        break;
      case 'response.failed':
        webhookAPI.onResponseFailed(data, created_at);
        break;
      case 'response.cancelled':
        webhookAPI.onResponseCancelled(data, created_at);
        break;
      case 'batch.completed':
        webhookAPI.onBatchCompleted(data, created_at);
        break;
      case 'fine_tuning.job.succeeded':
        webhookAPI.onFineTuningSucceeded(data, created_at);
        break;
      default:
        console.log('Unhandled webhook event:', type, data);
    }
  },
  
  // Gestionnaires spécifiques
  onResponseCompleted: (data, timestamp) => {
    console.log('Background response completed:', data.id);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('openai-response-completed', {
        detail: { responseId: data.id, timestamp }
      }));
    }
  },
  
  onResponseFailed: (data, timestamp) => {
    console.error('Background response failed:', data.id);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('openai-response-failed', {
        detail: { responseId: data.id, timestamp }
      }));
    }
  },
  
  onResponseCancelled: (data, timestamp) => {
    console.log('Background response cancelled:', data.id);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('openai-response-cancelled', {
        detail: { responseId: data.id, timestamp }
      }));
    }
  },
  
  onBatchCompleted: (data, timestamp) => {
    console.log('Batch completed:', data.id);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('openai-batch-completed', {
        detail: { batchId: data.id, timestamp }
      }));
    }
  },
  
  onFineTuningSucceeded: (data, timestamp) => {
    console.log('Fine-tuning succeeded:', data.id);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('openai-finetuning-succeeded', {
        detail: { jobId: data.id, timestamp }
      }));
    }
  },
  
  // Configuration webhook côté backend
  configureWebhook: async (webhookUrl, events = []) => {
    return apiRequest(`${API_BASE}/webhooks/configure`, {
      method: 'POST',
      body: JSON.stringify({
        url: webhookUrl,
        events: events.length ? events : [
          'response.completed',
          'response.failed', 
          'batch.completed',
          'fine_tuning.job.succeeded'
        ]
      })
    });
  },
  
  // Vérifier le statut des webhooks
  getWebhookStatus: async () => {
    return apiRequest(`${API_BASE}/webhooks/status`);
  }
};
// Service d'évaluation (Evals) pour tester les performances des modèles
export const evalsAPI = {
  // Créer une évaluation
  create: async (name, dataSourceConfig, testingCriteria, metadata = {}) => {
    return openaiRequest('/evals', {
      method: 'POST',
      body: JSON.stringify({
        name,
        data_source_config: dataSourceConfig,
        testing_criteria: testingCriteria,
        metadata
      })
    });
  },
  
  // Récupérer une évaluation
  get: async (evalId) => {
    return openaiRequest(`/evals/${evalId}`);
  },
  
  // Mettre à jour une évaluation
  update: async (evalId, updates) => {
    return openaiRequest(`/evals/${evalId}`, {
      method: 'POST',
      body: JSON.stringify(updates)
    });
  },
  
  // Supprimer une évaluation
  delete: async (evalId) => {
    return openaiRequest(`/evals/${evalId}`, {
      method: 'DELETE'
    });
  },
  
  // Lister les évaluations
  list: async (options = {}) => {
    const { after, limit = 20, order = 'asc', order_by = 'created_at' } = options;
    const params = new URLSearchParams();
    if (after) params.append('after', after);
    params.append('limit', limit.toString());
    params.append('order', order);
    params.append('order_by', order_by);
    
    return openaiRequest(`/evals?${params}`);
  },
  
  // Gestion des exécutions (runs)
  runs: {
    // Créer une exécution
    create: async (evalId, dataSource, options = {}) => {
      return openaiRequest(`/evals/${evalId}/runs`, {
        method: 'POST',
        body: JSON.stringify({
          data_source: dataSource,
          name: options.name,
          metadata: options.metadata || {}
        })
      });
    },
    
    // Lister les exécutions
    list: async (evalId, options = {}) => {
      const { after, limit = 20, order = 'asc', status } = options;
      const params = new URLSearchParams();
      if (after) params.append('after', after);
      params.append('limit', limit.toString());
      params.append('order', order);
      if (status) params.append('status', status);
      
      return openaiRequest(`/evals/${evalId}/runs?${params}`);
    },
    
    // Récupérer une exécution
    get: async (evalId, runId) => {
      return openaiRequest(`/evals/${evalId}/runs/${runId}`);
    },
    
    // Annuler une exécution
    cancel: async (evalId, runId) => {
      return openaiRequest(`/evals/${evalId}/runs/${runId}/cancel`, {
        method: 'POST'
      });
    },
    
    // Supprimer une exécution
    delete: async (evalId, runId) => {
      return openaiRequest(`/evals/${evalId}/runs/${runId}`, {
        method: 'DELETE'
      });
    },
    
    // Résultats d'exécution
    getOutputItems: async (evalId, runId, options = {}) => {
      const { after, limit = 20, order = 'asc', status } = options;
      const params = new URLSearchParams();
      if (after) params.append('after', after);
      params.append('limit', limit.toString());
      params.append('order', order);
      if (status) params.append('status', status);
      
      return openaiRequest(`/evals/${evalId}/runs/${runId}/output_items?${params}`);
    },
    
    // Récupérer un item de sortie
    getOutputItem: async (evalId, runId, outputItemId) => {
      return openaiRequest(`/evals/${evalId}/runs/${runId}/output_items/${outputItemId}`);
    }
  },
  
  // Utilitaires pour IAPosteManager
  utils: {
    // Créer une évaluation pour emails
    createEmailEval: async (name, testData) => {
      const dataSourceConfig = {
        type: 'custom',
        schema: {
          type: 'object',
          properties: {
            item: {
              type: 'object',
              properties: {
                prompt: { type: 'string' },
                expected_tone: { type: 'string' },
                expected_length: { type: 'number' }
              },
              required: ['prompt', 'expected_tone']
            }
          },
          required: ['item']
        }
      };
      
      const testingCriteria = [
        {
          type: 'label_model',
          model: 'gpt-4o',
          name: 'Email Quality Grader',
          input: [
            {
              role: 'developer',
              content: 'Evaluate if this email matches the expected tone and is professional. Rate as "good" or "poor".'
            },
            {
              role: 'user',
              content: 'Email: {{sample.output_text}}\nExpected tone: {{item.expected_tone}}'
            }
          ],
          passing_labels: ['good'],
          labels: ['good', 'poor']
        }
      ];
      
      return evalsAPI.create(name, dataSourceConfig, testingCriteria, {
        purpose: 'email_quality_testing',
        created_by: 'iapostemanager'
      });
    },
    
    // Exécuter un test d'email
    runEmailTest: async (evalId, emailPrompts) => {
      const dataSource = {
        type: 'completions',
        source: {
          type: 'file_content',
          content: emailPrompts.map(prompt => ({ item: prompt }))
        },
        input_messages: {
          type: 'template',
          template: [
            {
              role: 'developer',
              content: 'You are a professional email assistant. Generate a high-quality email based on the prompt.'
            },
            {
              role: 'user',
              content: '{{item.prompt}}'
            }
          ]
        },
        model: 'gpt-4o',
        sampling_params: {
          temperature: 0.7,
          max_completions_tokens: 1000
        }
      };
      
      return evalsAPI.runs.create(evalId, dataSource, {
        name: `Email Test - ${new Date().toISOString()}`
      });
    },
    
    // Analyser les résultats
    analyzeResults: async (evalId, runId) => {
      const run = await evalsAPI.runs.get(evalId, runId);
      const outputItems = await evalsAPI.runs.getOutputItems(evalId, runId);
      
      const analysis = {
        totalTests: run.result_counts.total,
        passed: run.result_counts.passed,
        failed: run.result_counts.failed,
        successRate: (run.result_counts.passed / run.result_counts.total) * 100,
        usage: run.per_model_usage,
        failedItems: outputItems.data.filter(item => item.status === 'fail')
      };
      
      return analysis;
    }
  }
};

// Service d'évaluation spécialisé pour emails
export const emailEvalsAPI = {
  // Évaluer la qualité des emails générés
  evaluateEmailQuality: async (emails, criteria = {}) => {
    const {
      checkTone = true,
      checkLength = true,
      checkProfessionalism = true,
      expectedTone = 'professional'
    } = criteria;
    
    // Créer l'évaluation
    const evalName = `Email Quality - ${Date.now()}`;
    const eval_ = await evalsAPI.utils.createEmailEval(evalName, emails);
    
    // Exécuter le test
    const run = await evalsAPI.utils.runEmailTest(eval_.id, emails);
    
    // Attendre les résultats
    return emailEvalsAPI.waitForResults(eval_.id, run.id);
  },
  
  // Attendre les résultats d'une évaluation
  waitForResults: async (evalId, runId, maxWaitTime = 300000) => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const run = await evalsAPI.runs.get(evalId, runId);
      
      if (run.status === 'completed') {
        return evalsAPI.utils.analyzeResults(evalId, runId);
      } else if (run.status === 'failed') {
        throw new Error(`Evaluation failed: ${run.error?.message || 'Unknown error'}`);
      }
      
      // Attendre 5 secondes avant le prochain check
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    throw new Error('Evaluation timeout');
  },
  
  // Comparer deux modèles
  compareModels: async (emailPrompts, model1 = 'gpt-4o', model2 = 'gpt-4o-mini') => {
    const evalName = `Model Comparison - ${model1} vs ${model2}`;
    const eval_ = await evalsAPI.utils.createEmailEval(evalName, emailPrompts);
    
    // Test avec le premier modèle
    const run1 = await evalsAPI.utils.runEmailTest(eval_.id, emailPrompts);
    const results1 = await emailEvalsAPI.waitForResults(eval_.id, run1.id);
    
    // Test avec le deuxième modèle
    const dataSource2 = {
      ...run1.data_source,
      model: model2
    };
    const run2 = await evalsAPI.runs.create(eval_.id, dataSource2, {
      name: `${model2} Test`
    });
    const results2 = await emailEvalsAPI.waitForResults(eval_.id, run2.id);
    
    return {
      [model1]: results1,
      [model2]: results2,
      comparison: {
        winner: results1.successRate > results2.successRate ? model1 : model2,
        difference: Math.abs(results1.successRate - results2.successRate)
      }
    };
  },
  
  // Évaluation continue
  setupContinuousEval: async (evalConfig) => {
    const eval_ = await evalsAPI.utils.createEmailEval(
      evalConfig.name,
      evalConfig.testData
    );
    
    // Programmer des exécutions régulières
    if (typeof window !== 'undefined') {
      const interval = setInterval(async () => {
        try {
          const run = await evalsAPI.utils.runEmailTest(eval_.id, evalConfig.testData);
          const results = await emailEvalsAPI.waitForResults(eval_.id, run.id);
          
          // Émettre un événement avec les résultats
          window.dispatchEvent(new CustomEvent('email-eval-completed', {
            detail: { evalId: eval_.id, runId: run.id, results }
          }));
          
          // Alerter si la qualité baisse
          if (results.successRate < evalConfig.minSuccessRate) {
            window.dispatchEvent(new CustomEvent('email-quality-alert', {
              detail: { 
                message: `Email quality dropped to ${results.successRate}%`,
                results 
              }
            }));
          }
        } catch (error) {
          console.error('Continuous eval error:', error);
        }
      }, evalConfig.interval || 3600000); // 1 heure par défaut
      
      return { evalId: eval_.id, interval };
    }
    
// Service Uploads pour fichiers volumineux
export const uploadsAPI = {
  createUpload: async (filename, bytes, mimeType, purpose = 'assistants', expiresAfter = null) => {
    const payload = { filename, bytes, mime_type: mimeType, purpose };
    if (expiresAfter) payload.expires_after = expiresAfter;
    
    return openaiRequest('/uploads', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  addPart: async (uploadId, chunk) => {
    const formData = new FormData();
    formData.append('data', chunk);
    
    return openaiRequest(`/uploads/${uploadId}/parts`, {
      method: 'POST',
      body: formData,
      headers: {}
    });
  },

  completeUpload: async (uploadId, partIds, md5 = null) => {
    const payload = { part_ids: partIds };
    if (md5) payload.md5 = md5;
    
    return openaiRequest(`/uploads/${uploadId}/complete`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  cancelUpload: async (uploadId) => {
    return openaiRequest(`/uploads/${uploadId}/cancel`, {
      method: 'POST'
    });
  },

  uploadLargeFile: async (file, purpose = 'assistants', chunkSize = 64 * 1024 * 1024, onProgress = null) => {
    const upload = await uploadsAPI.createUpload(file.name, file.size, file.type, purpose);
    const partIds = [];
    const totalChunks = Math.ceil(file.size / chunkSize);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      const part = await uploadsAPI.addPart(upload.id, chunk);
      partIds.push(part.id);
      
      if (onProgress) {
        onProgress({
          loaded: end,
          total: file.size,
          percentage: Math.round((end / file.size) * 100),
          chunk: i + 1,
          totalChunks
        });
      }
    }
    
    return uploadsAPI.completeUpload(upload.id, partIds);
  },

  uploadEmailAttachments: async (files, onProgress = null) => {
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await uploadsAPI.uploadLargeFile(
        file,
        'assistants',
        32 * 1024 * 1024,
        (progress) => {
          if (onProgress) {
            onProgress({
              fileIndex: i,
              fileName: file.name,
              ...progress,
              overallProgress: Math.round(((i + progress.percentage / 100) / files.length) * 100)
            });
          }
        }
      );
      results.push(result);
    }
    
    return results;
  }
};

// Service de graders (évaluateurs) pour évaluations avancées
export const gradersAPI = {
  // Exécuter un grader
  run: async (grader, modelSample, item = {}) => {
    return openaiRequest('/fine_tuning/alpha/graders/run', {
      method: 'POST',
      body: JSON.stringify({
        grader,
        model_sample: modelSample,
        item
      })
    });
  },
  
  // Valider un grader
  validate: async (grader) => {
    return openaiRequest('/fine_tuning/alpha/graders/validate', {
      method: 'POST',
      body: JSON.stringify({ grader })
    });
  },
  
  // Types de graders prédéfinis
  types: {
    stringCheck: (name, input, reference, operation = 'eq') => ({
      type: 'string_check',
      name,
      input,
      reference,
      operation
    }),
    
    textSimilarity: (name, input, reference, metric = 'fuzzy_match') => ({
      type: 'text_similarity',
      name,
      input,
      reference,
      evaluation_metric: metric
    }),
    
    scoreModel: (name, input, model = 'gpt-4o') => ({
      type: 'score_model',
      name,
      input,
      model,
      range: [0, 1],
      sampling_params: {
        temperature: 1,
        top_p: 1,
        seed: 42
      }
    }),
    
    labelModel: (name, input, labels, passingLabels, model = 'gpt-4o') => ({
      type: 'label_model',
      name,
      input,
      labels,
      passing_labels: passingLabels,
      model
    })
  },
  
  // Graders pour emails
  emailGraders: {
    professionalTone: () => gradersAPI.types.labelModel(
      'Professional Tone',
      [{
        role: 'user',
        content: [{
          type: 'input_text',
          text: 'Rate email tone as "professional" or "casual": {{sample.output_text}}'
        }]
      }],
      ['professional', 'casual'],
      ['professional']
    ),
    
    grammarCheck: () => gradersAPI.types.scoreModel(
      'Grammar Check',
      [{
        role: 'user',
        content: [{
          type: 'input_text',
          text: 'Rate grammar 0-1: {{sample.output_text}}'
        }]
      }]
    )
  }
};

// Service d'évaluation avancée
export const advancedEvalsAPI = {
  testGrader: async (grader, samples) => {
    const results = [];
    
    for (const sample of samples) {
      try {
        const result = await gradersAPI.run(grader, sample.modelOutput, sample.item || {});
        results.push({
          sample: sample.modelOutput,
          reward: result.reward,
          passed: result.reward >= 0.5
        });
      } catch (error) {
        results.push({
          sample: sample.modelOutput,
          error: error.message,
          passed: false
        });
      }
    }
    
    return {
      grader: grader.name,
      totalSamples: samples.length,
      passed: results.filter(r => r.passed).length,
      results
    };
  }
};

export const conversationAPI = {
  createEmailConversation: async (emailContext, metadata = {}) => {
    const initialMessage = {
      type: 'message',
      role: 'user',
      content: [{ type: 'input_text', text: `Contexte email: ${emailContext}` }]
    };
    
    const conversationMetadata = {
      purpose: 'email_generation',
      created_by: 'iapostemanager',
      ...metadata
    };
    
    return aiAPI.conversations.create([initialMessage], conversationMetadata);
  },
  
  // Continuer une conversation existante
  continueConversation: async (conversationId, message, options = {}) => {
    return aiAPI.generateWithConversation(conversationId, message, options);
  },
  
  // Obtenir l'historique d'une conversation
  getConversationHistory: async (conversationId, limit = 20) => {
    const items = await aiAPI.conversations.listItems(conversationId, { 
      limit, 
      order: 'asc',
      include: ['message.output_text.logprobs'] 
    });
    
    return items.data.map(item => ({
      id: item.id,
      role: item.role,
      content: item.content?.[0]?.text || '',
      timestamp: item.created_at,
      type: item.type
    }));
  },
  
  // Sauvegarder une conversation avec métadonnées
  saveConversation: async (conversationId, title, tags = []) => {
    const metadata = {
      title,
      tags: tags.join(','),
      saved_at: new Date().toISOString(),
      status: 'saved'
    };
    
    return aiAPI.conversations.update(conversationId, metadata);
  },
  
  // Nettoyer les conversations anciennes
  cleanupOldConversations: async (daysOld = 30) => {
    // Cette fonctionnalité nécessiterait une API de listing des conversations
    // qui n'est pas encore disponible dans l'API OpenAI
    console.warn('Cleanup functionality requires conversation listing API');
    return { cleaned: 0, message: 'Feature not yet available' };
  }
};

// Utilitaires d'optimisation avancés
export const batchAPI = {
  // Exécuter plusieurs requêtes en parallèle avec retry
  parallel: async (requests, maxRetries = 2) => {
    const executeWithRetry = async (req, retries = 0) => {
      try {
        return await apiRequest(req.url, req.options);
      } catch (error) {
        if (retries < maxRetries && error.message.includes('429')) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
          return executeWithRetry(req, retries + 1);
        }
        throw error;
      }
    };
    
    return Promise.allSettled(requests.map(req => executeWithRetry(req)));
  },
  
  // Précharger les données critiques avec priorité
  preload: async () => {
    const criticalData = [
      { url: `${API_BASE}/config/settings`, options: {}, priority: 1 },
      { url: `${API_BASE}/templates`, options: {}, priority: 2 },
      { url: `${API_BASE}/dashboard/stats`, options: {}, priority: 3 }
    ];
    
    // Charger par ordre de priorité
    const sortedData = criticalData.sort((a, b) => a.priority - b.priority);
    
    for (const item of sortedData) {
      try {
        await apiRequest(item.url, item.options);
      } catch (error) {
        console.warn(`Preload failed for ${item.url}:`, error);
      }
    }
  },
  
  // Cache intelligent avec compression
  cache: {
    set: (key, data, ttl = CACHE_TTL) => {
      cache.set(key, {
        data: JSON.stringify(data),
        timestamp: Date.now(),
        ttl
      });
    },
    
    get: (key) => {
      const cached = cache.get(key);
      if (!cached) return null;
      
      if (Date.now() - cached.timestamp > cached.ttl) {
        cache.delete(key);
        return null;
      }
      
      return JSON.parse(cached.data);
    },
    
    clear: () => cache.clear(),
    
    size: () => cache.size
  },
  
  // Optimisation réseau avec compression
  compress: {
    request: async (url, data) => {
      if (typeof CompressionStream !== 'undefined' && data.length > 1024) {
        const stream = new CompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(new TextEncoder().encode(JSON.stringify(data)));
        writer.close();
        
        const compressed = await reader.read();
        return apiRequest(url, {
          method: 'POST',
          headers: { 'Content-Encoding': 'gzip' },
          body: compressed.value
        });
      }
      
      return apiRequest(url, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  }
};

// Initialisation automatique avec monitoring
if (typeof window !== 'undefined') {
  // Précharger au chargement de la page
  window.addEventListener('load', () => {
    setTimeout(() => batchAPI.preload(), 100);
  });
  
  // Nettoyer le cache périodiquement avec monitoring
  setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, value] of cache.entries()) {
      const ttl = value.ttl || CACHE_TTL;
      if (now - value.timestamp > ttl) {
        cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.debug(`Cache cleanup: removed ${cleaned} expired entries, ${cache.size} remaining`);
    }
  }, CACHE_TTL / 2);
  
  // Monitoring des performances
  const perfObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name.includes('/api/') && entry.duration > 2000) {
        console.warn(`Slow API call detected: ${entry.name} took ${entry.duration}ms`);
      }
    }
  });
  
  if (typeof PerformanceObserver !== 'undefined') {
    perfObserver.observe({ entryTypes: ['measure', 'navigation'] });
  }
}

// Exports pour compatibilité avec les composants
export const authService = authAPI;
export const voiceService = voiceAPI;
export const accessibilityService = accessibilityAPI;
export const aiService = aiAPI;
export const emailService = emailAPI;
export const conversationService = conversationAPI;
export const moderationsService = moderationsAPI;
export const chatkitService = chatkitAPI;
export const containerFilesService = containerFilesAPI;
export const callsService = callsAPI;
export const assistantsService = assistantsAPI;
export const threadsService = threadsAPI;
export const messagesService = messagesAPI;

// Service Vector Stores pour recherche sémantique
export const vectorStoresAPI = {
  create: async (name, options = {}) => {
    const {
      description = null,
      file_ids = [],
      chunking_strategy = null,
      expires_after = null,
      metadata = {}
    } = options;
    
    return openaiRequest('/vector_stores', {
      method: 'POST',
      headers: { 'OpenAI-Beta': 'assistants=v2' },
      body: JSON.stringify({
        name,
        description,
        file_ids,
        chunking_strategy,
        expires_after,
        metadata
      })
    });
  },

  list: async (options = {}) => {
    const { after, before, limit = 20, order = 'desc' } = options;
    const params = new URLSearchParams();
    if (after) params.append('after', after);
    if (before) params.append('before', before);
    params.append('limit', limit.toString());
    params.append('order', order);
    
    return openaiRequest(`/vector_stores?${params}`, {
      headers: { 'OpenAI-Beta': 'assistants=v2' }
    });
  },

  get: async (vectorStoreId) => {
    return openaiRequest(`/vector_stores/${vectorStoreId}`, {
      headers: { 'OpenAI-Beta': 'assistants=v2' }
    });
  },

  update: async (vectorStoreId, updates) => {
    return openaiRequest(`/vector_stores/${vectorStoreId}`, {
      method: 'POST',
      headers: { 'OpenAI-Beta': 'assistants=v2' },
      body: JSON.stringify(updates)
    });
  },

  delete: async (vectorStoreId) => {
    return openaiRequest(`/vector_stores/${vectorStoreId}`, {
      method: 'DELETE',
      headers: { 'OpenAI-Beta': 'assistants=v2' }
    });
  },

  search: async (vectorStoreId, query, options = {}) => {
    const {
      filters = null,
      max_num_results = 10,
      ranking_options = null,
      rewrite_query = false
    } = options;
    
    return openaiRequest(`/vector_stores/${vectorStoreId}/search`, {
      method: 'POST',
      headers: { 'OpenAI-Beta': 'assistants=v2' },
      body: JSON.stringify({
        query,
        filters,
        max_num_results,
        ranking_options,
        rewrite_query
      })
    });
  },

  // Utilitaires pour IAPosteManager
  createEmailKnowledgeBase: async (name, emailFiles) => {
    return vectorStoresAPI.create(name, {
      description: 'Base de connaissances pour génération d\'emails',
      file_ids: emailFiles,
      metadata: {
        purpose: 'email_generation',
        created_by: 'iapostemanager'
      }
    });
  },

  searchEmailTemplates: async (vectorStoreId, query) => {
    return vectorStoresAPI.search(vectorStoreId, query, {
      max_num_results: 5,
      rewrite_query: true,
      filters: {
        file_attributes: {
          type: 'email_template'
        }
      }
    });
  },

  waitForCompletion: async (vectorStoreId, maxWaitTime = 300000) => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const store = await vectorStoresAPI.get(vectorStoreId);
      
      if (store.status === 'completed') {
        return store;
      } else if (store.status === 'failed') {
        throw new Error('Vector store processing failed');
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    throw new Error('Vector store processing timeout');
  }
};

// API de modération de contenu
export const moderationsAPI = {
  // Modérer du contenu texte
  moderateText: async (text, model = 'omni-moderation-latest') => {
    return openaiRequest('/moderations', {
      method: 'POST',
      body: JSON.stringify({ input: text, model })
    });
  },
  
  // Vérifier si le contenu est sûr
  isSafe: async (content) => {
    const result = await moderationsAPI.moderateText(content);
    return !result.results[0].flagged;
  },
  
  // Modérer un email complet
  moderateEmail: async (emailData) => {
    const content = [
      emailData.subject || '',
      emailData.body || '',
      emailData.signature || ''
    ].filter(Boolean).join('\n\n');
    
    const result = await moderationsAPI.moderateText(content);
    const analysis = result.results[0];
    
    return {
      safe: !analysis.flagged,
      categories: analysis.categories,
      scores: analysis.category_scores,
      recommendations: moderationsAPI.getRecommendations(analysis)
    };
  },
  
  // Obtenir des recommandations basées sur l'analyse
  getRecommendations: (analysis) => {
    const recommendations = [];
    
    if (analysis.categories.harassment) {
      recommendations.push('Utilisez un langage plus professionnel');
    }
    if (analysis.categories.hate) {
      recommendations.push('Supprimez le contenu potentiellement offensant');
    }
    if (analysis.categories.violence) {
      recommendations.push('Utilisez une terminologie moins agressive');
    }
    
    return recommendations;
  },
  
  // Filtre en temps réel pour la saisie
  filterRealtime: async (text, threshold = 0.5) => {
    if (text.length < 10) return { safe: true };
    
    try {
      const result = await moderationsAPI.moderateText(text);
      const maxScore = Math.max(...Object.values(result.results[0].category_scores));
      
      return {
        safe: maxScore < threshold,
        warning: maxScore >= threshold ? 'Contenu potentiellement inapproprié' : null
      };
    } catch (error) {
      return { safe: true, error: true };
    }
  }
};

// API ChatKit pour sessions et threads
export const chatkitAPI = {
  // Créer une session ChatKit
  createSession: async (userId, workflowId = 'email_generation') => {
    const workflow = {
      id: workflowId,
      version: '2024-10-01'
    };
    
    const config = {
      chatkit_configuration: {
        automatic_thread_titling: { enabled: true },
        file_upload: { enabled: true, max_file_size: 16, max_files: 20 },
        history: { enabled: true, recent_threads: 10 }
      },
      expires_after: { seconds: 1800 },
      rate_limits: { max_requests_per_1_minute: 60 }
    };
    
    return openaiRequest('/chatkit/sessions', {
      method: 'POST',
      headers: { 'OpenAI-Beta': 'chatkit_beta=v1' },
      body: JSON.stringify({ user: userId, workflow, ...config })
    });
  },
  
  // Annuler une session
  cancelSession: async (sessionId) => {
    return openaiRequest(`/chatkit/sessions/${sessionId}/cancel`, {
      method: 'POST',
      headers: { 'OpenAI-Beta': 'chatkit_beta=v1' }
    });
  },
  
  // Lister les threads
  listThreads: async (options = {}) => {
    const { user, limit = 20, order = 'desc' } = options;
    const params = new URLSearchParams();
    if (user) params.append('user', user);
    params.append('limit', limit.toString());
    params.append('order', order);
    
    return openaiRequest(`/chatkit/threads?${params}`, {
      headers: { 'OpenAI-Beta': 'chatkit_beta=v1' }
    });
  },
  
  // Obtenir un thread
  getThread: async (threadId) => {
    return openaiRequest(`/chatkit/threads/${threadId}`, {
      headers: { 'OpenAI-Beta': 'chatkit_beta=v1' }
    });
  },
  
  // Supprimer un thread
  deleteThread: async (threadId) => {
    return openaiRequest(`/chatkit/threads/${threadId}`, {
      method: 'DELETE',
      headers: { 'OpenAI-Beta': 'chatkit_beta=v1' }
    });
  },
  
  // Lister les éléments d'un thread
  listThreadItems: async (threadId, options = {}) => {
    const { limit = 20, order = 'asc' } = options;
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('order', order);
    
    return openaiRequest(`/chatkit/threads/${threadId}/items?${params}`, {
      headers: { 'OpenAI-Beta': 'chatkit_beta=v1' }
    });
  },
  
  // Utilitaires pour emails
  getUserEmailThreads: async (userId) => {
    return chatkitAPI.listThreads({ user: userId, limit: 10 });
  },
  
  getConversationHistory: async (threadId) => {
    const items = await chatkitAPI.listThreadItems(threadId, { limit: 50 });
    return items.data.map(item => ({
      id: item.id,
      type: item.type,
      content: item.content?.[0]?.text || '',
      timestamp: item.created_at
    }));
  }
};

// Service Containers pour Code Interpreter
export const containersAPI = {
  create: async (name, options = {}) => {
    const {
      expires_after = null,
      file_ids = [],
      memory_limit = '1g'
    } = options;
    
    return openaiRequest('/containers', {
      method: 'POST',
      body: JSON.stringify({
        name,
        expires_after,
        file_ids,
        memory_limit
      })
    });
  },

  list: async (options = {}) => {
    const { after, limit = 20, order = 'desc' } = options;
    const params = new URLSearchParams();
    if (after) params.append('after', after);
    params.append('limit', limit.toString());
    params.append('order', order);
    
    return openaiRequest(`/containers?${params}`);
  },

  get: async (containerId) => {
    return openaiRequest(`/containers/${containerId}`);
  },

  delete: async (containerId) => {
    return openaiRequest(`/containers/${containerId}`, {
      method: 'DELETE'
    });
  },

  // Utilitaires pour IAPosteManager
  createEmailAnalysisContainer: async (fileIds = []) => {
    return containersAPI.create('Email Analysis Container', {
      memory_limit: '2g',
      file_ids: fileIds,
      expires_after: {
        anchor: 'last_active_at',
        minutes: 30
      }
    });
  },

  waitForReady: async (containerId, maxWaitTime = 60000) => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const container = await containersAPI.get(containerId);
      
      if (container.status === 'running') {
        return container;
      } else if (container.status === 'failed') {
        throw new Error('Container failed to start');
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('Container startup timeout');
  }
};

// Service Container Files pour Code Interpreter
export const containerFilesAPI = {
  // Créer un fichier dans un conteneur
  createFile: async (containerId, file, fileId = null) => {
    const formData = new FormData();
    if (file) formData.append('file', file);
    if (fileId) formData.append('file_id', fileId);
    
    return fetch(`https://api.openai.com/v1/containers/${containerId}/files`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}` },
      body: formData
    }).then(r => r.json());
  },
  
  // Lister les fichiers d'un conteneur
  listFiles: async (containerId, options = {}) => {
    const { limit = 20, order = 'desc' } = options;
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('order', order);
    
    return fetch(`https://api.openai.com/v1/containers/${containerId}/files?${params}`, {
      headers: { 'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}` }
    }).then(r => r.json());
  },
  
  // Obtenir un fichier
  getFile: async (containerId, fileId) => {
    return fetch(`https://api.openai.com/v1/containers/${containerId}/files/${fileId}`, {
      headers: { 'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}` }
    }).then(r => r.json());
  },
  
  // Obtenir le contenu d'un fichier
  getFileContent: async (containerId, fileId) => {
    return fetch(`https://api.openai.com/v1/containers/${containerId}/files/${fileId}/content`, {
      headers: { 'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}` }
    }).then(r => r.blob());
  },
  
  // Supprimer un fichier
  deleteFile: async (containerId, fileId) => {
    return fetch(`https://api.openai.com/v1/containers/${containerId}/files/${fileId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}` }
    }).then(r => r.json());
  },
  
  // Utilitaires pour emails
  uploadEmailData: async (containerId, emailData, filename = 'email_data.json') => {
    const jsonContent = JSON.stringify(emailData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const file = new File([blob], filename, { type: 'application/json' });
    
    return containerFilesAPI.createFile(containerId, file);
  },
  
  getAnalysisResults: async (containerId, resultFileName = 'analysis_results.json') => {
    const files = await containerFilesAPI.listFiles(containerId);
    const resultFile = files.data.find(file => file.path.includes(resultFileName));
    
    if (!resultFile) throw new Error('Analysis results not found');
    
    const content = await containerFilesAPI.getFileContent(containerId, resultFile.id);
    const text = await content.text();
    
    return JSON.parse(text);
  }
};

// Service Client Secrets pour Realtime API
export const clientSecretsAPI = {
  create: async (options = {}) => {
    const {
      expires_after = {
        anchor: 'created_at',
        seconds: 600
      },
      session = {
        type: 'realtime',
        model: 'gpt-realtime',
        instructions: 'Vous êtes un assistant vocal professionnel pour la génération d\'emails.'
      }
    } = options;
    
    return openaiRequest('/realtime/client_secrets', {
      method: 'POST',
      body: JSON.stringify({
        expires_after,
        session
      })
    });
  },

  // Créer un secret pour assistant email vocal
  createEmailAssistantSecret: async (ttlSeconds = 1800) => {
    return clientSecretsAPI.create({
      expires_after: {
        anchor: 'created_at',
        seconds: ttlSeconds
      },
      session: {
        type: 'realtime',
        model: 'gpt-realtime',
        instructions: 'Vous êtes un assistant vocal spécialisé dans la rédaction d\'emails professionnels. Aidez l\'utilisateur à créer des emails efficaces.',
        output_modalities: ['audio'],
        audio: {
          input: {
            format: { type: 'audio/pcm', rate: 24000 },
            turn_detection: { type: 'server_vad' }
          },
          output: {
            format: { type: 'audio/pcm', rate: 24000 },
            voice: 'alloy',
            speed: 1.0
          }
        }
      }
    });
  },

  // Créer un secret pour transcription
  createTranscriptionSecret: async (ttlSeconds = 900) => {
    return clientSecretsAPI.create({
      expires_after: {
        anchor: 'created_at',
        seconds: ttlSeconds
      },
      session: {
        type: 'transcription',
        model: 'gpt-4o-transcribe',
        language: 'fr',
        response_format: 'json'
      }
    });
  }
};

// Service Realtime Events pour WebSocket
export const realtimeEventsAPI = {
  // Créer les événements client pour WebSocket
  createSessionUpdate: (sessionConfig) => ({
    type: 'session.update',
    session: sessionConfig
  }),

  createAudioAppend: (audioBase64, eventId = null) => ({
    type: 'input_audio_buffer.append',
    audio: audioBase64,
    ...(eventId && { event_id: eventId })
  }),

  createAudioCommit: (eventId = null) => ({
    type: 'input_audio_buffer.commit',
    ...(eventId && { event_id: eventId })
  }),

  createAudioClear: (eventId = null) => ({
    type: 'input_audio_buffer.clear',
    ...(eventId && { event_id: eventId })
  }),

  createConversationItem: (item, previousItemId = null, eventId = null) => ({
    type: 'conversation.item.create',
    item,
    ...(previousItemId && { previous_item_id: previousItemId }),
    ...(eventId && { event_id: eventId })
  }),

  createResponse: (responseConfig = {}, eventId = null) => ({
    type: 'response.create',
    ...(Object.keys(responseConfig).length > 0 && { response: responseConfig }),
    ...(eventId && { event_id: eventId })
  }),

  createResponseCancel: (responseId = null, eventId = null) => ({
    type: 'response.cancel',
    ...(responseId && { response_id: responseId }),
    ...(eventId && { event_id: eventId })
  }),

  createItemTruncate: (itemId, contentIndex, audioEndMs, eventId = null) => ({
    type: 'conversation.item.truncate',
    item_id: itemId,
    content_index: contentIndex,
    audio_end_ms: audioEndMs,
    ...(eventId && { event_id: eventId })
  }),

  createItemDelete: (itemId, eventId = null) => ({
    type: 'conversation.item.delete',
    item_id: itemId,
    ...(eventId && { event_id: eventId })
  }),

  createItemRetrieve: (itemId, eventId = null) => ({
    type: 'conversation.item.retrieve',
    item_id: itemId,
    ...(eventId && { event_id: eventId })
  }),

  createOutputAudioClear: (eventId = null) => ({
    type: 'output_audio_buffer.clear',
    ...(eventId && { event_id: eventId })
  }),

  // Utilitaires pour emails
  createEmailMessage: (text, role = 'user') => ({
    type: 'message',
    role,
    content: [{ type: 'input_text', text }]
  }),

  createEmailSessionConfig: (instructions = null) => ({
    type: 'realtime',
    instructions: instructions || 'Vous êtes un assistant email professionnel. Aidez à créer des emails efficaces.',
    output_modalities: ['text', 'audio'],
    tools: [{
      type: 'function',
      name: 'create_email_draft',
      description: 'Créer un brouillon d\'email',
      parameters: {
        type: 'object',
        properties: {
          subject: { type: 'string', description: 'Sujet de l\'email' },
          body: { type: 'string', description: 'Corps de l\'email' },
          tone: { type: 'string', enum: ['professional', 'casual', 'formal'] }
        },
        required: ['subject', 'body']
      }
    }]
  })
};

// Service Streaming Chat Completions
export const streamingChatAPI = {
  // Stream chat completion avec Server-Sent Events
  streamChatCompletion: async (messages, options = {}, callbacks = {}) => {
    const {
      onChunk = () => {},
      onComplete = () => {},
      onError = () => {}
    } = callbacks;
    
    const {
      model = 'gpt-4o',
      temperature = 0.7,
      max_tokens = 1000,
      stream_options = { include_usage: true }
    } = options;
    
    const response = await openaiRequest('/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens,
        stream: true,
        stream_options
      })
    });
    
    if (!response.body) {
      throw new Error('Streaming not supported');
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';
    let completionData = null;
    
    try {
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
            onComplete({ content: fullContent, completion: completionData });
            return { content: fullContent, completion: completionData };
          }
          
          try {
            const chunk = JSON.parse(data);
            const delta = chunk.choices?.[0]?.delta;
            
            if (delta?.content) {
              fullContent += delta.content;
              onChunk({ delta: delta.content, fullContent, chunk });
            }
            
            if (chunk.usage) {
              completionData = chunk;
            }
          } catch (parseError) {
            console.warn('Failed to parse chunk:', data);
          }
        }
      }
    } catch (error) {
      onError(error);
      throw error;
    } finally {
      reader.releaseLock();
    }
    
    return { content: fullContent, completion: completionData };
  },

  // Stream email generation
  streamEmailGeneration: async (prompt, options = {}) => {
    const emailMessages = [
      {
        role: 'system',
        content: 'Vous êtes un assistant expert en rédaction d\'emails professionnels. Générez des emails efficaces et bien structurés.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];
    
    return streamingChatAPI.streamChatCompletion(emailMessages, {
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 1500,
      ...options
    });
  },

  // Utilitaires pour parsing des chunks
  parseChunk: (chunkData) => {
    const chunk = JSON.parse(chunkData);
    
    return {
      id: chunk.id,
      model: chunk.model,
      created: chunk.created,
      choices: chunk.choices?.map(choice => ({
        index: choice.index,
        delta: choice.delta,
        finish_reason: choice.finish_reason
      })) || [],
      usage: chunk.usage,
      service_tier: chunk.service_tier
    };
  },

  // Accumuler le contenu des chunks
  accumulateContent: (chunks) => {
    return chunks
      .flatMap(chunk => chunk.choices || [])
      .filter(choice => choice.delta?.content)
      .map(choice => choice.delta.content)
      .join('');
  }
};

// API Calls pour contrôle WebRTC/SIP
export const callsAPI = {
  // Accepter un appel entrant
  acceptCall: async (callId, sessionConfig = {}) => {
    const defaultConfig = {
      type: 'realtime',
      model: 'gpt-realtime',
      instructions: 'Vous êtes un assistant email professionnel. Aidez les utilisateurs à créer et gérer leurs emails efficacement.',
      output_modalities: ['audio'],
      audio: {
        input: { format: { type: 'audio/pcm', rate: 24000 }, turn_detection: { type: 'server_vad' } },
        output: { format: { type: 'audio/pcm', rate: 24000 }, voice: 'alloy', speed: 1.0 }
      }
    };
    
    return openaiRequest(`/realtime/calls/${callId}/accept`, {
      method: 'POST',
      body: JSON.stringify({ ...defaultConfig, ...sessionConfig })
    });
  },
  
  // Rejeter un appel
  rejectCall: async (callId, statusCode = 603) => {
    return openaiRequest(`/realtime/calls/${callId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ status_code: statusCode })
    });
  },
  
  // Transférer un appel
  referCall: async (callId, targetUri) => {
    return openaiRequest(`/realtime/calls/${callId}/refer`, {
      method: 'POST',
      body: JSON.stringify({ target_uri: targetUri })
    });
  },
  
  // Raccrocher
  hangupCall: async (callId) => {
    return openaiRequest(`/realtime/calls/${callId}/hangup`, {
      method: 'POST'
    });
  },
  
  // Utilitaires pour emails
  acceptEmailAssistantCall: async (callId, language = 'fr') => {
    const instructions = {
      fr: 'Vous êtes Alex, un assistant email professionnel. Aidez les utilisateurs à créer, modifier et gérer leurs emails efficacement.',
      en: 'You are Alex, a professional email assistant. Help users create, edit, and manage their emails efficiently.'
    };
    
    return callsAPI.acceptCall(callId, {
      instructions: instructions[language] || instructions.fr,
      max_output_tokens: 1000,
      tools: [{
        type: 'function',
        name: 'create_email',
        description: 'Créer un brouillon d\'email',
        parameters: {
          type: 'object',
          properties: {
            subject: { type: 'string' },
            body: { type: 'string' },
            recipient: { type: 'string' }
          }
        }
      }]
    });
  },
  
  transferToAgent: async (callId, agentPhone) => {
    const targetUri = agentPhone.startsWith('sip:') ? agentPhone : `tel:${agentPhone}`;
    return callsAPI.referCall(callId, targetUri);
  }
};

// API Assistants pour gestion d'assistants IA
export const assistantsAPI = {
  // Créer un assistant
  create: async (config) => {
    const {
      model = 'gpt-4o',
      name,
      description,
      instructions,
      tools = [],
      tool_resources = {},
      metadata = {},
      temperature = 0.7
    } = config;
    
    return openaiRequest('/assistants', {
      method: 'POST',
      headers: { 'OpenAI-Beta': 'assistants=v2' },
      body: JSON.stringify({
        model, name, description, instructions, tools, tool_resources, metadata, temperature
      })
    });
  },
  
  // Lister les assistants
  list: async (options = {}) => {
    const { limit = 20, order = 'desc' } = options;
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('order', order);
    
    return openaiRequest(`/assistants?${params}`, {
      headers: { 'OpenAI-Beta': 'assistants=v2' }
    });
  },
  
  // Obtenir un assistant
  get: async (assistantId) => {
    return openaiRequest(`/assistants/${assistantId}`, {
      headers: { 'OpenAI-Beta': 'assistants=v2' }
    });
  },
  
  // Mettre à jour un assistant
  update: async (assistantId, updates) => {
    return openaiRequest(`/assistants/${assistantId}`, {
      method: 'POST',
      headers: { 'OpenAI-Beta': 'assistants=v2' },
      body: JSON.stringify(updates)
    });
  },
  
  // Supprimer un assistant
  delete: async (assistantId) => {
    return openaiRequest(`/assistants/${assistantId}`, {
      method: 'DELETE',
      headers: { 'OpenAI-Beta': 'assistants=v2' }
    });
  },
  
  // Utilitaires pour emails
  createEmailAssistant: async (name = 'Assistant Email', options = {}) => {
    const { language = 'fr', tone = 'professional', vectorStoreIds = [] } = options;
    
    const instructions = {
      fr: `Vous êtes un assistant email professionnel spécialisé dans la rédaction d'emails ${tone} en français.`,
      en: `You are a professional email assistant specialized in writing ${tone} emails in English.`
    };
    
    return assistantsAPI.create({
      name,
      description: `Assistant spécialisé dans la génération d'emails ${tone}`,
      instructions: instructions[language] || instructions.fr,
      tools: [{ type: 'file_search' }, { type: 'code_interpreter' }],
      tool_resources: {
        file_search: { vector_store_ids: vectorStoreIds }
      },
      metadata: {
        purpose: 'email_generation',
        language,
        tone,
        created_by: 'iapostemanager'
      }
    });
  },
  
  getByPurpose: async (purpose) => {
    const assistants = await assistantsAPI.list({ limit: 100 });
    return assistants.data.filter(assistant => assistant.metadata?.purpose === purpose);
  }
};

// API Threads pour gestion des conversations avec assistants
export const threadsAPI = {
  // Créer un thread
  create: async (options = {}) => {
    const {
      messages = [],
      metadata = {},
      tool_resources = {}
    } = options;
    
    return openaiRequest('/threads', {
      method: 'POST',
      headers: { 'OpenAI-Beta': 'assistants=v2' },
      body: JSON.stringify({ messages, metadata, tool_resources })
    });
  },
  
  // Obtenir un thread
  get: async (threadId) => {
    return openaiRequest(`/threads/${threadId}`, {
      headers: { 'OpenAI-Beta': 'assistants=v2' }
    });
  },
  
  // Modifier un thread
  update: async (threadId, updates) => {
    return openaiRequest(`/threads/${threadId}`, {
      method: 'POST',
      headers: { 'OpenAI-Beta': 'assistants=v2' },
      body: JSON.stringify(updates)
    });
  },
  
  // Supprimer un thread
  delete: async (threadId) => {
    return openaiRequest(`/threads/${threadId}`, {
      method: 'DELETE',
      headers: { 'OpenAI-Beta': 'assistants=v2' }
    });
  },
  
  // Utilitaires pour emails
  createEmailThread: async (initialMessage, options = {}) => {
    const { vectorStoreIds = [], fileIds = [] } = options;
    
    const messages = initialMessage ? [{
      role: 'user',
      content: initialMessage
    }] : [];
    
    return threadsAPI.create({
      messages,
      metadata: {
        purpose: 'email_generation',
        created_by: 'iapostemanager',
        ...options.metadata
      },
      tool_resources: {
        file_search: { vector_store_ids: vectorStoreIds },
        code_interpreter: { file_ids: fileIds }
      }
    });
  },
  
  updateMetadata: async (threadId, metadata) => {
    return threadsAPI.update(threadId, { metadata });
  }
};

// API Messages pour gestion des messages dans les threads
export const messagesAPI = {
  // Créer un message
  create: async (threadId, messageData) => {
    const {
      role,
      content,
      attachments = [],
      metadata = {}
    } = messageData;
    
    return openaiRequest(`/threads/${threadId}/messages`, {
      method: 'POST',
      headers: { 'OpenAI-Beta': 'assistants=v2' },
      body: JSON.stringify({ role, content, attachments, metadata })
    });
  },
  
  // Lister les messages
  list: async (threadId, options = {}) => {
    const {
      after = null,
      before = null,
      limit = 20,
      order = 'desc',
      run_id = null
    } = options;
    
    const params = new URLSearchParams();
    if (after) params.append('after', after);
    if (before) params.append('before', before);
    params.append('limit', limit.toString());
    params.append('order', order);
    if (run_id) params.append('run_id', run_id);
    
    return openaiRequest(`/threads/${threadId}/messages?${params}`, {
      headers: { 'OpenAI-Beta': 'assistants=v2' }
    });
  },
  
  // Obtenir un message
  get: async (threadId, messageId) => {
    return openaiRequest(`/threads/${threadId}/messages/${messageId}`, {
      headers: { 'OpenAI-Beta': 'assistants=v2' }
    });
  },
  
  // Modifier un message
  update: async (threadId, messageId, updates) => {
    return openaiRequest(`/threads/${threadId}/messages/${messageId}`, {
      method: 'POST',
      headers: { 'OpenAI-Beta': 'assistants=v2' },
      body: JSON.stringify(updates)
    });
  },
  
  // Supprimer un message
  delete: async (threadId, messageId) => {
    return openaiRequest(`/threads/${threadId}/messages/${messageId}`, {
      method: 'DELETE',
      headers: { 'OpenAI-Beta': 'assistants=v2' }
    });
  },
  
  // Utilitaires pour emails
  createUserMessage: async (threadId, content, attachments = []) => {
    return messagesAPI.create(threadId, {
      role: 'user',
      content,
      attachments,
      metadata: {
        message_type: 'email_request',
        created_by: 'iapostemanager'
      }
    });
  },
  
  createAssistantMessage: async (threadId, content) => {
    return messagesAPI.create(threadId, {
      role: 'assistant',
      content,
      metadata: {
        message_type: 'email_response',
        created_by: 'iapostemanager'
      }
    });
  },
  
  getConversationHistory: async (threadId, limit = 50) => {
    const messages = await messagesAPI.list(threadId, { limit, order: 'asc' });
    return messages.data.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content[0]?.text?.value || '',
      timestamp: msg.created_at,
      attachments: msg.attachments
    }));
  }
};

// API Runs pour exécution d'assistants sur threads
export const runsAPI = {
  // Créer un run
  create: async (threadId, config) => {
    const {
      assistant_id,
      model = null,
      instructions = null,
      additional_instructions = null,
      additional_messages = null,
      tools = null,
      metadata = {},
      temperature = null,
      top_p = null,
      max_completion_tokens = null,
      max_prompt_tokens = null,
      stream = false,
      tool_choice = 'auto',
      parallel_tool_calls = true,
      response_format = 'auto'
    } = config;
    
    return openaiRequest(`/threads/${threadId}/runs`, {
      method: 'POST',
      headers: { 'OpenAI-Beta': 'assistants=v2' },
      body: JSON.stringify({
        assistant_id, model, instructions, additional_instructions,
        additional_messages, tools, metadata, temperature, top_p,
        max_completion_tokens, max_prompt_tokens, stream,
        tool_choice, parallel_tool_calls, response_format
      })
    });
  },

  // Créer thread et run en une requête
  createThreadAndRun: async (config) => {
    const {
      assistant_id,
      thread = {},
      model = null,
      instructions = null,
      tools = null,
      metadata = {},
      temperature = null,
      stream = false
    } = config;
    
    return openaiRequest('/threads/runs', {
      method: 'POST',
      headers: { 'OpenAI-Beta': 'assistants=v2' },
      body: JSON.stringify({
        assistant_id, thread, model, instructions, tools,
        metadata, temperature, stream
      })
    });
  },

  // Lister les runs
  list: async (threadId, options = {}) => {
    const { after, before, limit = 20, order = 'desc' } = options;
    const params = new URLSearchParams();
    if (after) params.append('after', after);
    if (before) params.append('before', before);
    params.append('limit', limit.toString());
    params.append('order', order);
    
    return openaiRequest(`/threads/${threadId}/runs?${params}`, {
      headers: { 'OpenAI-Beta': 'assistants=v2' }
    });
  },

  // Obtenir un run
  get: async (threadId, runId) => {
    return openaiRequest(`/threads/${threadId}/runs/${runId}`, {
      headers: { 'OpenAI-Beta': 'assistants=v2' }
    });
  },

  // Modifier un run
  update: async (threadId, runId, metadata) => {
    return openaiRequest(`/threads/${threadId}/runs/${runId}`, {
      method: 'POST',
      headers: { 'OpenAI-Beta': 'assistants=v2' },
      body: JSON.stringify({ metadata })
    });
  },

  // Annuler un run
  cancel: async (threadId, runId) => {
    return openaiRequest(`/threads/${threadId}/runs/${runId}/cancel`, {
      method: 'POST',
      headers: { 'OpenAI-Beta': 'assistants=v2' }
    });
  },

  // Soumettre les sorties d'outils
  submitToolOutputs: async (threadId, runId, toolOutputs, stream = false) => {
    return openaiRequest(`/threads/${threadId}/runs/${runId}/submit_tool_outputs`, {
      method: 'POST',
      headers: { 'OpenAI-Beta': 'assistants=v2' },
      body: JSON.stringify({ tool_outputs: toolOutputs, stream })
    });
  },

  // Streaming run avec Server-Sent Events
  streamRun: async (threadId, config, callbacks = {}) => {
    const {
      onRunCreated = () => {},
      onRunInProgress = () => {},
      onRunCompleted = () => {},
      onMessageCreated = () => {},
      onMessageDelta = () => {},
      onMessageCompleted = () => {},
      onStepCreated = () => {},
      onStepDelta = () => {},
      onStepCompleted = () => {},
      onError = () => {},
      onDone = () => {}
    } = callbacks;
    
    const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({ ...config, stream: true })
    });
    
    if (!response.body) {
      throw new Error('Streaming not supported');
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let currentMessage = '';
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          if (line.startsWith('event: ')) {
            const eventType = line.slice(7);
            continue;
          }
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              onDone({ message: currentMessage });
              return { message: currentMessage };
            }
            
            try {
              const event = JSON.parse(data);
              
              switch (event.object) {
                case 'thread.run':
                  if (event.status === 'queued') onRunCreated(event);
                  else if (event.status === 'in_progress') onRunInProgress(event);
                  else if (event.status === 'completed') onRunCompleted(event);
                  break;
                  
                case 'thread.message':
                  if (event.status === 'in_progress') onMessageCreated(event);
                  else if (event.status === 'completed') onMessageCompleted(event);
                  break;
                  
                case 'thread.message.delta':
                  const delta = event.delta?.content?.[0]?.text?.value || '';
                  currentMessage += delta;
                  onMessageDelta({ delta, fullMessage: currentMessage, event });
                  break;
                  
                case 'thread.run.step':
                  if (event.status === 'in_progress') onStepCreated(event);
                  else if (event.status === 'completed') onStepCompleted(event);
                  break;
                  
                case 'thread.run.step.delta':
                  onStepDelta(event);
                  break;
                  
                case 'error':
                  onError(event);
                  throw new Error(event.message || 'Stream error');
              }
            } catch (parseError) {
              console.warn('Failed to parse stream event:', data);
            }
          }
        }
      }
    } catch (error) {
      onError(error);
      throw error;
    } finally {
      reader.releaseLock();
    }
    
    return { message: currentMessage };
  },

  // Streaming thread et run
  streamThreadAndRun: async (config, callbacks = {}) => {
    const response = await fetch('https://api.openai.com/v1/threads/runs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({ ...config, stream: true })
    });
    
    return runsAPI.handleStreamResponse(response, callbacks);
  },

  // Streaming tool outputs
  streamToolOutputs: async (threadId, runId, toolOutputs, callbacks = {}) => {
    const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}/submit_tool_outputs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({ tool_outputs: toolOutputs, stream: true })
    });
    
    return runsAPI.handleStreamResponse(response, callbacks);
  },

  // Gestionnaire de réponse streaming générique
  handleStreamResponse: async (response, callbacks) => {
    if (!response.body) {
      throw new Error('Streaming not supported');
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let currentMessage = '';
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              callbacks.onDone?.({ message: currentMessage });
              return { message: currentMessage };
            }
            
            try {
              const event = JSON.parse(data);
              
              if (event.object === 'thread.message.delta') {
                const delta = event.delta?.content?.[0]?.text?.value || '';
                currentMessage += delta;
                callbacks.onMessageDelta?.({ delta, fullMessage: currentMessage, event });
              } else {
                callbacks[`on${event.object?.replace(/\./g, '_')}`]?.(event);
              }
            } catch (parseError) {
              console.warn('Failed to parse stream event:', data);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
    
    return { message: currentMessage };
  },

  // Utilitaires streaming pour emails
  streamEmailGeneration: async (threadId, assistantId, prompt, callbacks = {}) => {
    const emailCallbacks = {
      onMessageDelta: ({ delta, fullMessage }) => {
        callbacks.onProgress?.({ delta, fullText: fullMessage });
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('assistant-email-delta', {
            detail: { delta, fullMessage }
          }));
        }
      },
      onRunCompleted: (run) => {
        callbacks.onComplete?.({ message: run, usage: run.usage });
      },
      onError: callbacks.onError || (() => {}),
      onDone: callbacks.onDone || (() => {})
    };
    
    return runsAPI.streamRun(threadId, {
      assistant_id: assistantId,
      additional_instructions: `Générez un email professionnel basé sur: ${prompt}`
    }, emailCallbacks);
  },

  // Utilitaires pour emails
  createEmailRun: async (threadId, assistantId, prompt, options = {}) => {
    const { tone = 'professional', language = 'fr' } = options;
    
    const instructions = {
      fr: `Générez un email ${tone} en français basé sur la demande de l'utilisateur.`,
      en: `Generate a ${tone} email in English based on the user's request.`
    };
    
    return runsAPI.create(threadId, {
      assistant_id: assistantId,
      additional_instructions: instructions[language] || instructions.fr,
      metadata: {
        purpose: 'email_generation',
        tone,
        language,
        created_by: 'iapostemanager'
      }
    });
  },

  createEmailThreadAndRun: async (assistantId, message, options = {}) => {
    const { tone = 'professional', language = 'fr' } = options;
    
    return runsAPI.createThreadAndRun({
      assistant_id: assistantId,
      thread: {
        messages: [{
          role: 'user',
          content: message
        }]
      },
      metadata: {
        purpose: 'email_generation',
        tone,
        language,
        created_by: 'iapostemanager'
      }
    });
  },

  handleToolCalls: async (threadId, runId, toolCalls) => {
    const toolOutputs = [];
    
    for (const toolCall of toolCalls) {
      if (toolCall.type === 'function') {
        const { name, arguments: args } = toolCall.function;
        
        // Gérer les appels d'outils spécifiques aux emails
        let output = '';
        switch (name) {
          case 'create_email_draft':
            const parsedArgs = JSON.parse(args);
            output = JSON.stringify({
              subject: parsedArgs.subject,
              body: parsedArgs.body,
              tone: parsedArgs.tone || 'professional'
            });
            break;
          default:
            output = 'Function not implemented';
        }
        
        toolOutputs.push({
          tool_call_id: toolCall.id,
          output
        });
      }
    }
    
    return runsAPI.submitToolOutputs(threadId, runId, toolOutputs);
  }
};

// Export global apiService pour les composants qui l'utilisent
export const apiService = {
  email: emailAPI,
  ai: aiAPI,
  voice: voiceAPI,
  video: videoAPI,
  emailVideo: emailVideoAPI,
  imageStreaming: imageStreamingAPI,
  evals: evalsAPI,
  emailEvals: emailEvalsAPI,
  graders: gradersAPI,
  advancedEvals: advancedEvalsAPI,
  accessibility: accessibilityAPI,
  auth: authAPI,
  config: configAPI,
  template: templateAPI,
  dashboard: dashboardAPI,
  conversation: conversationAPI,
  streaming: streamingAPI,
  webhook: webhookAPI,
  batch: batchAPI,
  uploads: uploadsAPI,
  moderations: moderationsAPI,
  vectorStores: vectorStoresAPI,
  chatkit: chatkitAPI,
  containers: containersAPI,
  containerFiles: containerFilesAPI,
  clientSecrets: clientSecretsAPI,
  realtimeEvents: realtimeEventsAPI,
  streamingChat: streamingChatAPI,
  assistants: assistantsAPI,
  threads: threadsAPI,
  messages: messagesAPI,
  runs: runsAPI,
  calls: callsAPI
};

// Export par défaut pour compatibilité
export default emailAPI;