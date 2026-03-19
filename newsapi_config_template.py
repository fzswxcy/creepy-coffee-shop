#!/usr/bin/env python3
"""
NewsAPI配置模板 - 使用真实NewsAPI.org服务
"""

import datetime
import requests
import json
import sys
from typing import List, Dict

class NewsAPIConfig:
    """NewsAPI配置类"""
    
    # NewsAPI免费版配置
    BASE_URL = "https://newsapi.org/v2"
    ENDPOINTS = {
        "top_headlines": "/top-headlines",  # 头条新闻
        "everything": "/everything",        # 所有新闻
        "sources": "/sources"               # 新闻源
    }
    
    # 免费版限制
    FREE_LIMITS = {
        "requests_per_day": 500,
        "results_per_request": 100,
        "sources": "70,000+ sources"
    }
    
    @staticmethod
    def get_api_instructions():
        """获取API配置说明"""
        return {
            "注册步骤": [
                "1. 访问 https://newsapi.org",
                "2. 点击 'Get API Key'",
                "3. 注册免费账户",
                "4. 获取API密钥"
            ],
            "免费额度": {
                "每日请求": "500次",
                "每次结果": "100条",
                "新闻源": "70,000+ 来源",
                "支持分类": "business, entertainment, general, health, science, sports, technology"
            },
            "使用方法": {
                "科技新闻": "category=technology&language=zh",
                "财经新闻": "category=business&language=zh",
                "搜索新闻": "q=AI&from=2026-02-23&sortBy=popularity"
            }
        }
    
    @staticmethod
    def test_connection(api_key: str) -> Dict:
        """测试API连接"""
        try:
            url = f"https://newsapi.org/v2/top-headlines?category=technology&apiKey={api_key}"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "status": "success",
                    "total_results": data.get("totalResults", 0),
                    "articles_count": len(data.get("articles", [])),
                    "message": "API连接成功"
                }
            elif response.status_code == 401:
                return {
                    "status": "error",
                    "message": "API密钥无效，请检查密钥"
                }
            else:
                return {
                    "status": "error",
                    "message": f"API错误: {response.status_code}"
                }
                
        except requests.exceptions.RequestException as e:
            return {
                "status": "error",
                "message": f"网络连接错误: {e}"
            }

class NewsAPIFetcher:
    """NewsAPI新闻获取器"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.yesterday = (datetime.datetime.now() - datetime.timedelta(days=1)).strftime("%Y-%m-%d")
        
    def fetch_tech_news(self) -> List[Dict]:
        """获取科技新闻"""
        params = {
            "category": "technology",
            "language": "zh",
            "from": self.yesterday,
            "sortBy": "popularity",
            "pageSize": 5,
            "apiKey": self.api_key
        }
        
        try:
            response = requests.get(
                f"{NewsAPIConfig.BASE_URL}{NewsAPIConfig.ENDPOINTS['everything']}",
                params=params,
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                articles = data.get("articles", [])
                
                # 格式化文章
                formatted_articles = []
                for article in articles[:5]:  # 取前5条
                    formatted_articles.append({
                        "title": article.get("title", "无标题"),
                        "source": article.get("source", {}).get("name", "未知来源"),
                        "publishedAt": article.get("publishedAt", ""),
                        "description": article.get("description", "无描述"),
                        "url": article.get("url", "#"),
                        "category": "科技"
                    })
                return formatted_articles
            else:
                print(f"❌ 获取科技新闻失败: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"❌ 网络错误: {e}")
            return []
    
    def fetch_finance_news(self) -> List[Dict]:
        """获取财经新闻"""
        params = {
            "q": "business OR economy OR stock OR bitcoin",
            "language": "zh",
            "from": self.yesterday,
            "sortBy": "popularity",
            "pageSize": 5,
            "apiKey": self.api_key
        }
        
        try:
            response = requests.get(
                f"{NewsAPIConfig.BASE_URL}{NewsAPIConfig.ENDPOINTS['everything']}",
                params=params,
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                articles = data.get("articles", [])
                
                # 格式化文章
                formatted_articles = []
                for article in articles[:5]:  # 取前5条
                    formatted_articles.append({
                        "title": article.get("title", "无标题"),
                        "source": article.get("source", {}).get("name", "未知来源"),
                        "publishedAt": article.get("publishedAt", ""),
                        "description": article.get("description", "无描述"),
                        "url": article.get("url", "#"),
                        "category": "财经"
                    })
                return formatted_articles
            else:
                print(f"❌ 获取财经新闻失败: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"❌ 网络错误: {e}")
            return []
    
    def generate_report(self) -> str:
        """生成新闻报告"""
        print(f"📡 正在从NewsAPI获取 {self.yesterday} 的真实新闻...")
        
        tech_news = self.fetch_tech_news()
        finance_news = self.fetch_finance_news()
        
        report = f"📰 真实新闻摘要 - {self.yesterday}\n"
        report += "────────────────────────────────\n\n"
        
        if tech_news:
            report += "🚀 科技热点新闻 ({}条)\n\n".format(len(tech_news))
            for i, news in enumerate(tech_news, 1):
                time_str = news["publishedAt"][11:16] if news["publishedAt"] else "时间未知"
                report += f"{i}. {news['title']}\n"
                report += f"   📰 {news['source']} | 🕒 {time_str} | {news['category']}\n"
                report += f"   {news['description']}\n"
                if news['url'] != "#":
                    report += f"   🔗 {news['url']}\n"
                report += "\n"
        else:
            report += "⚠️ 科技新闻获取失败，请检查API配置\n\n"
        
        report += "────────────────────────────────\n"
        
        if finance_news:
            report += "💰 财经热点新闻 ({}条)\n\n".format(len(finance_news))
            for i, news in enumerate(finance_news, 1):
                time_str = news["publishedAt"][11:16] if news["publishedAt"] else "时间未知"
                report += f"{i}. {news['title']}\n"
                report += f"   📰 {news['source']} | 🕒 {time_str} | {news['category']}\n"
                report += f"   {news['description']}\n"
                if news['url'] != "#":
                    report += f"   🔗 {news['url']}\n"
                report += "\n"
        else:
            report += "⚠️ 财经新闻获取失败，请检查API配置\n\n"
        
        report += "────────────────────────────────\n"
        report += "📊 数据来源: NewsAPI.org\n"
        report += "🎯 新闻时效: 昨日热点，今日推送\n"
        report += "💡 生成时间: {}\n".format(datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        
        return report

def main():
    """主函数"""
    print("🎯 NewsAPI真实新闻系统配置")
    print("=" * 50)
    
    # 显示配置说明
    instructions = NewsAPIConfig.get_api_instructions()
    print("📋 配置步骤:")
    for step in instructions["注册步骤"]:
        print(f"   {step}")
    
    print("\n📊 免费额度:")
    for key, value in instructions["免费额度"].items():
        print(f"   • {key}: {value}")
    
    print("\n🔑 请按以下步骤操作:")
    print("1. 注册并获取API密钥")
    print("2. 将API密钥保存在安全位置")
    print("3. 运行配置脚本测试连接")
    
    print("\n📝 示例API密钥格式: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6")
    print("⚠️ 注意: 不要在代码中硬编码API密钥，使用环境变量")
    
    return instructions

if __name__ == "__main__":
    main()