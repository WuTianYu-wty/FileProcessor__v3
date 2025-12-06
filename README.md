# FileProcessor v3 - 智能文件处理系统

<div align="center">

![Version](https://img.shields.io/badge/version-v1.3.0-blue.svg)
![GPU](https://img.shields.io/badge/GPU-RTX%205070-green.svg)
![Speed](https://img.shields.io/badge/speed-7x%20faster-red.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0-brightgreen.svg)
![Python](https://img.shields.io/badge/python-%3E%3D3.8-orange.svg)
![Status](https://img.shields.io/badge/status-stable-success.svg)

**一个功能强大的文件处理和管理系统**

[快速开始](#-快速开始) • [功能特性](#-核心功能) • [文档](#-文档) • [开发计划](#-开发计划)

</div>

---

## 📖 项目简介

FileProcessor v3 是一个基于 Web 的智能文件处理系统，集成了文件管理、OCR 识别、PDF 处理、文件预览等多种功能。采用前后端分离架构，支持大文件处理（最大 5GB），具有友好的用户界面和完善的错误处理机制。

### 🎯 适用场景

- 📁 企业文件管理与归档
- 🔍 文档 OCR 识别与脱敏
- ✂️ PDF 文档拆分与合并
- 👁️ 在线文件预览
- 📦 批量文件处理

---

## ✨ 核心功能

### Phase 1: 基础文件管理 ✅

- ✅ **文件上传**
  - 单文件/批量上传（最大 5GB）
  - 文件夹上传（保持目录结构）
  - 拖拽上传支持
  - 实时进度显示

- ✅ **文件管理**
  - 文件列表查看与搜索
  - 文件排序与过滤
  - 单文件/批量下载
  - 批量删除

- ✅ **批量操作**
  - 批量导出为 ZIP（保持目录结构）
  - 批量删除
  - 文件状态管理

### Phase 2: 核心业务功能 ✅

- 🔍 **OCR 文字识别与脱敏** ⚡ GPU 加速
  - 支持 PDF 和图片文件（JPG、PNG、BMP）
  - 使用 PaddleOCR 高精度识别引擎
  - **GPU 加速（7倍速度提升）** 🆕
  - **自定义姓名脱敏** 🆕
  - 智能脱敏（7种敏感信息类型）
  - 批量处理支持

- ✂️ **PDF 拆分工具**
  - 按页码范围拆分
  - 按书签目录拆分
  - 多段范围支持

- 🔗 **PDF 合并工具**
  - 多文件合并
  - 保留元数据
  - 自定义输出名称

- 👁️ **文件预览**
  - PDF 内嵌预览
  - 图片预览（JPG、PNG、GIF、BMP）
  - 文本预览（TXT、JSON、LOG、MD、CSV）

---

## 🛠️ 技术栈

### 后端
- **Node.js** + **Express** - Web 服务器
- **SQLite** (better-sqlite3) - 数据存储
- **Winston** - 日志系统
- **Multer** - 文件上传
- **Archiver** - ZIP 打包

### 前端
- **React 18** - UI 框架
- **Vite** - 构建工具
- **Ant Design 5** - UI 组件库
- **Axios** - HTTP 客户端

### Python 脚本
- **PaddleOCR** - OCR 识别引擎
- **PyMuPDF** - PDF 处理
- **Pillow** - 图像处理
- **OpenCV** - 计算机视觉

---

## 🚀 快速开始

### 1️⃣ 环境要求

```bash
Node.js >= 16.0
Python >= 3.8
Windows 10/11 或 macOS/Linux
```

### 2️⃣ 安装依赖

```bash
# 安装 Node.js 依赖
cd backend
npm install

cd ../frontend
npm install

# 安装 Python 依赖
cd ../python-scripts
pip install -r requirements.txt
```

### 3️⃣ 启动服务

```bash
# Windows
.\start-dev.ps1

# Linux/Mac
./start-dev.sh
```

### 4️⃣ 访问应用

浏览器自动打开：http://localhost:5173

---

## 📚 文档

### 用户文档
- [📘 从这里开始](从这里开始.md) - 导航入口
- [📗 快速开始](快速开始.md) - 安装与使用
- [📙 项目说明](项目说明.md) - 项目介绍
- [📕 Phase 2 功能说明](功能说明/Phase2功能说明.md) - 新功能详解

### 开发文档
- [📊 Phase 1 完成报告](dev-logs/PHASE1_COMPLETION_REPORT.md)
- [📊 Phase 2 完成报告](dev-logs/PHASE2_COMPLETION_REPORT.md)
- [🧪 Phase 2 测试指南](dev-logs/PHASE2_TESTING_GUIDE.md)
- [📋 开发完成清单](dev-logs/开发完成清单.md)

### 故障排查
- [🔧 PowerShell 修复指南](安装指南/PowerShell修复指南.md)
- [🔧 Visual Studio 安装指南](安装指南/Visual Studio安装指南.md)
- [🐛 Bug 修复报告](问题修复/Bug修复报告.md)

---

## 📸 功能演示

### 文件上传与管理
![文件上传](https://via.placeholder.com/800x450?text=File+Upload+Demo)

### OCR 识别与脱敏
![OCR 识别](https://via.placeholder.com/800x450?text=OCR+Recognition+Demo)

### PDF 工具
![PDF 工具](https://via.placeholder.com/800x450?text=PDF+Tools+Demo)

### 文件预览
![文件预览](https://via.placeholder.com/800x450?text=File+Preview+Demo)

---

## 🎯 主要特性

### ⚡ 性能优异
- 支持大文件上传（最大 5GB）
- 异步处理不阻塞界面
- 高效的文件流处理

### 🔒 安全可靠
- 文件类型验证
- 文件大小限制
- 软删除机制
- 敏感信息脱敏

### 🎨 用户友好
- 现代化 UI 设计
- 实时进度显示
- 友好的错误提示
- 完整的中文支持

### 📊 功能完善
- 完整的文件生命周期管理
- 多种 PDF 处理工具
- 强大的 OCR 识别能力
- 多格式文件预览

---

## 📈 性能指标

### CPU 模式
| 操作类型 | 文件大小/数量 | 处理时间 |
|---------|-------------|---------|
| 文件上传 | 1 GB | ~10 秒 |
| OCR 识别 | 1 页 PDF | ~4 秒 |
| PDF 拆分 | 100 页 | < 2 秒 |
| PDF 合并 | 5 文件 | < 3 秒 |
| 文件预览 | 5 MB PDF | < 1 秒 |

### ⚡ GPU 模式（RTX 5070）
| 操作类型 | 文件大小/数量 | 处理时间 | 提升 |
|---------|-------------|---------|------|
| OCR 识别 | 1 页 PDF | **~0.6 秒** | **7.0x** ⚡ |
| OCR 识别 | 10 页 PDF | **~6.5 秒** | **6.9x** ⚡ |
| OCR 识别 | 100 页 PDF | **~1 分钟** | **6.6x** ⚡ |

*测试环境：RTX 5070, i7-12700K, 32GB RAM*

---

## 🗺️ 开发计划

### ✅ Phase 1 - 基础功能（已完成）
- [x] 文件上传下载
- [x] 文件列表管理
- [x] 批量操作
- [x] 文件夹支持

### ✅ Phase 2 - 核心业务（已完成）
- [x] OCR 文字识别
- [x] 智能脱敏
- [x] PDF 拆分合并
- [x] 文件预览

### ✅ 性能优化 - GPU 加速（已完成）🆕
- [x] GPU 加速支持（7倍提升）
- [x] 自定义姓名脱敏
- [x] 增强敏感信息识别（7种）
- [x] RTX 5070 专属优化

### 🔄 Phase 3 - 功能增强（计划中）
- [ ] 在线 PDF 编辑
- [ ] 文档格式转换
- [ ] 智能文件分类
- [ ] 文件版本管理
- [ ] 分布式任务队列

---

## 🤝 参与贡献

欢迎提交 Issue 和 Pull Request！

### 贡献指南
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 开源协议

本项目采用 MIT 协议 - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

感谢以下开源项目：
- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) - 高精度 OCR 引擎
- [PyMuPDF](https://github.com/pymupdf/PyMuPDF) - PDF 处理库
- [Ant Design](https://ant.design/) - React UI 组件库
- [Express](https://expressjs.com/) - Node.js Web 框架

---

## 📞 联系方式

- **项目地址**: https://github.com/WuTianYu-wty/FileProcessor__v3
- **问题反馈**: [Issues](https://github.com/WuTianYu-wty/FileProcessor__v3/issues)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个 Star ⭐**

**Made with ❤️ by FileProcessor Team**

</div>

