// Services API pour communiquer avec le backend unifié

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Cache simple pour éviter les requêtes répétées
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Utilitaire pour les requêtes avec gestion d'erreurs et optimisations
const apiRequest = async (url, options = {}) => {
  const cacheKey = `${url}_${JSON.stringify(options)}`;
  const cached = cache.get(cacheKey);
  
  // Vérifier le cache pour les requêtes GET
  if (!options.method || options.method === 'GET') {
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }
  
  const controller = typeof window !== 'undefined' && typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 10000) : null; // 10s timeout
  
  try {
    const response = await fetch(url, {
      ...options,
      ...(controller && { signal: controller.signal }),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
    console.error('API Request failed:', error);
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
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

// Service IA avec cache intelligent
export const aiAPI = {
  generate: async (prompt, tone = 'professional') => {
    return apiRequest(`${API_BASE}/ai/generate`, {
      method: 'POST',
      body: JSON.stringify({ prompt, tone })
    });
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
  
  // Génération de contenu pour AIMultimodal
  generateContent: async (prompt, options = {}) => {
    const {
      tone = 'professional',
      type = 'email',
      context = ''
    } = options;
    
    return apiRequest(`${API_BASE}/generate-email`, {
      method: 'POST',
      body: JSON.stringify({ 
        context: prompt,
        tone,
        email_type: type
      })
    });
  }
};

// Service Vocal optimisé - REST endpoints au lieu de WebSocket
export const voiceAPI = {
  transcribe: async (audioData) => {
    return apiRequest(`${API_BASE}/voice/transcribe`, {
      method: 'POST',
      body: JSON.stringify(audioData)
    });
  },
  
  speak: async (text, options = {}) => {
    return apiRequest(`${API_BASE}/voice/speak`, {
      method: 'POST',
      body: JSON.stringify({ text, ...options })
    });
  },
  
  // Nouveaux endpoints REST pour remplacer WebSocket
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

// Utilitaires d'optimisation
export const batchAPI = {
  // Exécuter plusieurs requêtes en parallèle
  parallel: async (requests) => {
    return Promise.all(requests.map(req => apiRequest(req.url, req.options)));
  },
  
  // Précharger les données critiques
  preload: async () => {
    const criticalData = [
      { url: `${API_BASE}/config/settings`, options: {} },
      { url: `${API_BASE}/templates`, options: {} },
      { url: `${API_BASE}/dashboard/stats`, options: {} }
    ];
    
    try {
      await batchAPI.parallel(criticalData);
    } catch (error) {
      console.warn('Preload failed:', error);
    }
  },
  
  // Nettoyer le cache
  clearCache: () => {
    cache.clear();
  }
};

// Initialisation automatique
if (typeof window !== 'undefined') {
  // Précharger au chargement de la page
  window.addEventListener('load', () => {
    setTimeout(() => batchAPI.preload(), 100);
  });
  
  // Nettoyer le cache périodiquement
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        cache.delete(key);
      }
    }
  }, CACHE_TTL);
}

// Exports pour compatibilité avec les composants
export const authService = authAPI;
export const voiceService = voiceAPI;
export const accessibilityService = accessibilityAPI;
export const aiService = aiAPI;
export const emailService = emailAPI;

// Export global apiService pour les composants qui l'utilisent
export const apiService = {
  email: emailAPI,
  ai: aiAPI,
  voice: voiceAPI,
  accessibility: accessibilityAPI,
  auth: authAPI,
  config: configAPI,
  template: templateAPI,
  dashboard: dashboardAPI,
  batch: batchAPI
};

// Export par défaut pour compatibilité
export default emailAPI;