# Bug 修复报告 - 文件上传失败

## 🐛 问题描述

**症状**：文件上传失败，所有上传请求都返回错误

**错误信息**：
```
table files has no column named relative_path
```

**影响范围**：所有文件上传功能（单文件和文件夹上传）

---

## 🔍 问题分析

### 根本原因

在添加文件夹上传功能时，修改了数据库表结构：

```sql
-- 新增字段
ALTER TABLE files ADD COLUMN relative_path TEXT;
```

但是：
- ❌ 现有的数据库文件没有这个字段
- ❌ 代码尝试插入数据到不存在的字段
- ❌ SQLite 抛出错误："table files has no column named relative_path"

### 发生时间
2025-12-05 22:43:12 开始出现错误

### 影响代码

**backend/database/db.js**:
```javascript
// 新的插入语句包含 relative_path
INSERT INTO files (original_name, file_path, relative_path, file_type, size, status)
VALUES (?, ?, ?, ?, ?, ?)
```

---

## ✅ 解决方案

### 实施步骤

1. **停止后端服务**
   ```powershell
   # 关闭占用端口 3000 的进程
   Stop-Process -Id <PID>
   ```

2. **备份现有数据库**
   ```powershell
   Rename-Item backend\data\fileprocessor.db -NewName fileprocessor.db.backup
   ```

3. **重启后端服务**
   ```powershell
   cd backend
   npm run dev
   ```
   
   系统会自动创建包含新字段的数据库。

### 新数据库结构

```sql
CREATE TABLE files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  original_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  relative_path TEXT,              -- 新增字段
  file_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME,
  is_deleted BOOLEAN DEFAULT 0
);
```

---

## 🧪 验证测试

### 测试步骤

1. **单文件上传测试**
   - 切换到"文件"模式
   - 上传一个 PDF 文件
   - ✅ 应该成功上传

2. **文件夹上传测试**
   - 切换到"文件夹"模式
   - 上传一个包含文件的文件夹
   - ✅ 应该保持目录结构

3. **数据库验证**
   ```sql
   SELECT id, original_name, relative_path FROM files;
   ```
   - ✅ 文件模式上传：relative_path = 文件名
   - ✅ 文件夹模式上传：relative_path = 完整相对路径

---

## 📝 数据恢复（可选）

如果需要恢复旧数据库中的数据：

### 方法 1：使用 SQLite 命令行

```bash
# 打开旧数据库
sqlite3 backend/data/fileprocessor.db.backup

# 导出数据
.mode insert files
.output old_data.sql
SELECT * FROM files;
.quit

# 打开新数据库
sqlite3 backend/data/fileprocessor.db

# 修改并导入数据（需要手动调整 INSERT 语句）
.read old_data.sql
```

### 方法 2：使用 Node.js 脚本

```javascript
const oldDb = new Database('backend/data/fileprocessor.db.backup');
const newDb = new Database('backend/data/fileprocessor.db');

const oldFiles = oldDb.prepare('SELECT * FROM files').all();

const insert = newDb.prepare(`
  INSERT INTO files (original_name, file_path, relative_path, file_type, size, status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

oldFiles.forEach(file => {
  insert.run(
    file.original_name,
    file.file_path,
    file.original_name,  // 使用文件名作为 relative_path
    file.file_type,
    file.size,
    file.status,
    file.created_at
  );
});

oldDb.close();
newDb.close();
```

---

## 🔧 预防措施

### 1. 添加数据库迁移系统

**推荐使用**：`node-migrate` 或 `knex.js`

```javascript
// migrations/001-add-relative-path.js
exports.up = function(db) {
  return db.exec('ALTER TABLE files ADD COLUMN relative_path TEXT;');
};

exports.down = function(db) {
  // SQLite 不支持 DROP COLUMN，需要重建表
  return db.exec('/* rollback logic */');
};
```

### 2. 添加版本检查

在 `backend/database/db.js` 中：

```javascript
function checkSchemaVersion() {
  // 检查表结构是否最新
  const columns = db.prepare("PRAGMA table_info(files)").all();
  const hasRelativePath = columns.some(col => col.name === 'relative_path');
  
  if (!hasRelativePath) {
    logger.warn('Database schema outdated. Please run migrations.');
    throw new Error('Database schema needs to be updated');
  }
}
```

### 3. 添加启动检查

在服务器启动时验证数据库结构：

```javascript
function validateDatabase() {
  try {
    // 尝试查询新字段
    db.prepare('SELECT relative_path FROM files LIMIT 1').get();
    return true;
  } catch (error) {
    if (error.message.includes('no such column')) {
      logger.error('Database schema is outdated');
      return false;
    }
    throw error;
  }
}
```

---

## 📊 影响分析

### 受影响的功能
- ✅ 单文件上传 - 已修复
- ✅ 批量文件上传 - 已修复
- ✅ 文件夹上传 - 已修复
- ✅ 文件列表显示 - 已修复

### 数据丢失
- ⚠️ 旧数据库中的文件记录（已备份）
- ℹ️ 实际上传的文件仍在 `uploads/` 目录中

---

## ⏱️ 修复时间线

| 时间 | 事件 |
|------|------|
| 22:40:25 | 功能正常（修改前）|
| 22:43:12 | 首次出现错误 |
| 22:44:50 | 最后一次错误 |
| 22:53:06 | 修复完成，服务重启 |

**总修复时间**：约 10 分钟

---

## 📚 相关文档

- [FOLDER_UPLOAD_GUIDE.md](FOLDER_UPLOAD_GUIDE.md) - 文件夹上传功能说明
- [fix-database-schema.ps1](fix-database-schema.ps1) - 数据库修复脚本

---

## ✅ 修复状态

- [x] 问题已识别
- [x] 根本原因已分析
- [x] 解决方案已实施
- [x] 服务已恢复正常
- [x] 旧数据已备份
- [ ] 数据迁移工具（待实现）
- [ ] 自动迁移脚本（待实现）

---

**修复人员**：AI Assistant  
**修复日期**：2025-12-05  
**状态**：✅ 已解决

---

## 💡 经验教训

1. **数据库结构变更需要迁移脚本**
   - 不能直接修改代码而不更新数据库
   
2. **添加启动时的结构验证**
   - 在服务启动时检查数据库是否最新
   
3. **更好的错误信息**
   - 在日志中输出完整的错误栈
   - 添加更详细的上下文信息

4. **自动化测试**
   - 添加集成测试验证数据库操作
   - 在 CI/CD 中运行迁移脚本


