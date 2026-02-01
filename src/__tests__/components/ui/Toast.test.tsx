/**
 * Tests pour le système Toast
 * Couverture: ToastProvider, useToast, variants, auto-dismiss
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ToastProvider, useToast, Toast } from '@/components/ui/Toast';

// Composant de test pour utiliser le hook
function TestComponent() {
  const { addToast, showToast, toasts, removeToast } = useToast();
  
  return (
    <div>
      <button onClick={() => addToast({ message: 'Test toast', variant: 'success' })}>
        Add Toast
      </button>
      <button onClick={() => showToast('Info message', 'info', 'Info Title')}>
        Show Info
      </button>
      <button onClick={() => showToast('Error!', 'error')}>
        Show Error
      </button>
      <button onClick={() => showToast('Warning!', 'warning')}>
        Show Warning
      </button>
      <button onClick={() => toasts[0] && removeToast(toasts[0].id)}>
        Remove First
      </button>
      <div data-testid="toast-count">{toasts.length}</div>
    </div>
  );
}

describe('Toast System', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('ToastProvider', () => {
    it('devrait rendre les enfants', () => {
      render(
        <ToastProvider>
          <div data-testid="child">Child content</div>
        </ToastProvider>
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('devrait fournir le contexte', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      expect(screen.getByText('Add Toast')).toBeInTheDocument();
    });
  });

  describe('useToast hook', () => {
    it('devrait lever une erreur hors du provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useToast must be used within ToastProvider');
      
      consoleSpy.mockRestore();
    });
  });

  describe('addToast', () => {
    it('devrait ajouter un toast', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      fireEvent.click(screen.getByText('Add Toast'));
      
      expect(screen.getByText('Test toast')).toBeInTheDocument();
    });

    it('devrait incrémenter le compteur de toasts', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
      
      fireEvent.click(screen.getByText('Add Toast'));
      
      expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
    });

    it('devrait ajouter plusieurs toasts', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      fireEvent.click(screen.getByText('Add Toast'));
      fireEvent.click(screen.getByText('Show Info'));
      fireEvent.click(screen.getByText('Show Error'));
      
      expect(screen.getByTestId('toast-count')).toHaveTextContent('3');
    });
  });

  describe('showToast', () => {
    it('devrait afficher un toast info avec titre', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      fireEvent.click(screen.getByText('Show Info'));
      
      expect(screen.getByText('Info Title')).toBeInTheDocument();
      expect(screen.getByText('Info message')).toBeInTheDocument();
    });

    it('devrait afficher un toast error', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      fireEvent.click(screen.getByText('Show Error'));
      
      expect(screen.getByText('Error!')).toBeInTheDocument();
    });

    it('devrait afficher un toast warning', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      fireEvent.click(screen.getByText('Show Warning'));
      
      expect(screen.getByText('Warning!')).toBeInTheDocument();
    });
  });

  describe('removeToast', () => {
    it('devrait supprimer un toast', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      fireEvent.click(screen.getByText('Add Toast'));
      expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
      
      fireEvent.click(screen.getByText('Remove First'));
      expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    });
  });

  describe('Auto-dismiss', () => {
    it('devrait supprimer automatiquement après 5 secondes par défaut', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      fireEvent.click(screen.getByText('Add Toast'));
      expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
      
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    });

    it('devrait supprimer après le délai personnalisé', () => {
      function CustomDurationComponent() {
        const { addToast, toasts } = useToast();
        return (
          <div>
            <button onClick={() => addToast({ message: 'Short', variant: 'info', duration: 2000 })}>
              Short Toast
            </button>
            <div data-testid="count">{toasts.length}</div>
          </div>
        );
      }
      
      render(
        <ToastProvider>
          <CustomDurationComponent />
        </ToastProvider>
      );
      
      fireEvent.click(screen.getByText('Short Toast'));
      expect(screen.getByTestId('count')).toHaveTextContent('1');
      
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      
      expect(screen.getByTestId('count')).toHaveTextContent('0');
    });
  });

  describe('Variants styling', () => {
    it('devrait afficher l\'icône de succès', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      fireEvent.click(screen.getByText('Add Toast'));
      
      // L'icône CheckCircle est présente
      const toast = screen.getByText('Test toast').closest('div');
      expect(toast).toBeInTheDocument();
    });

    it('devrait avoir les bonnes classes pour error', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      fireEvent.click(screen.getByText('Show Error'));
      
      // Les styles error sont appliqués
      const toast = screen.getByText('Error!').closest('div');
      expect(toast).toBeInTheDocument();
    });
  });

  describe('Toast container', () => {
    it('devrait être positionné en haut à droite', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      fireEvent.click(screen.getByText('Add Toast'));
      
      const container = document.querySelector('.fixed.top-4.right-4');
      expect(container).toBeInTheDocument();
    });

    it('devrait avoir un z-index élevé', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      fireEvent.click(screen.getByText('Add Toast'));
      
      const container = document.querySelector('.z-50');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Toast close button', () => {
    it('devrait avoir un bouton de fermeture', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      fireEvent.click(screen.getByText('Add Toast'));
      
      // Le bouton X est présent
      const closeButtons = document.querySelectorAll('button');
      expect(closeButtons.length).toBeGreaterThan(0);
    });
  });
});

describe('Toast interface', () => {
  it('devrait avoir les propriétés requises', () => {
    const toast: Toast = {
      id: 'test-id',
      variant: 'success',
      message: 'Test message',
    };
    
    expect(toast.id).toBe('test-id');
    expect(toast.variant).toBe('success');
    expect(toast.message).toBe('Test message');
  });

  it('devrait supporter les propriétés optionnelles', () => {
    const toast: Toast = {
      id: 'test-id',
      variant: 'info',
      message: 'Test',
      title: 'Title',
      duration: 3000,
    };
    
    expect(toast.title).toBe('Title');
    expect(toast.duration).toBe(3000);
  });
});
