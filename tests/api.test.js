
const request = require('supertest');
const app = require('../src/backend/server');

describe('API Endpoints', () => {
  test('GET /api/health should return 200', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);
    
    expect(response.body.status).toBe('OK');
  });
  
  test('POST /api/ai/generate should generate email', async () => {
    const response = await request(app)
      .post('/api/ai/generate')
      .send({
        context: 'Meeting request for tomorrow',
        tone: 'professional'
      })
      .expect(200);
    
    expect(response.body.subject).toBeDefined();
    expect(response.body.body).toBeDefined();
  });
});
