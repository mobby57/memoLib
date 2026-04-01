module.exports = {
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
  collectCoverageFrom: [
    'wwwroot/**/*.js',
    '!wwwroot/**/*.test.js',
    '!wwwroot/sw.js',
    '!wwwroot/pwa-register.js'
  ],
  coverageThreshold: {
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
  testPathIgnorePatterns: ['/node_modules/', '/bin/', '/obj/', '/MemoLib-Package-Client/', '/__tests__/e2e/', '/tests/e2e/', '\\.e2e\\.test\\.'],
  testTimeout: 10000
};
