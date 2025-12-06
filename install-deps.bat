@echo off
echo ========================================
echo  Installing Python Dependencies...
echo ========================================
echo.

cd python-scripts
pip install -r requirements-minimal.txt

echo.
if errorlevel 1 (
    echo Installation FAILED!
    echo.
    echo Try: pip install -r requirements-minimal.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
) else (
    echo.
    echo Installation SUCCESS!
    echo Please restart the server.
)
echo.
pause

