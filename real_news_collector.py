#!/usr/bin/env python3
"""
真实新闻收集器 - 使用RSS订阅收集全球科技和财经新闻
"""

import datetime
import json
import re
import time
import feedparser
import requests
import signal
from typing import List, Dict, Tuple
from urllib.parse import urlparse
import html

class RealNewsCollector:
    def __init__(self):
        self.date = datetime.datetime.now().strftime("%Y-%m-%d")
        self.tech_news = []
        self.finance_news = []
        
        # RSS源配置
        self.rss_feeds = {
            "technology": [
                ("TechCrunch", "https://techcrunch.com/feed/"),
                ("The Verge", "https://www.theverge.com/rss/index.xml"),
                ("Wired", "https://www.wired.com/feed/rss"),
                ("Ars Technica", "https://feeds.arstechnica.com/arstechnica/index"),
                ("36氪", "https://36kr.com/feed"),
                ("虎嗅", "https://www.huxiu.com/rss/0.xml"),
            ],
            "finance": [
                ("Bloomberg Markets", "https://feeds.bloomberg.com/markets/news.rss"),
                ("Reuters Business", "https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=news"),
                ("CNBC", "https://www.cnbc.com/id/100003114/device/rss/rss.html"),
                ("Yahoo Finance", "https://finance.yahoo.com/news/rssindex"),
                ("界面新闻财经", "https://www.jiemian.com/lists/5/rss"),
            ]
        }
        
    def clean_html(self, text: str) -> str:
        """清理HTML标签"""
        if not text:
            return ""
        # 移除HTML标签
        text = re.sub(r'<[^>]+>', '', text)
        # 解码HTML实体
        text = html.unescape(text)
        # 清理多余空白
        text = ' '.join(text.split())
        return text.strip()
    
    def extract_summary(self, entry) -> str:
        """从RSS条目提取摘要"""
        if hasattr(entry, 'summary'):
            return self.clean_html(entry.summary)
        elif hasattr(entry, 'description'):
            return self.clean_html(entry.description)
        elif hasattr(entry, 'content'):
            if entry.content:
                content = entry.content[0].value if isinstance(entry.content, list) else str(entry.content)
                return self.clean_html(content[:200]) + "..."
        return "暂无摘要"
    
    def get_news_from_rss(self, feed_name: str, feed_url: str, category: str) -> List[Dict]:
        """从RSS源获取新闻"""
        news_items = []
        
        try:
            print(f"正在获取 {feed_name} 的新闻...")
            feed = feedparser.parse(feed_url)
            
            if feed.bozo:
                print(f"  ⚠️  解析 {feed_name} RSS源时出错：{feed.bozo_exception}")
                return news_items
            
            for entry in feed.entries[:5]:  # 每个源取最新5条
                # 提取发布时间
                pub_time = ""
                if hasattr(entry, 'published'):
                    pub_time = entry.published
                elif hasattr(entry, 'updated'):
                    pub_time = entry.updated
                
                # 格式化时间
                if pub_time:
                    try:
                        # 尝试解析时间格式
                        time_tuple = entry.get('published_parsed', entry.get('updated_parsed'))
                        if time_tuple:
                            pub_time = datetime.datetime(*time_tuple[:6]).strftime("%Y-%m-%d %H:%M")
                    except:
                        pub_time = pub_time[:50]  # 截断过长的原始时间字符串
                
                # 获取标题
                title = self.clean_html(entry.title) if hasattr(entry, 'title') else "无标题"
                
                # 跳过非今日新闻（如果是昨天的推送）
                try:
                    entry_date = datetime.datetime(*entry.published_parsed[:6]).date() if hasattr(entry, 'published_parsed') else None
                    today = datetime.datetime.now().date()
                    if entry_date and (today - entry_date).days > 1:
                        continue  # 跳过超过1天的旧闻
                except:
                    pass
                
                # 提取链接
                link = entry.link if hasattr(entry, 'link') else ""
                
                # 获取摘要
                summary = self.extract_summary(entry)
                
                # 如果摘要太长，截断
                if len(summary) > 200:
                    summary = summary[:197] + "..."
                
                news_items.append({
                    "title": title,
                    "source": feed_name,
                    "summary": summary,
                    "url": link,
                    "time": pub_time or "今天",
                    "category": category
                })
            
            print(f"  ✅ 从 {feed_name} 获取到 {len(news_items)} 条新闻")
            
        except Exception as e:
            print(f"  ❌ 获取 {feed_name} 新闻失败：{str(e)}")
        
        return news_items
    
    def collect_tech_news(self) -> List[Dict]:
        """收集科技新闻"""
        all_tech_news = []
        for feed_name, feed_url in self.rss_feeds["technology"]:
            news = self.get_news_from_rss(feed_name, feed_url, "科技")
            all_tech_news.extend(news)
            time.sleep(0.5)  # 避免请求过快
        
        # 去重（基于标题）
        seen_titles = set()
        unique_news = []
        for news in all_tech_news:
            title_lower = news["title"].lower()
            if title_lower not in seen_titles:
                seen_titles.add(title_lower)
                unique_news.append(news)
        
        # 取最新的8条
        return unique_news[:8]
    
    def collect_finance_news(self) -> List[Dict]:
        """收集财经新闻"""
        all_finance_news = []
        for feed_name, feed_url in self.rss_feeds["finance"]:
            news = self.get_news_from_rss(feed_name, feed_url, "财经")
            all_finance_news.extend(news)
            time.sleep(0.5)
        
        # 去重
        seen_titles = set()
        unique_news = []
        for news in all_finance_news:
            title_lower = news["title"].lower()
            if title_lower not in seen_titles:
                seen_titles.add(title_lower)
                unique_news.append(news)
        
        # 取最新的8条
        return unique_news[:8]
    
    def generate_html(self, tech_news: List[Dict], finance_news: List[Dict]) -> str:
        """生成HTML报告"""
        yesterday = (datetime.datetime.now() - datetime.timedelta(days=1)).strftime("%Y年%m月%d日")
        
        html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>每日新闻摘要 - {self.date}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
        }}
        .header {{
            text-align: center;
            padding: 25px;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            border-radius: 16px;
            margin-bottom: 30px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }}
        .header h1 {{
            margin: 0;
            font-size: 32px;
            font-weight: 600;
        }}
        .date {{
            font-size: 16px;
            opacity: 0.9;
            margin-top: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }}
        .stats {{
            background: rgba(255, 255, 255, 0.1);
            padding: 12px 20px;
            border-radius: 12px;
            margin-top: 15px;
            display: inline-block;
        }}
        .section {{
            background: white;
            border-radius: 16px;
            padding: 30px;
            margin-bottom: 25px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
            transition: transform 0.2s ease;
        }}
        .section:hover {{
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
        }}
        .section-title {{
            color: #1a1a1a;
            font-size: 24px;
            font-weight: 600;
            padding-bottom: 15px;
            margin-bottom: 25px;
            border-bottom: 3px solid;
            display: flex;
            align-items: center;
            gap: 12px;
        }}
        .section-title.tech {{
            border-color: #3498db;
        }}
        .section-title.finance {{
            border-color: #2ecc71;
        }}
        .news-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }}
        .news-card {{
            background: #f8fafc;
            border-radius: 12px;
            padding: 20px;
            border: 1px solid #e2e8f0;
            transition: all 0.2s ease;
        }}
        .news-card:hover {{
            background: white;
            border-color: #cbd5e1;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }}
        .news-title {{
            font-size: 16px;
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 10px;
            line-height: 1.4;
        }}
        .news-meta {{
            font-size: 13px;
            color: #64748b;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
        }}
        .source-badge {{
            background: #e0f2fe;
            color: #0369a1;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
        }}
        .time-badge {{
            background: #f1f5f9;
            color: #475569;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
        }}
        .news-summary {{
            color: #334155;
            font-size: 14px;
            line-height: 1.5;
            margin-bottom: 15px;
        }}
        .news-link {{
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: #3b82f6;
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
            transition: color 0.2s ease;
        }}
        .news-link:hover {{
            color: #1d4ed8;
            text-decoration: underline;
        }}
        .footer {{
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 14px;
        }}
        .ai-badge {{
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            margin-top: 15px;
        }}
        @media (max-width: 768px) {{
            body {{
                padding: 15px;
            }}
            .header {{
                padding: 20px;
            }}
            .header h1 {{
                font-size: 24px;
            }}
            .section {{
                padding: 20px;
            }}
            .news-grid {{
                grid-template-columns: 1fr;
            }}
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>📰 每日新闻摘要</h1>
        <div class="date">
            <span>📅 {yesterday} 全球要闻</span>
            <span class="stats">🚀 {len(tech_news)} 条科技新闻 | 💰 {len(finance_news)} 条财经新闻</span>
        </div>
    </div>
    
    <div class="section">
        <h2 class="section-title tech">🚀 科技前沿</h2>
        <div class="news-grid">
        '''
        
        for news in tech_news:
            html += f'''
            <div class="news-card">
                <div class="news-title">{news['title']}</div>
                <div class="news-meta">
                    <span class="source-badge">{news['source']}</span>
                    <span class="time-badge">🕒 {news['time']}</span>
                </div>
                <div class="news-summary">{news['summary']}</div>
                <a href="{news['url']}" class="news-link" target="_blank">
                    <span>阅读原文</span>
                    <span>→</span>
                </a>
            </div>
            '''
        
        html += '''
        </div>
    </div>
    
    <div class="section">
        <h2 class="section-title finance">💰 财经动态</h2>
        <div class="news-grid">
        '''
        
        for news in finance_news:
            html += f'''
            <div class="news-card">
                <div class="news-title">{news['title']}</div>
                <div class="news-meta">
                    <span class="source-badge">{news['source']}</span>
                    <span class="time-badge">🕒 {news['time']}</span>
                </div>
                <div class="news-summary">{news['summary']}</div>
                <a href="{news['url']}" class="news-link" target="_blank">
                    <span>阅读原文</span>
                    <span>→</span>
                </a>
            </div>
            '''
        
        html += f'''
        </div>
    </div>
    
    <div class="footer">
        <div class="ai-badge">
            <span>🤖</span>
            <span>本报告由 NIKO AI助手自动生成 | 数据更新时间：{datetime.datetime.now().strftime("%Y-%m-%d %H:%M")}</span>
        </div>
        <p style="margin-top: 15px;">🔔 每天上午8:30自动推送昨日新闻摘要 | 📧 如有问题或建议请联系超级大大王</p>
    </div>
</body>
</html>
'''
        return html
    
    def save_html(self, filename: str = "daily_news_real.html"):
        """保存HTML文件"""
        print("\n" + "="*60)
        print("📡 开始收集全球新闻...")
        print("="*60)
        
        tech_news = self.collect_tech_news()
        finance_news = self.collect_finance_news()
        
        print("\n" + "="*60)
        print("📊 新闻收集完成！")
        print(f"  科技新闻：{len(tech_news)} 条")
        print(f"  财经新闻：{len(finance_news)} 条")
        print("="*60 + "\n")
        
        html_content = self.generate_html(tech_news, finance_news)
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"✅ HTML文件已保存：{filename}")
        return filename, tech_news, finance_news
    
    def generate_text_summary(self, tech_news: List[Dict], finance_news: List[Dict]) -> str:
        """生成文本摘要"""
        yesterday = (datetime.datetime.now() - datetime.timedelta(days=1)).strftime("%Y年%m月%d日")
        
        text = f"""📰 每日新闻摘要 - {yesterday}
────────────────────────────────

🚀 科技新闻 ({len(tech_news)}条)
"""
        
        for i, news in enumerate(tech_news, 1):
            text += f"""
{i}. {news['title']}
   📰 {news['source']} | 🕒 {news['time']}
   {news['summary']}
"""
        
        text += """
────────────────────────────────
💰 财经新闻 ({len(finance_news)}条)
"""
        
        for i, news in enumerate(finance_news, 1):
            text += f"""
{i}. {news['title']}
   📰 {news['source']} | 🕒 {news['time']}
   {news['summary']}
"""
        
        text += f"""
────────────────────────────────
📊 汇总：{len(tech_news) + len(finance_news)} 条重要新闻
💡 本摘要由 NIKO AI助手自动生成，基于多个权威新闻源
🔔 每天上午8:30自动推送昨日新闻摘要
"""
        
        return text

if __name__ == "__main__":
    collector = RealNewsCollector()
    html_file, tech_news, finance_news = collector.save_html("daily_news_real.html")
    
    # 生成文本摘要
    text_summary = collector.generate_text_summary(tech_news, finance_news)
    
    # 保存文本摘要
    with open("daily_news_summary.txt", "w", encoding="utf-8") as f:
        f.write(text_summary)
    
    print("📝 文本摘要已保存：daily_news_summary.txt")
    print("\n🎯 新闻收集任务完成！")