const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database/db');
const logger = require('../utils/logger');

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 获取文件的相对路径（如果有）
    const relativePath = req.body.relativePath || '';
    const fileDir = path.join(uploadDir, path.dirname(relativePath));
    
    // 创建目录结构
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }
    
    cb(null, fileDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024 // 5GB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.wps'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not allowed. Only ${allowedTypes.join(', ')} are supported.`));
    }
  }
});

// GET /api/files - Get all files
router.get('/', (req, res) => {
  try {
    const includeDeleted = req.query.includeDeleted === 'true';
    const files = db.getAllFiles(includeDeleted);
    
    res.json({
      success: true,
      data: files,
      count: files.length
    });
  } catch (error) {
    logger.error('Error fetching files', {
      module: 'fileRoutes',
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/files/:id - Get file by ID
router.get('/:id', (req, res) => {
  try {
    const file = db.getFileById(req.params.id);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
    
    res.json({
      success: true,
      data: file
    });
  } catch (error) {
    logger.error('Error fetching file', {
      module: 'fileRoutes',
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/files/upload - Upload new file
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    const relativePath = req.body.relativePath || null;
    
    const fileData = {
      original_name: req.file.originalname,
      file_path: req.file.path,
      relative_path: relativePath,
      file_type: path.extname(req.file.originalname).slice(1),
      size: req.file.size,
      status: 'pending'
    };
    
    const fileId = db.insertFile(fileData);
    
    logger.info(`File uploaded: ${req.file.originalname}`, {
      module: 'fileRoutes',
      fileId: fileId,
      relativePath: relativePath
    });
    
    res.json({
      success: true,
      data: {
        id: fileId,
        ...fileData
      },
      message: 'File uploaded successfully'
    });
  } catch (error) {
    logger.error('Error uploading file', {
      module: 'fileRoutes',
      error: error.message
    });
    
    // Clean up uploaded file if database insert failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/files/upload-multiple - Upload multiple files
router.post('/upload-multiple', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }
    
    const uploadedFiles = [];
    
    for (const file of req.files) {
      const fileData = {
        original_name: file.originalname,
        file_path: file.path,
        file_type: path.extname(file.originalname).slice(1),
        size: file.size,
        status: 'pending'
      };
      
      const fileId = db.insertFile(fileData);
      uploadedFiles.push({ id: fileId, ...fileData });
    }
    
    logger.info(`${uploadedFiles.length} files uploaded`, {
      module: 'fileRoutes'
    });
    
    res.json({
      success: true,
      data: uploadedFiles,
      count: uploadedFiles.length,
      message: `${uploadedFiles.length} files uploaded successfully`
    });
  } catch (error) {
    logger.error('Error uploading files', {
      module: 'fileRoutes',
      error: error.message
    });
    
    // Clean up uploaded files if database insert failed
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/files/:id/status - Update file status
router.put('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }
    
    const validStatuses = ['pending', 'processing', 'completed', 'error'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    db.updateFileStatus(req.params.id, status);
    
    logger.info(`File status updated to ${status}`, {
      module: 'fileRoutes',
      fileId: req.params.id
    });
    
    res.json({
      success: true,
      message: 'File status updated successfully'
    });
  } catch (error) {
    logger.error('Error updating file status', {
      module: 'fileRoutes',
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/files/:id - Soft delete file
router.delete('/:id', (req, res) => {
  try {
    const file = db.getFileById(req.params.id);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
    
    db.deleteFile(req.params.id);
    
    logger.info(`File deleted: ${file.original_name}`, {
      module: 'fileRoutes',
      fileId: req.params.id
    });
    
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting file', {
      module: 'fileRoutes',
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/files/:id/download - Download file
router.get('/:id/download', (req, res) => {
  try {
    const file = db.getFileById(req.params.id);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
    
    if (!fs.existsSync(file.file_path)) {
      return res.status(404).json({
        success: false,
        error: 'File does not exist on disk'
      });
    }
    
    res.download(file.file_path, file.original_name);
  } catch (error) {
    logger.error('Error downloading file', {
      module: 'fileRoutes',
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

