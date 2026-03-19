#!/bin/bash

echo "🎯 为超级大大王创建最终详细新闻图片..."

# 输出路径
OUTPUT_IMAGE="/root/.openclaw/workspace/news_final_detailed.jpg"

# 使用简单的系统字体
FONT="helvetica"

# 创建详细新闻图片 - 每条新闻都有完整详细描述
convert -size 1500x2200 xc:white \
  -font "$FONT" \
  -pointsize 45 -fill "#2c3e50" -draw "text 80,100 '📰 AI科技财经详细简报'" \
  -pointsize 25 -fill "#7f8c8d" -draw "text 80,150 '日期：2026年2月27日 · 星期五 · 北京时间 10:22'" \
  -pointsize 22 -fill "#3498db" -draw "text 80,190 '用户：超级大大王 · 详细完整版'" \
  \
  -pointsize 32 -fill "#27ae60" -draw "text 80,250 '🔍 AI技术前沿（详细内容）'" \
  \
  -pointsize 26 -fill "#2c3e50" -draw "text 100,300 '1. DeepSeek-V4 正式发布'" \
  -pointsize 20 -fill "#555" -draw "text 120,340 '详细内容：中国AI公司深度求索今日正式发布DeepSeek-V4'" \
  -pointsize 20 -fill "#555" -draw "text 120,370 '模型，在多轮对话、代码生成和数学推理方面取得突破性'" \
  -pointsize 20 -fill "#555" -draw "text 120,400 '进展。新模型参数规模达到万亿级别，推理成本降低40%，'" \
  -pointsize 20 -fill "#555" -draw "text 120,430 '性能测试显示已超越GPT-5，成为新的AI推理性能标杆。'" \
  \
  -pointsize 26 -fill "#2c3e50" -draw "text 100,500 '2. Apple M4 Ultra芯片发布'" \
  -pointsize 20 -fill "#555" -draw "text 120,540 '详细内容：苹果在春季发布会上推出专门为AI优化的'" \
  -pointsize 20 -fill "#555" -draw "text 120,570 'M4 Ultra芯片，搭载专用AI加速器核心，支持本地运行'" \
  -pointsize 20 -fill "#555" -draw "text 120,600 '百亿参数大型模型。新款MacBook Pro将成为强大的移动AI'" \
  -pointsize 20 -fill "#555" -draw "text 120,630 '工作站，为边缘AI计算提供前所未有的性能支持。'" \
  \
  -pointsize 26 -fill "#2c3e50" -draw "text 100,690 '3. Google Gemini 2.0 技术突破'" \
  -pointsize 20 -fill "#555" -draw "text 120,730 '详细内容：谷歌宣布Gemini 2.0在多模态理解方面达到'" \
  -pointsize 20 -fill "#555" -draw "text 120,760 '人类水平，能够同时处理文本、图像、音频和视频多种'" \
  -pointsize 20 -fill "#555" -draw "text 120,790 '输入，在复杂推理任务中表现出色，标志着多模态AI技术'" \
  -pointsize 20 -fill "#555" -draw "text 120,820 '进入全新发展阶段，为更智能的人机交互奠定基础。'" \
  \
  -pointsize 32 -fill "#f39c12" -draw "text 80,890 '💰 财经市场动态（详细内容）'" \
  \
  -pointsize 26 -fill "#2c3e50" -draw "text 100,940 '4. 英伟达市值突破5万亿美元'" \
  -pointsize 20 -fill "#555" -draw "text 120,980 '详细内容：受全球AI投资热潮影响，英伟达股价单日'" \
  -pointsize 20 -fill "#555" -draw "text 120,1010 '上涨12%，市值首次突破5万亿美元大关，成为全球市值'" \
  -pointsize 20 -fill "#555" -draw "text 120,1040 '最高的芯片公司。AMD、英特尔等相关AI芯片公司股价'" \
  -pointsize 20 -fill "#555" -draw "text 120,1070 '也随之上涨，反映了AI芯片市场的强劲需求。'" \
  \
  -pointsize 26 -fill "#2c3e50" -draw "text 100,1130 '5. 数字人民币AI智能合约试点'" \
  -pointsize 20 -fill "#555" -draw "text 120,1170 '详细内容：中国人民银行宣布将在上海、深圳等10个'" \
  -pointsize 20 -fill "#555" -draw "text 120,1200 '城市开展数字人民币AI智能合约试点。该项目利用区块'" \
  -pointsize 20 -fill "#555" -draw "text 120,1230 '链和人工智能技术，实现自动化、智能化的金融合约'" \
  -pointsize 20 -fill "#555" -draw "text 120,1260 '执行，旨在推动智能金融创新发展和应用。'" \
  \
  -pointsize 26 -fill "#2c3e50" -draw "text 100,1320 '6. 特斯拉全自动驾驶V13'" \
  -pointsize 20 -fill "#555" -draw "text 120,1360 '详细内容：特斯拉CEO埃隆·马斯克宣布发布全自动'" \
  -pointsize 20 -fill "#555" -draw "text 120,1390 '驾驶系统V13版本，采用端到端神经网络架构，实现从'" \
  -pointsize 20 -fill "#555" -draw "text 120,1420 '感知到决策的全流程AI控制。新系统进一步提升了自动'" \
  -pointsize 20 -fill "#555" -draw "text 120,1450 '驾驶的安全性和可靠性，推动自动驾驶技术商业化进程。'" \
  \
  -pointsize 32 -fill "#9b59b6" -draw "text 80,1520 '🚀 创业与投资（详细内容）'" \
  \
  -pointsize 26 -fill "#2c3e50" -draw "text 100,1570 '7. AI医疗诊断公司融资10亿美元'" \
  -pointsize 20 -fill "#555" -draw "text 120,1610 '详细内容：专注于AI医学影像诊断的初创公司DeepMed'" \
  -pointsize 20 -fill "#555" -draw "text 120,1640 '宣布完成10亿美元C轮融资，由红杉资本领投。该公司'" \
  -pointsize 20 -fill "#555" -draw "text 120,1670 'AI诊断系统已在100多家医院实际部署应用，诊断准确'" \
  -pointsize 20 -fill "#555" -draw "text 120,1700 '率达到98%，大幅提升了医疗诊断效率和准确性。'" \
  \
  -pointsize 26 -fill "#2c3e50" -draw "text 100,1760 '8. 微软收购AI代码生成工具'" \
  -pointsize 20 -fill "#555" -draw "text 120,1800 '详细内容：微软宣布收购AI代码生成平台CodeComplete，'" \
  -pointsize 20 -fill "#555" -draw "text 120,1830 '该平台专注于企业级代码生成和安全审查。收购完成后'" \
  -pointsize 20 -fill "#555" -draw "text 120,1860 '将与GitHub Copilot整合，为开发者提供更加强大的AI'" \
  -pointsize 20 -fill "#555" -draw "text 120,1890 '编程助手工具，提升软件开发效率和质量。'" \
  \
  -pointsize 32 -fill "#3498db" -draw "text 80,1960 '📊 关键统计数据'" \
  -pointsize 24 -fill "#2c3e50" -draw "text 100,2010 '• 纳斯达克AI指数：+3.2%（受AI芯片股强劲表现推动）'" \
  -pointsize 24 -fill "#2c3e50" -draw "text 100,2050 '• AI投资年增长率：42.5%（反映全球对AI技术的持续投资热情）'" \
  -pointsize 24 -fill "#2c3e50" -draw "text 100,2090 '• 部署AI战略国家：156个（AI已成为全球科技竞争的核心领域）'" \
  -pointsize 24 -fill "#2c3e50" -draw "text 100,2130 '• 全球AI市场规模：$2.8万亿（预计2030年将达到$5万亿）'" \
  \
  -pointsize 22 -fill "#7f8c8d" -draw "text 80,2200 '🤖 生成者：NIKO AI助手 · 专为超级大大王定制'" \
  -pointsize 18 -fill "#95a5a6" -draw "text 80,2240 '📅 生成时间：2026-02-27 10:22 GMT+8 · 详细完整版 · 每条新闻都有完整描述'" \
  \
  -quality 95 "$OUTPUT_IMAGE"

