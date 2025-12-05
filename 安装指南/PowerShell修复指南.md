# 修复 PowerShell 执行策略问题

## 🚨 错误信息

```
npm : 无法加载文件 D:\nodeJs\npm.ps1，因为在此系统上禁止运行脚本。
```

这是 Windows PowerShell 的安全限制，需要修改执行策略。

---

## ✅ 快速解决方案（3 步搞定）

### 第 1 步：以管理员身份打开 PowerShell

**三种方式任选其一**：

#### 方式 A：使用开始菜单
1. 点击 Windows 开始菜单（或按 `Win` 键）
2. 输入 `PowerShell`
3. 右键点击 **"Windows PowerShell"**
4. 选择 **"以管理员身份运行"**

#### 方式 B：使用搜索（推荐）
1. 按 `Win + S` 打开搜索
2. 输入 `PowerShell`
3. 右键点击搜索结果
4. 选择 **"以管理员身份运行"**

#### 方式 C：使用快捷键
1. 按 `Win + R` 打开运行对话框
2. 输入 `powershell`
3. 按 `Ctrl + Shift + Enter`（自动以管理员身份运行）

### 第 2 步：执行命令

在管理员 PowerShell 窗口中，复制粘贴以下命令并按 Enter：

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 第 3 步：确认提示

系统会显示类似以下提示：

```
执行策略更改
执行策略可帮助你防止执行不信任的脚本。更改执行策略可能会产生安全风险...
是否要更改执行策略?
[Y] 是(Y)  [A] 全是(A)  [N] 否(N)  [L] 全否(L)  [S] 暂停(S)  [?] 帮助 (默认值为"N"):
```

**输入 `Y` 并按 Enter**

### 第 4 步：验证设置

执行以下命令验证：

```powershell
Get-ExecutionPolicy -Scope CurrentUser
```

应该显示：**`RemoteSigned`**

### 第 5 步：完成

关闭管理员 PowerShell 窗口，打开新的普通 PowerShell 窗口，现在可以正常使用 npm 命令了！

```powershell
npm config get msvs_version
```

---

## 🔧 如果没有管理员权限怎么办？

如果你无法以管理员身份运行 PowerShell，可以使用临时方案：

### 临时解决方案（每次打开窗口都要执行）

在普通 PowerShell 窗口中执行：

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

**注意**：此设置仅对当前窗口有效，关闭窗口后失效。

### 或者使用 npm.cmd

在 PowerShell 中使用 `.cmd` 后缀：

```powershell
npm.cmd config get msvs_version
npm.cmd install
npm.cmd run dev
```

### 或者切换到 CMD

使用传统命令提示符（cmd.exe）代替 PowerShell，无需修改执行策略。

---

## 📖 执行策略说明

### 什么是执行策略？

PowerShell 执行策略是一项安全功能，用于控制哪些脚本可以运行。

### 执行策略级别

| 策略 | 说明 | 推荐 |
|------|------|------|
| **Restricted** | 默认策略，禁止运行所有脚本 | ❌ 不便于开发 |
| **RemoteSigned** | 本地脚本可运行，网络脚本需签名 | ✅ 推荐 |
| **Unrestricted** | 允许运行所有脚本 | ⚠️ 安全性低 |
| **Bypass** | 临时绕过所有限制 | ⚠️ 仅临时使用 |

### 为什么 RemoteSigned 是安全的？

- ✅ 只影响当前用户，不影响其他用户
- ✅ 本地创建的脚本可以直接运行
- ✅ 从互联网下载的脚本需要数字签名
- ✅ 平衡了安全性和便利性
- ✅ Microsoft 推荐的开发者设置

---

## 🎯 验证是否设置成功

打开新的 PowerShell 窗口，依次执行：

```powershell
# 1. 检查执行策略
Get-ExecutionPolicy -Scope CurrentUser
# 应显示: RemoteSigned

# 2. 测试 npm 命令
npm --version
# 应显示 npm 版本号

# 3. 测试 npm config
npm config get msvs_version
# 不再报错

# 4. 切换到项目目录
cd D:\CODE\FileProcessor_v3

# 5. 运行启动脚本
.\start-dev.ps1
# 应正常启动
```

---

## 🐛 常见问题

### Q1: 设置后还是报错？

**解决方案**：
1. 完全关闭所有 PowerShell 窗口
2. 打开**新的** PowerShell 窗口
3. 重新测试

### Q2: 忘记是否设置过？

**检查方法**：
```powershell
Get-ExecutionPolicy -List
```

查看 `CurrentUser` 的策略是否为 `RemoteSigned`

### Q3: 想恢复默认设置？

**恢复命令**：
```powershell
Set-ExecutionPolicy Restricted -Scope CurrentUser
```

### Q4: 在公司电脑上被限制？

如果公司有组策略限制，可能无法修改。请联系 IT 部门或使用 CMD 代替 PowerShell。

---

## 📚 相关文档

- [INSTALL_VS_GUIDE.md](INSTALL_VS_GUIDE.md) - Visual Studio 安装指南
- [QUICK_START.md](QUICK_START.md) - 快速启动指南
- [Microsoft 官方文档](https://learn.microsoft.com/zh-cn/powershell/module/microsoft.powershell.security/set-executionpolicy)

---

## ✨ 设置完成后的下一步

执行策略设置完成后，你可以：

1. **安装 Visual Studio Build Tools**
   - 查看 [INSTALL_VS_GUIDE.md](INSTALL_VS_GUIDE.md)

2. **运行项目启动脚本**
   ```powershell
   cd D:\CODE\FileProcessor_v3
   .\start-dev.ps1
   ```

3. **手动安装依赖**
   ```powershell
   # 后端
   cd backend
   npm install
   
   # 前端
   cd ..\frontend
   npm install
   ```

---

**问题解决了吗？** 🎉

如果还有其他问题，请查看 [QUICK_START.md](QUICK_START.md) 的常见问题部分。

