// Jest configuration optimisée pour 80% coverage
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  // Coverage thresholds (80% target)
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Specific thresholds for critical files
    './src/lib/auth.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/lib/security/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },

  // Test patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/__tests__/**/*.{js,jsx,ts,tsx}'
  ],

  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1'
  },

  // Mock configuration
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Module path ignore patterns
  modulePathIgnorePatterns: [
    '<rootDir>/.venv/',
    '<rootDir>/venv/',
    '<rootDir>/__pycache__/',
    '<rootDir>/.next/',
    '<rootDir>/out/',
    '<rootDir>/build/',
    '<rootDir>/MemoLib.Api/',
    '<rootDir>/MemoLib.Api-cleanpush/'
  ],

  // Watch path ignore patterns
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/.venv/',
    '/venv/',
    '/__pycache__/',
    '/.next/',
    '/coverage/',
    '/MemoLib.Api/',
    '/MemoLib.Api-cleanpush/'
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/out/',
    '<rootDir>/build/',
    '<rootDir>/src/frontend/tests/e2e/',
    '<rootDir>/tests/e2e/',
    '\\.e2e\\.test\\.',
    '<rootDir>/.venv/',
    '<rootDir>/venv/',
    '<rootDir>/__pycache__/',
    '<rootDir>/MemoLib.Api/',
    '<rootDir>/MemoLib.Api-cleanpush/'
  ],

  // Coverage ignore patterns
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
    '/public/',
    '/prisma/',
    '/scripts/',
    '/__tests__/',
    '/test-results/',
    '/.venv/',
    '/venv/',
    '/__pycache__/',
    '.d.ts$'
  ],

  // Performance optimization
  maxWorkers: '50%',
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',

  // Test timeout
  testTimeout: 10000,

  // Verbose output for debugging
  verbose: false,

  // Collect coverage from these files
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}'
  ]
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
