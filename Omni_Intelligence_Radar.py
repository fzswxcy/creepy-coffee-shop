#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Omni_Intelligence_Radar - 全渠道情报雷达
为OpenClaw打造的综合搜索与抓取API集成工具

API Key需求平台：
1. Tavily API: https://app.tavily.com/
2. Bing Search API (Azure Cognitive Services): https://portal.azure.com/#create/Microsoft.CognitiveServicesBingSearch-v7
3. SerpApi (备用): https://serpapi.com/
4. Firecrawl: https://firecrawl.dev/
5. Jina Reader: 无需API Key，直接调用公共端点

注意：RSSHub无需API Key，但需要构建正确的RSS URL
"""

import requests
import json
import time
import re
import sys
from typing import Dict, List, Optional, Tuple, Any
from urllib.parse import quote_plus
import logging
from datetime import datetime

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("Omni_Intelligence_Radar")

class OmniIntelligenceRadar:
    """全渠道情报雷达主类"""
    
    def __init__(self, config: Dict[str, str] = None):
        """
        初始化雷达系统
        
        参数:
            config: API Key配置字典，包含以下键:
                - tavily_api_key
                - bing_api_key (或 serpapi_api_key)
                - firecrawl_api_key
                - (可选) rsshub_base_url
        """
        self.config = config or {}
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json'
        })
        
        # API端点
        self.tavily_endpoint = "https://api.tavily.com/search"
        self.bing_endpoint = "https://api.bing.microsoft.com/v7.0/search"
        self.serpapi_endpoint = "https://serpapi.com/search"
        self.jina_endpoint = "https://r.jina.ai/"
        self.firecrawl_endpoint = "https://api.firecrawl.dev/v1/scrape"
        
        # RSSHub基础URL
        self.rsshub_base_url = self.config.get('rsshub_base_url', 'https://rsshub.app')
        
        logger.info("Omni_Intelligence_Radar 初始化完成")
    
    def search_with_tavily(self, query: str, max_results: int = 10, include_answer: bool = True) -> Dict[str, Any]:
        """
        使用Tavily API搜索AI和科技新闻
        
        参数:
            query: 搜索查询词
            max_results: 最大结果数（默认10）
            include_answer: 是否包含AI生成的答案（默认True）
            
        返回:
            结构化搜索结果字典
        """
        api_key = self.config.get('tavily_api_key')
        if not api_key:
            logger.error("Tavily API Key未配置")
            return {"error": "Tavily API Key未配置，请访问 https://app.tavily.com/ 申请"}
        
        try:
            params = {
                "api_key": api_key,
                "query": query,
                "max_results": max_results,
                "include_answer": include_answer,
                "search_depth": "advanced",
                "time_range": "month"  # 限制一个月内
            }
            
            response = self.session.post(self.tavily_endpoint, json=params, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            # 提取高价值URL
            urls = []
            if 'results' in result:
                urls = [item.get('url', '') for item in result.get('results', []) if item.get('url')]
            
            structured_result = {
                "success": True,
                "engine": "Tavily",
                "query": query,
                "answer": result.get('answer', ''),
                "results_count": len(result.get('results', [])),
                "urls": urls,
                "raw_results": result.get('results', []),
                "timestamp": datetime.now().isoformat()
            }
            
            logger.info(f"Tavily搜索完成: {query} -> {len(urls)}个URL")
            return structured_result
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Tavily搜索请求失败: {str(e)}")
            return {"error": f"Tavily API请求失败: {str(e)}", "success": False}
        except json.JSONDecodeError as e:
            logger.error(f"Tavily JSON解析失败: {str(e)}")
            return {"error": f"Tavily JSON解析失败: {str(e)}", "success": False}
        except Exception as e:
            logger.error(f"Tavily搜索未知错误: {str(e)}")
            return {"error": f"Tavily搜索未知错误: {str(e)}", "success": False}
    
    def search_with_bing(self, query: str, site_restrict: str = None, 
                        max_results: int = 10, market: str = "zh-CN") -> Dict[str, Any]:
        """
        使用Bing Search API搜索（支持site:语法）
        
        参数:
            query: 搜索查询词
            site_restrict: 网站限制，如 "site:volcengine.com" 或 "site:cloud.tencent.com"
            max_results: 最大结果数（默认10）
            market: 市场/语言代码（默认zh-CN）
            
        返回:
            结构化搜索结果字典
        """
        api_key = self.config.get('bing_api_key')
        if not api_key:
            # 如果没有Bing API Key，尝试使用SerpApi
            return self.search_with_serpapi(query, site_restrict, max_results)
        
        try:
            # 构造查询字符串
            if site_restrict:
                search_query = f"{query} {site_restrict}"
            else:
                search_query = query
            
            headers = {
                'Ocp-Apim-Subscription-Key': api_key,
            }
            
            params = {
                'q': search_query,
                'count': max_results,
                'mkt': market,
                'responseFilter': 'Webpages',
                'safeSearch': 'Strict'
            }
            
            response = self.session.get(self.bing_endpoint, headers=headers, params=params, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            # 提取高价值URL
            urls = []
            if 'webPages' in result and 'value' in result['webPages']:
                urls = [item.get('url', '') for item in result['webPages']['value'] if item.get('url')]
            
            structured_result = {
                "success": True,
                "engine": "Bing",
                "query": search_query,
                "results_count": len(urls),
                "urls": urls,
                "raw_results": result.get('webPages', {}).get('value', []),
                "timestamp": datetime.now().isoformat()
            }
            
            logger.info(f"Bing搜索完成: {search_query} -> {len(urls)}个URL")
            return structured_result
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Bing搜索请求失败: {str(e)}")
            # 降级到SerpApi
            return self.search_with_serpapi(query, site_restrict, max_results)
        except Exception as e:
            logger.error(f"Bing搜索未知错误: {str(e)}")
            return {"error": f"Bing搜索未知错误: {str(e)}", "success": False}
    
    def search_with_serpapi(self, query: str, site_restrict: str = None, 
                           max_results: int = 10) -> Dict[str, Any]:
        """
        使用SerpApi作为Bing搜索的备用方案
        
        参数:
            query: 搜索查询词
            site_restrict: 网站限制
            max_results: 最大结果数
            
        返回:
            结构化搜索结果字典
        """
        api_key = self.config.get('serpapi_api_key')
        if not api_key:
            logger.error("SerpApi API Key未配置")
            return {"error": "Bing和SerpApi API Key均未配置", "success": False}
        
        try:
            # 构造查询字符串
            if site_restrict:
                search_query = f"{query} {site_restrict}"
            else:
                search_query = query
            
            params = {
                'engine': 'bing',
                'q': search_query,
                'api_key': api_key,
                'count': max_results,
                'setLang': 'zh-cn'
            }
            
            response = self.session.get(self.serpapi_endpoint, params=params, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            # 提取高价值URL
            urls = []
            if 'organic_results' in result:
                urls = [item.get('link', '') for item in result.get('organic_results', []) if item.get('link')]
            
            structured_result = {
                "success": True,
                "engine": "SerpApi(Bing)",
                "query": search_query,
                "results_count": len(urls),
                "urls": urls,
                "raw_results": result.get('organic_results', []),
                "timestamp": datetime.now().isoformat()
            }
            
            logger.info(f"SerpApi搜索完成: {search_query} -> {len(urls)}个URL")
            return structured_result
            
        except Exception as e:
            logger.error(f"SerpApi搜索失败: {str(e)}")
            return {"error": f"SerpApi搜索失败: {str(e)}", "success": False}
    
    def fetch_rsshub_feed(self, rss_url: str, max_items: int = 20) -> Dict[str, Any]:
        """
        解析RSS源（支持RSSHub格式）
        
        参数:
            rss_url: RSS URL，可以是完整URL或RSSHub路径
            max_items: 最大项目数
            
        返回:
            RSS内容结构化字典
        """
        try:
            # 如果是相对路径，拼接基础URL
            if not rss_url.startswith(('http://', 'https://')):
                rss_url = f"{self.rsshub_base_url}/{rss_url.lstrip('/')}"
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/xml, application/rss+xml, text/xml'
            }
            
            response = self.session.get(rss_url, headers=headers, timeout=30)
            response.raise_for_status()
            
            # 简单的XML解析（实际使用中建议使用feedparser库）
            content = response.text
            
            # 提取URL
            urls = []
            url_patterns = [
                r'<link[^>]*>([^<]+)</link>',
                r'<link[^>]*href=["\']([^"\']+)["\']',
                r'<guid[^>]*>([^<]+)</guid>'
            ]
            
            for pattern in url_patterns:
                matches = re.findall(pattern, content, re.IGNORECASE)
                for match in matches:
                    if match.startswith(('http://', 'https://')):
                        urls.append(match)
                        if len(urls) >= max_items:
                            break
            
            structured_result = {
                "success": True,
                "source": "RSSHub",
                "rss_url": rss_url,
                "items_count": len(urls),
                "urls": urls[:max_items],
                "raw_content": content[:5000] + "..." if len(content) > 5000 else content,
                "timestamp": datetime.now().isoformat()
            }
            
            logger.info(f"RSSHub获取完成: {rss_url} -> {len(urls)}个URL")
            return structured_result
            
        except Exception as e:
            logger.error(f"RSSHub获取失败: {str(e)}")
            return {"error": f"RSSHub获取失败: {str(e)}", "success": False}
    
    def read_with_jina(self, url: str, timeout: int = 60) -> Dict[str, Any]:
        """
        使用Jina Reader API读取网页内容
        
        参数:
            url: 目标URL
            timeout: 超时时间（秒）
            
        返回:
            结构化内容字典
        """
        try:
            # Jina Reader API调用
            jina_url = f"{self.jina_endpoint}{quote_plus(url)}"
            
            headers = {
                'Accept': 'text/markdown, text/plain, application/json',
                'User-Agent': 'OmniIntelligenceRadar/1.0'
            }
            
            response = self.session.get(jina_url, headers=headers, timeout=timeout)
            response.raise_for_status()
            
            content = response.text
            
            # 分析内容
            content_length = len(content)
            line_count = content.count('\n') + 1
            has_tables = "|--" in content or "|-" in content
            has_code = "```" in content
            
            structured_result = {
                "success": True,
                "engine": "Jina Reader",
                "url": url,
                "content_length": content_length,
                "line_count": line_count,
                "has_tables": has_tables,
                "has_code": has_code,
                "content": content[:10000] + "..." if content_length > 10000 else content,
                "truncated": content_length > 10000,
                "timestamp": datetime.now().isoformat()
            }
            
            logger.info(f"Jina Reader读取完成: {url} -> {content_length}字符")
            return structured_result
            
        except Exception as e:
            logger.error(f"Jina Reader读取失败: {str(e)}")
            return {"error": f"Jina Reader读取失败: {str(e)}", "success": False}
    
    def scrape_with_firecrawl(self, url: str, timeout: int = 60) -> Dict[str, Any]:
        """
        使用Firecrawl API抓取动态渲染页面
        
        参数:
            url: 目标URL
            timeout: 超时时间（秒）
            
        返回:
            结构化内容字典
        """
        api_key = self.config.get('firecrawl_api_key')
        if not api_key:
            logger.error("Firecrawl API Key未配置")
            return {"error": "Firecrawl API Key未配置，请访问 https://firecrawl.dev/ 申请"}
        
        try:
            headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                "url": url,
                "formats": ["markdown", "html"],
                "timeout": timeout * 1000,  # 转换为毫秒
                "pageOptions": {
                    "waitFor": 3000,  # 等待JavaScript渲染
                    "screenshot": False
                }
            }
            
            response = self.session.post(self.firecrawl_endpoint, headers=headers, 
                                        json=payload, timeout=timeout + 10)
            response.raise_for_status()
            
            result = response.json()
            
            if result.get('success'):
                content = result.get('data', {}).get('markdown', '')
                metadata = result.get('data', {}).get('metadata', {})
                
                structured_result = {
                    "success": True,
                    "engine": "Firecrawl",
                    "url": url,
                    "content_length": len(content),
                    "content": content[:10000] + "..." if len(content) > 10000 else content,
                    "truncated": len(content) > 10000,
                    "metadata": metadata,
                    "timestamp": datetime.now().isoformat()
                }
                
                logger.info(f"Firecrawl抓取完成: {url} -> {len(content)}字符")
                return structured_result
            else:
                logger.error(f"Firecrawl抓取失败: {result.get('error', '未知错误')}")
                return {"error": result.get('error', 'Firecrawl抓取失败'), "success": False}
                
        except Exception as e:
            logger.error(f"Firecrawl抓取失败: {str(e)}")
            return {"error": f"Firecrawl抓取失败: {str(e)}", "success": False}
    
    def gather_vendor_intelligence(self, keyword: str, vendor: str = None,
                                 max_urls: int = 10, timeout_per_url: int = 30) -> Dict[str, Any]:
        """
        主控函数：收集厂商情报
        
        参数:
            keyword: 关键词
            vendor: 厂商名称（用于site限制），如 "volcengine", "tencent", "baidu"
            max_urls: 最大URL数量
            timeout_per_url: 每个URL的超时时间
            
        返回:
            完整的情报收集结果
        """
        logger.info(f"开始收集情报: keyword={keyword}, vendor={vendor}")
        
        start_time = time.time()
        results = {
            "success": True,
            "query": {
                "keyword": keyword,
                "vendor": vendor,
                "timestamp": datetime.now().isoformat()
            },
            "search_phase": {},
            "extraction_phase": {},
            "analysis": {},
            "summary": {},
            "execution_time": 0
        }
        
        try:
            # 阶段1: 搜索
            search_results = []
            
            # 使用Tavily搜索
            tavily_result = self.search_with_tavily(f"{keyword} {vendor if vendor else ''}")
            if tavily_result.get('success'):
                search_results.append(tavily_result)
                results['search_phase']['tavily'] = tavily_result
            
            # 使用Bing搜索（如果指定厂商）
            if vendor:
                # 映射厂商到域名
                vendor_domains = {
                    "volcengine": "volcengine.com",
                    "tencent": "cloud.tencent.com",
                    "baidu": "cloud.baidu.com",
                    "aliyun": "aliyun.com",
                    "huawei": "huaweicloud.com"
                }
                
                domain = vendor_domains.get(vendor.lower())
                if domain:
                    site_restrict = f"site:{domain}"
                    bing_result = self.search_with_bing(keyword, site_restrict)
                    if bing_result.get('success'):
                        search_results.append(bing_result)
                        results['search_phase']['bing'] = bing_result
            
            # 收集所有URL
            all_urls = []
            for search_result in search_results:
                if search_result.get('success'):
                    urls = search_result.get('urls', [])
                    all_urls.extend(urls)
            
            # 去重
            all_urls = list(set(all_urls))[:max_urls]
            
            # 阶段2: 内容提取
            extracted_contents = []
            
            for i, url in enumerate(all_urls):
                logger.info(f"提取内容 [{i+1}/{len(all_urls)}]: {url}")
                
                # 尝试使用Jina Reader
                jina_result = self.read_with_jina(url, timeout=timeout_per_url)
                
                if jina_result.get('success'):
                    extracted_contents.append({
                        "url": url,
                        "engine": "Jina",
                        "content": jina_result.get('content', ''),
                        "length": jina_result.get('content_length', 0),
                        "metadata": {
                            "has_tables": jina_result.get('has_tables', False),
                            "has_code": jina_result.get('has_code', False)
                        }
                    })
                else:
                    # 如果Jina失败，尝试Firecrawl
                    logger.warning(f"Jina提取失败，尝试Firecrawl: {url}")
                    firecrawl_result = self.scrape_with_firecrawl(url, timeout=timeout_per_url)
                    
                    if firecrawl_result.get('success'):
                        extracted_contents.append({
                            "url": url,
                            "engine": "Firecrawl",
                            "content": firecrawl_result.get('content', ''),
                            "length": firecrawl_result.get('content_length', 0),
                            "metadata": firecrawl_result.get('metadata', {})
                        })
                    else:
                        logger.error(f"所有提取方法都失败: {url}")
                        extracted_contents.append({
                            "url": url,
                            "engine": "Failed",
                            "content": "",
                            "length": 0,
                            "error": "所有提取方法都失败"
                        })
                
                # 礼貌性延迟
                time.sleep(1)
            
            results['extraction_phase']['urls_processed'] = len(all_urls)
            results['extraction_phase']['successful_extractions'] = len([c for c in extracted_contents if c['content']])
            results['extraction_phase']['contents'] = extracted_contents
            
            # 阶段3: 简单分析
            total_content_length = sum(c['length'] for c in extracted_contents if c['content'])
            avg_content_length = total_content_length / max(1, len([c for c in extracted_contents if c['content']]))
            
            # 提取高频词
            if extracted_contents:
                all_text = ' '.join([c['content'][:1000] for c in extracted_contents if c['content']])
                words = re.findall(r'\b[a-zA-Z]{3,}\b', all_text.lower())
                word_counts = {}
                for word in words:
                    if word not in ['the', 'and', 'for', 'with', 'this', 'that', 'from']:
                        word_counts[word] = word_counts.get(word, 0) + 1
                
                # 取前10高频词
                top_words = sorted(word_counts.items(), key=lambda x: x[1], reverse=True)[:10]
            else:
                top_words = []
            
            results['analysis'] = {
                "total_content_length": total_content_length,
                "average_content_length": avg_content_length,
                "top_keywords": [{"word": w, "count": c} for w, c in top_words],
                "sources_analyzed": len([c for c in extracted_contents if c['content']])
            }
            
            # 总结
            results['summary'] = {
                "total_urls_found": len(all_urls),
                "successfully_extracted": len([c for c in extracted_contents if c['content']]),
                "primary_engines_used": list(set([c.get('engine', 'Unknown') for c in extracted_contents])),
                "recommendation": self._generate_recommendation(results)
            }
            
            execution_time = time.time() - start_time
            results['execution_time'] = round(execution_time, 2)
            
            logger.info(f"情报收集完成: {execution_time:.2f}秒, {len(all_urls)}个URL")
            return results
            
        except Exception as e:
            logger.error(f"情报收集过程失败: {str(e)}")
            results['success'] = False
            results['error'] = str(e)
            results['execution_time'] = time.time() - start_time
            return results
    
    def _generate_recommendation(self, results: Dict[str, Any]) -> str:
        """根据分析结果生成建议"""
        extracted_count = results['extraction_phase'].get('successful_extractions', 0)
        total_urls = results['summary'].get('total_urls_found', 0)
        
        if extracted_count == 0:
            return "未能成功提取任何内容，请检查API配置和网络连接"
        elif extracted_count < 3:
            return "提取的内容较少，建议扩展搜索关键词或增加搜索深度"
        elif extracted_count >= 5:
            return f"成功提取了{extracted_count}个高质量文档，建议进行深度分析和总结"
        else:
            return f"收集到{extracted_count}/{total_urls}个文档，内容质量中等，可进一步优化搜索策略"
    
    def save_results(self, results: Dict[str, Any], filename: str = None) -> str:
        """保存结果到文件"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"intelligence_report_{timestamp}.json"
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(results, f, ensure_ascii=False, indent=2)
            
            logger.info(f"结果已保存到: {filename}")
            return filename
        except Exception as e:
            logger.error(f"保存结果失败: {str(e)}")
            return f"保存失败: {str(e)}"


