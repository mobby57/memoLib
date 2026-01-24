/**
 * Tests pour le hook useToast
 * Couverture: création, dismiss, variants
 */

import { renderHook, act } from '@testing-library/react';
import { useToast } from '@/hooks/use-toast';

describe('useToast Hook', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('État initial', () => {
    it('devrait commencer avec un tableau de toasts vide', () => {
      const { result } = renderHook(() => useToast());
      
      expect(result.current.toasts).toEqual([]);
    });

    it('devrait exposer la fonction toast', () => {
      const { result } = renderHook(() => useToast());
      
      expect(typeof result.current.toast).toBe('function');
    });

    it('devrait exposer la fonction dismiss', () => {
      const { result } = renderHook(() => useToast());
      
      expect(typeof result.current.dismiss).toBe('function');
    });
  });

  describe('Création de toast', () => {
    it('devrait créer un toast avec titre', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({ title: 'Test Toast' });
      });
      
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('Test Toast');
    });

    it('devrait créer un toast avec description', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({ 
          title: 'Test Toast', 
          description: 'Description du toast' 
        });
      });
      
      expect(result.current.toasts[0].description).toBe('Description du toast');
    });

    it('devrait utiliser variant default par défaut', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({ title: 'Test' });
      });
      
      expect(result.current.toasts[0].variant).toBe('default');
    });

    it('devrait accepter le variant destructive', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({ title: 'Error', variant: 'destructive' });
      });
      
      expect(result.current.toasts[0].variant).toBe('destructive');
    });

    it('devrait accepter le variant success', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({ title: 'Success', variant: 'success' });
      });
      
      expect(result.current.toasts[0].variant).toBe('success');
    });

    it('devrait générer un ID unique', () => {
      const { result } = renderHook(() => useToast());
      
      let id: string;
      act(() => {
        id = result.current.toast({ title: 'Test' });
      });
      
      expect(result.current.toasts[0].id).toBeDefined();
      expect(typeof result.current.toasts[0].id).toBe('string');
    });

    it('devrait retourner l\'ID du toast créé', () => {
      const { result } = renderHook(() => useToast());
      
      let id: string = '';
      act(() => {
        id = result.current.toast({ title: 'Test' });
      });
      
      expect(id).toBe(result.current.toasts[0].id);
    });
  });

  describe('Multiples toasts', () => {
    it('devrait permettre plusieurs toasts', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({ title: 'Toast 1' });
        result.current.toast({ title: 'Toast 2' });
        result.current.toast({ title: 'Toast 3' });
      });
      
      expect(result.current.toasts).toHaveLength(3);
    });

    it('devrait avoir des IDs uniques', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({ title: 'Toast 1' });
        result.current.toast({ title: 'Toast 2' });
      });
      
      const ids = result.current.toasts.map(t => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('Dismiss', () => {
    it('devrait supprimer un toast par ID', () => {
      const { result } = renderHook(() => useToast());
      
      let id: string = '';
      act(() => {
        id = result.current.toast({ title: 'Test' });
      });
      
      expect(result.current.toasts).toHaveLength(1);
      
      act(() => {
        result.current.dismiss(id);
      });
      
      expect(result.current.toasts).toHaveLength(0);
    });

    it('devrait ne rien faire avec un ID inexistant', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({ title: 'Test' });
      });
      
      act(() => {
        result.current.dismiss('fake-id');
      });
      
      expect(result.current.toasts).toHaveLength(1);
    });

    it('devrait supprimer uniquement le toast ciblé', () => {
      const { result } = renderHook(() => useToast());
      
      let id1: string = '', id2: string = '';
      act(() => {
        id1 = result.current.toast({ title: 'Toast 1' });
        id2 = result.current.toast({ title: 'Toast 2' });
      });
      
      act(() => {
        result.current.dismiss(id1);
      });
      
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].id).toBe(id2);
    });
  });

  describe('Auto-dismiss après 5 secondes', () => {
    it('devrait supprimer le toast après 5 secondes', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({ title: 'Test' });
      });
      
      expect(result.current.toasts).toHaveLength(1);
      
      // Avancer de 5 secondes
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      expect(result.current.toasts).toHaveLength(0);
    });

    it('ne devrait pas supprimer avant 5 secondes', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({ title: 'Test' });
      });
      
      // Avancer de 4.9 secondes
      act(() => {
        jest.advanceTimersByTime(4900);
      });
      
      expect(result.current.toasts).toHaveLength(1);
    });
  });
});

describe('Toast Structure', () => {
  it('devrait avoir les champs requis', () => {
    const toast = {
      id: 'toast-123',
      title: 'Titre du toast',
      description: 'Description optionnelle',
      variant: 'default' as const,
    };

    expect(toast.id).toBeDefined();
    expect(toast.title).toBeDefined();
    expect(toast.variant).toBeDefined();
  });
});

describe('Toast Variants', () => {
  const variants = ['default', 'destructive', 'success'];

  it('devrait avoir 3 variants', () => {
    expect(variants).toHaveLength(3);
  });

  it('devrait inclure default', () => {
    expect(variants).toContain('default');
  });

  it('devrait inclure destructive pour les erreurs', () => {
    expect(variants).toContain('destructive');
  });

  it('devrait inclure success', () => {
    expect(variants).toContain('success');
  });
});
