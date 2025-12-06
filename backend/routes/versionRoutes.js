const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const logger = require('../utils/logger');

const dbPath = path.join(__dirname, '../data/fileprocessor.db');
const db = new Database(dbPath);

// 确保版本表存在
function ensureVersionTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS file_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_id INTEGER NOT NULL,
      version_number INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      checksum TEXT,
      comment TEXT,
      created_by TEXT DEFAULT 'system',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_current BOOLEAN DEFAULT 1,
      FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
    )
  `);
}

ensureVersionTable();

/**
 * 计算文件MD5校验和
 */
async function calculateChecksum(filePath) {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const hashSum = crypto.createHash('md5');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  } catch (error) {
    logger.error(`计算校验和失败: ${error.message}`);
    return null;
  }
}

/**
 * 创建新版本
 * POST /api/versions/create
 */
router.post('/create', async (req, res) => {
  const { fileId, filePath, comment, createdBy } = req.body;

  if (!fileId || !filePath) {
    return res.status(400).json({
      success: false,
      error: '缺少必需参数: fileId, filePath'
    });
  }

  try {
    // 检查文件是否存在
    const stats = await fs.stat(filePath);
    const fileSize = stats.size;

    // 计算校验和
    const checksum = await calculateChecksum(filePath);

    // 获取当前最大版本号
    const maxVersionStmt = db.prepare('SELECT MAX(version_number) as max_version FROM file_versions WHERE file_id = ?');
    const maxVersionRow = maxVersionStmt.get(fileId);
    const newVersionNumber = (maxVersionRow?.max_version || 0) + 1;

    // 标记所有旧版本为非当前版本
    const updateOldVersions = db.prepare('UPDATE file_versions SET is_current = 0 WHERE file_id = ?');
    updateOldVersions.run(fileId);

    // 插入新版本
    const insertVersion = db.prepare(`
      INSERT INTO file_versions (file_id, version_number, file_path, file_size, checksum, comment, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertVersion.run(
      fileId,
      newVersionNumber,
      filePath,
      fileSize,
      checksum,
      comment || '',
      createdBy || 'system'
    );

    logger.info(`创建文件版本: fileId=${fileId}, version=${newVersionNumber}`);

    res.json({
      success: true,
      message: '版本创建成功',
      version: {
        id: result.lastInsertRowid,
        fileId,
        versionNumber: newVersionNumber,
        filePath,
        fileSize,
        checksum,
        comment,
        createdBy: createdBy || 'system'
      }
    });

  } catch (error) {
    logger.error(`创建版本失败: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取文件的所有版本
 * GET /api/versions/:fileId
 */
router.get('/:fileId', (req, res) => {
  const { fileId } = req.params;

  try {
    const stmt = db.prepare('SELECT * FROM file_versions WHERE file_id = ? ORDER BY version_number DESC');
    const versions = stmt.all(fileId);

    res.json({
      success: true,
      fileId: parseInt(fileId),
      total: versions.length,
      versions
    });

  } catch (error) {
    logger.error(`获取版本列表失败: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取特定版本详情
 * GET /api/versions/:fileId/:versionNumber
 */
router.get('/:fileId/:versionNumber', (req, res) => {
  const { fileId, versionNumber } = req.params;

  try {
    const stmt = db.prepare('SELECT * FROM file_versions WHERE file_id = ? AND version_number = ?');
    const version = stmt.get(fileId, versionNumber);

    if (!version) {
      return res.status(404).json({
        success: false,
        error: '版本不存在'
      });
    }

    res.json({
      success: true,
      version
    });

  } catch (error) {
    logger.error(`获取版本详情失败: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 还原到指定版本
 * POST /api/versions/restore
 */
router.post('/restore', async (req, res) => {
  const { fileId, versionNumber } = req.body;

  if (!fileId || !versionNumber) {
    return res.status(400).json({
      success: false,
      error: '缺少必需参数: fileId, versionNumber'
    });
  }

  try {
    // 获取指定版本
    const getVersionStmt = db.prepare('SELECT * FROM file_versions WHERE file_id = ? AND version_number = ?');
    const version = getVersionStmt.get(fileId, versionNumber);

    if (!version) {
      return res.status(404).json({
        success: false,
        error: '版本不存在'
      });
    }

    // 检查版本文件是否存在
    try {
      await fs.access(version.file_path);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: '版本文件已丢失'
      });
    }

    // 获取当前文件信息
    const getFileStmt = db.prepare('SELECT * FROM files WHERE id = ?');
    const currentFile = getFileStmt.get(fileId);

    if (!currentFile) {
      return res.status(404).json({
        success: false,
        error: '文件不存在'
      });
    }

    // 备份当前文件（创建新版本）
    const currentFileExists = await fs.access(currentFile.file_path).then(() => true).catch(() => false);
    if (currentFileExists) {
      const stats = await fs.stat(currentFile.file_path);
      const checksum = await calculateChecksum(currentFile.file_path);
      
      const maxVersionStmt = db.prepare('SELECT MAX(version_number) as max_version FROM file_versions WHERE file_id = ?');
      const maxVersionRow = maxVersionStmt.get(fileId);
      const newVersionNumber = (maxVersionRow?.max_version || 0) + 1;

      const insertBackup = db.prepare(`
        INSERT INTO file_versions (file_id, version_number, file_path, file_size, checksum, comment, created_by, is_current)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertBackup.run(
        fileId,
        newVersionNumber,
        currentFile.file_path,
        stats.size,
        checksum,
        `还原前的备份 (从版本 ${versionNumber} 还原)`,
        'system',
        0
      );
    }

    // 复制版本文件到当前文件路径
    await fs.copyFile(version.file_path, currentFile.file_path);

    // 标记所有版本为非当前版本
    const updateOldVersions = db.prepare('UPDATE file_versions SET is_current = 0 WHERE file_id = ?');
    updateOldVersions.run(fileId);

    // 标记还原的版本为当前版本
    const markCurrentStmt = db.prepare('UPDATE file_versions SET is_current = 1 WHERE file_id = ? AND version_number = ?');
    markCurrentStmt.run(fileId, versionNumber);

    logger.info(`还原文件版本: fileId=${fileId}, version=${versionNumber}`);

    res.json({
      success: true,
      message: `成功还原到版本 ${versionNumber}`,
      restoredVersion: version
    });

  } catch (error) {
    logger.error(`还原版本失败: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 删除指定版本
 * DELETE /api/versions/:fileId/:versionNumber
 */
router.delete('/:fileId/:versionNumber', async (req, res) => {
  const { fileId, versionNumber } = req.params;

  try {
    // 获取版本信息
    const getVersionStmt = db.prepare('SELECT * FROM file_versions WHERE file_id = ? AND version_number = ?');
    const version = getVersionStmt.get(fileId, versionNumber);

    if (!version) {
      return res.status(404).json({
        success: false,
        error: '版本不存在'
      });
    }

    // 不允许删除当前版本
    if (version.is_current) {
      return res.status(400).json({
        success: false,
        error: '不能删除当前版本'
      });
    }

    // 删除版本文件
    try {
      await fs.unlink(version.file_path);
    } catch (error) {
      logger.warn(`删除版本文件失败: ${error.message}`);
    }

    // 从数据库删除版本记录
    const deleteStmt = db.prepare('DELETE FROM file_versions WHERE file_id = ? AND version_number = ?');
    deleteStmt.run(fileId, versionNumber);

    logger.info(`删除文件版本: fileId=${fileId}, version=${versionNumber}`);

    res.json({
      success: true,
      message: `版本 ${versionNumber} 已删除`
    });

  } catch (error) {
    logger.error(`删除版本失败: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 清理旧版本（保留最近N个版本）
 * POST /api/versions/cleanup
 */
router.post('/cleanup', async (req, res) => {
  const { fileId, keepCount } = req.body;

  if (!fileId) {
    return res.status(400).json({
      success: false,
      error: '缺少必需参数: fileId'
    });
  }

  const keep = keepCount || 5;

  try {
    // 获取要删除的版本（排除最新的N个和当前版本）
    const getOldVersionsStmt = db.prepare(`
      SELECT * FROM file_versions 
      WHERE file_id = ? AND is_current = 0
      ORDER BY version_number DESC
      LIMIT -1 OFFSET ?
    `);
    const oldVersions = getOldVersionsStmt.all(fileId, keep);

    let deletedCount = 0;

    for (const version of oldVersions) {
      try {
        await fs.unlink(version.file_path);
      } catch (error) {
        logger.warn(`删除版本文件失败: ${error.message}`);
      }

      const deleteStmt = db.prepare('DELETE FROM file_versions WHERE id = ?');
      deleteStmt.run(version.id);
      deletedCount++;
    }

    logger.info(`清理旧版本: fileId=${fileId}, deleted=${deletedCount}`);

    res.json({
      success: true,
      message: `清理完成，删除了 ${deletedCount} 个旧版本`,
      deletedCount,
      kept: keep
    });

  } catch (error) {
    logger.error(`清理旧版本失败: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 比较两个版本
 * GET /api/versions/compare/:fileId/:version1/:version2
 */
router.get('/compare/:fileId/:version1/:version2', async (req, res) => {
  const { fileId, version1, version2 } = req.params;

  try {
    const stmt = db.prepare('SELECT * FROM file_versions WHERE file_id = ? AND version_number IN (?, ?)');
    const versions = stmt.all(fileId, version1, version2);

    if (versions.length !== 2) {
      return res.status(404).json({
        success: false,
        error: '版本不存在'
      });
    }

    const v1 = versions.find(v => v.version_number == version1);
    const v2 = versions.find(v => v.version_number == version2);

    const comparison = {
      fileId: parseInt(fileId),
      version1: {
        number: v1.version_number,
        size: v1.file_size,
        checksum: v1.checksum,
        createdAt: v1.created_at,
        comment: v1.comment
      },
      version2: {
        number: v2.version_number,
        size: v2.file_size,
        checksum: v2.checksum,
        createdAt: v2.created_at,
        comment: v2.comment
      },
      differences: {
        sizeChange: v2.file_size - v1.file_size,
        sameContent: v1.checksum === v2.checksum,
        timeDiff: new Date(v2.created_at) - new Date(v1.created_at)
      }
    };

    res.json({
      success: true,
      comparison
    });

  } catch (error) {
    logger.error(`比较版本失败: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

