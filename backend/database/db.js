const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'fileprocessor.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database tables
function initialize() {
  try {
    // Create files table
    db.exec(`
      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        relative_path TEXT,
        file_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        processed_at DATETIME,
        is_deleted BOOLEAN DEFAULT 0
      )
    `);

    // Create logs table
    db.exec(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        module TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create settings table
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // Insert default settings if not exists
    const insertSetting = db.prepare(`
      INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
    `);
    
    insertSetting.run('retention_days', '7');
    insertSetting.run('last_retention_check', new Date().toISOString());
    
    logger.info('Database tables initialized', { module: 'database' });
    
  } catch (error) {
    logger.error('Failed to initialize database', {
      module: 'database',
      error: error.message
    });
    throw error;
  }
}

// Get all files
function getAllFiles(includeDeleted = false) {
  const query = includeDeleted
    ? 'SELECT * FROM files ORDER BY created_at DESC'
    : 'SELECT * FROM files WHERE is_deleted = 0 ORDER BY created_at DESC';
  
  return db.prepare(query).all();
}

// Get file by ID
function getFileById(id) {
  return db.prepare('SELECT * FROM files WHERE id = ?').get(id);
}

// Insert new file
function insertFile(fileData) {
  const stmt = db.prepare(`
    INSERT INTO files (original_name, file_path, relative_path, file_type, size, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    fileData.original_name,
    fileData.file_path,
    fileData.relative_path || null,
    fileData.file_type,
    fileData.size,
    fileData.status || 'pending'
  );
  
  logger.info(`File inserted: ${fileData.original_name}`, {
    module: 'database',
    fileId: result.lastInsertRowid,
    relativePath: fileData.relative_path
  });
  
  return result.lastInsertRowid;
}

// Update file status
function updateFileStatus(id, status, processed_at = null) {
  const stmt = db.prepare(`
    UPDATE files 
    SET status = ?, processed_at = ?
    WHERE id = ?
  `);
  
  return stmt.run(status, processed_at || new Date().toISOString(), id);
}

// Soft delete file
function deleteFile(id) {
  const stmt = db.prepare('UPDATE files SET is_deleted = 1 WHERE id = ?');
  return stmt.run(id);
}

// Hard delete old files
function deleteOldFiles(daysOld) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const stmt = db.prepare(`
    DELETE FROM files 
    WHERE created_at < ? AND is_deleted = 1
  `);
  
  const result = stmt.run(cutoffDate.toISOString());
  
  logger.info(`Deleted ${result.changes} old files`, {
    module: 'database',
    cutoffDate: cutoffDate.toISOString()
  });
  
  return result.changes;
}

// Check data retention
function checkDataRetention() {
  const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get('retention_days');
  const retentionDays = parseInt(setting?.value || '7');
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  const oldFiles = db.prepare(`
    SELECT COUNT(*) as count 
    FROM files 
    WHERE created_at < ? AND is_deleted = 0
  `).get(cutoffDate.toISOString());
  
  if (oldFiles.count > 0) {
    logger.warn(`Found ${oldFiles.count} files older than ${retentionDays} days`, {
      module: 'database'
    });
  }
  
  return oldFiles.count;
}

// Insert log entry
function insertLog(level, message, module) {
  const stmt = db.prepare(`
    INSERT INTO logs (level, message, module)
    VALUES (?, ?, ?)
  `);
  
  return stmt.run(level, message, module);
}

// Get recent logs
function getRecentLogs(limit = 100) {
  return db.prepare(`
    SELECT * FROM logs 
    ORDER BY timestamp DESC 
    LIMIT ?
  `).all(limit);
}

// Get or update setting
function getSetting(key) {
  return db.prepare('SELECT value FROM settings WHERE key = ?').get(key)?.value;
}

function setSetting(key, value) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO settings (key, value)
    VALUES (?, ?)
  `);
  
  return stmt.run(key, value);
}

module.exports = {
  db,
  initialize,
  getAllFiles,
  getFileById,
  insertFile,
  updateFileStatus,
  deleteFile,
  deleteOldFiles,
  checkDataRetention,
  insertLog,
  getRecentLogs,
  getSetting,
  setSetting
};

