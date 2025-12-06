const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

/**
 * 文档格式转换
 * POST /api/converter/convert
 */
router.post('/convert', async (req, res) => {
  const { inputPath, outputPath, extractImages } = req.body;

  if (!inputPath || !outputPath) {
    return res.status(400).json({
      success: false,
      error: '缺少必需参数: inputPath, outputPath'
    });
  }

  try {
    // 检查输入文件是否存在
    await fs.access(inputPath);
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: `输入文件不存在: ${inputPath}`
    });
  }

  const pythonScript = path.join(__dirname, '../../python-scripts/document_converter.py');
  const args = [pythonScript, inputPath, outputPath];
  
  if (extractImages) {
    args.push('--extract-images');
  }

  const python = spawn('python', args);

  let stdout = '';
  let stderr = '';

  python.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  python.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  python.on('close', (code) => {
    if (code !== 0) {
      logger.error(`文档转换失败: ${stderr}`);
      return res.status(500).json({
        success: false,
        error: `文档转换失败: ${stderr || '未知错误'}`
      });
    }

    try {
      const result = JSON.parse(stdout);
      logger.info(`文档转换成功: ${inputPath} -> ${outputPath}`);
      res.json(result);
    } catch (err) {
      logger.error(`解析 Python 输出失败: ${err.message}`);
      res.status(500).json({
        success: false,
        error: '解析处理结果失败',
        stdout,
        stderr
      });
    }
  });
});

/**
 * PDF 转 Word
 * POST /api/converter/pdf-to-word
 */
router.post('/pdf-to-word', async (req, res) => {
  const { inputPath, outputPath, extractImages } = req.body;

  if (!inputPath) {
    return res.status(400).json({
      success: false,
      error: '缺少必需参数: inputPath'
    });
  }

  // 自动生成输出路径
  const output = outputPath || inputPath.replace(/\.pdf$/i, '.docx');

  req.body.outputPath = output;
  
  // 转发到通用转换接口
  return router.handle(Object.assign(req, { url: '/convert', method: 'POST' }), res);
});

/**
 * Word 转 PDF
 * POST /api/converter/word-to-pdf
 */
router.post('/word-to-pdf', async (req, res) => {
  const { inputPath, outputPath } = req.body;

  if (!inputPath) {
    return res.status(400).json({
      success: false,
      error: '缺少必需参数: inputPath'
    });
  }

  const output = outputPath || inputPath.replace(/\.docx?$/i, '.pdf');

  req.body.outputPath = output;
  
  return router.handle(Object.assign(req, { url: '/convert', method: 'POST' }), res);
});

/**
 * Excel 转 PDF
 * POST /api/converter/excel-to-pdf
 */
router.post('/excel-to-pdf', async (req, res) => {
  const { inputPath, outputPath } = req.body;

  if (!inputPath) {
    return res.status(400).json({
      success: false,
      error: '缺少必需参数: inputPath'
    });
  }

  const output = outputPath || inputPath.replace(/\.xlsx?$/i, '.pdf');

  req.body.outputPath = output;
  
  return router.handle(Object.assign(req, { url: '/convert', method: 'POST' }), res);
});

/**
 * PowerPoint 转 PDF
 * POST /api/converter/ppt-to-pdf
 */
router.post('/ppt-to-pdf', async (req, res) => {
  const { inputPath, outputPath } = req.body;

  if (!inputPath) {
    return res.status(400).json({
      success: false,
      error: '缺少必需参数: inputPath'
    });
  }

  const output = outputPath || inputPath.replace(/\.pptx?$/i, '.pdf');

  req.body.outputPath = output;
  
  return router.handle(Object.assign(req, { url: '/convert', method: 'POST' }), res);
});

/**
 * 批量转换
 * POST /api/converter/batch
 */
router.post('/batch', async (req, res) => {
  const { conversions } = req.body;

  if (!conversions || !Array.isArray(conversions)) {
    return res.status(400).json({
      success: false,
      error: 'conversions 必须是一个数组'
    });
  }

  const results = [];

  for (const conversion of conversions) {
    const { inputPath, outputPath, extractImages } = conversion;
    
    try {
      const pythonScript = path.join(__dirname, '../../python-scripts/document_converter.py');
      const args = [pythonScript, inputPath, outputPath];
      
      if (extractImages) {
        args.push('--extract-images');
      }

      const result = await new Promise((resolve, reject) => {
        const python = spawn('python', args);
        let stdout = '';
        let stderr = '';

        python.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        python.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        python.on('close', (code) => {
          if (code !== 0) {
            resolve({
              inputPath,
              outputPath,
              success: false,
              error: stderr || '转换失败'
            });
          } else {
            try {
              const result = JSON.parse(stdout);
              resolve({
                inputPath,
                outputPath,
                ...result
              });
            } catch (err) {
              resolve({
                inputPath,
                outputPath,
                success: false,
                error: '解析结果失败'
              });
            }
          }
        });
      });

      results.push(result);
      
    } catch (error) {
      results.push({
        inputPath,
        outputPath,
        success: false,
        error: error.message
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failCount = results.length - successCount;

  logger.info(`批量转换完成: 成功 ${successCount}, 失败 ${failCount}`);

  res.json({
    success: failCount === 0,
    total: results.length,
    successCount,
    failCount,
    results
  });
});

module.exports = router;

