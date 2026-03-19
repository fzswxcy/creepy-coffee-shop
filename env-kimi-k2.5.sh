#!/bin/bash
# Kimi K2.5 多模态能力配置脚本
# 用于生成图像、特效、图像动画等

export ANTHROPIC_AUTH_TOKEN="sk-6f6a9c7f8c0649b89a712bc4651207f3"
export ANTHROPIC_BASE_URL="https://dashscope.aliyuncs.com/apps/anthropic"
export ANTHROPIC_MODEL="kimi-k2.5"
export ANTHROPIC_SMALL_FAST_MODEL="kimi-k2.5"

# 多模态相关配置
export DASHSCOPE_API_KEY="sk-6f6a9c7f8c0649b89a712bc4651207f3"
export DASHSCOPE_BASE_URL="https://dashscope.aliyuncs.com"

# 图像生成配置
export IMAGE_GEN_MODEL="wanx2.1-t2i-plus"  # 通义万相图像生成
export IMAGE_STYLE_PRESET="cinematic"       # 默认风格

# 视频/动画生成配置  
export VIDEO_GEN_MODEL="wanx2.1-i2v-plus"   # 通义万相视频生成
export VIDEO_RESOLUTION="1080p"

# 特效配置
export EFFECTS_ENABLED=true
export ANIMATION_ENABLED=true

echo "✅ 已切换至：阿里百炼 kimi-k2.5"
echo "🎨 多模态能力已激活："
echo "   • 图像生成: 通义万相"
echo "   • 视频动画: 图像转视频"
echo "   • 特效处理: 已启用"
echo ""
echo "🚀 可以使用："
echo "   - 文本生成图像"
echo "   - 图像生成视频/动画"
echo "   - 图像特效处理"
echo "   - 多模态内容创作"