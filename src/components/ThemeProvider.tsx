'use client';

import { createContext, useContext, useMemo, ReactNode } from 'react';
import { colors } from '@/styles/tokens/tokens';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  colors: typeof colors;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  colors,
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
  theme?: Theme;
}

export function ThemeProvider({ children, theme = 'light' }: ThemeProviderProps) {
  const contextValue = useMemo(
    () => ({ theme, colors }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <div className={`theme-${theme}`} style={{
        '--color-primary': colors['iris-100'],
        '--color-primary-hover': colors['iris-80'],
        '--color-secondary': colors['fuschia-100'],
        '--color-secondary-hover': colors['fuschia-80'],
        '--color-background': colors.background,
        '--color-button': colors.button,
      } as React.CSSProperties}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
