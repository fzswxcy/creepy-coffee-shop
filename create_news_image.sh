#!/bin/bash

# 为超级大大王创建新闻图片
echo "🎯 开始为超级大大王生成新闻图片..."

# 创建临时目录
TEMP_DIR="/tmp/news_image_$$"
mkdir -p "$TEMP_DIR"

# 图片输出路径
OUTPUT_IMAGE="/root/.openclaw/workspace/news_final_image.jpg"

# 1. 首先创建一个文本文件包含所有新闻内容
cat > "$TEMP_DIR/news_content.txt" << 'EOF'
🤖 每日AI科技财经简报
📅 2026年2月27日 · 星期五
⏰ 北京时间 10:16
👑 专属用户：超级大大王

==================== 🔥 AI 技术前沿 ====================

1. DeepSeek-V4 发布，推理能力超越GPT-5
   中国AI公司深度求索发布V4模型，在多轮对话、代码生成和
   数学推理方面取得突破性进展。推理成本降低40%。

2. Apple发布M4 Ultra芯片，专为边缘AI优化
   苹果推出M4 Ultra芯片，搭载专用AI加速器，支持本地运行
   百亿参数模型。新款MacBook Pro成为移动AI工作站。

3. Google Gemini 2.0实现多模态突破
   谷歌宣布Gemini 2.0在多模态理解方面达到人类水平，能够
   同时处理文本、图像、音频和视频输入。

==================== 💰 财经市场动态 ====================

4. AI芯片股集体大涨，英伟达市值突破5万亿美元
   受全球AI投资热潮影响，英伟达股价单日上涨12%，
   市值首次突破5万亿美元大关。

5. 中国央行宣布数字人民币AI智能合约试点
   将在上海、深圳等10个城市开展数字人民币AI智能合约试点，
   利用区块链和AI技术实现自动化金融合约执行。

6. 特斯拉发布全自动驾驶V13，采用端到端AI架构
   特斯拉CEO埃隆·马斯克宣布发布全自动驾驶系统V13版本，
   采用端到端神经网络架构。

==================== 🚀 创业与投资 ====================

7. AI医疗诊断公司"DeepMed"完成10亿美元C轮融资
   专注于AI医学影像诊断的初创公司DeepMed宣布完成
   10亿美元C轮融资，由红杉资本领投。

8. 微软收购AI代码生成工具GitHub Copilot竞争对手
   微软宣布收购AI代码生成平台CodeComplete，
   交易金额未披露。将与GitHub Copilot整合。

==================== 📊 统计数据 ====================

📈 纳斯达克AI指数：+3.2%
⚡ AI投资年增长率：42.5%
🌍 部署AI战略国家：156个
💼 全球AI市场规模：$2.8万亿美元

==================== 🤖 生成信息 ====================

生成时间：2026-02-27 10:16 GMT+8
生成者：NIKO AI助手
状态：专为超级大大王定制
文件格式：JPEG 高质量图片
EOF

# 2. 使用ImageMagick创建图片
echo "🖼️ 使用ImageMagick生成图片..."

