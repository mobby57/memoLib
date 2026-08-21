'use client';

/**
 * Widget Support Client — Crisp Chat
 * 
 * Intègre le chat Crisp pour le support client.
 * 
 * Configuration:
 * 1. Créer un compte sur https://crisp.chat (gratuit jusqu'à 2 agents)
 * 2. Copier le Website ID dans .env.local: NEXT_PUBLIC_CRISP_WEBSITE_ID=xxx
 * 3. Le widget apparaît automatiquement en bas à droite
 */

import { useEffect } from 'react';

declare global {
  interface Window {
    $crisp: any[];
    CRISP_WEBSITE_ID: string;
  }
}

export default function CrispChat() {
  useEffect(() => {
    const websiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
    
    if (!websiteId) {
      // Pas de Crisp configuré — mode silencieux
      return;
    }

    // Éviter double-initialisation
    if (window.$crisp) return;

    window.$crisp = [];
    window.CRISP_WEBSITE_ID = websiteId;

    const script = document.createElement('script');
    script.src = 'https://client.crisp.chat/l.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup si nécessaire
      try {
        document.head.removeChild(script);
      } catch {}
    };
  }, []);

  return null;
}
