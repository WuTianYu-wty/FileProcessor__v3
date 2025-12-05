# 数据库结构修复脚本
# 用于将旧数据库更新到新的结构（添加 relative_path 字段）

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  数据库结构修复工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 better-sqlite3 是否可用
try {
    $dbPath = "backend\data\fileprocessor.db"
    
    if (-not (Test-Path $dbPath)) {
        Write-Host "数据库文件不存在，无需修复" -ForegroundColor Green
        exit 0
    }
    
    Write-Host "找到数据库文件: $dbPath" -ForegroundColor White
    Write-Host ""
    
    # 备份现有数据库
    $backupPath = "backend\data\fileprocessor.db.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $dbPath $backupPath
    Write-Host "✓ 已备份数据库到: $backupPath" -ForegroundColor Green
    Write-Host ""
    
    # 提示用户
    Write-Host "修复选项:" -ForegroundColor Yellow
    Write-Host "  1. 删除旧数据库，创建新数据库（快速，会丢失数据）" -ForegroundColor White
    Write-Host "  2. 手动更新表结构（保留数据，需要 SQLite 命令行）" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "请选择 (1/2)"
    
    if ($choice -eq "1") {
        Remove-Item $dbPath -Force
        Write-Host ""
        Write-Host "✓ 旧数据库已删除" -ForegroundColor Green
        Write-Host "  重启后端服务将自动创建新数据库" -ForegroundColor White
        Write-Host ""
    }
    elseif ($choice -eq "2") {
        Write-Host ""
        Write-Host "请使用 SQLite 命令行工具执行以下 SQL：" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "ALTER TABLE files ADD COLUMN relative_path TEXT;" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "或者使用 Node.js 脚本:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host @"
const Database = require('better-sqlite3');
const db = new Database('backend/data/fileprocessor.db');

try {
  db.exec('ALTER TABLE files ADD COLUMN relative_path TEXT;');
  console.log('✓ 字段添加成功');
} catch (error) {
  if (error.message.includes('duplicate column name')) {
    console.log('字段已存在，无需添加');
  } else {
    console.error('错误:', error.message);
  }
}

db.close();
"@ -ForegroundColor Cyan
        Write-Host ""
    }
    else {
        Write-Host "已取消" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "错误: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  修复完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "下一步:" -ForegroundColor Yellow
Write-Host "  1. 重启后端服务" -ForegroundColor White
Write-Host "  2. 测试文件上传功能" -ForegroundColor White
Write-Host ""


