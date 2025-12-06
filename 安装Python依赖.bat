@echo off
chcp 65001 >nul
echo ====================================
echo     FileProcessor v3 Python依赖安装
echo ====================================
echo.
echo 正在安装 Python 依赖包...
echo 这可能需要几分钟时间，请耐心等待
echo.

cd python-scripts
pip install -r requirements.txt

echo.
echo ====================================
echo 安装完成！
echo ====================================
echo.
echo 现在可以使用文档转换功能了
echo.
pause

