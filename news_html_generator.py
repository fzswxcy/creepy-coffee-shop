#!/usr/bin/env python3
"""
新闻HTML报告生成器
将文本新闻转换为美观的HTML报告
"""

import datetime
import os
from pathlib import Path

class NewsHTMLGenerator:
    def __init__(self):
        self.today = datetime.datetime.now().strftime("%Y-%m-%d")
        self.yesterday = (datetime.datetime.now() - datetime.timedelta(days=1)).strftime("%Y-%m-%d")
        
    def read_news_file(self, filepath: str) -> str:
        """读取新闻文件"""
        if not os.path.exists(filepath):
            # 如果指定文件不存在，尝试其他可能的位置
            alt_path = f"/root/.openclaw/workspace/real_news_{self.yesterday}.txt"
            if os.path.exists(alt_path):
                filepath = alt_path
            else:
                return None
        
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    
    def parse_news_content(self, content: str) -> dict:
        """解析新闻内容"""
        lines = content.split('\n')
        
        sections = {
            "tech": [],
            "finance": [],
            "metadata": {}
        }
        
        current_section = None
        current_news = {}
        
        for line in lines:
            if "热点科技新闻" in line:
                current_section = "tech"
                continue
            elif "热点财经新闻" in line:
                current_section = "finance"
                continue
            elif "汇总：" in line:
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
            if line.strip() and line[0].isdigit() and '. ' in line:
                if current_news:
                    if current_section == "tech":
                        sections["tech"].append(current_news)
                    elif current_section == "finance":
                        sections["finance"].append(current_news)
                
                current_news = {"title": line.split('. ', 1)[1].strip()}
            elif "📰" in line and current_news:
                parts = line.strip().split('|')
                if len(parts) >= 3:
                    source_part = parts[0].replace('📰', '').strip()
                    time_part = parts[1].replace('🕒', '').strip()
                    category_part = parts[2].strip()
                    current_news.update({
                        "source": source_part,
                        "time": time_part,
                        "category": category_part
                    })
            elif line.strip() and not line.startswith('   ') and 'http' in line and current_news:
                current_news["url"] = line.replace('🔗', '').strip()
            elif line.strip() and not line.startswith('   ') and len(line.strip()) > 10 and current_news and "description" not in current_news:
                current_news["description"] = line.strip()
        
        # 添加最后一个新闻
        if current_news:
            if current_section == "tech":
                sections["tech"].append(current_news)
            elif current_section == "finance":
                sections["finance"].append(current_news)
        
        return sections
    
    def generate_html(self, news_data: dict) -> str:
        """生成HTML报告"""
        
        html_template = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>每日新闻速递 - {date}</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
            padding: 20px;
        }}
        
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
            overflow: hidden;
        }}
        
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }}
        
        .header::before {{
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
            background-size: 30px 30px;
            animation: float 20s linear infinite;
        }}
        
        @keyframes float {{
            0% {{ transform: translate(0, 0) rotate(0deg); }}
            100% {{ transform: translate(-30px, -30px) rotate(360deg); }}
        }}
        
        .header h1 {{
            font-size: 3em;
            margin-bottom: 10px;
            font-weight: 700;
            position: relative;
            z-index: 1;
        }}
        
        .header .subtitle {{
            font-size: 1.2em;
            opacity: 0.9;
            position: relative;
            z-index: 1;
        }}
        
        .date-badge {{
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 8px 20px;
            border-radius: 50px;
            margin-top: 20px;
            font-weight: 600;
            position: relative;
            z-index: 1;
            backdrop-filter: blur(10px);
        }}
        
        .sections {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0;
            min-height: 800px;
        }}
        
        .section {{
            padding: 40px;
        }}
        
        .tech-section {{
            background: #f8f9ff;
            border-right: 1px solid #e1e5ff;
        }}
        
        .finance-section {{
            background: #fff9f8;
        }}
        
        .section-title {{
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 2px solid;
        }}
        
        .tech-title {{
            color: #667eea;
            border-bottom-color: #667eea;
        }}
        
        .finance-title {{
            color: #ff6b6b;
            border-bottom-color: #ff6b6b;
        }}
        
        .section-icon {{
            font-size: 2em;
        }}
        
        .news-list {{
            display: flex;
            flex-direction: column;
            gap: 25px;
        }}
        
        .news-card {{
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
            transition: all 0.3s ease;
            border-left: 4px solid;
        }}
        
        .tech-card {{
            border-left-color: #667eea;
        }}
        
        .finance-card {{
            border-left-color: #ff6b6b;
        }}
        
        .news-card:hover {{
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
        }}
        
        .news-title {{
            font-size: 1.4em;
            font-weight: 600;
            margin-bottom: 10px;
            color: #2d3748;
        }}
        
        .news-meta {{
            display: flex;
            gap: 20px;
            margin-bottom: 15px;
            color: #718096;
            font-size: 0.9em;
        }}
        
        .meta-item {{
            display: flex;
            align-items: center;
            gap: 5px;
        }}
        
        .news-description {{
            color: #4a5568;
            margin-bottom: 15px;
            line-height: 1.8;
        }}
        
        .news-url {{
            display: inline-block;
            color: #4299e1;
            text-decoration: none;
            font-weight: 600;
            transition: color 0.3s ease;
        }}
        
        .news-url:hover {{
            color: #3182ce;
            text-decoration: underline;
        }}
        
        .footer {{
            background: #2d3748;
            color: white;
            padding: 30px;
            text-align: center;
            font-size: 0.9em;
        }}
        
        .stats {{
            display: flex;
            justify-content: center;
            gap: 40px;
            margin-bottom: 20px;
        }}
        
        .stat-item {{
            display: flex;
            flex-direction: column;
            align-items: center;
        }}
        
        .stat-number {{
            font-size: 1.8em;
            font-weight: 700;
            color: #667eea;
        }}
        
        .stat-label {{
            font-size: 0.9em;
            opacity: 0.8;
        }}
        
        .timestamp {{
            opacity: 0.7;
        }}
        
        @media (max-width: 768px) {{
            .sections {{
                grid-template-columns: 1fr;
            }}
            
            .tech-section {{
                border-right: none;
                border-bottom: 1px solid #e1e5ff;
            }}
            
            .header h1 {{
                font-size: 2em;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📰 每日新闻速递</h1>
            <div class="subtitle">AI & 财经热点新闻精选</div>
            <div class="date-badge">{date}</div>
        </div>
        
        <div class="sections">
            <div class="section tech-section">
                <div class="section-title tech-title">
                    <span class="section-icon">🤖</span>
                    <h2>🔥 热点科技新闻</h2>
                </div>
                <div class="news-list">
                    {tech_news}
                </div>
            </div>
            
            <div class="section finance-section">
                <div class="section-title finance-title">
                    <span class="section-icon">💰</span>
                    <h2>💹 热点财经新闻</h2>
                </div>
                <div class="news-list">
                    {finance_news}
                </div>
            </div>
        </div>
        
        <div class="footer">
            <div class="stats">
                <div class="stat-item">
                    <div class="stat-number">{tech_count}</div>
                    <div class="stat-label">科技新闻</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">{finance_count}</div>
                    <div class="stat-label">财经新闻</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">{total_news}</div>
                    <div class="stat-label">总计</div>
                </div>
            </div>
            <div class="timestamp">
                {metadata}<br>
                生成时间：{generated_time}
            </div>
        </div>
    </div>
</body>
</html>"""
        
        # 生成科技新闻HTML
        tech_news_html = ""
        for i, news in enumerate(news_data.get("tech", []), 1):
            tech_news_html += f"""
            <div class="news-card tech-card">
                <div class="news-title">{i}. {news.get('title', '')}</div>
                <div class="news-meta">
                    <div class="meta-item">📰 {news.get('source', '')}</div>
                    <div class="meta-item">🕒 {news.get('time', '')}</div>
                    <div class="meta-item">🏷️ {news.get('category', '')}</div>
                </div>
                <div class="news-description">{news.get('description', '')}</div>
                <a href="{news.get('url', '#')}" class="news-url" target="_blank">🔗 阅读原文</a>
            </div>"""
        
        # 生成财经新闻HTML
        finance_news_html = ""
        for i, news in enumerate(news_data.get("finance", []), 1):
            finance_news_html += f"""
            <div class="news-card finance-card">
                <div class="news-title">{i}. {news.get('title', '')}</div>
                <div class="news-meta">
                    <div class="meta-item">📰 {news.get('source', '')}</div>
                    <div class="meta-item">🕒 {news.get('time', '')}</div>
                    <div class="meta-item">🏷️ {news.get('category', '')}</div>
                </div>
                <div class="news-description">{news.get('description', '')}</div>
                <a href="{news.get('url', '#')}" class="news-url" target="_blank">🔗 阅读原文</a>
            </div>"""
        
        # 统计信息
        tech_count = len(news_data.get("tech", []))
        finance_count = len(news_data.get("finance", []))
        total_news = tech_count + finance_count
        
        # 元数据
        metadata = news_data.get("metadata", {})
        source_info = metadata.get("source", "数据来源：模拟真实新闻API格式")
        summary_info = metadata.get("summary", f"汇总：{total_news} 条热点新闻 ({tech_count}科技 + {finance_count}财经)")
        
        html_content = html_template.format(
            date=self.yesterday,
            tech_news=tech_news_html,
            finance_news=finance_news_html,
            tech_count=tech_count,
            finance_count=finance_count,
            total_news=total_news,
            metadata=f"{summary_info} | {source_info}",
            generated_time=datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
        
        return html_content
    
    def save_html(self, html_content: str, output_path: str = None) -> str:
        """保存HTML文件"""
        if output_path is None:
            output_path = f"/root/.openclaw/workspace/news_report_{self.yesterday}.html"
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        return output_path
    
    def convert_to_image(self, html_path: str) -> str:
        """将HTML转换为图片（需要wkhtmltoimage工具）"""
        # 尝试多种方法将HTML转换为图片
        png_path = html_path.replace('.html', '.png')
        
        # 方法1：使用wkhtmltoimage（如果已安装）
        try:
            os.system(f"wkhtmltoimage --width 1200 --height 2000 --quality 90 '{html_path}' '{png_path}'")
            if os.path.exists(png_path):
                return png_path
        except:
            pass
        
        # 方法2：使用chrome headless
        try:
            os.system(f"google-chrome --headless --disable-gpu --screenshot='{png_path}' --window-size=1200,2000 '{html_path}'")
            if os.path.exists(png_path):
                return png_path
        except:
            pass
        
        # 方法3：使用chromium
        try:
            os.system(f"chromium --headless --disable-gpu --screenshot='{png_path}' --window-size=1200,2000 '{html_path}'")
            if os.path.exists(png_path):
                return png_path
        except:
            pass
        
        return None
    
    def run(self, news_file: str = None):
        """主执行流程"""
        try:
            print("🔄 开始生成HTML新闻报告...")
            
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
            
            # 生成HTML
            print("🎨 生成HTML报告...")
            html_content = self.generate_html(news_data)
            
            # 保存HTML
            html_path = self.save_html(html_content)
            print(f"✅ HTML报告已保存: {html_path}")
            
            # 转换为图片
            print("🖼️ 将HTML转换为图片...")
            png_path = self.convert_to_image(html_path)
            
            if png_path and os.path.exists(png_path):
                print(f"✅ 图片已生成: {png_path}")
                return png_path
            else:
                print("⚠️  图片生成失败，需要安装wkhtmltoimage或chrome-headless")
                print("💡 可以通过以下命令安装: sudo apt-get install wkhtmltopdf")
                return html_path
            
        except Exception as e:
            print(f"❌ 生成HTML报告失败: {e}")
            return None

def main():
    """主函数"""
    generator = NewsHTMLGenerator()
    result = generator.run()
    
    if result:
        print(f"\n🎉 HTML新闻报告生成完成!")
        print(f"📄 输出文件: {result}")
        
        if result.endswith('.png'):
            print("📸 图片已准备就绪，可以通过QQ Bot发送")
        else:
            print("📄 HTML文件已生成，需要手动转换为图片")
        
        return True
    else:
        print("\n❌ HTML报告生成失败")
        return False

if __name__ == "__main__":
    main()