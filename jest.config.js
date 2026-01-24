const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/node_modules_backup/',
    '<rootDir>/coverage/',
    '<rootDir>/venv/',
    '<rootDir>/frontend-node/',
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/node_modules_backup/',
    '<rootDir>/.next/standalone/',
    '<rootDir>/venv/',
    '<rootDir>/frontend-node/',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/index.{js,jsx,ts,tsx}',
    '!src/types/**/*',
    '!src/**/*.types.ts',
    // Priorité haute - Services métier
    'src/lib/services/**/*.ts',
    'src/middleware.ts',
    // Priorité haute - API critiques  
    'src/app/api/auth/**/*.ts',
    'src/app/api/dossiers/**/*.ts',
    'src/app/api/client/**/*.ts',
    'src/app/api/billing/**/*.ts',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/node_modules_backup/',
    '/.next/',
    '/coverage/',
    '/prisma/',
    '/scripts/',
    '/docs/',
  ],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
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
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules_backup/',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)