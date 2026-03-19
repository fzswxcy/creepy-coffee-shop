#!/usr/bin/env python3
"""
新闻日报HTML转图片渲染脚本
替代wkhtmltoimage的方案
"""

import os
import re
from PIL import Image, ImageDraw, ImageFont
import html2text

def extract_text_from_html(html_file):
    """从HTML文件中提取文本内容"""
    with open(html_file, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    # 使用html2text转换为纯文本
    h = html2text.HTML2Text()
    h.ignore_links = False
    h.ignore_images = True
    h.body_width = 0  # 不限制宽度
    
    text_content = h.handle(html_content)
    
    # 清理和格式化文本
    lines = text_content.split('\n')
    cleaned_lines = []
    for line in lines:
        line = line.strip()
        if line:
            # 移除过多的空白行
            if line.startswith('#'):
                line = f"\n{line}\n"
            cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines)

def create_news_image(text_content, output_path):
    """创建新闻图片"""
    try:
        # 尝试加载中文字体
        fonts_dir = "/usr/share/fonts"
        chinese_font = None
        
        # 查找中文字体
        for font_name in ["simhei.ttf", "simsun.ttc", "DejaVuSans.ttf", "Arial.ttf"]:
            font_paths = [
                f"/usr/share/fonts/{font_name}",
                f"/usr/share/fonts/truetype/{font_name}",
                f"/usr/share/fonts/dejavu/{font_name}",
                f"/usr/share/X11/fonts/TTF/{font_name}"
            ]
            
            for font_path in font_paths:
                if os.path.exists(font_path):
                    try:
                        chinese_font = ImageFont.truetype(font_path, 14)
                        print(f"使用字体: {font_path}")
                        break
                    except:
                        continue
            if chinese_font:
                break
        
        if not chinese_font:
            # 回退到默认字体
            chinese_font = ImageFont.load_default()
            print("使用默认字体")
        
        # 计算图片尺寸
        lines = text_content.split('\n')
        max_line_width = 0
        total_height = 0
        
        for line in lines:
            # 估算每行宽度和高度
            line_width = len(line) * 8  # 粗略估算
            max_line_width = max(max_line_width, line_width)
            total_height += 24  # 每行高度
        
        # 设置图片尺寸（留出边距）
        img_width = min(max_line_width + 40, 800)
        img_height = total_height + 100
        
        # 创建深色背景图片
        img = Image.new('RGB', (img_width, img_height), color='#0a0a0a')
        draw = ImageDraw.Draw(img)
        
        # 绘制标题
        title = "《全球热点速览》 2026-02-27"
        draw.text((20, 20), title, fill='#ffffff', font=chinese_font)
        
        # 绘制分隔线
        draw.line([(20, 60), (img_width - 20, 60)], fill='#00b4ff', width=2)
        
        # 绘制新闻内容
        y_offset = 80
        line_count = 0
        
        for line in lines:
            if line.startswith('#'):
                # 分类标题
                draw.text((20, y_offset), line, fill='#00b4ff', font=chinese_font)
                y_offset += 30
            elif '来源：' in line:
                # 来源信息
                draw.text((20, y_offset), line, fill='#888888', font=chinese_font)
                y_offset += 25
            elif '中文要点：' in line or '影响分析：' in line:
                # 子标题
                draw.text((20, y_offset), line, fill='#ff6b6b', font=chinese_font)
                y_offset += 25
            elif line.startswith(' ') or line.startswith('    '):
                # 缩进内容
                draw.text((40, y_offset), line.strip(), fill='#cccccc', font=chinese_font)
                y_offset += 22
            else:
                # 普通内容
                draw.text((20, y_offset), line, fill='#ffffff', font=chinese_font)
                y_offset += 22
            
            line_count += 1
            if line_count > 80:  # 限制最大行数
                break
        
        # 保存图片
        img.save(output_path)
        print(f"图片已保存: {output_path}, 尺寸: {img_width}x{img_height}")
        
        # 验证图片
        if os.path.exists(output_path):
            stat_info = os.stat(output_path)
            print(f"文件大小: {stat_info.st_size} 字节")
            return True
        else:
            print("图片创建失败")
            return False
            
    except Exception as e:
        print(f"图片创建失败: {e}")
        return False

def main():
    html_file = "/root/.openclaw/workspace/global_news_20260227.html"
    output_png = "/root/.openclaw/workspace/global_news_20260227.png"
    
    print("=== 开始渲染新闻日报图片 ===")
    
    if not os.path.exists(html_file):
        print(f"HTML文件不存在: {html_file}")
        return False
    
    # 提取文本
    print("提取HTML文本内容...")
    text_content = extract_text_from_html(html_file)
    
    if not text_content:
        print("无法提取文本内容")
        return False
    
    print(f"提取到 {len(text_content)} 字符的文本内容")
    
    # 创建图片
    print("创建新闻图片...")
    success = create_news_image(text_content, output_png)
    
    if success:
        print("=== 渲染完成 ===")
        return True
    else:
        print("=== 渲染失败 ===")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)