/**
 * Hook de tracking d'abandon de workflow.
 *
 * Détecte automatiquement lorsqu'un utilisateur quitte
 * un formulaire multi-étapes sans le terminer.
 *
 * Usage :
 *   const { markStepStarted, markStepCompleted } = useWorkflowAbandonment({
 *     workflow: 'create_dossier',
 *     userId: session.user.id,
 *   })
 */

import { useEffect, useRef, useCallback } from 'react';
import { trackAbandonStep } from '@/lib/analytics/abandon-tracker';

type Options = {
  workflow: string;
  userId?: string;
  tenantId?: string;
};

type StepState = {
  name: string;
  startedAt: number;
  completed: boolean;
};

export function useWorkflowAbandonment({ workflow, userId, tenantId }: Options) {
  const stepsRef = useRef<Map<string, StepState>>(new Map());
  const activeStepRef = useRef<string | null>(null);

  /**
   * Marque le début d'une étape.
   * Si une étape précédente est en cours, elle est considérée comme abandonnée.
   */
  const markStepStarted = useCallback(
    (step: string) => {
      const prev = activeStepRef.current;

      // Si une étape précédente était en cours et n'est pas complétée → abandon
      if (prev && prev !== step) {
        const prevState = stepsRef.current.get(prev);
        if (prevState && !prevState.completed) {
          trackAbandonStep({
            workflow,
            step: prev,
            userId,
            tenantId,
            metadata: {
              duration_ms: Date.now() - prevState.startedAt,
              next_step: step,
            },
          });
        }
      }

      stepsRef.current.set(step, {
        name: step,
        startedAt: Date.now(),
        completed: false,
      });
      activeStepRef.current = step;
    },
    [workflow, userId, tenantId]
  );

  /**
   * Marque une étape comme complétée (pas d'abandon).
   */
  const markStepCompleted = useCallback((step: string) => {
    const state = stepsRef.current.get(step);
    if (state) {
      state.completed = true;
    }
    if (activeStepRef.current === step) {
      activeStepRef.current = null;
    }
  }, []);

  /**
   * Marque le workflow entier comme complété.
   */
  const markWorkflowCompleted = useCallback(() => {
    stepsRef.current.forEach((state) => {
      state.completed = true;
    });
    activeStepRef.current = null;
  }, []);

  // Détecte l'abandon lors du démontage du composant (navigation, fermeture)
  useEffect(() => {
    return () => {
      const step = activeStepRef.current;
      if (step) {
        const state = stepsRef.current.get(step);
        if (state && !state.completed) {
          trackAbandonStep({
            workflow,
            step,
            userId,
            tenantId,
            metadata: {
              duration_ms: Date.now() - state.startedAt,
              reason: 'component_unmount',
            },
          });
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflow, userId, tenantId]);

  // Détecte l'abandon via visibilitychange (changement d'onglet / mise en veille)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const step = activeStepRef.current;
        if (step) {
          const state = stepsRef.current.get(step);
          if (state && !state.completed) {
            trackAbandonStep({
              workflow,
              step,
              userId,
              tenantId,
              metadata: {
                duration_ms: Date.now() - state.startedAt,
                reason: 'tab_hidden',
              },
            });
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [workflow, userId, tenantId]);

  return { markStepStarted, markStepCompleted, markWorkflowCompleted };
}
