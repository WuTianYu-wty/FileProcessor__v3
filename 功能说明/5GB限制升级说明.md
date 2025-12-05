# 文件大小限制升级说明 - 50MB → 5GB

## 📊 升级内容

已将文件上传大小限制从 **50MB** 提升至 **5GB**，以支持更大的文件处理需求。

---

## ✅ 已修改的文件

### 1. 后端配置

#### `backend/routes/fileRoutes.js`
```javascript
// 修改前
limits: {
  fileSize: 50 * 1024 * 1024 // 50MB
}

// 修改后
limits: {
  fileSize: 5 * 1024 * 1024 * 1024 // 5GB
}
```

#### `backend/server.js`
```javascript
// 修改前
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 修改后
app.use(express.json({ limit: '5gb' }));
app.use(express.urlencoded({ extended: true, limit: '5gb' }));
```

### 2. 前端配置

#### `frontend/src/pages/FileUpload.jsx`
```javascript
// 修改前
const isLt50M = file.size / 1024 / 1024 < 50
if (!isLt50M) {
  message.error(`${file.name} 文件大小超过 50MB`)
  return Upload.LIST_IGNORE
}

// 修改后
const isLt5G = file.size / 1024 / 1024 / 1024 < 5
if (!isLt5G) {
  message.error(`${file.name} 文件大小超过 5GB`)
  return Upload.LIST_IGNORE
}
```

#### Alert 提示信息
```jsx
// 修改前
description="...单个文件最大 50MB"

// 修改后
description="...单个文件最大 5GB"
```

### 3. 文档更新

- ✅ `README.md` - 更新文件大小说明
- ✅ `QUICK_START.md` - 更新快速开始指南

---

## ⚠️ 重要提示

### 1. 上传时间预估

| 文件大小 | 网速 100Mbps | 网速 1Gbps |
|---------|-------------|-----------|
| 500MB   | ~40 秒      | ~4 秒     |
| 1GB     | ~1.5 分钟   | ~8 秒     |
| 2GB     | ~3 分钟     | ~16 秒    |
| 5GB     | ~7 分钟     | ~40 秒    |

### 2. 系统资源需求

**内存**：
- 上传 5GB 文件时，服务器需要约 **5-6GB** 的可用内存
- 建议系统至少有 **8GB** RAM

**磁盘空间**：
- 确保 `uploads/` 目录有足够的磁盘空间
- 建议至少保留 **20GB+** 的可用空间

**超时配置**：
- 如果上传非常慢，可能需要调整 Nginx/Apache 的超时设置
- Node.js 默认无超时限制，但反向代理可能有

### 3. 浏览器兼容性

| 浏览器 | 最大文件大小限制 | 备注 |
|-------|---------------|------|
| Chrome | 无限制 | ✅ 推荐 |
| Firefox | 无限制 | ✅ 推荐 |
| Edge | 无限制 | ✅ 推荐 |
| Safari | ~2GB | ⚠️ 可能不支持 5GB |
| IE11 | ~2GB | ❌ 不推荐 |

### 4. 网络稳定性

**⚠️ 注意**：
- 5GB 文件上传需要稳定的网络连接
- **如果上传中断**（刷新页面、关闭浏览器、网络断开），需要重新上传
- 建议在**本地局域网**环境使用，避免通过互联网上传大文件

### 5. 错误处理

可能遇到的错误：

#### `413 Payload Too Large`
- **原因**：如果使用 Nginx 反向代理，默认限制为 1MB
- **解决**：在 Nginx 配置中添加：
```nginx
client_max_body_size 5G;
```

#### `ECONNRESET` 或 `Request Timeout`
- **原因**：网络不稳定或连接中断
- **解决**：检查网络连接，重新上传

#### 内存不足
- **原因**：系统内存不足以处理大文件
- **解决**：增加系统内存或减小上传文件

---

## 🔄 应用更改

### 方法 1：重启服务（推荐）

**后端**：
```powershell
# 在后端服务窗口按 Ctrl + C，然后重新运行
cd D:\CODE\FileProcessor_v3\backend
npm run dev
```

**前端**：
```powershell
# 在前端服务窗口按 Ctrl + C，然后重新运行
cd D:\CODE\FileProcessor_v3\frontend
npm run dev
```

### 方法 2：热重载（后端需要重启）

- **前端**：Vite 会自动检测到更改并热重载 ✓
- **后端**：Nodemon 会自动重启 ✓

---

## 🧪 测试建议

### 1. 小文件测试
首先上传一个小文件（几 MB）确保系统正常工作

### 2. 中等文件测试
上传 100-500MB 的文件测试稳定性

### 3. 大文件测试
最后测试 2-3GB 的文件

### 4. 检查项
- ✅ 文件能否成功上传
- ✅ 进度显示是否正常
- ✅ 上传后能否下载
- ✅ 文件大小是否正确
- ✅ 系统内存占用是否正常

---

## 💡 优化建议

如果发现大文件上传不稳定，建议考虑：

1. **实现分块上传**：
   - 将大文件分成小块（10-50MB）
   - 支持断点续传
   - 更稳定可靠

2. **添加上传队列**：
   - 限制同时上传的文件数量
   - 避免内存耗尽

3. **使用云存储**：
   - 对接阿里云 OSS、腾讯云 COS 等
   - 自动处理大文件上传

---

## 📞 需要帮助？

如果遇到问题：
1. 查看后端日志：`backend/logs/`
2. 检查浏览器控制台错误
3. 参考 [QUICK_START.md](QUICK_START.md) 的常见问题部分

---

**升级完成！** 🎉 现在可以上传最大 5GB 的文件了！


