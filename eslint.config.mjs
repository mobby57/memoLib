import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jest from 'eslint-plugin-jest';
import globals from 'globals';

export default [
  {
    ignores: ['.next', 'node_modules', '.vercel', 'out', 'dist', 'coverage', 'build', '.turbo', '**/src/__tests__/**'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        React: 'readonly',
        JSX: 'readonly',
        NodeJS: 'readonly',
        NextRequest: 'readonly',
        NextResponse: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...typescript.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/display-name': 'off',
      'react/jsx-key': 'error',
      'react/no-array-index-key': 'off',
      'react/no-unstable-nested-components': 'off',
      'react/prop-types': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/use-memo': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off',
      'prefer-const': 'off',
      'no-var': 'warn',
      'no-console': 'off',
      'no-debugger': 'error',
      'no-useless-escape': 'off',
      'no-empty': 'off',
      'no-control-regex': 'off',
      'no-case-declarations': 'off',
      'no-constant-binary-expression': 'warn',
      'react/no-unescaped-entities': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
    },
    plugins: {
      jest,
    },
    rules: {
      'no-console': 'off',
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'warn',
    },
  },
];
