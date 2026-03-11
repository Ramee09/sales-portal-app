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

// ==================== FUNCTIONAL TESTS ====================

describe('Functional Tests - Input Validation', () => {
  it('should handle product ID as string parameter', async () => {
    const res = await request(app)
      .get('/api/products/abc123')
      .expect(200);
    
    expect(res.body.data.id).toBe('abc123');
    expect(res.body.data.name).toBe('Product abc123');
  });

  it('should handle special characters in product ID', async () => {
    const res = await request(app)
      .get('/api/products/prod-001')
      .expect(200);
    
    expect(res.body.data.id).toBe('prod-001');
  });

  it('should handle numeric product ID', async () => {
    const res = await request(app)
      .get('/api/products/999')
      .expect(200);
    
    expect(res.body.data.id).toBe('999');
  });

  it('should handle order ID with dashes and underscores', async () => {
    const res = await request(app)
      .get('/api/orders/order_2024-03-11')
      .expect(200);
    
    expect(res.body.data.orderId).toBe('order_2024-03-11');
  });
});

describe('Functional Tests - Request Body Handling', () => {
  it('POST /api/orders should accept empty body', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({})
      .expect(201);
    
    expect(res.body.success).toBe(true);
    expect(res.body.orderId).toBeDefined();
  });

  it('POST /api/orders should accept body with arbitrary data', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ 
        customField: 'test', 
        userId: 123,
        items: [{ sku: 'PROD-001', qty: 2 }]
      })
      .expect(201);
    
    expect(res.body.success).toBe(true);
  });

  it('POST /api/orders should handle large payload', async () => {
    const largePayload = {
      items: Array(100).fill({ sku: 'TEST', qty: 1, price: 99.99 })
    };
    
    const res = await request(app)
      .post('/api/orders')
      .send(largePayload)
      .expect(201);
    
    expect(res.body.success).toBe(true);
  });
});

describe('Functional Tests - Query Parameters', () => {
  it('should handle query parameters on product list', async () => {
    const res = await request(app)
      .get('/api/products?category=Electronics&minPrice=50')
      .expect(200);
    
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should handle query parameters on orders endpoint', async () => {
    const res = await request(app)
      .get('/api/orders/123?expand=details&format=json')
      .expect(200);
    
    expect(res.body.success).toBe(true);
  });

  it('should ignore invalid query parameters', async () => {
    const res = await request(app)
      .get('/api/products?invalid=param&foo=bar&test=123')
      .expect(200);
    
    expect(res.body.data.length).toBe(3);
  });
});

describe('Functional Tests - Edge Cases', () => {
  it('should handle product ID with URL encoding', async () => {
    const res = await request(app)
      .get('/api/products/my%20product')
      .expect(200);
    
    expect(res.body.data.id).toBe('my product');
  });

  it('should handle very large product ID', async () => {
    const largeId = 'x'.repeat(1000);
    const res = await request(app)
      .get(`/api/products/${largeId}`)
      .expect(200);
    
    expect(res.body.data.id.length).toBe(1000);
  });

  it('should handle numeric order IDs', async () => {
    const res = await request(app)
      .get('/api/orders/123456789')
      .expect(200);
    
    expect(res.body.data.orderId).toBe('123456789');
  });

  it('should handle zero as product ID', async () => {
    const res = await request(app)
      .get('/api/products/0')
      .expect(200);
    
    expect(res.body.data.id).toBe('0');
  });

  it('should handle negative numbers as product ID', async () => {
    const res = await request(app)
      .get('/api/products/-1')
      .expect(200);
    
    expect(res.body.data.id).toBe('-1');
  });
});

// ==================== MIDDLEWARE TESTS ====================

describe('Middleware Tests - CORS Headers', () => {
  it('should include CORS headers in response', async () => {
    const res = await request(app)
      .get('/api')
      .expect(200);
    
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });

  it('should allow requests from any origin', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'https://external-site.com')
      .expect(200);
    
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });
});

describe('Middleware Tests - Content Negotiation', () => {
  it('should handle requests with Accept header', async () => {
    const res = await request(app)
      .get('/api/products')
      .set('Accept', 'application/json')
      .expect(200);
    
    expect(res.headers['content-type']).toContain('application/json');
  });

  it('should parse JSON request bodies correctly', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Content-Type', 'application/json')
      .send({ test: 'data' })
      .expect(201);
    
    expect(res.body.success).toBe(true);
  });

  it('should parse URL-encoded request bodies', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('field1=value1&field2=value2')
      .expect(201);
    
    expect(res.body.success).toBe(true);
  });
});

describe('Middleware Tests - Error Handling', () => {
  it('should handle malformed JSON gracefully', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Content-Type', 'application/json')
      .send('{ invalid json }')
      .expect(500); // Express error middleware returns 500 for parse errors
  });

  it('should handle request with invalid headers', async () => {
    const res = await request(app)
      .get('/api/products')
      .set('X-Invalid-Header', 'test')
      .expect(200);
    
    expect(res.body.success).toBe(true);
  });
});

// ==================== PERFORMANCE TESTS ====================

