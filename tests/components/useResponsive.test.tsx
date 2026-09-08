import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResponsive } from '@/hooks/useResponsive';

/**
 * Tests de useResponsive (jsdom). On pilote window.innerWidth + resize.
 */

function setWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  window.dispatchEvent(new Event('resize'));
}

// jsdom n'implémente pas requestAnimationFrame de façon synchrone : on le stub.
const rafSpy = vi
  .spyOn(window, 'requestAnimationFrame')
  .mockImplementation((cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

afterEach(() => {
  rafSpy.mockClear();
});

describe('useResponsive', () => {
  it('détecte mobile (< 768)', () => {
    const { result } = renderHook(() => useResponsive());
    act(() => setWidth(500));
    expect(result.current.device).toBe('mobile');
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it('détecte tablette (768–1023)', () => {
    const { result } = renderHook(() => useResponsive());
    act(() => setWidth(800));
    expect(result.current.device).toBe('tablet');
    expect(result.current.isTablet).toBe(true);
  });

  it('détecte desktop (>= 1024)', () => {
    const { result } = renderHook(() => useResponsive());
    act(() => setWidth(1400));
    expect(result.current.device).toBe('desktop');
    expect(result.current.isDesktop).toBe(true);
  });

  it('isAtLeast compare au breakpoint', () => {
    const { result } = renderHook(() => useResponsive());
    act(() => setWidth(1300));
    expect(result.current.isAtLeast('lg')).toBe(true);
    expect(result.current.isAtLeast('2xl')).toBe(false);
  });

  it('expose une largeur après montage', () => {
    const { result } = renderHook(() => useResponsive());
    act(() => setWidth(1024));
    expect(result.current.width).toBe(1024);
    expect(result.current.isHydrating).toBe(false);
  });
});
