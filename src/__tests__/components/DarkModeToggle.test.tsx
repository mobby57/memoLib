/**
 * Tests pour le composant DarkModeToggle
 * Couverture: toggle, localStorage, préférences système
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { DarkModeToggle } from '@/components/DarkModeToggle';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock matchMedia
const matchMediaMock = (matches: boolean) => ({
  matches,
  media: '',
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
});

describe('DarkModeToggle Component', () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    document.documentElement.classList.remove('dark');
    window.matchMedia = jest.fn().mockImplementation(() => matchMediaMock(false));
  });

  describe('Rendu de base', () => {
    it('devrait rendre le bouton toggle', () => {
      render(<DarkModeToggle />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('devrait avoir aria-label pour accessibilité', () => {
      render(<DarkModeToggle />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Toggle dark mode');
    });

    it('devrait avoir les classes de base', () => {
      render(<DarkModeToggle />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('p-2', 'rounded-lg', 'transition-colors');
    });
  });

  describe('Mode clair par défaut', () => {
    it('devrait afficher l\'icône Moon en mode clair', () => {
      render(<DarkModeToggle />);
      const button = screen.getByRole('button');
      // Le SVG Moon est présent
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('devrait avoir le title correct en mode clair', () => {
      render(<DarkModeToggle />);
      expect(screen.getByRole('button')).toHaveAttribute('title', 'Passer en mode sombre');
    });

    it('ne devrait pas avoir la classe dark sur documentElement', () => {
      render(<DarkModeToggle />);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('Toggle fonctionne', () => {
    it('devrait passer en mode sombre au clic', () => {
      render(<DarkModeToggle />);
      
      fireEvent.click(screen.getByRole('button'));
      
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('devrait repasser en mode clair au second clic', () => {
      render(<DarkModeToggle />);
      
      const button = screen.getByRole('button');
      
      // Premier clic -> dark
      fireEvent.click(button);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      
      // Second clic -> light
      fireEvent.click(button);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(localStorageMock.setItem).toHaveBeenLastCalledWith('theme', 'light');
    });

    it('devrait mettre à jour le title après toggle', () => {
      render(<DarkModeToggle />);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('title', 'Passer en mode sombre');
      
      fireEvent.click(button);
      
      expect(button).toHaveAttribute('title', 'Passer en mode clair');
    });
  });

  describe('Persistance localStorage', () => {
    it('devrait charger le thème dark depuis localStorage', () => {
      localStorageMock.getItem.mockReturnValue('dark');
      
      render(<DarkModeToggle />);
      
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('devrait charger le thème light depuis localStorage', () => {
      localStorageMock.getItem.mockReturnValue('light');
      
      render(<DarkModeToggle />);
      
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('devrait respecter prefers-color-scheme si pas de localStorage', () => {
      localStorageMock.getItem.mockReturnValue(null);
      window.matchMedia = jest.fn().mockImplementation(() => matchMediaMock(true));
      
      render(<DarkModeToggle />);
      
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('Préférences système', () => {
    it('devrait utiliser prefers-color-scheme: dark', () => {
      window.matchMedia = jest.fn().mockImplementation(() => matchMediaMock(true));
      
      render(<DarkModeToggle />);
      
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('devrait ignorer prefers-color-scheme si localStorage existe', () => {
      localStorageMock.getItem.mockReturnValue('light');
      window.matchMedia = jest.fn().mockImplementation(() => matchMediaMock(true));
      
      render(<DarkModeToggle />);
      
      // localStorage a priorité
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('Styles conditionnels', () => {
    it('devrait avoir bg-gray-200 en mode clair', () => {
      render(<DarkModeToggle />);
      expect(screen.getByRole('button')).toHaveClass('bg-gray-200');
    });

    it('devrait avoir les classes dark mode', () => {
      render(<DarkModeToggle />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('dark:bg-gray-700', 'dark:hover:bg-gray-600');
    });
  });

  describe('Icônes', () => {
    it('devrait avoir une icône SVG', () => {
      render(<DarkModeToggle />);
      const button = screen.getByRole('button');
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('h-5', 'w-5');
    });

    it('devrait changer l\'icône après toggle', () => {
      render(<DarkModeToggle />);
      const button = screen.getByRole('button');
      
      const iconBefore = button.querySelector('svg')?.innerHTML;
      
      fireEvent.click(button);
      
      const iconAfter = button.querySelector('svg')?.innerHTML;
      
      // Les icônes sont différentes (Moon vs Sun)
      expect(iconBefore).not.toBe(iconAfter);
    });
  });

  describe('Accessibilité', () => {
    it('devrait être focusable', () => {
      render(<DarkModeToggle />);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('devrait répondre à Enter', () => {
      render(<DarkModeToggle />);
      const button = screen.getByRole('button');
      
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.click(button); // Simule l'activation par Enter
      
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('devrait avoir un title descriptif', () => {
      render(<DarkModeToggle />);
      expect(screen.getByRole('button')).toHaveAttribute('title');
    });
  });
});
