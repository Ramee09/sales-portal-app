const request = require('supertest');
const app = require('./index');

// ==================== UNIT TESTS ====================

describe('Health Check Endpoint', () => {
  it('should return health status with correct format', async () => {
    const res = await request(app)
      .get('/health')
      .expect(200);
    
    expect(res.body).toHaveProperty('status', 'UP');
    expect(res.body).toHaveProperty('version', '1.0.0');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('env');
  });

  it('should return valid timestamp in health check', async () => {
    const res = await request(app)
      .get('/health')
      .expect(200);
    
    expect(new Date(res.body.timestamp)).toBeInstanceOf(Date);
  });
});

describe('API Root Endpoint', () => {
  it('GET /api should return welcome message', async () => {
    const res = await request(app)
      .get('/api')
      .expect(200);
    
    expect(res.body).toHaveProperty('message', 'Welcome to Sales Portal API');
    expect(res.body).toHaveProperty('version', '1.0.0');
    expect(res.body).toHaveProperty('endpoints');
  });

  it('should include all expected endpoints in response', async () => {
    const res = await request(app)
      .get('/api')
      .expect(200);
    
    expect(res.body.endpoints).toHaveProperty('health');
    expect(res.body.endpoints).toHaveProperty('products');
    expect(res.body.endpoints).toHaveProperty('orders');
    expect(res.body.endpoints).toHaveProperty('users');
  });
});

describe('Product Endpoints', () => {
  it('GET /api/products should return products list', async () => {
    const res = await request(app)
      .get('/api/products')
      .expect(200);
    
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/products should return products with required fields', async () => {
    const res = await request(app)
      .get('/api/products')
      .expect(200);
    
    res.body.data.forEach(product => {
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('category');
    });
  });

  it('GET /api/products should return 3 products', async () => {
    const res = await request(app)
      .get('/api/products')
      .expect(200);
    
    expect(res.body.data).toHaveLength(3);
  });

  it('GET /api/products/:id should return single product', async () => {
    const res = await request(app)
      .get('/api/products/1')
      .expect(200);
    
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('id', '1');
    expect(res.body.data).toHaveProperty('name', 'Product 1');
  });

  it('GET /api/products/:id should return product with all fields', async () => {
    const res = await request(app)
      .get('/api/products/123')
      .expect(200);
    
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('name');
    expect(res.body.data).toHaveProperty('price');
    expect(res.body.data).toHaveProperty('description');
    expect(res.body.data).toHaveProperty('inStock');
  });

  it('GET /api/products/:id should indicate product is in stock', async () => {
    const res = await request(app)
      .get('/api/products/999')
      .expect(200);
    
    expect(res.body.data.inStock).toBe(true);
  });
});

describe('Order Endpoints', () => {
  it('POST /api/orders should create new order', async () => {
    const res = await request(app)
      .post('/api/orders')
      .expect(201);
    
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('orderId');
    expect(res.body).toHaveProperty('status', 'pending');
    expect(res.body).toHaveProperty('totalAmount', 299.99);
    expect(res.body).toHaveProperty('createdAt');
  });

  it('POST /api/orders should generate unique orderId', async () => {
    const res1 = await request(app).post('/api/orders').expect(201);
    const res2 = await request(app).post('/api/orders').expect(201);
    
    expect(res1.body.orderId).not.toBe(res2.body.orderId);
  });

  it('GET /api/orders/:id should return order details', async () => {
    const res = await request(app)
      .get('/api/orders/12345')
      .expect(200);
    
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('orderId', '12345');
    expect(res.body.data).toHaveProperty('status', 'processing');
    expect(res.body.data).toHaveProperty('items', 3);
    expect(res.body.data).toHaveProperty('totalAmount', 299.99);
  });
});

describe('Error Handling', () => {
  it('should return 404 for non-existent endpoint', async () => {
    const res = await request(app)
      .get('/api/nonexistent')
      .expect(404);
    
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error', 'Endpoint not found');
    expect(res.body).toHaveProperty('path', '/api/nonexistent');
  });

  it('should return 404 for random path', async () => {
    const res = await request(app)
      .get('/random/path/that/does/not/exist')
      .expect(404);
    
    expect(res.body.success).toBe(false);
  });
});

// ==================== REGRESSION TESTS ====================

describe('Regression Tests - API Consistency', () => {
  it('should consistently return same product list', async () => {
    const res1 = await request(app).get('/api/products').expect(200);
    const res2 = await request(app).get('/api/products').expect(200);
    
    expect(res1.body.data).toEqual(res2.body.data);
  });

  it('should maintain backward compatibility for /api endpoint', async () => {
    const res = await request(app).get('/api').expect(200);
    
    // These should never change
    expect(res.body.message).toBeDefined();
    expect(res.body.version).toBeDefined();
    expect(res.body.endpoints).toBeDefined();
    expect(typeof res.body.message).toBe('string');
  });

  it('should maintain health check format consistency', async () => {
    const res1 = await request(app).get('/health').expect(200);
    const res2 = await request(app).get('/health').expect(200);
    
    // Same keys should exist in both responses
    expect(Object.keys(res1.body).sort()).toEqual(Object.keys(res2.body).sort());
  });

  it('should return consistent product pricing', async () => {
    const res = await request(app).get('/api/products').expect(200);
    
    const product1 = res.body.data.find(p => p.id === 1);
    expect(product1.price).toBe(99.99);
    
    const product2 = res.body.data.find(p => p.id === 2);
    expect(product2.price).toBe(49.99);
  });

  it('should not break when called rapidly', async () => {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(request(app).get('/api/products').expect(200));
    }
    
    const results = await Promise.all(promises);
    results.forEach(res => {
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(3);
    });
  });
});

describe('Regression Tests - Content Types', () => {
  it('should return JSON content type for API endpoints', async () => {
    const res = await request(app).get('/api').expect(200);
    
    expect(res.headers['content-type']).toContain('application/json');
  });

  it('should return correct content type for health endpoint', async () => {
    const res = await request(app).get('/health').expect(200);
    
    expect(res.headers['content-type']).toContain('application/json');
  });
});

describe('Regression Tests - HTTP Methods', () => {
  it('should allow GET on products endpoint', async () => {
    await request(app).get('/api/products').expect(200);
  });

  it('should allow POST on orders endpoint', async () => {
    await request(app).post('/api/orders').expect(201);
  });

  it('should reject unexpected HTTP methods appropriately', async () => {
    const res = await request(app)
      .put('/api/products')
      .expect(404); // Should not have PUT route
    
    expect(res.body.success).toBe(false);
  });
});
