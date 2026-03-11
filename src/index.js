const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database connection simulation
const connectDB = () => {
  console.log('Database connection initialized...');
};

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date(),
    env: NODE_ENV,
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to Sales Portal API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      products: '/api/products',
      orders: '/api/orders',
      users: '/api/users'
    }
  });
});

// Product endpoints (mock)
app.get('/api/products', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: 'Product 1', price: 99.99, category: 'Electronics' },
      { id: 2, name: 'Product 2', price: 49.99, category: 'Accessories' },
      { id: 3, name: 'Product 3', price: 199.99, category: 'Home' }
    ]
  });
});

app.get('/api/products/:id', (req, res) => {
  res.json({
    success: true,
    data: { 
      id: req.params.id, 
      name: 'Product ' + req.params.id, 
      price: 99.99,
      description: 'High-quality product',
      inStock: true
    }
  });
});

// Order endpoints (mock)
app.post('/api/orders', (req, res) => {
  res.status(201).json({
    success: true,
    orderId: Math.random().toString(36).substr(2, 9),
    status: 'pending',
    totalAmount: 299.99,
    createdAt: new Date()
  });
});

app.get('/api/orders/:id', (req, res) => {
  res.json({
    success: true,
    data: {
      orderId: req.params.id,
      status: 'processing',
      items: 3,
      totalAmount: 299.99,
      createdAt: new Date()
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    error: NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Connect to database
connectDB();

// Start server only if this is the main module
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`
      ========================================
      Sales Portal API Server Started
      ========================================
      Port:        ${PORT}
      Environment: ${NODE_ENV}
      Time:        ${new Date()}
      ========================================
    `);
  });
}

module.exports = app;
