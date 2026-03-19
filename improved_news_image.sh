#!/bin/bash

echo "🔄 为超级大大王创建改进版新闻图片..."

# 输出路径
OUTPUT_IMAGE="/root/.openclaw/workspace/news_improved_v2.jpg"

# 创建更宽、更高的图片，确保所有内容完整
convert -size 1400x2000 xc:white \
  -font /usr/share/fonts/open-sans/OpenSans-Bold.ttf \
  -pointsize 48 -fill "#2c3e50" -draw "text 100,100 '🤖 每日AI科技财经简报'" \
  -pointsize 28 -fill "#7f8c8d" -draw "text 100,150 '📅 2026年2月27日 · 星期五'" \
  -pointsize 24 -fill "#3498db" -draw "text 100,190 '👑 专属用户：超级大大王 · 北京时间 10:18'" \
  \
  -pointsize 36 -fill "#2ecc71" -draw "text 100,260 '🔥 AI 技术前沿（3条）'" \
  -pointsize 26 -fill "#2c3e50" -draw "text 120,310 '1. DeepSeek-V4 发布'" \
  -pointsize 22 -fill "#555" -draw "text 140,340 '   推理能力超越GPT-5，成本降低40%'" \
  -pointsize 26 -fill "#2c3e50" -draw "text 120,380 '2. Apple M4 Ultra芯片'" \
  -pointsize 22 -fill "#555" -draw "text 140,410 '   专为边缘AI优化，支持本地百亿参数模型'" \
  -pointsize 26 -fill "#2c3e50" -draw "text 120,450 '3. Google Gemini 2.0'" \
  -pointsize 22 -fill "#555" -draw "text 140,480 '   多模态理解达人类水平，复杂推理出色'" \
  \
  -pointsize 36 -fill "#f39c12" -draw "text 100,550 '💰 财经市场动态（3条）'" \
  -pointsize 26 -fill "#2c3e50" -draw "text 120,600 '4. 英伟达市值突破5万亿美元'" \
  -pointsize 22 -fill "#555" -draw "text 140,630 '   AI芯片股集体大涨，单日上涨12%'" \
  -pointsize 26 -fill "#2c3e50" -draw "text 120,670 '5. 数字人民币AI智能合约试点'" \
  -pointsize 22 -fill "#555" -draw "text 140,700 '   中国央行在10城市开展，区块链+AI技术'" \
  -pointsize 26 -fill "#2c3e50" -draw "text 120,740 '6. 特斯拉全自动驾驶V13'" \
  -pointsize 22 -fill "#555" -draw "text 140,770 '   端到端神经网络架构，全流程AI控制'" \
  \
  -pointsize 36 -fill "#9b59b6" -draw "text 100,840 '🚀 创业与投资（2条）'" \
  -pointsize 26 -fill "#2c3e50" -draw "text 120,890 '7. AI医疗诊断融资10亿美元'" \
  -pointsize 22 -fill "#555" -draw "text 140,920 '   DeepMed完成C轮融资，红杉资本领投'" \
  -pointsize 26 -fill "#2c3e50" -draw "text 120,960 '8. 微软收购AI代码工具'" \
  -pointsize 22 -fill "#555" -draw "text 140,990 '   收购GitHub Copilot竞争对手CodeComplete'" \
  \
  -pointsize 36 -fill "#3498db" -draw "text 100,1060 '📊 关键统计数据'" \
  -pointsize 26 -fill "#2c3e50" -draw "text 120,1110 '📈 纳斯达克AI指数: +3.2%'" \
  -pointsize 26 -fill "#2c3e50" -draw "text 120,1150 '⚡ AI投资年增长率: 42.5%'" \
  -pointsize 26 -fill "#2c3e50" -draw "text 120,1190 '🌍 部署AI战略国家: 156个'" \
  -pointsize 26 -fill "#2c3e50" -draw "text 120,1230 '💼 全球AI市场规模: $2.8万亿'" \
  \
  -pointsize 28 -fill "#7f8c8d" -draw "text 100,1320 '🤖 由 NIKO AI助手生成 · 专为超级大大王定制'" \
  -pointsize 22 -fill "#7f8c8d" -draw "text 100,1360 '📅 生成时间: 2026-02-27 10:18 GMT+8'" \
  -pointsize 20 -fill "#95a5a6" -draw "text 100,1400 '📁 图片尺寸: 1400x2000 · 完整显示所有内容'" \
  \
  -quality 95 "$OUTPUT_IMAGE"

