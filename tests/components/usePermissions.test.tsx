import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

/**
 * Tests de usePermissions (jsdom). On mocke useAuth pour piloter le rôle.
 */

const authState: { user: { role: string } | null; isLoading: boolean } = {
  user: null,
  isLoading: false,
};

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: authState.user,
    isLoading: authState.isLoading,
  }),
}));

import { usePermissions } from '@/hooks/usePermissions';
import { RBAC_PERMISSIONS } from '@/lib/auth/rbac-core';

beforeEach(() => {
  authState.user = null;
  authState.isLoading = false;
});

describe('usePermissions', () => {
  it('ADMIN peut écrire les settings', () => {
    authState.user = { role: 'ADMIN' };
    const { result } = renderHook(() => usePermissions());
    expect(result.current.can(RBAC_PERMISSIONS.SETTINGS_WRITE)).toBe(true);
    expect(result.current.cannot(RBAC_PERMISSIONS.SETTINGS_WRITE)).toBe(false);
  });

  it('STAGIAIRE ne peut pas écrire les settings mais peut lire', () => {
    authState.user = { role: 'STAGIAIRE' };
    const { result } = renderHook(() => usePermissions());
    expect(result.current.can(RBAC_PERMISSIONS.SETTINGS_READ)).toBe(true);
    expect(result.current.can(RBAC_PERMISSIONS.SETTINGS_WRITE)).toBe(false);
  });

  it('sans utilisateur, retombe sur client (pas de settings:write)', () => {
    authState.user = null;
    const { result } = renderHook(() => usePermissions());
    expect(result.current.can(RBAC_PERMISSIONS.SETTINGS_WRITE)).toBe(false);
  });

  it('canAny / canAll', () => {
    authState.user = { role: 'STAGIAIRE' };
    const { result } = renderHook(() => usePermissions());
    expect(
      result.current.canAny([RBAC_PERMISSIONS.SETTINGS_WRITE, RBAC_PERMISSIONS.SETTINGS_READ])
    ).toBe(true);
    expect(
      result.current.canAll([RBAC_PERMISSIONS.SETTINGS_WRITE, RBAC_PERMISSIONS.SETTINGS_READ])
    ).toBe(false);
  });
});
