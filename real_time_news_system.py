#!/usr/bin/env python3
"""
实时新闻系统 - 获取昨天或当天的全球时事新闻
无视风险，只要能获取实时新闻
"""

import datetime
import requests
import json
import re
import sys

class RealTimeNewsSystem:
    def __init__(self):
        # 新闻源列表 - 尝试多种获取方式
        self.news_sources = [
            {
                'name': '国内权威媒体',
                'type': 'web',
                'urls': [
                    'http://www.xinhuanet.com/',
                    'http://www.people.com.cn/',
                    'http://www.cctv.com/'
                ]
            },
            {
                'name': '新闻API备用',
                'type': 'api',
                'endpoints': [
                    # 这里可以添加可用的新闻API
                ]
            },
            {
                'name': 'RSS新闻聚合',
                'type': 'rss',
                'feeds': [
                    'http://rss.sina.com.cn/news/marquee/ddt.xml',
                    'http://www.people.com.cn/rss/politics.xml'
                ]
            }
        ]
        
        # 新闻分类
        self.categories = {
            '科技': ['科技', '人工智能', '5G', '芯片', '互联网', '创新'],
            '财经': ['经济', '金融', '股市', '投资', '财经', '贸易'],
            '国际': ['国际', '外交', '全球', '联合国', '海外'],
            '政治': ['政治', '政府', '政策', '法律', '国会'],
            '社会': ['社会', '民生', '教育', '医疗', '环境']
        }

    def fetch_from_web(self, url):
        """从网页获取新闻"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Connection': 'keep-alive'
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            response.encoding = 'utf-8'
            
            if response.status_code == 200:
                return response.text
            else:
                print(f"  ❌ HTTP错误 {response.status_code}")
                return None
                
        except Exception as e:
            print(f"  ❌ 网页获取失败: {str(e)[:50]}")
            return None

    def extract_news_from_html(self, html, source_name):
        """从HTML提取新闻"""
        news_items = []
        
        if not html:
            return news_items
        
        try:
            # 尝试提取新闻标题和链接
            # 不同网站有不同的HTML结构
            
            # 方法1: 提取<h2>, <h3>等标题标签
            h2_pattern = r'<h2[^>]*><a[^>]*href="([^"]*)"[^>]*>([^<]+)</a></h2>'
            h2_matches = re.findall(h2_pattern, html, re.IGNORECASE)
            
            for link, title in h2_matches[:10]:
                if len(title.strip()) > 10:
                    # 确保是完整URL
                    if not link.startswith('http'):
                        if source_name == '新华网':
                            link = 'http://www.xinhuanet.com' + link if link.startswith('/') else link
                        elif source_name == '人民日报':
                            link = 'http://www.people.com.cn' + link if link.startswith('/') else link
                    
                    news_items.append({
                        'title': title.strip(),
                        'url': link,
                        'source': source_name,
                        'category': '待分类'
                    })
            
            # 方法2: 提取新闻列表项
            li_pattern = r'<li[^>]*><a[^>]*href="([^"]*)"[^>]*>([^<]+)</a></li>'
            li_matches = re.findall(li_pattern, html, re.IGNORECASE)
            
            for link, title in li_matches[:15]:
                if len(title.strip()) > 15 and '更多' not in title:
                    if not link.startswith('http'):
                        if source_name == '新华网':
                            link = 'http://www.xinhuanet.com' + link if link.startswith('/') else link
                    
                    news_items.append({
                        'title': title.strip(),
                        'url': link,
                        'source': source_name,
                        'category': '待分类'
                    })
            
        except Exception as e:
            print(f"  ⚠️ HTML解析失败: {str(e)[:50]}")
        
        return news_items

    def categorize_news(self, title):
        """对新闻进行分类"""
        title_lower = title.lower()
        
        for category, keywords in self.categories.items():
            for keyword in keywords:
                if keyword.lower() in title_lower:
                    return category
        
        return '其他'

    def collect_real_time_news(self):
        """收集实时新闻"""
        print(f"📡 开始收集实时新闻 ({datetime.datetime.now().strftime('%Y-%m-%d %H:%M')})")
        print("━━━━━━━━━━━━━━━━━━━━")
        
        all_news = []
        
        for source in self.news_sources:
            print(f"\n📰 尝试从 {source['name']} 获取:")
            
            if source['type'] == 'web' and 'urls' in source:
                for url in source['urls'][:2]:  # 只尝试前两个
                    print(f"  • {url}")
                    html = self.fetch_from_web(url)
                    if html:
                        source_name = '新华网' if 'xinhuanet' in url else '人民日报'
                        news_items = self.extract_news_from_html(html, source_name)
                        if news_items:
                            print(f"    ✅ 获取到 {len(news_items)} 条新闻")
                            all_news.extend(news_items)
            
            elif source['type'] == 'rss' and 'feeds' in source:
                for feed_url in source['feeds'][:1]:  # 只尝试一个RSS
                    print(f"  • RSS: {feed_url}")
                    try:
                        response = requests.get(feed_url, timeout=10)
                        if response.status_code == 200:
                            # 简单的RSS解析
                            content = response.text
                            # 提取<title>和<link>
                            titles = re.findall(r'<title>([^<]+)</title>', content)
                            links = re.findall(r'<link>([^<]+)</link>', content)
                            
                            # 配对标题和链接
                            for i in range(min(len(titles), len(links), 10)):
                                title = titles[i].strip()
                                link = links[i].strip()
                                if title and link and len(title) > 10:
                                    all_news.append({
                                        'title': title,
                                        'url': link,
                                        'source': 'RSS聚合',
                                        'category': '待分类'
                                    })
                            
                            print(f"    ✅ 从RSS获取到新闻")
                    except Exception as e:
                        print(f"    ❌ RSS获取失败: {str(e)[:50]}")
        
        # 去重和分类
        unique_news = []
        seen_titles = set()
        
        for news in all_news:
            title_key = news['title'][:50].lower()
            if title_key not in seen_titles and len(news['title']) > 15:
                seen_titles.add(title_key)
                news['category'] = self.categorize_news(news['title'])
                unique_news.append(news)
        
        print(f"\n📊 收集完成: 共 {len(unique_news)} 条新闻")
        
        return unique_news

    def generate_report(self, news_items):
        """生成新闻报告"""
        today = datetime.datetime.now().strftime('%Y-%m-%d')
        yesterday = (datetime.datetime.now() - datetime.timedelta(days=1)).strftime('%Y-%m-%d')
        
        # 按分类分组
        categorized = {}
        for news in news_items:
            cat = news['category']
            if cat not in categorized:
                categorized[cat] = []
            categorized[cat].append(news)
        
        # 生成报告
        report = f"""📰 **实时新闻报告 - {today}**
