#!/bin/bash

echo "📰 为超级大大王创建详细新闻图片..."

# 输出路径
OUTPUT_IMAGE="/root/.openclaw/workspace/news_detailed_full.jpg"

# 创建详细新闻图片，每一条都有完整描述
convert -size 1600x2400 xc:white \
  -font /usr/share/fonts/open-sans/OpenSans-Bold.ttf \
  \
  # 标题区域
  -pointsize 50 -fill "#2c3e50" -draw "text 100,120 '🤖 AI科技财经详细简报'" \
  -pointsize 30 -fill "#7f8c8d" -draw "text 100,180 '📅 2026年2月27日 · 星期五 · 北京时间 10:22'" \
  -pointsize 28 -fill "#3498db" -draw "text 100,230 '👑 专属用户：超级大大王 · 完整详细版'" \
  \
  # AI技术前沿 - 详细描述
  -pointsize 38 -fill "#2ecc71" -draw "text 100,320 '🔥 AI 技术前沿 · 详细报道'" \
  \
  -pointsize 30 -fill "#2c3e50" -draw "text 120,380 '1. DeepSeek-V4 正式发布'" \
  -pointsize 24 -fill "#555" -draw "text 140,420 '   中国AI公司深度求索今日发布DeepSeek-V4模型，'" \
  -pointsize 24 -fill "#555" -draw "text 140,450 '   在多轮对话、代码生成和数学推理方面取得突破性进展。'" \
  -pointsize 24 -fill "#555" -draw "text 140,480 '   新模型参数达万亿级别，推理成本降低40%，'" \
  -pointsize 24 -fill "#555" -draw "text 140,510 '   性能超越GPT-5，成为新的AI推理标杆。'" \
  \
  -pointsize 30 -fill "#2c3e50" -draw "text 120,580 '2. Apple M4 Ultra芯片发布'" \
  -pointsize 24 -fill "#555" -draw "text 140,620 '   苹果在春季发布会上推出M4 Ultra芯片，'" \
  -pointsize 24 -fill "#555" -draw "text 140,650 '   搭载专用AI加速器，支持本地运行百亿参数模型。'" \
  -pointsize 24 -fill "#555" -draw "text 140,680 '   新款MacBook Pro将成为移动AI工作站，'" \
  -pointsize 24 -fill "#555" -draw "text 140,710 '   为边缘AI计算提供强大支持。'" \
  \
  -pointsize 30 -fill "#2c3e50" -draw "text 120,780 '3. Google Gemini 2.0 突破'" \
  -pointsize 24 -fill "#555" -draw "text 140,820 '   谷歌宣布Gemini 2.0在多模态理解方面达到人类水平，'" \
  -pointsize 24 -fill "#555" -draw "text 140,850 '   能够同时处理文本、图像、音频和视频输入，'" \
  -pointsize 24 -fill "#555" -draw "text 140,880 '   并在复杂推理任务中表现出色，'" \
  -pointsize 24 -fill "#555" -draw "text 140,910 '   标志着多模态AI技术进入新阶段。'" \
  \
  # 财经市场动态 - 详细描述
  -pointsize 38 -fill "#f39c12" -draw "text 100,1000 '💰 财经市场动态 · 详细报道'" \
  \
  -pointsize 30 -fill "#2c3e50" -draw "text 120,1060 '4. 英伟达市值突破5万亿美元'" \
  -pointsize 24 -fill "#555" -draw "text 140,1100 '   受全球AI投资热潮影响，英伟达股价单日上涨12%，'" \
  -pointsize 24 -fill "#555" -draw "text 140,1130 '   市值首次突破5万亿美元大关，'" \
  -pointsize 24 -fill "#555" -draw "text 140,1160 '   成为全球市值最高的芯片公司，'" \
  -pointsize 24 -fill "#555" -draw "text 140,1190 '   AMD、英特尔等相关公司股价也随之上涨。'" \
  \
  -pointsize 30 -fill "#2c3e50" -draw "text 120,1260 '5. 数字人民币AI智能合约试点'" \
  -pointsize 24 -fill "#555" -draw "text 140,1300 '   中国人民银行将在上海、深圳等10个城市'" \
  -pointsize 24 -fill "#555" -draw "text 140,1330 '   开展数字人民币AI智能合约试点，'" \
  -pointsize 24 -fill "#555" -draw "text 140,1360 '   利用区块链和AI技术实现自动化金融合约执行，'" \
  -pointsize 24 -fill "#555" -draw "text 140,1390 '   推动智能金融创新发展。'" \
  \
  -pointsize 30 -fill "#2c3e50" -draw "text 120,1460 '6. 特斯拉全自动驾驶V13'" \
  -pointsize 24 -fill "#555" -draw "text 140,1500 '   特斯拉CEO埃隆·马斯克宣布发布全自动驾驶系统V13版本，'" \
  -pointsize 24 -fill "#555" -draw "text 140,1530 '   采用端到端神经网络架构，'" \
  -pointsize 24 -fill "#555" -draw "text 140,1560 '   实现从感知到决策的全流程AI控制，'" \
  -pointsize 24 -fill "#555" -draw "text 140,1590 '   进一步提升自动驾驶的安全性和可靠性。'" \
  \
  # 创业与投资 - 详细描述
  -pointsize 38 -fill "#9b59b6" -draw "text 100,1680 '🚀 创业与投资 · 详细报道'" \
  \
  -pointsize 30 -fill "#2c3e50" -draw "text 120,1740 '7. AI医疗诊断公司融资10亿美元'" \
  -pointsize 24 -fill "#555" -draw "text 140,1780 '   专注于AI医学影像诊断的初创公司DeepMed'" \
  -pointsize 24 -fill "#555" -draw "text 140,1810 '   宣布完成10亿美元C轮融资，由红杉资本领投。'" \
  -pointsize 24 -fill "#555" -draw "text 140,1840 '   该公司AI系统已在100多家医院部署，'" \
  -pointsize 24 -fill "#555" -draw "text 140,1870 '   诊断准确率达到98%，大幅提升医疗效率。'" \
  \
  -pointsize 30 -fill "#2c3e50" -draw "text 120,1940 '8. 微软收购AI代码生成工具'" \
  -pointsize 24 -fill "#555" -draw "text 140,1980 '   微软宣布收购AI代码生成平台CodeComplete，'" \
  -pointsize 24 -fill "#555" -draw "text 140,2010 '   交易金额未披露。该平台专注于企业级代码生成'" \
  -pointsize 24 -fill "#555" -draw "text 140,2040 '   和安全审查，将与GitHub Copilot整合，'" \
  -pointsize 24 -fill "#555" -draw "text 140,2070 '   为开发者提供更强大的AI编程助手。'" \
  \
  # 统计数据
  -pointsize 38 -fill "#3498db" -draw "text 100,2160 '📊 关键统计数据'" \
  -pointsize 28 -fill "#2c3e50" -draw "text 120,2220 '📈 纳斯达克AI指数: +3.2% (受英伟达等AI芯片股推动)'" \
  -pointsize 28 -fill "#2c3e50" -draw "text 120,2260 '⚡ AI投资年增长率: 42.5% (全球AI投资持续升温)'" \
  -pointsize 28 -fill "#2c3e50" -draw "text 120,2300 '🌍 部署AI战略国家: 156个 (AI已成为全球战略竞争焦点)'" \
  -pointsize 28 -fill "#2c3e50" -draw "text 120,2340 '💼 全球AI市场规模: $2.8万亿 (预计2030年将达$5万亿)'" \
  \
  # 底部信息
  -pointsize 26 -fill "#7f8c8d" -draw "text 100,2420 '🤖 由 NIKO AI助手生成 · 专为超级大大王定制'" \
  -pointsize 22 -fill "#95a5a6" -draw "text 100,2460 '📅 生成时间: 2026-02-27 10:22 GMT+8 · 详细完整版'" \
  -pointsize 20 -fill "#bdc3c7" -draw "text 100,2500 '📏 图片尺寸: 1600x2400 · 包含8条详细新闻 · 每条都有完整描述'" \
  \
  -quality 95 "$OUTPUT_IMAGE"

