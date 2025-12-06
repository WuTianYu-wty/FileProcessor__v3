/**
 * 文件预览路由
 * 提供文件预览功能（PDF、图片、文本）
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');
const db = require('../database/db');

/**
 * 预览文件
 * GET /api/preview/:fileId
 */
router.get('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;

    // 获取文件信息
    const file = db.getFileById(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    if (file.is_deleted) {
      return res.status(404).json({
        success: false,
        message: '文件已删除'
      });
    }

    // 检查文件是否存在
    try {
      await fs.access(file.file_path);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: '文件不存在于服务器'
      });
    }

    // 获取文件扩展名
    const ext = path.extname(file.original_name).toLowerCase();

    // 根据文件类型设置 Content-Type
    let contentType = 'application/octet-stream';
    
    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (['.jpg', '.jpeg'].includes(ext)) {
      contentType = 'image/jpeg';
    } else if (ext === '.png') {
      contentType = 'image/png';
    } else if (ext === '.gif') {
      contentType = 'image/gif';
    } else if (ext === '.bmp') {
      contentType = 'image/bmp';
    } else if (ext === '.txt') {
      contentType = 'text/plain; charset=utf-8';
    } else if (ext === '.json') {
      contentType = 'application/json';
    } else if (['.doc', '.docx'].includes(ext)) {
      contentType = 'application/msword';
    }

    // 设置响应头
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.original_name)}"`);

    // 发送文件
    const fileContent = await fs.readFile(file.file_path);
    res.send(fileContent);

    logger.info(`文件预览: ${file.original_name}`);

  } catch (error) {
    logger.error(`文件预览错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '预览失败',
      error: error.message
    });
  }
});

/**
 * 获取文件缩略图（仅支持图片）
 * GET /api/preview/thumbnail/:fileId
 */
router.get('/thumbnail/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { width = 200, height = 200 } = req.query;

    // 获取文件信息
    const file = db.getFileById(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    // 检查是否为图片文件
    const ext = path.extname(file.original_name).toLowerCase();
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
    
    if (!imageExts.includes(ext)) {
      return res.status(400).json({
        success: false,
        message: '只支持图片文件生成缩略图'
      });
    }

    // 对于缩略图功能，这里简化处理，直接返回原图
    // 实际生产环境可以使用 sharp 等库生成真正的缩略图
    const fileContent = await fs.readFile(file.file_path);
    
    let contentType = 'image/jpeg';
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.bmp') contentType = 'image/bmp';

    res.setHeader('Content-Type', contentType);
    res.send(fileContent);

  } catch (error) {
    logger.error(`生成缩略图错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '生成缩略图失败',
      error: error.message
    });
  }
});

/**
 * 获取文本文件内容
 * GET /api/preview/text/:fileId
 */
router.get('/text/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;

    // 获取文件信息
    const file = db.getFileById(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    // 检查是否为文本文件
    const ext = path.extname(file.original_name).toLowerCase();
    const textExts = ['.txt', '.json', '.log', '.md', '.csv'];
    
    if (!textExts.includes(ext)) {
      return res.status(400).json({
        success: false,
        message: '只支持文本文件'
      });
    }

    // 读取文件内容
    const content = await fs.readFile(file.file_path, 'utf-8');

    res.json({
      success: true,
      data: {
        fileName: file.original_name,
        content: content,
        size: file.size,
        lines: content.split('\n').length
      }
    });

  } catch (error) {
    logger.error(`读取文本文件错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '读取文件失败',
      error: error.message
    });
  }
});

module.exports = router;

