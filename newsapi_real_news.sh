#!/bin/bash
# NewsAPI真实新闻推送脚本

echo "🚀 NewsAPI真实新闻系统启动..."
echo "📅 日期: $(date '+%Y-%m-%d %H:%M:%S')"

# 检查配置
CONFIG_FILE="/root/.openclaw/workspace/newsapi_config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ NewsAPI配置未找到"
    echo "📋 请先配置API密钥:"
    echo ""
    echo "步骤1: 访问 https://newsapi.org"
    echo "步骤2: 注册免费账户 (500请求/天)"
    echo "步骤3: 获取API密钥"
    echo "步骤4: 创建配置文件:"
    echo ""
    echo 'cat > '"$CONFIG_FILE"' << EOF'
    echo '{'
    echo '  "api_key": "YOUR_NEWSAPI_KEY_HERE",'
    echo '  "language": "zh",'
    echo '  "tech_category": "technology",'
    echo '  "finance_query": "business OR economy OR stock",'
    echo '  "page_size": 5'
    echo '}'
    echo 'EOF'
    echo ""
    exit 1
fi

# 读取配置
API_KEY=$(jq -r '.api_key' "$CONFIG_FILE")
if [ "$API_KEY" = "YOUR_NEWSAPI_KEY_HERE" ] || [ -z "$API_KEY" ]; then
    echo "❌ API密钥未配置"
    echo "请编辑 $CONFIG_FILE 文件，替换 YOUR_NEWSAPI_KEY_HERE 为你的真实API密钥"
    exit 1
fi

echo "✅ API配置正常"
echo "📡 正在连接NewsAPI..."

# 设置日期
YESTERDAY=$(date -d "yesterday" '+%Y-%m-%d')
TODAY=$(date '+%Y-%m-%d')
NEWS_FILE="/root/.openclaw/workspace/real_news_${YESTERDAY}.txt"

echo "📅 获取 $YESTERDAY 的新闻..."
echo "📁 输出文件: $NEWS_FILE"

# 创建Python脚本获取新闻
python3 -c "
import requests
import json
import datetime
import sys

# 读取配置
config_file = '$CONFIG_FILE'
with open(config_file, 'r') as f:
    config = json.load(f)

api_key = config['api_key']
language = config.get('language', 'zh')
tech_category = config.get('tech_category', 'technology')
finance_query = config.get('finance_query', 'business OR economy OR stock')
page_size = config.get('page_size', 5)

yesterday = '$YESTERDAY'
today = '$TODAY'

def fetch_news(url, params):
    '''获取新闻'''
    try:
        response = requests.get(url, params=params, timeout=15)
        if response.status_code == 200:
            return response.json()
        else:
            print(f'❌ API请求失败: {response.status_code}')
            return None
    except Exception as e:
        print(f'❌ 网络错误: {e}')
        return None

def format_time(published_at):
    '''格式化时间'''
    if published_at:
        try:
            dt = datetime.datetime.fromisoformat(published_at.replace('Z', '+00:00'))
            return dt.strftime('%H:%M')
        except:
            return '时间未知'
    return '时间未知'

print('📰 正在获取真实新闻...')

# 1. 获取科技新闻
tech_params = {
    'category': tech_category,
    'language': language,
    'from': yesterday,
    'sortBy': 'popularity',
    'pageSize': page_size,
    'apiKey': api_key
}

tech_data = fetch_news('https://newsapi.org/v2/top-headlines', tech_params)
tech_news = []
if tech_data and 'articles' in tech_data:
    for article in tech_data['articles'][:5]:
        tech_news.append({
            'title': article.get('title', '无标题').replace('"', ''),
            'source': article.get('source', {}).get('name', '未知来源'),
            'time': format_time(article.get('publishedAt')),
            'description': article.get('description', '无描述').replace('"', '')[:100] + '...',
            'url': article.get('url', '#')
        })

# 2. 获取财经新闻
finance_params = {
    'q': finance_query,
    'language': language,
    'from': yesterday,
    'sortBy': 'popularity',
    'pageSize': page_size,
    'apiKey': api_key
}

finance_data = fetch_news('https://newsapi.org/v2/everything', finance_params)
finance_news = []
if finance_data and 'articles' in finance_data:
    for article in finance_data['articles'][:5]:
        finance_news.append({
            'title': article.get('title', '无标题').replace('"', ''),
            'source': article.get('source', {}).get('name', '未知来源'),
            'time': format_time(article.get('publishedAt')),
            'description': article.get('description', '无描述').replace('"', '')[:100] + '...',
            'url': article.get('url', '#')
        })

# 生成报告
report = f'''📰 真实新闻摘要 - {yesterday}
────────────────────────────────

🚀 科技热点新闻 ({len(tech_news)}条)

'''

for i, news in enumerate(tech_news, 1):
    report += f'{i}. {news[\"title\"]}\n'
    report += f'   📰 {news[\"source\"]} | 🕒 {news[\"time\"]}\n'
    report += f'   {news[\"description\"]}\n'
    if news['url'] != '#':
        report += f'   🔗 {news[\"url\"]}\n'
    report += '\n'

report += '''────────────────────────────────
💰 财经热点新闻 (''' + str(len(finance_news)) + '''条)

'''

for i, news in enumerate(finance_news, 1):
    report += f'{i}. {news[\"title\"]}\n'
    report += f'   📰 {news[\"source\"]} | 🕒 {news[\"time\"]}\n'
    report += f'   {news[\"description\"]}\n'
    if news['url'] != '#':
        report += f'   🔗 {news[\"url\"]}\n'
    report += '\n'

report += f'''────────────────────────────────
📊 数据来源: NewsAPI.org
🎯 新闻时效: 昨日热点，今日推送
💡 生成时间: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
📅 参考今天: {today}
'''

# 输出报告
print(report)

# 保存到文件
with open('$NEWS_FILE', 'w', encoding='utf-8') as f:
    f.write(report)

print(f'✅ 真实新闻已保存到: $NEWS_FILE')
"

# 检查文件是否生成
if [ -f "$NEWS_FILE" ]; then
    echo "✅ 真实新闻推送完成!"
    echo "📁 文件: $NEWS_FILE"
    echo "🕐 时间: $(date '+%Y-%m-%d %H:%M:%S')"
else
    echo "❌ 新闻生成失败，请检查配置"
    exit 1
fi

exit 0