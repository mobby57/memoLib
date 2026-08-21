'use client';

import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook pour persister l'état d'un formulaire dans sessionStorage
 * et avertir l'utilisateur avant de quitter la page avec des données non sauvegardées.
 * 
 * @param key - Clé unique pour le sessionStorage
 * @param data - Les données du formulaire à persister
 * @param setData - Setter pour restaurer les données
 * @param options.warn - Afficher un avertissement avant de quitter (default: true)
 * @param options.isDirty - Le formulaire a-t-il été modifié ? (default: auto-detect)
 */
export function useFormPersistence<T extends Record<string, unknown>>(
  key: string,
  data: T,
  setData: (data: T) => void,
  options: {
    warn?: boolean;
    isDirty?: boolean;
    extraState?: Record<string, unknown>;
    setExtraState?: (state: Record<string, unknown>) => void;
  } = {}
) {
  const { warn = true, isDirty, extraState, setExtraState } = options;
  const initialDataRef = useRef<string>('');
  const restoredRef = useRef(false);

  // Restore on mount
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    try {
      const saved = sessionStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.data) {
          setData(parsed.data);
          initialDataRef.current = JSON.stringify(parsed.data);
        }
        if (parsed.extra && setExtraState) {
          setExtraState(parsed.extra);
        }
      } else {
        initialDataRef.current = JSON.stringify(data);
      }
    } catch {
      initialDataRef.current = JSON.stringify(data);
    }
   
  }, []);

  // Persist on change
  useEffect(() => {
    if (!restoredRef.current) return;
    try {
      const payload: Record<string, unknown> = { data };
      if (extraState) payload.extra = extraState;
      sessionStorage.setItem(key, JSON.stringify(payload));
    } catch {}
  }, [key, data, extraState]);

  // Warn before leaving
  useEffect(() => {
    if (!warn) return;

    const formIsDirty = isDirty ?? (JSON.stringify(data) !== initialDataRef.current);
    if (!formIsDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [warn, isDirty, data]);

  // Clear storage (call on successful submit)
  const clear = useCallback(() => {
    try {
      sessionStorage.removeItem(key);
    } catch {}
  }, [key]);

  return { clear };
}
