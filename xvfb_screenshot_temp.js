
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🚀 在 Xvfb 环境中启动浏览器...');
  
  try {
    // 查找浏览器
    const browserPaths = [
      '/usr/bin/firefox',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium'
    ];
    
    let browserPath = null;
    for (const p of browserPaths) {
      if (fs.existsSync(p)) {
        browserPath = p;
        console.log(`✅ 使用浏览器: ${p}`);
        break;
      }
    }
    
    if (!browserPath) {
      throw new Error('未找到可用的浏览器');
    }
    
    // 启动浏览器（headless 模式）
    const browser = await puppeteer.launch({
      executablePath: browserPath,
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1200,800'
      ]
    });
    
    const page = await browser.newPage();
    
    // 设置视口
    await page.setViewport({ width: 1200, height: 800 });
    
    // 读取 HTML 文件
    const htmlContent = fs.readFileSync('/root/.openclaw/workspace/news_report.html', 'utf8');
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // 等待内容渲染
    await page.waitForTimeout(3000);
    
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
    
    console.log(`📏 页面高度: ${fullHeight}px`);
    
    // 重新设置视口高度（限制最大高度）
    const viewportHeight = Math.min(fullHeight, 8000);
    await page.setViewport({ width: 1200, height: viewportHeight });
    
    // 截图
    console.log('📸 开始截图...');
    await page.screenshot({
      path: '/root/.openclaw/workspace/news_screenshot_final.jpg',
      type: 'jpeg',
      quality: 90,
      fullPage: true
    });
    
    await browser.close();
    
    console.log(`✅ 截图成功保存到: /root/.openclaw/workspace/news_screenshot_final.jpg`);
    console.log(`📊 图片尺寸: 1200x${viewportHeight}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ 截图失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
