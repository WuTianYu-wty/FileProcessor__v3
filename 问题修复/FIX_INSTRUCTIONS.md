# 🔧 问题修复说明

## 已修复的问题

### 1. ✅ 批处理文件乱码问题
已创建多个启动脚本供选择：

- **`start-dev.ps1`** (推荐) - PowerShell 脚本，UTF-8 编码，完美支持中文
- **`start-dev-cn.bat`** - GBK 编码批处理文件，中文显示正常
- **`start-dev.bat`** - UTF-8 编码批处理文件，英文界面

### 2. ✅ better-sqlite3 编译失败问题
已将 better-sqlite3 从 12.5.0 降级到 9.6.0，该版本提供预编译的二进制文件，无需 Visual Studio。

---

## 🚀 下一步操作

### 步骤 1: 清理旧的依赖（重要！）

由于 better-sqlite3 正在被占用，需要先关闭所有相关进程：

1. **关闭所有终端窗口**
   - 关闭运行 `npm run dev` 的窗口
   - 关闭所有与项目相关的命令行窗口

2. **手动删除 node_modules**

**方式 A: 使用文件资源管理器（推荐）**
```
1. 打开文件资源管理器
2. 导航到: D:\CODE\FileProcessor_v3\backend
3. 找到 node_modules 文件夹
4. 按 Shift + Delete 键永久删除
5. 如果提示权限错误，重启电脑后再试
```

**方式 B: 使用命令行（管理员权限）**
```powershell
# 以管理员身份运行 PowerShell
cd D:\CODE\FileProcessor_v3\backend
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
```

**方式 C: 重启后删除**
```
1. 重启电脑
2. 删除 D:\CODE\FileProcessor_v3\backend\node_modules 文件夹
3. 删除 D:\CODE\FileProcessor_v3\backend\package-lock.json 文件
```

### 步骤 2: 重新安装依赖

```powershell
cd D:\CODE\FileProcessor_v3\backend
npm install
```

这次安装应该会使用 better-sqlite3@9.6.0，不需要编译。

### 步骤 3: 启动项目

**推荐方式 - 使用 PowerShell 脚本:**
```powershell
cd D:\CODE\FileProcessor_v3
.\start-dev.ps1
```

**备用方式 - 使用 GBK 批处理文件:**
```powershell
.\start-dev-cn.bat
```

**手动启动方式:**
```powershell
# 终端 1 - 后端
cd backend
npm run dev

# 终端 2 - 前端
cd frontend
npm run dev
```

---

## 📋 启动脚本对比

| 脚本文件 | 编码 | 语言 | 推荐度 | 说明 |
|---------|------|------|--------|------|
| `start-dev.ps1` | UTF-8 | 中文 | ⭐⭐⭐⭐⭐ | PowerShell 脚本，完美支持中文，功能最全 |
| `start-dev-cn.bat` | GBK | 中文 | ⭐⭐⭐⭐ | 批处理文件，中文显示正常 |
| `start-dev.bat` | UTF-8 | 英文 | ⭐⭐⭐ | 批处理文件，英文界面，无乱码 |
| `start-dev.sh` | UTF-8 | 中文 | ⭐⭐⭐⭐⭐ | Linux/Mac 脚本 |

---

## ⚠️ 常见问题

### Q1: 为什么要降级 better-sqlite3？

**A:** better-sqlite3@12.x 需要在 Windows 上编译原生模块，要求安装 Visual Studio 构建工具（约 6GB）。降级到 9.6.0 可以使用预编译的二进制文件，无需编译。

### Q2: PowerShell 脚本无法运行？

**A:** 可能是执行策略限制，以管理员身份运行：
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Q3: 仍然看到乱码？

**A:** 使用以下任一方案：

**方案 1:** 使用 PowerShell 脚本
```powershell
.\start-dev.ps1
```

**方案 2:** 使用 GBK 编码的批处理
```powershell
.\start-dev-cn.bat
```

**方案 3:** 手动启动（不使用脚本）
```powershell
# 终端 1
cd backend
npm run dev

# 终端 2
cd frontend  
npm run dev
```

### Q4: 删除 node_modules 失败？

**原因:** 某个进程正在使用这些文件

**解决方案:**
1. 关闭所有命令行窗口
2. 关闭 VS Code / Cursor
3. 打开任务管理器，结束所有 node.exe 进程
4. 重启电脑
5. 使用文件资源管理器手动删除

---

## ✅ 验证修复

安装完成后，验证 better-sqlite3 版本：

```powershell
cd backend
npm list better-sqlite3
```

应该显示：
```
better-sqlite3@9.6.0
```

然后启动服务，访问 http://localhost:5173

---

## 📞 仍有问题？

查看详细的故障排除文档：
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

或手动启动查看详细错误信息：
```powershell
# 后端
cd backend
npm run dev

# 查看日志
Get-Content backend/logs/*.log -Tail 50
```

---

**修复完成后，项目应该可以正常运行！** 🎉

