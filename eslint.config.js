const eslintJs = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
  {
    ignores: [
      'node_modules',
      '.next',
      'dist',
      'coverage',
      '**/playwright-report',
      '**/test-results',
      '**/MemoLib.Api-cleanpush/**',
      '**/MemoLib.Api/**'
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        RequestInit: 'readonly',
        URLSearchParams: 'readonly',
        Buffer: 'readonly',
        NodeJS: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        performance: 'readonly',
        global: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off',
      'preserve-caught-error': 'off',
    },
  },
  eslintJs.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-undef': 'off',
      'preserve-caught-error': 'off',
    },
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
    languageOptions: {
      globals: {
        module: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off',
      'no-useless-escape': 'off',
      'no-control-regex': 'off',
      'no-constant-binary-expression': 'off',
      'no-empty': 'off',
      'no-case-declarations': 'off',
      'no-useless-assignment': 'off',
      'no-unreachable': 'off',
      'no-dupe-class-members': 'off',
      'no-redeclare': 'off',
    },
  },
];