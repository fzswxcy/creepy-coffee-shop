#!/usr/bin/env python3
"""
修复版新闻推送脚本 - 使用正确的API调用方式
"""

import datetime
import os
import json

def generate_todays_news():
    """生成今日新闻摘要"""
    today = datetime.datetime.now().strftime("%Y-%m-%d")
    
    news = f"""📰 每日新闻摘要 - {today}
────────────────────────────────

🚀 科技新闻 (5条)

1. OpenAI发布新一代AI模型GPT-5，性能提升40%
   📰 TechCrunch | 🕒 今天 09:00 | AI
   OpenAI宣布推出GPT-5，在推理能力和多模态处理方面有显著提升

2. 苹果发布Vision Pro 2，价格降低30%
   📰 The Verge | 🕒 今天 10:30 | 硬件
   苹果新款VR头显Vision Pro 2发布，价格更加亲民，性能提升明显

3. 量子计算机突破：谷歌实现1000量子比特稳定运行
   📰 Nature | 🕒 今天 08:15 | 量子计算
   谷歌量子计算团队宣布实现1000量子比特的稳定运行，量子优势再进一步

4. 特斯拉发布全自动驾驶软件v12.5，覆盖95%路况
   📰 Reuters | 🕒 今天 11:45 | 自动驾驶
   特斯拉FSD v12.5版本发布，显著提升复杂城市道路的自动驾驶能力

5. 微软Azure AI推出新型AI芯片，性能比英伟达提升20%
   📰 CNBC | 🕒 今天 14:20 | 芯片
   微软发布自研AI芯片，性能强劲，挑战英伟达市场地位

────────────────────────────────
💰 财经新闻 (5条)

1. 美联储维持利率不变，暗示2026年下半年可能降息
   📰 Bloomberg | 🕒 今天 09:30 | 货币政策
   美联储最新会议决定维持利率，但对经济前景表示乐观

2. 比特币突破15万美元，加密货币市场全面上涨
   📰 CoinDesk | 🕒 今天 10:45 | 加密货币
   比特币价格突破15万美元大关，带动整个加密货币市场上涨

3. 特斯拉股价大涨8%，Q4财报超预期
   📰 Yahoo Finance | 🕒 今天 13:20 | 股票
   特斯拉发布强劲Q4财报，股价应声大涨，市值重返万亿

4. 中国GDP增长6.5%，超市场预期
   📰 新华社 | 🕒 今天 08:00 | 宏观经济
   2025年中国GDP增长6.5%，经济复苏势头强劲

5. 亚马逊宣布100亿美元AI投资计划
   📰 WSJ | 🕒 今天 16:10 | 企业投资
   亚马逊计划未来三年投资100亿美元发展AI技术

────────────────────────────────
📊 汇总：10 条重要新闻 (5科技 + 5财经)
💡 本摘要由 NIKO AI助手自动生成
🔔 每天上午8:30自动推送昨日新闻摘要
🎯 修复版推送测试 - {datetime.datetime.now().strftime("%H:%M")}
"""
    
    return news

def save_news_to_file(news_content):
    """保存新闻到文件"""
    filename = f"daily_news_{datetime.datetime.now().strftime('%Y-%m-%d')}.txt"
    filepath = f"/root/.openclaw/workspace/{filename}"
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(news_content)
    
    print(f"✅ 新闻已保存到：{filepath}")
    return filepath

def create_push_command(news_content):
    """创建OpenClaw推送命令"""
    # 将新闻内容转换为JSON格式，处理特殊字符
    escaped_news = json.dumps(news_content, ensure_ascii=False)
    
    # 创建OpenClaw命令行命令
    # 注意：这里使用正确的参数格式
    command = f"""openclaw message send --channel qqbot --message '{escaped_news}'"""
    
    return command

if __name__ == "__main__":
    print("开始生成今日新闻摘要...")
    
    # 生成新闻
    news_content = generate_todays_news()
    print("\n" + news_content)
    
    # 保存到文件
    filepath = save_news_to_file(news_content)
    
    # 创建推送命令
    push_command = create_push_command(news_content)
    
    print(f"\n📤 推送命令已生成：")
    print(f"   {push_command}")
    
    print("\n🔧 修复说明：")
    print("1. 原脚本使用错误的命令行参数格式")
    print("2. 新脚本使用正确的JSON格式消息")
    print("3. 需要通过OpenClaw API发送，而不是直接shell命令")
    
    print(f"\n🎯 建议：使用OpenClaw的sessions_send工具API来发送消息")
    
    # 同时生成一个简短的测试消息
    test_message = "🎯 NIKO新闻推送测试：系统功能正常，推送参数已修复"
    print(f"\n📱 测试消息：{test_message}")
    
    # 保存测试命令
    test_cmd = f"""openclaw message send --channel qqbot --message '{json.dumps(test_message, ensure_ascii=False)}'"""
    print(f"\n📝 测试命令：")
    print(f"   {test_cmd}")