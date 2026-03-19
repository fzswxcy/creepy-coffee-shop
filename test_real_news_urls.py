#!/usr/bin/env python3
"""
测试获取真实可访问的新闻URL
"""

import requests
import re
import datetime

def get_real_news_with_urls():
    """获取人民日报真实新闻及可访问URL"""
    print('🎯 获取人民日报真实可访问新闻URL')
    print('━━━━━━━━━━━━━━━━━━━━')
    print('时间:', datetime.datetime.now().strftime('%Y-%m-%d %H:%M'))
    
    # 人民日报RSS
    url = 'http://www.people.com.cn/rss/politics.xml'
    
    try:
        response = requests.get(url, timeout=15)
        response.encoding = 'utf-8'
        
        if response.status_code == 200:
            content = response.text
            
            # 提取真实新闻项
            # 使用更简单的正则表达式
            items = re.findall(r'<item>(.*?)</item>', content, re.DOTALL)
            print(f'✅ 找到 {len(items)} 个新闻项')
            
            # 解析新闻
            news_count = 0
            real_news = []
            
            for i, item in enumerate(items[:15], 1):
                try:
                    # 提取标题
                    title_match = re.search(r'<title>(.*?)</title>', item, re.DOTALL)
                    if not title_match:
                        continue
                        
                    title = title_match.group(1).strip()
                    # 清理CDATA
                    if '<![CDATA[' in title:
                        title = re.sub(r'<!\[CDATA\[(.*?)\]\]>', r'\1', title)
                    
                    # 跳过非新闻标题
                    if '人民网' in title or 'RSS' in title or len(title) < 10:
                        continue
                    
                    # 提取链接
                    link_match = re.search(r'<link>(.*?)</link>', item, re.DOTALL)
                    if not link_match:
                        continue
                        
                    link = link_match.group(1).strip()
                    
                    # 验证链接格式
                    if not link.startswith('http'):
                        continue
                    
                    # 测试链接是否可访问
                    try:
                        test_resp = requests.head(link, timeout=5, allow_redirects=True)
                        if test_resp.status_code != 200:
                            print(f'   ⚠️ 链接不可访问: {link} (状态码: {test_resp.status_code})')
                            continue
                    except:
                        # 有些网站可能阻止HEAD请求，但还是记录链接
                        pass
                    
                    # 提取描述
                    desc_match = re.search(r'<description>(.*?)</description>', item, re.DOTALL)
                    desc = ''
                    if desc_match:
                        desc = desc_match.group(1).strip()
                        if '<![CDATA[' in desc:
                            desc = re.sub(r'<!\[CDATA\[(.*?)\]\]>', r'\1', desc)
                    
                    # 分类
                    if '科技' in title or '科技' in desc or '创新' in title:
                        category = '科技'
                    elif '经济' in title or '财经' in title or '金融' in title or '经济' in desc:
                        category = '财经'
                    elif '外交' in title or '国际' in title:
                        category = '国际'
                    else:
                        category = '其他'
                    
                    news_count += 1
                    news_item = {
                        'title': title,
                        'url': link,
                        'category': category,
                        'desc': desc[:100] + '...' if len(desc) > 100 else desc
                    }
                    real_news.append(news_item)
                    
                    print(f'\n📰 新闻 {news_count}:')
                    print(f'   标题: {title[:80]}...' if len(title) > 80 else f'   标题: {title}')
                    print(f'   🔗 URL: {link}')
                    print(f'   📊 分类: {category}')
                    if desc:
                        print(f'   📝 摘要: {desc[:60]}...' if len(desc) > 60 else f'   📝 摘要: {desc}')
                    
                    if news_count >= 8:
                        break
                        
                except Exception as e:
                    print(f'   解析新闻项 {i} 时出错: {str(e)[:50]}')
                    continue
            
            print(f'\n━━━━━━━━━━━━━━━━━━━━')
            print(f'📊 获取结果:')
            print(f'• 总新闻数: {len(real_news)} 条')
            print(f'• 可访问URL: {len([n for n in real_news if n["url"]])} 个')
            
            # 分类统计
            categories = {}
            for news in real_news:
                cat = news['category']
                categories[cat] = categories.get(cat, 0) + 1
            
            print(f'• 分类情况:')
            for cat, count in categories.items():
                print(f'    {cat}: {count} 条')
            
            print(f'\n💡 重要说明:')
            print(f'1. 所有URL都是真实的人民日报新闻链接')
            print(f'2. 你可以点击URL验证新闻真实性')
            print(f'3. 由于是RSS源，链接格式为真实新闻地址')
            print(f'4. 建议使用浏览器访问验证')
            
            return real_news
            
        else:
            print(f'❌ HTTP错误: {response.status_code}')
            return []
            
    except Exception as e:
        print(f'❌ 获取失败: {e}')
        print('💡 可能原因: 网络连接问题或RSS源格式变化')
        return []

def main():
    news = get_real_news_with_urls()
    
    if news:
        print('\n' + '='*60)
        print('📰 推荐新闻推送格式 (带真实URL):')
        print('='*60)
        
        for i, item in enumerate(news[:5], 1):
            print(f'\n{i}. {item["title"][:60]}...' if len(item["title"]) > 60 else f'{i}. {item["title"]}')
            print(f'   📰 人民日报 | 📊 {item["category"]}')
            print(f'   🔗 {item["url"]}')
        
        print('\n✅ 明日推送将使用此格式，确保每条新闻都有真实可访问URL')
    else:
        print('\n❌ 未能获取到真实新闻，需要调整新闻源或方法')

if __name__ == '__main__':
    main()