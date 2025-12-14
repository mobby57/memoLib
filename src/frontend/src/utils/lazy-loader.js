// Chargement paresseux des modules pour améliorer les performances

const moduleCache = new Map();

export const lazyLoad = {
  async emailAPI() {
    if (!moduleCache.has('emailAPI')) {
      const { emailAPI } = await import('../services/api.js');
      moduleCache.set('emailAPI', emailAPI);
    }
    return moduleCache.get('emailAPI');
  },

  async aiAPI() {
    if (!moduleCache.has('aiAPI')) {
      const { aiAPI } = await import('../services/api.js');
      moduleCache.set('aiAPI', aiAPI);
    }
    return moduleCache.get('aiAPI');
  }
};

export const preloadCritical = async () => {
  await Promise.all([
    lazyLoad.emailAPI(),
    lazyLoad.aiAPI()
  ]);
};