/**
 * server.js - Admin microservice entry point
 * Starts the Express server, initializes the database, and sets up middleware and routes for the admin service
 */

const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./setup');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'admin-service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Mount admin routes
app.use('/api/admin', adminRoutes);

// 404 handler - catch all undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.path}`,
    availableRoutes: [
      'GET /health',
      'POST /api/admin/events',
      'GET /api/admin/events',
      'GET /api/admin/events/:id',
      'PUT /api/admin/events/:id',
      'DELETE /api/admin/events/:id'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

/**
 * Start the server
 * First initializes the database, then starts listening for requests
 */
const startServer = async () => {
  try {
    console.log('=================================');
    console.log('TigerTix Admin Service');
    console.log('=================================');
    
    // Initialize database before starting server
    console.log('\n📦 Initializing database...');
    await initializeDatabase();
    console.log('✓ Database ready\n');
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Admin service running on http://localhost:${PORT}`);
      console.log(`📋 API endpoints available at http://localhost:${PORT}/api/admin`);
      console.log(`❤️  Health check: http://localhost:${PORT}/health`);
      console.log('\n✓ Server is ready to accept requests\n');
      console.log('=================================\n');
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;