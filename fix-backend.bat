@echo off
REM Quick fix script for backend dependencies issue
chcp 65001 >nul 2>&1

echo ========================================
echo   Backend Dependencies Quick Fix
echo ========================================
echo.

echo This script will:
echo  1. Remove old node_modules
echo  2. Remove package-lock.json
echo  3. Install dependencies with correct version
echo.

set /p confirm="Continue? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo Cancelled.
    pause
    exit /b 0
)

echo.
echo [1/3] Removing old node_modules...
cd backend
if exist "node_modules\" (
    echo Deleting node_modules folder...
    rmdir /s /q node_modules 2>nul
    if exist "node_modules\" (
        echo [WARNING] Could not delete node_modules
        echo Please close all terminal windows and try again
        echo Or manually delete: backend\node_modules
        pause
        exit /b 1
    )
    echo Done!
) else (
    echo node_modules not found, skipping...
)

echo.
echo [2/3] Removing package-lock.json...
if exist "package-lock.json" (
    del /f /q package-lock.json
    echo Done!
) else (
    echo package-lock.json not found, skipping...
)

echo.
echo [3/3] Installing dependencies...
echo This may take a few minutes...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Installation failed!
    echo Please check the error messages above.
    pause
    exit /b 1
)

cd ..

echo.
echo ========================================
echo   Fix completed successfully!
echo ========================================
echo.
echo Next step: Start the project
echo   .\start-dev.ps1   (PowerShell)
echo   .\start-dev-cn.bat (CMD)
echo.

pause

