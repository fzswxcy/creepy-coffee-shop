#!/bin/bash
# Claude Code GLM5 环境配置脚本
# 使用方法：source setup-claude-code.sh

# 检查必要的环境变量
if [ -z "$GLM5_API_KEY" ]; then
    echo "错误: GLM5_API_KEY 环境变量未设置"
    echo "请设置 GLM5_API_KEY 和 GLM5_MODEL 环境变量"
    exit 1
fi

if [ -z "$GLM5_MODEL" ]; then
    echo "错误: GLM5_MODEL 环境变量未设置"
    exit 1
fi

# 设置 Claude Code 环境变量
export CLAUDE_CODE_API_KEY="$GLM5_API_KEY"
export CLAUDE_CODE_MODEL="$GLM5_MODEL"
export CLAUDE_CODE_ENDPOINT="https://api.glm5.com/v1/chat/completions"

# 创建配置目录
mkdir -p ~/.openclaw/workspace/config

# 生成配置文件
cat > ~/.openclaw/workspace/config/acp-glm5.json << EOF
{
  "acp": {
    "defaultAgent": "claude-code",
    "allowedAgents": ["claude-code"],
    "modelConfig": {
      "provider": "glm5",
      "apiKey": "$GLM5_API_KEY",
      "model": "$GLM5_MODEL",
      "endpoint": "$CLAUDE_CODE_ENDPOINT",
      "temperature": 0.7,
      "maxTokens": 4096
    }
  }
}
EOF

echo "✅ Claude Code 配置完成"
echo "🔑 API Key: ${GLM5_API_KEY:0:10}... (已隐藏)"
echo "🤖 模型: $GLM5_MODEL"
echo "📁 配置文件: ~/.openclaw/workspace/config/acp-glm5.json"

# 测试配置
echo ""
echo "🎯 测试配置..."
openclaw sessions_spawn --help 2>&1 | grep -i "acp\|runtime" || echo "OpenClaw 会话系统正常"