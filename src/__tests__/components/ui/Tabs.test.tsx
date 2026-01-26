/**
 * Tests pour le composant Tabs
 * Couverture: navigation, variants, contenu dynamique
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs, Tab } from '@/components/ui/Tabs';

describe('Tabs Component', () => {
  const defaultTabs: Tab[] = [
    { id: 'tab1', label: 'Onglet 1', content: <div>Contenu 1</div> },
    { id: 'tab2', label: 'Onglet 2', content: <div>Contenu 2</div> },
    { id: 'tab3', label: 'Onglet 3', content: <div>Contenu 3</div> },
  ];

  describe('Rendu de base', () => {
    it('devrait rendre tous les onglets', () => {
      render(<Tabs tabs={defaultTabs} />);
      
      expect(screen.getByText('Onglet 1')).toBeInTheDocument();
      expect(screen.getByText('Onglet 2')).toBeInTheDocument();
      expect(screen.getByText('Onglet 3')).toBeInTheDocument();
    });

    it('devrait afficher le contenu du premier onglet par défaut', () => {
      render(<Tabs tabs={defaultTabs} />);
      expect(screen.getByText('Contenu 1')).toBeInTheDocument();
    });

    it('devrait afficher le contenu du defaultTab', () => {
      render(<Tabs tabs={defaultTabs} defaultTab="tab2" />);
      expect(screen.getByText('Contenu 2')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('devrait changer de contenu au clic sur un onglet', () => {
      render(<Tabs tabs={defaultTabs} />);
      
      fireEvent.click(screen.getByText('Onglet 2'));
      expect(screen.getByText('Contenu 2')).toBeInTheDocument();
    });

    it('devrait appeler onChange au changement d\'onglet', () => {
      const onChange = jest.fn();
      render(<Tabs tabs={defaultTabs} onChange={onChange} />);
      
      fireEvent.click(screen.getByText('Onglet 2'));
      expect(onChange).toHaveBeenCalledWith('tab2');
    });

    it('devrait naviguer entre tous les onglets', () => {
      render(<Tabs tabs={defaultTabs} />);
      
      fireEvent.click(screen.getByText('Onglet 3'));
      expect(screen.getByText('Contenu 3')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Onglet 1'));
      expect(screen.getByText('Contenu 1')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('devrait rendre le variant underline par défaut', () => {
      render(<Tabs tabs={defaultTabs} />);
      const container = document.querySelector('.border-b');
      expect(container).toBeInTheDocument();
    });

    it('devrait rendre le variant pills', () => {
      render(<Tabs tabs={defaultTabs} variant="pills" />);
      const container = document.querySelector('.rounded-lg');
      expect(container).toBeInTheDocument();
    });

    it('devrait rendre le variant default', () => {
      render(<Tabs tabs={defaultTabs} variant="default" />);
      const container = document.querySelector('.border-b');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Icônes', () => {
    it('devrait afficher les icônes', () => {
      const tabsWithIcons: Tab[] = [
        { id: 'tab1', label: 'Documents', icon: <span data-testid="icon-1">📄</span>, content: <div>Docs</div> },
        { id: 'tab2', label: 'Clients', icon: <span data-testid="icon-2">👥</span>, content: <div>Clients</div> },
      ];
      
      render(<Tabs tabs={tabsWithIcons} />);
      expect(screen.getByTestId('icon-1')).toBeInTheDocument();
      expect(screen.getByTestId('icon-2')).toBeInTheDocument();
    });
  });

  describe('Badges', () => {
    it('devrait afficher les badges', () => {
      const tabsWithBadges: Tab[] = [
        { id: 'tab1', label: 'Messages', badge: 5, content: <div>Messages</div> },
        { id: 'tab2', label: 'Notifications', badge: 12, content: <div>Notifs</div> },
      ];
      
      render(<Tabs tabs={tabsWithBadges} />);
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('ne devrait pas afficher les badges à 0', () => {
      const tabsWithZeroBadge: Tab[] = [
        { id: 'tab1', label: 'Empty', badge: 0, content: <div>Empty</div> },
      ];
      
      render(<Tabs tabs={tabsWithZeroBadge} />);
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });

  describe('État actif', () => {
    it('devrait styliser l\'onglet actif', () => {
      render(<Tabs tabs={defaultTabs} />);
      
      // Cliquer sur le second onglet
      fireEvent.click(screen.getByText('Onglet 2'));
      
      // L'onglet actif a des styles différents (texte bleu)
      const activeTab = screen.getByText('Onglet 2').closest('button');
      expect(activeTab).toHaveClass('border-blue-500');
    });
  });

  describe('Contenu dynamique', () => {
    it('devrait rendre du contenu complexe', () => {
      const complexTabs: Tab[] = [
        {
          id: 'form',
          label: 'Formulaire',
          content: (
            <form>
              <input type="text" placeholder="Nom" />
              <button type="submit">Envoyer</button>
            </form>
          ),
        },
      ];
      
      render(<Tabs tabs={complexTabs} />);
      expect(screen.getByPlaceholderText('Nom')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Envoyer' })).toBeInTheDocument();
    });

    it('devrait rendre des listes', () => {
      const listTabs: Tab[] = [
        {
          id: 'list',
          label: 'Liste',
          content: (
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
              <li>Item 3</li>
            </ul>
          ),
        },
      ];
      
      render(<Tabs tabs={listTabs} />);
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });
  });

  describe('Accessibilité', () => {
    it('devrait avoir des boutons pour chaque onglet', () => {
      render(<Tabs tabs={defaultTabs} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(3);
    });

    it('devrait être navigable au clavier', () => {
      render(<Tabs tabs={defaultTabs} />);
      
      const button = screen.getByText('Onglet 2').closest('button');
      button?.focus();
      expect(button).toHaveFocus();
    });
  });

  describe('Styles dark mode', () => {
    it('devrait avoir les classes dark mode', () => {
      render(<Tabs tabs={defaultTabs} />);
      const container = document.querySelector('.dark\\:border-gray-700');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('devrait gérer un seul onglet', () => {
      const singleTab: Tab[] = [
        { id: 'only', label: 'Seul Onglet', content: <div>Unique</div> },
      ];
      
      render(<Tabs tabs={singleTab} />);
      expect(screen.getByText('Seul Onglet')).toBeInTheDocument();
      expect(screen.getByText('Unique')).toBeInTheDocument();
    });

    it('devrait gérer un tableau vide', () => {
      render(<Tabs tabs={[]} />);
      // Ne doit pas crasher
      expect(document.body).toBeInTheDocument();
    });
  });
});
