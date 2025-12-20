// Polyfill pour AbortController (compatibilité navigateurs anciens)

if (typeof window !== 'undefined' && typeof AbortController === 'undefined') {
  // Polyfill simple pour AbortController
  window.AbortController = class AbortController {
    constructor() {
      this.signal = {
        aborted: false,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {}
      };
    }
    
    abort() {
      this.signal.aborted = true;
    }
  };
}

// Export pour utilisation dans d'autres modules
export const ensureAbortController = () => {
  if (typeof AbortController === 'undefined') {
    return null; // Pas de support, utiliser timeout classique
  }
  return new AbortController();
};

// Utilitaire de requête avec timeout manuel si pas d'AbortController
export const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  const controller = ensureAbortController();
  
  if (controller) {
    // Utiliser AbortController si disponible
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } else {
    // Fallback avec Promise.race
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      )
    ]);
  }
};