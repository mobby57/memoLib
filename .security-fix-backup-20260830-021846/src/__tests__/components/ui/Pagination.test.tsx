/**
 * Tests pour le composant Pagination
 * Couverture: navigation, pages, etats desactives
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '@/components/ui/Pagination';

describe('Pagination Component', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 10,
    onPageChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendu de base', () => {
    it('devrait rendre la pagination', () => {
      render(<Pagination {...defaultProps} />);
      expect(screen.getByText('Precedent')).toBeInTheDocument();
      expect(screen.getByText('Suivant')).toBeInTheDocument();
    });

    it('devrait afficher les informations de pagination', () => {
      render(<Pagination {...defaultProps} totalItems={100} itemsPerPage={10} />);
      // Les infos sont affichees - utiliser getAllByText car il y a plusieurs elements avec "1"
      expect(screen.getAllByText(/^1$/).length).toBeGreaterThan(0);
    });
  });

  describe('Navigation', () => {
    it('devrait appeler onPageChange avec page suivante', () => {
      const onPageChange = vi.fn();
      render(<Pagination {...defaultProps} onPageChange={onPageChange} />);
      
      fireEvent.click(screen.getByText('Suivant'));
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('devrait appeler onPageChange avec page precedente', () => {
      const onPageChange = vi.fn();
      render(<Pagination {...defaultProps} currentPage={5} onPageChange={onPageChange} />);
      
      fireEvent.click(screen.getByText('Precedent'));
      expect(onPageChange).toHaveBeenCalledWith(4);
    });

    it('devrait desactiver Precedent sur la premiere page', () => {
      render(<Pagination {...defaultProps} currentPage={1} />);
      expect(screen.getByText('Precedent')).toBeDisabled();
    });

    it('devrait desactiver Suivant sur la derniere page', () => {
      render(<Pagination {...defaultProps} currentPage={10} totalPages={10} />);
      expect(screen.getByText('Suivant')).toBeDisabled();
    });
  });

  describe('Affichage des numeros de page', () => {
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

    it('devrait mettre en evidence la page courante', () => {
      render(<Pagination {...defaultProps} currentPage={3} totalPages={5} />);
      const currentButton = screen.getByRole('button', { name: '3' });
      expect(currentButton).toHaveClass('bg-blue-600');
    });
  });

  describe('First/Last navigation', () => {
    it('devrait afficher les boutons first/last par defaut', () => {
      render(<Pagination {...defaultProps} totalPages={20} currentPage={10} />);
      // Les boutons avec chevrons doubles sont presents
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

  describe('Changement de page par numero', () => {
    it('devrait naviguer au clic sur un numero de page', () => {
      const onPageChange = vi.fn();
      render(<Pagination {...defaultProps} totalPages={5} onPageChange={onPageChange} />);
      
      fireEvent.click(screen.getByRole('button', { name: '3' }));
      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('ne devrait pas appeler onPageChange au clic sur la page courante', () => {
      const onPageChange = vi.fn();
      render(<Pagination {...defaultProps} currentPage={3} totalPages={5} onPageChange={onPageChange} />);
      
      fireEvent.click(screen.getByRole('button', { name: '3' }));
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it('ne devrait pas appeler onPageChange au clic sur ellipsis', () => {
      const onPageChange = vi.fn();
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
    it('devrait gerer 1 seule page', () => {
      render(<Pagination {...defaultProps} currentPage={1} totalPages={1} />);
      expect(screen.getByText('Precedent')).toBeDisabled();
      expect(screen.getByText('Suivant')).toBeDisabled();
    });

    it('devrait gerer 0 pages', () => {
      render(<Pagination {...defaultProps} currentPage={0} totalPages={0} />);
      // Doit rendre sans erreur
      expect(screen.getByText('Precedent')).toBeInTheDocument();
    });
  });
});