# 示例使用函数
def main():
    """示例主函数"""
    # 配置API Keys（请在此处填入实际API Key）
    config = {
        "tavily_api_key": "YOUR_TAVILY_API_KEY",
        "bing_api_key": "YOUR_BING_API_KEY",
        "firecrawl_api_key": "YOUR_FIRECRAWL_API_KEY",
        "serpapi_api_key": "YOUR_SERPAPI_API_KEY",
        "rsshub_base_url": "https://rsshub.app"
    }
    
    # 创建雷达实例
    radar = OmniIntelligenceRadar(config)
    
    # 示例1: 搜索火山引擎的OpenClaw相关信息
    print("示例1: 搜索火山引擎的OpenClaw相关信息")
    result = radar.gather_vendor_intelligence("OpenClaw", "volcengine")
    
    if result.get('success'):
        print(f"搜索完成: 找到{result['summary']['total_urls_found']}个URL")
        print(f"成功提取: {result['summary']['successfully_extracted']}个文档")
        print(f"执行时间: {result['execution_time']}秒")
        
        # 保存结果
        filename = radar.save_results(result)
        print(f"结果已保存到: {filename}")
    else:
        print(f"搜索失败: {result.get('error', '未知错误')}")
    
    # 示例2: 单独测试各个模块
    print("\n示例2: 单独测试Tavily搜索")
    tavily_result = radar.search_with_tavily("AI news 2025")
    print(f"Tavily搜索结果: {tavily_result.get('results_count', 0)}个结果")
    
    print("\n示例3: 测试Jina Reader")
    jina_result = radar.read_with_jina("https://example.com")
    print(f"Jina Reader结果: {jina_result.get('content_length', 0)}字符")


if __name__ == "__main__":
    main()