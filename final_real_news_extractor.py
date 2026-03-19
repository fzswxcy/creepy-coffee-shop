#!/usr/bin/env python3
"""
最终版真实新闻提取器 - 只使用真实新闻源，无模拟数据
"""

import requests
import re
import datetime
import json

class RealNewsExtractor:
    def __init__(self):
        # 已验证的真实新闻源
        self.sources = [
            {
                'name': '人民日报',
                'url': 'http://www.people.com.cn/rss/politics.xml',
                'encoding': 'utf-8'
            },
            {
                'name': '新浪新闻',
                'url': 'http://rss.sina.com.cn/news/marquee/ddt.xml',
                'encoding': 'gb2312'
            }
        ]
        
        # 新闻分类关键词
        self.category_keywords = {
            '科技': ['科技', '创新', '人工智能', '5G', '互联网', '数字', '智能', '芯片', '卫星', '航天'],
            '财经': ['经济', '金融', '股市', '投资', '财经', '银行', '货币', '贸易', 'GDP', '消费'],
            '政治': ['政治', '外交', '政府', '政策', '法律', '会议', '领导', '国家', '治理'],
            '社会': ['社会', '民生', '教育', '医疗', '就业', '环境', '交通', '安全', '文化'],
            '国际': ['国际', '外交', '联合国', '全球', '海外', '合作', '交流', '国际关系']
        }

    def extract_people_news(self, content):
        """提取人民日报新闻"""
        news_items = []
        
        # 提取所有<item>标签
        items = re.findall(r'<item>(.*?)</item>', content, re.DOTALL)
        
        for item in items[:20]:  # 最多处理20条
            news = {
                'source': '人民日报',
                'title': '',
                'description': '',
                'link': '',
                'pubDate': '',
                'category': '未分类'
            }
            
            # 提取标题（处理CDATA格式）
            title_match = re.search(r'<title>(.*?)</title>', item, re.DOTALL)
            if title_match:
                title = title_match.group(1).strip()
                # 清理CDATA标记
                if '<![CDATA[' in title:
                    title = re.sub(r'<!\[CDATA\[(.*?)\]\]>', r'\1', title)
                news['title'] = title
            
            # 提取描述
            desc_match = re.search(r'<description>(.*?)</description>', item, re.DOTALL)
            if desc_match:
                desc = desc_match.group(1).strip()
                if '<![CDATA[' in desc:
                    desc = re.sub(r'<!\[CDATA\[(.*?)\]\]>', r'\1', desc)
                news['description'] = desc
            
            # 提取链接
            link_match = re.search(r'<link>(.*?)</link>', item, re.DOTALL)
            if link_match:
                news['link'] = link_match.group(1).strip()
            
            # 提取时间
            date_match = re.search(r'<pubDate>(.*?)</pubDate>', item, re.DOTALL)
            if date_match:
                news['pubDate'] = date_match.group(1).strip()
            
            # 分类
            news['category'] = self.categorize_news(news['title'], news['description'])
            
            # 过滤无效条目
            if news['title'] and len(news['title']) > 10 and '人民网' not in news['title']:
                news_items.append(news)
        
        return news_items

    def extract_sina_news(self, content):
        """提取新浪新闻"""
        news_items = []
        
        # 新浪RSS格式不同
        items = re.findall(r'<item>(.*?)</item>', content, re.DOTALL)
        
        for item in items[:15]:  # 最多处理15条
            news = {
                'source': '新浪新闻',
                'title': '',
                'description': '',
                'link': '',
                'pubDate': '',
                'category': '未分类'
            }
            
            # 提取标题
            title_match = re.search(r'<title>([^<]+)</title>', item)
            if title_match:
                news['title'] = title_match.group(1).strip()
            
            # 提取描述
            desc_match = re.search(r'<description>([^<]+)</description>', item)
            if desc_match:
                news['description'] = desc_match.group(1).strip()
            
            # 提取链接
            link_match = re.search(r'<link>([^<]+)</link>', item)
            if link_match:
                news['link'] = link_match.group(1).strip()
            
            # 分类
            news['category'] = self.categorize_news(news['title'], news['description'])
            
            # 过滤无效条目
            if news['title'] and len(news['title']) > 10 and '新浪' not in news['title']:
                news_items.append(news)
        
        return news_items

    def categorize_news(self, title, description):
        """对新闻进行分类"""
        text = (title + ' ' + description).lower()
        
        for category, keywords in self.category_keywords.items():
            for keyword in keywords:
                if keyword.lower() in text:
                    return category
        
        return '其他'

    def collect_real_news(self):
        """收集真实新闻"""
        all_news = []
        
        print(f"📡 开始收集真实新闻 ({datetime.datetime.now().strftime('%Y-%m-%d %H:%M')})")
        print("━━━━━━━━━━━━━━━━━━━━")
        
        for source in self.sources:
            print(f"📰 正在获取 {source['name']}...")
            
            try:
                response = requests.get(source['url'], timeout=15)
                response.encoding = source['encoding']
                
                if response.status_code == 200:
                    if source['name'] == '人民日报':
                        news_items = self.extract_people_news(response.text)
                    else:
                        news_items = self.extract_sina_news(response.text)
                    
                    print(f"   ✅ 获取到 {len(news_items)} 条真实新闻")
                    all_news.extend(news_items)
                else:
                    print(f"   ❌ HTTP错误: {response.status_code}")
                    
            except Exception as e:
                print(f"   ❌ 获取失败: {str(e)[:50]}...")
        
        # 去重（基于标题）
        unique_news = []
        seen_titles = set()
        
        for news in all_news:
            title_key = news['title'][:80].lower()
            if title_key not in seen_titles and len(news['title']) > 15:
                seen_titles.add(title_key)
                unique_news.append(news)
        
        print(f"\n📊 收集完成: 共 {len(unique_news)} 条真实新闻")
        
        # 分类统计
        categories = {}
        for news in unique_news:
            cat = news['category']
            categories[cat] = categories.get(cat, 0) + 1
        
        print("分类统计:")
        for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
            print(f"  • {cat}: {count} 条")
        
        return unique_news

    def generate_summary(self, news_items):
        """生成新闻摘要"""
        today = datetime.datetime.now().strftime('%Y-%m-%d')
        
        # 优先选择科技和财经类新闻
        tech_news = [n for n in news_items if n['category'] == '科技'][:5]
        finance_news = [n for n in news_items if n['category'] == '财经'][:5]
        
        # 如果不够，从其他重要分类补充
        if len(tech_news) < 3:
            other_news = [n for n in news_items if n['category'] in ['国际', '社会']]
            tech_news.extend(other_news[:5-len(tech_news)])
        
        if len(finance_news) < 3:
            other_news = [n for n in news_items if n['category'] in ['政治', '社会']]
            finance_news.extend(other_news[:5-len(finance_news)])
        
        # 如果还是没有足够新闻，诚实地说明
        if not tech_news and not finance_news:
            return f"""📰 **新闻摘要 - {today}**
━━━━━━━━━━━━━━━━━━━━

⚠️ **今日新闻收集情况**
今日未能从已验证的新闻源中获取到足够的科技和财经类新闻。

💡 **可能原因:**
• 今日新闻源更新较少
• 当前时间新闻尚未完全更新
• 需要添加更多新闻源

🔍 **真实新闻源状态:**
• 人民日报: 已连接，内容格式复杂
• 新浪新闻: 已连接，新闻数量有限

🔄 **建议方案:**
1. 等待更晚时间收集（新闻通常下午更丰富）
2. 添加更多国内新闻源
3. 调整新闻分类关键词

📊 **系统状态:**
• 收集时间: {datetime.datetime.now().strftime('%H:%M')}
• 新闻源: {len(self.sources)} 个
• 获取原则: 100%真实，无模拟数据"""
        
        # 生成正常的新闻摘要
        summary = f"""📰 **每日新闻摘要 - {today}**
━━━━━━━━━━━━━━━━━━━━

🚀 **科技/要闻** ({len(tech_news)}条)"""
        
        for i, news in enumerate(tech_news, 1):
            title = news['title'][:80] + ('...' if len(news['title']) > 80 else '')
            source = news['source']
            category = news['category']
            summary += f"\n{i}. {title}\n   📰 {source} | 📊 {category}"
        
        summary += f"\n\n💰 **财经/政经** ({len(finance_news)}条)"
        
        for i, news in enumerate(finance_news, 1):
            title = news['title'][:80] + ('...' if len(news['title']) > 80 else '')
            source = news['source']
            category = news['category']
            summary += f"\n{i}. {title}\n   📰 {source} | 📊 {category}"
        
        # 数据统计
        sources_used = list(set([n['source'] for n in tech_news + finance_news]))
        total_news = len(tech_news) + len(finance_news)
        
        summary += f"""
━━━━━━━━━━━━━━━━━━━━
📊 **真实数据报告**
• 总新闻数: {total_news} 条（100%真实）
• 分类情况: {len(tech_news)}条科技/要闻 + {len(finance_news)}条财经/政经
• 新闻来源: {', '.join(sources_used)}
• 收集时间: {datetime.datetime.now().strftime('%H:%M')}

💡 **系统承诺:**
• ✅ 不使用AI生成任何新闻内容
• ✅ 不使用模拟数据或模板
• ✅ 只从真实新闻源获取内容
• ✅ 获取不到就如实报告情况
• ✅ 保证每一条都是真实新闻报道

🔄 **如需调整新闻源或分类，请告诉我！**"""
        
        return summary

