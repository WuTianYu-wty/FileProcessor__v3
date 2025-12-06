/**
 * OCR 处理路由
 * 提供 OCR 文字识别和脱敏功能
 */

const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');
const db = require('../database/db');

/**
 * OCR 识别与脱敏（增强版）
 * POST /api/ocr/process
 * Body: { 
 *   fileId, 
 *   enableDesensitize: true,
 *   enableNameDesensitize: true,
 *   enableAddressDesensitize: true,
 *   enableCompanyDesensitize: true,
 *   useGpu: true,
 *   customNames: [],
 *   customAddresses: [],
 *   customCompanies: []
 * }
 */
router.post('/process', async (req, res) => {
  try {
    const { 
      fileId, 
      enableDesensitize = true,
      enableNameDesensitize = true,
      enableAddressDesensitize = true,
      enableCompanyDesensitize = true,
      useGpu = true,
      customNames = [],
      customAddresses = [],
      customCompanies = []
    } = req.body;

    // 验证参数
    if (!fileId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数：fileId'
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

    // 检查文件类型（支持 PDF 和图片）
    const supportedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.bmp'];
    const fileExt = path.extname(file.original_name).toLowerCase();
    if (!supportedTypes.includes(fileExt)) {
      return res.status(400).json({
        success: false,
        message: '只支持 PDF 和图片文件 (jpg, png, bmp)'
      });
    }

    // 创建输出文件路径
    const timestamp = Date.now();
    const outputDir = path.join(__dirname, '../../uploads/ocr');
    await fs.mkdir(outputDir, { recursive: true });
    const outputFileName = `ocr_result_${fileId}_${timestamp}.json`;
    const outputPath = path.join(outputDir, outputFileName);

    // 准备 Python 脚本参数 - 使用增强版处理器
    const scriptPath = path.join(__dirname, '../../python-scripts/ocr_processor_enhanced.py');
    const inputPath = file.file_path;

    let pythonArgs = [scriptPath, inputPath, outputPath];
    
    // 添加选项
    if (!useGpu) {
      pythonArgs.push('--no-gpu');
    }
    
    if (!enableNameDesensitize) {
      pythonArgs.push('--no-name-desensitize');
    }
    
    if (!enableAddressDesensitize) {
      pythonArgs.push('--no-address-desensitize');
    }
    
    if (!enableCompanyDesensitize) {
      pythonArgs.push('--no-company-desensitize');
    }
    
    // 处理自定义姓名
    if (customNames && customNames.length > 0) {
      const customNamesFile = path.join(outputDir, `custom_names_${fileId}_${timestamp}.txt`);
      await fs.writeFile(customNamesFile, customNames.join('\n'), 'utf-8');
      pythonArgs.push('--custom-names', customNamesFile);
    }
    
    // 处理自定义地址
    if (customAddresses && customAddresses.length > 0) {
      const customAddressesFile = path.join(outputDir, `custom_addresses_${fileId}_${timestamp}.txt`);
      await fs.writeFile(customAddressesFile, customAddresses.join('\n'), 'utf-8');
      pythonArgs.push('--custom-addresses', customAddressesFile);
    }
    
    // 处理自定义公司
    if (customCompanies && customCompanies.length > 0) {
      const customCompaniesFile = path.join(outputDir, `custom_companies_${fileId}_${timestamp}.txt`);
      await fs.writeFile(customCompaniesFile, customCompanies.join('\n'), 'utf-8');
      pythonArgs.push('--custom-companies', customCompaniesFile);
    }

    logger.info(`开始 OCR 处理: ${file.original_name}`);

    // 更新文件状态
    db.updateFile(fileId, { status: 'processing' });

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
        logger.error(`OCR 处理失败: ${errorData}`);
        db.updateFile(fileId, { status: 'failed' });
        return res.status(500).json({
          success: false,
          message: 'OCR 处理失败',
          error: errorData
        });
      }

      try {
        const result = JSON.parse(outputData);

        // 读取输出文件
        const ocrResult = JSON.parse(await fs.readFile(outputPath, 'utf-8'));

        // 更新文件状态
        db.updateFile(fileId, { 
          status: 'completed',
          processed_at: new Date().toISOString()
        });

        // 保存 OCR 结果文件到数据库
        const resultFile = db.createFile({
          original_name: outputFileName,
          file_path: outputPath,
          relative_path: `ocr/${outputFileName}`,
          file_type: 'application/json',
          size: (await fs.stat(outputPath)).size,
          status: 'completed'
        });

        logger.info(`OCR 处理成功: ${file.original_name}`);

        res.json({
          success: true,
          message: 'OCR 处理成功',
          data: {
            ...result,
            resultFileId: resultFile.id,
            ocrResult: ocrResult
          }
        });

      } catch (parseError) {
        logger.error(`解析 OCR 结果失败: ${parseError.message}`);
        db.updateFile(fileId, { status: 'failed' });
        res.status(500).json({
          success: false,
          message: '处理结果失败',
          error: parseError.message
        });
      }
    });

  } catch (error) {
    logger.error(`OCR 处理错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * 批量 OCR 处理
 * POST /api/ocr/batch
 * Body: { fileIds: [1, 2, 3], enableDesensitize: true }
 */
router.post('/batch', async (req, res) => {
  try {
    const { fileIds, enableDesensitize = true } = req.body;

    // 验证参数
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请至少选择一个文件'
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

    logger.info(`开始批量 OCR 处理: ${files.length} 个文件`);

    // 异步处理所有文件
    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        // 检查文件类型
        const supportedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.bmp'];
        const fileExt = path.extname(file.original_name).toLowerCase();
        if (!supportedTypes.includes(fileExt)) {
          errors.push({
            fileId: file.id,
            fileName: file.original_name,
            error: '不支持的文件类型'
          });
          continue;
        }

        // 更新状态为处理中
        db.updateFile(file.id, { status: 'processing' });

        results.push({
          fileId: file.id,
          fileName: file.original_name,
          status: 'queued'
        });

      } catch (error) {
        errors.push({
          fileId: file.id,
          fileName: file.original_name,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `已提交 ${results.length} 个文件进行 OCR 处理`,
      data: {
        queued: results,
        errors: errors
      }
    });

    // 后台异步处理（不阻塞响应）
    // 注意：生产环境应该使用队列系统（如 Bull、Redis Queue）
    processFilesInBackground(results.map(r => r.fileId), enableDesensitize);

  } catch (error) {
    logger.error(`批量 OCR 处理错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * 获取 OCR 处理结果
 * GET /api/ocr/result/:resultFileId
 */
router.get('/result/:resultFileId', async (req, res) => {
  try {
    const { resultFileId } = req.params;

    // 获取结果文件
    const file = db.getFileById(resultFileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: '结果文件不存在'
      });
    }

    // 读取结果
    const result = JSON.parse(await fs.readFile(file.file_path, 'utf-8'));

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error(`获取 OCR 结果错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '读取结果失败',
      error: error.message
    });
  }
});

/**
 * 获取 OCR 处理进度
 * GET /api/ocr/status/:fileId
 */
router.get('/status/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = db.getFileById(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    res.json({
      success: true,
      data: {
        fileId: file.id,
        fileName: file.original_name,
        status: file.status,
        processedAt: file.processed_at
      }
    });

  } catch (error) {
    logger.error(`获取处理状态错误: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取状态失败',
      error: error.message
    });
  }
});

