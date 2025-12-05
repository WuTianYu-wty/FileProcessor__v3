# Visual Studio 安装指南

## ⚠️ 前置要求：设置 PowerShell 执行策略

在安装 Visual Studio 之前，你需要先设置 PowerShell 执行策略，否则无法运行 npm 命令。

### 什么是执行策略？

PowerShell 的执行策略是一项安全功能，用于防止恶意脚本运行。默认情况下，Windows 禁止运行所有脚本（包括 npm.ps1）。

### 如何设置执行策略（必须步骤）

#### 方法 1：以管理员身份运行 PowerShell（推荐）

1. **打开管理员 PowerShell**（三种方式任选其一）：
   
   **方式 A**：使用开始菜单
   - 点击 Windows 开始菜单
   - 输入 `PowerShell`
   - 右键点击 "Windows PowerShell"
   - 选择 **"以管理员身份运行"**

   **方式 B**：使用 Windows 搜索
   - 按 `Win + S` 打开搜索
   - 输入 `PowerShell`
   - 右键点击搜索结果
   - 选择 **"以管理员身份运行"**

   **方式 C**：使用运行对话框
   - 按 `Win + R`
   - 输入 `powershell`
   - 按 `Ctrl + Shift + Enter`（以管理员身份运行）

2. **执行以下命令**：

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

3. **确认提示**：
   - 系统会询问是否要更改执行策略
   - 输入 `Y` 或 `A` 并按 Enter

4. **验证设置**：

```powershell
Get-ExecutionPolicy -Scope CurrentUser
```

应该显示：`RemoteSigned`

#### 方法 2：不使用管理员权限（替代方案）

如果你没有管理员权限，可以使用以下命令：

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

**注意**：此方法仅对当前 PowerShell 窗口有效，关闭窗口后需要重新设置。

### 执行策略级别说明

- **Restricted**（默认）：不允许运行任何脚本
- **RemoteSigned**（推荐）：本地脚本可以运行，从互联网下载的脚本需要签名
- **Unrestricted**：允许运行所有脚本（不推荐，安全性较低）

### 为什么 RemoteSigned 是安全的？

- ✅ 只影响当前用户，不影响系统其他用户
- ✅ 本地创建的脚本可以直接运行
- ✅ 从互联网下载的脚本需要数字签名才能运行
- ✅ 平衡了安全性和便利性

---

## 为什么需要 Visual Studio？

`better-sqlite3` 是一个原生 Node.js 模块，需要编译 C++ 代码。因此需要安装 Visual Studio 的 C++ 构建工具。

## 🎯 推荐方案：安装 Visual Studio Build Tools 2022

这是最轻量级的方案，只安装编译所需的工具，不安装完整的 IDE。

### 步骤 1：下载 Visual Studio Build Tools

访问官方下载页面：
**https://visualstudio.microsoft.com/zh-hans/downloads/**

滚动到页面底部，找到 **"用于 Visual Studio 2022 的工具"** 部分，点击下载：
- **Build Tools for Visual Studio 2022**

或直接下载链接：
**https://aka.ms/vs/17/release/vs_BuildTools.exe**

### 步骤 2：运行安装程序

1. 双击下载的 `vs_BuildTools.exe`
2. 等待 Visual Studio Installer 加载

### 步骤 3：选择工作负载

在 Visual Studio Installer 中：

1. **必须勾选**：
   - ✅ **"使用 C++ 的桌面开发"** (Desktop development with C++)

2. 在右侧 **"安装详细信息"** 中，确保以下组件被选中：
   - ✅ MSVC v143 - VS 2022 C++ x64/x86 生成工具（最新版本）
   - ✅ Windows 11 SDK（或 Windows 10 SDK）
   - ✅ C++ CMake tools for Windows
   - ✅ 测试适配器（可选）

3. 点击 **"安装"** 按钮

### 步骤 4：等待安装完成

- 安装大小约：**6-8 GB**
- 安装时间：**15-30 分钟**（取决于网络速度）
- 安装过程中可能需要重启电脑

