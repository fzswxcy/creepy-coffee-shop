# Omni_Intelligence_Radar (全渠道情报雷达)

为OpenClaw打造的综合搜索与抓取API集成工具，专为深度技术情报收集设计。

## 🎯 核心功能

### 模块1: 全网广度搜索引擎 (The Radar)
- **Tavily API**: AI优化的搜索引擎，专用于科技新闻和AI内容
- **Bing Search API**: 支持`site:`语法，可限制搜索到特定厂商域名
- **SerpApi (备用)**: 多搜索引擎API，支持Google、Bing等

### 模块2: 微信生态与特定源订阅 (The Feed)
- **RSSHub**: 无需API Key，支持微信公众号、知乎、微博等平台RSS转换
- 可订阅大厂技术公众号、知乎专栏、GitHub趋势等

### 模块3: 深度网页阅读与反爬穿透 (The Extractor)
- **Jina Reader API**: 免费公共端点，获取干净的Markdown文本
- **Firecrawl**: 抓取JavaScript渲染的动态页面，穿透反爬机制

### 主控工作流
- **智能搜索策略**: 先广度搜索，再深度提取
- **多引擎融合**: 结合Tavily的AI优化和Bing的精确过滤
- **内容分析**: 自动提取关键词、统计内容长度、生成建议

## 🚀 快速开始

### 1. 安装依赖
```bash
pip install requests
```

### 2. 申请API Key

**必需申请的API Key平台**:

| API | 平台 | 价格 | 备注 |
|-----|------|------|------|
| **Tavily** | https://app.tavily.com/ | 免费版可用 | AI优化的搜索引擎 |
| **Bing Search** | https://portal.azure.com/ | 免费1000次/月 | 支持site:语法 |
| **Firecrawl** | https://firecrawl.dev/ | 免费100点/月 | 抓取JS动态页面 |
| **SerpApi** | https://serpapi.com/ | 免费100次/月 | 备用方案 |

**无需API Key**:
- Jina Reader: https://r.jina.ai/ (免费公共端点)
- RSSHub: https://rsshub.app/ (开源RSS聚合器)

### 3. 创建配置文件
创建 `omni_intelligence_config.json`:
```json
{
  "tavily_api_key": "tvly-xxxxxxxxxxxx",
  "bing_api_key": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "firecrawl_api_key": "fc-xxxxxxxxxxxx",
  "serpapi_api_key": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "rsshub_base_url": "https://rsshub.app"
}
```

### 4. 基础使用
```python
from Omni_Intelligence_Radar import OmniIntelligenceRadar

# 加载配置
config = {
    "tavily_api_key": "your_key",
    "bing_api_key": "your_key",
    "firecrawl_api_key": "your_key"
}

# 创建雷达实例
radar = OmniIntelligenceRadar(config)

# 搜索火山引擎关于OpenClaw的文档
result = radar.gather_vendor_intelligence("OpenClaw", "volcengine")

# 查看结果
print(f"找到 {result['summary']['total_urls_found']} 个URL")
print(f"成功提取 {result['summary']['successfully_extracted']} 个文档")
print(f"高频词: {result['analysis']['top_keywords']}")
```

### 5. 高级用法
```python
# 单独使用各模块
tavily_result = radar.search_with_tavily("AI news 2025")
bing_result = radar.search_with_bing("OpenClaw", "site:volcengine.com")
jina_result = radar.read_with_jina("https://example.com/article")
firecrawl_result = radar.scrape_with_firecrawl("https://dynamic-page.com")
rss_result = radar.fetch_rsshub_feed("/github/trending/daily")

# 批量提取
urls = ["https://example.com/1", "https://example.com/2"]
for url in urls:
    content = radar.read_with_jina(url)
    print(f"提取 {url}: {len(content.get('content', ''))} 字符")
```

## 📊 厂商域名映射

系统内置厂商域名映射，支持以下厂商：

| 厂商 | 域名 | 示例查询 |
|------|------|----------|
| 火山引擎 | volcengine.com | `site:volcengine.com` |
| 腾讯云 | cloud.tencent.com | `site:cloud.tencent.com` |
| 百度智能云 | cloud.baidu.com | `site:cloud.baidu.com` |
| 阿里云 | aliyun.com | `site:aliyun.com` |
| 华为云 | huaweicloud.com | `site:huaweicloud.com` |
| 字节跳动 | bytedance.com | `site:bytedance.com` |

## 🔧 与OpenClaw集成

### 作为独立Skill
```python
# 在OpenClaw Skill中调用
from omni_intelligence_radar_demo import omni_intelligence_search

result = omni_intelligence_search("ArkClaw", "volcengine")
```

### 配置OpenClaw Skill
创建Skill目录结构:
```
~/.openclaw/workspace/skills/omni-intelligence-radar/
├── SKILL.md
├── __init__.py
├── omni_intelligence.py (主文件)
└── config.json (API Key配置)
```

