'use client';

import { useEffect, useRef } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * Hook pour gérer l'expiration automatique de la session
 * - Déconnexion après 2h d'inactivité
 * - Avertissement 5 minutes avant expiration
 */
export function useSessionTimeout() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const TIMEOUT_DURATION = 2 * 60 * 60 * 1000; // 2 heures en ms
    const WARNING_BEFORE = 5 * 60 * 1000; // 5 minutes avant

    const resetTimer = () => {
      // Clear les timers existants
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);

      // Avertissement 5 minutes avant expiration
      warningRef.current = setTimeout(() => {
        const shouldStay = globalThis.confirm(
          '⏰ Votre session expire dans 5 minutes.\n\nCliquez OK pour rester connecté, Annuler pour vous déconnecter.'
        );
        
        if (shouldStay) {
          // Rafraîchir la session en rechargeant la page
          globalThis.location.reload();
        } else {
          handleLogout();
        }
      }, TIMEOUT_DURATION - WARNING_BEFORE);

      // Déconnexion automatique après 2h
      timeoutRef.current = setTimeout(() => {
        handleLogout();
      }, TIMEOUT_DURATION);
    };

    const handleLogout = async () => {
      await signOut({ 
        callbackUrl: '/auth/login?timeout=true',
        redirect: true 
      });
    };

    // Réinitialiser le timer sur toute activité utilisateur
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      globalThis.addEventListener(event, resetTimer);
    });

    // Démarrer le timer initial
    resetTimer();

    // Cleanup
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      events.forEach(event => {
        globalThis.removeEventListener(event, resetTimer);
      });
    };
  }, [status, router]);

  return { session, status };
}
