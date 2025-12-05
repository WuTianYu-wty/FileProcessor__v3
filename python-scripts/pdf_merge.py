#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PDF Merge - PDF 合并工具
合并多个 PDF 文件为一个文件
"""

import sys
import json
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    print("Error: PyMuPDF not found. Install it with: pip install PyMuPDF")
    sys.exit(1)


def merge_pdfs(input_files, output_file):
    """
    合并多个 PDF 文件
    :param input_files: 输入 PDF 文件列表
    :param output_file: 输出 PDF 路径
    :return: 合并结果
    """
    try:
        # 创建新文档
        merged_doc = fitz.open()
        
        total_pages = 0
        file_info = []
        
        for input_file in input_files:
            if not Path(input_file).exists():
                return {
                    'success': False,
                    'error': f"File not found: {input_file}"
                }
            
            # 打开文档
            doc = fitz.open(input_file)
            page_count = len(doc)
            
            # 插入所有页面
            merged_doc.insert_pdf(doc)
            
            file_info.append({
                'file': input_file,
                'pages': page_count,
                'start_page': total_pages + 1,
                'end_page': total_pages + page_count
            })
            
            total_pages += page_count
            doc.close()
        
        # 保存合并后的文档
        merged_doc.save(output_file)
        merged_doc.close()
        
        return {
            'success': True,
            'output_file': output_file,
            'total_pages': total_pages,
            'total_files': len(input_files),
            'files': file_info
        }
        
    except Exception as e:
        return {'success': False, 'error': str(e)}


def main():
    """主函数"""
    if len(sys.argv) < 4:
        print("Usage: python pdf_merge.py <output.pdf> <input1.pdf> <input2.pdf> [<input3.pdf> ...]")
        sys.exit(1)
    
    output_file = sys.argv[1]
    input_files = sys.argv[2:]
    
    result = merge_pdfs(input_files, output_file)
    
    print(json.dumps(result, ensure_ascii=False, indent=2))
    
    if not result.get('success'):
        sys.exit(1)


if __name__ == '__main__':
    main()

