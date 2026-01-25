/**
 * Tests pour les composants Card
 * Couverture: Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter
 */

import { render, screen } from '@testing-library/react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/Card';

describe('Card Components', () => {
  describe('Card', () => {
    it('devrait rendre une card de base', () => {
      render(<Card data-testid="card">Contenu</Card>);
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent('Contenu');
    });

    it('devrait avoir les classes de base', () => {
      render(<Card data-testid="card">Test</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('rounded-lg', 'border', 'shadow-sm');
    });

    it('devrait accepter des classes personnalisées', () => {
      render(<Card data-testid="card" className="custom-card">Test</Card>);
      expect(screen.getByTestId('card')).toHaveClass('custom-card');
    });

    it('devrait transmettre la ref', () => {
      const ref = { current: null } as React.RefObject<HTMLDivElement>;
      render(<Card ref={ref}>Ref Test</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardHeader', () => {
    it('devrait rendre le header', () => {
      render(<CardHeader data-testid="header">Header Content</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('p-6');
    });

    it('devrait avoir les styles de flexbox', () => {
      render(<CardHeader data-testid="header">Test</CardHeader>);
      expect(screen.getByTestId('header')).toHaveClass('flex', 'flex-col');
    });
  });

  describe('CardTitle', () => {
    it('devrait rendre un titre h3', () => {
      render(<CardTitle>Mon Titre</CardTitle>);
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Mon Titre');
    });

    it('devrait avoir les styles de titre', () => {
      render(<CardTitle data-testid="title">Titre</CardTitle>);
      expect(screen.getByTestId('title')).toHaveClass('text-2xl', 'font-semibold');
    });
  });

  describe('CardContent', () => {
    it('devrait rendre le contenu', () => {
      render(<CardContent data-testid="content">Le contenu ici</CardContent>);
      const content = screen.getByTestId('content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveTextContent('Le contenu ici');
    });

    it('devrait avoir le padding correct', () => {
      render(<CardContent data-testid="content">Test</CardContent>);
      expect(screen.getByTestId('content')).toHaveClass('p-6', 'pt-0');
    });
  });

  describe('CardDescription', () => {
    it('devrait rendre une description', () => {
      render(<CardDescription data-testid="desc">Description du card</CardDescription>);
      const desc = screen.getByTestId('desc');
      expect(desc).toBeInTheDocument();
      expect(desc).toHaveTextContent('Description du card');
    });

    it('devrait avoir le style muted', () => {
      render(<CardDescription data-testid="desc">Test</CardDescription>);
      expect(screen.getByTestId('desc')).toHaveClass('text-sm', 'text-muted-foreground');
    });
  });

  describe('CardFooter', () => {
    it('devrait rendre le footer', () => {
      render(<CardFooter data-testid="footer">Footer Content</CardFooter>);
      const footer = screen.getByTestId('footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveTextContent('Footer Content');
    });

    it('devrait avoir les styles de footer', () => {
      render(<CardFooter data-testid="footer">Test</CardFooter>);
      expect(screen.getByTestId('footer')).toHaveClass('flex', 'items-center', 'p-6');
    });
  });

  describe('Composition complète', () => {
    it('devrait rendre une card complète avec tous les sous-composants', () => {
      render(
        <Card data-testid="full-card">
          <CardHeader>
            <CardTitle>Titre de la Card</CardTitle>
            <CardDescription>Description courte</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Contenu principal de la card</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByTestId('full-card')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /titre de la card/i })).toBeInTheDocument();
      expect(screen.getByText('Description courte')).toBeInTheDocument();
      expect(screen.getByText('Contenu principal de la card')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
    });

    it('devrait permettre des cards interactives', () => {
      render(
        <Card data-testid="interactive" role="article">
          <CardHeader>
            <CardTitle>Dossier #123</CardTitle>
            <CardDescription>Client: Jean Dupont</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Statut: En cours</p>
            <p>Créé le: 01/01/2024</p>
          </CardContent>
          <CardFooter>
            <button>Voir détails</button>
            <button>Modifier</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByRole('article')).toBeInTheDocument();
      expect(screen.getByText('Dossier #123')).toBeInTheDocument();
      expect(screen.getByText('Client: Jean Dupont')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /voir détails/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /modifier/i })).toBeInTheDocument();
    });
  });

  describe('Accessibilité', () => {
    it('devrait permettre un role article', () => {
      render(<Card role="article">Contenu accessible</Card>);
      expect(screen.getByRole('article')).toBeInTheDocument();
    });

    it('devrait permettre aria-labelledby', () => {
      render(
        <Card aria-labelledby="card-title">
          <CardHeader>
            <CardTitle id="card-title">Titre Accessible</CardTitle>
          </CardHeader>
        </Card>
      );
      expect(screen.getByRole('heading')).toHaveAttribute('id', 'card-title');
    });
  });
});
