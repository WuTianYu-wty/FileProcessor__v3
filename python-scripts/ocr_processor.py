#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OCR Processor - 文本识别与脱敏处理
支持 PDF、图片文件的 OCR 识别和敏感信息脱敏
"""

import sys
import re
import json
from pathlib import Path

try:
    from paddleocr import PaddleOCR
    import fitz  # PyMuPDF
    from PIL import Image
except ImportError as e:
    print(f"Error: Missing required library - {e}")
    print("Please install dependencies: pip install -r requirements.txt")
    sys.exit(1)


class OCRProcessor:
    """OCR 处理器"""
    
    def __init__(self):
        """初始化 OCR 引擎"""
        self.ocr = PaddleOCR(use_angle_cls=True, lang='ch', use_gpu=False)
        
        # 脱敏规则（正则表达式）
        self.desensitize_patterns = {
            'phone': r'1[3-9]\d{9}',  # 手机号
            'id_card': r'\d{17}[\dXx]',  # 身份证号
            'email': r'[\w\.-]+@[\w\.-]+\.\w+',  # 邮箱
            'car_plate': r'[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-HJ-NP-Z0-9]{5}',  # 车牌号
        }
    
    def process_pdf(self, input_path, output_path):
        """
        处理 PDF 文件
        :param input_path: 输入 PDF 路径
        :param output_path: 输出 PDF 路径
        :return: 处理结果
        """
        try:
            doc = fitz.open(input_path)
            results = []
            
            for page_num in range(len(doc)):
                page = doc[page_num]
                
                # 将页面转换为图片
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                img_path = f"temp_page_{page_num}.png"
                pix.save(img_path)
                
                # OCR 识别
                ocr_result = self.ocr.ocr(img_path, cls=True)
                
                # 提取文本
                texts = []
                if ocr_result and len(ocr_result) > 0:
                    for line in ocr_result[0]:
                        if line:
                            text = line[1][0]
                            texts.append(text)
                
                # 脱敏处理
                desensitized_texts = [self.desensitize_text(text) for text in texts]
                
                results.append({
                    'page': page_num + 1,
                    'original_text': texts,
                    'desensitized_text': desensitized_texts
                })
                
                # 清理临时文件
                Path(img_path).unlink(missing_ok=True)
            
            doc.close()
            
            # 保存结果
            result_data = {
                'input_file': str(input_path),
                'output_file': str(output_path),
                'total_pages': len(results),
                'results': results
            }
            
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(result_data, f, ensure_ascii=False, indent=2)
            
            return result_data
            
        except Exception as e:
            return {'error': str(e)}
    
    def desensitize_text(self, text):
        """
        脱敏文本中的敏感信息
        :param text: 原始文本
        :return: 脱敏后的文本
        """
        desensitized = text
        
        # 应用所有脱敏规则
        for pattern_type, pattern in self.desensitize_patterns.items():
            if pattern_type == 'phone':
                desensitized = re.sub(pattern, lambda m: m.group()[:3] + '****' + m.group()[-4:], desensitized)
            elif pattern_type == 'id_card':
                desensitized = re.sub(pattern, lambda m: m.group()[:6] + '********' + m.group()[-4:], desensitized)
            elif pattern_type == 'email':
                desensitized = re.sub(pattern, lambda m: m.group().split('@')[0][:2] + '***@' + m.group().split('@')[1], desensitized)
            elif pattern_type == 'car_plate':
                desensitized = re.sub(pattern, lambda m: m.group()[:2] + '***' + m.group()[-2:], desensitized)
        
        return desensitized


def main():
    """主函数"""
    if len(sys.argv) < 3:
        print("Usage: python ocr_processor.py <input_file> <output_file>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    processor = OCRProcessor()
    result = processor.process_pdf(input_file, output_file)
    
    if 'error' in result:
        print(f"Error: {result['error']}")
        sys.exit(1)
    else:
        print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()

