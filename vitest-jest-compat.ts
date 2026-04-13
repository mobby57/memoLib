import type { Plugin } from 'vite';

/**
 * Vite plugin that transforms jest.* calls to vi.* calls at compile time.
 * This enables Vitest's automatic hoisting of vi.mock() calls,
 * which doesn't work when called via the jest.mock() alias.
 */
export function jestToViPlugin(): Plugin {
  return {
    name: 'jest-to-vi',
    enforce: 'pre',
    transform(code, id) {
      if (!id.match(/\.(test|spec)\.(ts|tsx|js|jsx)$/)) return;
      if (!code.includes('jest.')) return;

      const transformed = code
        .replace(/\bjest\.mock\b/g, 'vi.mock')
        .replace(/\bjest\.fn\b/g, 'vi.fn')
        .replace(/\bjest\.spyOn\b/g, 'vi.spyOn')
        .replace(/\bjest\.clearAllMocks\b/g, 'vi.clearAllMocks')
        .replace(/\bjest\.resetAllMocks\b/g, 'vi.resetAllMocks')
        .replace(/\bjest\.restoreAllMocks\b/g, 'vi.restoreAllMocks')
        .replace(/\bjest\.resetModules\b/g, 'vi.resetModules')
        .replace(/\bjest\.useFakeTimers\b/g, 'vi.useFakeTimers')
        .replace(/\bjest\.useRealTimers\b/g, 'vi.useRealTimers')
        .replace(/\bjest\.advanceTimersByTime\b/g, 'vi.advanceTimersByTime')
        .replace(/\bjest\.runAllTimers\b/g, 'vi.runAllTimers');

      if (transformed !== code) {
        return { code: transformed, map: null };
      }
    },
  };
}
