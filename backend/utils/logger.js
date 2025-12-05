const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, module }) => {
    return `${timestamp} [${level}] [${module || 'app'}]: ${message}`;
  })
);

// Daily rotate file transport - rotates every hour
const dailyRotateTransport = new DailyRotateFile({
  filename: path.join(logDir, 'fileprocessor-%DATE%.log'),
  datePattern: 'YYYY-MM-DD-HH', // Rotate every hour
  maxSize: '20m',
  maxFiles: '24h', // Keep logs for 24 hours
  format: logFormat,
  level: process.env.LOG_LEVEL || 'info'
});

// Error log transport
const errorRotateTransport = new DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat,
  level: 'error'
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    dailyRotateTransport,
    errorRotateTransport
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Log rotation events
dailyRotateTransport.on('rotate', (oldFilename, newFilename) => {
  logger.info(`Log rotated from ${oldFilename} to ${newFilename}`, {
    module: 'logger'
  });
});

module.exports = logger;

