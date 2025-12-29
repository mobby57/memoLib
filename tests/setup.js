
const { execSync } = require('child_process');

beforeAll(() => {
  // Setup test database
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/iaposte_test';
});

afterAll(() => {
  // Cleanup
});
