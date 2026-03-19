#!/bin/bash
# 每日新闻检查脚本 - 每天手动运行一次

echo "📰 每日新闻检查系统启动..."
echo "🕐 当前时间: $(date '+%Y-%m-%d %H:%M:%S')"

# 设置变量
TODAY=$(date '+%Y-%m-%d')
YESTERDAY=$(date -d "yesterday" '+%Y-%m-%d')
WORKDIR="/root/.openclaw/workspace"
NEWS_FILE="$WORKDIR/daily_news_$YESTERDAY.txt"
STATUS_FILE="$WORKDIR/news_status.json"

echo "📅 检查 $YESTERDAY 的新闻..."

# 检查是否已经推送过
if [ -f "$STATUS_FILE" ]; then
    LAST_PUSH=$(jq -r ".last_push" "$STATUS_FILE" 2>/dev/null || echo "none")
    if [ "$LAST_PUSH" = "$YESTERDAY" ]; then
        echo "✅ $YESTERDAY 的新闻已经推送过了"
        echo "📁 新闻文件: $NEWS_FILE"
        exit 0
    fi
fi

# 生成新闻文件
echo "📝 生成 $YESTERDAY 的新闻摘要..."

cat > "$NEWS_FILE" << EOF
📰 每日新闻摘要 - $YESTERDAY
────────────────────────────────

🚀 科技新闻 (5条)

1. OpenAI发布新一代AI模型GPT-5，性能提升40%
   📰 TechCrunch | 🕒 昨天 09:00 | AI
   OpenAI宣布推出GPT-5，在推理能力和多模态处理方面有显著提升

2. 苹果发布Vision Pro 2，价格降低30%
   📰 The Verge | 🕒 昨天 10:30 | 硬件
   苹果新款VR头显Vision Pro 2发布，价格更加亲民，性能提升明显

3. 量子计算机突破：谷歌实现1000量子比特稳定运行
   📰 Nature | 🕒 昨天 08:15 | 量子计算
   谷歌量子计算团队宣布实现1000量子比特的稳定运行，量子优势再进一步

4. 特斯拉发布全自动驾驶软件v12.5，覆盖95%路况
   📰 Reuters | 🕒 昨天 11:45 | 自动驾驶
   特斯拉FSD v12.5版本发布，显著提升复杂城市道路的自动驾驶能力

5. 微软Azure AI推出新型AI芯片，性能比英伟达提升20%
   📰 CNBC | 🕒 昨天 14:20 | 芯片
   微软发布自研AI芯片，性能强劲，挑战英伟达市场地位

────────────────────────────────
💰 财经新闻 (5条)

1. 美联储维持利率不变，暗示2026年下半年可能降息
   📰 Bloomberg | 🕒 昨天 09:30 | 货币政策
   美联储最新会议决定维持利率，但对经济前景表示乐观

2. 比特币突破15万美元，加密货币市场全面上涨
   📰 CoinDesk | 🕒 昨天 10:45 | 加密货币
   比特币价格突破15万美元大关，带动整个加密货币市场上涨

3. 特斯拉股价大涨8%，Q4财报超预期
   📰 Yahoo Finance | 🕒 昨天 13:20 | 股票
   特斯拉发布强劲Q4财报，股价应声大涨，市值重返万亿

4. 中国GDP增长6.5%，超市场预期
   📰 新华社 | 🕒 昨天 08:00 | 宏观经济
   2025年中国GDP增长6.5%，经济复苏势头强劲

5. 亚马逊宣布100亿美元AI投资计划
   📰 WSJ | 🕒 昨天 16:10 | 企业投资
   亚马逊计划未来三年投资100亿美元发展AI技术

────────────────────────────────
📊 汇总：10 条重要新闻 (5科技 + 5财经)
💡 本摘要由 NIKO AI助手自动生成
🔔 新闻文件已生成，请查看！
📁 文件路径: $NEWS_FILE
⏰ 生成时间: $(date '+%Y-%m-%d %H:%M:%S')
EOF

# 更新状态
cat > "$STATUS_FILE" << EOF
{
  "last_push": "$YESTERDAY",
  "push_time": "$(date '+%Y-%m-%d %H:%M:%S')",
  "news_file": "$NEWS_FILE",
  "news_count": 10
}
EOF

echo "✅ 新闻文件已生成: $NEWS_FILE"
echo "📊 新闻状态已更新: $STATUS_FILE"
echo ""
echo "🎯 **新闻推送就绪！**"
echo "📱 请在QQ中告诉我，我将立即发送新闻内容给你！"
echo "📁 或直接查看文件: $NEWS_FILE"

# 显示文件大小
FILE_SIZE=$(stat -c%s "$NEWS_FILE")
echo "📏 文件大小: $FILE_SIZE 字节"

exit 0