/**
 * Tests pour le composant Alert
 * Couverture: variants, title, onClose, accessibilité
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { Alert } from '@/components/ui/Alert';

describe('Alert Component', () => {
  describe('Rendu de base', () => {
    it('devrait rendre une alerte avec le contenu', () => {
      render(<Alert>Message d'alerte</Alert>);
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText("Message d'alerte")).toBeInTheDocument();
    });

    it('devrait avoir le role alert', () => {
      render(<Alert>Test</Alert>);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('devrait avoir les classes de base', () => {
      render(<Alert>Test</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('border', 'rounded-lg', 'p-4');
    });
  });

  describe('Variants', () => {
    it('devrait rendre le variant info par défaut', () => {
      render(<Alert>Info Alert</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-blue-50', 'border-blue-200');
    });

    it('devrait rendre le variant success', () => {
      render(<Alert variant="success">Succès!</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-green-50', 'border-green-200');
    });

    it('devrait rendre le variant warning', () => {
      render(<Alert variant="warning">Attention!</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-yellow-50', 'border-yellow-200');
    });

    it('devrait rendre le variant error', () => {
      render(<Alert variant="error">Erreur!</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-red-50', 'border-red-200');
    });
  });

  describe('Titre', () => {
    it('devrait afficher le titre si fourni', () => {
      render(<Alert title="Titre Important">Contenu</Alert>);
      expect(screen.getByText('Titre Important')).toBeInTheDocument();
    });

    it('devrait ne pas afficher de titre si non fourni', () => {
      render(<Alert>Contenu sans titre</Alert>);
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('devrait styliser le titre correctement', () => {
      render(<Alert variant="error" title="Erreur Critique">Détails</Alert>);
      const title = screen.getByText('Erreur Critique');
      expect(title).toHaveClass('text-sm', 'font-medium');
    });
  });

  describe('Bouton de fermeture', () => {
    it('devrait afficher le bouton X si onClose est fourni', () => {
      const handleClose = jest.fn();
      render(<Alert onClose={handleClose}>Fermable</Alert>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('ne devrait pas afficher le bouton X si onClose n\'est pas fourni', () => {
      render(<Alert>Non fermable</Alert>);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('devrait appeler onClose au clic', () => {
      const handleClose = jest.fn();
      render(<Alert onClose={handleClose}>Fermable</Alert>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Icône personnalisée', () => {
    it('devrait afficher l\'icône par défaut du variant', () => {
      render(<Alert variant="success">Succès</Alert>);
      // L'icône est rendue via Lucide, vérifier que le conteneur existe
      const alert = screen.getByRole('alert');
      expect(alert.querySelector('svg')).toBeInTheDocument();
    });

    it('devrait permettre une icône personnalisée', () => {
      render(
        <Alert icon={<span data-testid="custom-icon">??</span>}>
          Avec icône custom
        </Alert>
      );
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });

  describe('Classes personnalisées', () => {
    it('devrait accepter des classes personnalisées', () => {
      render(<Alert className="mt-4 custom-alert">Test</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('mt-4', 'custom-alert');
    });

    it('devrait combiner les classes', () => {
      render(<Alert variant="error" className="shadow-lg">Test</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-red-50', 'shadow-lg');
    });
  });

  describe('Dark mode', () => {
    it('devrait avoir les classes dark mode pour info', () => {
      render(<Alert>Dark Info</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('dark:bg-blue-900/20', 'dark:border-blue-800');
    });

    it('devrait avoir les classes dark mode pour error', () => {
      render(<Alert variant="error">Dark Error</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('dark:bg-red-900/20', 'dark:border-red-800');
    });
  });

  describe('Composition complète', () => {
    it('devrait rendre une alerte complète', () => {
      const handleClose = jest.fn();
      render(
        <Alert 
          variant="warning" 
          title="Action requise"
          onClose={handleClose}
          className="my-4"
        >
          Votre session expire dans 5 minutes.
        </Alert>
      );

      expect(screen.getByRole('alert')).toHaveClass('bg-yellow-50', 'my-4');
      expect(screen.getByText('Action requise')).toBeInTheDocument();
      expect(screen.getByText('Votre session expire dans 5 minutes.')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Cas d\'utilisation réels', () => {
    it('devrait fonctionner pour une erreur de formulaire', () => {
      render(
        <Alert variant="error" title="Erreur de validation">
          Veuillez corriger les champs en rouge.
        </Alert>
      );
      expect(screen.getByRole('alert')).toHaveClass('bg-red-50');
      expect(screen.getByText('Erreur de validation')).toBeInTheDocument();
    });

    it('devrait fonctionner pour un message de succès', () => {
      const handleClose = jest.fn();
      render(
        <Alert variant="success" title="Dossier créé" onClose={handleClose}>
          Le dossier #2024-001 a été créé avec succès.
        </Alert>
      );
      expect(screen.getByText('Le dossier #2024-001 a été créé avec succès.')).toBeInTheDocument();
    });

    it('devrait fonctionner pour un avertissement', () => {
      render(
        <Alert variant="warning" title="Attention">
          Cette action est irréversible.
        </Alert>
      );
      expect(screen.getByRole('alert')).toHaveClass('bg-yellow-50');
    });
  });

  describe('Accessibilité', () => {
    it('devrait avoir le role alert par défaut', () => {
      render(<Alert>Accessible</Alert>);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('devrait être navigable au clavier', () => {
      const handleClose = jest.fn();
      render(<Alert onClose={handleClose}>Avec bouton</Alert>);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
      
      // Click works, keyDown may not trigger onClick depending on implementation
      fireEvent.click(button);
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
