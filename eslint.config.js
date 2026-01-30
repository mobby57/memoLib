// ESM proxy vers la config CJS
import config from './eslint.config.cjs';
export default config;
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
    {
        ignores: [
            'node_modules',
            'dist',
            'cloudflare-workers/**',
            'cloudflare.config.js',
            'playwright.config.ts',
            'prisma/**',
            'scripts/**',
            'src/frontend/**'
        ]
    },
    {
        files: ['tests/**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module'
            }
        },
        plugins: {
            '@typescript-eslint': tsPlugin
        },
        rules: {
            ...js.configs.recommended.rules,
            ...tsPlugin.configs.recommended.rules
        }
    }
];
