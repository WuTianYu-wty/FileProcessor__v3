const express = require('express');
const router = express.Router();
const db = require('../database/db');
const logger = require('../utils/logger');

// GET /api/logs - Get recent logs
router.get('/', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = db.getRecentLogs(limit);
    
    res.json({
      success: true,
      data: logs,
      count: logs.length
    });
  } catch (error) {
    logger.error('Error fetching logs', {
      module: 'logRoutes',
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/logs - Create log entry
router.post('/', (req, res) => {
  try {
    const { level, message, module } = req.body;
    
    if (!level || !message || !module) {
      return res.status(400).json({
        success: false,
        error: 'level, message, and module are required'
      });
    }
    
    const validLevels = ['info', 'warn', 'error'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({
        success: false,
        error: `Invalid level. Must be one of: ${validLevels.join(', ')}`
      });
    }
    
    db.insertLog(level, message, module);
    
    res.json({
      success: true,
      message: 'Log entry created successfully'
    });
  } catch (error) {
    logger.error('Error creating log entry', {
      module: 'logRoutes',
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/logs/retention-check - Check data retention
router.get('/retention-check', (req, res) => {
  try {
    const oldFilesCount = db.checkDataRetention();
    
    res.json({
      success: true,
      data: {
        oldFilesCount: oldFilesCount,
        retentionDays: parseInt(db.getSetting('retention_days') || '7')
      }
    });
  } catch (error) {
    logger.error('Error checking data retention', {
      module: 'logRoutes',
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

