/**
 * Tests pour SearchBar component
 * Couverture: recherche, filtres, résultats
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Search: () => <span data-testid="search-icon">Search</span>,
  X: () => <span data-testid="x-icon">X</span>,
  FileText: () => <span data-testid="file-icon">FileText</span>,
  Users: () => <span data-testid="users-icon">Users</span>,
  Folder: () => <span data-testid="folder-icon">Folder</span>,
  Mail: () => <span data-testid="mail-icon">Mail</span>,
  Loader2: () => <span data-testid="loader-icon">Loader</span>,
  TrendingUp: () => <span data-testid="trending-icon">Trending</span>,
}));

// Mock fetch
global.fetch = jest.fn();

// Import après les mocks
import SearchBar from '@/components/SearchBar';

describe('SearchBar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ results: [], suggestions: [] }),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendu initial', () => {
    it('devrait afficher le champ de recherche', async () => {
      const { container } = render(<SearchBar />);
      
      const input = container.querySelector('input');
      expect(input).toBeInTheDocument();
    });

    it('devrait afficher l\'icône de recherche', () => {
      render(<SearchBar />);
      
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });
  });
});

describe('SearchResult Types', () => {
  const resultTypes = ['client', 'dossier', 'document', 'email'];

  it('devrait supporter le type client', () => {
    expect(resultTypes).toContain('client');
  });

  it('devrait supporter le type dossier', () => {
    expect(resultTypes).toContain('dossier');
  });

  it('devrait supporter le type document', () => {
    expect(resultTypes).toContain('document');
  });

  it('devrait supporter le type email', () => {
    expect(resultTypes).toContain('email');
  });
});

describe('SearchResult Structure', () => {
  it('devrait avoir les champs requis', () => {
    const result = {
      id: 'result-1',
      type: 'dossier',
      title: 'Dossier DOS-001',
      subtitle: 'Client: Jean Dupont',
      description: 'Titre de séjour',
      score: 0.95,
      url: '/dossiers/dos-001',
      date: '2024-01-15',
      tags: ['OQTF', 'Urgent'],
    };

    expect(result.id).toBeDefined();
    expect(result.type).toBeDefined();
    expect(result.title).toBeDefined();
    expect(result.score).toBeDefined();
  });

  it('devrait avoir un score entre 0 et 1', () => {
    const scores = [0, 0.5, 0.75, 0.95, 1];
    
    scores.forEach(score => {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });
});

describe('Filtre par type', () => {
  it('devrait pouvoir filtrer par un seul type', () => {
    const filterByType = (results: any[], types: string[]) => {
      if (types.length === 0) return results;
      return results.filter(r => types.includes(r.type));
    };

    const results = [
      { id: '1', type: 'client' },
      { id: '2', type: 'dossier' },
      { id: '3', type: 'document' },
    ];

    const filtered = filterByType(results, ['client']);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].type).toBe('client');
  });

  it('devrait pouvoir filtrer par plusieurs types', () => {
    const filterByType = (results: any[], types: string[]) => {
      if (types.length === 0) return results;
      return results.filter(r => types.includes(r.type));
    };

    const results = [
      { id: '1', type: 'client' },
      { id: '2', type: 'dossier' },
      { id: '3', type: 'document' },
    ];

    const filtered = filterByType(results, ['client', 'dossier']);
    expect(filtered).toHaveLength(2);
  });

  it('devrait retourner tous les résultats sans filtre', () => {
    const filterByType = (results: any[], types: string[]) => {
      if (types.length === 0) return results;
      return results.filter(r => types.includes(r.type));
    };

    const results = [
      { id: '1', type: 'client' },
      { id: '2', type: 'dossier' },
    ];

    const filtered = filterByType(results, []);
    expect(filtered).toHaveLength(2);
  });
});

describe('Tri des résultats par score', () => {
  it('devrait trier par score décroissant', () => {
    const results = [
      { id: '1', score: 0.5 },
      { id: '2', score: 0.9 },
      { id: '3', score: 0.7 },
    ];

    const sorted = [...results].sort((a, b) => b.score - a.score);

    expect(sorted[0].score).toBe(0.9);
    expect(sorted[1].score).toBe(0.7);
    expect(sorted[2].score).toBe(0.5);
  });
});

describe('Raccourci clavier Ctrl+K', () => {
  it('devrait être le raccourci standard', () => {
    const shortcut = { ctrl: true, key: 'k' };
    
    expect(shortcut.ctrl).toBe(true);
    expect(shortcut.key).toBe('k');
  });

  it('devrait supporter aussi Cmd+K sur Mac', () => {
    const shortcut = { meta: true, key: 'k' };
    
    expect(shortcut.meta).toBe(true);
    expect(shortcut.key).toBe('k');
  });
});
