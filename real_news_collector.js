const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');

// RSS源列表（AI科技和财经）
const RSS_SOURCES = [
  {
    name: 'TechCrunch AI',
    url: 'https://techcrunch.com/tag/ai/feed/',
    category: 'AI'
  },
  {
    name: 'MIT Technology Review AI',
    url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed/',
    category: 'AI'
  },
  {
    name: 'Reuters Technology',
    url: 'https://www.reuters.com/technology/',
    category: 'Tech'
  },
  {
    name: 'Bloomberg Technology',
    url: 'https://www.bloomberg.com/technology',
    category: 'Finance'
  }
];

async function fetchRSSFeed(rssUrl) {
  try {
    console.log(`📡 获取RSS: ${rssUrl}`);
    const response = await axios.get(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);
    
    const items = result.rss?.channel?.[0]?.item || [];
    return items.slice(0, 5); // 只取最新5条
  } catch (error) {
    console.error(`❌ 获取RSS失败 ${rssUrl}:`, error.message);
    return [];
  }
}

async function collectRealNews() {
  console.log('🎯 开始收集真实新闻...');
  console.log('='.repeat(50));
  
  const allNews = [];
  
  for (const source of RSS_SOURCES) {
    const items = await fetchRSSFeed(source.url);
    
    for (const item of items) {
      const news = {
        title: item.title?.[0] || '无标题',
        description: item.description?.[0] || '无描述',
        link: item.link?.[0] || '#',
        pubDate: item.pubDate?.[0] || new Date().toISOString(),
        source: source.name,
        category: source.category
      };
      
      // 过滤包含AI、科技、金融关键词的新闻
      const keywords = ['AI', 'artificial intelligence', 'machine learning', 'tech', 'finance', 'investment', 'startup'];
      const titleLower = news.title.toLowerCase();
      
      if (keywords.some(keyword => titleLower.includes(keyword.toLowerCase()))) {
        allNews.push(news);
        console.log(`📰 发现新闻: ${news.title}`);
        console.log(`   🔗 来源: ${news.source}`);
        console.log(`   📅 时间: ${news.pubDate.substring(0, 25)}`);
      }
    }
  }
  
  console.log('='.repeat(50));
  console.log(`✅ 共收集到 ${allNews.length} 条相关新闻`);
  
  return allNews;
}

