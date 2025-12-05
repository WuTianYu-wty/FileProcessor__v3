# 故障排除指南

本文档列出了 FileProcessor 项目常见问题及解决方案。

---

## 🐛 启动脚本相关问题

### 问题 1: 批处理文件显示乱码

**症状**: 运行 `start-dev.bat` 时中文显示为乱码

**原因**: Windows cmd 默认使用 GBK 编码，而文件是 UTF-8 编码

**解决方案**:

**方案 1: 使用 PowerShell 脚本（推荐）**
```powershell
.\start-dev.ps1
```

**方案 2: 使用 GBK 编码的批处理文件**
```bash
.\start-dev-cn.bat
```

**方案 3: 使用英文版批处理文件**
```bash
.\start-dev.bat
```

---

### 问题 2: PowerShell 无法运行脚本

**症状**: 
```
无法加载文件，因为在此系统上禁止运行脚本
```

**原因**: Windows PowerShell 默认不允许运行脚本

**解决方案**:
```powershell
# 以管理员身份运行 PowerShell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

然后重新运行：
```powershell
.\start-dev.ps1
```

---

### 问题 3: cmd 无法识别 start-dev.bat

**症状**:
```
start-dev.bat : 无法将"start-dev.bat"项识别为 cmdlet、函数、脚本文件或可运行程序的名称
```

**原因**: PowerShell 需要使用 `.\` 前缀

**解决方案**:
```powershell
# 正确的方式
.\start-dev.bat

# 错误的方式
start-dev.bat
```

---

## 📦 依赖安装问题

### 问题 4: better-sqlite3 编译失败

**症状**:
```
gyp ERR! find VS You need to install the latest version of Visual Studio
gyp ERR! find VS including the "Desktop development with C++" workload
```

**原因**: better-sqlite3 需要编译原生模块，但系统缺少 Visual Studio 构建工具

**解决方案**:

**方案 1: 使用预编译版本（已修复）**
```bash
# 项目已降级到 better-sqlite3@9.6.0
# 删除 node_modules 重新安装
cd backend
rm -rf node_modules package-lock.json
npm install
```

**方案 2: 安装 Visual Studio 构建工具**
1. 下载 [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/)
2. 安装时选择 "Desktop development with C++"
3. 重新运行 `npm install`

**方案 3: 使用 windows-build-tools**
```bash
# 以管理员身份运行
npm install --global windows-build-tools
```

---

### 问题 5: npm 安装依赖失败

**症状**: 安装过程中出现网络错误或超时

**解决方案**:

**方案 1: 清除 npm 缓存**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**方案 2: 使用国内镜像**
```bash
# 临时使用淘宝镜像
npm install --registry=https://registry.npmmirror.com

# 永久设置淘宝镜像
npm config set registry https://registry.npmmirror.com
```

**方案 3: 使用 yarn**
```bash
npm install -g yarn
yarn install
```

---

### 问题 6: Python 依赖安装失败

**症状**: `pip install -r requirements.txt` 失败

**解决方案**:

**方案 1: 使用国内镜像**
```bash
# 清华镜像
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 阿里云镜像
pip install -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/
```

**方案 2: 升级 pip**
```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

**方案 3: 分步安装**
```bash
pip install PyMuPDF
pip install pdfplumber
pip install paddleocr
# ... 其他依赖
```

---

## 🚀 服务启动问题

### 问题 7: 端口被占用

**症状**:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**原因**: 3000 或 5173 端口已被其他程序占用

**解决方案**:

**Windows**:
```powershell
# 查找占用端口的进程
netstat -ano | findstr :3000

# 结束进程（替换 PID）
taskkill /PID <PID> /F
```

**Linux/Mac**:
```bash
# 查找占用端口的进程
lsof -ti:3000

# 结束进程
lsof -ti:3000 | xargs kill -9
```

---

### 问题 8: 后端启动失败

**症状**: 后端服务无法启动，控制台显示错误

**可能原因及解决方案**:

**原因 1: 数据库文件权限问题**
```bash
# 删除旧的数据库文件
cd backend
rm -rf data/
npm run dev
```

**原因 2: 日志目录权限问题**
```bash
# 删除日志目录
cd backend
rm -rf logs/
npm run dev
```

**原因 3: 模块版本不兼容**
```bash
# 删除 node_modules 重新安装
cd backend
rm -rf node_modules package-lock.json
npm install
```

---

### 问题 9: 前端启动失败

**症状**: Vite 开发服务器无法启动

**解决方案**:

