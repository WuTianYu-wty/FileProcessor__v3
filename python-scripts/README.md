# Python Scripts for FileProcessor

这个目录包含了 FileProcessor 项目使用的 Python 脚本，主要用于 OCR 识别和 PDF 处理。

## 环境要求

- Python 3.8 或更高版本
- pip 包管理器

## 安装依赖

```bash
pip install -r requirements.txt
```

## 脚本说明

### ocr_processor.py
OCR 文本识别和脱敏处理脚本。

功能：
- 支持 PDF、图片文件的 OCR 识别
- 自动识别并脱敏敏感信息（姓名、公司、车牌号等）
- 生成处理后的文件

### pdf_split.py
PDF 拆分工具。

功能：
- 按页码范围拆分 PDF
- 按目录（书签）拆分 PDF
- 自定义页码拆分

### pdf_merge.py
PDF 合并工具。

功能：
- 合并多个 PDF 文件
- 保留原有书签和元数据

## 使用说明

这些脚本通常由 Node.js 后端通过子进程调用，不建议直接运行。

如需测试，可以使用以下命令：

```bash
# OCR 处理
python ocr_processor.py input.pdf output.pdf

# PDF 拆分
python pdf_split.py input.pdf output_dir --mode pages --range 1-10

# PDF 合并
python pdf_merge.py file1.pdf file2.pdf file3.pdf output.pdf
```

## 注意事项

1. 首次运行 PaddleOCR 会自动下载模型文件，需要网络连接
2. OCR 处理比较耗时，建议在后台异步执行
3. 确保有足够的磁盘空间存储临时文件