### Skill接口函数
```python
# 标准接口
def search_tech_news(keyword: str) -> str:
    """搜索科技新闻"""
    result = radar.gather_vendor_intelligence(keyword)
    return format_as_markdown(result)

def extract_web_content(url: str) -> str:
    """提取网页内容"""
    result = radar.read_with_jina(url)
    return result.get('content', '')
```

## 📈 输出格式

### 结构化JSON输出
```json
{
  "success": true,
  "query": {
    "keyword": "OpenClaw",
    "vendor": "volcengine",
    "timestamp": "2026-03-10T09:56:00"
  },
  "search_phase": {
    "tavily": {...},
    "bing": {...}
  },
  "extraction_phase": {
    "urls_processed": 10,
    "successful_extractions": 8,
    "contents": [...]
  },
  "analysis": {
    "total_content_length": 45000,
    "average_content_length": 5625,
    "top_keywords": [...]
  },
  "summary": {
    "total_urls_found": 15,
    "successfully_extracted": 8,
    "recommendation": "收集到8个高质量文档..."
  }
}
```

### Markdown报告
系统可自动生成Markdown格式报告，包含：
- 搜索摘要
- 内容统计
- 高频关键词
- 执行建议

## 🛡️ 错误处理与容错

系统具备多层容错机制：

1. **API降级**: Bing失败 → SerpApi降级
2. **提取降级**: Jina失败 → Firecrawl降级
3. **超时重试**: 自动超时控制
4. **错误隔离**: 单个URL失败不影响整体流程
5. **详细日志**: 完整执行日志记录

## 📋 使用场景

### 场景1: 验证厂商技术公告
```python
# 验证火山引擎是否发布ArkClaw
result = radar.gather_vendor_intelligence("ArkClaw", "volcengine")
if result['summary']['successfully_extracted'] > 0:
    print("✅ 确认火山引擎有相关文档")
```

### 场景2: 监控竞争对手动态
```python
# 监控腾讯云AI产品更新
result = radar.gather_vendor_intelligence("QClaw", "tencent")
if result['analysis']['total_content_length'] > 10000:
    print("⚠️ 检测到腾讯云有大量相关文档")
```

### 场景3: 技术趋势分析
```python
# 分析AI领域热门话题
result = radar.search_with_tavily("AI framework 2025")
top_words = result.get('analysis', {}).get('top_keywords', [])
print(f"热门词汇: {top_words}")
```

### 场景4: RSS订阅监控
```python
# 订阅科技公众号
rss_result = radar.fetch_rsshub_feed("/wechat/category/科技")
latest_urls = rss_result.get('urls', [])[:5]
for url in latest_urls:
    content = radar.read_with_jina(url)
    print(f"新文章: {content.get('content', '')[:100]}...")
```

## 🔄 与现有Skill集成

可与以下现有Skill配合使用：

1. **easy-search**: 补充无API Key的基础搜索
2. **find-rss**: 自动发现RSS源
3. **scrape**: 法律合规的网页抓取
4. **summarize**: 对提取内容进行摘要

## 🧪 测试示例

运行演示脚本:
```bash
python omni_intelligence_radar_demo.py
```

测试各个模块:
```bash
# 测试Tavily搜索
python -c "from Omni_Intelligence_Radar import OmniIntelligenceRadar; r = OmniIntelligenceRadar(); print(r.search_with_tavily('AI news'))"

# 测试Jina Reader
python -c "from Omni_Intelligence_Radar import OmniIntelligenceRadar; r = OmniIntelligenceRadar(); print(r.read_with_jina('https://example.com'))"
```

## 📚 技术文档

### API限制与配额
- **Tavily**: 免费版有限制，付费版无限
- **Bing Search**: 免费1000次/月，之后按量计费
- **Firecrawl**: 免费100点/月，1点≈1次请求
- **Jina Reader**: 无官方限制，但可能有速率限制
- **RSSHub**: 开源自托管，无限制

### 性能优化
1. **并发控制**: 自动控制请求频率，避免被封
2. **缓存机制**: 可添加Redis缓存减少重复请求
3. **结果去重**: 自动去除重复URL
4. **内容压缩**: 长内容自动截断，节省存储

### 安全考虑
1. **API Key保护**: 建议使用环境变量或加密存储
2. **请求限制**: 自动遵守各API的速率限制
3. **内容过滤**: 可选的内容安全过滤
4. **隐私保护**: 不记录敏感查询历史

## 🚨 注意事项

1. **法律合规**: 确保遵守目标网站的robots.txt和条款
2. **API配额**: 监控各API的使用量，避免超限
3. **网络延迟**: 海外API可能有网络延迟，适当调整超时时间
4. **内容版权**: 尊重内容版权，仅用于个人学习和研究

## 📞 支持与反馈

如有问题或建议，请联系:
- GitHub Issues: [提交问题](https://github.com/your-repo/issues)
- 邮件: support@example.com

## 📄 许可证

MIT License - 详见LICENSE文件

---

**Omni_Intelligence_Radar** - 为OpenClaw打造的全渠道情报收集系统，帮助您实时掌握技术动态，深度分析竞争情报，做出更明智的技术决策。