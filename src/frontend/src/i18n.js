// Configuration i18n simplifiée sans dépendances externes
const translations = {
  fr: {
    nav: {
      dashboard: "Tableau de bord",
      compose: "Composer",
      aiGenerator: "Générateur IA",
      voice: "Assistant vocal",
      templates: "Modèles",
      history: "Historique",
      contacts: "Contacts",
      settings: "Paramètres",
      accessibility: "Accessibilité"
    },
    common: {
      save: "Enregistrer",
      cancel: "Annuler",
      loading: "Chargement...",
      error: "Erreur",
      success: "Succès"
    }
  },
  en: {
    nav: {
      dashboard: "Dashboard",
      compose: "Compose",
      aiGenerator: "AI Generator",
      voice: "Voice Assistant",
      templates: "Templates",
      history: "History",
      contacts: "Contacts",
      settings: "Settings",
      accessibility: "Accessibility"
    },
    common: {
      save: "Save",
      cancel: "Cancel",
      loading: "Loading...",
      error: "Error",
      success: "Success"
    }
  }
};

// Simple i18n implementation
class SimpleI18n {
  constructor() {
    this.language = localStorage.getItem('language') || 'fr';
    this.translations = translations;
  }

  t(key) {
    const keys = key.split('.');
    let value = this.translations[this.language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  }

  changeLanguage(lang) {
    this.language = lang;
    localStorage.setItem('language', lang);
  }
}

const i18n = new SimpleI18n();

export default i18n;
export const useTranslation = () => ({ t: i18n.t.bind(i18n) });