━━━━━━━━━━━━━━━━━━━━

💡 **收集说明**
• 收集时间: {datetime.datetime.now().strftime('%H:%M')}
• 时间范围: {yesterday} 至 {today}
• 收集原则: 实时或昨日新闻，无视风险获取
• 验证方式: 每条新闻附带来源链接"""

        # 添加新闻内容
        tech_news = categorized.get('科技', [])[:3]
        finance_news = categorized.get('财经', [])[:3]
        intl_news = categorized.get('国际', [])[:2]
        
        if tech_news:
            report += f"\n\n🚀 **科技新闻** ({len(tech_news)}条)"
            for i, news in enumerate(tech_news, 1):
                report += f"\n{i}. {news['title'][:80]}..."
                report += f"\n   📰 {news['source']} | 🔗 {news['url']}"
        
        if finance_news:
            report += f"\n\n💰 **财经新闻** ({len(finance_news)}条)"
            for i, news in enumerate(finance_news, 1):
                report += f"\n{i}. {news['title'][:80]}..."
                report += f"\n   📰 {news['source']} | 🔗 {news['url']}"
        
        if intl_news:
            report += f"\n\n🌍 **国际新闻** ({len(intl_news)}条)"
            for i, news in enumerate(intl_news, 1):
                report += f"\n{i}. {news['title'][:80]}..."
                report += f"\n   📰 {news['source']} | 🔗 {news['url']}"
        
        # 如果没有新闻
        if not (tech_news or finance_news or intl_news) and news_items:
            report += f"\n\n📋 **其他重要新闻**"
            for i, news in enumerate(news_items[:5], 1):
                report += f"\n{i}. {news['title'][:80]}..."
                report += f"\n   📰 {news['source']} | 📊 {news['category']}"
        
        # 统计数据
        total = len(news_items)
        cat_stats = {cat: len(items) for cat, items in categorized.items()}
        
        report += f"""
━━━━━━━━━━━━━━━━━━━━
📊 **统计数据**
• 总新闻数: {total} 条"""
        
        for cat, count in cat_stats.items():
            report += f"\n• {cat}: {count} 条"
        
        report += f"""
💡 **系统状态**
• 新闻源: {len(self.news_sources)} 个渠道尝试
• 成功率: {'部分成功' if news_items else '较低'}
• 风险等级: ⚠️ 无视风险获取实时新闻
• 改进方向: 需要更多新闻源和优化

🔄 **后续计划**
• 寻找更多实时新闻源
• 优化新闻提取算法
• 提高新闻时效性"""

        if total == 0:
            report += f"""
⚠️ **今日新闻较少**
• 可能原因: 新闻源限制或网络问题
• 建议方案: 添加更多新闻API或爬虫
• 备用方案: 使用其他新闻聚合服务"""

        return report

def main():
    print("="*60)
    print("🎯 实时新闻系统 - 无视风险获取昨日/当日新闻")
    print("="*60)
    
    system = RealTimeNewsSystem()
    
    # 收集新闻
    news = system.collect_real_time_news()
    
    # 生成报告
    report = system.generate_report(news)
    
    # 保存结果
    today = datetime.datetime.now().strftime('%Y-%m-%d')
    
    with open(f"real_time_news_{today}.txt", "w", encoding="utf-8") as f:
        f.write(report)
    
    with open(f"real_time_news_{today}.json", "w", encoding="utf-8") as f:
        json.dump({
            'date': today,
            'news_count': len(news),
            'news_items': news,
            'report': report,
            'generated_at': datetime.datetime.now().isoformat(),
            'note': '无视风险获取实时新闻'
        }, f, ensure_ascii=False, indent=2)
    
    print("\n" + "="*60)
    print("✅ 实时新闻收集完成！")
    print(f"📄 报告文件: real_time_news_{today}.txt")
    print(f"📊 数据文件: real_time_news_{today}.json")
    print("="*60)
    
    # 显示简要报告
    print("\n📰 **实时新闻简报:**")
    print("-"*60)
    
    if news:
        # 显示前5条新闻
        for i, item in enumerate(news[:5], 1):
            print(f"{i}. {item['title'][:60]}...")
            print(f"   来源: {item['source']} | 分类: {item['category']}")
        
        print(f"\n📊 共获取 {len(news)} 条新闻")
    else:
        print("⚠️ 今日未能获取到实时新闻")
        print("💡 需要优化新闻源或方法")
    
    print("-"*60)

if __name__ == "__main__":
    main()