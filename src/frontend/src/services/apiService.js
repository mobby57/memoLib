import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Health check
  async checkHealth() {
    const response = await api.get('/health');
    return response.data;
  },

  // Email endpoints
  async sendEmail(emailData) {
    const response = await api.post('/api/emails/send', emailData);
    return response.data;
  },

  async getEmailHistory(limit = 50) {
    const response = await api.get(`/api/emails/history?limit=${limit}`);
    return response.data;
  },

  // AI endpoints
  async generateContent(prompt, context = null, style = 'professionnel') {
    const response = await api.post('/api/ai/generate', {
      prompt,
      context,
      style
    });
    return response.data;
  },

  async enhanceEmail(content, style = 'professionnel') {
    const response = await api.post('/api/ai/enhance', null, {
      params: { content, style }
    });
    return response.data;
  },

  async translateEmail(content, targetLanguage = 'français') {
    const response = await api.post('/api/ai/translate', null, {
      params: { content, target_language: targetLanguage }
    });
    return response.data;
  },

  async getAIModels() {
    const response = await api.get('/api/ai/models');
    return response.data;
  },

  // Voice endpoints
  async textToSpeech(text, saveFile = false) {
    const response = await api.post('/api/voice/tts', {
      text,
      save_file: saveFile
    });
    return response.data;
  },

  async speechToText(audioFile = null, timeout = 5) {
    const formData = new FormData();
    if (audioFile) {
      formData.append('audio_file', audioFile);
    }
    
    const response = await api.post(`/api/voice/stt?timeout=${timeout}`, 
      audioFile ? formData : null,
      {
        headers: audioFile ? { 'Content-Type': 'multipart/form-data' } : {}
      }
    );
    return response.data;
  },

  async startVoiceListening() {
    const response = await api.post('/api/voice/start-listening');
    return response.data;
  },

  async stopVoiceListening() {
    const response = await api.post('/api/voice/stop-listening');
    return response.data;
  },

  async getRecognizedText() {
    const response = await api.get('/api/voice/recognized');
    return response.data;
  },

  async getVoiceSettings() {
    const response = await api.get('/api/voice/settings');
    return response.data;
  },

  async updateVoiceSettings(settings) {
    const response = await api.post('/api/voice/settings', settings);
    return response.data;
  }
};

export const authService = {
  async login(credentials) {
    // Mock login - replace with real authentication
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockUser = {
          id: 1,
          name: 'Utilisateur Test',
          email: credentials.email
        };
        const mockToken = 'mock-jwt-token-' + Date.now();
        resolve({ user: mockUser, token: mockToken });
      }, 1000);
    });
  },

  async validateToken(token) {
    // Mock validation - replace with real token validation
    return new Promise((resolve) => {
      setTimeout(() => {
        if (token.startsWith('mock-jwt-token')) {
          resolve({
            id: 1,
            name: 'Utilisateur Test',
            email: 'test@example.com'
          });
        } else {
          resolve(null);
        }
      }, 500);
    });
  }
};

export default api;