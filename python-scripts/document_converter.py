#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Document Converter - 文档格式转换工具
支持 Word/Excel/PPT 与 PDF 互转
"""

import sys
import json
import os
from pathlib import Path
from typing import Optional

try:
    import fitz  # PyMuPDF - PDF 处理
    from docx import Document  # python-docx - Word 处理
    from docx.shared import Pt, RGBColor, Inches
    from docx.enum.text import WD_ALIGN_PARAGRAPH
except ImportError as e:
    print(json.dumps({
        "success": False,
        "error": f"缺少依赖库: {e}。请运行: pip install PyMuPDF python-docx python-pptx openpyxl"
    }, ensure_ascii=False))
    sys.exit(1)


class DocumentConverter:
    """文档格式转换器"""
    
    @staticmethod
    def pdf_to_word(pdf_path: str, docx_path: str, extract_images: bool = True):
        """
        PDF 转 Word
        :param pdf_path: PDF 文件路径
        :param docx_path: 输出 Word 文件路径
        :param extract_images: 是否提取图片
        """
        try:
            # 打开 PDF
            pdf_doc = fitz.open(pdf_path)
            word_doc = Document()
            
            # 逐页转换
            for page_num in range(len(pdf_doc)):
                page = pdf_doc[page_num]
                
                # 提取文本
                text = page.get_text()
                if text.strip():
                    # 添加段落
                    for paragraph in text.split('\n'):
                        if paragraph.strip():
                            word_doc.add_paragraph(paragraph)
                
                # 提取图片（可选）
                if extract_images:
                    image_list = page.get_images()
                    for img_index, img in enumerate(image_list):
                        xref = img[0]
                        base_image = pdf_doc.extract_image(xref)
                        image_bytes = base_image["image"]
                        image_ext = base_image["ext"]
                        
                        # 保存临时图片
                        temp_img_path = f"temp_img_{page_num}_{img_index}.{image_ext}"
                        with open(temp_img_path, "wb") as img_file:
                            img_file.write(image_bytes)
                        
                        # 添加到 Word
                        try:
                            word_doc.add_picture(temp_img_path, width=Inches(4))
                        except:
                            pass
                        finally:
                            # 删除临时文件
                            if os.path.exists(temp_img_path):
                                os.remove(temp_img_path)
                
                # 页面分隔
                if page_num < len(pdf_doc) - 1:
                    word_doc.add_page_break()
            
            # 保存 Word 文档
            word_doc.save(docx_path)
            pdf_doc.close()
            
            return {
                "success": True,
                "message": f"PDF 已转换为 Word: {docx_path}",
                "output": docx_path,
                "pages": len(pdf_doc)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"PDF 转 Word 失败: {str(e)}"
            }
    
    @staticmethod
    def word_to_pdf(docx_path: str, pdf_path: str):
        """
        Word 转 PDF
        注意：需要安装 Microsoft Word 或使用 LibreOffice
        """
        try:
            # 方案1: 使用 docx2pdf（需要 MS Word）
            try:
                from docx2pdf import convert
                convert(docx_path, pdf_path)
                return {
                    "success": True,
                    "message": f"Word 已转换为 PDF: {pdf_path}",
                    "output": pdf_path
                }
            except ImportError:
                pass
            
            # 方案2: 使用 LibreOffice（跨平台方案）
            import subprocess
            try:
                # 尝试使用 LibreOffice
                result = subprocess.run([
                    'soffice',
                    '--headless',
                    '--convert-to', 'pdf',
                    '--outdir', os.path.dirname(pdf_path),
                    docx_path
                ], capture_output=True, text=True, timeout=60)
                
                if result.returncode == 0:
                    # LibreOffice 输出文件名可能不同，需要重命名
                    temp_pdf = os.path.join(
                        os.path.dirname(pdf_path),
                        os.path.splitext(os.path.basename(docx_path))[0] + '.pdf'
                    )
                    if os.path.exists(temp_pdf) and temp_pdf != pdf_path:
                        os.rename(temp_pdf, pdf_path)
                    
                    return {
                        "success": True,
                        "message": f"Word 已转换为 PDF: {pdf_path}",
                        "output": pdf_path,
                        "method": "LibreOffice"
                    }
                else:
                    raise Exception(f"LibreOffice 转换失败: {result.stderr}")
            except FileNotFoundError:
                return {
                    "success": False,
                    "error": "Word 转 PDF 需要安装 Microsoft Word 或 LibreOffice",
                    "install_guide": {
                        "Windows": "pip install docx2pdf（需要 MS Word）",
                        "Linux/Mac": "安装 LibreOffice: sudo apt-get install libreoffice"
                    }
                }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Word 转 PDF 失败: {str(e)}"
            }
    
    @staticmethod
    def excel_to_pdf(xlsx_path: str, pdf_path: str):
        """
        Excel 转 PDF
        使用 LibreOffice 或 openpyxl + reportlab
        """
        try:
            import subprocess
            
            # 使用 LibreOffice
            result = subprocess.run([
                'soffice',
                '--headless',
                '--convert-to', 'pdf',
                '--outdir', os.path.dirname(pdf_path),
                xlsx_path
            ], capture_output=True, text=True, timeout=60)
            
            if result.returncode == 0:
                temp_pdf = os.path.join(
                    os.path.dirname(pdf_path),
                    os.path.splitext(os.path.basename(xlsx_path))[0] + '.pdf'
                )
                if os.path.exists(temp_pdf) and temp_pdf != pdf_path:
                    os.rename(temp_pdf, pdf_path)
                
                return {
                    "success": True,
                    "message": f"Excel 已转换为 PDF: {pdf_path}",
                    "output": pdf_path
                }
            else:
                raise Exception(f"转换失败: {result.stderr}")
                
        except FileNotFoundError:
            return {
                "success": False,
                "error": "Excel 转 PDF 需要安装 LibreOffice",
                "install_guide": "Linux/Mac: sudo apt-get install libreoffice"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Excel 转 PDF 失败: {str(e)}"
            }
    
    @staticmethod
    def ppt_to_pdf(pptx_path: str, pdf_path: str):
        """
        PowerPoint 转 PDF
        使用 LibreOffice
        """
        try:
            import subprocess
            
            result = subprocess.run([
                'soffice',
                '--headless',
                '--convert-to', 'pdf',
                '--outdir', os.path.dirname(pdf_path),
                pptx_path
            ], capture_output=True, text=True, timeout=60)
            
            if result.returncode == 0:
                temp_pdf = os.path.join(
                    os.path.dirname(pdf_path),
                    os.path.splitext(os.path.basename(pptx_path))[0] + '.pdf'
                )
                if os.path.exists(temp_pdf) and temp_pdf != pdf_path:
                    os.rename(temp_pdf, pdf_path)
                
                return {
                    "success": True,
                    "message": f"PowerPoint 已转换为 PDF: {pdf_path}",
                    "output": pdf_path
                }
            else:
                raise Exception(f"转换失败: {result.stderr}")
                
        except FileNotFoundError:
            return {
                "success": False,
                "error": "PPT 转 PDF 需要安装 LibreOffice",
                "install_guide": "Linux/Mac: sudo apt-get install libreoffice"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"PPT 转 PDF 失败: {str(e)}"
            }
    
    @staticmethod
    def convert(input_path: str, output_path: str, extract_images: bool = True):
        """
        自动识别格式并转换
        :param input_path: 输入文件路径
        :param output_path: 输出文件路径
        :param extract_images: PDF转Word时是否提取图片
        """
        input_ext = Path(input_path).suffix.lower()
        output_ext = Path(output_path).suffix.lower()
        
        converter = DocumentConverter()
        
        # PDF 转其他格式
        if input_ext == '.pdf':
            if output_ext == '.docx':
                return converter.pdf_to_word(input_path, output_path, extract_images)
            else:
                return {
                    "success": False,
                    "error": f"不支持从 PDF 转换到 {output_ext}。当前支持: .docx"
                }
        
        # 其他格式转 PDF
        elif output_ext == '.pdf':
            if input_ext == '.docx':
                return converter.word_to_pdf(input_path, output_path)
            elif input_ext in ['.xlsx', '.xls']:
                return converter.excel_to_pdf(input_path, output_path)
            elif input_ext in ['.pptx', '.ppt']:
                return converter.ppt_to_pdf(input_path, output_path)
            else:
                return {
                    "success": False,
                    "error": f"不支持从 {input_ext} 转换到 PDF"
                }
        
        else:
            return {
                "success": False,
                "error": f"不支持 {input_ext} 到 {output_ext} 的转换"
            }


def main():
    """命令行入口"""
    if len(sys.argv) < 3:
        print(json.dumps({
            "success": False,
            "error": "用法: python document_converter.py <input_file> <output_file> [--extract-images]",
            "examples": [
                "python document_converter.py input.pdf output.docx",
                "python document_converter.py input.docx output.pdf",
                "python document_converter.py input.xlsx output.pdf"
            ]
        }, ensure_ascii=False, indent=2))
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    extract_images = '--extract-images' in sys.argv or '--images' in sys.argv
    
    if not os.path.exists(input_file):
        print(json.dumps({
            "success": False,
            "error": f"输入文件不存在: {input_file}"
        }, ensure_ascii=False))
        sys.exit(1)
    
    # 执行转换
    result = DocumentConverter.convert(input_file, output_file, extract_images)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    
    # 返回状态码
    sys.exit(0 if result.get('success') else 1)


if __name__ == "__main__":
    main()

