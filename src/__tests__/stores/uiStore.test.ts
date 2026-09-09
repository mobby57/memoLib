import { describe, it, expect, beforeEach } from 'vitest';
import { useUiStore } from '@/stores/uiStore';

/**
 * Tests du store UI (Zustand) — état purement client.
 * On teste directement l'API du store (pas besoin de rendu React).
 */

function resetStore() {
  useUiStore.setState({
    sidebarCollapsed: false,
    density: 'comfortable',
    mobileSidebarOpen: false,
    activeModal: null,
    filters: {},
  });
}

describe('uiStore', () => {
  beforeEach(() => resetStore());

  it('toggleSidebar bascule sidebarCollapsed', () => {
    expect(useUiStore.getState().sidebarCollapsed).toBe(false);
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().sidebarCollapsed).toBe(true);
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().sidebarCollapsed).toBe(false);
  });

  it('setDensity met à jour la densité', () => {
    useUiStore.getState().setDensity('compact');
    expect(useUiStore.getState().density).toBe('compact');
  });

  it('gère la sidebar mobile', () => {
    useUiStore.getState().openMobileSidebar();
    expect(useUiStore.getState().mobileSidebarOpen).toBe(true);
    useUiStore.getState().closeMobileSidebar();
    expect(useUiStore.getState().mobileSidebarOpen).toBe(false);
  });

  it('ouvre et ferme une modale', () => {
    useUiStore.getState().openModal('command-palette');
    expect(useUiStore.getState().activeModal).toBe('command-palette');
    useUiStore.getState().closeModal();
    expect(useUiStore.getState().activeModal).toBeNull();
  });

  it('gère les filtres par scope', () => {
    useUiStore.getState().setFilter('dossiers', { status: 'open' });
    expect(useUiStore.getState().filters.dossiers).toEqual({ status: 'open' });

    useUiStore.getState().setFilter('clients', { q: 'dupont' });
    expect(useUiStore.getState().filters.clients).toEqual({ q: 'dupont' });
    // Les scopes sont indépendants.
    expect(useUiStore.getState().filters.dossiers).toEqual({ status: 'open' });

    useUiStore.getState().clearFilter('dossiers');
    expect(useUiStore.getState().filters.dossiers).toBeUndefined();
    expect(useUiStore.getState().filters.clients).toEqual({ q: 'dupont' });
  });
});
