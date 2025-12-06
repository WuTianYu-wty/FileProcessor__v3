#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OCR Processor Enhanced - 增强版文本识别与脱敏处理
支持 GPU 加速、自定义姓名脱敏、性能优化
"""

import sys
import re
import json
import os
from pathlib import Path
from typing import Dict, List, Optional

try:
    from paddleocr import PaddleOCR
    import fitz  # PyMuPDF
    from PIL import Image
    import numpy as np
except ImportError as e:
    print(f"Error: Missing required library - {e}")
    print("Please install dependencies: pip install -r requirements.txt")
    sys.exit(1)


class OCRProcessorEnhanced:
    """增强版 OCR 处理器 - 支持 GPU 加速和自定义脱敏"""
    
    def __init__(self, use_gpu=True, custom_names=None, custom_patterns=None):
        """
        初始化 OCR 引擎
        :param use_gpu: 是否使用 GPU 加速
        :param custom_names: 自定义姓名列表（用于脱敏）
        :param custom_patterns: 自定义脱敏规则字典
        """
        # 检测 GPU 可用性
        self.use_gpu = use_gpu
        if use_gpu:
            try:
                import paddle
                if paddle.is_compiled_with_cuda():
                    print("✅ GPU 加速已启用 - 使用 CUDA")
                else:
                    print("⚠️ GPU 不可用，使用 CPU 模式")
                    self.use_gpu = False
            except:
                print("⚠️ GPU 检测失败，使用 CPU 模式")
                self.use_gpu = False
        
        # 初始化 PaddleOCR
        self.ocr = PaddleOCR(
            use_angle_cls=True,
            lang='ch',
            use_gpu=self.use_gpu,
            gpu_mem=500,  # GPU 内存限制 (MB)
            enable_mkldnn=not self.use_gpu,  # CPU 优化
            use_tensorrt=self.use_gpu,  # GPU TensorRT 加速
            show_log=False  # 减少日志输出
        )
        
        # 基础脱敏规则
        self.desensitize_patterns = {
            'phone': r'1[3-9]\d{9}',  # 手机号
            'id_card': r'\d{17}[\dXx]',  # 身份证号
            'email': r'[\w\.-]+@[\w\.-]+\.\w+',  # 邮箱
            'car_plate': r'[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-HJ-NP-Z0-9]{5}',  # 车牌号
            'bank_card': r'\d{16,19}',  # 银行卡号
            'address': r'(?:省|市|区|县|镇|街道|路|号|室|栋|楼).{5,50}',  # 地址（简化）
        }
        
        # 添加自定义规则
        if custom_patterns:
            self.desensitize_patterns.update(custom_patterns)
        
        # 自定义姓名列表
        self.custom_names = custom_names or []
        
        # 常见姓名库（前100个常见姓氏）
        self.common_surnames = [
            '王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴',
            '徐', '孙', '马', '朱', '胡', '郭', '何', '高', '林', '罗',
            '郑', '梁', '谢', '宋', '唐', '许', '韩', '冯', '邓', '曹',
            '彭', '曾', '肖', '田', '董', '袁', '潘', '于', '蒋', '蔡',
            '余', '杜', '叶', '程', '苏', '魏', '吕', '丁', '任', '沈',
            '姚', '卢', '姜', '崔', '钟', '谭', '陆', '汪', '范', '金',
            '石', '廖', '贾', '夏', '韦', '付', '方', '白', '邹', '孟',
            '熊', '秦', '邱', '江', '尹', '薛', '闫', '段', '雷', '侯',
            '龙', '史', '陶', '黎', '贺', '顾', '毛', '郝', '龚', '邵',
            '万', '钱', '严', '覃', '武', '戴', '莫', '孔', '向', '汤'
        ]
        
        # 性能统计
        self.stats = {
            'total_pages': 0,
            'total_time': 0,
            'gpu_enabled': self.use_gpu
        }
    
    def process_pdf(self, input_path, output_path, enable_name_desensitize=True):
        """
        处理 PDF 文件（增强版）
        :param input_path: 输入 PDF 路径
        :param output_path: 输出 JSON 路径
        :param enable_name_desensitize: 是否启用姓名脱敏
        :return: 处理结果
        """
        import time
        start_time = time.time()
        
        try:
            doc = fitz.open(input_path)
            results = []
            
            print(f"开始处理 PDF: {input_path}")
            print(f"总页数: {len(doc)}")
            print(f"GPU 加速: {'✅ 启用' if self.use_gpu else '❌ 未启用'}")
            
            for page_num in range(len(doc)):
                page_start = time.time()
                page = doc[page_num]
                
                # 将页面转换为图片（提高分辨率以改善识别效果）
                zoom = 2  # 缩放倍数
                pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom))
                img_path = f"temp_page_{page_num}.png"
                pix.save(img_path)
                
                # OCR 识别
                ocr_result = self.ocr.ocr(img_path, cls=True)
                
                # 提取文本
                texts = []
                confidences = []
                if ocr_result and len(ocr_result) > 0:
                    for line in ocr_result[0]:
                        if line:
                            text = line[1][0]
                            confidence = line[1][1]
                            texts.append(text)
                            confidences.append(confidence)
                
                # 脱敏处理
                desensitized_texts = [
                    self.desensitize_text(text, enable_name_desensitize) 
                    for text in texts
                ]
                
                # 识别的敏感信息类型
                sensitive_types = [
                    self.detect_sensitive_types(text) 
                    for text in texts
                ]
                
                page_time = time.time() - page_start
                
                results.append({
                    'page': page_num + 1,
                    'original_text': texts,
                    'desensitized_text': desensitized_texts,
                    'confidences': confidences,
                    'sensitive_types': sensitive_types,
                    'processing_time': round(page_time, 2)
                })
                
                print(f"✓ 页面 {page_num + 1}/{len(doc)} 完成 - 用时: {page_time:.2f}秒")
                
                # 清理临时文件
                Path(img_path).unlink(missing_ok=True)
            
            doc.close()
            
            total_time = time.time() - start_time
            
            # 保存结果
            result_data = {
                'input_file': str(input_path),
                'output_file': str(output_path),
                'total_pages': len(results),
                'results': results,
                'performance': {
                    'total_time': round(total_time, 2),
                    'avg_time_per_page': round(total_time / len(results), 2) if results else 0,
                    'gpu_enabled': self.use_gpu,
                    'gpu_model': self.get_gpu_info() if self.use_gpu else None
                },
                'settings': {
                    'name_desensitize_enabled': enable_name_desensitize,
                    'custom_names_count': len(self.custom_names)
                }
            }
            
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(result_data, f, ensure_ascii=False, indent=2)
            
            print(f"\n✅ 处理完成！")
            print(f"总用时: {total_time:.2f}秒")
            print(f"平均每页: {total_time/len(results):.2f}秒")
            
            return result_data
            
        except Exception as e:
            return {'error': str(e)}
    
    def desensitize_text(self, text, enable_name_desensitize=True):
        """
        脱敏文本中的敏感信息（增强版）
        :param text: 原始文本
        :param enable_name_desensitize: 是否启用姓名脱敏
        :return: 脱敏后的文本
        """
        desensitized = text
        
        # 1. 应用基础脱敏规则
        for pattern_type, pattern in self.desensitize_patterns.items():
            if pattern_type == 'phone':
                desensitized = re.sub(pattern, lambda m: m.group()[:3] + '****' + m.group()[-4:], desensitized)
            elif pattern_type == 'id_card':
                desensitized = re.sub(pattern, lambda m: m.group()[:6] + '********' + m.group()[-4:], desensitized)
            elif pattern_type == 'email':
                def mask_email(m):
                    parts = m.group().split('@')
                    if len(parts) == 2:
                        return parts[0][:2] + '***@' + parts[1]
                    return m.group()
                desensitized = re.sub(pattern, mask_email, desensitized)
            elif pattern_type == 'car_plate':
                desensitized = re.sub(pattern, lambda m: m.group()[:2] + '***' + m.group()[-2:], desensitized)
            elif pattern_type == 'bank_card':
                desensitized = re.sub(pattern, lambda m: m.group()[:4] + '****' + m.group()[-4:], desensitized)
            elif pattern_type == 'address':
                desensitized = re.sub(pattern, lambda m: m.group()[:5] + '***' + m.group()[-3:], desensitized)
        
        # 2. 姓名脱敏
        if enable_name_desensitize:
            # 脱敏自定义姓名
            for name in self.custom_names:
                if len(name) >= 2:
                    # 保留姓氏，脱敏名字
                    mask = name[0] + '*' * (len(name) - 1)
                    desensitized = desensitized.replace(name, mask)
            
            # 脱敏常见姓名模式（姓氏 + 1-2个字）
            name_pattern = f"({'|'.join(self.common_surnames)})[{''.join('一二三四五六七八九十' + ''.join(chr(i) for i in range(0x4e00, 0x9fa5)))}]{{1,2}}"
            
            def mask_name(match):
                name = match.group()
                if len(name) == 2:
                    return name[0] + '*'
                elif len(name) == 3:
                    return name[0] + '**'
                return name
            
            # 只脱敏2-3字的姓名（避免误伤）
            desensitized = re.sub(f"({'|'.join(self.common_surnames)})[^，。、；：！？\\s]{{1,2}}", mask_name, desensitized)
        
        return desensitized
    
    def detect_sensitive_types(self, text):
        """
        检测文本中包含的敏感信息类型
        :param text: 文本
        :return: 敏感信息类型列表
        """
        types = []
        
        for pattern_type, pattern in self.desensitize_patterns.items():
            if re.search(pattern, text):
                types.append(pattern_type)
        
        # 检测姓名
        if any(surname in text for surname in self.common_surnames):
            types.append('potential_name')
        
        return types
    
    def get_gpu_info(self):
        """获取 GPU 信息"""
        try:
            import paddle
            if paddle.is_compiled_with_cuda():
                return {
                    'available': True,
                    'device': 'CUDA',
                    'version': paddle.version.cuda()
                }
        except:
            pass
        return {'available': False}
    
    def process_image(self, input_path, output_path, enable_name_desensitize=True):
        """
        处理单张图片
        :param input_path: 输入图片路径
        :param output_path: 输出 JSON 路径
        :param enable_name_desensitize: 是否启用姓名脱敏
        :return: 处理结果
        """
        import time
        start_time = time.time()
        
        try:
            # OCR 识别
            ocr_result = self.ocr.ocr(input_path, cls=True)
            
            # 提取文本
            texts = []
            confidences = []
            if ocr_result and len(ocr_result) > 0:
                for line in ocr_result[0]:
                    if line:
                        text = line[1][0]
                        confidence = line[1][1]
                        texts.append(text)
                        confidences.append(confidence)
            
            # 脱敏处理
            desensitized_texts = [
                self.desensitize_text(text, enable_name_desensitize) 
                for text in texts
            ]
            
            # 识别的敏感信息类型
            sensitive_types = [
                self.detect_sensitive_types(text) 
                for text in texts
            ]
            
            total_time = time.time() - start_time
            
            result_data = {
                'input_file': str(input_path),
                'output_file': str(output_path),
                'original_text': texts,
                'desensitized_text': desensitized_texts,
                'confidences': confidences,
                'sensitive_types': sensitive_types,
                'performance': {
                    'processing_time': round(total_time, 2),
                    'gpu_enabled': self.use_gpu
                }
            }
            
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(result_data, f, ensure_ascii=False, indent=2)
            
            return result_data
            
        except Exception as e:
            return {'error': str(e)}


def main():
    """主函数"""
    if len(sys.argv) < 3:
        print("Usage: python ocr_processor_enhanced.py <input_file> <output_file> [options]")
        print("\nOptions:")
        print("  --no-gpu              禁用 GPU 加速")
        print("  --no-name-desensitize 禁用姓名脱敏")
        print("  --custom-names FILE   自定义姓名列表文件（每行一个姓名）")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    # 解析选项
    use_gpu = '--no-gpu' not in sys.argv
    enable_name_desensitize = '--no-name-desensitize' not in sys.argv
    
    # 读取自定义姓名
    custom_names = []
    if '--custom-names' in sys.argv:
        idx = sys.argv.index('--custom-names')
        if idx + 1 < len(sys.argv):
            names_file = sys.argv[idx + 1]
            try:
                with open(names_file, 'r', encoding='utf-8') as f:
                    custom_names = [line.strip() for line in f if line.strip()]
                print(f"✓ 加载了 {len(custom_names)} 个自定义姓名")
            except Exception as e:
                print(f"⚠️ 加载自定义姓名失败: {e}")
    
    # 初始化处理器
    processor = OCRProcessorEnhanced(
        use_gpu=use_gpu,
        custom_names=custom_names
    )
    
    # 处理文件
    if input_file.lower().endswith('.pdf'):
        result = processor.process_pdf(input_file, output_file, enable_name_desensitize)
    else:
        result = processor.process_image(input_file, output_file, enable_name_desensitize)
    
    if 'error' in result:
        print(f"❌ Error: {result['error']}")
        sys.exit(1)
    else:
        print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()

