#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Batch Rename - 批量文件重命名工具
支持多种重命名模式和变量替换
"""

import sys
import json
import os
import re
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional


class BatchRenamer:
    """批量重命名工具"""
    
    def __init__(self):
        """初始化重命名器"""
        self.variables = {
            '{date}': datetime.now().strftime('%Y%m%d'),
            '{time}': datetime.now().strftime('%H%M%S'),
            '{datetime}': datetime.now().strftime('%Y%m%d_%H%M%S'),
            '{year}': datetime.now().strftime('%Y'),
            '{month}': datetime.now().strftime('%m'),
            '{day}': datetime.now().strftime('%d'),
        }
    
    def generate_new_name(self, original_name: str, pattern: str, 
                         index: int, total: int, custom_vars: Dict = None) -> str:
        """
        生成新文件名
        :param original_name: 原始文件名
        :param pattern: 重命名模式
        :param index: 当前索引（从1开始）
        :param total: 总文件数
        :param custom_vars: 自定义变量
        """
        # 分离文件名和扩展名
        name_without_ext = Path(original_name).stem
        ext = Path(original_name).suffix
        
        # 构建可用变量
        variables = self.variables.copy()
        variables.update({
            '{original}': name_without_ext,
            '{ext}': ext.lstrip('.'),
            '{index}': str(index),
            '{index:02}': f'{index:02d}',
            '{index:03}': f'{index:03d}',
            '{index:04}': f'{index:04d}',
            '{total}': str(total),
        })
        
        # 添加自定义变量
        if custom_vars:
            variables.update(custom_vars)
        
        # 替换变量
        new_name = pattern
        for var, value in variables.items():
            new_name = new_name.replace(var, value)
        
        # 如果没有扩展名，添加原始扩展名
        if not Path(new_name).suffix and ext:
            new_name += ext
        
        return new_name
    
    def preview_rename(self, files: List[str], pattern: str, 
                      custom_vars: Dict = None) -> List[Dict]:
        """
        预览重命名结果
        :param files: 文件路径列表
        :param pattern: 重命名模式
        :param custom_vars: 自定义变量
        """
        results = []
        total = len(files)
        
        for index, file_path in enumerate(files, start=1):
            original_name = os.path.basename(file_path)
            new_name = self.generate_new_name(
                original_name, pattern, index, total, custom_vars
            )
            
            results.append({
                'index': index,
                'original': original_name,
                'new': new_name,
                'path': file_path,
                'dir': os.path.dirname(file_path)
            })
        
        return results
    
    def execute_rename(self, files: List[str], pattern: str,
                      custom_vars: Dict = None, dry_run: bool = False) -> Dict:
        """
        执行批量重命名
        :param files: 文件路径列表
        :param pattern: 重命名模式
        :param custom_vars: 自定义变量
        :param dry_run: 是否仅预览
        """
        results = []
        success_count = 0
        fail_count = 0
        
        preview = self.preview_rename(files, pattern, custom_vars)
        
        if dry_run:
            return {
                'success': True,
                'dry_run': True,
                'preview': preview,
                'total': len(files)
            }
        
        # 执行重命名
        for item in preview:
            old_path = item['path']
            new_path = os.path.join(item['dir'], item['new'])
            
            try:
                # 检查目标文件是否已存在
                if os.path.exists(new_path) and old_path != new_path:
                    results.append({
                        **item,
                        'success': False,
                        'error': '目标文件已存在'
                    })
                    fail_count += 1
                    continue
                
                # 执行重命名
                os.rename(old_path, new_path)
                
                results.append({
                    **item,
                    'success': True,
                    'new_path': new_path
                })
                success_count += 1
                
            except Exception as e:
                results.append({
                    **item,
                    'success': False,
                    'error': str(e)
                })
                fail_count += 1
        
        return {
            'success': fail_count == 0,
            'total': len(files),
            'success_count': success_count,
            'fail_count': fail_count,
            'results': results
        }
    
    def replace_text(self, files: List[str], search: str, replace: str,
                    case_sensitive: bool = True, use_regex: bool = False) -> Dict:
        """
        文本替换重命名
        :param files: 文件路径列表
        :param search: 搜索文本/正则
        :param replace: 替换文本
        :param case_sensitive: 是否区分大小写
        :param use_regex: 是否使用正则表达式
        """
        results = []
        success_count = 0
        fail_count = 0
        
        for file_path in files:
            original_name = os.path.basename(file_path)
            directory = os.path.dirname(file_path)
            
            try:
                if use_regex:
                    # 正则替换
                    flags = 0 if case_sensitive else re.IGNORECASE
                    new_name = re.sub(search, replace, original_name, flags=flags)
                else:
                    # 普通替换
                    if case_sensitive:
                        new_name = original_name.replace(search, replace)
                    else:
                        # 不区分大小写的替换
                        pattern = re.compile(re.escape(search), re.IGNORECASE)
                        new_name = pattern.sub(replace, original_name)
                
                # 如果名称没有变化，跳过
                if new_name == original_name:
                    results.append({
                        'original': original_name,
                        'new': new_name,
                        'success': True,
                        'skipped': True,
                        'message': '名称未变化'
                    })
                    success_count += 1
                    continue
                
                # 执行重命名
                old_path = file_path
                new_path = os.path.join(directory, new_name)
                
                if os.path.exists(new_path):
                    results.append({
                        'original': original_name,
                        'new': new_name,
                        'success': False,
                        'error': '目标文件已存在'
                    })
                    fail_count += 1
                    continue
                
                os.rename(old_path, new_path)
                
                results.append({
                    'original': original_name,
                    'new': new_name,
                    'success': True,
                    'path': new_path
                })
                success_count += 1
                
            except Exception as e:
                results.append({
                    'original': original_name,
                    'success': False,
                    'error': str(e)
                })
                fail_count += 1
        
        return {
            'success': fail_count == 0,
            'total': len(files),
            'success_count': success_count,
            'fail_count': fail_count,
            'results': results
        }
    
    def add_prefix_suffix(self, files: List[str], prefix: str = '', 
                         suffix: str = '') -> Dict:
        """
        添加前缀/后缀
        :param files: 文件路径列表
        :param prefix: 前缀
        :param suffix: 后缀（在扩展名之前）
        """
        results = []
        success_count = 0
        fail_count = 0
        
        for file_path in files:
            original_name = os.path.basename(file_path)
            directory = os.path.dirname(file_path)
            
            # 分离文件名和扩展名
            name_without_ext = Path(original_name).stem
            ext = Path(original_name).suffix
            
            # 构建新文件名
            new_name = f"{prefix}{name_without_ext}{suffix}{ext}"
            
            try:
                old_path = file_path
                new_path = os.path.join(directory, new_name)
                
                if os.path.exists(new_path) and old_path != new_path:
                    results.append({
                        'original': original_name,
                        'new': new_name,
                        'success': False,
                        'error': '目标文件已存在'
                    })
                    fail_count += 1
                    continue
                
                os.rename(old_path, new_path)
                
                results.append({
                    'original': original_name,
                    'new': new_name,
                    'success': True,
                    'path': new_path
                })
                success_count += 1
                
            except Exception as e:
                results.append({
                    'original': original_name,
                    'new': new_name,
                    'success': False,
                    'error': str(e)
                })
                fail_count += 1
        
        return {
            'success': fail_count == 0,
            'total': len(files),
            'success_count': success_count,
            'fail_count': fail_count,
            'results': results
        }


def main():
    """命令行入口"""
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "用法: python batch_rename.py <config.json>",
            "config_example": {
                "mode": "pattern",  # pattern | replace | prefix_suffix
                "files": ["file1.txt", "file2.txt"],
                "pattern": "doc_{index:03}",  # for pattern mode
                "search": "old",  # for replace mode
                "replace": "new",  # for replace mode
                "prefix": "prefix_",  # for prefix_suffix mode
                "suffix": "_suffix",  # for prefix_suffix mode
                "custom_vars": {"varname": "value"},  # optional
                "dry_run": False  # optional
            }
        }, ensure_ascii=False, indent=2))
        sys.exit(1)
    
    config_file = sys.argv[1]
    
    # 读取配置
    try:
        with open(config_file, 'r', encoding='utf-8') as f:
            config = json.load(f)
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"无法读取配置文件: {e}"
        }, ensure_ascii=False))
        sys.exit(1)
    
    renamer = BatchRenamer()
    mode = config.get('mode', 'pattern')
    files = config.get('files', [])
    
    if not files:
        print(json.dumps({
            "success": False,
            "error": "文件列表为空"
        }, ensure_ascii=False))
        sys.exit(1)
    
    # 根据模式执行
    try:
        if mode == 'pattern':
            pattern = config.get('pattern', '{original}_{index:02}')
            custom_vars = config.get('custom_vars', {})
            dry_run = config.get('dry_run', False)
            result = renamer.execute_rename(files, pattern, custom_vars, dry_run)
        
        elif mode == 'replace':
            search = config.get('search', '')
            replace = config.get('replace', '')
            case_sensitive = config.get('case_sensitive', True)
            use_regex = config.get('use_regex', False)
            result = renamer.replace_text(files, search, replace, case_sensitive, use_regex)
        
        elif mode == 'prefix_suffix':
            prefix = config.get('prefix', '')
            suffix = config.get('suffix', '')
            result = renamer.add_prefix_suffix(files, prefix, suffix)
        
        else:
            result = {
                "success": False,
                "error": f"未知模式: {mode}"
            }
        
        print(json.dumps(result, ensure_ascii=False, indent=2))
        sys.exit(0 if result.get('success') else 1)
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    main()

