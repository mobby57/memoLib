/**
 * Tests pour src/lib/localStorage.ts - Import réel
 * Coverage: Helper localStorage SSR-safe
 */

import { safeLocalStorage } from '@/lib/localStorage';

describe('localStorage - Real Imports', () => {
  describe('safeLocalStorage object', () => {
    it('should be defined', () => {
      expect(safeLocalStorage).toBeDefined();
    });

    it('should have getItem method', () => {
      expect(typeof safeLocalStorage.getItem).toBe('function');
    });

    it('should have setItem method', () => {
      expect(typeof safeLocalStorage.setItem).toBe('function');
    });

    it('should have removeItem method', () => {
      expect(typeof safeLocalStorage.removeItem).toBe('function');
    });

    it('should have clear method', () => {
      expect(typeof safeLocalStorage.clear).toBe('function');
    });
  });

  describe('SSR safety (no window)', () => {
    it('getItem should return null in SSR', () => {
      const result = safeLocalStorage.getItem('test');
      expect(result).toBeNull();
    });

    it('setItem should not throw in SSR', () => {
      expect(() => safeLocalStorage.setItem('test', 'value')).not.toThrow();
    });

    it('removeItem should not throw in SSR', () => {
      expect(() => safeLocalStorage.removeItem('test')).not.toThrow();
    });

    it('clear should not throw in SSR', () => {
      expect(() => safeLocalStorage.clear()).not.toThrow();
    });
  });
});
