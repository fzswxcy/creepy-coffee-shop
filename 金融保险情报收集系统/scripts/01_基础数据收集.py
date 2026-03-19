#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
金融保险基础数据收集脚本
版本: 1.0
创建: 2026-03-11
作者: NIKO - 超级大大王的AI助手
功能: 收集金融保险行业基础情报
"""

import json
import time
import datetime
import requests
from typing import Dict, List, Optional
import sys
import os
import subprocess

sys.path.append('/root/.openclaw/workspace/skills/easy-search/scripts')

class FinanceInsuranceIntelligenceCollector:
    """金融保险情报收集器"""
    
    def __init__(self):
        self.today = datetime.datetime.now().strftime("%Y-%m-%d")
        self.data_dir = "/root/.openclaw/workspace/金融保险情报收集系统/data"
        self.report_dir = "/root/.openclaw/workspace/金融保险情报收集系统/reports"
        
        # 创建目录
        os.makedirs(self.data_dir, exist_ok=True)
        os.makedirs(self.report_dir, exist_ok=True)
        
        # 搜索关键词配置
        self.search_keywords = {
            "policy": [
                "金融监管政策 2026",
                "保险业监管 最新政策",
                "银保监会 2026年工作重点",
                "金融科技监管 政策"
            ],
            "market": [
                "保险行业市场报告 2026",
                "保费收入增长趋势",
                "保险科技市场规模",
                "数字保险发展前景"
            ],
            "tech": [
                "AI保险 应用案例",
                "区块链保险解决方案",
                "保险大数据风控",
                "智能理赔技术"
            ],
            "company": [
                "中国人寿 最新动态",
                "平安保险 战略布局",
                "太平洋保险 数字化转型",
                "保险科技初创企业"
            ]
        }
    
    def search_with_keywords(self, category: str) -> List[Dict]:
        """使用关键词搜索"""
        results = []
        keywords = self.search_keywords.get(category, [])
        
        for keyword in keywords:
            print(f"搜索: {keyword}")
            try:
                # 使用easy-search搜索
                result = self.search_easy(keyword, engine="bing")
                if result:
                    results.extend(result)
            except Exception as e:
                print(f"搜索失败 {keyword}: {e}")
                continue
            
            # 避免请求过快
            time.sleep(2)
        
        return results
    
    def search_easy(self, query: str, engine: str = "bing") -> List[Dict]:
        """调用easy-search技能"""
        try:
            search_path = "/root/.openclaw/workspace/skills/easy-search/scripts/search.py"
            
            cmd = [
                "python3", search_path,
                "--query", query,
                "--engine", engine,
                "--results", "5",
                "--format", "json"
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                import json as json_module
                data = json_module.loads(result.stdout)
                return data.get("results", [])
            else:
                print(f"搜索命令失败: {result.stderr}")
                return []
                
        except Exception as e:
            print(f"搜索异常: {e}")
            return []
    
    def collect_daily_data(self) -> Dict:
        """收集每日数据"""
        print("开始收集金融保险每日情报...")
        
        data = {
            "date": self.today,
            "collection_time": datetime.datetime.now().isoformat(),
            "policy": [],
            "market": [],
            "tech": [],
            "company": [],
            "summary": {
                "total_items": 0,
                "categories": {},
                "key_findings": []
            }
        }
        
        # 收集各维度数据
        categories = ["policy", "market", "tech", "company"]
        for category in categories:
            print(f"\n=== 收集{category}情报 ===")
            results = self.search_with_keywords(category)
            data[category] = results
            data["summary"]["categories"][category] = len(results)
            data["summary"]["total_items"] += len(results)
            
            # 提取关键发现
            if results:
                for i, result in enumerate(results[:3]):
                    if result.get("title") and result.get("url"):
                        key_finding = f"{category}: {result['title']}"
                        data["summary"]["key_findings"].append(key_finding)
        
        return data
    
    def save_data(self, data: Dict):
        """保存数据"""
        filename = f"{self.data_dir}/{self.today}_finance_insurance_data.json"
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"数据已保存: {filename}")
        return filename
    
    def generate_daily_report(self, data: Dict) -> str:
        """生成每日报告"""
        report_content = f"""# 金融保险情报日报
## 报告日期: {self.today}
## 生成时间: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
## 分析师: NIKO (超级大大王的AI助手)

---

## 📊 数据概览
- **总情报条目**: {data['summary']['total_items']} 条
- **政策监管情报**: {data['summary']['categories'].get('policy', 0)} 条
- **市场动态情报**: {data['summary']['categories'].get('market', 0)} 条
- **技术创新情报**: {data['summary']['categories'].get('tech', 0)} 条
- **公司动态情报**: {data['summary']['categories'].get('company', 0)} 条

