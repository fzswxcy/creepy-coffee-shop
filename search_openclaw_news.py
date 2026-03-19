#!/usr/bin/env python3
import requests
import json
import re
from datetime import datetime
import time
import subprocess
from urllib.parse import quote
import sys

def search_baidu(query):
    """搜索百度新闻"""
    try:
        # 构建百度搜索URL
        encoded_query = quote(query)
        url = f"https://www.baidu.com/s?wd={encoded_query}&tn=news"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate',
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            return parse_baidu_results(response.text, query)
        else:
            return f"百度搜索失败: {response.status_code}"
            
    except Exception as e:
        return f"百度搜索异常: {str(e)}"

def parse_baidu_results(html, query):
    """解析百度搜索结果"""
    results = []
    
    # 尝试提取新闻结果
    pattern = r'<h3 class="news-title_1YtI1">.*?<a[^>]*href="([^"]+)"[^>]*>(.*?)</a>'
    matches = re.findall(pattern, html, re.DOTALL)
    
    for url, title_html in matches[:5]:  # 取前5个结果
        # 清理标题
        title = re.sub(r'<[^>]+>', '', title_html).strip()
        
        # 尝试提取来源和时间
        source_time_pattern = r'<span class="news-source_[^"]+">([^<]+)</span>.*?<span class="news-time_[^"]+">([^<]+)</span>'
        source_match = re.search(source_time_pattern, html)
        
        source = "未知来源"
        publish_time = "未知时间"
        
        if source_match:
            source = source_match.group(1).strip()
            publish_time = source_match.group(2).strip()
        
        results.append({
            'title': title,
            'url': url,
            'source': source,
            'publish_time': publish_time,
            'search_engine': '百度',
            'query': query
        })
    
    return results if results else "百度未找到相关新闻"

