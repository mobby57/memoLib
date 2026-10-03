import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * uiStore — état PUREMENT client (Zustand).
 *
 * Règle d'architecture : Zustand ne stocke JAMAIS de données métier ni de
 * permissions (elles viennent du serveur via TanStack Query / hooks). Ici on ne
 * gère que l'état d'interface : ouverture de la sidebar, modale active, filtres
 * transitoires, densité d'affichage.
 *
 * Persistance : seules les préférences d'UI durables (sidebar, densité) sont
 * persistées en localStorage. Les états transitoires (modale, filtres) ne le
 * sont pas.
 */

export type ModalId =
  | 'command-palette'
  | 'settings'
  | 'unsaved-changes'
  | null;

export type Density = 'comfortable' | 'compact';

export interface UiState {
  // --- Préférences d'UI durables (persistées) ---
  sidebarCollapsed: boolean;
  density: Density;

  // --- État transitoire (non persisté) ---
  mobileSidebarOpen: boolean;
  activeModal: ModalId;
  /** Filtres génériques par domaine (ex: filters['dossiers'] = {...}) */
  filters: Record<string, Record<string, unknown>>;

  // --- Actions ---
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setDensity: (density: Density) => void;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  openModal: (modal: Exclude<ModalId, null>) => void;
  closeModal: () => void;
  setFilter: (scope: string, value: Record<string, unknown>) => void;
  clearFilter: (scope: string) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      density: 'comfortable',
      mobileSidebarOpen: false,
      activeModal: null,
      filters: {},

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setDensity: (density) => set({ density }),
      openMobileSidebar: () => set({ mobileSidebarOpen: true }),
      closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
      openModal: (modal) => set({ activeModal: modal }),
      closeModal: () => set({ activeModal: null }),
      setFilter: (scope, value) =>
        set((s) => ({ filters: { ...s.filters, [scope]: value } })),
      clearFilter: (scope) =>
        set((s) => {
          const next = { ...s.filters };
          delete next[scope];
          return { filters: next };
        }),
    }),
    {
      name: 'memolib-ui',
      storage: createJSONStorage(() => localStorage),
      // Ne persiste QUE les préférences durables.
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        density: state.density,
      }),
    }
  )
);