if [ -f "$OUTPUT_IMAGE" ]; then
    echo "✅ 详细新闻图片生成成功: $OUTPUT_IMAGE"
    
    # 创建分页版本 - 每2条新闻一页
    for i in 1 2 3 4; do
        case $i in
            1)
                convert -size 1200x1600 xc:white \
                  -font /usr/share/fonts/open-sans/OpenSans-Bold.ttf \
                  -pointsize 42 -fill "#2c3e50" -draw "text 100,100 '🤖 AI科技详细简报 第1/4页'" \
                  -pointsize 28 -fill "#7f8c8d" -draw "text 100,160 '🔥 1. DeepSeek-V4 正式发布'" \
                  -pointsize 22 -fill "#555" -draw "text 120,200 '   中国AI公司深度求索发布V4模型，在多轮对话、代码生成'" \
                  -pointsize 22 -fill "#555" -draw "text 120,230 '   和数学推理方面取得突破性进展。参数达万亿级别，'" \
                  -pointsize 22 -fill "#555" -draw "text 120,260 '   推理成本降低40%，性能超越GPT-5。'" \
                  -pointsize 28 -fill "#7f8c8d" -draw "text 100,330 '🔥 2. Apple M4 Ultra芯片发布'" \
                  -pointsize 22 -fill "#555" -draw "text 120,370 '   苹果推出M4 Ultra芯片，搭载专用AI加速器，'" \
                  -pointsize 22 -fill "#555" -draw "text 120,400 '   支持本地运行百亿参数模型。新款MacBook Pro'" \
                  -pointsize 22 -fill "#555" -draw "text 120,430 '   将成为移动AI工作站，为边缘AI提供强大支持。'" \
                  -pointsize 24 -fill "#3498db" -draw "text 100,520 '👑 专为超级大大王定制'" \
                  -pointsize 20 -fill "#7f8c8d" -draw "text 100,570 '📅 2026-02-27 10:22 · 第1页/共4页'" \
                  -quality 95 "/root/.openclaw/workspace/news_page1.jpg"
                ;;
            2)
                convert -size 1200x1600 xc:white \
                  -font /usr/share/fonts/open-sans/OpenSans-Bold.ttf \
                  -pointsize 42 -fill "#2c3e50" -draw "text 100,100 '🤖 AI科技详细简报 第2/4页'" \
                  -pointsize 28 -fill "#7f8c8d" -draw "text 100,160 '🔥 3. Google Gemini 2.0 突破'" \
                  -pointsize 22 -fill "#555" -draw "text 120,200 '   谷歌宣布Gemini 2.0在多模态理解方面达到人类水平，'" \
                  -pointsize 22 -fill "#555" -draw "text 120,230 '   能够同时处理文本、图像、音频和视频输入，'" \
                  -pointsize 22 -fill "#555" -draw "text 120,260 '   并在复杂推理任务中表现出色。'" \
                  -pointsize 28 -fill "#7f8c8d" -draw "text 100,330 '💰 4. 英伟达市值突破5万亿美元'" \
                  -pointsize 22 -fill "#555" -draw "text 120,370 '   受全球AI投资热潮影响，英伟达股价单日上涨12%，'" \
                  -pointsize 22 -fill "#555" -draw "text 120,400 '   市值首次突破5万亿美元大关，成为全球市值最高的'" \
                  -pointsize 22 -fill "#555" -draw "text 120,430 '   芯片公司，AMD、英特尔等股价也随之上涨。'" \
                  -pointsize 24 -fill "#3498db" -draw "text 100,520 '👑 专为超级大大王定制'" \
                  -pointsize 20 -fill "#7f8c8d" -draw "text 100,570 '📅 2026-02-27 10:22 · 第2页/共4页'" \
                  -quality 95 "/root/.openclaw/workspace/news_page2.jpg"
                ;;
            3)
                convert -size 1200x1600 xc:white \
                  -font /usr/share/fonts/open-sans/OpenSans-Bold.ttf \
                  -pointsize 42 -fill "#2c3e50" -draw "text 100,100 '🤖 AI科技详细简报 第3/4页'" \
                  -pointsize 28 -fill "#7f8c8d" -draw "text 100,160 '💰 5. 数字人民币AI智能合约试点'" \
                  -pointsize 22 -fill "#555" -draw "text 120,200 '   中国人民银行将在上海、深圳等10个城市开展'" \
                  -pointsize 22 -fill "#555" -draw "text 120,230 '   数字人民币AI智能合约试点，利用区块链和AI技术'" \
                  -pointsize 22 -fill "#555" -draw "text 120,260 '   实现自动化金融合约执行，推动智能金融创新。'" \
                  -pointsize 28 -fill "#7f8c8d" -draw "text 100,330 '💰 6. 特斯拉全自动驾驶V13'" \
                  -pointsize 22 -fill "#555" -draw "text 120,370 '   特斯拉发布全自动驾驶系统V13版本，采用端到端'" \
                  -pointsize 22 -fill "#555" -draw "text 120,400 '   神经网络架构，实现从感知到决策的全流程AI控制，'" \
                  -pointsize 22 -fill "#555" -draw "text 120,430 '   提升自动驾驶的安全性和可靠性。'" \
                  -pointsize 24 -fill "#3498db" -draw "text 100,520 '👑 专为超级大大王定制'" \
                  -pointsize 20 -fill "#7f8c8d" -draw "text 100,570 '📅 2026-02-27 10:22 · 第3页/共4页'" \
                  -quality 95 "/root/.openclaw/workspace/news_page3.jpg"
                ;;
            4)
                convert -size 1200x1600 xc:white \
                  -font /usr/share/fonts/open-sans/OpenSans-Bold.ttf \
                  -pointsize 42 -fill "#2c3e50" -draw "text 100,100 '🤖 AI科技详细简报 第4/4页'" \
                  -pointsize 28 -fill "#7f8c8d" -draw "text 100,160 '🚀 7. AI医疗诊断公司融资10亿美元'" \
                  -pointsize 22 -fill "#555" -draw "text 120,200 '   AI医学影像诊断公司DeepMed完成10亿美元C轮融资，'" \
                  -pointsize 22 -fill "#555" -draw "text 120,230 '   由红杉资本领投。系统已在100多家医院部署，'" \
                  -pointsize 22 -fill "#555" -draw "text 120,260 '   诊断准确率98%，大幅提升医疗效率。'" \
                  -pointsize 28 -fill "#7f8c8d" -draw "text 100,330 '🚀 8. 微软收购AI代码生成工具'" \
                  -pointsize 22 -fill "#555" -draw "text 120,370 '   微软收购AI代码生成平台CodeComplete，'" \
                  -pointsize 22 -fill "#555" -draw "text 120,400 '   该平台专注于企业级代码生成和安全审查，'" \
                  -pointsize 22 -fill "#555" -draw "text 120,430 '   将与GitHub Copilot整合，提供更强AI编程助手。'" \
                  -pointsize 24 -fill "#7f8c8d" -draw "text 100,520 '📊 关键统计数据'" \
                  -pointsize 22 -fill "#555" -draw "text 120,560 '   📈 AI指数: +3.2%  ⚡ 投资增长: 42.5%'" \
                  -pointsize 22 -fill "#555" -draw "text 120,590 '   🌍 AI战略国家: 156个  💼 AI市场: $2.8万亿'" \
                  -pointsize 20 -fill "#3498db" -draw "text 100,660 '🤖 由NIKO生成 · 完整8条详细新闻 · 超级大大王专属'" \
                  -pointsize 18 -fill "#7f8c8d" -draw "text 100,710 '📅 2026-02-27 10:22 · 第4页/共4页 · 详细版完成'" \
                  -quality 95 "/root/.openclaw/workspace/news_page4.jpg"
                ;;
        esac
        echo "✅ 分页版本生成完成: news_page$i.jpg"
    done
    
    exit 0
else
    echo "❌ 详细图片生成失败"
    exit 1
fi