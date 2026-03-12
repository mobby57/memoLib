// Enregistrement du Service Worker pour MemoLib PWA
(function() {
  'use strict';

  // Vérifier si les Service Workers sont supportés
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers non supportés par ce navigateur');
    return;
  }

  // Enregistrer le Service Worker au chargement de la page
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('✅ Service Worker enregistré:', registration.scope);

      // Vérifier les mises à jour toutes les heures
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);

      // Gérer les mises à jour du Service Worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nouvelle version disponible
            if (confirm('Une nouvelle version de MemoLib est disponible. Recharger maintenant ?')) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          }
        });
      });

      // Recharger la page quand le nouveau SW prend le contrôle
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

    } catch (error) {
      console.error('❌ Erreur enregistrement Service Worker:', error);
    }
  });

  // Gestion de l'installation PWA
  let deferredPrompt;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Empêcher l'affichage automatique
    e.preventDefault();
    deferredPrompt = e;
    
    // Stocker l'événement pour utilisation ultérieure
    window.installPromptEvent = e;
    
    console.log('💡 PWA installable détectée');
  });

  // Fonction globale pour installer l'app
  window.installPWA = async function() {
    if (!deferredPrompt) {
      alert('L\'application est déjà installée ou l\'installation n\'est pas disponible.');
      return;
    }

    // Afficher le prompt d'installation
    deferredPrompt.prompt();

    // Attendre la réponse de l'utilisateur
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('✅ PWA installée');
    } else {
      console.log('❌ Installation PWA refusée');
    }

    // Réinitialiser le prompt
    deferredPrompt = null;
  };

  // Détecter si l'app est lancée en mode standalone
  window.addEventListener('DOMContentLoaded', () => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
                      || window.navigator.standalone 
                      || document.referrer.includes('android-app://');

    if (isStandalone) {
      console.log('🚀 Application lancée en mode PWA standalone');
      document.body.classList.add('pwa-standalone');
    }
  });

  // Gestion du mode offline
  window.addEventListener('online', () => {
    console.log('🌐 Connexion rétablie');
    document.body.classList.remove('offline');
    
    // Afficher une notification
    if (document.getElementById('statusDot')) {
      document.getElementById('statusDot').className = 'status-dot ok';
    }
  });

  window.addEventListener('offline', () => {
    console.log('📡 Mode hors ligne');
    document.body.classList.add('offline');
    
    // Afficher une notification
    if (document.getElementById('statusDot')) {
      document.getElementById('statusDot').className = 'status-dot err';
    }
  });

})();
