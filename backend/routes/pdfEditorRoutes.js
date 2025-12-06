const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const logger = require('../utils/logger');

// 配置文件上传（用于签名图片）
const upload = multer({
  dest: path.join(__dirname, '../../uploads/temp'),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

/**
 * PDF 编辑 - 批量操作
 * POST /api/pdf-editor/edit
 */
router.post('/edit', async (req, res) => {
  const { inputPath, operations, outputPath } = req.body;

  if (!inputPath || !operations || !outputPath) {
    return res.status(400).json({
      success: false,
      error: '缺少必需参数: inputPath, operations, outputPath'
    });
  }

  // 创建临时操作文件
  const operationsFile = path.join(__dirname, '../../uploads/temp', `operations_${Date.now()}.json`);
  
  try {
    // 写入操作配置
    await fs.writeFile(operationsFile, JSON.stringify(operations, null, 2), 'utf-8');

    const pythonScript = path.join(__dirname, '../../python-scripts/pdf_editor.py');
    const python = spawn('python', [pythonScript, inputPath, operationsFile, outputPath]);

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', async (code) => {
      // 清理临时文件
      try {
        await fs.unlink(operationsFile);
      } catch (err) {
        logger.error(`清理临时文件失败: ${err.message}`);
      }

      if (code !== 0) {
        logger.error(`PDF 编辑失败: ${stderr}`);
        return res.status(500).json({
          success: false,
          error: `PDF 编辑失败: ${stderr || '未知错误'}`
        });
      }

      try {
        const result = JSON.parse(stdout);
        logger.info(`PDF 编辑成功: ${outputPath}`);
        res.json(result);
      } catch (err) {
        logger.error(`解析 Python 输出失败: ${err.message}`);
        res.status(500).json({
          success: false,
          error: '解析处理结果失败'
        });
      }
    });

  } catch (error) {
    logger.error(`PDF 编辑错误: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 添加文字
 * POST /api/pdf-editor/add-text
 */
router.post('/add-text', async (req, res) => {
  const { inputPath, page, text, x, y, fontSize, color, fontName, bold, italic, outputPath } = req.body;

  const operations = [{
    type: 'add_text',
    page: page || 0,
    text,
    x,
    y,
    fontSize: fontSize || 12,
    color: color || [0, 0, 0],
    fontName: fontName || 'helv',
    bold: bold || false,
    italic: italic || false
  }];

  req.body.operations = operations;
  req.body.outputPath = outputPath || inputPath;
  
  // 转发到批量编辑接口
  return router.handle(Object.assign(req, { url: '/edit', method: 'POST' }), res);
});

/**
 * 添加标注
 * POST /api/pdf-editor/add-annotation
 */
router.post('/add-annotation', async (req, res) => {
  const { inputPath, page, annotationType, rect, content, color, outputPath } = req.body;

  if (!rect || rect.length !== 4) {
    return res.status(400).json({
      success: false,
      error: 'rect 必须是包含 4 个坐标的数组 [x0, y0, x1, y1]'
    });
  }

  const operations = [{
    type: 'add_annotation',
    page: page || 0,
    annotationType: annotationType || 'highlight',
    rect,
    content: content || '',
    color: color || [1, 1, 0]
  }];

  try {
    const operationsFile = path.join(__dirname, '../../uploads/temp', `operations_${Date.now()}.json`);
    await fs.writeFile(operationsFile, JSON.stringify(operations, null, 2), 'utf-8');

    const pythonScript = path.join(__dirname, '../../python-scripts/pdf_editor.py');
    const output = outputPath || inputPath;
    const python = spawn('python', [pythonScript, inputPath, operationsFile, output]);

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', async (code) => {
      try {
        await fs.unlink(operationsFile);
      } catch (err) {
        logger.error(`清理临时文件失败: ${err.message}`);
      }

      if (code !== 0) {
        logger.error(`添加标注失败: ${stderr}`);
        return res.status(500).json({
          success: false,
          error: `添加标注失败: ${stderr || '未知错误'}`
        });
      }

      try {
        const result = JSON.parse(stdout);
        res.json(result);
      } catch (err) {
        res.status(500).json({
          success: false,
          error: '解析处理结果失败'
        });
      }
    });

  } catch (error) {
    logger.error(`添加标注错误: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 添加签名
 * POST /api/pdf-editor/add-signature
 * 支持上传签名图片
 */
router.post('/add-signature', upload.single('signature'), async (req, res) => {
  const { inputPath, page, x, y, width, height, outputPath } = req.body;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: '请上传签名图片'
    });
  }

  const signaturePath = req.file.path;

  const operations = [{
    type: 'add_signature',
    page: parseInt(page) || 0,
    signaturePath,
    x: parseFloat(x),
    y: parseFloat(y),
    width: parseFloat(width) || 100,
    height: parseFloat(height) || 50
  }];

  try {
    const operationsFile = path.join(__dirname, '../../uploads/temp', `operations_${Date.now()}.json`);
    await fs.writeFile(operationsFile, JSON.stringify(operations, null, 2), 'utf-8');

    const pythonScript = path.join(__dirname, '../../python-scripts/pdf_editor.py');
    const output = outputPath || inputPath;
    const python = spawn('python', [pythonScript, inputPath, operationsFile, output]);

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', async (code) => {
      // 清理临时文件
      try {
        await fs.unlink(operationsFile);
        await fs.unlink(signaturePath);
      } catch (err) {
        logger.error(`清理临时文件失败: ${err.message}`);
      }

      if (code !== 0) {
        logger.error(`添加签名失败: ${stderr}`);
        return res.status(500).json({
          success: false,
          error: `添加签名失败: ${stderr || '未知错误'}`
        });
      }

      try {
        const result = JSON.parse(stdout);
        res.json(result);
      } catch (err) {
        res.status(500).json({
          success: false,
          error: '解析处理结果失败'
        });
      }
    });

  } catch (error) {
    logger.error(`添加签名错误: ${error.message}`);
    // 清理上传的文件
    try {
      await fs.unlink(signaturePath);
    } catch (err) {
      // 忽略错误
    }
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 添加形状
 * POST /api/pdf-editor/add-shape
 */
router.post('/add-shape', async (req, res) => {
  const { inputPath, page, shapeType, points, color, fillColor, width, outputPath } = req.body;

  if (!points || points.length < 2) {
    return res.status(400).json({
      success: false,
      error: 'points 参数无效'
    });
  }

  const operations = [{
    type: 'add_shape',
    page: page || 0,
    shapeType: shapeType || 'rect',
    points,
    color: color || [0, 0, 0],
    fillColor: fillColor || null,
    width: width || 1
  }];

  try {
    const operationsFile = path.join(__dirname, '../../uploads/temp', `operations_${Date.now()}.json`);
    await fs.writeFile(operationsFile, JSON.stringify(operations, null, 2), 'utf-8');

    const pythonScript = path.join(__dirname, '../../python-scripts/pdf_editor.py');
    const output = outputPath || inputPath;
    const python = spawn('python', [pythonScript, inputPath, operationsFile, output]);

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', async (code) => {
      try {
        await fs.unlink(operationsFile);
      } catch (err) {
        logger.error(`清理临时文件失败: ${err.message}`);
      }

      if (code !== 0) {
        logger.error(`添加形状失败: ${stderr}`);
        return res.status(500).json({
          success: false,
          error: `添加形状失败: ${stderr || '未知错误'}`
        });
      }

      try {
        const result = JSON.parse(stdout);
        res.json(result);
      } catch (err) {
        res.status(500).json({
          success: false,
          error: '解析处理结果失败'
        });
      }
    });

  } catch (error) {
    logger.error(`添加形状错误: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 旋转页面
 * POST /api/pdf-editor/rotate
 */
router.post('/rotate', async (req, res) => {
  const { inputPath, page, angle, outputPath } = req.body;

  if (![90, 180, 270].includes(angle)) {
    return res.status(400).json({
      success: false,
      error: '旋转角度必须是 90、180 或 270'
    });
  }

  const operations = [{
    type: 'rotate_page',
    page: page || 0,
    angle
  }];

  try {
    const operationsFile = path.join(__dirname, '../../uploads/temp', `operations_${Date.now()}.json`);
    await fs.writeFile(operationsFile, JSON.stringify(operations, null, 2), 'utf-8');

    const pythonScript = path.join(__dirname, '../../python-scripts/pdf_editor.py');
    const output = outputPath || inputPath;
    const python = spawn('python', [pythonScript, inputPath, operationsFile, output]);

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', async (code) => {
      try {
        await fs.unlink(operationsFile);
      } catch (err) {
        logger.error(`清理临时文件失败: ${err.message}`);
      }

      if (code !== 0) {
        logger.error(`旋转页面失败: ${stderr}`);
        return res.status(500).json({
          success: false,
          error: `旋转页面失败: ${stderr || '未知错误'}`
        });
      }

      try {
        const result = JSON.parse(stdout);
        res.json(result);
      } catch (err) {
        res.status(500).json({
          success: false,
          error: '解析处理结果失败'
        });
      }
    });

  } catch (error) {
    logger.error(`旋转页面错误: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

