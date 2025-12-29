/**
 * Configuration sécurisée pour IAPosteManager
 */

export const API_CONFIG = {
  BASE_URL: 'http://localhost:3001/api',
  BACKEND_URL: 'http://localhost:3001',
  OPENAI_BASE_URL: 'https://api.openai.com/v1',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3
};

export const SECURITY_CONFIG = {
  MAX_FILE_SIZE: 25 * 1024 * 1024,
  MAX_EMAIL_LENGTH: 50000,
  MAX_SUBJECT_LENGTH: 200,
  MAX_PROMPT_LENGTH: 10000,
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: 100,
    WINDOW_MS: 60000
  }
};

export const CACHE_CONFIG = {
  TTL: 5 * 60 * 1000,
  MAX_SIZE: 100
};

export const OPENAI_CONFIG = {
  MODELS: {
    CHAT: 'gpt-4o',
    EMBEDDING: 'text-embedding-3-small',
    TTS: 'tts-1',
    TRANSCRIPTION: 'whisper-1'
  },
  DEFAULTS: {
    TEMPERATURE: 0.7,
    MAX_TOKENS: 2000
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  return `http://localhost:3001${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
};

export default {
  API: API_CONFIG,
  SECURITY: SECURITY_CONFIG,
  CACHE: CACHE_CONFIG,
  OPENAI: OPENAI_CONFIG,
  getApiUrl
};