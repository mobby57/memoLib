import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.ts'],
        include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'tests/**/*.test.ts'],
        exclude: ['tests/e2e/**/*'],
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@/lib': path.resolve(__dirname, './src/lib'),
            '@/components': path.resolve(__dirname, './src/components'),
            '@/app': path.resolve(__dirname, './src/app'),
            '@/types': path.resolve(__dirname, './src/types'),
            '@/hooks': path.resolve(__dirname, './src/hooks'),
        },
    },
});
