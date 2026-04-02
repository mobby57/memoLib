process.env.TZ = 'UTC';

const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const skipSecurity2FA = process.env.JEST_SKIP_SECURITY_2FA === '1';

module.exports = {
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    env: {
      NODE_ENV: 'test',
      NEXTAUTH_SECRET: 'test-secret',
      NEXTAUTH_URL: 'http://localhost:3000',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    },
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js'
  },
  modulePathIgnorePatterns: [
    '<rootDir>/MemoLib.Api/',
    '<rootDir>/MemoLib.Api-cleanpush/',
    '<rootDir>/memolib-web/',
    '<rootDir>/freetime/'
  ],
  collectCoverageFrom: [
    'wwwroot/**/*.js',
    '!wwwroot/**/*.test.js',
    '!wwwroot/sw.js',
    '!wwwroot/pwa-register.js'
  ],
  coverageThreshold: isCI
    ? undefined
    : {
        global: {
          branches: 30,
          functions: 30,
          lines: 30,
          statements: 30
        }
      },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      presets: [[
        'next/babel',
        {
          'preset-react': {
            runtime: 'automatic'
          }
        }
      ]]
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  passWithNoTests: true,
  // Warn about open handles instead of force-exiting silently
  openHandlesTimeout: 1000,
  testPathIgnorePatterns: [
    '/node_modules/',
    '/bin/',
    '/obj/',
    '/MemoLib-Package-Client/',
    '/MemoLib.Api/',
    '/MemoLib.Api-cleanpush/',
    '/memolib-web/',
    '/freetime/',
    '/__tests__/e2e/',
    '/tests/e2e/',
    '\\.e2e\\.test\\.',
    ...(skipSecurity2FA ? ['/src/__tests__/security/two-factor-auth.test.ts'] : [])
  ],
  testTimeout: 10000
};
