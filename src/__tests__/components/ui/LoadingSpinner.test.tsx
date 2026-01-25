/**
 * Tests pour le composant LoadingSpinner
 * Couverture: tailles, couleurs, accessibilité, skeleton
 */

import { render, screen } from '@testing-library/react';
import { LoadingSpinner, DashboardSkeleton } from '@/components/LoadingSpinner';

describe('LoadingSpinner Component', () => {
  describe('Rendu de base', () => {
    it('devrait rendre le spinner avec role status', () => {
      render(<LoadingSpinner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('devrait avoir le texte sr-only pour accessibilité', () => {
      render(<LoadingSpinner />);
      expect(screen.getByText('Chargement...')).toBeInTheDocument();
      expect(screen.getByText('Chargement...')).toHaveClass('sr-only');
    });

    it('devrait avoir aria-label', () => {
      render(<LoadingSpinner />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Chargement');
    });
  });

  describe('Sizes', () => {
    it('devrait rendre la taille md par défaut', () => {
      render(<LoadingSpinner />);
      const svg = screen.getByRole('status').querySelector('svg');
      expect(svg).toHaveClass('w-6', 'h-6');
    });

    it('devrait rendre la taille sm', () => {
      render(<LoadingSpinner size="sm" />);
      const svg = screen.getByRole('status').querySelector('svg');
      expect(svg).toHaveClass('w-4', 'h-4');
    });

    it('devrait rendre la taille lg', () => {
      render(<LoadingSpinner size="lg" />);
      const svg = screen.getByRole('status').querySelector('svg');
      expect(svg).toHaveClass('w-8', 'h-8');
    });
  });

  describe('Colors', () => {
    it('devrait rendre la couleur blue par défaut', () => {
      render(<LoadingSpinner />);
      const svg = screen.getByRole('status').querySelector('svg');
      expect(svg).toHaveClass('text-blue-600');
    });

    it('devrait rendre la couleur gray', () => {
      render(<LoadingSpinner color="gray" />);
      const svg = screen.getByRole('status').querySelector('svg');
      expect(svg).toHaveClass('text-gray-600');
    });

    it('devrait rendre la couleur white', () => {
      render(<LoadingSpinner color="white" />);
      const svg = screen.getByRole('status').querySelector('svg');
      expect(svg).toHaveClass('text-white');
    });
  });

  describe('Animation', () => {
    it('devrait avoir la classe animate-spin', () => {
      render(<LoadingSpinner />);
      const svg = screen.getByRole('status').querySelector('svg');
      expect(svg).toHaveClass('animate-spin');
    });

    it('devrait avoir la classe gpu-accelerated', () => {
      render(<LoadingSpinner />);
      const svg = screen.getByRole('status').querySelector('svg');
      expect(svg).toHaveClass('gpu-accelerated');
    });
  });

  describe('Classes personnalisées', () => {
    it('devrait accepter des classes personnalisées sur le conteneur', () => {
      render(<LoadingSpinner className="mt-4 mx-auto" />);
      expect(screen.getByRole('status')).toHaveClass('mt-4', 'mx-auto');
    });

    it('devrait avoir la classe inline-block', () => {
      render(<LoadingSpinner />);
      expect(screen.getByRole('status')).toHaveClass('inline-block');
    });
  });

  describe('Combinaisons', () => {
    it('devrait combiner taille et couleur', () => {
      render(<LoadingSpinner size="lg" color="gray" />);
      const svg = screen.getByRole('status').querySelector('svg');
      expect(svg).toHaveClass('w-8', 'h-8', 'text-gray-600');
    });

    it('devrait fonctionner avec toutes les options', () => {
      render(<LoadingSpinner size="sm" color="white" className="absolute top-0" />);
      const container = screen.getByRole('status');
      const svg = container.querySelector('svg');
      
      expect(container).toHaveClass('absolute', 'top-0');
      expect(svg).toHaveClass('w-4', 'h-4', 'text-white', 'animate-spin');
    });
  });
});

describe('DashboardSkeleton Component', () => {
  it('devrait rendre le skeleton du dashboard', () => {
    render(<DashboardSkeleton />);
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('devrait rendre 4 cartes de stats', () => {
    render(<DashboardSkeleton />);
    const gridItems = document.querySelectorAll('.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4 > div');
    expect(gridItems).toHaveLength(4);
  });

  it('devrait avoir l\'animation shimmer sur le header', () => {
    render(<DashboardSkeleton />);
    const header = document.querySelector('.h-32.mb-8');
    expect(header).toHaveClass('rounded-2xl');
  });

  it('devrait rendre la grille principale avec 2 colonnes', () => {
    render(<DashboardSkeleton />);
    const mainGrid = document.querySelector('.grid-cols-1.lg\\:grid-cols-3');
    expect(mainGrid).toBeInTheDocument();
  });

  it('devrait avoir des délais d\'animation décalés', () => {
    render(<DashboardSkeleton />);
    const cards = document.querySelectorAll('.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4 > div');
    
    cards.forEach((card, index) => {
      expect(card).toHaveStyle({ animationDelay: `${index * 0.1}s` });
    });
  });

  it('devrait avoir les bonnes classes de layout', () => {
    render(<DashboardSkeleton />);
    const container = document.querySelector('.max-w-7xl');
    expect(container).toHaveClass('mx-auto', 'animate-pulse');
  });
});
