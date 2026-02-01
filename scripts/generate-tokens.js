#!/usr/bin/env node
/**
 * Generate Design Tokens from Tailwind Config
 * Creates CSS variables and token files for the design system
 */

const fs = require('fs');
const path = require('path');

// Design tokens based on the app's design system
const tokens = {
  colors: {
    // Primary
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    // Slate (neutral)
    slate: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    // Success
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
    },
    // Warning
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
    },
    // Error
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
    },
    // Semantic
    background: '#ffffff',
    foreground: '#0f172a',
    card: '#ffffff',
    'card-foreground': '#0f172a',
    border: '#e2e8f0',
    input: '#e2e8f0',
    ring: '#3b82f6',
    muted: '#f1f5f9',
    'muted-foreground': '#64748b',
  },
  
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, -apple-system, sans-serif',
      mono: 'JetBrains Mono, Consolas, monospace',
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  
  spacing: {
    0: '0px',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
  },
  
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    DEFAULT: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
};

// Output directory
const OUTPUT_DIR = path.join(__dirname, '../src/styles/tokens');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Generate CSS variables
function generateCSSVariables() {
  let css = `/* Design Tokens - Auto-generated */
/* Do not edit manually */

:root {
`;

  // Colors
  Object.entries(tokens.colors).forEach(([name, value]) => {
    if (typeof value === 'object') {
      Object.entries(value).forEach(([shade, color]) => {
        css += `  --color-${name}-${shade}: ${color};\n`;
      });
    } else {
      css += `  --color-${name}: ${value};\n`;
    }
  });

  css += '\n  /* Typography */\n';
  css += `  --font-sans: ${tokens.typography.fontFamily.sans};\n`;
  css += `  --font-mono: ${tokens.typography.fontFamily.mono};\n`;

  css += '\n  /* Spacing */\n';
  Object.entries(tokens.spacing).forEach(([name, value]) => {
    css += `  --spacing-${name}: ${value};\n`;
  });

  css += '\n  /* Border Radius */\n';
  Object.entries(tokens.borderRadius).forEach(([name, value]) => {
    const key = name === 'DEFAULT' ? 'default' : name;
    css += `  --radius-${key}: ${value};\n`;
  });

  css += '\n  /* Shadows */\n';
  Object.entries(tokens.shadows).forEach(([name, value]) => {
    const key = name === 'DEFAULT' ? 'default' : name;
    css += `  --shadow-${key}: ${value};\n`;
  });

  css += '}\n';

  // Dark mode
  css += `
/* Dark Mode */
.dark {
  --color-background: #0f172a;
  --color-foreground: #f8fafc;
  --color-card: #1e293b;
  --color-card-foreground: #f8fafc;
  --color-border: #334155;
  --color-input: #334155;
  --color-muted: #1e293b;
  --color-muted-foreground: #94a3b8;
}
`;

  return css;
}

// Generate JSON tokens
function generateJSONTokens() {
  return JSON.stringify(tokens, null, 2);
}

// Generate TypeScript types
function generateTypeScriptTypes() {
  return `/* Design Token Types - Auto-generated */

export interface DesignTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
}

export interface ColorTokens {
  primary: ColorScale;
  slate: ColorScale;
  success: Partial<ColorScale>;
  warning: Partial<ColorScale>;
  error: Partial<ColorScale>;
  background: string;
  foreground: string;
  card: string;
  'card-foreground': string;
  border: string;
  input: string;
  ring: string;
  muted: string;
  'muted-foreground': string;
}

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface TypographyTokens {
  fontFamily: {
    sans: string;
    mono: string;
  };
  fontSize: Record<string, [string, { lineHeight: string }]>;
  fontWeight: Record<string, number>;
}

export const tokens: DesignTokens = ${JSON.stringify(tokens, null, 2)};
`;
}

// Write files
console.log('🎨 Generating Design Tokens...\n');

const cssContent = generateCSSVariables();
fs.writeFileSync(path.join(OUTPUT_DIR, 'variables.css'), cssContent);
console.log('✅ Generated: src/styles/tokens/variables.css');

const jsonContent = generateJSONTokens();
fs.writeFileSync(path.join(OUTPUT_DIR, 'tokens.json'), jsonContent);
console.log('✅ Generated: src/styles/tokens/tokens.json');

const tsContent = generateTypeScriptTypes();
fs.writeFileSync(path.join(OUTPUT_DIR, 'tokens.ts'), tsContent);
console.log('✅ Generated: src/styles/tokens/tokens.ts');

console.log('\n🎉 Design tokens generated successfully!');
console.log('\nUsage:');
console.log('  CSS:  @import "./styles/tokens/variables.css";');
console.log('  TS:   import { tokens } from "@/styles/tokens/tokens";');