def search_google_via_curl(query):
    """使用curl模拟Google搜索"""
    try:
        encoded_query = quote(query)
        url = f"https://www.google.com/search?q={encoded_query}&tbm=nws"
        
        cmd = [
            'curl', '-s', '-H',
            'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            url
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        
        if result.returncode == 0:
            return parse_google_results(result.stdout, query)
        else:
            return f"Google搜索失败: {result.returncode}"
            
    except Exception as e:
        return f"Google搜索异常: {str(e)}"

def parse_google_results(html, query):
    """解析Google新闻搜索结果"""
    results = []
    
    # Google搜索结果模式
    pattern = r'<div[^>]*class="SoaBEf"[^>]*>.*?<a[^>]*href="([^"]+)"[^>]*>(.*?)</a>.*?<span[^>]*class="MgUUmf"[^>]*>([^<]+)</span>.*?<span[^>]*class="LfK94d"[^>]*>([^<]+)</span>'
    matches = re.findall(pattern, html, re.DOTALL)
    
    for url, title, source, time_ago in matches[:5]:  # 取前5个结果
        # 清理标题
        title = re.sub(r'<[^>]+>', '', title).strip()
        
        results.append({
            'title': title,
            'url': url,
            'source': source.strip(),
            'publish_time': time_ago.strip(),
            'search_engine': 'Google',
            'query': query
        })
    
    return results if results else "Google未找到相关新闻"

def search_tech_forums(query):
    """搜索技术论坛"""
    try:
        # 搜索CSDN
        encoded_query = quote(query)
        csdn_url = f"https://so.csdn.net/so/search?q={encoded_query}&t=blog&u="
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
        
        response = requests.get(csdn_url, headers=headers, timeout=10)
        
        forum_results = []
        
        if response.status_code == 200:
            # 解析CSDN结果
            csdn_pattern = r'<div class="title-box.*?<a[^>]*href="([^"]+)"[^>]*>(.*?)</a>.*?<span class="date">([^<]+)</span>'
            csdn_matches = re.findall(csdn_pattern, response.text, re.DOTALL)
            
            for url, title, date in csdn_matches[:3]:
                forum_results.append({
                    'title': re.sub(r'<[^>]+>', '', title).strip(),
                    'url': f"https://blog.csdn.net{url}" if url.startswith('/') else url,
                    'source': 'CSDN',
                    'publish_time': date.strip(),
                    'search_engine': 'CSDN',
                    'query': query
                })
        
        # 搜索知乎
        zhihu_url = f"https://www.zhihu.com/search?type=content&q={encoded_query}"
        zhihu_response = requests.get(zhihu_url, headers=headers, timeout=10)
        
        if zhihu_response.status_code == 200:
            zhihu_pattern = r'<h2 class="ContentItem-title.*?<a[^>]*href="([^"]+)"[^>]*>(.*?)</a>'
            zhihu_matches = re.findall(zhihu_pattern, zhihu_response.text, re.DOTALL)
            
            for url, title in zhihu_matches[:2]:
                if 'zhihu.com' not in url:
                    url = f"https://www.zhihu.com{url}"
                
                forum_results.append({
                    'title': re.sub(r'<[^>]+>', '', title).strip(),
                    'url': url,
                    'source': '知乎',
                    'publish_time': '未知时间',
                    'search_engine': '知乎',
                    'query': query
                })
        
        return forum_results if forum_results else "技术论坛未找到相关内容"
        
    except Exception as e:
        return f"论坛搜索异常: {str(e)}"

def search_with_wget(query):
    """使用wget进行补充搜索"""
    try:
        encoded_query = quote(query)
        url = f"https://www.bing.com/news/search?q={encoded_query}"
        
        cmd = [
            'wget', '-q', '-O-', '-U',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            url
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        
        if result.returncode == 0:
            return parse_bing_results(result.stdout, query)
        else:
            return f"Bing搜索失败: {result.returncode}"
            
    except Exception as e:
        return f"Wget搜索异常: {str(e)}"

def parse_bing_results(html, query):
    """解析Bing新闻结果"""
    results = []
    
    # Bing新闻结果模式
    pattern = r'<a[^>]*class="title"[^>]*href="([^"]+)"[^>]*>(.*?)</a>.*?<div class="source">([^<]+)</div>.*?<span class="time">([^<]+)</span>'
    matches = re.findall(pattern, html, re.DOTALL)
    
    for url, title, source, time_info in matches[:3]:  # 取前3个结果
        results.append({
            'title': re.sub(r'<[^>]+>', '', title).strip(),
            'url': url,
            'source': source.strip(),
            'publish_time': time_info.strip(),
            'search_engine': 'Bing',
            'query': query
        })
    
    return results if results else "Bing未找到相关新闻"

def main():
    print("开始搜索OpenClaw相关新闻...")
    print("=" * 80)
    
    companies = [
        ("腾讯", "腾讯 openclaw"),
        ("阿里", "阿里 openclaw OR 阿里巴巴 openclaw"),
        ("百度", "百度 openclaw"),
        ("华为", "华为 openclaw OR huawei openclaw"),
        ("字节跳动", "字节跳动 openclaw OR bytedance openclaw")
    ]
    
    all_results = {}
    
    for company, query in companies:
        print(f"\n搜索: {company} ({query})")
        print("-" * 60)
        
        company_results = {
            'company': company,
            'query': query,
            'searches': {}
        }
        
        # 1. 百度搜索
        print("1. 百度搜索中...")
        baidu_results = search_baidu(query)
        company_results['searches']['百度'] = baidu_results
        time.sleep(2)  # 避免请求过快
        
        # 2. Google搜索
        print("2. Google搜索中...")
        google_results = search_google_via_curl(query)
        company_results['searches']['Google'] = google_results
        time.sleep(2)
        
        # 3. 技术论坛搜索
        print("3. 技术论坛搜索中...")
        forum_results = search_tech_forums(query)
        company_results['searches']['技术论坛'] = forum_results
        time.sleep(2)
        
        # 4. 使用wget搜索Bing
        print("4. Bing搜索中...")
        bing_results = search_with_wget(query)
        company_results['searches']['Bing'] = bing_results
        time.sleep(2)
        
        all_results[company] = company_results
    
    # 保存结果到文件
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = f"openclaw_news_search_{timestamp}.json"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
    
    print(f"\n搜索结果已保存到: {output_file}")
    
    # 生成报告
    generate_report(all_results, timestamp)

def generate_report(results, timestamp):
    """生成文本报告"""
    report_file = f"openclaw_news_report_{timestamp}.txt"
    
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write("=" * 80 + "\n")
        f.write("OpenClaw与中国科技公司相关新闻搜索报告\n")
        f.write(f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("=" * 80 + "\n\n")
        
        total_found = 0
        
        for company, company_data in results.items():
            f.write(f"\n{'='*60}\n")
            f.write(f"公司: {company}\n")
            f.write(f"搜索词: {company_data['query']}\n")
            f.write(f"{'='*60}\n\n")
            
            for search_engine, search_results in company_data['searches'].items():
                f.write(f"【{search_engine}】搜索结果:\n")
                
                if isinstance(search_results, list):
                    for i, result in enumerate(search_results, 1):
                        f.write(f"{i}. 标题: {result['title']}\n")
                        f.write(f"   来源: {result['source']}\n")
                        f.write(f"   时间: {result['publish_time']}\n")
                        f.write(f"   链接: {result['url']}\n")
                        f.write(f"   搜索引擎: {result['search_engine']}\n")
                        f.write("-" * 40 + "\n")
                        total_found += 1
                else:
                    f.write(f"   {search_results}\n")
                
                f.write("\n")
        
        f.write("\n" + "=" * 80 + "\n")
        f.write("搜索总结\n")
        f.write("=" * 80 + "\n")
        f.write(f"总计搜索公司: {len(results)} 家\n")
        f.write(f"总计找到结果: {total_found} 条\n")
        f.write(f"搜索时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        # 分析结论
        f.write("\n分析结论:\n")
        f.write("1. 通过多个搜索引擎和技术论坛进行综合搜索\n")
        f.write("2. 搜索结果包含标题、来源、发布时间和链接\n")
        f.write("3. 使用真实网络请求，确保数据准确性\n")
        f.write("4. 包含百度、Google、CSDN、知乎、Bing等多个平台\n")
    
    print(f"报告已生成: {report_file}")
    
    # 同时生成简短的命令行摘要
    print("\n" + "=" * 80)
    print("搜索完成！以下是简要摘要:")
    print("=" * 80)
    
    for company, company_data in results.items():
        print(f"\n{company}:")
        found_count = 0
        for search_engine, search_results in company_data['searches'].items():
            if isinstance(search_results, list):
                found_count += len(search_results)
        
        if found_count > 0:
            print(f"  找到 {found_count} 条相关新闻")
        else:
            print(f"  未找到相关新闻")

if __name__ == "__main__":
    main()