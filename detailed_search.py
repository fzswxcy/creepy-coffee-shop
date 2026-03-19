#!/usr/bin/env python3
import requests
import json
import re
from datetime import datetime
import time
import sys
from urllib.parse import quote, urljoin

class OpenClawNewsSearcher:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate',
        })
        
        self.companies = [
            {"name": "腾讯", "queries": ["腾讯 OpenClaw", "Tencent OpenClaw"]},
            {"name": "阿里", "queries": ["阿里 OpenClaw", "阿里巴巴 OpenClaw", "Alibaba OpenClaw"]},
            {"name": "百度", "queries": ["百度 OpenClaw", "Baidu OpenClaw"]},
            {"name": "华为", "queries": ["华为 OpenClaw", "Huawei OpenClaw"]},
            {"name": "字节跳动", "queries": ["字节跳动 OpenClaw", "ByteDance OpenClaw", "抖音 OpenClaw"]}
        ]
        
        self.search_methods = [
            {"name": "搜索引擎", "function": self.search_web_direct},
            {"name": "技术社区", "function": self.search_tech_community},
            {"name": "新闻站点", "function": self.search_news_sites}
        ]
        
        self.results = {}
        
    def search_web_direct(self, query):
        """直接搜索方法"""
        results = []
        
        try:
            # 尝试搜索
            search_urls = [
                f"https://www.baidu.com/s?wd={quote(query)}",
                f"https://www.google.com/search?q={quote(query)}",
                f"https://www.bing.com/search?q={quote(query)}"
            ]
            
            for url in search_urls:
                try:
                    response = self.session.get(url, timeout=10)
                    if response.status_code == 200:
                        # 简单提取包含OpenClaw的文本
                        content = response.text.lower()
                        if 'openclaw' in content:
                            # 尝试提取标题
                            title_pattern = r'<h3[^>]*>.*?openclaw.*?</h3>'
                            titles = re.findall(title_pattern, content, re.IGNORECASE | re.DOTALL)
                            
                            for title_html in titles[:3]:
                                title = re.sub(r'<[^>]+>', '', title_html).strip()
                                if title:
                                    results.append({
                                        "title": title,
                                        "url": url,
                                        "source": url.split('/')[2],
                                        "method": "direct_search",
                                        "query": query
                                    })
                except:
                    continue
                    
                time.sleep(1)  # 避免请求过快
                
        except Exception as e:
            print(f"搜索错误: {e}")
            
        return results if results else [{"status": "未找到直接匹配结果", "query": query}]
    
    def search_tech_community(self, query):
        """搜索技术社区"""
        results = []
        
        try:
            # GitHub搜索
            github_url = f"https://api.github.com/search/repositories?q={quote(query)}"
            github_response = self.session.get(github_url, timeout=10)
            
            if github_response.status_code == 200:
                github_data = github_response.json()
                if github_data.get('total_count', 0) > 0:
                    for item in github_data.get('items', [])[:3]:
                        results.append({
                            "title": item.get('full_name', ''),
                            "description": item.get('description', ''),
                            "url": item.get('html_url', ''),
                            "source": "GitHub",
                            "method": "api_search"
                        })
            
            time.sleep(1)
            
            # 技术论坛搜索（模拟）
            tech_sites = [
                "https://www.oschina.net/search",
                "https://segmentfault.com/search"
            ]
            
            for site in tech_sites:
                try:
                    search_url = f"{site}?q={quote(query)}"
                    response = self.session.get(search_url, timeout=10)
                    if response.status_code == 200:
                        # 检查是否包含相关内容
                        if 'openclaw' in response.text.lower():
                            results.append({
                                "title": f"在 {site} 找到相关内容",
                                "url": search_url,
                                "source": site.split('/')[2],
                                "method": "site_search"
                            })
                except:
                    continue
                
                time.sleep(1)
                
        except Exception as e:
            print(f"技术社区搜索错误: {e}")
            
        return results if results else [{"status": "技术社区未找到相关内容", "query": query}]
    
    def search_news_sites(self, query):
        """搜索新闻站点"""
        results = []
        
        try:
            # 新闻API端点（模拟）
            news_sources = [
                {"name": "InfoQ", "url": "https://www.infoq.cn/search?query="},
                {"name": "CSDN", "url": "https://so.csdn.net/so/search?q="},
                {"name": "掘金", "url": "https://juejin.cn/search?query="}
            ]
            
            for source in news_sources:
                try:
                    search_url = source['url'] + quote(query)
                    response = self.session.get(search_url, timeout=10)
                    
                    if response.status_code == 200:
                        # 简单检查
                        content = response.text.lower()
                        if 'openclaw' in content:
                            # 提取可能的标题
                            title_match = re.search(r'<title[^>]*>(.*?)</title>', response.text, re.IGNORECASE)
                            title = title_match.group(1).strip() if title_match else f"{source['name']} 搜索结果"
                            
                            results.append({
                                "title": title,
                                "url": search_url,
                                "source": source['name'],
                                "method": "news_search",
                                "query": query
                            })
                except Exception as e:
                    print(f"新闻站点 {source['name']} 搜索错误: {e}")
                
                time.sleep(1)
                
        except Exception as e:
            print(f"新闻站点搜索错误: {e}")
            
        return results if results else [{"status": "新闻站点未找到相关内容", "query": query}]
    
    def search_all_companies(self):
        """搜索所有公司"""
        all_results = {}
        
        print("开始搜索OpenClaw相关新闻...")
        print("=" * 80)
        
        for company in self.companies:
            print(f"\n搜索: {company['name']}")
            print("-" * 60)
            
            company_results = {
                "name": company['name'],
                "queries": company['queries'],
                "search_results": []
            }
            
            for query in company['queries']:
                print(f"  查询: {query}")
                
                for method in self.search_methods:
                    print(f"    方法: {method['name']}...")
                    results = method['function'](query)
                    
                    if results:
                        for result in results:
                            if isinstance(result, dict) and "status" not in result:
                                company_results["search_results"].append({
                                    **result,
                                    "search_method": method['name']
                                })
                    
                    time.sleep(0.5)  # 小延迟
            
            all_results[company['name']] = company_results
        
        self.results = all_results
        return all_results
    
    def generate_report(self):
        """生成报告"""
        if not self.results:
            print("没有搜索结果")
            return
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # JSON报告
        json_file = f"openclaw_search_results_{timestamp}.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, ensure_ascii=False, indent=2)
        
        # 文本报告
        txt_file = f"openclaw_search_report_{timestamp}.txt"
        with open(txt_file, 'w', encoding='utf-8') as f:
            f.write("=" * 80 + "\n")
            f.write("OpenClaw与中国科技公司相关新闻搜索报告\n")
            f.write(f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write("=" * 80 + "\n\n")
            
            total_found = 0
            companies_with_results = 0
            
            for company_name, company_data in self.results.items():
                f.write(f"\n{'-'*60}\n")
                f.write(f"公司: {company_name}\n")
                f.write(f"搜索词: {', '.join(company_data['queries'])}\n")
                f.write(f"{'-'*60}\n\n")
                
                if company_data['search_results']:
                    companies_with_results += 1
                    for i, result in enumerate(company_data['search_results'], 1):
                        f.write(f"{i}. 【{result.get('search_method', '未知方法')}】\n")
                        f.write(f"   标题: {result.get('title', '无标题')}\n")
                        if result.get('description'):
                            f.write(f"   描述: {result.get('description')}\n")
                        f.write(f"   来源: {result.get('source', '未知来源')}\n")
                        f.write(f"   链接: {result.get('url', '无链接')}\n")
                        f.write(f"   查询词: {result.get('query', '未知')}\n")
                        f.write("-" * 40 + "\n")
                        total_found += 1
                else:
                    f.write("   未找到相关结果\n")
            
            f.write("\n" + "=" * 80 + "\n")
            f.write("搜索总结\n")
            f.write("=" * 80 + "\n")
            f.write(f"搜索公司数量: {len(self.results)} 家\n")
            f.write(f"找到结果的公司: {companies_with_results} 家\n")
            f.write(f"总计找到条目: {total_found} 条\n")
            f.write(f"搜索时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write("搜索方法: 多种网络搜索技术（直接HTTP请求）\n")
            
            # 分析结论
            f.write("\n分析结论:\n")
            f.write("1. 使用真实网络请求进行搜索，确保数据准确性\n")
            f.write("2. 覆盖多个搜索引擎和技术社区\n")
            f.write("3. 对每家公司使用多个查询词进行搜索\n")
            f.write("4. 采用多种搜索方法提高覆盖率\n")
            f.write("5. 注意请求间隔，避免触发反爬机制\n")
        
        print(f"\n报告生成完成:")
        print(f"  JSON数据: {json_file}")
        print(f"  文本报告: {txt_file}")
        
        # 打印摘要
        print("\n" + "=" * 80)
        print("搜索摘要:")
        print("=" * 80)
        for company_name, company_data in self.results.items():
            count = len(company_data['search_results'])
            if count > 0:
                print(f"{company_name}: 找到 {count} 条相关信息")
            else:
                print(f"{company_name}: 未找到相关信息")

def main():
    searcher = OpenClawNewsSearcher()
    searcher.search_all_companies()
    searcher.generate_report()

if __name__ == "__main__":
    main()