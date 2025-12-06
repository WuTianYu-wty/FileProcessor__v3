#!/usr/bin/env node
/**
 * FileProcessor v3 - 统一启动脚本
 * 支持在 IDE 中一键启动和优雅关闭
 * 使用方法：node start-dev-unified.js
 * 或在 IDE 中直接运行此文件
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// 进程存储
const processes = {
  backend: null,
  frontend: null
};

// 日志函数
function log(message, color = colors.reset) {
  const timestamp = new Date().toLocaleTimeString('zh-CN');
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

function logBackend(message) {
  log(`[后端] ${message}`, colors.blue);
}

function logFrontend(message) {
  log(`[前端] ${message}`, colors.cyan);
}

function logSystem(message) {
  log(`[系统] ${message}`, colors.green);
}

function logError(message) {
  log(`[错误] ${message}`, colors.red);
}

function logWarning(message) {
  log(`[警告] ${message}`, colors.yellow);
}

// 检查依赖
function checkDependencies() {
  logSystem('检查项目依赖...');
  
  const backendNodeModules = path.join(__dirname, 'backend', 'node_modules');
  const frontendNodeModules = path.join(__dirname, 'frontend', 'node_modules');
  
  if (!fs.existsSync(backendNodeModules)) {
    logError('后端依赖未安装！');
    logWarning('请运行：cd backend && npm install');
    return false;
  }
  
  if (!fs.existsSync(frontendNodeModules)) {
    logError('前端依赖未安装！');
    logWarning('请运行：cd frontend && npm install');
    return false;
  }
  
  logSystem('依赖检查通过 ✓');
  return true;
}

// 启动后端
function startBackend() {
  return new Promise((resolve, reject) => {
    logBackend('正在启动后端服务...');
    
    const backendPath = path.join(__dirname, 'backend');
    
    // Windows 使用 npm.cmd，其他系统使用 npm
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    
    const backend = spawn(npmCmd, ['start'], {
      cwd: backendPath,
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true
    });
    
    processes.backend = backend;
    
    // 监听后端输出
    backend.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        output.split('\n').forEach(line => {
          logBackend(line);
          // 检测后端启动成功
          if (line.includes('Server running on port') || line.includes('服务器运行')) {
            resolve();
          }
        });
      }
    });
    
    backend.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output && !output.includes('DeprecationWarning')) {
        logError(`[后端] ${output}`);
      }
    });
    
    backend.on('close', (code) => {
      if (code !== 0 && code !== null) {
        logError(`后端进程退出，代码: ${code}`);
        reject(new Error(`Backend exited with code ${code}`));
      }
    });
    
    backend.on('error', (err) => {
      logError(`后端启动失败: ${err.message}`);
      reject(err);
    });
    
    // 设置超时，如果 5 秒内没有启动成功信息，也认为启动了
    setTimeout(() => {
      logBackend('后端服务已启动 (超时判定)');
      resolve();
    }, 5000);
  });
}

// 启动前端
function startFrontend() {
  return new Promise((resolve, reject) => {
    logFrontend('正在启动前端服务...');
    
    const frontendPath = path.join(__dirname, 'frontend');
    
    // Windows 使用 npm.cmd，其他系统使用 npm
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    
    const frontend = spawn(npmCmd, ['run', 'dev'], {
      cwd: frontendPath,
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true
    });
    
    processes.frontend = frontend;
    
    // 监听前端输出
    frontend.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        output.split('\n').forEach(line => {
          logFrontend(line);
          // 检测前端启动成功
          if (line.includes('Local:') || line.includes('localhost')) {
            resolve();
          }
        });
      }
    });
    
    frontend.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output && !output.includes('DeprecationWarning')) {
        // Vite 的一些输出会到 stderr，但不是错误
        if (output.includes('VITE') || output.includes('ready in')) {
          logFrontend(output);
        } else {
          logError(`[前端] ${output}`);
        }
      }
    });
    
    frontend.on('close', (code) => {
      if (code !== 0 && code !== null) {
        logError(`前端进程退出，代码: ${code}`);
        reject(new Error(`Frontend exited with code ${code}`));
      }
    });
    
    frontend.on('error', (err) => {
      logError(`前端启动失败: ${err.message}`);
      reject(err);
    });
    
    // 设置超时，如果 10 秒内没有启动成功信息，也认为启动了
    setTimeout(() => {
      logFrontend('前端服务已启动 (超时判定)');
      resolve();
    }, 10000);
  });
}

// 优雅关闭
function gracefulShutdown(signal) {
  log(`\n收到 ${signal} 信号，正在优雅关闭服务...`, colors.yellow);
  
  let shutdownCount = 0;
  const totalProcesses = Object.values(processes).filter(p => p !== null).length;
  
  if (totalProcesses === 0) {
    logSystem('没有运行中的进程');
    process.exit(0);
    return;
  }
  
  function checkShutdownComplete() {
    shutdownCount++;
    if (shutdownCount >= totalProcesses) {
      logSystem('所有服务已关闭');
      logSystem('再见！👋');
      process.exit(0);
    }
  }
  
  // 关闭前端
  if (processes.frontend) {
    logFrontend('正在关闭前端服务...');
    
    if (process.platform === 'win32') {
      // Windows: 使用 taskkill 强制关闭进程树
      spawn('taskkill', ['/pid', processes.frontend.pid, '/T', '/F'], {
        stdio: 'ignore'
      }).on('close', () => {
        logFrontend('前端服务已关闭 ✓');
        checkShutdownComplete();
      });
    } else {
      // Unix: 发送 SIGTERM
      processes.frontend.kill('SIGTERM');
      setTimeout(() => {
        if (processes.frontend && !processes.frontend.killed) {
          processes.frontend.kill('SIGKILL');
        }
        logFrontend('前端服务已关闭 ✓');
        checkShutdownComplete();
      }, 1000);
    }
  }
  
  // 关闭后端
  if (processes.backend) {
    logBackend('正在关闭后端服务...');
    
    if (process.platform === 'win32') {
      // Windows: 使用 taskkill 强制关闭进程树
      spawn('taskkill', ['/pid', processes.backend.pid, '/T', '/F'], {
        stdio: 'ignore'
      }).on('close', () => {
        logBackend('后端服务已关闭 ✓');
        checkShutdownComplete();
      });
    } else {
      // Unix: 发送 SIGTERM
      processes.backend.kill('SIGTERM');
      setTimeout(() => {
        if (processes.backend && !processes.backend.killed) {
          processes.backend.kill('SIGKILL');
        }
        logBackend('后端服务已关闭 ✓');
        checkShutdownComplete();
      }, 1000);
    }
  }
  
  // 设置强制退出超时（10秒）
  setTimeout(() => {
    logError('关闭超时，强制退出');
    process.exit(1);
  }, 10000);
}

// 主函数
async function main() {
  console.clear();
  
  // 打印欢迎信息
  console.log(colors.bright + colors.green);
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                                                          ║');
  console.log('║            FileProcessor v3 - 开发服务器                  ║');
  console.log('║                                                          ║');
  console.log('║              一键启动 · 优雅关闭 · IDE 友好                ║');
  console.log('║                                                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  logSystem('FileProcessor v3 统一启动脚本');
  logSystem('按 Ctrl+C 可以优雅关闭所有服务\n');
  
  try {
    // 检查依赖
    if (!checkDependencies()) {
      process.exit(1);
    }
    
    console.log('');
    
    // 启动后端
    await startBackend();
    logSystem('✓ 后端服务启动成功');
    
    console.log('');
    
    // 等待 2 秒
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 启动前端
    await startFrontend();
    logSystem('✓ 前端服务启动成功');
    
    console.log('');
    console.log(colors.bright + colors.green + '═'.repeat(60) + colors.reset);
    logSystem('🎉 所有服务启动成功！');
    console.log('');
    logSystem('📍 前端地址: http://localhost:5173');
    logSystem('📍 后端地址: http://localhost:3000');
    console.log('');
    logSystem('💡 提示：按 Ctrl+C 可以关闭所有服务');
    console.log(colors.bright + colors.green + '═'.repeat(60) + colors.reset);
    console.log('');
    
    // 监听关闭信号
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    
    // 监听未捕获的异常
    process.on('uncaughtException', (err) => {
      logError(`未捕获的异常: ${err.message}`);
      gracefulShutdown('EXCEPTION');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logError(`未处理的 Promise 拒绝: ${reason}`);
    });
    
  } catch (error) {
    logError(`启动失败: ${error.message}`);
    gracefulShutdown('ERROR');
  }
}

// 运行主函数
main().catch(error => {
  logError(`致命错误: ${error.message}`);
  process.exit(1);
});

