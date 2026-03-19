#!/usr/bin/env python3
"""
新闻图片生成器 - 使用Pillow生成图片格式的新闻报告
"""

import datetime
import os
import textwrap
from PIL import Image, ImageDraw, ImageFont
import re

class NewsImageGenerator:
    def __init__(self):
        self.today = datetime.datetime.now().strftime("%Y-%m-%d")
        self.yesterday = (datetime.datetime.now() - datetime.timedelta(days=1)).strftime("%Y-%m-%d")
        
        # 设置颜色
        self.colors = {
            'background': (245, 247, 250),
            'card_bg': (255, 255, 255),
            'header_bg': (102, 126, 234),
            'tech_border': (102, 126, 234),
            'finance_border': (255, 107, 107),
            'text_dark': (45, 55, 72),
            'text_medium': (74, 85, 104),
            'text_light': (113, 128, 150),
            'accent_blue': (66, 153, 225),
            'shadow': (0, 0, 0, 50)
        }
        
        # 尝试加载中文字体，如果不存在则使用默认字体
        self.font_paths = [
            "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc",  # 文泉驿微米黑
            "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",  # Noto Sans CJK
            "/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc"  # 另一种路径
        ]
        
        self.load_fonts()
    
    def load_fonts(self):
        """加载字体"""
        self.title_font = None
        self.subtitle_font = None
        self.heading_font = None
        self.body_font = None
        self.small_font = None
        
        # 尝试加载中文字体
        for font_path in self.font_paths:
            if os.path.exists(font_path):
                try:
                    self.title_font = ImageFont.truetype(font_path, 48)
                    self.subtitle_font = ImageFont.truetype(font_path, 24)
                    self.heading_font = ImageFont.truetype(font_path, 32)
                    self.body_font = ImageFont.truetype(font_path, 18)
                    self.small_font = ImageFont.truetype(font_path, 14)
                    print(f"✅ 已加载字体: {font_path}")
                    return
                except Exception as e:
                    print(f"⚠️  字体加载失败 {font_path}: {e}")
        
        # 如果中文字体不存在，使用Pillow默认字体
        print("⚠️  未找到中文字体，使用Pillow默认字体")
        self.title_font = ImageFont.load_default()
        self.subtitle_font = ImageFont.load_default()
        self.heading_font = ImageFont.load_default()
        self.body_font = ImageFont.load_default()
        self.small_font = ImageFont.load_default()
    
    def read_news_file(self, filepath: str) -> str:
        """读取新闻文件"""
        if not os.path.exists(filepath):
            alt_path = f"/root/.openclaw/workspace/real_news_{self.yesterday}.txt"
            if os.path.exists(alt_path):
                filepath = alt_path
            else:
                return None
        
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    
    def parse_news_content(self, content: str) -> dict:
        """解析新闻内容"""
        sections = {
            "tech": [],
            "finance": [],
            "metadata": {}
        }
        
        # 按行解析
        lines = content.split('\n')
        current_section = None
        current_news = {}
        
        for line in lines:
            line = line.rstrip()
            
            # 检测章节
            if "热点科技新闻" in line:
                current_section = "tech"
                continue
            elif "热点财经新闻" in line:
                current_section = "finance"
                continue
            
            # 解析元数据
            if "汇总：" in line:
                sections["metadata"]["summary"] = line
                continue
            elif "新闻时效：" in line:
                sections["metadata"]["timeliness"] = line
                continue
            elif "数据来源：" in line:
                sections["metadata"]["source"] = line
                continue
            elif "生成时间：" in line:
                sections["metadata"]["generated_time"] = line
                continue
            
            # 解析新闻条目
            if current_section and line.strip():
                # 检测新闻标题 (数字开头，比如 "1. ")
                match = re.match(r'^(\d+)\.\s+(.+)$', line)
                if match:
                    # 如果有之前的新闻，保存它
                    if current_news:
                        sections[current_section].append(current_news)
                    
                    # 开始新的新闻
                    current_news = {
                        "number": match.group(1),
                        "title": match.group(2)
                    }
                
                # 解析来源信息
                elif "📰" in line and current_news:
                    parts = line.split('|')
                    if len(parts) >= 3:
                        source = parts[0].replace('📰', '').strip()
                        time = parts[1].replace('🕒', '').strip()
                        category = parts[2].strip()
                        current_news.update({
                            "source": source,
                            "time": time,
                            "category": category
                        })
                
                # 解析描述
                elif line.strip() and not line.startswith('   ') and 'http' not in line and len(line.strip()) > 10 and current_news and "description" not in current_news:
                    current_news["description"] = line.strip()
                
                # 解析URL
                elif "🔗" in line and current_news:
                    url = line.replace('🔗', '').strip()
                    current_news["url"] = url
        
        # 保存最后一个新闻
        if current_news and current_section:
            sections[current_section].append(current_news)
        
        return sections
    
    def draw_text_with_wrap(self, draw, text, position, font, max_width, color):
        """绘制自动换行的文本"""
        x, y = position
        lines = []
        
        # 按换行符分割
        paragraphs = text.split('\n')
        
        for paragraph in paragraphs:
            words = paragraph.split()
            current_line = []
            current_width = 0
            
            for word in words:
                # 检查单词是否需要分割
                if font.getlength(' '.join(current_line + [word])) <= max_width:
                    current_line.append(word)
                else:
                    if current_line:
                        lines.append(' '.join(current_line))
                    # 如果单个单词就超过宽度，需要字符级分割
                    if font.getlength(word) > max_width:
                        chars = list(word)
                        temp_line = []
                        for char in chars:
                            if font.getlength(''.join(temp_line + [char])) <= max_width:
                                temp_line.append(char)
                            else:
                                if temp_line:
                                    lines.append(''.join(temp_line))
                                temp_line = [char]
                        if temp_line:
                            lines.append(''.join(temp_line))
                    else:
                        current_line = [word]
            
            if current_line:
                lines.append(' '.join(current_line))
        
        # 绘制每一行
        for i, line in enumerate(lines):
            draw.text((x, y + i * (font.size + 5)), line, font=font, fill=color)
        
        return len(lines) * (font.size + 5)
    
    def draw_rounded_rectangle(self, draw, xy, radius, fill=None, outline=None, width=1):
        """绘制圆角矩形"""
        x1, y1, x2, y2 = xy
        
        # 绘制四个角的圆弧
        draw.ellipse((x1, y1, x1 + 2*radius, y1 + 2*radius), fill=fill, outline=outline, width=width)
        draw.ellipse((x2 - 2*radius, y1, x2, y1 + 2*radius), fill=fill, outline=outline, width=width)
        draw.ellipse((x1, y2 - 2*radius, x1 + 2*radius, y2), fill=fill, outline=outline, width=width)
        draw.ellipse((x2 - 2*radius, y2 - 2*radius, x2, y2), fill=fill, outline=outline, width=width)
        
        # 绘制矩形部分
        draw.rectangle((x1 + radius, y1, x2 - radius, y1 + radius), fill=fill, outline=None)
        draw.rectangle((x1, y1 + radius, x2, y2 - radius), fill=fill, outline=None)
        draw.rectangle((x1 + radius, y2 - radius, x2 - radius, y2), fill=fill, outline=None)
        
        # 绘制边框
        if outline:
            draw.line((x1 + radius, y1, x2 - radius, y1), fill=outline, width=width)
            draw.line((x1 + radius, y2, x2 - radius, y2), fill=outline, width=width)
            draw.line((x1, y1 + radius, x1, y2 - radius), fill=outline, width=width)
            draw.line((x2, y1 + radius, x2, y2 - radius), fill=outline, width=width)
    
    def generate_image(self, news_data: dict) -> Image.Image:
        """生成新闻图片"""
        
        # 创建图像 (宽1200px，高度根据内容动态调整)
        image_width = 1200
        margin = 40
        card_width = image_width - 2 * margin
        
        # 计算所需高度
        tech_news = news_data.get("tech", [])
        finance_news = news_data.get("finance", [])
        
        # 估算高度：标题200 + 科技部分(150 * 条数) + 财经部分(150 * 条数) + 页脚100
        estimated_height = 200 + (len(tech_news) * 180) + (len(finance_news) * 180) + 120
        
        # 确保最小高度
        estimated_height = max(estimated_height, 1200)
        
        # 创建图像
        image = Image.new('RGB', (image_width, estimated_height), self.colors['background'])
        draw = ImageDraw.Draw(image)
        
        y_position = 0
        
        # 绘制标题区域
        title_height = 200
        draw.rectangle([(0, y_position), (image_width, y_position + title_height)], 
                      fill=self.colors['header_bg'])
        
        # 绘制标题
        draw.text((image_width // 2, y_position + 60), "📰 每日新闻速递", 
                 font=self.title_font, fill=(255, 255, 255), anchor="mm")
        draw.text((image_width // 2, y_position + 110), f"AI & 财经热点新闻精选 - {self.yesterday}", 
                 font=self.subtitle_font, fill=(255, 255, 255, 180), anchor="mm")
        
        y_position += title_height
        
        # 绘制分割线
        draw.line([(margin, y_position), (image_width - margin, y_position)], 
                 fill=(200, 200, 200), width=2)
        y_position += 20
        
        # 绘制科技新闻部分
        tech_title_height = 50
        draw.text((margin, y_position), "🤖 热点科技新闻", 
                 font=self.heading_font, fill=self.colors['tech_border'])
        y_position += tech_title_height
        
        # 绘制科技新闻卡片
        for i, news in enumerate(tech_news):
            card_height = self.draw_news_card(draw, news, margin, y_position, 
                                            card_width, self.colors['tech_border'])
            y_position += card_height + 20
        
        # 添加间距
        y_position += 20
        
        # 绘制财经新闻部分
        finance_title_height = 50
        draw.text((margin, y_position), "💰 热点财经新闻", 
                 font=self.heading_font, fill=self.colors['finance_border'])
        y_position += finance_title_height
        
        # 绘制财经新闻卡片
        for i, news in enumerate(finance_news):
            card_height = self.draw_news_card(draw, news, margin, y_position, 
                                            card_width, self.colors['finance_border'])
            y_position += card_height + 20
        
        # 绘制页脚
        footer_y = estimated_height - 100
        draw.rectangle([(0, footer_y), (image_width, estimated_height)], 
                      fill=(45, 55, 72))
        
        # 统计信息
        tech_count = len(tech_news)
        finance_count = len(finance_news)
        total_news = tech_count + finance_count
        
        stats_text = f"📊 汇总：{total_news} 条热点新闻 ({tech_count}科技 + {finance_count}财经)"
        draw.text((margin, footer_y + 20), stats_text, 
                 font=self.small_font, fill=(255, 255, 255))
        
        # 时间信息
        time_text = f"⏰ 新闻时效：昨日热点，今日推送 | 生成时间：{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        draw.text((margin, footer_y + 50), time_text, 
                 font=self.small_font, fill=(255, 255, 255, 180))
        
        return image
    
    def draw_news_card(self, draw, news, x, y, width, border_color):
        """绘制新闻卡片"""
        card_padding = 20
        card_height = 160  # 初始高度
        
        # 卡片背景
        self.draw_rounded_rectangle(draw, 
                                   (x, y, x + width, y + card_height), 
                                   radius=15,
                                   fill=self.colors['card_bg'],
                                   outline=border_color,
                                   width=2)
        
        # 新闻标题
        title_text = f"{news.get('number', '')}. {news.get('title', '')}"
        draw.text((x + card_padding, y + card_padding), title_text, 
                 font=self.body_font, fill=self.colors['text_dark'])
        
        # 元数据行
        meta_y = y + card_padding + 30
        if 'source' in news and 'time' in news and 'category' in news:
            meta_text = f"📰 {news['source']} | 🕒 {news['time']} | 🏷️ {news['category']}"
            draw.text((x + card_padding, meta_y), meta_text, 
                     font=self.small_font, fill=self.colors['text_light'])
        
        # 描述
        desc_y = meta_y + 25
        description = news.get('description', '')
        
        # 限制描述长度
        max_desc_length = 100
        if len(description) > max_desc_length:
            description = description[:max_desc_length] + "..."
        
        draw.text((x + card_padding, desc_y), description, 
                 font=self.small_font, fill=self.colors['text_medium'])
        
        # URL（如果有）
        if 'url' in news:
            url_y = desc_y + 25
            url_text = f"🔗 {news['url'][:50]}..." if len(news['url']) > 50 else f"🔗 {news['url']}"
            draw.text((x + card_padding, url_y), url_text, 
                     font=self.small_font, fill=self.colors['accent_blue'])
        
        return card_height
    
    def save_image(self, image: Image.Image, output_path: str = None) -> str:
        """保存图片"""
        if output_path is None:
            output_path = f"/root/.openclaw/workspace/news_report_{self.yesterday}.png"
        
        image.save(output_path, 'PNG', quality=95)
        return output_path
    
    def run(self, news_file: str = None):
        """主执行流程"""
        try:
            print("🔄 开始生成图片格式新闻报告...")
            
            # 读取新闻文件
            if news_file is None:
                news_file = f"/root/.openclaw/workspace/real_news_{self.yesterday}.txt"
            
            content = self.read_news_file(news_file)
            if not content:
                print(f"❌ 找不到新闻文件: {news_file}")
                return None
            
            # 解析新闻内容
            print("📊 解析新闻内容...")
            news_data = self.parse_news_content(content)
            
            # 生成图片
            print("🎨 生成新闻图片...")
            image = self.generate_image(news_data)
            
            # 保存图片
            print("💾 保存图片...")
            image_path = self.save_image(image)
            
            print(f"✅ 图片已生成: {image_path}")
            print(f"📊 图片尺寸: {image.size}")
            
            return image_path
            
        except Exception as e:
            print(f"❌ 生成图片失败: {e}")
            import traceback
            traceback.print_exc()
            return None

def main():
    """主函数"""
    generator = NewsImageGenerator()
    result = generator.run()
    
    if result:
        print(f"\n🎉 图片格式新闻报告生成完成!")
        print(f"🖼️ 输出文件: {result}")
        print("📸 图片已准备就绪，可以通过QQ Bot发送")
        
        # 显示文件信息
        import os
        file_size = os.path.getsize(result) / 1024  # KB
        print(f"📁 文件大小: {file_size:.1f} KB")
        
        return True
    else:
        print("\n❌ 图片生成失败")
        return False

if __name__ == "__main__":
    main()