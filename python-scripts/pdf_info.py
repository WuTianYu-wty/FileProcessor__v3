#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PDF Info - PDF 信息获取工具
获取 PDF 文件的页数、大小、书签等信息
"""

import sys
import json
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    print("Error: PyMuPDF not found. Install it with: pip install PyMuPDF")
    sys.exit(1)


def get_pdf_info(input_pdf):
    """
    获取 PDF 文件信息
    :param input_pdf: PDF 文件路径
    :return: PDF 信息字典
    """
    try:
        doc = fitz.open(input_pdf)
        
        # 获取基本信息
        info = {
            'success': True,
            'file': str(input_pdf),
            'page_count': len(doc),
            'metadata': {
                'title': doc.metadata.get('title', ''),
                'author': doc.metadata.get('author', ''),
                'subject': doc.metadata.get('subject', ''),
                'keywords': doc.metadata.get('keywords', ''),
                'creator': doc.metadata.get('creator', ''),
                'producer': doc.metadata.get('producer', ''),
                'creationDate': doc.metadata.get('creationDate', ''),
                'modDate': doc.metadata.get('modDate', '')
            }
        }
        
        # 获取书签/目录
        toc = doc.get_toc()
        if toc:
            bookmarks = []
            for item in toc:
                level, title, page = item
                bookmarks.append({
                    'level': level,
                    'title': title,
                    'page': page
                })
            info['bookmarks'] = bookmarks
            info['has_bookmarks'] = True
        else:
            info['bookmarks'] = []
            info['has_bookmarks'] = False
        
        # 获取页面尺寸信息
        if len(doc) > 0:
            first_page = doc[0]
            rect = first_page.rect
            info['page_size'] = {
                'width': round(rect.width, 2),
                'height': round(rect.height, 2),
                'unit': 'points'  # PDF 使用点作为单位 (1 inch = 72 points)
            }
        
        doc.close()
        
        return info
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("Usage: python pdf_info.py <input.pdf>")
        sys.exit(1)
    
    input_pdf = sys.argv[1]
    
    if not Path(input_pdf).exists():
        print(json.dumps({
            'success': False,
            'error': f'File not found: {input_pdf}'
        }, ensure_ascii=False))
        sys.exit(1)
    
    result = get_pdf_info(input_pdf)
    
    print(json.dumps(result, ensure_ascii=False, indent=2))
    
    if not result.get('success'):
        sys.exit(1)


if __name__ == '__main__':
    main()

