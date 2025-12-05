// 文件导出路由 - 支持按目录结构打包下载
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const db = require('../database/db');
const logger = require('../utils/logger');

// POST /api/export/folder - 导出文件夹（保持目录结构）
router.post('/folder', async (req, res) => {
  try {
    const { fileIds } = req.body;
    
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请选择要导出的文件'
      });
    }
    
    // 获取文件信息
    const files = fileIds.map(id => db.getFileById(id)).filter(f => f);
    
    if (files.length === 0) {
      return res.status(404).json({
        success: false,
        error: '未找到文件'
      });
    }
    
    // 创建 ZIP 文件
    const archive = archiver('zip', {
      zlib: { level: 9 } // 最高压缩级别
    });
    
    // 设置响应头
    const zipFileName = `导出文件_${Date.now()}.zip`;
    res.attachment(zipFileName);
    res.setHeader('Content-Type', 'application/zip');
    
    // 将 archive 管道到响应
    archive.pipe(res);
    
    // 添加文件到 ZIP，保持目录结构
    files.forEach(file => {
      if (fs.existsSync(file.file_path)) {
        // 使用 relative_path 保持目录结构，如果没有则使用原始文件名
        const entryName = file.relative_path || file.original_name;
        archive.file(file.file_path, { name: entryName });
      } else {
        logger.warn(`文件不存在: ${file.file_path}`, {
          module: 'exportRoutes',
          fileId: file.id
        });
      }
    });
    
    // 完成打包
    archive.finalize();
    
    logger.info(`导出 ${files.length} 个文件`, {
      module: 'exportRoutes',
      fileIds: fileIds
    });
    
  } catch (error) {
    logger.error('导出文件失败', {
      module: 'exportRoutes',
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/export/all - 导出所有文件
router.get('/all', async (req, res) => {
  try {
    const files = db.getAllFiles(false);
    
    if (files.length === 0) {
      return res.status(404).json({
        success: false,
        error: '没有文件可导出'
      });
    }
    
    // 创建 ZIP 文件
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
    
    const zipFileName = `所有文件_${Date.now()}.zip`;
    res.attachment(zipFileName);
    res.setHeader('Content-Type', 'application/zip');
    
    archive.pipe(res);
    
    files.forEach(file => {
      if (fs.existsSync(file.file_path)) {
        const entryName = file.relative_path || file.original_name;
        archive.file(file.file_path, { name: entryName });
      }
    });
    
    archive.finalize();
    
    logger.info(`导出所有文件 (${files.length} 个)`, {
      module: 'exportRoutes'
    });
    
  } catch (error) {
    logger.error('导出所有文件失败', {
      module: 'exportRoutes',
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;



