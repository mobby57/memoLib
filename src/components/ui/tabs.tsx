'use client';

/**
 * Shadcn-compatible Tabs components
 * Simple wrapper pour compatibilité avec l'API Radix UI
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

export interface TabsProps {
  defaultValue?: string;
  defaultTab?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  tabs?: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    badge?: number;
    content: React.ReactNode;
  }>;
  className?: string;
  children?: React.ReactNode;
}

export function Tabs({ defaultValue, defaultTab, value: controlledValue, onValueChange, variant, tabs, className, children }: TabsProps) {
  const initialTab = defaultValue || defaultTab || '';
  const [uncontrolledValue, setUncontrolledValue] = React.useState(initialTab);
  const value = controlledValue ?? uncontrolledValue;

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (controlledValue === undefined) {
        setUncontrolledValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [controlledValue, onValueChange]
  );

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={cn('w-full', className)}>
        {tabs && tabs.length > 0 ? (
          <>
            <TabsList
              className={cn(
                variant === 'underline' && 'h-auto rounded-none bg-transparent p-0 border-b border-slate-200 dark:border-slate-800',
                variant === 'pills' && 'h-auto rounded-lg bg-slate-100 dark:bg-slate-900 p-1'
              )}
            >
              {tabs.map(tab => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    variant === 'underline' && 'rounded-none border-b-2 border-transparent data-[active=true]:border-primary',
                    'gap-2'
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {typeof tab.badge === 'number' && tab.badge > 0 && (
                    <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1 text-xs">
                      {tab.badge}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map(tab => (
              <TabsContent key={tab.id} value={tab.id} className="mt-4">
                {tab.content}
              </TabsContent>
            ))}
          </>
        ) : (children ?? null)}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground', className)}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  const isActive = context.value === value;

  return (
    <button
      type="button"
      role="tab"
      data-active={isActive}
      aria-selected={isActive}
      onClick={() => context.onValueChange(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-background/50',
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  if (context.value !== value) return null;

  return (
    <div role="tabpanel" className={cn('mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', className)}>
      {children}
    </div>
  );
}
