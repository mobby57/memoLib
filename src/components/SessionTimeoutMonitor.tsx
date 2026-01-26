'use client';

/**
 * SessionTimeoutMonitor - Composant de securite pour gerer l'expiration de session
 * 
 * Fonctionnalites:
 * - Detecte l'inactivite de l'utilisateur (souris, clavier, scroll, touch)
 * - Affiche un avertissement 5 minutes avant l'expiration
 * - Deconnecte automatiquement apres 1 heure d'inactivite
 * - Permet a l'utilisateur de prolonger sa session
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Clock, AlertTriangle, LogOut, RefreshCw } from 'lucide-react';

// Configuration du timeout (en millisecondes)
const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 heure
const WARNING_BEFORE_TIMEOUT = 5 * 60 * 1000; // Avertissement 5 minutes avant
const CHECK_INTERVAL = 30 * 1000; // Verification toutes les 30 secondes

interface SessionTimeoutMonitorProps {
  /** Callback optionnel appele lors de la deconnexion */
  onTimeout?: () => void;
}

export function SessionTimeoutMonitor({ onTimeout }: SessionTimeoutMonitorProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(SESSION_TIMEOUT);
  const lastActivityRef = useRef<number>(Date.now());
  const warningShownRef = useRef(false);

  // Mettre a jour l'activite
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    // Si le warning etait affiche, le cacher car l'utilisateur est actif
    if (showWarning) {
      setShowWarning(false);
      warningShownRef.current = false;
    }
  }, [showWarning]);

  // Prolonger la session
  const extendSession = useCallback(async () => {
    updateActivity();
    setShowWarning(false);
    warningShownRef.current = false;
    
    // Rafraichir la session cote serveur
    try {
      await fetch('/api/auth/session', { method: 'GET' });
    } catch (error) {
      console.error('Erreur lors du rafraichissement de session:', error);
    }
  }, [updateActivity]);

  // Deconnexion forcee
  const handleTimeout = useCallback(async () => {
    if (onTimeout) {
      onTimeout();
    }
    
    await signOut({ redirect: false });
    router.push('/auth/login?timeout=true');
  }, [onTimeout, router]);

  // Detecter les evenements d'activite
  useEffect(() => {
    if (status !== 'authenticated') return;

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    // Throttle pour ne pas surcharger
    let throttleTimer: NodeJS.Timeout | null = null;
    const throttledUpdateActivity = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        updateActivity();
        throttleTimer = null;
      }, 1000); // Throttle de 1 seconde
    };

    events.forEach(event => {
      document.addEventListener(event, throttledUpdateActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledUpdateActivity);
      });
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
    };
  }, [status, updateActivity]);

  // Verifier l'inactivite
  useEffect(() => {
    if (status !== 'authenticated') return;

    const checkInactivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      const remaining = SESSION_TIMEOUT - timeSinceLastActivity;

      setTimeRemaining(Math.max(0, remaining));

      // Session expiree
      if (timeSinceLastActivity >= SESSION_TIMEOUT) {
        handleTimeout();
        return;
      }

      // Afficher l'avertissement
      if (timeSinceLastActivity >= SESSION_TIMEOUT - WARNING_BEFORE_TIMEOUT) {
        if (!warningShownRef.current) {
          setShowWarning(true);
          warningShownRef.current = true;
        }
      }
    };

    // Verifier immediatement puis periodiquement
    checkInactivity();
    const interval = setInterval(checkInactivity, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [status, handleTimeout]);

  // Formater le temps restant
  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Ne rien afficher si pas connecte ou pas d'avertissement
  if (status !== 'authenticated' || !showWarning) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-300">
        {/* Icone d'avertissement */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>

        {/* Titre */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
          Session bientot expiree
        </h2>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
          Pour des raisons de securite, votre session va expirer dans:
        </p>

        {/* Compteur */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Clock className="w-6 h-6 text-red-500" />
          <span className="text-3xl font-mono font-bold text-red-600 dark:text-red-400">
            {formatTime(timeRemaining)}
          </span>
        </div>

        {/* Message supplementaire */}
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
          Cliquez sur "Continuer" pour prolonger votre session ou vous serez automatiquement deconnecte.
        </p>

        {/* Boutons */}
        <div className="flex gap-3">
          <button
            onClick={handleTimeout}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            <LogOut className="w-4 h-4" />
            Se deconnecter
          </button>
          <button
            onClick={extendSession}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
}

export default SessionTimeoutMonitor;
