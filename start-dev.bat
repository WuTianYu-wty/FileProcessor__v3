@echo off
chcp 65001 >nul 2>&1
REM FileProcessor 开发环境启动脚本 (Windows)
echo ========================================
echo   FileProcessor 开发环境启动
echo ========================================
echo.

REM 检查 Node.js 是否安装
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found, please install Node.js first
    pause
    exit /b 1
)

REM 检查 Python 是否安装
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Python not found, OCR features may not work
)

echo [1/3] Checking backend dependencies...
cd backend
if not exist "node_modules\" (
    echo [INSTALL] Installing backend dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Backend dependencies installation failed
        cd ..
        pause
        exit /b 1
    )
)

echo.
echo [2/3] Checking frontend dependencies...
cd ..\frontend
if not exist "node_modules\" (
    echo [INSTALL] Installing frontend dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Frontend dependencies installation failed
        cd ..
        pause
        exit /b 1
    )
)

echo.
echo [3/3] Starting services...
cd ..

REM 启动后端服务
echo [START] Backend server (port 3000)...
start "FileProcessor Backend" cmd /k "chcp 65001 >nul && cd /d %CD%\backend && npm run dev"

REM 等待 3 秒让后端启动
timeout /t 3 /nobreak >nul

REM 启动前端服务
echo [START] Frontend server (port 5173)...
start "FileProcessor Frontend" cmd /k "chcp 65001 >nul && cd /d %CD%\frontend && npm run dev"

echo.
echo ========================================
echo   Services started successfully!
echo ========================================
echo.
echo   Backend:  http://localhost:3000
echo   Frontend: http://localhost:5173
echo.
echo   Note: Closing this window will NOT stop the services
echo         Please close service windows to stop them
echo ========================================
echo.

REM 等待 5 秒后自动打开浏览器
timeout /t 5 /nobreak >nul
start http://localhost:5173

pause

