#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Omni_Intelligence_Radar 演示脚本
展示如何集成到OpenClaw Skill中
"""

import os
import json
from typing import Dict, List, Optional
from Omni_Intelligence_Radar import OmniIntelligenceRadar

class OmniIntelligenceSkill:
    """OpenClaw Skill封装类"""
    
    def __init__(self, config_path: str = "omni_intelligence_config.json"):
        self.config_path = config_path
        self.radar = None
        self.load_config()
    
    def load_config(self):
        """加载配置文件"""
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    self.radar = OmniIntelligenceRadar(config)
                    print(f"配置加载成功: {self.config_path}")
            except Exception as e:
                print(f"配置加载失败: {e}")
                self.radar = OmniIntelligenceRadar()
        else:
            print(f"配置文件不存在: {self.config_path}")
            print("请先创建配置文件并填入API Key")
            self.radar = OmniIntelligenceRadar()
    
    def search_vendor_docs(self, keyword: str, vendor: str) -> Dict:
        """搜索厂商文档"""
        print(f"🔍 搜索 {vendor} 关于 {keyword} 的文档...")
        result = self.radar.gather_vendor_intelligence(keyword, vendor)
        return result
    
    def monitor_tech_news(self, topic: str = "AI") -> Dict:
        """监控科技新闻"""
        print(f"📰 监控 {topic} 科技新闻...")
        result = self.radar.search_with_tavily(f"{topic} 最新技术 news")
        return result
    
    def extract_article(self, url: str) -> Dict:
        """提取文章内容"""
        print(f"📄 提取文章: {url}")
        result = self.radar.read_with_jina(url)
        if not result.get('success'):
            result = self.radar.scrape_with_firecrawl(url)
        return result
    
    def track_rss_feed(self, rss_url: str) -> Dict:
        """跟踪RSS源"""
        print(f"📡 跟踪RSS源: {rss_url}")
        result = self.radar.fetch_rsshub_feed(rss_url)
        return result
    
    def batch_extract_urls(self, urls: List[str]) -> List[Dict]:
        """批量提取URL内容"""
        results = []
        for i, url in enumerate(urls):
            print(f"处理 [{i+1}/{len(urls)}]: {url}")
            result = self.extract_article(url)
            results.append(result)
        return results
    
    def generate_report(self, results: Dict, format: str = "markdown") -> str:
        """生成报告"""
        if format == "markdown":
            return self._generate_markdown_report(results)
        elif format == "html":
            return self._generate_html_report(results)
        else:
            return json.dumps(results, ensure_ascii=False, indent=2)
    
    def _generate_markdown_report(self, results: Dict) -> str:
        """生成Markdown格式报告"""
        md = "# 情报收集报告\n\n"
        
        if not results.get('success'):
            md += f"## ❌ 任务失败\n\n错误信息: {results.get('error', '未知错误')}\n"
            return md
        
        # 基本信息
        query = results.get('query', {})
        md += f"## 📊 基本信息\n"
        md += f"- **关键词**: {query.get('keyword', 'N/A')}\n"
        md += f"- **厂商**: {query.get('vendor', 'N/A')}\n"
        md += f"- **时间**: {query.get('timestamp', 'N/A')}\n"
        md += f"- **执行时间**: {results.get('execution_time', 0):.2f}秒\n\n"
        
        # 搜索结果
        search_phase = results.get('search_phase', {})
        md += f"## 🔍 搜索结果\n"
        for engine, result in search_phase.items():
            if isinstance(result, dict) and result.get('success'):
                md += f"### {engine}\n"
                md += f"- 找到URL数量: {result.get('results_count', 0)}\n"
                md += f"- 搜索引擎: {result.get('engine', 'N/A')}\n\n"
        
        # 提取结果
        extraction = results.get('extraction_phase', {})
        md += f"## 📄 内容提取\n"
        md += f"- 处理的URL数量: {extraction.get('urls_processed', 0)}\n"
        md += f"- 成功提取的数量: {extraction.get('successful_extractions', 0)}\n\n"
        
        # 分析结果
        analysis = results.get('analysis', {})
        if analysis:
            md += f"## 📈 分析结果\n"
            md += f"- 总内容长度: {analysis.get('total_content_length', 0):,} 字符\n"
            md += f"- 平均内容长度: {analysis.get('average_content_length', 0):.0f} 字符\n"
            
            if analysis.get('top_keywords'):
                md += f"- 高频关键词:\n"
                for keyword in analysis.get('top_keywords', []):
                    md += f"  - {keyword.get('word')}: {keyword.get('count')}次\n"
            md += "\n"
        
        # 总结
        summary = results.get('summary', {})
        md += f"## 🎯 总结\n"
        md += f"- 总发现URL数: {summary.get('total_urls_found', 0)}\n"
        md += f"- 成功提取文档数: {summary.get('successfully_extracted', 0)}\n"
        md += f"- 使用引擎: {', '.join(summary.get('primary_engines_used', []))}\n"
        md += f"- 建议: {summary.get('recommendation', '无建议')}\n"
        
        return md


# OpenClaw Skill接口函数
def omni_intelligence_search(keyword: str, vendor: str = None) -> Dict:
    """
    OpenClaw Skill标准接口：搜索厂商情报
    
    参数:
        keyword: 搜索关键词
        vendor: 厂商名称（可选）
        
    返回:
        搜索结果字典
    """
    skill = OmniIntelligenceSkill()
    result = skill.search_vendor_docs(keyword, vendor)
    return result


def omni_intelligence_extract(url: str) -> Dict:
    """
    OpenClaw Skill标准接口：提取网页内容
    
    参数:
        url: 网页URL
        
    返回:
        提取内容字典
    """
    skill = OmniIntelligenceSkill()
    result = skill.extract_article(url)
    return result


def omni_intelligence_monitor(topic: str = "AI") -> Dict:
    """
    OpenClaw Skill标准接口：监控科技新闻
    
    参数:
        topic: 主题（默认为AI）
        
    返回:
        监控结果字典
    """
    skill = OmniIntelligenceSkill()
    result = skill.monitor_tech_news(topic)
    return result


# 演示函数
def demo():
    """演示所有功能"""
    print("🚀 Omni_Intelligence_Radar 演示开始\n")
    
    skill = OmniIntelligenceSkill()
    
    # 演示1: 搜索火山引擎文档
    print("=" * 50)
    print("演示1: 搜索火山引擎关于OpenClaw的文档")
    print("=" * 50)
    result1 = skill.search_vendor_docs("OpenClaw", "volcengine")
    if result1.get('success'):
        print(f"✅ 搜索完成: 找到{result1['summary']['total_urls_found']}个URL")
        # 生成报告
        report = skill.generate_report(result1, "markdown")
        print("\n📋 报告摘要:")
        print(report[:500] + "...\n")
    else:
        print(f"❌ 搜索失败: {result1.get('error')}")
    
    # 演示2: 监控AI新闻
    print("=" * 50)
    print("演示2: 监控AI科技新闻")
    print("=" * 50)
    result2 = skill.monitor_tech_news("AI")
    if result2.get('success'):
        print(f"✅ 监控完成: 找到{result2.get('results_count', 0)}个结果")
        print(f"答案摘要: {result2.get('answer', '')[:100]}...\n")
    else:
        print(f"❌ 监控失败: {result2.get('error')}")
    
    # 演示3: 提取网页内容
    print("=" * 50)
    print("演示3: 提取示例网页内容")
    print("=" * 50)
    result3 = skill.extract_article("https://example.com")
    if result3.get('success'):
        print(f"✅ 提取完成: {result3.get('content_length', 0)}字符")
        print(f"内容预览: {result3.get('content', '')[:200]}...\n")
    else:
        print(f"❌ 提取失败: {result3.get('error')}")
    
    print("🎯 演示完成！")


if __name__ == "__main__":
    demo()