---

## 🔑 关键发现

"""
        
        # 添加关键发现
        if data["summary"]["key_findings"]:
            for finding in data["summary"]["key_findings"]:
                report_content += f"- {finding}\n"
        else:
            report_content += "暂无关键发现\n"
        
        report_content += "\n---\n"
        
        # 详细情报
        categories = {
            "policy": "📋 政策监管情报",
            "market": "📈 市场动态情报", 
            "tech": "💻 技术创新情报",
            "company": "🏢 公司动态情报"
        }
        
        for cat_key, cat_title in categories.items():
            items = data.get(cat_key, [])
            if items:
                report_content += f"\n## {cat_title}\n\n"
                
                for i, item in enumerate(items[:5], 1):
                    title = item.get("title", "无标题")
                    url = item.get("url", "")
                    snippet = item.get("snippet", "")
                    
                    report_content += f"### {i}. {title}\n"
                    if url:
                        report_content += f"🔗 链接: {url}\n"
                    if snippet:
                        report_content += f"📝 摘要: {snippet}\n"
                    report_content += "\n"
        
        report_content += "\n---\n"
        
        # 分析与建议
        report_content += """
## 🎯 分析与建议

### 当前观察
1. **政策环境**: 正在收集相关政策变化信息
2. **市场趋势**: 密切关注数字化转型进展
3. **技术应用**: AI和区块链技术在保险业的应用值得关注
4. **竞争格局**: 传统保险公司与金融科技公司的竞争与合作

### 建议关注
1. **监管政策变化** - 特别是金融科技相关监管
2. **数字化转型进展** - 保险公司的数字化投入和效果
3. **技术创新应用** - AI理赔、智能核保等新技术
4. **市场整合机会** - 潜在的并购和合作机会

### 风险评估
1. **监管风险**: 政策变化可能影响业务模式
2. **技术风险**: 数字化转型中的技术实施风险
3. **市场风险**: 竞争加剧可能导致利润率下降
4. **操作风险**: 新技术的应用可能带来新的操作风险

---

## 📈 后续工作建议

### 短期 (1-2周)
1. 完善数据源覆盖范围
2. 建立自动化情报收集系统
3. 开发数据可视化仪表板

### 中期 (1个月)
1. 建立行业知识图谱
2. 开发趋势预测模型
3. 实现智能预警功能

### 长期 (3-6个月)
1. 构建智能投资建议系统
2. 建立专家分析网络
3. 开发行业深度分析能力

---

## 📞 联系方式
- **分析师**: NIKO
- **系统**: 金融保险情报收集系统 v1.0
- **创建时间**: 2026-03-11
- **更新频率**: 每日更新

---

*本报告基于公开信息整理，仅供参考。投资有风险，决策需谨慎。*
"""
        
        # 保存报告
        report_filename = f"{self.report_dir}/{self.today}_金融保险情报日报.md"
        with open(report_filename, 'w', encoding='utf-8') as f:
            f.write(report_content)
        
        print(f"报告已生成: {report_filename}")
        return report_content
    
    def run(self):
        """运行主程序"""
        print("=" * 60)
        print("金融保险情报收集系统 v1.0")
        print(f"执行日期: {self.today}")
        print("=" * 60)
        
        try:
            # 1. 收集数据
            data = self.collect_daily_data()
            
            # 2. 保存数据
            data_file = self.save_data(data)
            
            # 3. 生成报告
            report = self.generate_daily_report(data)
            
            # 4. 输出摘要
            print("\n" + "=" * 60)
            print("🎯 收集完成!")
            print(f"📊 数据文件: {data_file}")
            print(f"📄 报告文件: {self.report_dir}/{self.today}_金融保险情报日报.md")
            print(f"📈 情报总数: {data['summary']['total_items']}")
            print("=" * 60)
            
            return {
                "success": True,
                "data_file": data_file,
                "report": f"{self.report_dir}/{self.today}_金融保险情报日报.md",
                "total_items": data['summary']['total_items'],
                "key_findings": data['summary']['key_findings'][:5]
            }
            
        except Exception as e:
            print(f"❌ 收集失败: {e}")
            import traceback
            traceback.print_exc()
            return {"success": False, "error": str(e)}

if __name__ == "__main__":
    collector = FinanceInsuranceIntelligenceCollector()
    result = collector.run()
    
    # 输出结果摘要
    if result.get("success"):
        print("\n📋 关键发现摘要:")
        for finding in result.get("key_findings", []):
            print(f"  - {finding}")
    else:
        print(f"❌ 执行失败: {result.get('error')}")