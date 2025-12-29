import { authService } from './auth.js';

const API_BASE = '/api';

const secureApiRequest = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...authService.getAuthHeaders(),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      await authService.refreshAccessToken();
      return secureApiRequest(endpoint, options);
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const apiService = {
  get: (endpoint) => secureApiRequest(endpoint),
  post: (endpoint, data) => secureApiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  put: (endpoint, data) => secureApiRequest(endpoint, {
    method: 'PUT', 
    body: JSON.stringify(data)
  }),
  delete: (endpoint) => secureApiRequest(endpoint, { method: 'DELETE' }),

  // AI proxy (secure)
  ai: {
    generate: (prompt) => secureApiRequest('/proxy/openai/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }]
      })
    })
  },

  dashboard: {
    getStats: () => secureApiRequest('/dashboard/stats')
  },

  email: {
    send: (data) => secureApiRequest('/email/send', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getHistory: () => secureApiRequest('/email/history')
  }
};