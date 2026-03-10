const request = require('supertest');
const app = require('../index');

describe('Health Check', () => {
  it('should return health status', async () => {
    const res = await request(app)
      .get('/health')
      .expect(200);
    
    expect(res.body).toHaveProperty('status', 'UP');
    expect(res.body).toHaveProperty('version');
  });
});

describe('API Endpoints', () => {
  it('GET /api should return welcome message', async () => {
    const res = await request(app)
      .get('/api')
      .expect(200);
    
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('endpoints');
  });
  
  it('GET /api/products should return products list', async () => {
    const res = await request(app)
      .get('/api/products')
      .expect(200);
    
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
