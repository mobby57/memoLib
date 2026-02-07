/**
 * Tests pour le composant Badge
 * Couverture: variants, sizes, rendu
 */

import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/Badge';

describe('Badge Component', () => {
  describe('Rendu de base', () => {
    it('devrait rendre un badge avec le contenu', () => {
      render(<Badge>Nouveau</Badge>);
      expect(screen.getByText('Nouveau')).toBeInTheDocument();
    });

    it('devrait être un span', () => {
      render(<Badge>Test</Badge>);
      const badge = screen.getByText('Test');
      expect(badge.tagName).toBe('SPAN');
    });

    it('devrait avoir la classe rounded-full', () => {
      render(<Badge>Badge</Badge>);
      expect(screen.getByText('Badge')).toHaveClass('rounded-full');
    });

    it('devrait avoir la classe inline-flex', () => {
      render(<Badge>Badge</Badge>);
      expect(screen.getByText('Badge')).toHaveClass('inline-flex', 'items-center');
    });
  });

  describe('Variants', () => {
    it('devrait rendre le variant default par défaut', () => {
      render(<Badge>Default</Badge>);
      const badge = screen.getByText('Default');
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
    });

    it('devrait rendre le variant success', () => {
      render(<Badge variant="success">Succès</Badge>);
      const badge = screen.getByText('Succès');
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('devrait rendre le variant warning', () => {
      render(<Badge variant="warning">Attention</Badge>);
      const badge = screen.getByText('Attention');
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('devrait rendre le variant danger', () => {
      render(<Badge variant="danger">Danger</Badge>);
      const badge = screen.getByText('Danger');
      expect(badge).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('devrait rendre le variant info', () => {
      render(<Badge variant="info">Info</Badge>);
      const badge = screen.getByText('Info');
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
    });
  });

  describe('Sizes', () => {
    it('devrait rendre la taille md par défaut', () => {
      render(<Badge>Medium</Badge>);
      const badge = screen.getByText('Medium');
      expect(badge).toHaveClass('px-2.5', 'py-1', 'text-sm');
    });

    it('devrait rendre la taille sm', () => {
      render(<Badge size="sm">Small</Badge>);
      const badge = screen.getByText('Small');
      expect(badge).toHaveClass('px-2', 'py-0.5', 'text-xs');
    });

    it('devrait rendre la taille lg', () => {
      render(<Badge size="lg">Large</Badge>);
      const badge = screen.getByText('Large');
      expect(badge).toHaveClass('px-3', 'py-1.5', 'text-base');
    });
  });

  describe('Combinaisons', () => {
    it('devrait combiner variant et size', () => {
      render(<Badge variant="success" size="sm">Petit Succès</Badge>);
      const badge = screen.getByText('Petit Succès');
      expect(badge).toHaveClass('bg-green-100', 'text-green-800', 'text-xs');
    });

    it('devrait avoir font-medium', () => {
      render(<Badge>Font Medium</Badge>);
      expect(screen.getByText('Font Medium')).toHaveClass('font-medium');
    });
  });

  describe('Contenu complexe', () => {
    it('devrait rendre avec une icône', () => {
      render(
        <Badge variant="success">
          <span data-testid="icon">?</span>
          Validé
        </Badge>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('Validé')).toBeInTheDocument();
    });

    it('devrait rendre un nombre', () => {
      render(<Badge variant="danger">99+</Badge>);
      expect(screen.getByText('99+')).toBeInTheDocument();
    });
  });

  describe('Dark mode classes', () => {
    it('devrait avoir les classes dark mode pour default', () => {
      render(<Badge>Dark Default</Badge>);
      const badge = screen.getByText('Dark Default');
      expect(badge).toHaveClass('dark:bg-gray-700', 'dark:text-gray-200');
    });

    it('devrait avoir les classes dark mode pour success', () => {
      render(<Badge variant="success">Dark Success</Badge>);
      const badge = screen.getByText('Dark Success');
      expect(badge).toHaveClass('dark:bg-green-900', 'dark:text-green-200');
    });

    it('devrait avoir les classes dark mode pour info', () => {
      render(<Badge variant="info">Dark Info</Badge>);
      const badge = screen.getByText('Dark Info');
      expect(badge).toHaveClass('dark:bg-blue-900', 'dark:text-blue-200');
    });
  });

  describe('Cas d\'utilisation réels', () => {
    it('devrait fonctionner pour un statut de dossier', () => {
      render(<Badge variant="warning" size="sm">En cours</Badge>);
      const badge = screen.getByText('En cours');
      expect(badge).toHaveClass('bg-yellow-100', 'text-xs');
    });

    it('devrait fonctionner pour un compteur de notifications', () => {
      render(<Badge variant="danger" size="sm">5</Badge>);
      const badge = screen.getByText('5');
      expect(badge).toHaveClass('bg-red-100');
    });

    it('devrait fonctionner pour un label de priorité', () => {
      render(<Badge variant="danger" size="lg">URGENT</Badge>);
      const badge = screen.getByText('URGENT');
      expect(badge).toHaveClass('bg-red-100', 'text-base');
    });
  });
});
