'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * useUnsavedChanges — gestion générique de l'état "dirty" d'un formulaire.
 *
 * Compare des valeurs courantes à des valeurs initiales, expose `isDirty`,
 * et installe un garde `beforeunload` pour prévenir la perte de modifications
 * lors d'une fermeture d'onglet / rechargement.
 *
 * Usage :
 *   const form = useUnsavedChanges(initialValues);
 *   form.set('cabinetName', 'X');
 *   if (form.isDirty) { ... }
 *   await save(form.diff); form.commit(newValues);
 */

function shallowEqual<T extends Record<string, unknown>>(a: T, b: T): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if (!Object.is(a[k], b[k])) return false;
  }
  return true;
}

export interface UseUnsavedChangesResult<T extends Record<string, unknown>> {
  values: T;
  initial: T;
  isDirty: boolean;
  /** Sous-ensemble des champs modifiés (à envoyer en PATCH). */
  diff: Partial<T>;
  set: <K extends keyof T>(key: K, value: T[K]) => void;
  setMany: (patch: Partial<T>) => void;
  /** Annule les modifications (revient aux valeurs initiales). */
  reset: () => void;
  /** Fige un nouvel état initial (après une sauvegarde réussie). */
  commit: (next: T) => void;
}

export function useUnsavedChanges<T extends Record<string, unknown>>(
  initialValues: T
): UseUnsavedChangesResult<T> {
  const [initial, setInitial] = useState<T>(initialValues);
  const [values, setValues] = useState<T>(initialValues);

  const diff = useMemo(() => {
    const out: Partial<T> = {};
    for (const key of Object.keys(values) as (keyof T)[]) {
      if (!Object.is(values[key], initial[key])) {
        out[key] = values[key];
      }
    }
    return out;
  }, [values, initial]);

  const isDirty = useMemo(() => !shallowEqual(values, initial), [values, initial]);

  const set = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setMany = useCallback((patch: Partial<T>) => {
    setValues((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setValues(initial);
  }, [initial]);

  const commit = useCallback((next: T) => {
    setInitial(next);
    setValues(next);
  }, []);

  // Garde navigateur : prévient la perte de modifications non enregistrées.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  return { values, initial, isDirty, diff, set, setMany, reset, commit };
}
