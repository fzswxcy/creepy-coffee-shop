#!/usr/bin/env python3
"""
QQ对话直接修复脚本
目标：让QQ对话恢复正常
"""

import json
import datetime

def diagnose_problem():
    """诊断QQ对话问题"""
    print("🔍 诊断QQ对话问题...")
    print("="*60)
    
    problem = """
🎯 **问题诊断结果：**

**错误信息：**
<400> InternalError.Algo.InvalidParameter: Range of input length should be [1, 131072]

**问题分析：**
1. ❌ **消息长度超限** - 超过131,072字符限制
2. ✅ **连接正常** - QQ Bot可以连接到服务
3. ❌ **参数错误** - 发送的消息格式或长度有问题

**根本原因：**
新闻推送内容太长，超过了API的长度限制。

**解决方案：**
1. 发送非常短的消息测试连接
2. 精简新闻内容
3. 分段发送长消息
"""
    
    print(problem)
    print("="*60)
    return problem

def create_test_messages():
    """创建测试消息集合"""
    print("\n🧪 创建测试消息集合...")
    print("="*60)
    
    test_messages = [
        ("1. 超短测试", "测试"),
        ("2. 短句测试", "你好，这是NIKO的测试消息"),
        ("3. 中等长度测试", "QQ对话修复测试。如果你能看到这条消息，说明连接正常。"),
        ("4. 带格式测试", "📱 QQ对话修复测试\n✅ 连接状态：正常\n⏰ 时间：现在"),
        ("5. 新闻精简版", "📰 新闻速递：\n1. 科技\n2. 财经\n📊 共2条")
    ]
    
    for name, message in test_messages:
        print(f"{name}: {message}")
        print(f"   长度：{len(message)} 字符")
        print()
    
    print("="*60)
    return test_messages

def generate_qq_commands():
    """生成QQ修复命令"""
    print("\n💻 生成QQ修复命令...")
    print("="*60)
    
    commands = """
🎯 **QQ对话修复命令集合**

**1. 测试超短消息（2字符）**
openclaw message send --channel qqbot --message "测试"

**2. 测试短句消息**
openclaw message send --channel qqbot --message "你好，这是NIKO的测试消息"

**3. 测试中等长度消息**
openclaw message send --channel qqbot --message "QQ对话修复测试。如果你能看到这条消息，说明连接正常。"

**4. 测试带格式消息**
openclaw message send --channel qqbot --message "📱 QQ对话修复测试\\n✅ 连接状态：正常\\n⏰ 时间：现在"

**5. 测试新闻精简版**
openclaw message send --channel qqbot --message "📰 新闻速递：\\n1. 科技\\n2. 财经\\n📊 共2条"

**6. 检查当前会话**
sessions_list

**7. 发送到特定会话**
sessions_send --sessionKey agent:main:qqbot:dm:35bf36d2e69d6e2540c122fdffed59cf --message "测试消息"

**关键步骤：**
1. 从最短的消息开始测试
2. 逐渐增加长度
3. 找到失败的临界点
4. 调整新闻内容到安全长度
"""
    
    print(commands)
    print("="*60)
    return commands

def create_fix_plan():
    """创建修复计划"""
    print("\n📋 创建QQ对话修复计划...")
    print("="*60)
    
    plan = """
🚀 **QQ对话修复计划**

**第一阶段：确认基本连接**
1. 发送"测试"（2字符） → 确认是否能收到
2. 如果收到 → 连接正常，只是长度问题
3. 如果收不到 → 需要重新配置QQ Bot

**第二阶段：确定安全长度**
1. 发送不同长度的测试消息
2. 找到不触发错误的最大长度
3. 确定新闻内容的安全字符数

**第三阶段：调整新闻推送**
1. 精简新闻摘要到安全长度内
2. 如果需要，分段发送
3. 优化格式，减少冗余字符

**第四阶段：测试完整流程**
1. 发送精简版新闻
2. 验证QQ能正常接收
3. 配置定时任务

**关键要求：**
你需要配合测试，告诉我：
1. 哪些测试消息能收到？
2. 哪些测试消息收不到？
3. 消息的显示效果如何？
"""
    
    print(plan)
    print("="*60)
    return plan

def create_short_news_template():
    """创建简短新闻模板"""
    print("\n📰 创建简短新闻模板...")
    print("="*60)
    
    template = """📰 每日新闻速递

🚀 科技要闻：
1. 量子计算突破
2. 苹果新品发布
3. AI模型更新

💰 财经动态：
1. 货币政策
2. 加密货币
3. 企业财报

📊 精选6条新闻
⏰ {time}
💡 NIKO推送系统

字符数：约120字符（安全范围内）"""
    
    print(template)
    print("="*60)
    return template

def main():
    print("🚀 QQ对话修复工具")
    print("="*60)
    
    # 诊断问题
    diagnose_problem()
    
    # 创建测试消息
    create_test_messages()
    
    # 生成修复命令
    generate_qq_commands()
    
    # 创建修复计划
    create_fix_plan()
    
    # 创建简短新闻模板
    create_short_news_template()
    
    print("\n" + "="*60)
    print("🎯 **立即行动步骤**")
    print("="*60)
    
    action_steps = """
🔥 **请你立即执行：**

**步骤1：测试最短消息**
请尝试在QQ上发送最简单的内容：
```
测试
```

**步骤2：告诉我结果**
请在QQ上回复：
1. "收到" → 如果能收到
2. "没收到" → 如果收不到
3. 或者描述你看到的错误信息

**步骤3：逐步测试**
如果最短消息能收到，我们：
1. 逐渐增加消息长度
2. 找到失败的长度临界点
3. 调整新闻内容

**步骤4：修复完成**
一旦确定安全长度，我可以：
1. 生成适配的新闻摘要
2. 重新配置定时任务
3. 完成QQ推送系统

📞 **关键配合：**
我需要你实时反馈QQ上的测试结果，这样我才能：
1. 知道问题在哪里
2. 调整解决方案
3. 最终修复成功

**现在请立即在QQ上测试并回复！**
"""
    
    print(action_steps)
    
    # 生成实际测试命令
    print("\n" + "="*60)
    print("🔧 **立即可以执行的测试命令**")
    print("="*60)
    
    test_cmds = [
        'openclaw message send --channel qqbot --message "测试"',
        'openclaw message send --channel qqbot --message "QQ连接测试"',
        'sessions_send --sessionKey agent:main:qqbot:dm:35bf36d2e69d6e2540c122fdffed59cf --message "会话测试"'
    ]
    
    for i, cmd in enumerate(test_cmds, 1):
        print(f"{i}. {cmd}")

if __name__ == "__main__":
    main()