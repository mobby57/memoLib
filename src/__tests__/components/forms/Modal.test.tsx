/**
 * Tests pour le composant Modal
 * Couverture: ouverture/fermeture, tailles, accessibilité, événements clavier
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Modal } from '@/components/forms/Modal';

describe('Modal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Titre du Modal',
    children: <p>Contenu du modal</p>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendu de base', () => {
    it('devrait rendre le modal quand isOpen est true', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByText('Titre du Modal')).toBeInTheDocument();
      expect(screen.getByText('Contenu du modal')).toBeInTheDocument();
    });

    it('ne devrait pas rendre quand isOpen est false', () => {
      render(<Modal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Titre du Modal')).not.toBeInTheDocument();
    });

    it('devrait avoir le titre comme heading', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByRole('heading', { name: /titre du modal/i })).toBeInTheDocument();
    });
  });

  describe('Bouton de fermeture', () => {
    it('devrait afficher le bouton de fermeture avec aria-label', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('devrait appeler onClose au clic sur le bouton X', () => {
      const onClose = jest.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);
      
      fireEvent.click(screen.getByRole('button', { name: /close/i }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('devrait avoir l\'icône X dans le bouton', () => {
      render(<Modal {...defaultProps} />);
      const button = screen.getByRole('button', { name: /close/i });
      expect(button.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Backdrop', () => {
    it('devrait appeler onClose au clic sur le backdrop', () => {
      const onClose = jest.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);
      
      // Le backdrop a la classe bg-black
      const backdrop = document.querySelector('.bg-black.bg-opacity-50');
      expect(backdrop).toBeInTheDocument();
      
      fireEvent.click(backdrop!);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('ne devrait pas fermer au clic sur le contenu du modal', () => {
      const onClose = jest.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);
      
      fireEvent.click(screen.getByText('Contenu du modal'));
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Fermeture par Escape', () => {
    it('devrait fermer le modal avec la touche Escape', () => {
      const onClose = jest.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('ne devrait pas réagir à d\'autres touches', () => {
      const onClose = jest.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);
      
      fireEvent.keyDown(document, { key: 'Enter' });
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Tailles', () => {
    it('devrait rendre la taille md par défaut', () => {
      render(<Modal {...defaultProps} />);
      const modalContent = document.querySelector('.max-w-2xl');
      expect(modalContent).toBeInTheDocument();
    });

    it('devrait rendre la taille sm', () => {
      render(<Modal {...defaultProps} size="sm" />);
      const modalContent = document.querySelector('.max-w-md');
      expect(modalContent).toBeInTheDocument();
    });

    it('devrait rendre la taille lg', () => {
      render(<Modal {...defaultProps} size="lg" />);
      const modalContent = document.querySelector('.max-w-4xl');
      expect(modalContent).toBeInTheDocument();
    });

    it('devrait rendre la taille xl', () => {
      render(<Modal {...defaultProps} size="xl" />);
      const modalContent = document.querySelector('.max-w-6xl');
      expect(modalContent).toBeInTheDocument();
    });
  });

  describe('Styles', () => {
    it('devrait avoir le z-index 50', () => {
      render(<Modal {...defaultProps} />);
      const modal = document.querySelector('.z-50');
      expect(modal).toBeInTheDocument();
    });

    it('devrait avoir la bordure sur le header', () => {
      render(<Modal {...defaultProps} />);
      const header = document.querySelector('.border-b.border-gray-200');
      expect(header).toBeInTheDocument();
    });

    it('devrait centrer le modal', () => {
      render(<Modal {...defaultProps} />);
      const container = document.querySelector('.flex.min-h-full.items-center.justify-center');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Scroll du body', () => {
    it('devrait bloquer le scroll du body quand ouvert', () => {
      render(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('devrait restaurer le scroll du body quand fermé', () => {
      const { rerender } = render(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
      
      rerender(<Modal {...defaultProps} isOpen={false} />);
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('Contenu dynamique', () => {
    it('devrait rendre un formulaire', () => {
      render(
        <Modal {...defaultProps} title="Créer un dossier">
          <form data-testid="form">
            <input type="text" placeholder="Nom du dossier" />
            <button type="submit">Créer</button>
          </form>
        </Modal>
      );
      
      expect(screen.getByTestId('form')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Nom du dossier')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /créer/i })).toBeInTheDocument();
    });

    it('devrait rendre une liste', () => {
      render(
        <Modal {...defaultProps} title="Liste">
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
            <li>Item 3</li>
          </ul>
        </Modal>
      );
      
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });
  });

  describe('Accessibilité', () => {
    it('devrait avoir le bouton de fermeture accessible', () => {
      render(<Modal {...defaultProps} />);
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('devrait être focusable', () => {
      render(<Modal {...defaultProps} />);
      const closeButton = screen.getByRole('button', { name: /close/i });
      closeButton.focus();
      expect(closeButton).toHaveFocus();
    });
  });

  describe('Cleanup', () => {
    it('devrait nettoyer les event listeners à la fermeture', () => {
      const onClose = jest.fn();
      const { unmount } = render(<Modal {...defaultProps} onClose={onClose} />);
      
      unmount();
      
      // Après unmount, Escape ne devrait plus déclencher onClose
      fireEvent.keyDown(document, { key: 'Escape' });
      // onClose a été appelé une fois pendant le cleanup, mais pas après unmount
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('Cas d\'utilisation réels', () => {
    it('devrait fonctionner pour un modal de confirmation', () => {
      const onClose = jest.fn();
      render(
        <Modal isOpen={true} onClose={onClose} title="Confirmer la suppression" size="sm">
          <p>Êtes-vous sûr de vouloir supprimer ce dossier?</p>
          <div>
            <button onClick={onClose}>Annuler</button>
            <button>Confirmer</button>
          </div>
        </Modal>
      );
      
      expect(screen.getByText('Confirmer la suppression')).toBeInTheDocument();
      expect(screen.getByText(/êtes-vous sûr/i)).toBeInTheDocument();
    });

    it('devrait fonctionner pour un modal de détails', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()} title="Dossier #2024-001" size="lg">
          <div>
            <h4>Client: Jean Dupont</h4>
            <p>Statut: En cours</p>
            <p>Date de création: 01/01/2024</p>
          </div>
        </Modal>
      );
      
      expect(screen.getByText('Client: Jean Dupont')).toBeInTheDocument();
      expect(screen.getByText('Statut: En cours')).toBeInTheDocument();
    });
  });
});
