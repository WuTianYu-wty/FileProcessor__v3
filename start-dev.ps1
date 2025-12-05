# FileProcessor 开发环境启动脚本 (PowerShell)
# 设置控制台编码为 UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FileProcessor 开发环境启动" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 PowerShell 执行策略
$executionPolicy = Get-ExecutionPolicy -Scope CurrentUser
if ($executionPolicy -eq "Restricted") {
    Write-Host "⚠️  检测到 PowerShell 执行策略限制" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "当前执行策略: Restricted（禁止运行脚本）" -ForegroundColor Red
    Write-Host ""
    Write-Host "需要修改执行策略才能运行此脚本。请执行以下步骤：" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. 以管理员身份打开 PowerShell：" -ForegroundColor White
    Write-Host "   - 按 Win + S 搜索 'PowerShell'" -ForegroundColor Gray
    Write-Host "   - 右键点击 'Windows PowerShell'" -ForegroundColor Gray
    Write-Host "   - 选择 '以管理员身份运行'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. 在管理员窗口中执行：" -ForegroundColor White
    Write-Host "   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "3. 输入 Y 确认，然后关闭管理员窗口" -ForegroundColor White
    Write-Host ""
    Write-Host "4. 重新运行此脚本" -ForegroundColor White
    Write-Host ""
    Write-Host "详细说明请查看: INSTALL_VS_GUIDE.md" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "按 Enter 键退出"
    exit 1
}
Write-Host "✓ PowerShell 执行策略检查通过 ($executionPolicy)" -ForegroundColor Green
Write-Host ""

# 检查 Node.js 是否安装
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[错误] 未检测到 Node.js，请先安装 Node.js" -ForegroundColor Red
    Read-Host "按 Enter 键退出"
    exit 1
}

# 检查 Python 是否安装
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "[警告] 未检测到 Python，OCR 功能可能无法使用" -ForegroundColor Yellow
}

Write-Host "[1/3] 检查后端依赖..." -ForegroundColor Green
Set-Location backend

if (-not (Test-Path "node_modules")) {
    Write-Host "[安装] 正在安装后端依赖..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[错误] 后端依赖安装失败" -ForegroundColor Red
        Set-Location ..
        Read-Host "按 Enter 键退出"
        exit 1
    }
}

Write-Host ""
Write-Host "[2/3] 检查前端依赖..." -ForegroundColor Green
Set-Location ..\frontend

if (-not (Test-Path "node_modules")) {
    Write-Host "[安装] 正在安装前端依赖..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[错误] 前端依赖安装失败" -ForegroundColor Red
        Set-Location ..
        Read-Host "按 Enter 键退出"
        exit 1
    }
}

Write-Host ""
Write-Host "[3/3] 启动服务..." -ForegroundColor Green
Set-Location ..

# 启动后端服务
Write-Host "[启动] 后端服务 (端口 3000)..." -ForegroundColor Cyan
$backendPath = Join-Path $PWD "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm run dev"

# 等待 3 秒让后端启动
Start-Sleep -Seconds 3

# 启动前端服务
Write-Host "[启动] 前端服务 (端口 5173)..." -ForegroundColor Cyan
$frontendPath = Join-Path $PWD "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  服务启动完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  后端:  http://localhost:3000" -ForegroundColor White
Write-Host "  前端:  http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "  提示: 关闭此窗口不会停止服务" -ForegroundColor Yellow
Write-Host "        请关闭各个服务窗口以停止服务" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# 等待 5 秒后自动打开浏览器
Start-Sleep -Seconds 5
Start-Process "http://localhost:5173"

Read-Host "按 Enter 键退出"
