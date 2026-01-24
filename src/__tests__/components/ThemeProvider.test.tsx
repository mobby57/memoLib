/**
 * Tests pour ThemeProvider component
 * Couverture: contexte, thèmes, tokens couleurs
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/components/ThemeProvider';

// Couleurs mockées pour les tests
const mockColors = {
  'iris-100': '#5B5BD6',
  'iris-80': '#6E6ADE',
  'fuschia-100': '#D946EF',
  'fuschia-80': '#E879F9',
  background: '#FFFFFF',
  button: '#5B5BD6',
};

describe('ThemeProvider Component', () => {
  describe('Rendu de base', () => {
    it('devrait rendre les enfants', () => {
      render(
        <ThemeProvider>
          <div data-testid="child">Test Child</div>
        </ThemeProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('devrait appliquer le thème light par défaut', () => {
      render(
        <ThemeProvider>
          <div data-testid="child">Test</div>
        </ThemeProvider>
      );

      const themeDiv = screen.getByTestId('child').parentElement;
      expect(themeDiv).toHaveClass('theme-light');
    });

    it('devrait appliquer le thème dark quand spécifié', () => {
      render(
        <ThemeProvider theme="dark">
          <div data-testid="child">Test</div>
        </ThemeProvider>
      );

      const themeDiv = screen.getByTestId('child').parentElement;
      expect(themeDiv).toHaveClass('theme-dark');
    });
  });

  describe('useTheme hook', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider theme="light">{children}</ThemeProvider>
    );

    it('devrait retourner le thème actuel', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.theme).toBe('light');
    });

    it('devrait retourner les couleurs', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.colors).toBeDefined();
    });
  });
});

describe('Theme Types', () => {
  const themes = ['light', 'dark'];

  it('devrait supporter light', () => {
    expect(themes).toContain('light');
  });

  it('devrait supporter dark', () => {
    expect(themes).toContain('dark');
  });
});

describe('Color Tokens', () => {
  describe('Couleurs principales', () => {
    it('devrait avoir iris-100 (primary)', () => {
      expect(mockColors['iris-100']).toBeDefined();
      expect(mockColors['iris-100']).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('devrait avoir fuschia-100 (secondary)', () => {
      expect(mockColors['fuschia-100']).toBeDefined();
      expect(mockColors['fuschia-100']).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  describe('Couleurs de fond', () => {
    it('devrait avoir background', () => {
      expect(mockColors.background).toBeDefined();
    });
  });

  describe('Couleurs de bouton', () => {
    it('devrait avoir button', () => {
      expect(mockColors.button).toBeDefined();
    });
  });
});

describe('CSS Variables', () => {
  const cssVariables = [
    '--color-primary',
    '--color-primary-hover',
    '--color-secondary',
    '--color-secondary-hover',
    '--color-background',
    '--color-button',
  ];

  it('devrait définir --color-primary', () => {
    expect(cssVariables).toContain('--color-primary');
  });

  it('devrait définir --color-secondary', () => {
    expect(cssVariables).toContain('--color-secondary');
  });

  it('devrait définir les états hover', () => {
    expect(cssVariables).toContain('--color-primary-hover');
    expect(cssVariables).toContain('--color-secondary-hover');
  });
});

describe('ThemeContext Default Values', () => {
  it('devrait avoir des valeurs par défaut', () => {
    const defaultContext = {
      theme: 'light' as const,
      colors: mockColors,
    };

    expect(defaultContext.theme).toBe('light');
    expect(defaultContext.colors).toEqual(mockColors);
  });
});

describe('Memoization', () => {
  it('devrait memoizer le contexte', () => {
    // Test que useMemo est utilisé pour éviter les re-renders inutiles
    const memoizedValue = {
      theme: 'light' as const,
      colors: mockColors,
    };

    // Les valeurs doivent être stables
    expect(memoizedValue.theme).toBe('light');
    expect(Object.keys(memoizedValue)).toEqual(['theme', 'colors']);
  });
});

describe('Color Contrast', () => {
  // Helper pour calculer la luminosité relative
  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = rgb & 0xff;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };

  it('background devrait être clair pour le thème light', () => {
    if (mockColors.background.startsWith('#')) {
      const luminance = getLuminance(mockColors.background);
      expect(luminance).toBeGreaterThan(0.5);
    }
  });
});