describe('Performance Tests - Response Times', () => {
  it('should respond to health check within 100ms', async () => {
    const start = Date.now();
    await request(app).get('/health').expect(200);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(100);
  });

  it('should respond to products list within 100ms', async () => {
    const start = Date.now();
    await request(app).get('/api/products').expect(200);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(100);
  });

  it('should handle multiple sequential requests', async () => {
    const start = Date.now();
    for (let i = 0; i < 20; i++) {
      await request(app).get('/api/products').expect(200);
    }
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(1000); // All 20 requests in under 1 second
  });
});

describe('Performance Tests - Concurrent Load', () => {
  it('should handle 50 concurrent product requests', async () => {
    const promises = [];
    for (let i = 0; i < 50; i++) {
      promises.push(
        request(app).get('/api/products').expect(200)
      );
    }
    
    const results = await Promise.all(promises);
    results.forEach(res => {
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(3);
    });
  });

  it('should handle 50 concurrent order creations', async () => {
    const promises = [];
    for (let i = 0; i < 50; i++) {
      promises.push(
        request(app).post('/api/orders').expect(201)
      );
    }
    
    const results = await Promise.all(promises);
    const orderIds = results.map(r => r.body.orderId);
    
    // Check all order IDs are unique
    const uniqueIds = new Set(orderIds);
    expect(uniqueIds.size).toBe(50);
  });
});

// ==================== SECURITY & VALIDATION TESTS ====================

describe('Security Tests - Input Sanitization', () => {
  it('should handle script tags in product ID parameter', async () => {
    // URL encode the script tag
    const encoded = encodeURIComponent('<script>alert("xss")</script>');
    const res = await request(app)
      .get(`/api/products/${encoded}`)
      .expect(200);
    
    expect(res.body.success).toBe(true);
  });

  it('should handle SQL injection attempt in product ID', async () => {
    const res = await request(app)
      .get(`/api/products/'; DROP TABLE products; --`)
      .expect(200);
    
    expect(res.body.success).toBe(true);
  });

  it('should handle URL encoded malicious input', async () => {
    // Directly use encoded path
    const res = await request(app)
      .get('/api/products/%3Cscript%3Ealert(1)%3C%2Fscript%3E')
      .expect(200);
    
    expect(res.body.success).toBe(true);
  });

  it('should safely handle special characters in order body', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        notes: '"; DROP TABLE orders; --',
        customer: '<img src=x onerror="alert(1)">'
      })
      .expect(201);
    
    expect(res.body.success).toBe(true);
  });
});

describe('Security Tests - Rate Limiting', () => {
  it('should not rate limit normal requests', async () => {
    const requests = [];
    for (let i = 0; i < 30; i++) {
      requests.push(
        request(app).get('/api/products').expect(200)
      );
    }
    
    const results = await Promise.all(requests);
    expect(results.every(r => r.status === 200)).toBe(true);
  });
});

// ==================== INTEGRATION TESTS ====================

describe('Integration Tests - Data Consistency', () => {
  it('should return consistent product data across multiple calls', async () => {
    const calls = [];
    for (let i = 0; i < 5; i++) {
      calls.push(request(app).get('/api/products').expect(200));
    }
    
    const results = await Promise.all(calls);
    const firstData = JSON.stringify(results[0].body.data);
    
    results.forEach(res => {
      expect(JSON.stringify(res.body.data)).toBe(firstData);
    });
  });

  it('should maintain order data consistency', async () => {
    const res1 = await request(app).post('/api/orders').expect(201);
    const res2 = await request(app)
      .get(`/api/orders/${res1.body.orderId}`)
      .expect(200);
    
    expect(res2.body.data.orderId).toBe(res1.body.orderId);
  });
});

describe('Integration Tests - API Workflow', () => {
  it('should execute complete order workflow', async () => {
    // Step 1: Get all products
    const productsRes = await request(app)
      .get('/api/products')
      .expect(200);
    expect(productsRes.body.data.length).toBeGreaterThan(0);

    // Step 2: Get specific product details
    const productId = productsRes.body.data[0].id.toString();
    const detailRes = await request(app)
      .get(`/api/products/${productId}`)
      .expect(200);
    expect(detailRes.body.data.id).toBe(productId);

    // Step 3: Create an order
    const orderRes = await request(app)
      .post('/api/orders')
      .send({ productId })
      .expect(201);
    expect(orderRes.body.orderId).toBeDefined();

    // Step 4: Get order details
    const orderDetailsRes = await request(app)
      .get(`/api/orders/${orderRes.body.orderId}`)
      .expect(200);
    expect(orderDetailsRes.body.data.orderId).toBe(orderRes.body.orderId);
  });

  it('should handle check health before and after operations', async () => {
    const health1 = await request(app).get('/health').expect(200);
    expect(health1.body.status).toBe('UP');

    // Perform operations
    await request(app).get('/api/products').expect(200);
    await request(app).post('/api/orders').expect(201);

    const health2 = await request(app).get('/health').expect(200);
    expect(health2.body.status).toBe('UP');
  });
});