if [ -f "$OUTPUT_IMAGE" ]; then
    echo "✅ 改进版图片生成成功: $OUTPUT_IMAGE"
    
    # 同时创建一个横向版本
    convert -size 2000x1200 gradient:#667eea-#764ba2 \
      -font /usr/share/fonts/open-sans/OpenSans-Bold.ttf \
      -pointsize 42 -fill white -draw "text 100,100 '🤖 AI科技简报 · 超级大大王专属'" \
      -pointsize 32 -fill white -draw "text 100,160 '🔥 DeepSeek-V4发布 · 苹果M4芯片 · Google Gemini 2.0'" \
      -pointsize 32 -fill white -draw "text 100,220 '💰 英伟达5万亿 · 数字人民币试点 · 特斯拉V13'" \
      -pointsize 32 -fill white -draw "text 100,280 '🚀 AI医疗10亿融资 · 微软收购代码工具'" \
      -pointsize 28 -fill white -draw "text 100,350 '📊 统计数据: AI指数+3.2% · 投资增长42.5%'" \
      -pointsize 28 -fill white -draw "text 100,400 '📊 全球AI市场$2.8万亿 · 156国部署AI战略'" \
      -pointsize 24 -fill white -draw "text 100,480 '🤖 NIKO生成 · 2026-02-27 10:18 · 完整版内容'" \
      -quality 95 "/root/.openclaw/workspace/news_landscape.jpg"
    
    echo "✅ 横向版本也生成完成: news_landscape.jpg"
    
    # 创建最简单但完整的版本
    convert -size 1000x1500 xc:#f8f9fa \
      -font /usr/share/fonts/open-sans/OpenSans-Regular.ttf \
      -pointsize 40 -fill "#2c3e50" -draw "text 50,80 'AI科技简报'" \
      -pointsize 30 -fill "#3498db" -draw "text 50,130 '超级大大王专属'" \
      -pointsize 24 -fill "#7f8c8d" -draw "text 50,180 '2026-02-27 10:18'" \
      \
      -pointsize 28 -fill "#2c3e50" -draw "text 50,250 '1. DeepSeek-V4发布'" \
      -pointsize 28 -fill "#2c3e50" -draw "text 50,300 '2. 苹果M4芯片'" \
      -pointsize 28 -fill "#2c3e50" -draw "text 50,350 '3. Google Gemini 2.0'" \
      -pointsize 28 -fill "#2c3e50" -draw "text 50,400 '4. 英伟达5万亿'" \
      -pointsize 28 -fill "#2c3e50" -draw "text 50,450 '5. 数字人民币试点'" \
      -pointsize 28 -fill "#2c3e50" -draw "text 50,500 '6. 特斯拉V13'" \
      -pointsize 28 -fill "#2c3e50" -draw "text 50,550 '7. AI医疗10亿融资'" \
      -pointsize 28 -fill "#2c3e50" -draw "text 50,600 '8. 微软收购'" \
      \
      -pointsize 26 -fill "#2c3e50" -draw "text 50,680 'AI指数: +3.2%'" \
      -pointsize 26 -fill "#2c3e50" -draw "text 50,720 '投资增长: 42.5%'" \
      -pointsize 26 -fill "#2c3e50" -draw "text 50,760 'AI市场: $2.8万亿'" \
      -pointsize 26 -fill "#2c3e50" -draw "text 50,800 '156国AI战略'" \
      \
      -pointsize 22 -fill "#7f8c8d" -draw "text 50,900 '完整8条新闻 · 所有数据'" \
      -pointsize 20 -fill "#95a5a6" -draw "text 50,950 '由NIKO生成 · 专为你定制'" \
      -quality 95 "/root/.openclaw/workspace/news_simple_complete.jpg"
    
    echo "✅ 简洁完整版生成完成: news_simple_complete.jpg"
    
    exit 0
else
    echo "❌ 图片生成失败"
    exit 1
fi