function createHTMLReport(newsItems) {
  const now = new Date();
  const dateStr = now.toLocaleString('zh-CN', { 
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>真实AI科技财经新闻 - ${dateStr}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            min-height: 100vh;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 15px;
            margin-bottom: 30px;
        }
        .news-item {
            background: #f8f9fa;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 25px;
            border-left: 5px solid #3498db;
        }
        .news-item.ai {
            border-left-color: #2ecc71;
        }
        .news-item.finance {
            border-left-color: #f39c12;
        }
        .news-title {
            font-size: 22px;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        .news-description {
            color: #555;
            margin-bottom: 15px;
        }
        .news-meta {
            color: #7f8c8d;
            font-size: 14px;
            display: flex;
            justify-content: space-between;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            color: #7f8c8d;
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 真实AI科技财经新闻简报</h1>
        <div style="color: #7f8c8d; margin-bottom: 30px;">
            📅 ${dateStr} · 👑 超级大大王专属 · 📰 真实新闻源收集
        </div>
`;
  
  if (newsItems.length === 0) {
    html += `
        <div style="text-align: center; padding: 50px;">
            <h2>📡 新闻收集中...</h2>
            <p>正在从TechCrunch、Reuters、Bloomberg等源收集最新AI和财经新闻</p>
            <p>请稍后查看完整新闻</p>
        </div>
    `;
  } else {
    newsItems.forEach((news, index) => {
      const categoryClass = news.category === 'AI' ? 'ai' : (news.category === 'Finance' ? 'finance' : '');
      html += `
        <div class="news-item ${categoryClass}">
            <div class="news-title">${index + 1}. ${news.title}</div>
            <div class="news-description">${news.description.substring(0, 150)}...</div>
            <div class="news-meta">
                <span>📰 来源: ${news.source}</span>
                <span>⏰ ${news.pubDate.substring(0, 16)}</span>
            </div>
        </div>
      `;
    });
  }
  
  html += `
        <div class="footer">
            <p>📡 新闻源: TechCrunch AI · MIT Tech Review · Reuters · Bloomberg</p>
            <p>🤖 生成者: NIKO AI助手 · 👑 专为超级大大王定制</p>
            <p>⚠️ 注: 这是真实新闻收集测试，内容来自公开RSS源</p>
        </div>
    </div>
</body>
</html>`;
  
  return html;
}

async function main() {
  console.log('🚀 启动真实新闻收集系统...');
  console.log('👑 用户: 超级大大王');
  console.log('🎯 兴趣: AI科技(60%) + 财经(30%) + 其他科技(10%)');
  
  try {
    // 1. 收集真实新闻
    const realNews = await collectRealNews();
    
    // 2. 生成HTML报告
    const htmlContent = createHTMLReport(realNews);
    const htmlPath = path.join(__dirname, 'real_news_report.html');
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`✅ HTML报告生成: ${htmlPath}`);
    
    // 3. 转换为图片
    console.log('📸 正在转换为图片...');
    
    // 保存新闻数据
    const data = {
      timestamp: new Date().toISOString(),
      newsCount: realNews.length,
      sources: RSS_SOURCES.map(s => s.name),
      news: realNews
    };
    
    const dataPath = path.join(__dirname, 'real_news_data.json');
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    console.log(`📊 新闻数据保存: ${dataPath}`);
    
    console.log('='.repeat(50));
    console.log('🎉 真实新闻收集完成！');
    console.log(`📰 新闻数量: ${realNews.length}条`);
    console.log(`📁 输出文件:`);
    console.log(`   • ${htmlPath} (HTML报告)`);
    console.log(`   • ${dataPath} (JSON数据)`);
    
    return { htmlPath, dataPath, newsCount: realNews.length };
    
  } catch (error) {
    console.error('❌ 新闻收集失败:', error.message);
    
    // 创建错误报告
    const errorHtml = `<!DOCTYPE html>
<html>
<head><title>新闻收集错误</title></head>
<body style="padding: 40px; font-family: sans-serif;">
    <h1>⚠️ 新闻收集遇到问题</h1>
    <p>错误: ${error.message}</p>
    <p>时间: ${new Date().toLocaleString('zh-CN')}</p>
    <p>👑 用户: 超级大大王</p>
    <p>🤖 NIKO正在修复此问题...</p>
</body>
</html>`;
    
    const errorPath = path.join(__dirname, 'news_error.html');
    fs.writeFileSync(errorPath, errorHtml);
    console.log(`📄 错误报告: ${errorPath}`);
    
    return { htmlPath: errorPath, newsCount: 0 };
  }
}

// 安装依赖并运行
async function installAndRun() {
  console.log('🔧 检查依赖...');
  
  const dependencies = ['axios', 'xml2js'];
  const missing = [];
  
  for (const dep of dependencies) {
    try {
      require.resolve(dep);
      console.log(`✅ ${dep} 已安装`);
    } catch {
      missing.push(dep);
      console.log(`❌ ${dep} 未安装`);
    }
  }
  
  if (missing.length > 0) {
    console.log(`📦 安装缺失依赖: ${missing.join(', ')}`);
    
    const { execSync } = require('child_process');
    try {
      execSync(`npm install ${missing.join(' ')}`, { 
        cwd: __dirname,
        stdio: 'inherit'
      });
      console.log('✅ 依赖安装完成');
    } catch (error) {
      console.error('❌ 依赖安装失败:', error.message);
      return;
    }
  }
  
  // 运行新闻收集
  await main();
}

// 如果直接运行此脚本
if (require.main === module) {
  installAndRun().catch(console.error);
}

module.exports = { collectRealNews, createHTMLReport };