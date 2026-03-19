const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function captureScreenshot() {
    let browser = null;
    try {
        console.log('启动浏览器...');
        
        // 尝试使用可用浏览器
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            executablePath: process.env.CHROMIUM_PATH || null
        });
        
        console.log('浏览器启动成功');
        
        const page = await browser.newPage();
        await page.setViewport({
            width: 500,
            height: 800,
            deviceScaleFactor: 2
        });
        
        // 加载本地HTML文件
        const htmlPath = path.join(__dirname, 'global_news_20260227.html');
        const fileUrl = `file://${htmlPath}`;
        
        console.log('加载HTML文件:', fileUrl);
        await page.goto(fileUrl, { waitUntil: 'networkidle0' });
        
        // 等待页面完全渲染
        await page.waitForTimeout(2000);
        
        // 获取页面总高度
        const bodyHeight = await page.evaluate(() => {
            return document.documentElement.scrollHeight;
        });
        
        console.log('页面高度:', bodyHeight);
        
        // 设置截图高度
        await page.setViewport({
            width: 500,
            height: bodyHeight,
            deviceScaleFactor: 2
        });
        
        // 截图
        const screenshotPath = path.join(__dirname, 'global_news_20260227.png');
        await page.screenshot({
            path: screenshotPath,
            fullPage: true,
            type: 'png'
        });
        
        console.log('截图保存成功:', screenshotPath);
        
        // 验证文件是否存在
        if (fs.existsSync(screenshotPath)) {
            const stats = fs.statSync(screenshotPath);
            console.log('文件大小:', stats.size, '字节');
            return screenshotPath;
        } else {
            throw new Error('截图文件未创建成功');
        }
        
    } catch (error) {
        console.error('截图失败:', error.message);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
            console.log('浏览器已关闭');
        }
    }
}

// 执行截图
captureScreenshot().then(path => {
    console.log('截图完成:', path);
    process.exit(0);
}).catch(error => {
    console.error('执行失败:', error);
    process.exit(1);
});