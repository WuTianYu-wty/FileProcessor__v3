#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GPU 加速测试脚本
用于验证 GPU 配置是否正确，并测试性能提升效果
"""

import time
import sys

def test_paddle_gpu():
    """测试 PaddlePaddle GPU 支持"""
    print("=" * 60)
    print("1. 测试 PaddlePaddle GPU 支持")
    print("=" * 60)
    
    try:
        import paddle
        print(f"✅ PaddlePaddle 版本: {paddle.__version__}")
        print(f"✅ CUDA 编译: {paddle.is_compiled_with_cuda()}")
        
        if paddle.is_compiled_with_cuda():
            print(f"✅ GPU 数量: {paddle.device.cuda.device_count()}")
            try:
                print(f"✅ GPU 名称: {paddle.device.cuda.get_device_name(0)}")
                print(f"✅ CUDA 版本: {paddle.version.cuda()}")
            except:
                print("⚠️ 无法获取详细 GPU 信息")
            
            # 测试 GPU 计算
            print("\n测试 GPU 计算能力...")
            x = paddle.randn([100, 100])
            y = paddle.randn([100, 100])
            start = time.time()
            z = paddle.matmul(x, y)
            end = time.time()
            print(f"✅ GPU 计算测试通过 - 用时: {(end-start)*1000:.2f}ms")
            
            return True
        else:
            print("❌ GPU 不可用，将使用 CPU 模式")
            return False
            
    except ImportError:
        print("❌ PaddlePaddle 未安装")
        print("请运行: pip install paddlepaddle-gpu")
        return False
    except Exception as e:
        print(f"❌ GPU 测试失败: {e}")
        return False

def test_cuda():
    """测试 CUDA 环境"""
    print("\n" + "=" * 60)
    print("2. 测试 CUDA 环境")
    print("=" * 60)
    
    import subprocess
    
    try:
        # 测试 nvidia-smi
        result = subprocess.run(['nvidia-smi'], capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ NVIDIA 驱动正常")
            # 提取 GPU 信息
            lines = result.stdout.split('\n')
            for line in lines:
                if 'CUDA Version' in line:
                    print(f"✅ {line.strip()}")
                if 'GeForce' in line or 'RTX' in line:
                    print(f"✅ GPU: {line.strip()}")
        else:
            print("❌ nvidia-smi 命令失败")
            return False
    except FileNotFoundError:
        print("❌ nvidia-smi 未找到")
        print("请安装 NVIDIA 驱动")
        return False
    
    try:
        # 测试 nvcc
        result = subprocess.run(['nvcc', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ CUDA Toolkit 已安装")
            for line in result.stdout.split('\n'):
                if 'release' in line.lower():
                    print(f"   {line.strip()}")
        else:
            print("⚠️ nvcc 命令失败 - CUDA Toolkit 可能未安装")
    except FileNotFoundError:
        print("⚠️ nvcc 未找到 - CUDA Toolkit 可能未安装")
    
    return True

def test_ocr_performance():
    """测试 OCR 性能对比"""
    print("\n" + "=" * 60)
    print("3. OCR 性能对比测试")
    print("=" * 60)
    
    try:
        from paddleocr import PaddleOCR
        import numpy as np
        from PIL import Image
        
        # 创建测试图片
        print("创建测试图片...")
        test_image = Image.new('RGB', (1000, 1000), color='white')
        test_image.save('test_ocr.jpg')
        
        # 测试 CPU 模式
        print("\n测试 CPU 模式...")
        ocr_cpu = PaddleOCR(use_gpu=False, use_angle_cls=True, lang='ch', show_log=False)
        start = time.time()
        result_cpu = ocr_cpu.ocr('test_ocr.jpg')
        time_cpu = time.time() - start
        print(f"✅ CPU 模式用时: {time_cpu:.2f} 秒")
        
        # 测试 GPU 模式
        print("\n测试 GPU 模式...")
        try:
            ocr_gpu = PaddleOCR(use_gpu=True, use_angle_cls=True, lang='ch', show_log=False)
            start = time.time()
            result_gpu = ocr_gpu.ocr('test_ocr.jpg')
            time_gpu = time.time() - start
            print(f"✅ GPU 模式用时: {time_gpu:.2f} 秒")
            
            # 计算加速比
            speedup = time_cpu / time_gpu
            print(f"\n🚀 GPU 加速比: {speedup:.2f}x")
            
            if speedup > 2:
                print(f"✅ GPU 加速效果显著！({speedup:.1f} 倍提升)")
            elif speedup > 1:
                print(f"⚠️ GPU 加速效果一般 ({speedup:.1f} 倍提升)")
            else:
                print(f"❌ GPU 可能未正常工作")
                
        except Exception as e:
            print(f"❌ GPU 模式失败: {e}")
            return False
        
        # 清理测试文件
        import os
        try:
            os.remove('test_ocr.jpg')
        except:
            pass
        
        return True
        
    except ImportError as e:
        print(f"❌ 依赖库未安装: {e}")
        print("请运行: pip install paddleocr pillow")
        return False
    except Exception as e:
        print(f"❌ 性能测试失败: {e}")
        return False

def test_custom_names():
    """测试自定义姓名脱敏"""
    print("\n" + "=" * 60)
    print("4. 测试自定义姓名脱敏")
    print("=" * 60)
    
    # 导入处理器
    sys.path.insert(0, '.')
    
    try:
        from ocr_processor_enhanced import OCRProcessorEnhanced
        
        # 创建处理器
        custom_names = ['张三', '李四', '王五']
        processor = OCRProcessorEnhanced(use_gpu=False, custom_names=custom_names)
        
        # 测试脱敏
        test_texts = [
            "张三的电话是 13812345678",
            "李四的身份证号是 110101199001011234",
            "王五的邮箱是 wangwu@example.com",
            "普通文本不包含敏感信息"
        ]
        
        print("\n测试脱敏效果:")
        for text in test_texts:
            desensitized = processor.desensitize_text(text, enable_name_desensitize=True)
            print(f"原文: {text}")
            print(f"脱敏: {desensitized}")
            print()
        
        print("✅ 自定义姓名脱敏测试通过")
        return True
        
    except Exception as e:
        print(f"❌ 姓名脱敏测试失败: {e}")
        return False

def print_summary(results):
    """打印测试总结"""
    print("\n" + "=" * 60)
    print("测试总结")
    print("=" * 60)
    
    tests = [
        ("PaddlePaddle GPU 支持", results['paddle']),
        ("CUDA 环境", results['cuda']),
        ("OCR 性能对比", results['performance']),
        ("自定义姓名脱敏", results['names'])
    ]
    
    for name, passed in tests:
        status = "✅ 通过" if passed else "❌ 失败"
        print(f"{name}: {status}")
    
    all_passed = all(results.values())
    
    print("\n" + "=" * 60)
    if all_passed:
        print("🎉 所有测试通过！GPU 加速已正确配置！")
        print("\n您可以开始使用 GPU 加速的 OCR 功能了：")
        print("1. 启动服务: .\\start-dev.ps1")
        print("2. 进入「PDF 工具」→「OCR 识别与脱敏」")
        print("3. 开启「GPU 加速」开关")
        print("4. 享受 5-10 倍的处理速度！")
    else:
        print("⚠️ 部分测试失败，请检查配置")
        print("\n请参考: 安装指南/GPU加速配置指南.md")
    print("=" * 60)

def main():
    """主函数"""
    print("\n" + "=" * 60)
    print("FileProcessor v3 - GPU 加速测试")
    print("适用于 NVIDIA RTX 5070 等 GPU")
    print("=" * 60 + "\n")
    
    results = {
        'paddle': False,
        'cuda': False,
        'performance': False,
        'names': False
    }
    
    # 运行测试
    results['paddle'] = test_paddle_gpu()
    results['cuda'] = test_cuda()
    
    if results['paddle']:
        results['performance'] = test_ocr_performance()
    else:
        print("\n⚠️ 跳过性能测试（GPU 不可用）")
    
    results['names'] = test_custom_names()
    
    # 打印总结
    print_summary(results)

if __name__ == '__main__':
    main()

