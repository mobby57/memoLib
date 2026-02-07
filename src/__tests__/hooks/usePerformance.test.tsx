/**
 * Tests pour hooks/usePerformance.ts
 * Tests des hooks de performance
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useDebounce,
  useThrottle,
} from '@/hooks/usePerformance';

// Mock timers for testing
jest.useFakeTimers();

describe('usePerformance Hooks', () => {

  // ============================================
  // useDebounce
  // ============================================
  describe('useDebounce', () => {
    afterEach(() => {
      jest.clearAllTimers();
    });

    test('retourne la valeur initiale immédiatement', () => {
      const { result } = renderHook(() => useDebounce('initial', 500));
      expect(result.current).toBe('initial');
    });

    test('ne change pas la valeur avant le délai', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      rerender({ value: 'updated', delay: 500 });

      // Avant le délai, la valeur ne change pas
      expect(result.current).toBe('initial');
    });

    test('change la valeur après le délai', async () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      rerender({ value: 'updated', delay: 500 });

      // Avancer le temps de 500ms
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe('updated');
    });

    test('reset le timer si la valeur change avant le délai', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      rerender({ value: 'first', delay: 500 });
      
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Encore la valeur initiale
      expect(result.current).toBe('initial');

      rerender({ value: 'second', delay: 500 });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Toujours la valeur initiale (timer resetté)
      expect(result.current).toBe('initial');

      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Maintenant la dernière valeur
      expect(result.current).toBe('second');
    });

    test('fonctionne avec différents types', () => {
      // Nombre
      const { result: numResult } = renderHook(() => useDebounce(42, 100));
      expect(numResult.current).toBe(42);

      // Objet
      const obj = { name: 'test' };
      const { result: objResult } = renderHook(() => useDebounce(obj, 100));
      expect(objResult.current).toEqual({ name: 'test' });

      // Tableau
      const arr = [1, 2, 3];
      const { result: arrResult } = renderHook(() => useDebounce(arr, 100));
      expect(arrResult.current).toEqual([1, 2, 3]);
    });

    test('délai 0 met à jour immédiatement', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 0 } }
      );

      rerender({ value: 'updated', delay: 0 });

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current).toBe('updated');
    });
  });

  // ============================================
  // useThrottle
  // ============================================
  describe('useThrottle', () => {
    let originalDateNow: () => number;
    let currentTime: number;

    beforeEach(() => {
      currentTime = 1000000;
      originalDateNow = Date.now;
      Date.now = jest.fn(() => currentTime);
    });

    afterEach(() => {
      Date.now = originalDateNow;
    });

    test('exécute le callback immédiatement au premier appel', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useThrottle(callback, 1000));

      act(() => {
        result.current();
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('ignore les appels dans la période de throttle', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useThrottle(callback, 1000));

      act(() => {
        result.current();
      });

      // Avance de 500ms (moins que le délai)
      currentTime += 500;

      act(() => {
        result.current();
        result.current();
      });

      // Seulement le premier appel est exécuté
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('exécute à nouveau après la période de throttle', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useThrottle(callback, 1000));

      act(() => {
        result.current();
      });

      expect(callback).toHaveBeenCalledTimes(1);

      // Avance de 1000ms (égal au délai)
      currentTime += 1000;

      act(() => {
        result.current();
      });

      expect(callback).toHaveBeenCalledTimes(2);
    });

    test('passe les arguments au callback', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useThrottle(callback, 0));

      act(() => {
        result.current('arg1', 'arg2');
      });

      expect(callback).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });
});
