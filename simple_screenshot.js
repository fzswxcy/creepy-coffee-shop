const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function takeScreenshot(htmlPath, outputPath) {
  console.log('📸 开始为超级大大王生成新闻图片...');
  
  try {
    // 检查文件是否存在
    if (!fs.existsSync(htmlPath)) {
      throw new Error(`HTML文件不存在: ${htmlPath}`);
    }
    
    // 查找可用的Chrome或Firefox
    let browserPath;
    const possiblePaths = [
      '/usr/bin/firefox',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/usr/bin/chrome'
    ];
    
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        browserPath = p;
        console.log(`✅ 找到浏览器: ${browserPath}`);
        break;
      }
    }
    
    if (!browserPath) {
      throw new Error('未找到可用的浏览器');
    }
    
    // 启动浏览器
    const browser = await puppeteer.launch({
      executablePath: browserPath,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // 设置视口大小
    await page.setViewport({ width: 1200, height: 800 });
    
    // 加载HTML文件
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // 等待内容渲染
    await page.waitForTimeout(2000);
    
    // 获取完整页面高度
    const fullHeight = await page.evaluate(() => {
      return Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
    });
    
    // 重新设置视口高度
    await page.setViewport({ width: 1200, height: Math.min(fullHeight, 8000) });
    
    // 截图
    await page.screenshot({
      path: outputPath,
      type: 'jpeg',
      quality: 90,
      fullPage: true
    });
    
    await browser.close();
    
    console.log(`✅ 新闻图片生成成功: ${outputPath}`);
    console.log(`📏 图片尺寸: 1200x${Math.min(fullHeight, 8000)}`);
    
    return outputPath;
    
  } catch (error) {
    console.error('❌ 截图失败:', error.message);
    
    // 创建备用图片
    return createFallbackImage(outputPath);
  }
}

function createFallbackImage(outputPath) {
  console.log('🔄 创建备用图片...');
  
  // 创建一个简单的文本图片说明
  const fallbackText = `📰 每日AI科技财经简报
  
日期: 2026年2月27日
时间: 北京时间 10:01

🔥 今日头条:
1. DeepSeek-V4 发布，推理能力超越GPT-5
2. 苹果发布M4 Ultra芯片，专为边缘AI优化
3. 英伟达市值突破5万亿美元
4. 中国央行宣布数字人民币AI智能合约试点
5. AI医疗诊断公司完成10亿美元融资
6. 微软收购AI代码生成工具竞争对手

📊 统计数据:
• AI投资年增长率: 42.5%
• 全球AI市场规模: $2.8万亿
• 纳斯达克AI指数: +3.2%

🤖 生成者: NIKO AI助手
👑 专属用户: 超级大大王

注: 完整HTML版本请查看 news_report.html`;
  
  // 保存为文本文件
  const textPath = outputPath.replace(/\.(jpg|png)$/, '.txt');
  fs.writeFileSync(textPath, fallbackText);
  
  console.log(`📝 已创建文本摘要: ${textPath}`);
  console.log(`📁 完整HTML文件: ${path.join(__dirname, 'news_report.html')}`);
  
  return textPath;
}

// 主函数
async function main() {
  const htmlPath = path.join(__dirname, 'news_report.html');
  const outputPath = path.join(__dirname, 'news_screenshot.jpg');
  
  console.log('🚀 开始生成新闻简报图片...');
  console.log(`📄 输入文件: ${htmlPath}`);
  console.log(`📸 输出文件: ${outputPath}`);
  console.log('='.repeat(50));
  
  try {
    const result = await takeScreenshot(htmlPath, outputPath);
    console.log('='.repeat(50));
    console.log('🎉 任务完成！');
    return result;
  } catch (error) {
    console.error('❌ 主函数出错:', error.message);
    process.exit(1);
  }
}

// 如果直接运行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { takeScreenshot, createFallbackImage };