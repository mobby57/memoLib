// Frontend moderne optimisé IAPosteManager 4.0
export default {
  // URLs
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3000',
  
  // Ports
  BACKEND_PORT: 8000,
  FRONTEND_PORT: 3000,
  
  // Features modernes activées
  FEATURES: {
    DARK_MODE: true,
    VOICE_COMMANDS: true,
    AI_ASSISTANT: true,
    EMAIL_PROVISIONING: true,
    REAL_TIME_COLLABORATION: false, // Futur
    OFFLINE_MODE: false, // Futur
    PWA: false, // Futur
  },
  
  // Performance
  PERFORMANCE: {
    LAZY_LOADING: true,
    CODE_SPLITTING: true,
    IMAGE_OPTIMIZATION: true,
    CACHE_ENABLED: true,
  },
  
  // Accessibilité
  ACCESSIBILITY: {
    SCREEN_READER: true,
    KEYBOARD_NAVIGATION: true,
    HIGH_CONTRAST: true,
    FONT_SCALING: true,
  },
  
  // Sécurité moderne
  SECURITY: {
    HTTPS_ONLY: process.env.NODE_ENV === 'production',
    CSRF_PROTECTION: true,
    XSS_PROTECTION: true,
    SECURE_HEADERS: true,
  },
  
  // API Timeout
  API_TIMEOUT: 30000,
  
  // Version
  VERSION: '4.0.0',
  BUILD_DATE: new Date().toISOString(),
};
