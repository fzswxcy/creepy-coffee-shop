# GLM5 + Claude Code 环境变量配置
export ANTHROPIC_AUTH_TOKEN="sk-6f6a9c7f8c0649b89a712bc4651207f3"
export ANTHROPIC_BASE_URL="https://dashscope.aliyuncs.com/apps/anthropic"
export ANTHROPIC_MODEL="glm-5"
export ANTHROPIC_SMALL_FAST_MODEL="glm-5"
export CLAUDE_CODE_API_KEY="sk-6f6a9c7f8c0649b89a712bc4651207f3"
export CLAUDE_CODE_MODEL="glm-5"
export CLAUDE_CODE_ENDPOINT="https://dashscope.aliyuncs.com/apps/anthropic"

# 提示信息
echo "✅ GLM5 环境变量已加载"
echo "🤖 模型: $ANTHROPIC_MODEL"
echo "🌐 端点: $ANTHROPIC_BASE_URL"
echo ""
echo "🚀 Claude Code 准备就绪！"
echo "使用 'use_glm5' 命令激活配置"