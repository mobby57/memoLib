import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

/**
 * Tests de l'AppShell (jsdom) : rendu responsive desktop vs mobile + drawer.
 */

const state = vi.hoisted(() => ({
  isMobile: false,
  isTablet: false,
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  closeMobileSidebar: vi.fn(),
}));

vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: () => ({ isMobile: state.isMobile, isTablet: state.isTablet }),
}));

vi.mock('@/stores/uiStore', () => ({
  useUiStore: (selector: any) =>
    selector({
      sidebarCollapsed: state.sidebarCollapsed,
      mobileSidebarOpen: state.mobileSidebarOpen,
      closeMobileSidebar: state.closeMobileSidebar,
    }),
}));

import { AppShell } from '@/components/layout/AppShell';

beforeEach(() => {
  state.isMobile = false;
  state.isTablet = false;
  state.sidebarCollapsed = false;
  state.mobileSidebarOpen = false;
  state.closeMobileSidebar = vi.fn();
});

function renderShell() {
  return render(
    <AppShell
      sidebar={<nav>SIDEBAR</nav>}
      header={<div>HEADER</div>}
      aside={<div>ASIDE</div>}
    >
      <div>CONTENT</div>
    </AppShell>
  );
}

describe('AppShell', () => {
  it('desktop : affiche sidebar, header, contenu et aside', () => {
    renderShell();
    expect(screen.getByText('SIDEBAR')).toBeInTheDocument();
    expect(screen.getByText('HEADER')).toBeInTheDocument();
    expect(screen.getByText('CONTENT')).toBeInTheDocument();
    expect(screen.getByText('ASIDE')).toBeInTheDocument();
  });

  it('mobile : sidebar cachée tant que le drawer est fermé', () => {
    state.isMobile = true;
    state.mobileSidebarOpen = false;
    renderShell();
    expect(screen.queryByText('SIDEBAR')).toBeNull();
    expect(screen.getByText('CONTENT')).toBeInTheDocument();
  });

  it('mobile : drawer ouvert affiche la sidebar', () => {
    state.isMobile = true;
    state.mobileSidebarOpen = true;
    renderShell();
    expect(screen.getByText('SIDEBAR')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Menu de navigation' })).toBeInTheDocument();
  });

  it('mobile : clic sur l’overlay ferme le drawer', () => {
    state.isMobile = true;
    state.mobileSidebarOpen = true;
    const { container } = renderShell();
    const overlay = container.querySelector('[aria-hidden]');
    fireEvent.click(overlay!);
    expect(state.closeMobileSidebar).toHaveBeenCalled();
  });
});
