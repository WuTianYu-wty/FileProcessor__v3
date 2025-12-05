# 🚀 开始使用 FileProcessor

> **首次使用？请按照下面的步骤操作！**

---

## ⚡ 三步启动

### 1️⃣ 选择启动方式

根据你的系统选择一个启动脚本：

```
Windows 用户推荐: start-dev.ps1 ⭐⭐⭐⭐⭐
Windows 备用方案: start-dev-cn.bat ⭐⭐⭐⭐
Linux/Mac 用户: start-dev.sh ⭐⭐⭐⭐⭐
```

### 2️⃣ 运行启动脚本

**Windows PowerShell (推荐):**
```powershell
.\start-dev.ps1
```

**Windows 批处理:**
```bash
.\start-dev-cn.bat
```

**Linux/Mac:**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

### 3️⃣ 等待服务启动

- 脚本会自动检查并安装依赖
- 自动启动后端和前端服务
- 浏览器自动打开应用

---

## 🎯 期望结果

启动成功后，你会看到：

```
========================================
  服务启动完成！
========================================

  后端:  http://localhost:3000
  前端:  http://localhost:5173
```

浏览器会自动打开 http://localhost:5173

---

## ❓ 遇到问题？

### 问题 1: PowerShell 无法运行脚本

**错误**: `无法加载文件，因为在此系统上禁止运行脚本`

**解决**: 以管理员身份运行 PowerShell
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

### 问题 2: 批处理文件显示乱码

**解决**: 使用 PowerShell 脚本或 GBK 编码版本
```powershell
.\start-dev.ps1  # PowerShell 版本
# 或
.\start-dev-cn.bat  # GBK 编码版本
```

---

### 问题 3: better-sqlite3 安装失败

**错误**: `gyp ERR! find VS`

**解决**: 已修复！使用快速修复脚本

**最简单的方式 (推荐):**
```powershell
# PowerShell
.\fix-backend.ps1

# 或批处理
.\fix-backend.bat
```

**手动修复步骤**:
```powershell
# 1. 关闭所有服务窗口
# 2. 删除旧依赖
cd backend
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# 3. 重新安装
npm install

# 4. 启动项目
cd ..
.\start-dev.ps1
```

---

### 问题 4: 端口被占用

**错误**: `Port 3000 is already in use`

**解决**: 结束占用端口的进程

**Windows:**
```powershell
# 查找进程
netstat -ano | findstr :3000

# 结束进程（替换 PID）
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
# 查找并结束进程
lsof -ti:3000 | xargs kill -9
```

---

## 📚 更多帮助

### 快速参考
- 📖 [README.md](README.md) - 项目完整说明
- 🚀 [QUICK_START.md](QUICK_START.md) - 快速启动指南
- 🔧 [FIX_INSTRUCTIONS.md](FIX_INSTRUCTIONS.md) - 修复说明
- 🐛 [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - 故障排除（17 个问题）

### 详细文档
- 📝 [dev-logs/DEVELOPMENT_SUMMARY.md](dev-logs/DEVELOPMENT_SUMMARY.md) - 开发总结
- 🔥 [dev-logs/HOTFIX-20251205.md](dev-logs/HOTFIX-20251205.md) - 最新修复记录

---

## 🎓 使用提示

### 首次启动
1. 脚本会自动安装依赖（约 3-5 分钟）
2. 后端会自动创建数据库
3. 浏览器会自动打开应用

### 日常使用
- 再次启动时，依赖已安装，会立即启动服务
- 可以随时关闭服务窗口停止服务
- 数据保存在 `backend/data/` 目录

### 功能测试
1. **文件上传** - 点击"文件上传"菜单
2. **查看文件** - 点击"文件列表"菜单
3. **仪表板** - 查看统计信息

---

## ⚙️ 启动脚本对比

| 脚本 | 编码 | 优点 | 缺点 |
|------|------|------|------|
| **start-dev.ps1** | UTF-8 | 完美中文支持、功能最全、带颜色 | 需要 PowerShell |
| **start-dev-cn.bat** | GBK | 中文显示正常、兼容性好 | cmd 功能有限 |
| **start-dev.bat** | UTF-8 | 英文界面、无乱码 | 英文界面 |
| **start-dev.sh** | UTF-8 | 完美中文支持 | 仅限 Linux/Mac |

**推荐顺序**: PowerShell > GBK 批处理 > UTF-8 批处理

---

## 🔄 手动启动

如果启动脚本无法工作，可以手动启动：

**步骤 1: 安装依赖**
```bash
# 后端
cd backend
npm install

# 前端
cd ../frontend
npm install
```

**步骤 2: 启动服务**

打开两个终端窗口：

**终端 1 - 后端:**
```bash
cd backend
npm run dev
```

**终端 2 - 前端:**
```bash
cd frontend
npm run dev
```

**步骤 3: 访问应用**

打开浏览器访问: http://localhost:5173

---

## 🎉 开始使用

启动成功后，你可以：

1. 📤 **上传文件** - 支持 PDF、Word、TXT 等格式
2. 📂 **管理文件** - 查看、下载、删除文件
3. 📊 **查看统计** - 仪表板显示文件统计信息
4. ⚙️ **配置系统** - 设置数据保留策略

---

## 💬 需要帮助？

1. **查看常见问题**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. **查看修复说明**: [FIX_INSTRUCTIONS.md](FIX_INSTRUCTIONS.md)
3. **查看完整文档**: [README.md](README.md)
4. **查看快速指南**: [QUICK_START.md](QUICK_START.md)

---

**祝你使用愉快！** 🎊

有任何问题，请先查看文档，大部分问题都有详细的解决方案。

---

*最后更新: 2025-12-05*

