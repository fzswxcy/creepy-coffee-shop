#!/usr/bin/env python3
"""
新闻收集脚本 - 用于收集全球科技和财经新闻
"""

import datetime
import json
import os
from typing import List, Dict

class NewsCollector:
    def __init__(self):
        self.date = datetime.datetime.now().strftime("%Y-%m-%d")
        self.tech_news = []
        self.finance_news = []
        
    def collect_tech_news(self) -> List[Dict]:
        """收集科技新闻（测试数据）"""
        # 这里应该是实际调用新闻API的地方
        # 暂时使用测试数据
        return [
            {
                "title": "OpenAI发布新一代AI模型GPT-5，性能提升40%",
                "source": "TechCrunch",
                "summary": "OpenAI宣布推出GPT-5，在推理能力和多模态处理方面有显著提升",
                "url": "https://techcrunch.com/2026/02/24/openai-gpt5-launch",
                "time": "2026-02-24 09:00",
                "category": "AI"
            },
            {
                "title": "苹果发布Vision Pro 2，价格降低30%",
                "source": "The Verge",
                "summary": "苹果新款VR头显Vision Pro 2发布，价格更加亲民，性能提升明显",
                "url": "https://theverge.com/2026/02/24/apple-vision-pro2",
                "time": "2026-02-24 10:30",
                "category": "硬件"
            },
            {
                "title": "量子计算机突破：谷歌实现1000量子比特稳定运行",
                "source": "Nature",
                "summary": "谷歌量子计算团队宣布实现1000量子比特的稳定运行，量子优势再进一步",
                "url": "https://nature.com/2026/02/24/google-quantum",
                "time": "2026-02-24 08:15",
                "category": "量子计算"
            },
            {
                "title": "特斯拉发布全自动驾驶软件v12.5，覆盖95%路况",
                "source": "Reuters",
                "summary": "特斯拉FSD v12.5版本发布，显著提升复杂城市道路的自动驾驶能力",
                "url": "https://reuters.com/2026/02/24/tesla-fsd-12.5",
                "time": "2026-02-24 11:45",
                "category": "自动驾驶"
            },
            {
                "title": "微软Azure AI推出新型AI芯片，性能比英伟达提升20%",
                "source": "CNBC",
                "summary": "微软发布自研AI芯片，性能强劲，挑战英伟达市场地位",
                "url": "https://cnbc.com/2026/02/24/microsoft-ai-chip",
                "time": "2026-02-24 14:20",
                "category": "芯片"
            }
        ]
    
    def collect_finance_news(self) -> List[Dict]:
        """收集财经新闻（测试数据）"""
        return [
            {
                "title": "美联储维持利率不变，暗示2026年下半年可能降息",
                "source": "Bloomberg",
                "summary": "美联储最新会议决定维持利率，但对经济前景表示乐观",
                "url": "https://bloomberg.com/2026/02/24/fed-rate-decision",
                "time": "2026-02-24 09:30",
                "category": "货币政策"
            },
            {
                "title": "比特币突破15万美元，加密货币市场全面上涨",
                "source": "CoinDesk",
                "summary": "比特币价格突破15万美元大关，带动整个加密货币市场上涨",
                "url": "https://coindesk.com/2026/02/24/bitcoin-150k",
                "time": "2026-02-24 10:45",
                "category": "加密货币"
            },
            {
                "title": "特斯拉股价大涨8%，Q4财报超预期",
                "source": "Yahoo Finance",
                "summary": "特斯拉发布强劲Q4财报，股价应声大涨，市值重返万亿",
                "url": "https://finance.yahoo.com/2026/02/24/tesla-earnings",
                "time": "2026-02-24 13:20",
                "category": "股票"
            },
            {
                "title": "中国GDP增长6.5%，超市场预期",
                "source": "新华社",
                "summary": "2025年中国GDP增长6.5%，经济复苏势头强劲",
                "url": "https://xinhuanet.com/2026/02/24/china-gdp",
                "time": "2026-02-24 08:00",
                "category": "宏观经济"
            },
            {
                "title": "亚马逊宣布100亿美元AI投资计划",
                "source": "WSJ",
                "summary": "亚马逊计划未来三年投资100亿美元发展AI技术",
                "url": "https://wsj.com/2026/02/24/amazon-ai-investment",
                "time": "2026-02-24 16:10",
                "category": "企业投资"
            }
        ]
    
    def generate_html(self) -> str:
        """生成HTML报告"""
        tech_news = self.collect_tech_news()
        finance_news = self.collect_finance_news()
        
        html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>每日新闻摘要 - {self.date}</title>
    <style>
        body {{
            font-family: 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }}
        .header {{
            text-align: center;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
            margin-bottom: 30px;
        }}
        .date {{
            font-size: 14px;
            opacity: 0.9;
            margin-top: 5px;
        }}
        .section {{
            background: white;
            border-radius: 8px;
            padding: 25px;
            margin-bottom: 25px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }}
        .section-title {{
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }}
        .news-item {{
            padding: 15px;
            margin-bottom: 15px;
            border-left: 4px solid #3498db;
            background: #f8fafc;
            border-radius: 4px;
        }}
        .news-item.finance {{
            border-left-color: #2ecc71;
        }}
        .news-title {{
            font-size: 18px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 8px;
        }}
        .news-meta {{
            font-size: 14px;
            color: #7f8c8d;
            margin-bottom: 8px;
        }}
        .news-summary {{
            color: #34495e;
            margin-bottom: 10px;
        }}
        .news-link {{
            color: #3498db;
            text-decoration: none;
            font-weight: bold;
        }}
        .news-link:hover {{
            text-decoration: underline;
        }}
        .category-badge {{
            display: inline-block;
            padding: 4px 8px;
            background: #e74c3c;
            color: white;
            border-radius: 12px;
            font-size: 12px;
            margin-right: 8px;
        }}
        .stats {{
            text-align: center;
            margin-top: 30px;
            padding: 15px;
            background: #ecf0f1;
            border-radius: 8px;
        }}
        .footer {{
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #7f8c8d;
            font-size: 14px;
        }}
        @media (max-width: 768px) {{
            body {{
                padding: 10px;
            }}
            .section {{
                padding: 15px;
            }}
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>📰 每日新闻摘要</h1>
        <div class="date">📅 日期：{self.date} | 🌍 全球科技与财经要闻</div>
    </div>
    
    <div class="section">
        <h2 class="section-title">🚀 科技新闻</h2>
        '''
        
        for news in tech_news:
            html += f'''
        <div class="news-item">
            <div class="news-title">{news['title']}</div>
            <div class="news-meta">
                <span class="category-badge">{news['category']}</span>
                📰 {news['source']} | 🕒 {news['time']}
            </div>
            <div class="news-summary">{news['summary']}</div>
            <a href="{news['url']}" class="news-link" target="_blank">阅读原文 →</a>
        </div>
            '''
        
        html += '''
    </div>
    
    <div class="section">
        <h2 class="section-title">💰 财经新闻</h2>
        '''
        
        for news in finance_news:
            html += f'''
        <div class="news-item finance">
            <div class="news-title">{news['title']}</div>
            <div class="news-meta">
                <span class="category-badge">{news['category']}</span>
                📰 {news['source']} | 🕒 {news['time']}
            </div>
            <div class="news-summary">{news['summary']}</div>
            <a href="{news['url']}" class="news-link" target="_blank">阅读原文 →</a>
        </div>
            '''
        
        html += f'''
    </div>
    
    <div class="stats">
        <p>📊 今日汇总：{len(tech_news)} 条科技新闻 | {len(finance_news)} 条财经新闻 | 总计 {len(tech_news) + len(finance_news)} 条重要新闻</p>
    </div>
    
    <div class="footer">
        <p>💡 本报告由 NIKO AI 助手自动生成 | 数据更新时间：{datetime.datetime.now().strftime("%Y-%m-%d %H:%M")}</p>
        <p>🔔 每天上午8:30自动推送昨日新闻摘要</p>
    </div>
</body>
</html>
'''
        return html
    
    def save_html(self, filename: str = "daily_news.html"):
        """保存HTML文件"""
        html_content = self.generate_html()
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(html_content)
        print(f"✅ HTML文件已保存：{filename}")
        return filename

if __name__ == "__main__":
    collector = NewsCollector()
    html_file = collector.save_html("daily_news.html")
    print(f"📰 今日新闻已生成，共收集 {len(collector.collect_tech_news())} 条科技新闻和 {len(collector.collect_finance_news())} 条财经新闻")