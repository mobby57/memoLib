module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.jsx?$': ['babel-jest', {
      presets: [[
        'next/babel',
        {
          'preset-react': {
            runtime: 'automatic'
          }
        }
      ]]
    }],
  },
  passWithNoTests: true,
  testPathIgnorePatterns: ['/node_modules/', '/bin/', '/obj/', '/MemoLib-Package-Client/', '/__tests__/e2e/'],
};