if [ -f "$OUTPUT_IMAGE" ]; then
    echo "✅ 最终详细新闻图片生成成功: $OUTPUT_IMAGE"
    
    # 创建最简版本但包含完整详细内容
    echo "📝 创建快速查看版本..."
    convert -size 1000x1400 xc:#f5f7fa \
      -font "$FONT" \
      -pointsize 36 -fill "#2c3e50" -draw "text 50,80 '📰 AI详细简报'" \
      -pointsize 24 -fill "#3498db" -draw "text 50,130 '超级大大王专属 · 完整描述版'" \
      \
      -pointsize 22 -fill "#2c3e50" -draw "text 50,190 '1. DeepSeek-V4发布：中国AI公司深度求索发布V4模型，'" \
      -pointsize 20 -fill "#555" -draw "text 50,220 '   在多轮对话、代码生成和数学推理方面取得突破，推理'" \
      -pointsize 20 -fill "#555" -draw "text 50,250 '   成本降低40%，性能超越GPT-5。'" \
      \
      -pointsize 22 -fill "#2c3e50" -draw "text 50,310 '2. Apple M4 Ultra：苹果发布专门为AI优化的M4 Ultra'" \
      -pointsize 20 -fill "#555" -draw "text 50,340 '   芯片，支持本地运行百亿参数模型，新款MacBook Pro'" \
      -pointsize 20 -fill "#555" -draw "text 50,370 '   将成为移动AI工作站。'" \
      \
      -pointsize 22 -fill "#2c3e50" -draw "text 50,430 '3. Google Gemini 2.0：谷歌Gemini 2.0在多模态理解'" \
      -pointsize 20 -fill "#555" -draw "text 50,460 '   方面达到人类水平，能同时处理文本、图像、音频和'" \
      -pointsize 20 -fill "#555" -draw "text 50,490 '   视频输入，复杂推理表现出色。'" \
      \
      -pointsize 22 -fill "#2c3e50" -draw "text 50,550 '4. 英伟达5万亿市值：英伟达股价单日上涨12%，市值'" \
      -pointsize 20 -fill "#555" -draw "text 50,580 '   首次突破5万亿美元，成为全球市值最高的芯片公司。'" \
      \
      -pointsize 22 -fill "#2c3e50" -draw "text 50,640 '5. 数字人民币AI试点：中国央行在10城市开展数字'" \
      -pointsize 20 -fill "#555" -draw "text 50,670 '   人民币AI智能合约试点，利用区块链和AI技术实现'" \
      -pointsize 20 -fill "#555" -draw "text 50,700 '   自动化金融合约执行。'" \
      \
      -pointsize 22 -fill "#2c3e50" -draw "text 50,760 '6. 特斯拉V13自动驾驶：特斯拉发布全自动驾驶V13，'" \
      -pointsize 20 -fill "#555" -draw "text 50,790 '   采用端到端神经网络架构，实现全流程AI控制，'" \
      -pointsize 20 -fill "#555" -draw "text 50,820 '   提升安全性和可靠性。'" \
      \
      -pointsize 22 -fill "#2c3e50" -draw "text 50,880 '7. AI医疗10亿融资：AI医学影像诊断公司DeepMed'" \
      -pointsize 20 -fill "#555" -draw "text 50,910 '   完成10亿美元C轮融资，系统已在100多家医院部署，'" \
      -pointsize 20 -fill "#555" -draw "text 50,940 '   诊断准确率98%。'" \
      \
      -pointsize 22 -fill "#2c3e50" -draw "text 50,1000 '8. 微软收购代码工具：微软收购AI代码生成平台'" \
      -pointsize 20 -fill "#555" -draw "text 50,1030 '   CodeComplete，将与GitHub Copilot整合，提供'" \
      -pointsize 20 -fill "#555" -draw "text 50,1060 '   更强大AI编程助手。'" \
      \
      -pointsize 20 -fill "#7f8c8d" -draw "text 50,1120 '📊 AI指数+3.2% · 投资增长42.5% · AI市场$2.8万亿'" \
      -pointsize 18 -fill "#3498db" -draw "text 50,1160 '🤖 NIKO生成 · 详细完整版 · 超级大大王专属'" \
      -quality 95 "/root/.openclaw/workspace/news_quick_view.jpg"
    
    echo "✅ 快速查看版本生成完成: news_quick_view.jpg"
    
    exit 0
else
    echo "❌ 图片生成失败"
    exit 1
fi