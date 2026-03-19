#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
金融保险行业情报收集系统
专门用于收集行协、官方、通报、公众号等金融保险相关资讯
"""

import json
import re
from datetime import datetime
from typing import Dict, List, Optional, Any
from Omni_Intelligence_Radar import OmniIntelligenceRadar

class FinancialInsuranceIntelligence:
    """金融保险行业情报收集器"""
    
    def __init__(self, config_path: str = "omni_intelligence_config.json"):
        self.config_path = config_path
        self.radar = None
        self.load_radar()
        
        # 金融保险行业关键机构
        self.key_organizations = {
            # 监管机构
            "中国银行保险监督管理委员会": ["cbirc.gov.cn", "国家金融监督管理总局"],
            "中国人民银行": ["pbc.gov.cn", "央行"],
            "国家金融监督管理总局": ["nifa.gov.cn", "金监总局"],
            "中国证监会": ["csrc.gov.cn"],
            "国家外汇管理局": ["safe.gov.cn"],
            
            # 行业协会
            "中国保险行业协会": ["iachina.cn", "中保协"],
            "中国保险学会": ["isc.gov.cn"],
            "中国银行业协会": ["china-cba.net", "中银协"],
            "中国信托业协会": ["xtxh.net"],
            "中国证券业协会": ["sac.net.cn"],
            
            # 主要保险公司
            "中国人保": ["picc.com"],
            "中国人寿": ["chinalife.com.cn"],
            "中国平安": ["pingan.com"],
            "中国太保": ["cpic.com.cn"],
            "新华保险": ["newchinalife.com"],
            
            # 金融科技
            "蚂蚁集团": ["antgroup.com", "蚂蚁保险"],
            "腾讯微保": ["wechat.com", "weixin", "微保"],
            "水滴保险": ["shuidi.com"],
            "众安保险": ["zhongan.com"],
        }
        
        # 金融保险关键词
        self.keywords = [
            "保险监管", "保险新规", "偿付能力", "保险产品", "车险改革",
            "健康险", "寿险", "财险", "再保险", "保险科技", "InsurTech",
            "数字化保险", "智能理赔", "互联网保险", "保险代理人",
            "保险资金", "投资", "风险", "理赔", "精算", "再保",
            "保险资管", "险资", "保险中介", "相互保险", "保险诈骗",
            "保险消费者权益", "保险纠纷", "保险创新"
        ]
        
        # 金融保险RSS源
        self.rss_sources = {
            "保险行业协会": "iachina.cn/rss",
            "保险学会": "isc.gov.cn/news/rss",
            "监管动态": "cbirc.gov.cn/cn/rss",
            "保险市场": "insurance-news.cn/rss",
            "保险科技": "insurtechnews.com/rss",
        }
        
    def load_radar(self):
        """加载情报雷达"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
            self.radar = OmniIntelligenceRadar(config)
            print("✅ 金融保险情报收集系统初始化成功")
        except Exception as e:
            print(f"❌ 加载配置失败: {e}")
            self.radar = OmniIntelligenceRadar()
    
    def search_regulatory_updates(self, max_results: int = 15) -> Dict[str, Any]:
        """
        搜索监管机构最新动态
        
        返回:
            监管动态结构化数据
        """
        print("🔍 搜索金融保险监管机构最新动态...")
        
        results = {
            "search_time": datetime.now().isoformat(),
            "regulatory_updates": [],
            "policy_documents": [],
            "industry_news": [],
            "summary": {}
        }
        
        # 搜索各监管机构
        for org_name, domains in self.key_organizations.items():
            if any(keyword in org_name for keyword in ["监督管理", "人民银行", "证监会", "金融管理"]):
                print(f"  搜索 {org_name} 最新动态...")
                
                for domain in domains:
                    if domain.endswith('.gov.cn') or domain.endswith('.gov'):
                        try:
                            # 使用site:语法搜索该域名的最新内容
                            query = f"{org_name} 最新 政策 通报 通知"
                            search_result = self.radar.search_with_tavily(
                                f"{query} site:{domain}", 
                                max_results=5
                            )
                            
                            if search_result.get('success'):
                                urls = search_result.get('urls', [])
                                answer = search_result.get('answer', '')
                                
                                if urls:
                                    results["regulatory_updates"].append({
                                        "organization": org_name,
                                        "domain": domain,
                                        "urls_found": len(urls),
                                        "urls": urls[:3],  # 只取前3个
                                        "ai_summary": answer[:200] if answer else ""
                                    })
                                    
                                    print(f"    ✅ {org_name}: 找到 {len(urls)} 条信息")
                        except Exception as e:
                            print(f"    ⚠️  {org_name} 搜索异常: {e}")
        
        return results
    
    def search_industry_associations(self, max_results: int = 10) -> Dict[str, Any]:
        """
        搜索行业协会资讯
        
        返回:
            行业协会资讯结构化数据
        """
        print("🏛️ 搜索金融保险行业协会资讯...")
        
        results = {
            "search_time": datetime.now().isoformat(),
            "associations": [],
            "standards": [],
            "reports": [],
            "events": []
        }
        
        # 搜索行业协会
        for org_name, domains in self.key_organizations.items():
            if any(keyword in org_name for keyword in ["协会", "学会", "联合会"]):
                print(f"  搜索 {org_name} 资讯...")
                
                for domain in domains:
                    try:
                        # 搜索该行业协会
                        query = f"{org_name} 行业标准 研究报告 会议 活动"
                        search_result = self.radar.search_with_tavily(
                            f"{query} site:{domain}", 
                            max_results=5
                        )
                        
                        if search_result.get('success'):
                            urls = search_result.get('urls', [])
                            answer = search_result.get('answer', '')
                            
                            if urls:
                                # 分析URL类型
                                standards_urls = [url for url in urls if any(word in url.lower() for word in ['standard', '标准', '规范', 'guideline'])]
                                reports_urls = [url for url in urls if any(word in url.lower() for word in ['report', '报告', '研究', 'analysis'])]
                                events_urls = [url for url in urls if any(word in url.lower() for word in ['meeting', '会议', '论坛', '活动', 'conference'])]
                                
                                results["associations"].append({
                                    "organization": org_name,
                                    "domain": domain,
                                    "total_urls": len(urls),
                                    "standards": standards_urls[:2],
                                    "reports": reports_urls[:2],
                                    "events": events_urls[:2],
                                    "ai_summary": answer[:200] if answer else ""
                                })
                                
                                print(f"    ✅ {org_name}: 找到 {len(urls)} 条信息")
                    except Exception as e:
                        print(f"    ⚠️  {org_name} 搜索异常: {e}")
        
        return results
    
    def search_wechat_public_accounts(self, keywords: List[str] = None) -> Dict[str, Any]:
        """
        搜索微信公众号文章
        
        返回:
            微信公众号资讯结构化数据
        """
        print("📱 搜索金融保险微信公众号资讯...")
        
        if keywords is None:
            keywords = self.keywords[:5]  # 使用前5个关键词
        
        results = {
            "search_time": datetime.now().isoformat(),
            "wechat_articles": [],
            "popular_topics": [],
            "key_accounts": [],
            "trends": []
        }
        
        # 搜索关键词
        for keyword in keywords:
            print(f"  搜索微信公众号: {keyword}")
            
            try:
                # 使用Tavily搜索微信公众号内容
                query = f"{keyword} 公众号 文章 最新"
                search_result = self.radar.search_with_tavily(query, max_results=5)
                
                if search_result.get('success'):
                    urls = search_result.get('urls', [])
                    answer = search_result.get('answer', '')
                    
                    # 过滤微信公众号链接
                    wechat_urls = [url for url in urls if 'mp.weixin.qq.com' in url]
                    
                    if wechat_urls:
                        results["wechat_articles"].append({
                            "keyword": keyword,
                            "urls_found": len(wechat_urls),
                            "urls": wechat_urls[:3],  # 只取前3个
                            "ai_summary": answer[:200] if answer else ""
                        })
                        
                        print(f"    ✅ {keyword}: 找到 {len(wechat_urls)} 篇公众号文章")
                        
                        # 尝试提取一篇公众号文章内容
                        if wechat_urls:
                            try:
                                extract_result = self.radar.read_with_jina(wechat_urls[0], timeout=20)
                                if extract_result.get('success'):
                                    content = extract_result.get('content', '')
                                    if content:
                                        # 提取文章关键信息
                                        lines = content.split('\n')
                                        title = next((line for line in lines if line.strip() and '#' in line), '')
                                        results["trends"].append({
                                            "keyword": keyword,
                                            "sample_title": title[:100],
                                            "content_length": len(content),
                                            "has_data": any(word in content.lower() for word in ['数据', '统计', '报告', '增长', '下降'])
                                        })
                            except Exception as e:
                                print(f"    ⚠️  文章提取异常: {e}")
            except Exception as e:
                print(f"    ⚠️  {keyword} 搜索异常: {e}")
        
        return results
    
    def search_policy_documents(self, max_results: int = 10) -> Dict[str, Any]:
        """
        搜索政策文件和官方通报
        
        返回:
            政策文件结构化数据
        """
        print("📄 搜索金融保险政策文件和官方通报...")
        
        results = {
            "search_time": datetime.now().isoformat(),
            "policy_documents": [],
            "official_notices": [],
            "regulations": [],
            "guidelines": []
        }
        
        # 政策文件关键词
        policy_keywords = [
            "管理办法", "实施细则", "指导意见", "通知", "公告",
            "征求意见稿", "暂行办法", "规定", "条例", "标准",
            "监管指引", "风险提示", "消费提示", "典型案例"
        ]
        
        for keyword in policy_keywords[:5]:
            print(f"  搜索政策文件: {keyword}")
            
            try:
                query = f"保险 {keyword} 2025 2026 最新"
                search_result = self.radar.search_with_tavily(query, max_results=5)
                
                if search_result.get('success'):
                    urls = search_result.get('urls', [])
                    answer = search_result.get('answer', '')
                    
                    # 过滤官方域名
                    official_urls = [url for url in urls if any(domain in url for domain in ['.gov.cn', '.gov', 'cbirc.gov.cn', 'pbc.gov.cn'])]
                    
                    if official_urls:
                        results["policy_documents"].append({
                            "keyword": keyword,
                            "urls_found": len(official_urls),
                            "urls": official_urls[:3],
                            "ai_summary": answer[:200] if answer else ""
                        })
                        
                        print(f"    ✅ {keyword}: 找到 {len(official_urls)} 个政策文件")
                        
                        # 识别文件类型
                        for url in official_urls[:2]:
                            if '办法' in keyword:
                                results["regulations"].append(url)
                            elif '指引' in keyword or '指南' in keyword:
                                results["guidelines"].append(url)
                            elif '通知' in keyword or '公告' in keyword:
                                results["official_notices"].append(url)
            except Exception as e:
                print(f"    ⚠️  {keyword} 搜索异常: {e}")
        
        return results
    
    def search_market_trends(self) -> Dict[str, Any]:
        """
        搜索市场趋势和行业动态
        
        返回:
            市场趋势结构化数据
        """
        print("📈 搜索金融保险市场趋势和行业动态...")
        
        results = {
            "search_time": datetime.now().isoformat(),
            "market_trends": [],
            "industry_dynamics": [],
            "innovation_trends": [],
            "risk_warnings": []
        }
        
        # 市场趋势关键词
        trend_keywords = [
            "市场分析", "行业趋势", "发展报告", "统计数据",
            "保费收入", "赔付率", "投资收益率", "市场份额",
            "数字化转型", "科技赋能", "创新产品", "竞争格局"
        ]
        
        for keyword in trend_keywords[:5]:
            print(f"  搜索市场趋势: {keyword}")
            
            try:
                query = f"保险行业 {keyword} 2025 2026 趋势"
                search_result = self.radar.search_with_tavily(query, max_results=5)
                
                if search_result.get('success'):
                    urls = search_result.get('urls', [])
                    answer = search_result.get('answer', '')
                    
                    if urls:
                        results["market_trends"].append({
                            "keyword": keyword,
                            "urls_found": len(urls),
                            "urls": urls[:3],
                            "ai_summary": answer[:300] if answer else ""  # 趋势分析需要更多内容
                        })
                        
                        print(f"    ✅ {keyword}: 找到 {len(urls)} 条趋势信息")
                        
                        # 根据关键词分类
                        if any(word in keyword for word in ['风险', '预警', '提示']):
                            results["risk_warnings"].extend(urls[:2])
                        elif any(word in keyword for word in ['创新', '科技', '数字']):
                            results["innovation_trends"].extend(urls[:2])
                        else:
                            results["industry_dynamics"].extend(urls[:2])
            except Exception as e:
                print(f"    ⚠️  {keyword} 搜索异常: {e}")
        
        return results
    
    def collect_full_intelligence(self) -> Dict[str, Any]:
        """
        收集完整金融保险行业情报
        
        返回:
            完整情报报告
        """
        print("🚀 开始全面收集金融保险行业情报...")
        print("=" * 60)
        
        full_report = {
            "report_time": datetime.now().isoformat(),
            "report_title": "金融保险行业情报收集报告",
            "sections": {},
            "summary": {},
            "recommendations": []
        }
        
        # 收集各维度情报
        try:
            # 1. 监管动态
            print("\n1️⃣ 收集监管机构动态...")
            regulatory_data = self.search_regulatory_updates()
            full_report["sections"]["regulatory_updates"] = regulatory_data
            
            # 2. 行业协会资讯
            print("\n2️⃣ 收集行业协会资讯...")
            association_data = self.search_industry_associations()
            full_report["sections"]["industry_associations"] = association_data
            
            # 3. 微信公众号
            print("\n3️⃣ 收集微信公众号资讯...")
            wechat_data = self.search_wechat_public_accounts()
            full_report["sections"]["wechat_articles"] = wechat_data
            
            # 4. 政策文件
            print("\n4️⃣ 收集政策文件...")
            policy_data = self.search_policy_documents()
            full_report["sections"]["policy_documents"] = policy_data
            
            # 5. 市场趋势
            print("\n5️⃣ 收集市场趋势...")
            trend_data = self.search_market_trends()
            full_report["sections"]["market_trends"] = trend_data
            
        except Exception as e:
            print(f"❌ 情报收集过程异常: {e}")
            full_report["error"] = str(e)
        
        # 生成总结
        print("\n📊 生成情报总结...")
        full_report["summary"] = self._generate_summary(full_report)
        full_report["recommendations"] = self._generate_recommendations(full_report)
        
        # 保存报告
        filename = f"金融保险情报报告_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(full_report, f, ensure_ascii=False, indent=2)
            print(f"✅ 报告已保存到: {filename}")
            full_report["saved_file"] = filename
        except Exception as e:
            print(f"❌ 保存报告失败: {e}")
        
        print("=" * 60)
        print("🎯 金融保险行业情报收集完成!")
        
        return full_report
    
    def _generate_summary(self, report: Dict[str, Any]) -> Dict[str, Any]:
        """生成报告总结"""
        summary = {
            "total_sections": len(report.get("sections", {})),
            "key_findings": [],
            "timeliness": "实时",
            "coverage_areas": [],
            "data_quality": "高"
        }
        
        sections = report.get("sections", {})
        
        # 统计各维度信息量
        for section_name, section_data in sections.items():
            if isinstance(section_data, dict):
                # 统计找到的URL数量
                urls_count = 0
                for key, value in section_data.items():
                    if isinstance(value, list):
                        for item in value:
                            if isinstance(item, dict) and 'urls_found' in item:
                                urls_count += item.get('urls_found', 0)
                            elif isinstance(item, str) and 'http' in item:
                                urls_count += 1
                
                summary["key_findings"].append({
                    "section": section_name,
                    "items_found": urls_count
                })
        
        # 识别覆盖领域
        coverage_keywords = {
            "监管政策": ["regulatory", "policy", "监管"],
            "行业动态": ["association", "industry", "行业"],
            "市场趋势": ["market", "trend", "趋势"],
            "公众号资讯": ["wechat", "公众号"],
            "技术创新": ["innovation", "tech", "科技"]
        }
        
        for keyword, terms in coverage_keywords.items():
            for term in terms:
                if any(term in str(section).lower() for section in sections.keys()):
                    summary["coverage_areas"].append(keyword)
                    break
        
        summary["coverage_areas"] = list(set(summary["coverage_areas"]))
        
        return summary
    
    def _generate_recommendations(self, report: Dict[str, Any]) -> List[str]:
        """生成行动建议"""
        recommendations = [
            "1. 定期监控监管机构官网，及时获取政策变化",
            "2. 关注行业协会动态，了解行业标准和最佳实践",
            "3. 订阅重点微信公众号，获取实时行业资讯",
            "4. 分析市场趋势数据，把握行业发展方向",
            "5. 建立情报预警机制，快速响应监管要求"
        ]
        
        # 基于报告内容生成具体建议
        sections = report.get("sections", {})
        
        if "regulatory_updates" in sections:
            reg_data = sections["regulatory_updates"]
            if isinstance(reg_data, dict) and reg_data.get("regulatory_updates"):
                recommendations.append("6. 重点关注国家金融监督管理总局最新监管要求")
        
        if "wechat_articles" in sections:
            wechat_data = sections["wechat_articles"]
            if isinstance(wechat_data, dict) and wechat_data.get("wechat_articles"):
                recommendations.append("7. 建立微信公众号情报收集体系")
        
        if "market_trends" in sections:
            trend_data = sections["market_trends"]
            if isinstance(trend_data, dict) and trend_data.get("market_trends"):
                recommendations.append("8. 定期分析保险市场数据，优化业务策略")
        
        return recommendations
    
    def generate_markdown_report(self, json_report: Dict[str, Any]) -> str:
        """生成Markdown格式报告"""
        md = "# 📊 金融保险行业情报收集报告\n\n"
        
        # 报告基本信息
        md += f"**报告时间**: {json_report.get('report_time', 'N/A')}\n"
        md += f"**报告标题**: {json_report.get('report_title', 'N/A')}\n\n"
        
        # 总结部分
        summary = json_report.get('summary', {})
        if summary:
            md += "## 📈 报告总结\n\n"
            md += f"- **覆盖领域**: {', '.join(summary.get('coverage_areas', []))}\n"
            md += f"- **时效性**: {summary.get('timeliness', 'N/A')}\n"
            md += f"- **数据质量**: {summary.get('data_quality', 'N/A')}\n\n"
            
            key_findings = summary.get('key_findings', [])
            if key_findings:
                md += "**关键发现**:\n"
                for finding in key_findings:
                    md += f"  - {finding.get('section', 'N/A')}: {finding.get('items_found', 0)} 条信息\n"
                md += "\n"
        
        # 各维度详情
        sections = json_report.get('sections', {})
        for section_name, section_data in sections.items():
            if isinstance(section_data, dict):
                md += f"## 🔍 {section_name.replace('_', ' ').title()}\n\n"
                
                # 显示具体内容
                for key, value in section_data.items():
                    if isinstance(value, list) and value:
                        md += f"### {key.replace('_', ' ').title()}\n"
                        for item in value[:5]:  # 只显示前5个
                            if isinstance(item, dict):
                                # 处理字典项
                                org_name = item.get('organization', item.get('keyword', 'N/A'))
                                urls_found = item.get('urls_found', 0)
                                ai_summary = item.get('ai_summary', '')
                                
                                md += f"**{org_name}** ({urls_found} 条)\n"
                                if ai_summary:
                                    md += f"> {ai_summary}\n"
                                
                                urls = item.get('urls', [])
                                if urls:
                                    md += "相关链接:\n"
                                    for i, url in enumerate(urls[:3], 1):  # 只显示前3个链接
                                        md += f"{i}. {url}\n"
                                md += "\n"
                            elif isinstance(item, str):
                                # 处理字符串项（URL）
                                md += f"- {item}\n"
                        md += "\n"
        
        # 建议部分
        recommendations = json_report.get('recommendations', [])
        if recommendations:
            md += "## 🎯 行动建议\n\n"
            for rec in recommendations:
                md += f"- {rec}\n"
            md += "\n"
        
        # 保存文件信息
        saved_file = json_report.get('saved_file')
        if saved_file:
            md += f"**原始数据文件**: `{saved_file}`\n\n"
        
        md += "---\n"
        md += "*报告由金融保险行业情报收集系统自动生成*\n"
        md += f"*生成时间: {datetime.now().strftime('%Y年%m月%d日 %H:%M:%S')}*\n"
        
        return md


# 使用示例
if __name__ == "__main__":
    # 创建情报收集器
    collector = FinancialInsuranceIntelligence()
    
    # 收集完整情报
    print("🚀 开始金融保险行业情报收集...")
    report = collector.collect_full_intelligence()
    
    # 生成Markdown报告
    md_report = collector.generate_markdown_report(report)
    
    # 保存Markdown报告
    filename = f"金融保险情报报告_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(md_report)
    print(f"✅ Markdown报告已保存到: {filename}")
    
    # 打印报告摘要
    print("\n" + "=" * 60)
    print("📋 报告摘要:")
    summary = report.get('summary', {})
    if summary:
        print(f"• 覆盖领域: {', '.join(summary.get('coverage_areas', []))}")
        print(f"• 关键发现:")
        for finding in summary.get('key_findings', []):
            print(f"  - {finding.get('section')}: {finding.get('items_found')} 条信息")
    
    print(f"• 建议行动: {len(report.get('recommendations', []))} 条")
    print("=" * 60)