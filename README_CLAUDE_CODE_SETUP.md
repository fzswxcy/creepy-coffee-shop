# Claude Code 配置准备指南

## 当前状态
✅ Claude Code 技能已安装
✅ 系统已准备好集成

## 需要的配置

### 1. ACP 配置 (用于 Claude Code)
ACP (Agent Client Protocol) 需要以下配置：
- **模型提供者**: GLM5 (智谱AI)
- **API Key**: 由你提供
- **模型名称**: 指定 GLM5 的具体模型
- **端点**: GLM5 API 端点

### 2. OpenClaw 配置
需要创建一个配置文件 `~/.openclaw/workspace/config/acp-glm5.json` 包含：
```json
{
  "acp": {
    "defaultAgent": "claude-code",
    "allowedAgents": ["claude-code"],
    "modelConfig": {
      "provider": "glm5",
      "apiKey": "YOUR_API_KEY_HERE",
      "model": "指定GLM5模型",
      "endpoint": "https://api.glm5.com/v1/chat/completions"
    }
  }
}
```

### 3. Claude Code 配置
需要在会话启动时设置：
```bash
export CLAUDE_CODE_API_KEY="YOUR_API_KEY_HERE"
export CLAUDE_CODE_MODEL="glm5-model-name"
```

## 当前等待的信息
只需要你提供以下信息，我就可以完成配置：

1. **GLM5 API Key** (智谱AI API密钥)
2. **具体的 GLM5 模型名称** (例如: glm-5-chat, glm-5-plus 等)

一旦你提供这两项信息，我就可以：
1. 创建完整的配置
2. 设置环境变量
3. 测试 Claude Code 连接
4. 开始使用 Claude Code 写代码

## 你可以这样提供信息
- 直接私信发送 API Key 和模型名称
- 或者告诉我，我会引导你完成配置流程

**注意**: 请确保 API Key 有足够的额度和相应的 Claude Code 使用权限。

准备好了吗？请提供你的 GLM5 API Key 和模型名称。