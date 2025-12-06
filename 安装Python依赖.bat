@echo off
chcp 65001 >nul
echo ====================================
echo  FileProcessor v3 Python依赖安装
echo ====================================
echo.
echo 请选择安装方式：
echo [1] 最小化安装（仅文档转换功能 - 推荐）
echo [2] 完整安装（包含OCR功能 - 需要较长时间）
echo.
set /p choice=请输入选择 (1或2): 

if "%choice%"=="1" (
    echo.
    echo 正在安装最小化依赖包...
    echo 这可能需要1-2分钟
    echo.
    cd python-scripts
    pip install -r requirements-minimal.txt
) else if "%choice%"=="2" (
    echo.
    echo 正在安装完整依赖包...
    echo 这可能需要5-10分钟（OCR库较大）
    echo.
    cd python-scripts
    pip install -r requirements.txt
) else (
    echo 无效选择，退出...
    pause
    exit /b
)

echo.
if errorlevel 1 (
    echo ====================================
    echo 安装失败！
    echo ====================================
    echo.
    echo 可能的原因：
    echo 1. 网络连接问题
    echo 2. Python版本不兼容（需要3.8+）
    echo 3. pip版本过旧
    echo.
    echo 建议：
    echo 1. 升级pip: python -m pip install --upgrade pip
    echo 2. 使用国内镜像: pip install -r requirements-minimal.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
    echo.
) else (
    echo.
    echo ====================================
    echo 安装完成！
    echo ====================================
    echo.
    echo 现在可以使用文档转换功能了
    echo 请重启服务使更改生效
    echo.
)
pause

