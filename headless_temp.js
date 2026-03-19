
const puppeteer = require('puppeteer-core');

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  
  const fs = require('fs');
  const html = fs.readFileSync('/root/.openclaw/workspace/news_report.html', 'utf8');
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.waitForTimeout(2000);
  
  await page.screenshot({
    path: '/root/.openclaw/workspace/news_screenshot_final.jpg',
    type: 'jpeg',
    quality: 85
  });
  
  await browser.close();
  console.log('✅ Headless 截图完成');
}

main().catch(console.error);
