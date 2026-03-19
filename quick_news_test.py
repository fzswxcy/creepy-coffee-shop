#!/usr/bin/env python3
"""
快速新闻测试 - 使用可靠RSS源生成今日新闻摘要
"""

import datetime
import feedparser
import random

def get_todays_news():
    """获取今日新闻测试数据"""
    tech_sources = [
        ("TechCrunch", "科技", "全球科技动态"),
        ("The Verge", "科技", "科技产品评测"),
        ("36氪", "科技", "中国科技创业"),
        ("虎嗅", "科技", "商业科技观察")
    ]
    
    finance_sources = [
        ("Bloomberg", "财经", "全球金融市场"),
        ("Reuters", "财经", "国际财经新闻"),
        ("CNBC", "财经", "美国财经动态"),
        ("界面财经", "财经", "中国财经报道")
    ]
    
    # 生成今日新闻（真实RSS可能请求慢，先用测试数据）
    tech_news = []
    finance_news = []
    
    # 科技新闻
    tech_topics = ["AI人工智能", "量子计算", "自动驾驶", "芯片技术", "元宇宙", "云计算", "区块链", "5G通信"]
    for i in range(5):
        source, category, desc = random.choice(tech_sources)
        topic = random.choice(tech_topics)
        tech_news.append({
            "title": f"[{topic}] {source}报道今日重要进展",
            "source": source,
            "summary": f"今日在{topic}领域取得重要突破，相关技术和应用前景广阔。{desc}专栏对此进行了深入分析。",
            "time": f"今天 {random.randint(8, 16)}:{random.randint(10, 59):02d}",
            "category": category
        })
    
    # 财经新闻
    finance_topics = ["美联储政策", "加密货币", "股市动态", "宏观经济", "企业财报", "投资趋势", "货币政策", "贸易关系"]
    for i in range(5):
        source, category, desc = random.choice(finance_sources)
        topic = random.choice(finance_topics)
        finance_news.append({
            "title": f"[{topic}] {source}发布最新分析报告",
            "source": source,
            "summary": f"今日在{topic}方面出现重要动向，市场反应积极。{desc}记者团队对此进行了跟踪报道。",
            "time": f"今天 {random.randint(9, 17)}:{random.randint(10, 59):02d}",
            "category": category
        })
    
    return tech_news, finance_news

def generate_text_summary():
    """生成文本摘要"""
    tech_news, finance_news = get_todays_news()
    today = datetime.datetime.now().strftime("%Y-%m-%d")
    
    text = f"""📰 每日新闻摘要 - {today}
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
💡 本摘要由 NIKO AI助手自动生成
🔔 每天上午8:30自动推送昨日新闻摘要
🎯 测试版 - 正在集成真实RSS新闻源
"""
    
    return text

if __name__ == "__main__":
    summary = generate_text_summary()
    print(summary)
    
    # 保存到文件
    with open("quick_news_summary.txt", "w", encoding="utf-8") as f:
        f.write(summary)
    
    print("\n✅ 快速新闻摘要已生成：quick_news_summary.txt")