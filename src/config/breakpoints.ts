/**
 * Breakpoints centralisés — alignés sur les valeurs par défaut de Tailwind.
 * Source unique de vérité pour la logique responsive JS (useResponsive) afin
 * d'éviter les magic numbers dispersés.
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/** Seuils sémantiques pour les layouts (mobile / tablette / desktop). */
export const DEVICE_THRESHOLDS = {
  /** < md : mobile */
  mobileMax: BREAKPOINTS.md - 1,
  /** md .. lg-1 : tablette */
  tabletMin: BREAKPOINTS.md,
  tabletMax: BREAKPOINTS.lg - 1,
  /** >= lg : desktop */
  desktopMin: BREAKPOINTS.lg,
} as const;
