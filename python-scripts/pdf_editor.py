#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PDF Editor - PDF 在线编辑工具
支持添加文字、标注、签名、高亮、删除等操作
"""

import sys
import json
import fitz  # PyMuPDF
from pathlib import Path
from typing import Dict, List, Optional


class PDFEditor:
    """PDF 编辑器"""
    
    def __init__(self, input_path: str):
        """
        初始化 PDF 编辑器
        :param input_path: 输入 PDF 文件路径
        """
        try:
            self.doc = fitz.open(input_path)
            self.input_path = input_path
        except Exception as e:
            raise Exception(f"无法打开 PDF 文件: {e}")
    
    def add_text(self, page_num: int, text: str, x: float, y: float, 
                 font_size: int = 12, color: tuple = (0, 0, 0),
                 font_name: str = "helv", bold: bool = False, italic: bool = False):
        """
        在指定页面添加文字
        :param page_num: 页码（从 0 开始）
        :param text: 要添加的文字
        :param x: X 坐标
        :param y: Y 坐标
        :param font_size: 字体大小
        :param color: 颜色 RGB (0-1 范围)
        :param font_name: 字体名称 (helv, times, cour 等)
        :param bold: 是否粗体
        :param italic: 是否斜体
        """
        try:
            page = self.doc[page_num]
            
            # 处理字体样式
            if bold and italic:
                font_name = font_name + "bi"
            elif bold:
                font_name = font_name + "b"
            elif italic:
                font_name = font_name + "i"
            
            # 添加文字
            page.insert_text(
                (x, y),
                text,
                fontsize=font_size,
                fontname=font_name,
                color=color
            )
            
            return {"success": True, "message": "文字添加成功"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def add_annotation(self, page_num: int, annotation_type: str,
                      rect: List[float], content: str = "",
                      color: tuple = (1, 1, 0)):
        """
        添加注释/标注
        :param page_num: 页码（从 0 开始）
        :param annotation_type: 注释类型 (highlight, underline, strikeout, squiggly, text, square, circle)
        :param rect: 矩形区域 [x0, y0, x1, y1]
        :param content: 注释内容
        :param color: 颜色 RGB (0-1 范围)
        """
        try:
            page = self.doc[page_num]
            annot_rect = fitz.Rect(rect)
            
            annotation_types = {
                'highlight': fitz.PDF_ANNOT_HIGHLIGHT,
                'underline': fitz.PDF_ANNOT_UNDERLINE,
                'strikeout': fitz.PDF_ANNOT_STRIKEOUT,
                'squiggly': fitz.PDF_ANNOT_SQUIGGLY,
                'text': fitz.PDF_ANNOT_TEXT,
                'square': fitz.PDF_ANNOT_SQUARE,
                'circle': fitz.PDF_ANNOT_CIRCLE,
                'freetext': fitz.PDF_ANNOT_FREE_TEXT
            }
            
            annot_type = annotation_types.get(annotation_type, fitz.PDF_ANNOT_HIGHLIGHT)
            
            # 创建注释
            annot = page.add_annot(annot_type, annot_rect)
            annot.set_colors(stroke=color)
            
            # 设置注释内容
            if content:
                annot.set_info(content=content)
            
            annot.update()
            
            return {"success": True, "message": f"{annotation_type} 标注添加成功"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def add_signature(self, page_num: int, signature_path: str,
                     x: float, y: float, width: float = 100, height: float = 50):
        """
        添加签名图片
        :param page_num: 页码（从 0 开始）
        :param signature_path: 签名图片路径
        :param x: X 坐标
        :param y: Y 坐标
        :param width: 签名宽度
        :param height: 签名高度
        """
        try:
            page = self.doc[page_num]
            rect = fitz.Rect(x, y, x + width, y + height)
            
            # 插入图片
            page.insert_image(rect, filename=signature_path)
            
            return {"success": True, "message": "签名添加成功"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def add_shape(self, page_num: int, shape_type: str,
                 points: List[float], color: tuple = (0, 0, 0),
                 fill_color: Optional[tuple] = None, width: float = 1):
        """
        添加形状
        :param page_num: 页码（从 0 开始）
        :param shape_type: 形状类型 (line, rect, circle, arrow)
        :param points: 坐标点 [x0, y0, x1, y1]
        :param color: 边框颜色 RGB (0-1 范围)
        :param fill_color: 填充颜色 RGB (0-1 范围)
        :param width: 线宽
        """
        try:
            page = self.doc[page_num]
            shape = page.new_shape()
            
            if shape_type == 'line':
                shape.draw_line(fitz.Point(points[0], points[1]),
                              fitz.Point(points[2], points[3]))
            elif shape_type == 'rect':
                shape.draw_rect(fitz.Rect(points))
            elif shape_type == 'circle':
                # points 为 [x, y, radius]
                shape.draw_circle(fitz.Point(points[0], points[1]), points[2])
            elif shape_type == 'arrow':
                p1 = fitz.Point(points[0], points[1])
                p2 = fitz.Point(points[2], points[3])
                shape.draw_line(p1, p2)
                # 添加箭头
                shape.finish(color=color, width=width)
                # 绘制箭头头部
                angle = fitz.Point(p2 - p1).atan
                arrow_size = 10
                p3 = p2 + fitz.Point(-arrow_size, arrow_size / 2).rotate(angle)
                p4 = p2 + fitz.Point(-arrow_size, -arrow_size / 2).rotate(angle)
                shape.draw_polyline([p2, p3])
                shape.draw_polyline([p2, p4])
            
            # 设置颜色
            shape.finish(color=color, fill=fill_color, width=width)
            shape.commit()
            
            return {"success": True, "message": f"{shape_type} 添加成功"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def delete_annotation(self, page_num: int, annot_index: int):
        """
        删除指定注释
        :param page_num: 页码（从 0 开始）
        :param annot_index: 注释索引
        """
        try:
            page = self.doc[page_num]
            annots = list(page.annots())
            
            if 0 <= annot_index < len(annots):
                page.delete_annot(annots[annot_index])
                return {"success": True, "message": "注释删除成功"}
            else:
                return {"success": False, "error": "注释索引无效"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def rotate_page(self, page_num: int, angle: int):
        """
        旋转页面
        :param page_num: 页码（从 0 开始）
        :param angle: 旋转角度 (90, 180, 270)
        """
        try:
            page = self.doc[page_num]
            page.set_rotation(angle)
            return {"success": True, "message": f"页面旋转 {angle}° 成功"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_annotations(self, page_num: int):
        """
        获取页面上的所有注释
        :param page_num: 页码（从 0 开始）
        """
        try:
            page = self.doc[page_num]
            annotations = []
            
            for annot in page.annots():
                annot_info = {
                    'type': annot.type[1],  # 注释类型名称
                    'rect': list(annot.rect),
                    'content': annot.info.get('content', ''),
                    'color': annot.colors.get('stroke', (0, 0, 0))
                }
                annotations.append(annot_info)
            
            return {"success": True, "annotations": annotations, "count": len(annotations)}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def save(self, output_path: str, incremental: bool = False):
        """
        保存 PDF
        :param output_path: 输出文件路径
        :param incremental: 是否增量保存（仅保存更改）
        """
        try:
            self.doc.save(output_path, incremental=incremental, encryption=fitz.PDF_ENCRYPT_KEEP)
            return {"success": True, "message": f"PDF 已保存到: {output_path}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def close(self):
        """关闭 PDF 文档"""
        if self.doc:
            self.doc.close()


def batch_edit(input_path: str, operations: List[Dict], output_path: str):
    """
    批量执行编辑操作
    :param input_path: 输入 PDF 路径
    :param operations: 操作列表
    :param output_path: 输出 PDF 路径
    """
    results = []
    editor = None
    
    try:
        editor = PDFEditor(input_path)
        
        for op in operations:
            op_type = op.get('type')
            page_num = op.get('page', 0)
            
            if op_type == 'add_text':
                result = editor.add_text(
                    page_num=page_num,
                    text=op['text'],
                    x=op['x'],
                    y=op['y'],
                    font_size=op.get('fontSize', 12),
                    color=tuple(op.get('color', [0, 0, 0])),
                    font_name=op.get('fontName', 'helv'),
                    bold=op.get('bold', False),
                    italic=op.get('italic', False)
                )
            elif op_type == 'add_annotation':
                result = editor.add_annotation(
                    page_num=page_num,
                    annotation_type=op['annotationType'],
                    rect=op['rect'],
                    content=op.get('content', ''),
                    color=tuple(op.get('color', [1, 1, 0]))
                )
            elif op_type == 'add_signature':
                result = editor.add_signature(
                    page_num=page_num,
                    signature_path=op['signaturePath'],
                    x=op['x'],
                    y=op['y'],
                    width=op.get('width', 100),
                    height=op.get('height', 50)
                )
            elif op_type == 'add_shape':
                result = editor.add_shape(
                    page_num=page_num,
                    shape_type=op['shapeType'],
                    points=op['points'],
                    color=tuple(op.get('color', [0, 0, 0])),
                    fill_color=tuple(op['fillColor']) if op.get('fillColor') else None,
                    width=op.get('width', 1)
                )
            elif op_type == 'delete_annotation':
                result = editor.delete_annotation(
                    page_num=page_num,
                    annot_index=op['annotIndex']
                )
            elif op_type == 'rotate_page':
                result = editor.rotate_page(
                    page_num=page_num,
                    angle=op['angle']
                )
            else:
                result = {"success": False, "error": f"未知操作类型: {op_type}"}
            
            results.append({
                "operation": op_type,
                "page": page_num,
                "result": result
            })
        
        # 保存修改后的 PDF
        save_result = editor.save(output_path)
        
        return {
            "success": True,
            "operations": results,
            "save_result": save_result,
            "output": output_path
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "operations": results
        }
    finally:
        if editor:
            editor.close()


def main():
    """命令行入口"""
    if len(sys.argv) < 4:
        print("用法: python pdf_editor.py <input.pdf> <operations.json> <output.pdf>")
        print("operations.json 格式示例:")
        print(json.dumps([
            {
                "type": "add_text",
                "page": 0,
                "text": "示例文字",
                "x": 100,
                "y": 100,
                "fontSize": 14,
                "color": [1, 0, 0]
            }
        ], indent=2, ensure_ascii=False))
        sys.exit(1)
    
    input_pdf = sys.argv[1]
    operations_file = sys.argv[2]
    output_pdf = sys.argv[3]
    
    # 读取操作配置
    try:
        with open(operations_file, 'r', encoding='utf-8') as f:
            operations = json.load(f)
    except Exception as e:
        print(json.dumps({"success": False, "error": f"无法读取操作配置: {e}"}, ensure_ascii=False))
        sys.exit(1)
    
    # 执行批量编辑
    result = batch_edit(input_pdf, operations, output_pdf)
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()

