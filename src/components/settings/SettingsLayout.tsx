'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/useResponsive';

/**
 * SettingsLayout — navigation responsive des paramètres.
 *
 *  - Desktop / tablette (>= md) : sidebar latérale + contenu.
 *  - Mobile (< md) : sélecteur de section en haut (liste déroulante d'onglets),
 *    puis contenu empilé.
 *
 * La logique responsive vit ici (useResponsive), les pages ne la gèrent plus.
 */

export interface SettingsSectionDef {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Masqué si false (ex: section réservée à une permission). */
  visible?: boolean;
}

export interface SettingsLayoutProps {
  sections: SettingsSectionDef[];
  activeId: string;
  onSelect: (id: string) => void;
  children: ReactNode;
}

export function SettingsLayout({ sections, activeId, onSelect, children }: SettingsLayoutProps) {
  const { isMobile } = useResponsive();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const visibleSections = sections.filter((s) => s.visible !== false);
  const active = visibleSections.find((s) => s.id === activeId) ?? visibleSections[0];

  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Sélecteur de section mobile */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            aria-expanded={mobileNavOpen}
            aria-controls="settings-mobile-nav"
            onClick={() => setMobileNavOpen((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100"
          >
            <span className="flex items-center gap-2">
              {active?.icon}
              {active?.label}
            </span>
            <span aria-hidden className={cn('transition-transform', mobileNavOpen && 'rotate-180')}>
              ▾
            </span>
          </button>
          {mobileNavOpen && (
            <ul id="settings-mobile-nav" className="border-t border-slate-200 dark:border-slate-800">
              {visibleSections.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(s.id);
                      setMobileNavOpen(false);
                    }}
                    aria-current={s.id === active?.id ? 'true' : undefined}
                    className={cn(
                      'flex w-full items-center gap-2 px-4 py-3 text-left text-sm',
                      s.id === active?.id
                        ? 'bg-slate-100 font-medium text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900'
                    )}
                  >
                    {s.icon}
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>{children}</div>
      </div>
    );
  }

  // Desktop / tablette : sidebar + contenu
  return (
    <div className="flex gap-6">
      <nav aria-label="Sections des paramètres" className="w-56 shrink-0">
        <ul className="space-y-1">
          {visibleSections.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                aria-current={s.id === active?.id ? 'true' : undefined}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
                  s.id === active?.id
                    ? 'bg-slate-100 font-medium text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900'
                )}
              >
                {s.icon}
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