/**
 * 后台处理文件（辅助函数）
 */
async function processFilesInBackground(fileIds, enableDesensitize) {
  for (const fileId of fileIds) {
    try {
      const file = db.getFileById(fileId);
      if (!file) continue;

      const timestamp = Date.now();
      const outputDir = path.join(__dirname, '../../uploads/ocr');
      await fs.mkdir(outputDir, { recursive: true });
      const outputFileName = `ocr_result_${fileId}_${timestamp}.json`;
      const outputPath = path.join(outputDir, outputFileName);

      const scriptPath = path.join(__dirname, '../../python-scripts/ocr_processor.py');
      const pythonArgs = [scriptPath, file.file_path, outputPath];

      logger.info(`后台处理 OCR: ${file.original_name}`);

      const pythonProcess = spawn('python', pythonArgs);

      pythonProcess.on('close', async (code) => {
        if (code === 0) {
          // 成功
          db.updateFile(fileId, { 
            status: 'completed',
            processed_at: new Date().toISOString()
          });

          // 保存结果文件
          const fileStats = await fs.stat(outputPath);
          db.createFile({
            original_name: outputFileName,
            file_path: outputPath,
            relative_path: `ocr/${outputFileName}`,
            file_type: 'application/json',
            size: fileStats.size,
            status: 'completed'
          });

          logger.info(`OCR 处理完成: ${file.original_name}`);
        } else {
          // 失败
          db.updateFile(fileId, { status: 'failed' });
          logger.error(`OCR 处理失败: ${file.original_name}`);
        }
      });

    } catch (error) {
      logger.error(`后台处理错误: ${error.message}`);
      db.updateFile(fileId, { status: 'failed' });
    }
  }
}

module.exports = router;

