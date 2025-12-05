#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PDF Split - PDF 拆分工具
支持按页码、按目录拆分 PDF 文件
"""

import sys
import json
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    print("Error: PyMuPDF not found. Install it with: pip install PyMuPDF")
    sys.exit(1)


def split_by_pages(input_pdf, output_dir, page_ranges):
    """
    按页码范围拆分 PDF
    :param input_pdf: 输入 PDF 路径
    :param output_dir: 输出目录
    :param page_ranges: 页码范围列表，如 [(1, 5), (6, 10)]
    :return: 拆分结果
    """
    try:
        doc = fitz.open(input_pdf)
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        results = []
        
        for idx, (start, end) in enumerate(page_ranges, 1):
            # 创建新文档
            new_doc = fitz.open()
            
            # 复制页面（注意：fitz 使用 0 索引）
            new_doc.insert_pdf(doc, from_page=start-1, to_page=end-1)
            
            # 保存
            output_path = output_dir / f"split_{idx}_pages_{start}-{end}.pdf"
            new_doc.save(str(output_path))
            new_doc.close()
            
            results.append({
                'file': str(output_path),
                'pages': f"{start}-{end}",
                'page_count': end - start + 1
            })
        
        doc.close()
        
        return {
            'success': True,
            'total_splits': len(results),
            'results': results
        }
        
    except Exception as e:
        return {'success': False, 'error': str(e)}


def split_by_bookmarks(input_pdf, output_dir):
    """
    按 PDF 书签（目录）拆分
    :param input_pdf: 输入 PDF 路径
    :param output_dir: 输出目录
    :return: 拆分结果
    """
    try:
        doc = fitz.open(input_pdf)
        toc = doc.get_toc()  # 获取目录
        
        if not toc:
            return {
                'success': False,
                'error': 'PDF has no bookmarks/table of contents'
            }
        
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        results = []
        
        # 处理每个章节
        for idx, item in enumerate(toc):
            level, title, page_num = item
            
            # 只处理一级标题
            if level == 1:
                # 找到结束页
                end_page = None
                for next_item in toc[idx+1:]:
                    if next_item[0] == 1:  # 下一个一级标题
                        end_page = next_item[2] - 1
                        break
                
                if end_page is None:
                    end_page = len(doc)
                
                # 创建新文档
                new_doc = fitz.open()
                new_doc.insert_pdf(doc, from_page=page_num-1, to_page=end_page-1)
                
                # 清理标题作为文件名
                safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).strip()
                output_path = output_dir / f"{idx+1}_{safe_title}.pdf"
                
                new_doc.save(str(output_path))
                new_doc.close()
                
                results.append({
                    'file': str(output_path),
                    'title': title,
                    'pages': f"{page_num}-{end_page}",
                    'page_count': end_page - page_num + 1
                })
        
        doc.close()
        
        return {
            'success': True,
            'total_splits': len(results),
            'results': results
        }
        
    except Exception as e:
        return {'success': False, 'error': str(e)}


def main():
    """主函数"""
    if len(sys.argv) < 4:
        print("Usage:")
        print("  By pages: python pdf_split.py <input.pdf> <output_dir> pages <start-end> [<start-end> ...]")
        print("  By bookmarks: python pdf_split.py <input.pdf> <output_dir> bookmarks")
        sys.exit(1)
    
    input_pdf = sys.argv[1]
    output_dir = sys.argv[2]
    mode = sys.argv[3]
    
    if mode == 'pages':
        if len(sys.argv) < 5:
            print("Error: Please specify page ranges (e.g., 1-5 6-10)")
            sys.exit(1)
        
        # 解析页码范围
        page_ranges = []
        for range_str in sys.argv[4:]:
            start, end = map(int, range_str.split('-'))
            page_ranges.append((start, end))
        
        result = split_by_pages(input_pdf, output_dir, page_ranges)
    
    elif mode == 'bookmarks':
        result = split_by_bookmarks(input_pdf, output_dir)
    
    else:
        print(f"Error: Unknown mode '{mode}'. Use 'pages' or 'bookmarks'")
        sys.exit(1)
    
    print(json.dumps(result, ensure_ascii=False, indent=2))
    
    if not result.get('success'):
        sys.exit(1)


if __name__ == '__main__':
    main()

