import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

describe('useUnsavedChanges', () => {
  const initial = { name: 'A', enabled: true };

  it('démarre non-dirty avec un diff vide', () => {
    const { result } = renderHook(() => useUnsavedChanges(initial));
    expect(result.current.isDirty).toBe(false);
    expect(result.current.diff).toEqual({});
  });

  it('devient dirty et calcule le diff après modification', () => {
    const { result } = renderHook(() => useUnsavedChanges(initial));
    act(() => result.current.set('name', 'B'));
    expect(result.current.isDirty).toBe(true);
    expect(result.current.diff).toEqual({ name: 'B' });
    expect(result.current.values.name).toBe('B');
  });

  it('revient non-dirty si on remet la valeur initiale', () => {
    const { result } = renderHook(() => useUnsavedChanges(initial));
    act(() => result.current.set('name', 'B'));
    act(() => result.current.set('name', 'A'));
    expect(result.current.isDirty).toBe(false);
    expect(result.current.diff).toEqual({});
  });

  it('reset annule les modifications', () => {
    const { result } = renderHook(() => useUnsavedChanges(initial));
    act(() => result.current.set('name', 'B'));
    act(() => result.current.reset());
    expect(result.current.values.name).toBe('A');
    expect(result.current.isDirty).toBe(false);
  });

  it('commit fige un nouvel état initial', () => {
    const { result } = renderHook(() => useUnsavedChanges(initial));
    act(() => result.current.set('name', 'B'));
    act(() => result.current.commit({ name: 'B', enabled: true }));
    expect(result.current.isDirty).toBe(false);
    expect(result.current.initial.name).toBe('B');
  });

  it('setMany applique plusieurs champs', () => {
    const { result } = renderHook(() => useUnsavedChanges(initial));
    act(() => result.current.setMany({ name: 'C', enabled: false }));
    expect(result.current.diff).toEqual({ name: 'C', enabled: false });
  });
});
