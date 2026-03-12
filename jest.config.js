module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.js'],
  moduleNameMapper: {
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
    '^.+\\.jsx?$': ['babel-jest', { presets: ['next/babel'] }]
  },
  passWithNoTests: true,
  testPathIgnorePatterns: ['/node_modules/', '/bin/', '/obj/', '/MemoLib-Package-Client/', '/__tests__/e2e/'],
  testTimeout: 10000
};
