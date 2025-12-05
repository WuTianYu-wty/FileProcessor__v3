#!/bin/bash
# FileProcessor 开发环境启动脚本 (Linux/Mac)

echo "========================================"
echo "  FileProcessor 开发环境启动"
echo "========================================"
echo ""

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查 Python 是否安装
if ! command -v python3 &> /dev/null; then
    echo "[警告] 未检测到 Python，OCR 功能可能无法使用"
fi

echo "[1/3] 检查后端依赖..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "[安装] 正在安装后端依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[错误] 后端依赖安装失败"
        cd ..
        exit 1
    fi
fi

echo ""
echo "[2/3] 检查前端依赖..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    echo "[安装] 正在安装前端依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[错误] 前端依赖安装失败"
        cd ..
        exit 1
    fi
fi

echo ""
echo "[3/3] 启动服务..."
cd ..

# 创建日志目录
mkdir -p logs

# 启动后端服务
echo "[启动] 后端服务 (端口 3000)..."
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 3

# 启动前端服务
echo "[启动] 前端服务 (端口 5173)..."
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================"
echo "  服务启动完成！"
echo "========================================"
echo ""
echo "  后端: http://localhost:3000"
echo "  前端: http://localhost:5173"
echo ""
echo "  后端 PID: $BACKEND_PID"
echo "  前端 PID: $FRONTEND_PID"
echo ""
echo "  日志文件:"
echo "  - logs/backend.log"
echo "  - logs/frontend.log"
echo ""
echo "  停止服务:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo "========================================"
echo ""

# 保存 PID 到文件
echo $BACKEND_PID > logs/backend.pid
echo $FRONTEND_PID > logs/frontend.pid

# 等待用户按键
read -p "按 Enter 键停止所有服务..."

# 停止服务
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
echo "服务已停止"

