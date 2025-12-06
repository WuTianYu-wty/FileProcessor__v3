const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../data/fileprocessor.db');
const db = new Database(dbPath);

console.log('开始添加文件版本管理表...');

try {
  // 创建文件版本表
  db.exec(`
    CREATE TABLE IF NOT EXISTS file_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_id INTEGER NOT NULL,
      version_number INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      checksum TEXT,
      comment TEXT,
      created_by TEXT DEFAULT 'system',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_current BOOLEAN DEFAULT 1,
      FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
    )
  `);

  // 创建索引以提高查询性能
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_file_versions_file_id 
    ON file_versions(file_id);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_file_versions_is_current 
    ON file_versions(is_current);
  `);

  // 添加版本控制配置到 settings 表
  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
  `);
  
  insertSetting.run('version_control_enabled', 'true');
  insertSetting.run('max_versions_per_file', '10');
  insertSetting.run('auto_create_version_on_edit', 'true');

  console.log('✅ 文件版本管理表添加成功！');
  console.log('');
  console.log('创建的表：');
  console.log('  - file_versions: 存储文件版本历史');
  console.log('');
  console.log('创建的索引：');
  console.log('  - idx_file_versions_file_id: 文件ID索引');
  console.log('  - idx_file_versions_is_current: 当前版本索引');
  console.log('');
  console.log('添加的配置：');
  console.log('  - version_control_enabled: 启用版本控制');
  console.log('  - max_versions_per_file: 每个文件最多保留10个版本');
  console.log('  - auto_create_version_on_edit: 编辑时自动创建版本');

} catch (error) {
  console.error('❌ 添加失败:', error.message);
  process.exit(1);
}

db.close();

