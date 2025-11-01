/**
 * server.js - LLM microservice entry point
 * Provides interface for ticket booking
 */

const express = require('express');
const cors = require('cors');
const llmRoutes = require('./routes/llmRoutes');
require('dotenv').config()

const app = express();
const PORT = process.env.PORT || 7001;

/* Middleware */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* Request logging middleware */
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/* Health check endpoint */
app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'llm-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    api_key_configured: !!process.env.ANTHROPIC_API_KEY
  });
});

/* Mount LLM routes */
app.use('/api/llm', llmRoutes);

/* 404 handler */
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.path}`,
    availableRoutes: [
      'GET /health',
      'POST /api/llm/parse',
      'POST /api/llm/confirm-booking',
      'GET /api/llm/events'
    ]
  });
});

/* Global error handler */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

/* Start the server */
const startServer = () => {
  console.log('=================================');
  console.log('TigerTix LLM Service');
  console.log('=================================');
  
  /* Check for API key */
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠️  WARNING: ANTHROPIC_API_KEY not set!');
    console.warn('   The service will use keyword fallback only.');
    console.warn('   Set ANTHROPIC_API_KEY environment variable to enable LLM features.\n');
  } else {
    console.log('✓ Anthropic API key configured\n');
  }
  
  app.listen(PORT, () => {
    console.log(`🚀 LLM service running on http://localhost:${PORT}`);
    console.log(`📋 API endpoints available at http://localhost:${PORT}/api/llm`);
    console.log(`❤️  Health check: http://localhost:${PORT}/health`);
    console.log('\n✓ Server is ready to accept requests\n');
    console.log('=================================\n');
  });
};

/* Start the server */
startServer();

module.exports = app;
