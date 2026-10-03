'use client';

import { useState, useEffect } from 'react';
import { BREAKPOINTS, DEVICE_THRESHOLDS, type Breakpoint } from '@/config/breakpoints';

/**
 * useResponsive — détection responsive centralisée et SSR-safe.
 *
 * SSR-safe : au premier rendu serveur/hydratation, `width` vaut null et les
 * indicateurs prennent une valeur par défaut déterministe (desktop) pour éviter
 * les mismatches d'hydratation. La vraie valeur est appliquée après montage.
 *
 * Utiliser ce hook pour la logique de LAYOUT en JS (ex: rendre SplitPane vs
 * stack). Pour le style pur, préférer les classes Tailwind (md:, lg:…).
 */

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface UseResponsiveResult {
  /** Largeur de viewport en px, ou null avant montage (SSR). */
  width: number | null;
  device: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  /** true si le viewport est >= au breakpoint donné. */
  isAtLeast: (bp: Breakpoint) => boolean;
  /** true tant que le composant n'est pas monté côté client. */
  isHydrating: boolean;
}

function getDevice(width: number): DeviceType {
  if (width <= DEVICE_THRESHOLDS.mobileMax) return 'mobile';
  if (width <= DEVICE_THRESHOLDS.tabletMax) return 'tablet';
  return 'desktop';
}

export function useResponsive(): UseResponsiveResult {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    // Défini uniquement côté client.
    const update = () => setWidth(window.innerWidth);
    update();

    let frame = 0;
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const isHydrating = width === null;
  // Défaut déterministe avant montage : desktop (évite un flash mobile→desktop
  // sur les grands écrans, cas majoritaire d'une app métier).
  const effectiveWidth = width ?? BREAKPOINTS.lg;
  const device = getDevice(effectiveWidth);

  return {
    width,
    device,
    isMobile: device === 'mobile',
    isTablet: device === 'tablet',
    isDesktop: device === 'desktop',
    isAtLeast: (bp: Breakpoint) => effectiveWidth >= BREAKPOINTS[bp],
    isHydrating,
  };
}
