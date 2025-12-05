@echo off
REM FileProcessor 开发环境启动脚本 (Windows 中文版)
echo ========================================
echo   FileProcessor 开发环境启动
echo ========================================
echo.

REM 检查 Node.js 是否安装
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

REM 检查 Python 是否安装
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [警告] 未检测到 Python，OCR 功能可能无法使用
)

echo [1/3] 检查后端依赖...
cd backend
if not exist "node_modules\" (
    echo [安装] 正在安装后端依赖...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [错误] 后端依赖安装失败
        cd ..
        pause
        exit /b 1
    )
)

echo.
echo [2/3] 检查前端依赖...
cd ..\frontend
if not exist "node_modules\" (
    echo [安装] 正在安装前端依赖...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [错误] 前端依赖安装失败
        cd ..
        pause
        exit /b 1
    )
)

echo.
echo [3/3] 启动服务...
cd ..

REM 启动后端服务
echo [启动] 后端服务 (端口 3000)...
start "FileProcessor Backend" cmd /k "cd /d %CD%\backend && npm run dev"

REM 等待 3 秒让后端启动
timeout /t 3 /nobreak >nul

REM 启动前端服务
echo [启动] 前端服务 (端口 5173)...
start "FileProcessor Frontend" cmd /k "cd /d %CD%\frontend && npm run dev"

echo.
echo ========================================
echo   服务启动完成！
echo ========================================
echo.
echo   后端: http://localhost:3000
echo   前端: http://localhost:5173
echo.
echo   提示: 关闭此窗口不会停止服务
echo        请关闭各个服务窗口以停止服务
echo ========================================
echo.

REM 等待 5 秒后自动打开浏览器
timeout /t 5 /nobreak >nul
start http://localhost:5173

pause

