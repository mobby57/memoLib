'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/useResponsive';
import { useUiStore } from '@/stores/uiStore';

/**
 * AppShell — squelette applicatif responsive (Incrément 4).
 *
 *  - Desktop (>= lg) : sidebar fixe + header + contenu.
 *  - Tablette (md..lg) : sidebar réductible (collapsed).
 *  - Mobile (< md) : sidebar en overlay (drawer) piloté par uiStore.
 *
 * La logique responsive et l'état d'ouverture vivent ici (useResponsive +
 * uiStore) ; les pages ne gèrent plus le layout elles-mêmes :
 *
 *   <AppShell sidebar={<Sidebar/>} header={<Header/>} aside={<NeedsHelp/>}>
 *     <PageContent />
 *   </AppShell>
 */

export interface AppShellProps {
  sidebar: ReactNode;
  header?: ReactNode;
  /** Colonne latérale droite optionnelle (ex: widget "demandes à aider"). */
  aside?: ReactNode;
  children: ReactNode;
}

export function AppShell({ sidebar, header, aside, children }: AppShellProps) {
  const { isMobile, isTablet } = useResponsive();
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const mobileSidebarOpen = useUiStore((s) => s.mobileSidebarOpen);
  const closeMobileSidebar = useUiStore((s) => s.closeMobileSidebar);

  // Largeur de la sidebar selon le device.
  const collapsed = isTablet || sidebarCollapsed;
  const sidebarWidth = collapsed ? 'w-16' : 'w-64';

  if (isMobile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {header && (
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            {header}
          </header>
        )}

        {/* Drawer sidebar (overlay) */}
        {mobileSidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40"
              aria-hidden
              onClick={closeMobileSidebar}
            />
            <aside
              role="dialog"
              aria-label="Menu de navigation"
              className="fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            >
              {sidebar}
            </aside>
          </>
        )}

        <main className="p-4">
          {children}
          {aside && <div className="mt-6">{aside}</div>}
        </main>
      </div>
    );
  }

  // Desktop / tablette
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside
        className={cn(
          'sticky top-0 h-screen shrink-0 overflow-y-auto border-r border-slate-200 bg-white transition-all dark:border-slate-800 dark:bg-slate-900',
          sidebarWidth
        )}
      >
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {header && (
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            {header}
          </header>
        )}
        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 p-6">{children}</main>
          {aside && (
            <aside className="hidden w-80 shrink-0 border-l border-slate-200 p-4 xl:block dark:border-slate-800">
              {aside}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
