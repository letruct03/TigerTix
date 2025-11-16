/**
 * server.js - User Authentication microservice entry point
 * Starts the Express server and initializes the authentication database
 */

const express = require('express');
const cors = require('cors');
const { initializeAuthDatabase } = require('./setup');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 4001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'user-authentication',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Mount authentication routes
app.use('/api/auth', authRoutes);

// 404 handler - catch all undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.path}`,
    availableRoutes: [
      'GET /health',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/auth/refresh',
      'POST /api/auth/logout',
      'GET /api/auth/me',
      'POST /api/auth/logout-all'
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
    console.log('TigerTix Authentication Service');
    console.log('=================================');
    
    // Initialize authentication database
    console.log('\n📦 Initializing authentication database...');
    await initializeAuthDatabase();
    console.log('✓ Authentication database ready\n');
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Authentication service running on http://localhost:${PORT}`);
      console.log(`📋 API endpoints available at http://localhost:${PORT}/api/auth`);
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
