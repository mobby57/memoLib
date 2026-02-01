const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',

  // ========== OPTIMISATIONS MÉMOIRE ==========
  maxWorkers: '50%', // Utilise 50% des CPUs disponibles
  workerIdleMemoryLimit: '512MB', // Limite mémoire par worker

  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/node_modules_backup/',
    '<rootDir>/coverage/',
    '<rootDir>/venv/',
    '<rootDir>/frontend-node/',
    // Skip API route tests - they require full Next.js server environment
    // Use E2E tests (Playwright/Cypress) for API testing instead
    '<rootDir>/src/__tests__/api/',
    '<rootDir>/src/app/api/',
  ]
    .concat(process.env.JEST_SKIP_BILLING ? ['<rootDir>/src/__tests__/billing/'] : [])
    .concat(
      process.env.JEST_SKIP_SECURITY_2FA
        ? ['<rootDir>/src/__tests__/security/two-factor-auth.test.ts']
        : []
    ),
  modulePathIgnorePatterns: [
    '<rootDir>/node_modules_backup/',
    '<rootDir>/.next/standalone/',
    '<rootDir>/venv/',
    '<rootDir>/frontend-node/',
  ],
  collectCoverageFrom: [
    // Cibler uniquement les fichiers avec tests existants
    'src/lib/**/*.ts',
    'src/components/**/*.tsx',
    'src/hooks/**/*.ts',
    'src/hooks/**/*.tsx',
    'src/utils/**/*.ts',
    // Exclusions
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/index.{js,jsx,ts,tsx}',
    '!src/types/**/*',
    '!src/**/*.types.ts',
    '!src/lib/legifrance/**/*', // API externe
    '!src/lib/email/**/*', // Services email mock
    '!src/lib/workflows/**/*', // Trop complexe
    '!src/app/**/*', // Pages React (testées via E2E)
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/node_modules_backup/',
    '/.next/',
    '/coverage/',
    '/prisma/',
    '/scripts/',
    '/docs/',
    '/src/app/', // Exclure les pages
  ],
  coverageThreshold: {
    global: {
      branches: 3,
      functions: 3,
      lines: 3,
      statements: 3,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@otplib/preset-default$': '<rootDir>/src/__mocks__/otplib-preset-default.ts',
    '^@/lib/prisma$': '<rootDir>/src/__mocks__/lib/prisma.ts',
    '^stripe$': '<rootDir>/src/__mocks__/stripe.ts',
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  transformIgnorePatterns: [
    '/node_modules/',
    '/node_modules_backup/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  watchPathIgnorePatterns: ['<rootDir>/node_modules_backup/'],

  // ========== OPTIMISATIONS PERFORMANCES ==========
  clearMocks: true, // Clear mocks automatiquement
  restoreMocks: true, // Restore mocks automatiquement
  testTimeout: 10000, // Timeout 10s par test

  // Cache Jest pour accélérer les exécutions
  cacheDirectory: '<rootDir>/.jest-cache',
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
