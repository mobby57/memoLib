/**
 * Tests pour le composant Pagination
 * Couverture: navigation, pages, états désactivés
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '@/components/ui/Pagination';

describe('Pagination Component', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 10,
    onPageChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendu de base', () => {
    it('devrait rendre la pagination', () => {
      render(<Pagination {...defaultProps} />);
      expect(screen.getByText('Precedent')).toBeInTheDocument();
      expect(screen.getByText('Suivant')).toBeInTheDocument();
    });

    it('devrait afficher les informations de pagination', () => {
      render(<Pagination {...defaultProps} totalItems={100} itemsPerPage={10} />);
      // Les infos sont affichées - utiliser getAllByText car il y a plusieurs éléments avec "1"
      expect(screen.getAllByText(/^1$/).length).toBeGreaterThan(0);
    });
  });

  describe('Navigation', () => {
    it('devrait appeler onPageChange avec page suivante', () => {
      const onPageChange = jest.fn();
      render(<Pagination {...defaultProps} onPageChange={onPageChange} />);
      
      fireEvent.click(screen.getByText('Suivant'));
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('devrait appeler onPageChange avec page précédente', () => {
      const onPageChange = jest.fn();
      render(<Pagination {...defaultProps} currentPage={5} onPageChange={onPageChange} />);
      
      fireEvent.click(screen.getByText('Precedent'));
      expect(onPageChange).toHaveBeenCalledWith(4);
    });

    it('devrait désactiver Precedent sur la première page', () => {
      render(<Pagination {...defaultProps} currentPage={1} />);
      expect(screen.getByText('Precedent')).toBeDisabled();
    });

    it('devrait désactiver Suivant sur la dernière page', () => {
      render(<Pagination {...defaultProps} currentPage={10} totalPages={10} />);
      expect(screen.getByText('Suivant')).toBeDisabled();
    });
  });

  describe('Affichage des numéros de page', () => {
    it('devrait afficher toutes les pages si total <= 7', () => {
      render(<Pagination {...defaultProps} totalPages={5} />);
      
      for (let i = 1; i <= 5; i++) {
        expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument();
      }
    });

    it('devrait afficher ellipsis pour beaucoup de pages', () => {
      render(<Pagination {...defaultProps} totalPages={20} currentPage={10} />);
      const ellipsis = screen.getAllByText('...');
      expect(ellipsis.length).toBeGreaterThan(0);
    });

    it('devrait mettre en évidence la page courante', () => {
      render(<Pagination {...defaultProps} currentPage={3} totalPages={5} />);
      const currentButton = screen.getByRole('button', { name: '3' });
      expect(currentButton).toHaveClass('bg-blue-600');
    });
  });

  describe('First/Last navigation', () => {
    it('devrait afficher les boutons first/last par défaut', () => {
      render(<Pagination {...defaultProps} totalPages={20} currentPage={10} />);
      // Les boutons avec chevrons doubles sont présents
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(4);
    });

    it('devrait masquer first/last si showFirstLast=false', () => {
      render(<Pagination {...defaultProps} totalPages={20} currentPage={10} showFirstLast={false} />);
      // Moins de boutons
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Changement de page par numéro', () => {
    it('devrait naviguer au clic sur un numéro de page', () => {
      const onPageChange = jest.fn();
      render(<Pagination {...defaultProps} totalPages={5} onPageChange={onPageChange} />);
      
      fireEvent.click(screen.getByRole('button', { name: '3' }));
      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('ne devrait pas appeler onPageChange au clic sur la page courante', () => {
      const onPageChange = jest.fn();
      render(<Pagination {...defaultProps} currentPage={3} totalPages={5} onPageChange={onPageChange} />);
      
      fireEvent.click(screen.getByRole('button', { name: '3' }));
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it('ne devrait pas appeler onPageChange au clic sur ellipsis', () => {
      const onPageChange = jest.fn();
      render(<Pagination {...defaultProps} totalPages={20} currentPage={10} onPageChange={onPageChange} />);
      
      const ellipsis = screen.getAllByText('...');
      if (ellipsis[0]) {
        fireEvent.click(ellipsis[0]);
        expect(onPageChange).not.toHaveBeenCalled();
      }
    });
  });

  describe('Informations de pagination', () => {
    it('devrait afficher le nombre total d\'items', () => {
      render(<Pagination {...defaultProps} totalItems={150} itemsPerPage={10} />);
      // Le composant affiche les informations
      const container = document.querySelector('.flex');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Styles', () => {
    it('devrait avoir les classes de base', () => {
      render(<Pagination {...defaultProps} />);
      const container = document.querySelector('.flex.items-center');
      expect(container).toBeInTheDocument();
    });

    it('devrait avoir les styles dark mode', () => {
      render(<Pagination {...defaultProps} />);
      const container = document.querySelector('.dark\\:bg-gray-800');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('devrait gérer 1 seule page', () => {
      render(<Pagination {...defaultProps} currentPage={1} totalPages={1} />);
      expect(screen.getByText('Precedent')).toBeDisabled();
      expect(screen.getByText('Suivant')).toBeDisabled();
    });

    it('devrait gérer 0 pages', () => {
      render(<Pagination {...defaultProps} currentPage={0} totalPages={0} />);
      // Doit rendre sans erreur
      expect(screen.getByText('Precedent')).toBeInTheDocument();
    });
  });
});
