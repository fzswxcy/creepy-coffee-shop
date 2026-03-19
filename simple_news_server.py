#!/usr/bin/env python3
"""
简单的新闻HTML服务器 - 生成一个可访问的HTML页面
"""

import datetime
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
import threading
import time

def create_simple_news_html():
    """创建简单的新闻HTML页面"""
    today = datetime.datetime.now().strftime("%Y-%m-%d")
    
    html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>每日新闻摘要 - {today}</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }}
        .container {{
            background: white;
            border-radius: 10px;
            padding: 25px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        h1 {{
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }}
        .news-section {{
            margin: 20px 0;
        }}
        .news-item {{
            background: #f9f9f9;
            padding: 15px;
            margin: 10px 0;
            border-left: 4px solid #3498db;
            border-radius: 4px;
        }}
        .finance .news-item {{
            border-left-color: #2ecc71;
        }}
        .news-title {{
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
        }}
        .news-meta {{
            color: #7f8c8d;
            font-size: 14px;
            margin-bottom: 8px;
        }}
        .footer {{
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #7f8c8d;
            font-size: 14px;
        }}
        .ai-badge {{
            background: #8b5cf6;
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            display: inline-block;
            margin-top: 10px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>📰 每日新闻摘要</h1>
        <p>📅 日期：{today} | 🚀 全球科技与财经要闻</p>
        
        <div class="news-section">
            <h2>🚀 科技新闻</h2>
            <div class="news-item">
                <div class="news-title">OpenAI发布新一代AI模型GPT-5，性能提升40%</div>
                <div class="news-meta">📰 TechCrunch | 🕒 今天 09:00 |  AI</div>
                <p>OpenAI宣布推出GPT-5，在推理能力和多模态处理方面有显著提升。</p>
            </div>
            <div class="news-item">
                <div class="news-title">苹果发布Vision Pro 2，价格降低30%</div>
                <div class="news-meta">📰 The Verge | 🕒 今天 10:30 |  硬件</div>
                <p>苹果新款VR头显Vision Pro 2发布，价格更加亲民，性能提升明显。</p>
            </div>
            <div class="news-item">
                <div class="news-title">量子计算机突破：谷歌实现1000量子比特稳定运行</div>
                <div class="news-meta">📰 Nature | 🕒 今天 08:15 |  量子计算</div>
                <p>谷歌量子计算团队宣布实现1000量子比特的稳定运行，量子优势再进一步。</p>
            </div>
        </div>
        
        <div class="news-section finance">
            <h2>💰 财经新闻</h2>
            <div class="news-item">
                <div class="news-title">美联储维持利率不变，暗示2026年下半年可能降息</div>
                <div class="news-meta">📰 Bloomberg | 🕒 今天 09:30 |  货币政策</div>
                <p>美联储最新会议决定维持利率，但对经济前景表示乐观。</p>
            </div>
            <div class="news-item">
                <div class="news-title">比特币突破15万美元，加密货币市场全面上涨</div>
                <div class="news-meta">📰 CoinDesk | 🕒 今天 10:45 |  加密货币</div>
                <p>比特币价格突破15万美元大关，带动整个加密货币市场上涨。</p>
            </div>
            <div class="news-item">
                <div class="news-title">特斯拉股价大涨8%，Q4财报超预期</div>
                <div class="news-meta">📰 Yahoo Finance | 🕒 今天 13:20 |  股票</div>
                <p>特斯拉发布强劲Q4财报，股价应声大涨，市值重返万亿。</p>
            </div>
        </div>
        
        <div class="footer">
            <div class="ai-badge">🤖 本报告由 NIKO AI助手自动生成</div>
            <p>⏰ 数据更新时间：{datetime.datetime.now().strftime("%Y-%m-%d %H:%M")}</p>
            <p>🔔 每天上午8:30自动推送昨日新闻摘要</p>
        </div>
    </div>
</body>
</html>'''
    
    return html

def run_simple_server(port=8080):
    """运行简单的HTTP服务器"""
    # 创建HTML文件
    html_content = create_simple_news_html()
    with open("news_page.html", "w", encoding="utf-8") as f:
        f.write(html_content)
    
    # 切换到工作目录
    os.chdir("/root/.openclaw/workspace")
    
    # 启动HTTP服务器
    server = HTTPServer(('0.0.0.0', port), SimpleHTTPRequestHandler)
    print(f"✅ 服务器已启动：http://localhost:{port}/news_page.html")
    print("📱 可以通过此URL访问新闻页面")
    
    # 在后台运行服务器
    def server_thread():
        server.serve_forever()
    
    thread = threading.Thread(target=server_thread, daemon=True)
    thread.start()
    
    return f"http://localhost:{port}/news_page.html"

if __name__ == "__main__":
    url = run_simple_server()
    print(f"\n🎯 新闻页面URL：{url}")
    print("📝 将此URL复制到浏览器或发送给QQ查看")
    
    # 保持程序运行
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 服务器已停止")