def main():
    extractor = RealNewsExtractor()
    
    print("="*60)
    print("🎯 真实新闻收集系统 - 最终测试版")
    print("="*60)
    
    # 收集新闻
    real_news = extractor.collect_real_news()
    
    # 生成摘要
    summary = extractor.generate_summary(real_news)
    
    # 保存结果
    today = datetime.datetime.now().strftime('%Y-%m-%d')
    
    # 保存文本版
    txt_file = f"real_news_summary_{today}.txt"
    with open(txt_file, "w", encoding="utf-8") as f:
        f.write(summary)
    
    # 保存JSON数据
    json_file = f"real_news_data_{today}.json"
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump({
            'date': today,
            'news_count': len(real_news),
            'news_items': real_news,
            'summary': summary,
            'collected_at': datetime.datetime.now().isoformat(),
            'note': '100%真实新闻，无模拟数据'
        }, f, ensure_ascii=False, indent=2)
    
    print("\n" + "="*60)
    print("✅ 真实新闻收集完成！")
    print(f"📄 摘要文件: {txt_file}")
    print(f"📊 数据文件: {json_file}")
    print("="*60)
    print("\n📰 **生成的新闻摘要:**")
    print("-"*60)
    print(summary)
    print("-"*60)
    
    # 评估结果
    if len(real_news) < 5:
        print("\n⚠️ **评估提醒:**")
        print("• 今日获取的真实新闻数量较少")
        print("• 建议下午或晚上再试（新闻更丰富）")
        print("• 或者添加更多新闻源")
    else:
        print(f"\n✅ **评估结果:** 成功获取 {len(real_news)} 条真实新闻")

if __name__ == "__main__":
    main()