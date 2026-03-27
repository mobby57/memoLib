module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
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
    '<rootDir>/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
    '!src/frontend/**',
    '!src/app/**',
    '!src/components/**',
    '!src/pages/**',
    '!src/middleware*.ts',
    '!src/proxy.ts',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
    '/public/',
    '/prisma/',
    '/scripts/',
    '/test-results/',
    '/MemoLib-Package-Client/',
    '/wwwroot/',
    '.d.ts$',
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': [
      'babel-jest',
      {
        presets: [
          [
            'next/babel',
            {
              'preset-react': {
                runtime: 'automatic',
              },
            },
          ],
        ],
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  modulePathIgnorePatterns: [
    '<rootDir>/MemoLib-Package-Client/',
    '<rootDir>/publish/',
    '<rootDir>/frontend-node/',
    '<rootDir>/dist/',
  ],
  watchPathIgnorePatterns: [
    '<rootDir>/MemoLib-Package-Client/',
    '<rootDir>/wwwroot/',
    '<rootDir>/.next/',
  ],
  passWithNoTests: true,
  testPathIgnorePatterns: [
    '/node_modules/',
    '/bin/',
    '/obj/',
    '/MemoLib-Package-Client/',
    '/__tests__/e2e/',
    '/tests/e2e/',
    '\\.e2e\\.test\\.',
  ],
  testTimeout: 10000,
};
