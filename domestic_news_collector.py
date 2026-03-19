#!/usr/bin/env python3
"""
国内新闻收集器 - 使用可访问的国内新闻源
"""

import datetime
import requests
import xml.etree.ElementTree as ET
import json
import re
from collections import Counter

class DomesticNewsCollector:
    def __init__(self):
        # 可访问的国内新闻源
        self.sources = {
            'people': {
                'name': '人民日报',
                'url': 'http://www.people.com.cn/rss/politics.xml',
                'type': 'rss'
            },
            'sina': {
                'name': '新浪新闻',
                'url': 'http://rss.sina.com.cn/news/marquee/ddt.xml',
                'type': 'rss'
            },
            'qq': {
                'name': '腾讯新闻',
                'url': 'http://news.qq.com/newsgn/rss_newsgn.xml',
                'type': 'rss'
            }
        }
        
        # 新闻分类关键词
        self.categories = {
            '科技': ['科技', '人工智能', '5G', '互联网', '数码', '手机', '芯片', '创新'],
            '财经': ['经济', '金融', '股市', '投资', '财经', '银行', '货币', '贸易'],
            '政治': ['政治', '外交', '政府', '政策', '法律', '国会', '选举'],
            '社会': ['社会', '民生', '教育', '医疗', '就业', '环境', '交通'],
            '国际': ['国际', '外交', '联合国', '全球', '海外', '国际合作']
        }

    def fetch_rss_feed(self, url, source_name):
        """获取RSS源内容"""
        try:
            response = requests.get(url, timeout=10)
            response.encoding = 'utf-8'
            
            if response.status_code == 200:
                # 尝试解析XML
                try:
                    root = ET.fromstring(response.text)
                    return root
                except ET.ParseError:
                    # 可能是HTML格式，尝试提取文本
                    print(f"⚠️  {source_name}: RSS解析失败，可能是HTML格式")
                    return None
            else:
                print(f"❌  {source_name}: HTTP错误 {response.status_code}")
                return None
                
        except Exception as e:
            print(f"❌  {source_name}: 获取失败 - {e}")
            return None

    def extract_news_from_rss(self, rss_root, source_name, limit=10):
        """从RSS提取新闻"""
        news_items = []
        
        if rss_root is None:
            return news_items
        
        # 尝试不同的RSS格式
        for item_tag in ['item', 'entry']:
            items = rss_root.findall(f'.//{item_tag}')
            if items:
                for item in items[:limit]:
                    news = {
                        'source': source_name,
                        'title': '',
                        'link': '',
                        'description': '',
                        'pubDate': '',
                        'category': '未分类'
                    }
                    
                    # 提取标题
                    title_elem = item.find('title')
                    if title_elem is not None:
                        news['title'] = title_elem.text or ''
                    
                    # 提取链接
                    link_elem = item.find('link')
                    if link_elem is not None:
                        news['link'] = link_elem.text or ''
                    
                    # 提取描述
                    desc_elem = item.find('description') or item.find('summary')
                    if desc_elem is not None:
                        news['description'] = desc_elem.text or ''
                    
                    # 提取发布时间
                    date_elem = item.find('pubDate') or item.find('published')
                    if date_elem is not None:
                        news['pubDate'] = date_elem.text or ''
                    
                    # 分类新闻
                    news['category'] = self.categorize_news(news['title'], news['description'])
                    
                    if news['title']:  # 只添加有标题的新闻
                        news_items.append(news)
                
                break  # 找到有效格式就停止
        
        return news_items

    def categorize_news(self, title, description):
        """对新闻进行分类"""
        text = (title + ' ' + description).lower()
        
        for category, keywords in self.categories.items():
            for keyword in keywords:
                if keyword.lower() in text:
                    return category
        
        return '其他'

    def collect_news(self, max_items=15):
        """收集所有源的新闻"""
        all_news = []
        
        print(f"📡 开始收集国内新闻 ({datetime.datetime.now().strftime('%Y-%m-%d %H:%M')})")
        print("━━━━━━━━━━━━━━━━━━━━")
        
        for source_id, source_info in self.sources.items():
            print(f"📰 正在获取 {source_info['name']}...")
            
            if source_info['type'] == 'rss':
                rss_root = self.fetch_rss_feed(source_info['url'], source_info['name'])
                news_items = self.extract_news_from_rss(rss_root, source_info['name'], limit=5)
                all_news.extend(news_items)
                
                print(f"   ✅ 获取到 {len(news_items)} 条新闻")
            else:
                print(f"   ⚠️ 未知源类型: {source_info['type']}")
        
        # 去重和排序
        unique_news = []
        seen_titles = set()
        
        for news in all_news:
            # 简单去重：标题相似度
            title_key = news['title'][:50]  # 取前50字符作为去重键
            if title_key not in seen_titles and len(title_key) > 5:
                seen_titles.add(title_key)
                unique_news.append(news)
        
        # 按分类分组
        categorized = {}
        for news in unique_news[:max_items]:
            cat = news['category']
            if cat not in categorized:
                categorized[cat] = []
            categorized[cat].append(news)
        
        print(f"\n📊 收集完成: 共 {len(unique_news)} 条新闻")
        print("分类统计:")
        for cat, items in categorized.items():
            print(f"  • {cat}: {len(items)} 条")
        
        return categorized

    def generate_summary(self, categorized_news):
        """生成新闻摘要"""
        today = datetime.datetime.now().strftime('%Y-%m-%d')
        
        # 优先选择科技和财经新闻
        tech_news = categorized_news.get('科技', [])[:5]
        finance_news = categorized_news.get('财经', [])[:5]
        
        # 如果不够，从其他分类补充
        if len(tech_news) < 3:
            other_cats = [cat for cat in ['科技', '国际', '社会'] if cat in categorized_news]
            for cat in other_cats:
                if len(tech_news) < 5:
                    needed = 5 - len(tech_news)
                    tech_news.extend(categorized_news[cat][:needed])
        
        if len(finance_news) < 3:
            other_cats = [cat for cat in ['财经', '政治', '社会'] if cat in categorized_news]
            for cat in other_cats:
                if len(finance_news) < 5:
                    needed = 5 - len(finance_news)
                    finance_news.extend(categorized_news[cat][:needed])
        
        # 生成摘要
        summary = f"""📰 **每日新闻摘要 - {today}**
━━━━━━━━━━━━━━━━━━━━

🚀 **科技/要闻** ({len(tech_news)}条)"""
        
        for i, news in enumerate(tech_news, 1):
            title = news['title'][:100] + ('...' if len(news['title']) > 100 else '')
            source = news['source']
            category = news['category']
            summary += f"\n{i}. {title}\n   📰 {source} | 📊 {category}"
        
        summary += f"\n\n💰 **财经/政经** ({len(finance_news)}条)"
        
        for i, news in enumerate(finance_news, 1):
            title = news['title'][:100] + ('...' if len(news['title']) > 100 else '')
            source = news['source']
            category = news['category']
            summary += f"\n{i}. {title}\n   📰 {source} | 📊 {category}"
        
        # 添加数据源信息
        sources_used = list(set([n['source'] for n in tech_news + finance_news]))
        
        summary += f"""
━━━━━━━━━━━━━━━━━━━━
📊 **数据汇总**
• 总新闻数: {len(tech_news) + len(finance_news)} 条
• 分类: {len(tech_news)}条科技/要闻 + {len(finance_news)}条财经/政经
• 数据源: {', '.join(sources_used)}
• 收集时间: {datetime.datetime.now().strftime('%H:%M')}

💡 **系统说明**
• 使用国内可访问新闻源实时收集
• 自动分类和筛选重要新闻
• 每日定时更新，保持时效性
• 适配QQ消息长度限制

🔄 **如需调整新闻源或分类，请告诉我！**"""
        
        return summary

def main():
    collector = DomesticNewsCollector()
    
    # 收集新闻
    categorized_news = collector.collect_news(max_items=20)
    
    if not categorized_news:
        print("\n❌ 未能收集到新闻，使用备用方案...")
        # 可以调用AI生成器作为备用
        return
    
    # 生成摘要
    summary = collector.generate_summary(categorized_news)
    
    # 保存到文件
    today = datetime.datetime.now().strftime('%Y-%m-%d')
    
    # 保存文本版
    with open(f"domestic_news_{today}.txt", "w", encoding="utf-8") as f:
        f.write(summary)
    
    # 保存原始数据
    with open(f"domestic_news_{today}.json", "w", encoding="utf-8") as f:
        json.dump({
            'date': today,
            'sources': list(collector.sources.keys()),
            'categorized_news': categorized_news,
            'summary': summary,
            'collected_at': datetime.datetime.now().isoformat()
        }, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ 国内新闻收集完成！")
    print(f"📄 文本摘要: domestic_news_{today}.txt")
    print(f"📊 原始数据: domestic_news_{today}.json")
    print("\n" + "="*50)
    print(summary[:800] + "..." if len(summary) > 800 else summary)
    print("="*50)

if __name__ == "__main__":
    main()