import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';

config({ path: '.env.local' });

const dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.ts']
    },
    resolve: {
        alias: {
            // Keep alias resolution aligned with tsconfig.json paths (@/* -> src/*)
            '@': resolve(dirname, 'src')
        }
    }
});
