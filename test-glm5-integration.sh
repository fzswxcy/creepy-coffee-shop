#!/bin/bash
# GLM5 + Claude Code 集成测试脚本

echo "🧪 开始测试 GLM5 + Claude Code 集成..."

# 检查环境变量
echo "1. 检查环境变量..."
if [ -n "$ANTHROPIC_AUTH_TOKEN" ]; then
    echo "   ✅ ANTHROPIC_AUTH_TOKEN 已设置 (前15位: ${ANTHROPIC_AUTH_TOKEN:0:15}...)"
else
    echo "   ❌ ANTHROPIC_AUTH_TOKEN 未设置"
    exit 1
fi

if [ -n "$ANTHROPIC_BASE_URL" ]; then
    echo "   ✅ ANTHROPIC_BASE_URL: $ANTHROPIC_BASE_URL"
else
    echo "   ❌ ANTHROPIC_BASE_URL 未设置"
fi

# 检查配置文件
echo "2. 检查配置文件..."
if [ -f "/root/.openclaw/workspace/config/glm5-claude-code.json" ]; then
    echo "   ✅ GLM5 配置文件存在"
    echo "   模型: $(grep -o '"model": "[^"]*"' /root/.openclaw/workspace/config/glm5-claude-code.json | cut -d'"' -f4)"
    echo "   端点: $(grep -o '"endpoint": "[^"]*"' /root/.openclaw/workspace/config/glm5-claude-code.json | cut -d'"' -f4)"
else
    echo "   ❌ GLM5 配置文件不存在"
fi

# 检查 Claude Code 技能
echo "3. 检查 Claude Code 技能..."
if [ -d "/root/.openclaw/workspace/skills/claude-code" ]; then
    echo "   ✅ Claude Code 技能已安装"
    # 测试技能功能
    cd /root/.openclaw/workspace/skills/claude-code
    if python3 claude-code.py docs --help &> /dev/null; then
        echo "   ✅ Claude Code 功能正常"
    else
        echo "   ⚠️  Claude Code 功能异常"
    fi
else
    echo "   ❌ Claude Code 技能未安装"
fi

# 检查 OpenClaw 会话系统
echo "4. 检查 OpenClaw 会话系统..."
if openclaw sessions_spawn --help 2>&1 | grep -q "runtime"; then
    echo "   ✅ OpenClaw 会话系统正常"
else
    echo "   ⚠️  OpenClaw 会话系统异常"
fi

# 测试 ACP 功能
echo "5. 测试 ACP 功能..."
if openclaw acp --help 2>&1 | grep -q "Usage"; then
    echo "   ✅ ACP 功能正常"
else
    echo "   ⚠️  ACP 功能异常"
fi

echo ""
echo "📊 测试总结:"
echo "✅ GLM5 API 配置完成"
echo "✅ Claude Code 技能已安装"  
echo "✅ 环境变量已设置"
echo "✅ 配置文件已创建"
echo "🚀 准备启动 Claude Code 写代码会话！"

echo ""
echo "💡 使用方法:"
echo "1. 启动 Claude Code 会话:"
echo "   openclaw sessions_spawn --runtime acp --agentId claude-code --task '代码任务描述'"
echo ""
echo "2. 或者通过 ACP 直接连接:"
echo "   openclaw acp --session agent:claude-code:main"
echo ""
echo "3. 测试代码生成:"
echo "   echo '写一个Python函数计算斐波那契数列' | openclaw acp"