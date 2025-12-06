/**
 * PDF 处理路由
 * 提供 PDF 拆分和合并功能
 */

const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');
const db = require('../database/db');

/**
 * PDF 拆分 - 按页码范围
 * POST /api/pdf/split
 * Body: { fileId, mode: 'pages', ranges: [[1,5], [6,10]] }
 */
router.post('/split', async (req, res) => {
  try {
    const { fileId, mode, ranges, outputName } = req.body;

    // 验证参数
    if (!fileId || !mode) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数：fileId 和 mode'
      });
    }

    // 获取文件信息
    const file = db.getFileById(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    // 检查是否为 PDF 文件
    if (!file.original_name.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({
        success: false,
        message: '只支持 PDF 文件'
      });
    }

    // 创建输出目录
    const timestamp = Date.now();
    const outputDir = path.join(__dirname, '../../uploads/split', `${fileId}_${timestamp}`);
    await fs.mkdir(outputDir, { recursive: true });

    // 准备 Python 脚本参数
    const scriptPath = path.join(__dirname, '../../python-scripts/pdf_split.py');
    const inputPath = file.file_path;

    let pythonArgs = [scriptPath, inputPath, outputDir, mode];

    if (mode === 'pages') {
      if (!ranges || !Array.isArray(ranges) || ranges.length === 0) {
        return res.status(400).json({
          success: false,
          message: '页码模式需要提供 ranges 参数'
        });
      }
      // 添加页码范围参数，如 "1-5" "6-10"
      ranges.forEach(range => {
        pythonArgs.push(`${range[0]}-${range[1]}`);
      });
    }

    logger.info(`执行 PDF 拆分: ${inputPath}, 模式: ${mode}`);

    // 调用 Python 脚本
    const pythonProcess = spawn('python', pythonArgs);

    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    pythonProcess.on('close', async (code) => {
      if (code !== 0) {
        logger.error(`PDF 拆分失败: ${errorData}`);
        return res.status(500).json({
          success: false,
          message: 'PDF 拆分失败',
          error: errorData
        });
      }

      try {
        const result = JSON.parse(outputData);
        
        // 将拆分的文件添加到数据库
        if (result.success && result.results) {
          for (const splitFile of result.results) {
            const fileName = path.basename(splitFile.file);
            db.createFile({
              original_name: fileName,
              file_path: splitFile.file,
              relative_path: `split/${fileId}_${timestamp}/${fileName}`,
              file_type: 'application/pdf',
              size: (await fs.stat(splitFile.file)).size,
              status: 'completed'
            });
          }
        }

        logger.info(`PDF 拆分成功，生成 ${result.total_splits} 个文件`);

        res.json({
          success: true,
          message: `成功拆分为 ${result.total_splits} 个文件`,
          data: result
        });

      } catch (parseError) {
        logger.error(`解析 Python 输出失败: ${parseError.message}`);
        res.status(500).json({
          success: false,
          message: '处理结果失败',
          error: parseError.message
        });
      }
    });

  } catch (error) {
    logger.error(`PDF 拆分错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * PDF 合并
 * POST /api/pdf/merge
 * Body: { fileIds: [1, 2, 3], outputName: 'merged.pdf' }
 */
router.post('/merge', async (req, res) => {
  try {
    const { fileIds, outputName } = req.body;

    // 验证参数
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: '至少需要选择 2 个文件进行合并'
      });
    }

    // 获取所有文件信息
    const files = fileIds.map(id => db.getFileById(id)).filter(f => f);

    if (files.length !== fileIds.length) {
      return res.status(404).json({
        success: false,
        message: '部分文件不存在'
      });
    }

    // 检查所有文件都是 PDF
    const nonPdfFiles = files.filter(f => !f.original_name.toLowerCase().endsWith('.pdf'));
    if (nonPdfFiles.length > 0) {
      return res.status(400).json({
        success: false,
        message: '只支持 PDF 文件合并'
      });
    }

    // 创建输出文件路径
    const timestamp = Date.now();
    const safeOutputName = outputName || `merged_${timestamp}.pdf`;
    const outputDir = path.join(__dirname, '../../uploads/merged');
    await fs.mkdir(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, safeOutputName);

    // 准备 Python 脚本参数
    const scriptPath = path.join(__dirname, '../../python-scripts/pdf_merge.py');
    const inputPaths = files.map(f => f.file_path);

    const pythonArgs = [scriptPath, outputPath, ...inputPaths];

    logger.info(`执行 PDF 合并: ${fileIds.length} 个文件`);

    // 调用 Python 脚本
    const pythonProcess = spawn('python', pythonArgs);

    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    pythonProcess.on('close', async (code) => {
      if (code !== 0) {
        logger.error(`PDF 合并失败: ${errorData}`);
        return res.status(500).json({
          success: false,
          message: 'PDF 合并失败',
          error: errorData
        });
      }

      try {
        const result = JSON.parse(outputData);

        if (result.success) {
          // 将合并的文件添加到数据库
          const fileStats = await fs.stat(outputPath);
          const newFile = db.createFile({
            original_name: safeOutputName,
            file_path: outputPath,
            relative_path: `merged/${safeOutputName}`,
            file_type: 'application/pdf',
            size: fileStats.size,
            status: 'completed'
          });

          logger.info(`PDF 合并成功: ${safeOutputName}`);

          res.json({
            success: true,
            message: 'PDF 合并成功',
            data: {
              ...result,
              fileId: newFile.id,
              fileName: safeOutputName
            }
          });
        } else {
          res.status(500).json(result);
        }

      } catch (parseError) {
        logger.error(`解析 Python 输出失败: ${parseError.message}`);
        res.status(500).json({
          success: false,
          message: '处理结果失败',
          error: parseError.message
        });
      }
    });

  } catch (error) {
    logger.error(`PDF 合并错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * 获取 PDF 信息
 * GET /api/pdf/info/:fileId
 */
router.get('/info/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = db.getFileById(fileId);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    if (!file.original_name.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({
        success: false,
        message: '不是 PDF 文件'
      });
    }

    // 使用 Python 获取 PDF 信息
    const scriptPath = path.join(__dirname, '../../python-scripts/pdf_info.py');
    const pythonArgs = [scriptPath, file.file_path];

    const pythonProcess = spawn('python', pythonArgs);

    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        logger.error(`获取 PDF 信息失败: ${errorData}`);
        return res.status(500).json({
          success: false,
          message: '获取 PDF 信息失败',
          error: errorData
        });
      }

      try {
        const result = JSON.parse(outputData);
        res.json({
          success: true,
          data: result
        });
      } catch (parseError) {
        res.status(500).json({
          success: false,
          message: '解析结果失败',
          error: parseError.message
        });
      }
    });

  } catch (error) {
    logger.error(`获取 PDF 信息错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
});

module.exports = router;

