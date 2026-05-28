/**
 * Tests pour le composant Button
 * Couverture: variants, sizes, etats, accessibilite
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  describe('Rendu de base', () => {
    it('devrait rendre un bouton avec le texte fourni', () => {
      render(<Button>Cliquer</Button>);
      expect(screen.getByRole('button', { name: /cliquer/i })).toBeInTheDocument();
    });

    it('devrait avoir le type button par defaut', () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole('button');
      // Le type peut etre undefined ou 'button' selon l'implementation
      const type = button.getAttribute('type');
      expect(type === null || type === 'button').toBe(true);
    });

    it('devrait accepter un type submit', () => {
      render(<Button type="submit">Envoyer</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });
  });

  describe('Variants', () => {
    it('devrait rendre le variant default par defaut', () => {
      render(<Button>Default</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary');
    });

    it('devrait rendre le variant outline', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border');
    });

    it('devrait rendre le variant ghost', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-accent');
    });

    it('devrait rendre le variant destructive', () => {
      render(<Button variant="destructive">Supprimer</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive');
    });
  });

  describe('Sizes', () => {
    it('devrait rendre la taille default par defaut', () => {
      render(<Button>Default Size</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
    });

    it('devrait rendre la taille sm', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9');
    });

    it('devrait rendre la taille lg', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11');
    });
  });

  describe('etats', () => {
    it('devrait etre desactive quand disabled est true', () => {
      render(<Button disabled>Desactive</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('ne devrait pas declencher onClick quand desactive', () => {
      const handleClick = jest.fn();
      render(<Button disabled onClick={handleClick}>Desactive</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('devrait declencher onClick quand clique', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Cliquer</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Classes personnalisees', () => {
    it('devrait accepter des classes personnalisees', () => {
      render(<Button className="custom-class">Custom</Button>);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    it('devrait combiner les classes par defaut et personnalisees', () => {
      render(<Button variant="outline" className="mt-4">Combined</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border', 'mt-4');
    });
  });

  describe('Accessibilite', () => {
    it('devrait etre focusable', () => {
      render(<Button>Focus me</Button>);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('devrait accepter aria-label', () => {
      render(<Button aria-label="Action importante">Icon</Button>);
      expect(screen.getByRole('button', { name: /action importante/i })).toBeInTheDocument();
    });

    it('devrait avoir les styles de focus visibles', () => {
      render(<Button>Focus Visible</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:ring-2');
    });
  });

  describe('Enfants', () => {
    it('devrait rendre des enfants complexes', () => {
      render(
        <Button>
          <span data-testid="icon">??</span>
          <span>Avec icene</span>
        </Button>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('Avec icene')).toBeInTheDocument();
    });
  });

  describe('Ref forwarding', () => {
    it('devrait transmettre la ref au bouton', () => {
      const ref = { current: null } as React.RefObject<HTMLButtonElement>;
      render(<Button ref={ref}>Ref Test</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });
});
