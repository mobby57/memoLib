import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
    './src/app/globals.css',
  ],
  safelist: [
    'bg-gray-50',
    'text-gray-900',
    'antialiased',
    'max-w-6xl',
    'mx-auto',
    'px-6',
    'bg-white',
    'rounded-xl',
    'shadow-sm',
    'border',
    'border-gray-100',
    'inline-flex',
    'items-center',
    'gap-2',
    'px-5',
    'py-2.5',
    'bg-brand-600',
    'text-white',
    'rounded-lg',
    'hover:bg-brand-700',
    'transition',
    'bg-gray-800',
    'hover:bg-gray-900',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
    },
  },
  plugins: [],
};

export default config;
