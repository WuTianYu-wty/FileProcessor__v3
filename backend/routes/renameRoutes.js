const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

/**
 * 批量重命名
 * POST /api/rename/batch
 */
router.post('/batch', async (req, res) => {
  const { mode, files, pattern, search, replace, prefix, suffix, customVars, dryRun, caseSensitive, useRegex } = req.body;

  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({
      success: false,
      error: '文件列表不能为空'
    });
  }

  // 构建配置
  const config = {
    mode: mode || 'pattern',
    files,
    dry_run: dryRun || false
  };

  // 根据模式添加参数
  if (mode === 'pattern') {
    config.pattern = pattern || '{original}_{index:02}';
    if (customVars) {
      config.custom_vars = customVars;
    }
  } else if (mode === 'replace') {
    config.search = search || '';
    config.replace = replace || '';
    config.case_sensitive = caseSensitive !== false;
    config.use_regex = useRegex || false;
  } else if (mode === 'prefix_suffix') {
    config.prefix = prefix || '';
    config.suffix = suffix || '';
  }

  // 创建临时配置文件
  const configFile = path.join(__dirname, '../../uploads/temp', `rename_config_${Date.now()}.json`);

  try {
    await fs.writeFile(configFile, JSON.stringify(config, null, 2), 'utf-8');

    const pythonScript = path.join(__dirname, '../../python-scripts/batch_rename.py');
    const python = spawn('python', [pythonScript, configFile]);

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
        await fs.unlink(configFile);
      } catch (err) {
        logger.error(`清理临时文件失败: ${err.message}`);
      }

      if (code !== 0) {
        logger.error(`批量重命名失败: ${stderr}`);
        return res.status(500).json({
          success: false,
          error: `批量重命名失败: ${stderr || '未知错误'}`
        });
      }

      try {
        const result = JSON.parse(stdout);
        logger.info(`批量重命名完成: 成功 ${result.success_count}, 失败 ${result.fail_count}`);
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

  } catch (error) {
    logger.error(`批量重命名错误: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 预览重命名
 * POST /api/rename/preview
 */
router.post('/preview', async (req, res) => {
  // 设置为 dry_run 模式
  req.body.dryRun = true;
  req.body.mode = req.body.mode || 'pattern';
  
  // 转发到批量重命名接口
  return router.handle(Object.assign(req, { url: '/batch', method: 'POST' }), res);
});

/**
 * 文本替换重命名
 * POST /api/rename/replace
 */
router.post('/replace', async (req, res) => {
  const { files, search, replace, caseSensitive, useRegex } = req.body;

  if (!search) {
    return res.status(400).json({
      success: false,
      error: '搜索文本不能为空'
    });
  }

  req.body.mode = 'replace';
  req.body.replace = replace || '';
  
  return router.handle(Object.assign(req, { url: '/batch', method: 'POST' }), res);
});

/**
 * 添加前缀/后缀
 * POST /api/rename/add-prefix-suffix
 */
router.post('/add-prefix-suffix', async (req, res) => {
  const { files, prefix, suffix } = req.body;

  if (!prefix && !suffix) {
    return res.status(400).json({
      success: false,
      error: '前缀和后缀至少需要一个'
    });
  }

  req.body.mode = 'prefix_suffix';
  
  return router.handle(Object.assign(req, { url: '/batch', method: 'POST' }), res);
});

/**
 * 获取可用变量列表
 * GET /api/rename/variables
 */
router.get('/variables', (req, res) => {
  const variables = {
    date: {
      name: '{date}',
      description: '当前日期 (YYYYMMDD)',
      example: '20251206'
    },
    time: {
      name: '{time}',
      description: '当前时间 (HHMMSS)',
      example: '143025'
    },
    datetime: {
      name: '{datetime}',
      description: '当前日期时间',
      example: '20251206_143025'
    },
    year: {
      name: '{year}',
      description: '当前年份',
      example: '2025'
    },
    month: {
      name: '{month}',
      description: '当前月份',
      example: '12'
    },
    day: {
      name: '{day}',
      description: '当前日期',
      example: '06'
    },
    original: {
      name: '{original}',
      description: '原始文件名（不含扩展名）',
      example: 'document'
    },
    ext: {
      name: '{ext}',
      description: '文件扩展名',
      example: 'pdf'
    },
    index: {
      name: '{index}',
      description: '文件序号',
      example: '1'
    },
    index02: {
      name: '{index:02}',
      description: '2位序号（补零）',
      example: '01'
    },
    index03: {
      name: '{index:03}',
      description: '3位序号（补零）',
      example: '001'
    },
    index04: {
      name: '{index:04}',
      description: '4位序号（补零）',
      example: '0001'
    },
    total: {
      name: '{total}',
      description: '文件总数',
      example: '10'
    }
  };

  res.json({
    success: true,
    variables,
    examples: [
      {
        pattern: 'Document_{index:03}',
        description: '文档序号命名',
        result: 'Document_001.pdf, Document_002.pdf...'
      },
      {
        pattern: '{date}_{original}',
        description: '日期前缀',
        result: '20251206_document.pdf'
      },
      {
        pattern: '{original}_{datetime}',
        description: '添加时间戳',
        result: 'document_20251206_143025.pdf'
      },
      {
        pattern: 'Backup_{year}{month}{day}_{index:02}',
        description: '备份文件命名',
        result: 'Backup_20251206_01.pdf'
      }
    ]
  });
});

module.exports = router;