### 步骤 5：验证安装

安装完成后，打开新的 PowerShell 窗口，运行：

```powershell
# 检查是否能找到 Visual Studio
npm config get msvs_version

# 如果上面命令没有输出，手动设置
npm config set msvs_version 2022
```

### 步骤 6：重新安装 better-sqlite3

在项目目录中重新安装后端依赖：

```powershell
cd backend
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

## 🚀 方法 2：完整的 Visual Studio 2022 Community（适合开发者）

如果你计划进行更多开发工作，可以安装完整版：

### 下载地址：
**https://visualstudio.microsoft.com/zh-hans/vs/community/**

### 安装步骤：

1. 下载并运行 Visual Studio 2022 Community 安装程序
2. 在工作负载选择界面，勾选：
   - ✅ **"使用 C++ 的桌面开发"**
3. 点击安装
4. 安装大小约：**10-15 GB**
5. 安装完成后重启电脑

## ⚡ 方法 3：使用 windows-build-tools（快速但可能不稳定）

这是一个自动化安装工具，但有时可能会失败：

```powershell
# 以管理员身份运行 PowerShell
npm install --global windows-build-tools
```

**注意**：此方法会自动安装 Python 2.7 和 Visual Studio Build Tools，但可能与现有环境冲突。

## 🔧 安装后配置

### 1. 设置 npm 使用的 Visual Studio 版本

```powershell
npm config set msvs_version 2022
```

### 2. 如果还是遇到问题，尝试清理 npm 缓存

```powershell
npm cache clean --force
```

### 3. 设置 Python 路径（如果需要）

better-sqlite3 编译时需要 Python，你已经安装了 Python 3.14.0，应该没问题。
但如果有问题，可以手动指定：

```powershell
npm config set python "C:\Users\admin\AppData\Local\Programs\Python\Python314\python.exe"
```

## 📋 完整的安装后测试流程

```powershell
# 1. 删除旧的 node_modules
cd D:\CODE\FileProcessor_v3\backend
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# 2. 清理 npm 缓存
npm cache clean --force

# 3. 重新安装依赖
npm install

# 4. 如果成功，启动后端
npm run dev
```

## 🐛 常见问题

### Q1: 安装 Visual Studio 后还是报错？

**解决方案**：
1. 重启电脑
2. 打开新的 PowerShell 窗口（确保环境变量生效）
3. 运行 `npm config set msvs_version 2022`
4. 重新安装依赖

### Q2: 不想安装 Visual Studio 怎么办？

**替代方案**：使用 `sqlite3` 代替 `better-sqlite3`

编辑 `backend/package.json`，将：
```json
"better-sqlite3": "^9.2.2"
```

替换为：
```json
"sqlite3": "^5.1.7"
```

然后需要修改 `backend/database/db.js` 中的代码，因为两个库的 API 不同（sqlite3 是异步的）。

### Q3: 磁盘空间不够？

Visual Studio Build Tools 最小需要约 6GB 空间。如果空间不够：
1. 清理系统临时文件
2. 使用磁盘清理工具
3. 考虑使用 `sqlite3` 库替代方案

## 📝 验证是否安装成功

安装完成后，在 PowerShell 中运行：

```powershell
# 检查 Visual Studio
where cl

# 应该显示类似路径：
# C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\14.xx.xxxxx\bin\Hostx64\x64\cl.exe
```

如果显示路径，说明安装成功！

## 🎉 安装完成后

运行项目启动脚本：

```powershell
cd D:\CODE\FileProcessor_v3
.\start-dev.ps1
```

或手动安装依赖后启动：

```powershell
# 后端
cd backend
npm install
npm run dev

# 前端（新窗口）
cd frontend
npm install
npm run dev
```

---

**推荐方案**：安装 **Build Tools for Visual Studio 2022**，这是最轻量级且满足需求的方案。

如有问题，请查看错误日志或联系技术支持。

