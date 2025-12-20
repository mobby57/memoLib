// API Service simplifié - Compatible tous navigateurs
const API_BASE = '/api';

// Utilitaire de requête simple et robuste
const apiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Services API simplifiés
export const emailAPI = {
  send: (emailData) => apiRequest(`${API_BASE}/send-email`, {
    method: 'POST',
    body: JSON.stringify(emailData)
  }),
  
  getHistory: (limit = 50) => apiRequest(`${API_BASE}/email-history?limit=${limit}`),
  
  sendBatch: (emails) => apiRequest(`${API_BASE}/email/send-batch`, {
    method: 'POST',
    body: JSON.stringify({ emails })
  })
};

export const aiAPI = {
  generate: (context, tone = 'professionnel') => apiRequest(`${API_BASE}/generate-email`, {
    method: 'POST',
    body: JSON.stringify({ context, tone })
  }),
  
  improveText: (text, options = {}) => apiRequest(`${API_BASE}/ai/improve-text`, {
    method: 'POST',
    body: JSON.stringify({ text, ...options })
  })
};

export const accessibilityAPI = {
  getSettings: () => apiRequest(`${API_BASE}/accessibility/settings`),
  
  updateSettings: (settings) => apiRequest(`${API_BASE}/accessibility/settings`, {
    method: 'POST',
    body: JSON.stringify(settings)
  }),
  
  speak: (text) => apiRequest(`${API_BASE}/accessibility/speak`, {
    method: 'POST',
    body: JSON.stringify({ text })
  }),
  
  getTranscripts: (limit = 10) => apiRequest(`${API_BASE}/accessibility/transcripts?limit=${limit}`)
};

export const dashboardAPI = {
  getStats: () => apiRequest(`${API_BASE}/dashboard/stats`)
};

export const templateAPI = {
  getAll: () => apiRequest(`${API_BASE}/templates`),
  
  create: (template) => apiRequest(`${API_BASE}/templates`, {
    method: 'POST',
    body: JSON.stringify(template)
  })
};

export const contactAPI = {
  getAll: () => apiRequest(`${API_BASE}/contacts`),
  
  create: (contact) => apiRequest(`${API_BASE}/contacts`, {
    method: 'POST',
    body: JSON.stringify(contact)
  }),
  
  delete: (id) => apiRequest(`${API_BASE}/contacts/${id}`, {
    method: 'DELETE'
  })
};

// Export par défaut
export default {
  email: emailAPI,
  ai: aiAPI,
  accessibility: accessibilityAPI,
  dashboard: dashboardAPI,
  template: templateAPI,
  contact: contactAPI
};