```bash
cd frontend

# 清除缓存
rm -rf node_modules .vite package-lock.json

# 重新安装
npm install

# 启动
npm run dev
```

---

## 🌐 浏览器访问问题

### 问题 10: 页面无法加载

**症状**: 访问 http://localhost:5173 显示空白页或无法连接

**解决方案**:

1. **检查服务是否正常运行**
```bash
# Windows
netstat -ano | findstr :5173

# Linux/Mac
lsof -ti:5173
```

2. **检查浏览器控制台**
   - 按 F12 打开开发者工具
   - 查看 Console 和 Network 标签的错误信息

3. **清除浏览器缓存**
   - Ctrl + Shift + Delete
   - 清除缓存和 Cookie

---

### 问题 11: API 请求失败

**症状**: 前端页面显示，但无法获取数据

**解决方案**:

1. **检查后端是否运行**
   - 访问 http://localhost:3000/api/health
   - 应该返回 JSON 数据

2. **检查 Vite 代理配置**
   - 编辑 `frontend/vite.config.js`
   - 确认代理配置正确

3. **检查 CORS 配置**
   - 后端已配置 CORS，应该没问题
   - 查看后端控制台是否有错误

---

## 📝 文件操作问题

### 问题 12: 文件上传失败

**症状**: 上传文件时提示错误

**解决方案**:

1. **检查文件大小**
   - 单个文件最大 50MB
   - 超过限制会被拒绝

2. **检查文件类型**
   - 仅支持: PDF, Word (.doc, .docx), TXT, WPS
   - 其他格式会被拒绝

3. **检查 uploads 目录权限**
```bash
# 确保目录存在且可写
mkdir -p uploads
chmod 777 uploads  # Linux/Mac
```

---

### 问题 13: 文件下载失败

**症状**: 点击下载没有反应

**解决方案**:

1. **检查文件是否存在**
   - 文件可能已被删除或移动

2. **检查浏览器下载设置**
   - 检查浏览器是否阻止了下载

3. **查看后端日志**
   - 检查 `backend/logs/` 目录
   - 查找相关错误信息

---

## 🐍 Python 脚本问题

### 问题 14: PaddleOCR 首次运行很慢

**症状**: 第一次运行 OCR 功能时等待很长时间

**原因**: PaddleOCR 需要下载模型文件（约 100MB）

**解决方案**: 耐心等待，模型会自动下载并缓存到本地

**加速方法**:
```bash
# 手动下载模型文件（可选）
# 参考 PaddleOCR 官方文档
```

---

### 问题 15: Python 脚本找不到

**症状**: 
```
Error: Cannot find module '../python-scripts/...'
```

**解决方案**:

1. **检查 Python 是否安装**
```bash
python --version
# 或
python3 --version
```

2. **检查脚本文件是否存在**
```bash
ls python-scripts/
```

3. **检查 Python 路径配置**
   - 确保 Python 在系统 PATH 中

---

## 🔧 开发环境问题

### 问题 16: 代码修改不生效

**症状**: 修改代码后页面没有更新

**解决方案**:

**前端**:
- Vite 支持 HMR，应该自动更新
- 尝试手动刷新浏览器（Ctrl + R）
- 硬刷新（Ctrl + Shift + R）

**后端**:
- nodemon 应该自动重启
- 检查 nodemon 是否正常运行
- 手动重启：Ctrl + C，然后 `npm run dev`

---

### 问题 17: 日志文件太多

**症状**: `backend/logs/` 目录有大量日志文件

**解决方案**:

日志会自动清理（保留 24 小时）

手动清理：
```bash
cd backend/logs
rm *.log
```

---

## 📞 获取更多帮助

如果以上方案都无法解决问题：

1. **查看完整日志**
   - 后端日志: `backend/logs/`
   - npm 日志: `C:\Users\<用户名>\AppData\Local\npm-cache\_logs\`

2. **查看文档**
   - [README.md](README.md)
   - [QUICK_START.md](QUICK_START.md)
   - [dev-logs/DEVELOPMENT_SUMMARY.md](dev-logs/DEVELOPMENT_SUMMARY.md)

3. **检查 Node.js 和 npm 版本**
```bash
node -v    # 应该 >= 16.x
npm -v     # 应该 >= 8.x
python -v  # 应该 >= 3.8
```

4. **完全重新安装**
```bash
# 删除所有 node_modules
rm -rf backend/node_modules
rm -rf frontend/node_modules
rm -rf backend/package-lock.json
rm -rf frontend/package-lock.json

# 重新安装
cd backend && npm install
cd ../frontend && npm install
```

---

**祝您使用顺利！** 🎉

