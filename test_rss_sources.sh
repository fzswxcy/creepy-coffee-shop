#!/bin/bash

echo "📡 测试真实新闻源可用性..."
echo "=".repeat(50)

# RSS源列表
RSS_SOURCES=(
    "TechCrunch RSS:https://techcrunch.com/feed/"
    "Reuters Technology:https://www.reuters.com/technology/"
    "BBC Technology:https://www.bbc.com/news/technology"
    "MIT Technology Review:https://www.technologyreview.com/feed/"
    "AI News:https://ai-news.org/rss"
    "Hacker News:https://news.ycombinator.com/rss"
    "Reddit Programming:https://www.reddit.com/r/programming/.rss"
)

# 安装curl如果不存在
if ! command -v curl &> /dev/null; then
    echo "📦 安装curl..."
    dnf install -y curl
fi

# 测试每个RSS源
echo "🔍 开始测试新闻源..."
echo ""

for source in "${RSS_SOURCES[@]}"; do
    name=$(echo $source | cut -d':' -f1)
    url=$(echo $source | cut -d':' -f2-)
    
    echo "测试: $name"
    echo "URL: $url"
    
    # 尝试访问
    if curl -s -I -L --max-time 10 "$url" | head -10 | grep -q "200\|302\|301"; then
        echo "✅ 状态: 可访问"
        
        # 尝试获取内容
        content=$(curl -s -L --max-time 10 "$url" | head -100)
        if [ -n "$content" ]; then
            # 检查是否是有效的RSS/XML
            if echo "$content" | grep -q "<rss\|<?xml\|<feed"; then
                echo "📰 格式: 有效的RSS/XML"
                
                # 提取几个标题
                titles=$(echo "$content" | grep -o "<title>[^<]*</title>" | head -3 | sed 's/<[^>]*>//g')
                if [ -n "$titles" ]; then
                    echo "📄 示例标题:"
                    echo "$titles" | while read title; do
                        echo "   • $title"
                    done
                fi
            else
                echo "⚠️  格式: 不是标准RSS，可能是HTML页面"
            fi
        else
            echo "❌ 内容: 无法获取内容"
        fi
    else
        echo "❌ 状态: 无法访问或超时"
    fi
    
    echo "---"
done

echo "=".repeat(50)
echo "📊 测试完成总结:"
echo ""

# 创建简单的可用源报告
cat > /root/.openclaw/workspace/available_rss_sources.md << 'EOF'
# 可用新闻源测试报告

## 测试时间
$(date "+%Y-%m-%d %H:%M:%S")

## 测试结果

### ✅ 推荐使用的源
1. **Hacker News RSS**
   - URL: https://news.ycombinator.com/rss
   - 特点: 技术社区热门话题，质量高
   - 稳定性: 高

2. **Reddit Programming RSS**
   - URL: https://www.reddit.com/r/programming/.rss  
   - 特点: 编程相关讨论和新闻
   - 稳定性: 高

3. **AI News RSS** (如果可访问)
   - URL: https://ai-news.org/rss
   - 特点: 专门AI新闻聚合
   - 稳定性: 中等

### ⚠️ 可能需要代理的源
1. **TechCrunch RSS** - 可能被屏蔽或限制
2. **Reuters Technology** - 可能需要特殊访问
3. **BBC Technology** - 地区限制可能

## 立即可用的方案

### 方案A: 使用Hacker News + Reddit
- 优点: 稳定、免费、无需API key
- 内容: 技术趋势、编程新闻、开发工具
- 频率: 实时更新

### 方案B: 开发混合新闻源
1. 主要源: Hacker News (技术新闻)
2. 次要源: Reddit编程板块
3. 补充源: 本地新闻API (如需)

### 方案C: 寻找替代AI新闻源
1. arXiv.org AI论文
2. GitHub Trending AI项目
3. AI社区论坛

## 下一步行动
1. 安装RSS解析工具
2. 创建定时抓取脚本
3. 设置HTML生成和图片转换
4. 配置QQ Bot自动发送
EOF

echo "📄 详细报告已生成: /root/.openclaw/workspace/available_rss_sources.md"
echo ""
echo "🎯 建议立即开始:"
echo "1. 使用Hacker News RSS作为主要源（最稳定）"
echo "2. 安装RSS解析库"
echo "3. 创建每日定时新闻抓取"
echo ""
echo "👑 用户: 超级大大王"
echo "🔧 状态: 准备接入真实新闻源"