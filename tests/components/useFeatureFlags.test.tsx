import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

/**
 * Tests de useFeatureFlags (jsdom). On mocke useSettings pour piloter la config
 * tenant et vérifier le fallback sécurisé.
 */

const settingsState: { data: any; isLoading: boolean; isError: boolean } = {
  data: undefined,
  isLoading: false,
  isError: false,
};

vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => settingsState,
}));

import { useFeatureFlags } from '@/hooks/useFeatureFlags';

beforeEach(() => {
  settingsState.data = undefined;
  settingsState.isLoading = false;
  settingsState.isError = false;
});

describe('useFeatureFlags', () => {
  it('reflète les flags du tenant quand la config est chargée', () => {
    settingsState.data = { ocrEnabled: true, aiEnabled: false };
    const { result } = renderHook(() => useFeatureFlags());
    expect(result.current.isEnabled('ocrEnabled')).toBe(true);
    expect(result.current.isEnabled('aiEnabled')).toBe(false);
  });

  it('fallback sécurisé pendant le chargement (ocr désactivé, ai activé)', () => {
    settingsState.data = undefined;
    settingsState.isLoading = true;
    const { result } = renderHook(() => useFeatureFlags());
    // ocr : défaut sûr = désactivé.
    expect(result.current.isEnabled('ocrEnabled')).toBe(false);
    // ai : défaut métier = activé (ne pas masquer l'IA au chargement).
    expect(result.current.isEnabled('aiEnabled')).toBe(true);
  });

  it('fallback sécurisé en cas d’erreur', () => {
    settingsState.data = undefined;
    settingsState.isError = true;
    const { result } = renderHook(() => useFeatureFlags());
    expect(result.current.isEnabled('ocrEnabled')).toBe(false);
  });
});
