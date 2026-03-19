# 新闻API研究

## 免费新闻API选项

### 1. NewsAPI.org
- **描述**：最流行的新闻API，覆盖全球70,000+新闻源
- **免费额度**：500请求/天，100个结果/请求
- **特点**：
  - 支持关键词搜索
  - 支持分类（科技、商业、娱乐、健康等）
  - 支持多语言
  - 按时间排序
- **网址**：https://newsapi.org
- **注册**：需要免费API密钥

### 2. GNews API
- **描述**：专门用于新闻聚合的API
- **免费额度**：100请求/天，20个结果/请求
- **特点**：
  - 响应速度快
  - 简单的JSON格式
  - 支持多种语言
  - 支持搜索和分类
- **网址**：https://gnews.io
- **注册**：需要免费API密钥

### 3. Bing News Search API
- **描述**：微软的新闻搜索API
- **免费额度**：3,000请求/月，50个结果/请求
- **特点**：
  - 高质量的新闻源
  - 支持AI相关内容
  - 强大的搜索过滤
  - 支持趋势新闻
- **网址**：https://azure.microsoft.com/en-us/products/cognitive-services/bing-news-search-api
- **注册**：需要Azure账号

### 4. Currents API (formerly News API)
- **描述**：专门用于新闻内容的API
- **免费额度**：50请求/天
- **特点**：
  - 支持多种语言
  - 支持分类过滤
  - 高质量的新闻源
  - 支持搜索和趋势
- **网址**：https://currentsapi.services
- **注册**：需要API密钥

### 5. RSS订阅（免费）
- **描述**：直接使用网站的RSS源
- **特点**：
  - 完全免费
  - 无需API密钥
  - 但需要解析RSS/Atom格式
  - 可能需要处理反爬虫
- **推荐的RSS源**：
  - 科技类：TechCrunch, The Verge, Wired, Ars Technica
  - 财经类：Bloomberg, Reuters, CNBC, Yahoo Finance
  - 国内：36氪, 虎嗅, 界面新闻, 第一财经

## 推荐方案

### 短期方案：使用RSS订阅
1. **优点**：完全免费，无需注册
2. **缺点**：需要处理多种格式，可能不稳定
3. **实现**：Python + feedparser库

### 中期方案：NewsAPI + RSS混合
1. **优点**：可靠的官方API + 免费RSS补充
2. **缺点**：需要API密钥管理
3. **实现**：优先使用NewsAPI，缺失的用RSS补充

### 长期方案：付费API + 自定义爬虫
1. **优点**：稳定可靠，功能全面
2. **缺点**：有成本
3. **实现**：根据需求选择合适API

## 具体实施建议

### 第一步：先使用RSS订阅测试
1. 实现基本RSS解析功能
2. 收集关键新闻源的RSS地址
3. 测试新闻获取稳定性

### 第二步：注册NewsAPI
1. 申请免费API密钥
2. 集成NewsAPI到系统中
3. 实现备用方案切换

### 第三步：优化和扩展
1. 添加新闻去重
2. 实现智能摘要
3. 添加个性化推荐

## 需要收集的RSS源

### 科技类
- TechCrunch: https://techcrunch.com/feed/
- The Verge: https://www.theverge.com/rss/index.xml
- Wired: https://www.wired.com/feed/rss
- Ars Technica: https://feeds.arstechnica.com/arstechnica/index

### 财经类
- Bloomberg: https://feeds.bloomberg.com/markets/news.rss
- Reuters: https://www.reutersagency.com/feed/?post_type=news
- CNBC: https://www.cnbc.com/id/100003114/device/rss/rss.html
- Yahoo Finance: https://finance.yahoo.com/news/rssindex

### 国内科技
- 36氪: https://36kr.com/feed
- 虎嗅: https://www.huxiu.com/rss/0.xml
- 界面新闻: https://www.jiemian.com/lists/1/rss

## API配置参数
```python
NEWS_API_CONFIG = {
    "newsapi": {
        "api_key": "YOUR_API_KEY",
        "endpoint": "https://newsapi.org/v2/top-headlines",
        "categories": ["technology", "business"],
        "language": "zh"
    },
    "rss_feeds": {
        "technology": [...],
        "finance": [...]
    }
}
```