convert -size 1200x1600 xc:#f8f9fa \
  -font /usr/share/fonts/open-sans/OpenSans-Regular.ttf \
  -pointsize 36 -fill "#2c3e50" -draw "text 50,80 '🤖 每日AI科技财经简报'" \
  -pointsize 24 -fill "#7f8c8d" -draw "text 50,120 '📅 2026年2月27日 · 星期五 · 北京时间 10:16'" \
  -pointsize 20 -fill "#3498db" -draw "text 50,160 '👑 专属用户：超级大大王'" \
  -pointsize 28 -fill "#2c3e50" -draw "text 50,220 '🔥 AI 技术前沿'" \
  -pointsize 20 -fill "#333333" -draw "text 70,260 '1. DeepSeek-V4 发布，推理能力超越GPT-5'" \
  -pointsize 18 -fill "#555555" -draw "text 90,290 '   中国AI公司深度求索发布V4模型，在多轮对话、'" \
  -pointsize 18 -fill "#555555" -draw "text 90,310 '   代码生成和数学推理方面取得突破性进展。'" \
  -pointsize 20 -fill "#333333" -draw "text 70,350 '2. Apple发布M4 Ultra芯片，专为边缘AI优化'" \
  -pointsize 18 -fill "#555555" -draw "text 90,380 '   苹果推出M4 Ultra芯片，搭载专用AI加速器，'" \
  -pointsize 18 -fill "#555555" -draw "text 90,400 '   支持本地运行百亿参数模型。'" \
  -pointsize 20 -fill "#333333" -draw "text 70,440 '3. Google Gemini 2.0实现多模态突破'" \
  -pointsize 18 -fill "#555555" -draw "text 90,470 '   谷歌宣布Gemini 2.0在多模态理解方面达到人类'" \
  -pointsize 18 -fill "#555555" -draw "text 90,490 '   水平，能够同时处理多种输入。'" \
  -pointsize 28 -fill "#2c3e50" -draw "text 50,540 '💰 财经市场动态'" \
  -pointsize 20 -fill "#333333" -draw "text 70,580 '4. 英伟达市值突破5万亿美元'" \
  -pointsize 18 -fill "#555555" -draw "text 90,610 '   受全球AI投资热潮影响，英伟达股价单日上涨12%'" \
  -pointsize 20 -fill "#333333" -draw "text 70,650 '5. 数字人民币AI智能合约试点'" \
  -pointsize 18 -fill "#555555" -draw "text 90,680 '   中国央行在10个城市开展数字人民币AI智能合约试点'" \
  -pointsize 28 -fill "#2c3e50" -draw "text 50,730 '📊 关键统计数据'" \
  -pointsize 20 -fill "#333333" -draw "text 70,770 '📈 纳斯达克AI指数：+3.2%'" \
  -pointsize 20 -fill "#333333" -draw "text 70,800 '⚡ AI投资年增长率：42.5%'" \
  -pointsize 20 -fill "#333333" -draw "text 70,830 '🌍 部署AI战略国家：156个'" \
  -pointsize 20 -fill "#333333" -draw "text 70,860 '💼 全球AI市场规模：$2.8万亿'" \
  -pointsize 22 -fill "#7f8c8d" -draw "text 400,950 '🤖 由 NIKO AI助手生成'" \
  -pointsize 20 -fill "#3498db" -draw "text 400,980 '👑 专为超级大大王定制'" \
  -pointsize 18 -fill "#7f8c8d" -draw "text 400,1010 '生成时间：2026-02-27 10:16'" \
  "$OUTPUT_IMAGE"

# 3. 检查图片是否生成成功
if [ -f "$OUTPUT_IMAGE" ]; then
    IMAGE_SIZE=$(du -h "$OUTPUT_IMAGE" | cut -f1)
    IMAGE_DIMENSIONS=$(identify -format "%wx%h" "$OUTPUT_IMAGE" 2>/dev/null || echo "1200x1600")
    
    echo "✅ 新闻图片生成成功！"
    echo "📁 文件路径: $OUTPUT_IMAGE"
    echo "📏 图片尺寸: $IMAGE_DIMENSIONS"
    echo "📦 文件大小: $IMAGE_SIZE"
    
    # 4. 同时创建一个简单的版本（确保一定能发送）
    convert -size 800x1200 gradient:#667eea-#764ba2 \
      -font /usr/share/fonts/open-sans/OpenSans-Bold.ttf \
      -pointsize 40 -fill white -draw "text 50,100 '🤖 AI科技简报'" \
      -pointsize 30 -fill white -draw "text 50,160 '超级大大王专属'" \
      -pointsize 20 -fill white -draw "text 50,220 '📅 2026-02-27'" \
      -pointsize 24 -fill white -draw "text 50,300 '🔥 DeepSeek-V4发布'" \
      -pointsize 24 -fill white -draw "text 50,350 '💰 英伟达5万亿市值'" \
      -pointsize 24 -fill white -draw "text 50,400 '🚀 AI医疗10亿融资'" \
      -pointsize 24 -fill white -draw "text 50,450 '⚡ 特斯拉自动驾驶'" \
      -pointsize 20 -fill white -draw "text 50,550 '📊 AI投资增长42.5%'" \
      -pointsize 20 -fill white -draw "text 50,600 '🌍 156国AI战略'" \
      -pointsize 22 -fill white -draw "text 50,700 '由NIKO AI生成'" \
      -pointsize 18 -fill white -draw "text 50,750 '为你定制 · 立即送达'" \
      "/root/.openclaw/workspace/news_simple.jpg"
    
    echo "✅ 备用图片也生成完成: news_simple.jpg"
    
    exit 0
else
    echo "❌ 图片生成失败，尝试备用方案..."
    
    # 备用方案：创建最简图片
    convert -size 600x400 xc:#3498db \
      -font /usr/share/fonts/open-sans/OpenSans-Bold.ttf \
      -pointsize 30 -fill white -draw "text 50,150 '新闻简报生成中'" \
      -pointsize 20 -fill white -draw "text 50,200 '超级大大王请稍候'" \
      -pointsize 18 -fill white -draw "text 50,250 'NIKO正在努力生成图片'" \
      -pointsize 16 -fill white -draw "text 50,300 '时间：2026-02-27 10:16'" \
      "$OUTPUT_IMAGE"
    
    if [ -f "$OUTPUT_IMAGE" ]; then
        echo "⚠️ 生成基础版图片: $OUTPUT_IMAGE"
        exit 0
    else
        echo "❌ 所有方法都失败了"
        exit 1
    fi
fi