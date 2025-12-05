const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');
const db = require('./database/db');
const fileRoutes = require('./routes/fileRoutes');
const logRoutes = require('./routes/logRoutes');
const exportRoutes = require('./routes/exportRoutes');

// Load environment variables
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '5gb' }));
app.use(express.urlencoded({ extended: true, limit: '5gb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    module: 'server',
    ip: req.ip
  });
  next();
});

// Routes
app.use('/api/files', fileRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/export', exportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.message, {
    module: 'server',
    stack: err.stack
  });
  
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// Initialize database and start server
function startServer() {
  try {
    // Initialize database tables
    db.initialize();
    logger.info('Database initialized successfully', { module: 'server' });
    
    // Start listening
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${NODE_ENV} mode`, {
        module: 'server'
      });
      console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${NODE_ENV}`);
      console.log(`📁 Upload directory: ${path.resolve(__dirname, '../uploads')}\n`);
    });
    
    // Check for data retention alerts
    setTimeout(() => {
      db.checkDataRetention();
    }, 5000);
    
  } catch (error) {
    logger.error('Failed to start server', {
      module: 'server',
      error: error.message
    });
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully', { module: 'server' });
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully', { module: 'server' });
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;

